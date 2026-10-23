import { NextRequest, NextResponse } from "next/server";
import { presignDownload, urlToKey } from "@/lib/storage";

const HF_REPO = (process.env.HF_REPO || "").trim();

/** Only the app's own Hugging Face dataset may be proxied with the HF token. */
function isOwnHuggingFaceFile(raw: string): boolean {
  if (!HF_REPO) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname === "huggingface.co" && u.pathname.startsWith(`/datasets/${HF_REPO}/resolve/`);
  } catch {
    return false;
  }
}

// GET /api/audio?url=...&filename=...
// - Files in WAVR storage: redirect to a signed URL (named download if filename given).
// - Legacy links to the app's own HF dataset: proxied with the token (only until migrated).
// - Anything else is refused, so this can't be used to fetch arbitrary URLs or leak the token.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing URL", { status: 400 });
  const downloadFilename = req.nextUrl.searchParams.get("filename") ?? undefined;

  const key = urlToKey(url);
  if (key) {
    try {
      const signed = await presignDownload(key, { downloadName: downloadFilename });
      return NextResponse.redirect(signed, { status: 302 });
    } catch (err) {
      console.error("[Proxy Audio] storage error", err);
      return new NextResponse("Storage unavailable", { status: 503 });
    }
  }

  if (!isOwnHuggingFaceFile(url)) {
    return new NextResponse("URL not allowed", { status: 400 });
  }

  try {
    const headers: Record<string, string> = {};
    if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
    const range = req.headers.get("range");
    if (range) headers["Range"] = range;

    const response = await fetch(url, { headers });
    if (!response.ok && response.status !== 206) {
      return new NextResponse("Failed to fetch audio", { status: response.status });
    }

    const out: Record<string, string> = {
      "Content-Type": response.headers.get("Content-Type") || "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    };
    const len = response.headers.get("Content-Length");
    if (len) out["Content-Length"] = len;
    const cr = response.headers.get("Content-Range");
    if (cr) out["Content-Range"] = cr;
    if (downloadFilename) out["Content-Disposition"] = `attachment; filename="${downloadFilename.replace(/["\r\n]/g, "")}"`;

    return new NextResponse(response.body, { status: response.status, headers: out });
  } catch (error) {
    console.error("[Proxy Audio Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
