import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const beatCount = await prisma.beat.count();
    const activeBeats = await prisma.beat.count({ where: { status: "active" } });
    
    return NextResponse.json({
      status: "connected",
      stats: {
        users: userCount,
        totalBeats: beatCount,
        activeBeats: activeBeats
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
