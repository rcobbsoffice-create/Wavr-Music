"use client";

/**
 * Upload a file from the browser straight to storage.
 * The server hands out a short-lived signed PUT URL, so no storage
 * credentials are ever shipped to the browser.
 * Returns the app URL to save on the record (e.g. "/api/files/beats/....wav").
 */
export async function uploadToStorage(file: File, folder: string): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, folder, size: file.size }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Upload could not start (${res.status})`);

  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": data.contentType },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);

  return data.url as string;
}
