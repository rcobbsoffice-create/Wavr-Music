import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";
import { putObject } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { prompt, beatId } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Strip the internal seed hint we embed for uniqueness
    const cleanPrompt = prompt.replace(/\s*—\s*seed\d+$/, "").trim();

    // Use a high-entropy seed so every generation is unique
    const seed = Date.now() + Math.floor(Math.random() * 1_000_000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;

    // Fetch the generated image
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("Image generation failed");
    
    const imageBlob = await imageRes.blob();
    const buffer = Buffer.from(await imageBlob.arrayBuffer());

    // Save to storage
    const key = `artwork/${user.id}/${Date.now()}.jpg`;
    const imageUrlStored = await putObject(key, buffer, "image/jpeg");

    return NextResponse.json({ imageUrl: imageUrlStored });

  } catch (err) {
    console.error("[Artwork Generation] Error:", err);
    return NextResponse.json({ error: "Failed to generate artwork" }, { status: 500 });
  }
}
