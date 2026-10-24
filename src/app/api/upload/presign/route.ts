import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";
import { UPLOAD_FOLDERS, keyToUrl, mimeFor, newKey, presignUpload } from "@/lib/storage";

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

// POST /api/upload/presign { filename, folder, size } -> { uploadUrl, url, contentType }
// The browser PUTs the file straight to storage with uploadUrl, then saves `url`.
// Replaces the old browser-side Hugging Face upload, which needed a write token in the browser.
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename, folder, size } = await req.json().catch(() => ({}));
  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename required" }, { status: 400 });
  }
  if (!UPLOAD_FOLDERS.has(String(folder))) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }
  if (typeof size === "number" && size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 500 MB" }, { status: 413 });
  }

  try {
    const key = newKey(String(folder), filename);
    const contentType = mimeFor(filename);
    const uploadUrl = await presignUpload(key, contentType);
    return NextResponse.json({ uploadUrl, url: keyToUrl(key), contentType });
  } catch (err) {
    console.error("[POST /api/upload/presign]", err);
    return NextResponse.json({ error: "Storage is not configured" }, { status: 500 });
  }
}
