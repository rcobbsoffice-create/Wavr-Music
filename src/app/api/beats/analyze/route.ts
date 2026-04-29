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

    // 1. Build the title from the ORIGINAL filename (not the cloud storage name)
    let suggestedTitle = "";
    if (originalFileName) {
      suggestedTitle = originalFileName
        .replace(/\.[^/.]+$/, "")   // remove extension
        .replace(/[_-]/g, " ")       // underscores/dashes → spaces
        .replace(/\s+/g, " ")
        .trim();
      // Capitalize each word
      suggestedTitle = suggestedTitle
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    // Fallback: build a "Type Beat" title from genre/mood
    if (!suggestedTitle) {
      const typeMapping: Record<string, string[]> = {
        "Hip Hop": ["Drake", "Travis Scott", "J. Cole"],
        "Trap":    ["Metro Boomin", "Future", "Gunna"],
        "R&B":     ["SZA", "Brent Faiyaz", "Summer Walker"],
        "Pop":     ["Dua Lipa", "The Weeknd", "Doja Cat"],
        "Dancehall":["Wizkid", "Burna Boy", "Popcaan"],
        "Rock":    ["Machine Gun Kelly", "Post Malone"],
      };
      const artists = typeMapping[genre] || ["Future"];
      const suggestedArtist = artists[Math.floor(Math.random() * artists.length)];
      suggestedTitle = `${suggestedArtist} x ${mood} Type Beat`;
    }

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
