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

const REVISION_TYPES = new Set(["신설", "개정"]);

// Returns an error message for an invalid revision pair, or null when valid.
// The date is a plain YYYY-MM-DD calendar day; the round-trip through Date
// rejects impossible dates like 2026-02-31 that the regex alone would allow.
function validateRevision(revisionDate, revisionType) {
  if (typeof revisionDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(revisionDate)) {
    return "신설·개정일을 올바른 날짜로 입력해주세요.";
  }
  const parsed = new Date(`${revisionDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== revisionDate) {
    return "신설·개정일을 올바른 날짜로 입력해주세요.";
  }
  if (!REVISION_TYPES.has(revisionType)) {
    return "신설 또는 개정을 선택해주세요.";
  }
  return null;
}

function sanitizeFilename(name) {
  const base = (name || "file").normalize("NFC").replace(/[/\\?%*:|"<>]/g, "").trim();
  return base.slice(0, 100) || "file";
}

// PUT/DELETE target a single document via ?id=<uuid> for the same reason as
// the other content endpoints — see api/work-manuals.js for the fuller
// explanation.
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
               created_at AS "createdAt",
               to_char(revision_date, 'YYYY-MM-DD') AS "revisionDate", revision_type AS "revisionType"
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

    const { title, category, filename, dataUrl, revisionDate, revisionType } = req.body ?? {};
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "제목이 필요합니다." });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ message: "부서(카테고리)가 필요합니다." });
    }
    const revisionError = validateRevision(revisionDate, revisionType);
    if (revisionError) return res.status(400).json({ message: revisionError });

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
        INSERT INTO manual_documents (id, title, category, filename, file_url, file_size, revision_date, revision_type)
        VALUES (${id}, ${title.trim()}, ${category}, ${safeName}, ${blob.url}, ${buffer.length},
                ${revisionDate}, ${revisionType})
        RETURNING id, title, category, filename, file_url AS "fileUrl", file_size AS "fileSize",
                  created_at AS "createdAt",
               to_char(revision_date, 'YYYY-MM-DD') AS "revisionDate", revision_type AS "revisionType"
      `;
      return res.status(201).json({ document: result.rows[0] });
    } catch (error) {
      console.error("manual-documents POST error:", error);
      return res.status(500).json({ message: "매뉴얼 등록 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "PUT") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    const { title, category, filename, dataUrl, revisionDate, revisionType } = req.body ?? {};
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "제목이 필요합니다." });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ message: "부서(카테고리)가 필요합니다." });
    }
    const revisionError = validateRevision(revisionDate, revisionType);
    if (revisionError) return res.status(400).json({ message: revisionError });

    // Replacing the file is optional — omit filename/dataUrl to just rename
    // or recategorize an existing document without touching its file.
    const replacingFile = typeof dataUrl === "string" && dataUrl.length > 0;
    let newSafeName = null;
    let newBuffer = null;
    let newContentType = null;

    if (replacingFile) {
      const ext = (filename || "").split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({ message: "PDF, HWP, DOCX, XLSX 파일만 업로드할 수 있습니다." });
      }
      const match = dataUrl.match(DATA_URL_PATTERN);
      if (!match) {
        return res.status(400).json({ message: "파일 데이터가 올바르지 않습니다." });
      }
      newBuffer = Buffer.from(match[2], "base64");
      if (newBuffer.length > MAX_BYTES) {
        return res.status(413).json({ message: "1MB 이하의 파일만 업로드 가능합니다." });
      }
      newSafeName = sanitizeFilename(filename);
      newContentType = match[1];
    }

    try {
      const existing = await sql`SELECT file_url AS "fileUrl" FROM manual_documents WHERE id = ${id}`;
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });
      }

      let result;
      if (replacingFile) {
        const blob = await put(`manual-documents/${id}-${Date.now()}-${newSafeName}`, newBuffer, {
          access: "public",
          contentType: newContentType,
        });
        // Best-effort — see the DELETE handler below for why this doesn't
        // block the update if it fails.
        try {
          await del(existing.rows[0].fileUrl);
        } catch (blobError) {
          console.error("manual-documents blob replace-delete error:", blobError);
        }
        result = await sql`
          UPDATE manual_documents
          SET title = ${title.trim()}, category = ${category}, filename = ${newSafeName},
              file_url = ${blob.url}, file_size = ${newBuffer.length},
              revision_date = ${revisionDate}, revision_type = ${revisionType}
          WHERE id = ${id}
          RETURNING id, title, category, filename, file_url AS "fileUrl", file_size AS "fileSize",
                    created_at AS "createdAt",
               to_char(revision_date, 'YYYY-MM-DD') AS "revisionDate", revision_type AS "revisionType"
        `;
      } else {
        result = await sql`
          UPDATE manual_documents
          SET title = ${title.trim()}, category = ${category},
              revision_date = ${revisionDate}, revision_type = ${revisionType}
          WHERE id = ${id}
          RETURNING id, title, category, filename, file_url AS "fileUrl", file_size AS "fileSize",
                    created_at AS "createdAt",
               to_char(revision_date, 'YYYY-MM-DD') AS "revisionDate", revision_type AS "revisionType"
        `;
      }
      return res.status(200).json({ document: result.rows[0] });
    } catch (error) {
      console.error("manual-documents PUT error:", error);
      return res.status(500).json({ message: "매뉴얼 수정 중 오류가 발생했습니다." });
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

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
