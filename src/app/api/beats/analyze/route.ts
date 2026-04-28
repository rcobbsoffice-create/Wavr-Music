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
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data with 'audio' field" }, { status: 400 });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;
  if (!audioFile) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  // Check file size (max 500 MB)
  if (audioFile.size > 500 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 500 MB)" }, { status: 400 });
  }

  try {
    // Forward the file and metadata to the Python stems server
    const fd = new FormData();
    fd.append("audio", audioFile, audioFile.name);
    
    // Extract genre/mood from original request if provided
    const genre = formData.get("genre") as string | null;
    const mood = formData.get("mood") as string | null;
    if (genre) fd.append("genre", genre);
    if (mood) fd.append("mood", mood);

    const res = await fetch(`${STEMS_URL}/analyze`, {
      method: "POST",
      headers: {
        ...(process.env.HF_TOKEN ? { "Authorization": `Bearer ${process.env.HF_TOKEN}` } : {})
      },
      body: fd,
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
