import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

const STEMS_URL = process.env.STEMS_WORKER_URL ?? "http://localhost:7860";

// Increase timeout for large audio analysis
export const maxDuration = 60; 

/**
 * POST /api/beats/analyze
 * Accepts JSON { audioUrl, originalFileName } or multipart with "audio" field.
 * Returns { bpm, key, suggestedTitle, suggestedArtworkPrompt }
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let audioUrl = "";
  let file: File | null = null;
  let originalFileName = "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    audioUrl = body.audioUrl;
    // Use the original browser filename if provided
    originalFileName = body.originalFileName ?? "";
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    if (audioFile) {
      file = audioFile;
      originalFileName = audioFile.name;
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
    originalFileName = formData.get("originalFileName") as string ?? "";
  }

  if (!audioUrl) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  try {
    const res = await fetch(`${STEMS_URL}/analyze?url=${encodeURIComponent(audioUrl)}`, {
      method: "POST",
      headers: {
        ...(process.env.HF_TOKEN ? { "Authorization": `Bearer ${process.env.HF_TOKEN}` } : {})
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Analysis failed");

    const mood = data.mood || "Energetic";
    const genre = data.genre || "Hip Hop";

    // 1. Generate a unique, trend-setting YouTube-style title based on energy/mood and genre
    const producerName = user.name || "Producer";
    const uniqueNames = [
      "VENOM", "GHOST", "LUNAR", "OASIS", "ECLIPSE", "MIRAGE", "APEX", "COSMIC",
      "NEON", "SHADOW", "PULSE", "ZENITH", "FROST", "BLAZE", "NOVA", "DRIFT",
      "TITAN", "ONYX", "EMBER", "FLARE", "VORTEX", "NEXUS", "CHRONOS", "ECHO",
      "SAKURA", "MIDNIGHT", "SAHARA", "PHANTOM", "AURORA", "CYBER", "VELVET"
    ];
    const randomName = uniqueNames[Math.floor(Math.random() * uniqueNames.length)];
    const suggestedTitle = `${producerName} - "${randomName}" | ${mood} ${genre} Type Beat`;

    // 2. Build a unique artwork prompt (include timestamp so images never repeat)
    const uniqueSeed = Date.now();
    const suggestedArtworkPrompt = 
      `Professional album cover art for a ${mood} ${genre} beat, abstract cinematic, high quality — seed${uniqueSeed}`;

    return NextResponse.json({
      bpm: data.bpm,
      key: data.key,
      suggestedTitle,
      suggestedArtworkPrompt
    });

  } catch (err) {
    console.error("[POST /api/beats/analyze]", err);
    return NextResponse.json(
      { error: "Could not reach analysis server. Make sure stems_server.py is running." },
      { status: 503 }
    );
  }
}
