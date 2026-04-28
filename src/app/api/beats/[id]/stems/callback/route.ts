import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const formData = await req.formData();
    const stemTypes = ["drums", "bass", "melody", "other"];
    
    const results = [];
    
    for (const type of stemTypes) {
      const file = formData.get(type) as File | null;
      if (file) {
        // 1. Upload to Supabase Storage
        const fileName = `${id}_${type}.wav`;
        const filePath = `stems/${id}/${fileName}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('beats')
          .upload(filePath, file, { upsert: true });
          
        if (uploadError) {
          console.error(`[Stems Callback] Upload error for ${type}:`, uploadError);
          continue;
        }
        
        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('beats')
          .getPublicUrl(filePath);
          
        // 3. Update Database
        await prisma.beatStem.update({
          where: { beatId_type: { beatId: id, type } },
          data: { 
            filePath: publicUrl,
            status: "ready"
          }
        });
        
        results.push({ type, status: "ready" });
      }
    }
    
    return NextResponse.json({ ok: true, results });
    
  } catch (err) {
    console.error("[Stems Callback] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
