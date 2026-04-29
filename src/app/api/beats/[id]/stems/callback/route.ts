import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await req.json();
    const { originalWavUrl, stems } = body;
    
    // 1. Update the main Beat with the high-quality WAV URL
    if (originalWavUrl) {
      await prisma.beat.update({
        where: { id },
        data: { audioFile: originalWavUrl }
      });
      console.log(`[Stems Callback] Updated Beat ${id} with WAV URL: ${originalWavUrl}`);
    }

    // 2. Update Stem URLs
    const results = [];
    if (stems && typeof stems === 'object') {
      for (const [type, url] of Object.entries(stems)) {
        if (url) {
          await prisma.beatStem.update({
            where: { beatId_type: { beatId: id, type } },
            data: { 
              filePath: url as string,
              status: "ready"
            }
          });
          results.push({ type, status: "ready" });
        }
      }
    }
    
    return NextResponse.json({ ok: true, results });
    
  } catch (err) {
    console.error("[Stems Callback] Error processing JSON URLs:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
