#!/usr/bin/env node
/**
 * Copy every file the database points at from Supabase Storage and the
 * Hugging Face dataset into WAVR's S3-compatible storage (R2 / Garage),
 * then rewrite those URLs in the database to "/api/files/<key>".
 *
 * Run it AFTER the database itself has been copied to the new Postgres.
 * Safe to re-run: files already copied are skipped, and rows that were
 * already rewritten no longer match.
 *
 *   DRY_RUN=1 node scripts/migrate-storage.mjs   # report only, change nothing
 *   node scripts/migrate-storage.mjs             # do it
 *
 * Env: DATABASE_URL, S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID,
 *      S3_SECRET_ACCESS_KEY, S3_FORCE_PATH_STYLE, HF_TOKEN (for a private dataset)
 */
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const DRY_RUN = process.env.DRY_RUN === "1";
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 2);

const SUPABASE_RE = /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'<>\\),]+/g;
const HF_RE = /https:\/\/huggingface\.co\/datasets\/[^\s"'<>\\),]+/g;

const MIME = {
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4", flac: "audio/flac",
  aac: "audio/aac", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", zip: "application/zip",
};

function need(name) {
  const v = (process.env[name] ?? "").trim();
  if (!v) { console.error(`Missing env ${name}`); process.exit(1); }
  return v;
}

const bucket = need("S3_BUCKET");
const s3 = new S3Client({
  endpoint: need("S3_ENDPOINT"),
  region: (process.env.S3_REGION ?? "us-east-1").trim(),
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true").trim() !== "false",
  credentials: { accessKeyId: need("S3_ACCESS_KEY_ID"), secretAccessKey: need("S3_SECRET_ACCESS_KEY") },
});
const prisma = new PrismaClient();
const HF_TOKEN = (process.env.HF_TOKEN ?? "").trim();

/** Map an old URL to the object key it will live under in the new bucket. */
function keyFor(url) {
  const u = new URL(url);
  const p = decodeURIComponent(u.pathname);
  let m = p.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (m) {
    const [, sbBucket, rest] = m;
    return sbBucket === "wavr-uploads" ? rest : `sb-${sbBucket}/${rest}`; // avoid clashing with HF "beats/" paths
  }
  m = p.match(/^\/datasets\/[^/]+\/[^/]+\/resolve\/[^/]+\/(.+)$/);
  if (m) return m[1];
  throw new Error(`Unrecognized URL: ${url}`);
}

const toAppUrl = (key) => "/api/files/" + key.split("/").map(encodeURIComponent).join("/");

async function exists(key) {
  try { await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; }
  catch { return false; }
}

async function copyOne(url, key) {
  if (await exists(key)) return "skipped (already copied)";
  const headers = url.includes("huggingface.co") && HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? res.headers.get("content-type") ?? "application/octet-stream";
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return `copied ${(body.length / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  // 1. Every text column in the app's tables
  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type IN ('text', 'character varying')
      AND table_name NOT LIKE '\\_prisma%'`);

  // 2. Collect every old storage URL referenced anywhere
  const found = new Map(); // url -> Set("Table.column")
  for (const { table_name: t, column_name: c } of cols) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "${c}" AS v FROM "${t}" WHERE "${c}" LIKE '%supabase.co/storage/%' OR "${c}" LIKE '%huggingface.co/datasets/%'`);
    for (const { v } of rows) {
      for (const url of [...(v.match(SUPABASE_RE) ?? []), ...(v.match(HF_RE) ?? [])]) {
        if (!found.has(url)) found.set(url, new Set());
        found.get(url).add(`${t}.${c}`);
      }
    }
  }

  console.log(`Found ${found.size} distinct files referenced in the database.`);
  if (DRY_RUN) {
    for (const [url, where] of found) console.log(`  ${keyFor(url)}  <- ${[...where].join(", ")}`);
    console.log("\nDRY_RUN=1: nothing copied or changed.");
    return;
  }

  // 3. Copy files, then rewrite the URL everywhere it appears
  const urls = [...found.keys()];
  const failures = [];
  let done = 0;
  async function worker() {
    while (urls.length) {
      const url = urls.shift();
      const key = keyFor(url);
      try {
        const status = await copyOne(url, key);
        const newUrl = toAppUrl(key);
        for (const loc of found.get(url)) {
          const [t, c] = loc.split(".");
          await prisma.$executeRawUnsafe(
            `UPDATE "${t}" SET "${c}" = replace("${c}", $1, $2) WHERE "${c}" LIKE '%' || $1 || '%'`, url, newUrl);
        }
        console.log(`[${++done}/${found.size}] ${key}: ${status}`);
      } catch (err) {
        failures.push({ url, error: err.message });
        console.error(`[${++done}/${found.size}] FAILED ${url}: ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nDone. ${found.size - failures.length} migrated, ${failures.length} failed.`);
  if (failures.length) {
    console.log("Failed files keep their old URLs. Fix the cause and re-run to retry them.");
    process.exitCode = 1;
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
