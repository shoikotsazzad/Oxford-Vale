import "server-only";
// Upload storage behind STORAGE_PROVIDER. `local` writes to storage/uploads/ (served by app/uploads/[...path]).
// Serverless hosts (Vercel) have no persistent disk: add a Cloudinary/S3 provider here before using uploads in production.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { randomToken } from "@/server/crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export class UploadError extends Error {}

/** Product photo: validated, re-encoded (strips metadata), cropped to the 4:5 grid ratio. Returns its public URL. */
export async function saveProductImage(file: File): Promise<string> {
  if ((process.env.STORAGE_PROVIDER ?? "local") !== "local") throw new UploadError("Only the local storage provider is set up.");
  if (!ACCEPTED.has(file.type)) throw new UploadError("Use a JPG, PNG or WebP image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Images must be 5 MB or smaller.");
  let out: Buffer;
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(1000, 1250, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new UploadError("This file isn't a readable image.");
  }
  const month = new Date().toISOString().slice(0, 7);
  const name = `${randomToken(12)}.webp`;
  await mkdir(path.join(UPLOAD_DIR, "products", month), { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, "products", month, name), out);
  return `/uploads/products/${month}/${name}`;
}

/** Read a stored upload; null for anything outside the upload folder or missing. */
export async function readUpload(parts: string[]): Promise<Buffer | null> {
  const file = path.resolve(UPLOAD_DIR, ...parts);
  if (!file.startsWith(UPLOAD_DIR + path.sep) || !file.endsWith(".webp")) return null;
  return readFile(file).catch(() => null);
}
