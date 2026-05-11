import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    const headers: Record<string, string> = {};
    
    // If it's a Hugging Face URL, attach the token
    if (url.includes("huggingface.co") && process.env.HF_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return new NextResponse("Failed to fetch audio", { status: response.status });
    }

    const downloadFilename = req.nextUrl.searchParams.get("filename");
    const disposition = downloadFilename
      ? `attachment; filename="${downloadFilename.replace(/"/g, "")}"`
      : undefined;

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "audio/wav",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": response.headers.get("Content-Length") || "",
        "Accept-Ranges": "bytes",
        "Content-Range": response.headers.get("Content-Range") || "",
        ...(disposition ? { "Content-Disposition": disposition } : {}),
      },
    });
  } catch (error) {
    console.error("[Proxy Audio Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
