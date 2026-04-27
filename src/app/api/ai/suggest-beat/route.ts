import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

const genreMetadata: Record<string, { bpms: number[], keys: string[], titles: string[], prompts: string[] }> = {
  "Trap": {
    bpms: [140, 145, 150, 155, 160],
    keys: ["C Minor", "F Minor", "G Minor", "D# Minor"],
    titles: ["Dark Knight", "Hustle Hard", "Ghost Town", "Neon Streets", "Codeine Dreams"],
    prompts: ["dark purple neon city aesthetic trap music", "expensive jewelry and luxury cars dark moody", "abstract smoke and neon lights trap vibe"]
  },
  "Hip-Hop": {
    bpms: [85, 90, 95, 100],
    keys: ["A Minor", "E Minor", "B Minor"],
    titles: ["Urban Jungle", "Street Soul", "Golden Era", "Skyline Views", "Late Night Drive"],
    prompts: ["vintage city streets hip hop aesthetic", "retro vinyl records and boombox", "graffiti wall sunset urban vibes"]
  },
  "Lo-Fi": {
    bpms: [70, 75, 80, 85],
    keys: ["C Maj7", "F Maj7", "G Major"],
    titles: ["Rainy Sunday", "Midnight Study", "Coffee Shop", "Autumn Leaves", "Dreamy Mornings"],
    prompts: ["cozy bedroom rainy window lofi aesthetic", "anime style girl studying at desk", "chill coffee shop vibes warm lighting"]
  },
  "Afrobeats": {
    bpms: [100, 105, 110, 115],
    keys: ["G Major", "C Major", "D Major"],
    titles: ["Sunset Dance", "Lagos Nights", "Island Vibes", "Safari Soul", "Summer Heat"],
    prompts: ["vibrant african sunset dance floor", "tropical island palm trees afrobeats style", "colorful abstract patterns energetic vibe"]
  }
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { genre, mood } = await req.json();
    const data = genreMetadata[genre] || genreMetadata["Trap"];

    const randomTitle = data.titles[Math.floor(Math.random() * data.titles.length)];
    const randomBpm = data.bpms[Math.floor(Math.random() * data.bpms.length)];
    const randomKey = data.keys[Math.floor(Math.random() * data.keys.length)];
    const randomPrompt = data.prompts[Math.floor(Math.random() * data.prompts.length)];

    // Using a reliable high-quality image generator (Unsplash Source replacement)
    const artworkUrl = `https://pollinations.ai/p/${encodeURIComponent(randomPrompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 10000)}&nologo=true`;

    return NextResponse.json({
      title: randomTitle,
      bpm: randomBpm,
      key: randomKey,
      artwork: artworkUrl
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
