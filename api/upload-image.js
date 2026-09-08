import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "./_lib/auth.js";

// Client already downscales/compresses to ~1.5MB before sending; this is a
// hard server-side ceiling so a modified client can't push large files to
// Blob storage and drive up storage/bandwidth cost.
const MAX_BYTES = 3 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { dataUrl } = req.body ?? {};
  const match = typeof dataUrl === "string" ? dataUrl.match(DATA_URL_PATTERN) : null;
  if (!match) {
    return res.status(400).json({ message: "이미지 데이터가 올바르지 않습니다." });
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ message: "이미지 용량이 너무 큽니다 (최대 3MB)." });
  }

  try {
    const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
    const blob = await put(`post-images/${randomUUID()}.${ext}`, buffer, {
      access: "public",
      contentType: mimeType,
    });
    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("upload-image error:", error);
    return res.status(500).json({ message: "이미지 업로드 중 오류가 발생했습니다." });
  }
}
