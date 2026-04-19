import fs from 'fs'
import path from 'path'

export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  subfolder: string
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subfolder)
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const ext = path.extname(originalFilename) || '.bin'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const destPath = path.join(uploadsDir, filename)

  fs.writeFileSync(destPath, fileBuffer)

  return `/uploads/${subfolder}/${filename}`
}
