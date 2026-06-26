"use client";

import { uploadFile as hfUploadFile } from "@huggingface/hub";

const HF_REPO = (process.env.NEXT_PUBLIC_HF_REPO || "ipdevgroup/wavr-music-storage").trim();
const HF_TOKEN = (process.env.NEXT_PUBLIC_HF_TOKEN || "").trim();

export async function uploadAudioToHuggingFace(file: File, subfolder: string): Promise<string> {
  if (!HF_TOKEN) throw new Error("HuggingFace token not configured (NEXT_PUBLIC_HF_TOKEN)");

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${subfolder}/${filename}`;

  await hfUploadFile({
    repo: { type: "dataset", name: HF_REPO },
    credentials: { accessToken: HF_TOKEN },
    file: {
      path: storagePath,
      content: file,
    },
    commitTitle: `Upload ${subfolder} file`,
  });

  return `https://huggingface.co/datasets/${HF_REPO}/resolve/main/${storagePath}`;
}
