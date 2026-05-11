import { createClient } from '@supabase/supabase-js';
import { uploadFile as hfUploadFile } from '@huggingface/hub';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ozvcectjbdadvznxspsm.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_BUCKET = "wavr-uploads";

const HF_REPO = (process.env.HF_REPO || "ipdevgroup/wavr-music-storage").trim();
const HF_TOKEN = (process.env.HF_TOKEN || "").trim();

// Audio extensions that get routed to HuggingFace (large files)
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.zip']);

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.zip': 'application/zip',
  };
  return types[ext] || 'application/octet-stream';
}

async function uploadToHuggingFace(
  fileBuffer: Buffer,
  originalFilename: string,
  subfolder: string
): Promise<string> {
  const ext = path.extname(originalFilename) || '.bin';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const storagePath = `${subfolder}/${filename}`;

  await hfUploadFile({
    repo: { type: "dataset", name: HF_REPO },
    credentials: { accessToken: HF_TOKEN },
    file: {
      path: storagePath,
      content: new Blob([new Uint8Array(fileBuffer)], { type: getMimeType(originalFilename) }),
    },
    commitTitle: `Upload ${subfolder} file`,
  });

  // Return the resolve URL (proxied through /api/audio for auth if needed)
  return `https://huggingface.co/datasets/${HF_REPO}/resolve/main/${storagePath}`;
}

async function uploadToSupabase(
  fileBuffer: Buffer,
  originalFilename: string,
  subfolder: string
): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const ext = path.extname(originalFilename) || '.bin';
  const storagePath = `${subfolder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: getMimeType(originalFilename),
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  subfolder: string
): Promise<string> {
  const ext = path.extname(originalFilename).toLowerCase();
  const isAudio = AUDIO_EXTENSIONS.has(ext);

  if (isAudio && HF_TOKEN) {
    return uploadToHuggingFace(fileBuffer, originalFilename, subfolder);
  }

  return uploadToSupabase(fileBuffer, originalFilename, subfolder);
}
