import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { prompt, beatId } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // In a real app, you'd call OpenAI DALL-E or Stable Diffusion here.
    // For this demo, we use pollinations.ai which is a free redirect to Stable Diffusion.
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;

    // Fetch the generated image
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("Image generation failed");
    
    const imageBlob = await imageRes.blob();
    const buffer = Buffer.from(await imageBlob.arrayBuffer());

    // Upload to Supabase Storage
    const fileName = `artwork/${user.id}/${Date.now()}.jpg`;
    const { data, error: uploadError } = await supabase.storage
      .from('beats')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('beats')
      .getPublicUrl(fileName);

    return NextResponse.json({ imageUrl: publicUrl });

  } catch (err) {
    console.error("[Artwork Generation] Error:", err);
    return NextResponse.json({ error: "Failed to generate artwork" }, { status: 500 });
  }
}
