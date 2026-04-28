import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

const STEMS_URL = process.env.STEMS_WORKER_URL ?? "http://localhost:7860";

// Increase timeout for large audio analysis
export const maxDuration = 60; 

/**
 * POST /api/beats/analyze
 * Accepts multipart/form-data with field "audio".
 * Proxies to the stems server /analyze endpoint.
 * Returns { bpm: number, key: string }
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let audioUrl = "";
  let fileName = "audio.mp3";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    audioUrl = body.audioUrl;
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    if (audioFile) {
      // Forward the file (limited by Vercel to 4.5MB)
      const fd = new FormData();
      fd.append("audio", audioFile, audioFile.name);
      
      const res = await fetch(`${STEMS_URL}/analyze`, {
        method: "POST",
        headers: {
          ...(process.env.HF_TOKEN ? { "Authorization": `Bearer ${process.env.HF_TOKEN}` } : {})
        },
        body: fd,
      });
      return NextResponse.json(await res.json());
    }
    audioUrl = formData.get("audioUrl") as string;
  }

  if (!audioUrl) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  try {
    // Forward the URL to the Python stems server
    const res = await fetch(`${STEMS_URL}/analyze?url=${encodeURIComponent(audioUrl)}`, {
      method: "POST",
      headers: {
        ...(process.env.HF_TOKEN ? { "Authorization": `Bearer ${process.env.HF_TOKEN}` } : {})
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? "Analysis failed" }, { status: 500 });
    }

    return NextResponse.json(data); // { bpm, key, suggestedTitle }

  } catch (err) {
    console.error("[POST /api/beats/analyze]", err);
    return NextResponse.json(
      { error: "Could not reach analysis server. Make sure stems_server.py is running." },
      { status: 503 }
    );
  }
}
