import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

const moodMap: Record<string, string[]> = {
  Dark:       ["haunting", "cinematic", "brooding", "intense"],
  Chill:      ["smooth", "laid-back", "atmospheric", "soulful"],
  Aggressive: ["hard-hitting", "energetic", "raw", "powerful"],
  Energetic:  ["electric", "vibrant", "punchy", "dynamic"],
  Melodic:    ["lush", "emotional", "harmonic", "dreamy"],
  Trap:       ["ominous", "trap-influenced", "808-heavy", "hypnotic"],
  Romantic:   ["sensual", "silky", "warm", "intimate"],
  Hype:       ["anthemic", "explosive", "stadium-ready", "hard"],
};

const genreMap: Record<string, string> = {
  Trap:      "trap",
  "Hip-Hop": "hip-hop",
  Drill:     "drill",
  "R&B":     "R&B",
  Afrobeats: "Afrobeats",
  Pop:       "pop",
  Reggaeton: "reggaeton",
  "Lo-Fi":   "lo-fi",
};

const licenseInfo: Record<string, string> = {
  basic:     "MP3 lease for non-commercial projects, YouTube monetization, up to 10K streams",
  premium:   "WAV + MP3 lease for commercial use, up to 500K streams, radio performance",
  exclusive: "Full ownership transfer — all stems, unlimited distribution, exclusive rights",
};

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, genre, bpm, key, mood, tags, priceBasic, pricePremium, priceExclusive } = await req.json();

  if (!genre || !bpm) {
    return NextResponse.json({ error: "genre and bpm required" }, { status: 400 });
  }

  const adjectives = moodMap[mood] ?? ["versatile", "unique", "crafted"];
  const adj1 = adjectives[0];
  const adj2 = adjectives[1] ?? adjectives[0];
  const genreLabel = genreMap[genre] ?? genre.toLowerCase();
  const tagList = Array.isArray(tags) && tags.length ? tags.join(", ") : null;

  const description = `${adj1.charAt(0).toUpperCase() + adj1.slice(1)}, ${adj2} ${genreLabel} instrumental running at ${bpm} BPM in the key of ${key}. ${
    tagList ? `Crafted with ${tagList} elements that blend seamlessly for a professional sound.` : "Built for artists who demand quality."
  } Perfect for ${mood?.toLowerCase() ?? "versatile"} tracks — this beat delivers the energy and production depth that labels and independent artists look for. \n\nLicensing: Basic (${licenseInfo.basic}). Premium (${licenseInfo.premium}). Exclusive (${licenseInfo.exclusive}).`;

  const suggestions = [
    description,
    `This ${adj2} ${genreLabel} beat hits at ${bpm} BPM (${key}) with a ${mood?.toLowerCase() ?? "hard"} feel that cuts through any mix. Ideal for artists who want a sound that moves crowds and dominates playlists. Available in multiple license tiers — from leasing for your next single to full exclusive ownership.`,
    `${bpm} BPM · ${key} · ${genre}${mood ? ` · ${mood}` : ""}. A ${adj1} production built for the modern era. ${tagList ? `Featuring ${tagList} — ` : ""}every element is engineered for maximum impact on streaming platforms, live performance, and sync placements. Grab the lease or lock in exclusive rights before someone else does.`,
  ];

  return NextResponse.json({ suggestions, description });
}
