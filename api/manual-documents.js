import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { ensureSchema } from "./_lib/db.js";
import { requireAdmin } from "./_lib/auth.js";

// Client-side already blocks anything over 1MB before it's even read into a
// data URL; this is the hard server-side ceiling so a modified client can't
// push larger files to Blob storage.
const MAX_BYTES = 1 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "hwp", "docx", "xlsx"]);
const DATA_URL_PATTERN = /^data:([^;]+);base64,(.+)$/;

function sanitizeFilename(name) {
  const base = (name || "file").normalize("NFC").replace(/[/\\?%*:|"<>]/g, "").trim();
  return base.slice(0, 100) || "file";
}

// PUT/DELETE-by-id isn't needed yet (no edit flow), but DELETE targets a
// single document via ?id=<uuid> for the same reason as the other content
// endpoints — see api/work-manuals.js for the fuller explanation.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    try {
      await ensureSchema();
    } catch (error) {
      console.error("manual-documents schema error:", error);
      return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT id, title, category, filename, file_url AS "fileUrl", file_size AS "fileSize",
               created_at AS "createdAt"
        FROM manual_documents
        ORDER BY created_at DESC
      `;
      return res.status(200).json({ documents: result.rows });
    } catch (error) {
      console.error("manual-documents GET error:", error);
      return res.status(500).json({ message: "매뉴얼 목록을 불러오지 못했습니다." });
    }
  }

  if (req.method === "POST") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { title, category, filename, dataUrl } = req.body ?? {};
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "제목이 필요합니다." });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ message: "부서(카테고리)가 필요합니다." });
    }

    const ext = (filename || "").split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ message: "PDF, HWP, DOCX, XLSX 파일만 업로드할 수 있습니다." });
    }

    const match = typeof dataUrl === "string" ? dataUrl.match(DATA_URL_PATTERN) : null;
    if (!match) {
      return res.status(400).json({ message: "파일 데이터가 올바르지 않습니다." });
    }

    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ message: "1MB 이하의 파일만 업로드 가능합니다." });
    }

    try {
      const id = randomUUID();
      const safeName = sanitizeFilename(filename);
      const blob = await put(`manual-documents/${id}-${safeName}`, buffer, {
        access: "public",
        contentType: match[1],
      });
      const result = await sql`
        INSERT INTO manual_documents (id, title, category, filename, file_url, file_size)
        VALUES (${id}, ${title.trim()}, ${category}, ${safeName}, ${blob.url}, ${buffer.length})
        RETURNING id, title, category, filename, file_url AS "fileUrl", file_size AS "fileSize",
                  created_at AS "createdAt"
      `;
      return res.status(201).json({ document: result.rows[0] });
    } catch (error) {
      console.error("manual-documents POST error:", error);
      return res.status(500).json({ message: "매뉴얼 등록 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    try {
      const result = await sql`DELETE FROM manual_documents WHERE id = ${id} RETURNING file_url AS "fileUrl"`;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });
      }
      // Best-effort — a failed Blob cleanup shouldn't block the row from
      // being gone (an orphaned blob costs a few KB of storage; a delete
      // that silently fails would be much more confusing).
      try {
        await del(result.rows[0].fileUrl);
      } catch (blobError) {
        console.error("manual-documents blob delete error:", blobError);
      }
      return res.status(200).json({ id });
    } catch (error) {
      console.error("manual-documents DELETE error:", error);
      return res.status(500).json({ message: "매뉴얼 삭제 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
