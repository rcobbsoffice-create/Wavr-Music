import { mimeFor, newKey, putObject } from "@/lib/storage";

/**
 * Save an uploaded file (server side) to storage and return the URL to store
 * in the database, e.g. "/api/files/artwork/1729700000-ab12cd34.jpg".
 */
export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  subfolder: string,
): Promise<string> {
  const key = newKey(subfolder, originalFilename);
  return putObject(key, fileBuffer, mimeFor(originalFilename));
}
