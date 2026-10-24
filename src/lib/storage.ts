import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";

/**
 * File storage for WAVR, on any S3-compatible service:
 *   - Garage running on your own VPS, or
 *   - Cloudflare R2 / Backblaze B2 / AWS S3.
 *
 * The bucket stays PRIVATE. Files are referenced in the database as
 * app-relative URLs like "/api/files/audio/123-abc.wav"; that route redirects
 * to a short-lived signed URL, so nothing in the bucket is publicly listable
 * and no storage credentials ever reach the browser.
 *
 * Env:
 *   S3_ENDPOINT          e.g. https://s3.ipserver.app  or  https://<acct>.r2.cloudflarestorage.com
 *   S3_REGION            "garage" for Garage, "auto" for R2
 *   S3_BUCKET            e.g. wavr
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_FORCE_PATH_STYLE  "true" for Garage (default true)
 */

export const FILE_ROUTE_PREFIX = "/api/files/";

let client: S3Client | null = null;

function env(name: string): string {
  const v = (process.env[name] ?? "").trim();
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export function getBucket(): string {
  return env("S3_BUCKET");
}

export function getS3(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: env("S3_ENDPOINT"),
    region: (process.env.S3_REGION ?? "us-east-1").trim(),
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true").trim() !== "false",
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY_ID"),
      secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".zip": "application/zip",
};

export function mimeFor(filename: string): string {
  return MIME[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
}

/** Folders the app writes to. Anything else is rejected for browser uploads. */
export const UPLOAD_FOLDERS = new Set([
  "audio", "beats", "temp-analyze", "artwork", "avatars", "covers", "tags",
  "merch", "demos", "kits", "stems", "uploads",
]);

function safeFolder(folder: string): string {
  const clean = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  return clean || "uploads";
}

/** Build a fresh, unguessable object key inside a folder. */
export function newKey(folder: string, originalFilename: string): string {
  const ext = (path.extname(originalFilename) || ".bin").toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${safeFolder(folder)}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

export function keyToUrl(key: string): string {
  return FILE_ROUTE_PREFIX + key.split("/").map(encodeURIComponent).join("/");
}

/** "/api/files/audio/x.wav" -> "audio/x.wav" (or null if not one of ours). */
export function urlToKey(url: string | null | undefined): string | null {
  if (!url) return null;
  let p = url;
  try {
    if (/^https?:\/\//i.test(url)) p = new URL(url).pathname;
  } catch {
    return null;
  }
  if (!p.startsWith(FILE_ROUTE_PREFIX)) return null;
  const key = p.slice(FILE_ROUTE_PREFIX.length).split("/").map(decodeURIComponent).join("/");
  if (!key || key.includes("..")) return null;
  return key;
}

/** Upload bytes from the server and return the app URL stored in the database. */
export async function putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  await getS3().send(new PutObjectCommand({ Bucket: getBucket(), Key: key, Body: body, ContentType: contentType }));
  return keyToUrl(key);
}

/** Signed URL the browser can PUT a file to directly (keeps big WAVs off the app server). */
export async function presignUpload(key: string, contentType: string, expiresIn = 900): Promise<string> {
  return getSignedUrl(
    getS3(),
    new PutObjectCommand({ Bucket: getBucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** Signed URL to read a file, optionally as a named download. */
export async function presignDownload(key: string, opts: { downloadName?: string; expiresIn?: number } = {}): Promise<string> {
  return getSignedUrl(
    getS3(),
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ...(opts.downloadName
        ? { ResponseContentDisposition: `attachment; filename="${opts.downloadName.replace(/["\r\n]/g, "")}"` }
        : {}),
    }),
    { expiresIn: opts.expiresIn ?? 3600 },
  );
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Turn a stored file URL into one an outside service (the stems worker) can
 * download without our cookies: our files become signed URLs, others pass through.
 */
export async function toFetchableUrl(url: string): Promise<string> {
  const key = urlToKey(url);
  if (key) return presignDownload(key, { expiresIn: 3 * 3600 });
  if (url.startsWith("/")) {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
    return `${base}${url}`;
  }
  return url;
}
