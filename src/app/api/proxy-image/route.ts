import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch image");
    
    const blob = await res.blob();
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "image/png");
    
    return new NextResponse(blob, { headers });
  } catch (err) {
    return NextResponse.json({ error: "Failed to proxy image" }, { status: 500 });
  }
}
