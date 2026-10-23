import { NextRequest, NextResponse } from "next/server";
import { presignDownload } from "@/lib/storage";

// GET /api/files/<key> — redirect to a short-lived signed URL for a stored file.
// The browser streams straight from storage, so audio doesn't pass through
// (or use the bandwidth/RAM of) the app server. Range requests work natively.
// Optional ?download=<filename> forces a named download.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");
  if (!key || key.includes("..")) return new NextResponse("Not found", { status: 404 });

  try {
    const dl = req.nextUrl.searchParams.get("download");
    // ?download=1 uses the stored file name; ?download=<name> sets one
    const downloadName = dl ? (dl === "1" ? key.split("/").pop() : dl) : undefined;
    const signed = await presignDownload(key, { downloadName, expiresIn: 3600 });
    return NextResponse.redirect(signed, {
      status: 302,
      // Let the browser reuse the redirect for a while (well inside the signature's 1h life)
      headers: { "Cache-Control": "private, max-age=1800" },
    });
  } catch (err) {
    console.error("[GET /api/files]", err);
    return new NextResponse("Storage unavailable", { status: 503 });
  }
}
