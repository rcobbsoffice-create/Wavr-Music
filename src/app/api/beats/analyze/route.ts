import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

const STEMS_URL = (process.env.STEMS_WORKER_URL ?? "http://localhost:7860").trim();

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
    console.log("[analyze] audioUrl received:", JSON.stringify(audioUrl));
    const stemsEndpoint = `${STEMS_URL}/analyze?url=${encodeURIComponent(audioUrl)}`;
    console.log("[analyze] calling", stemsEndpoint);
    const res = await fetch(stemsEndpoint, {
      method: "POST",
      headers: {
        ...(process.env.HF_TOKEN ? { "Authorization": `Bearer ${process.env.HF_TOKEN}` } : {})
      },
      signal: AbortSignal.timeout(55000),
    });

    const rawText = await res.text();
    console.log("[analyze] stems status:", res.status, "body:", rawText);
    const data = JSON.parse(rawText);
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const bpm: number = data.bpm || 100;
    const key: string = data.key || "C Major";
    const isMinor = key.includes("Minor");

    // Derive mood from actual BPM + key (stems server doesn't return mood/genre)
    let mood: string;
    if (bpm < 80)       mood = isMinor ? "Dark"        : "Chill";
    else if (bpm < 95)  mood = isMinor ? "Melancholic" : "Smooth";
    else if (bpm < 112) mood = isMinor ? "Melodic"     : "Vibrant";
    else if (bpm < 130) mood = isMinor ? "Hard"        : "Energetic";
    else                mood = isMinor ? "Aggressive"  : "Hype";

    // Derive genre from BPM
    let genre: string;
    if (bpm < 80)       genre = "R&B";
    else if (bpm < 95)  genre = "Lo-Fi Hip Hop";
    else if (bpm < 115) genre = "Hip Hop";
    else if (bpm < 140) genre = "Trap";
    else                genre = "Drill";

    // Mood-matched name pools so the word fits the vibe
    const namesByMood: Record<string, string[]> = {
      Dark:        ["PHANTOM", "ECLIPSE", "VOID", "REAPER", "ABYSS", "SPECTER", "BLACKOUT", "HOLLOW"],
      Melancholic: ["SOLACE", "FADED", "DISTANT", "BROKEN", "SILENT", "GREY", "SORROW", "EMBER"],
      Melodic:     ["AURORA", "CRYSTAL", "ECHO", "VELVET", "SIREN", "MIRAGE", "DREAM", "PRISM"],
      Smooth:      ["SILK", "HAZE", "FLOW", "WAVE", "MELLOW", "DRIFT", "CANVAS", "LURE"],
      Chill:       ["BREEZE", "OCEAN", "MIST", "CLOUD", "TENDER", "SOFT", "GLOW", "SERENE"],
      Vibrant:     ["NEON", "SPARK", "PULSE", "NOVA", "SOLAR", "VIVID", "RADIANT", "FLARE"],
      Energetic:   ["APEX", "SURGE", "THUNDER", "BLAZE", "RUSH", "FIERCE", "IGNITE", "FORCE"],
      Hard:        ["TITAN", "STEEL", "VENOM", "BEAST", "MENACE", "SAVAGE", "IRON", "SHADOW"],
      Aggressive:  ["RAGE", "MAYHEM", "STORM", "CHAOS", "WRAITH", "HAZARD", "RIOT", "TERROR"],
      Hype:        ["ANTHEM", "CROWN", "REIGN", "FLEX", "RISE", "DYNASTY", "LEGEND", "PEAK"],
    };

    const namePool = namesByMood[mood] ?? namesByMood["Melodic"];
    const randomName = namePool[Math.floor(Math.random() * namePool.length)];
    const suggestedTitle = `"${randomName}" | ${mood} ${genre} Type Beat`;

    // Build artwork prompt using derived mood/genre
    const uniqueSeed = Date.now();
    const suggestedArtworkPrompt =
      `Professional album cover art for a ${mood} ${genre} beat in ${key}, abstract cinematic, high quality — seed${uniqueSeed}`;

    return NextResponse.json({
      bpm: data.bpm,
      key: data.key,
      suggestedTitle,
      suggestedArtworkPrompt
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/beats/analyze]", msg);
    return NextResponse.json(
      { error: `Analysis failed: ${msg}` },
      { status: 503 }
    );
  }
}
