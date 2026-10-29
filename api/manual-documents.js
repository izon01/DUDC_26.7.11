import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { ensureSchema } from "./_lib/db.js";
import { requireAdmin } from "./_lib/auth.js";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "./_lib/uploadLimits.js";

const ALLOWED_EXTENSIONS = new Set(["pdf", "hwp", "hwpx", "docx", "xlsx"]);
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

function extensionOf(filename) {
  return (filename || "").split(".").pop()?.toLowerCase() ?? "";
}

// Validates one uploaded file (name + base64 data URL). Returns
// { error: { status, message } } or { safeName, buffer, contentType }.
// `pdfOnly` is for the preview slot, which also checks the PDF signature since
// that file is served inline to the browser's PDF viewer.
function parseUpload(filename, dataUrl, { pdfOnly = false } = {}) {
  const ext = extensionOf(filename);
  if (pdfOnly) {
    if (ext !== "pdf") return { error: { status: 400, message: "미리보기용 파일은 PDF만 올릴 수 있습니다." } };
  } else if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { error: { status: 400, message: "PDF, HWP, HWPX, DOCX, XLSX 파일만 업로드할 수 있습니다." } };
  }

  const match = typeof dataUrl === "string" ? dataUrl.match(DATA_URL_PATTERN) : null;
  if (!match) return { error: { status: 400, message: "파일 데이터가 올바르지 않습니다." } };

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { error: { status: 413, message: `${MAX_UPLOAD_MB}MB 이하의 파일만 업로드 가능합니다.` } };
  }
  if (pdfOnly && !buffer.subarray(0, 1024).includes("%PDF-")) {
    return { error: { status: 400, message: "올바른 PDF 파일이 아닙니다." } };
  }

  return {
    safeName: sanitizeFilename(filename),
    buffer,
    contentType: pdfOnly ? "application/pdf" : match[1],
  };
}

// Best-effort blob cleanup — a failed delete costs a few KB of orphaned
// storage, whereas letting it block the request would be far more confusing.
async function deleteBlobQuietly(url, label) {
  if (!url) return;
  try {
    await del(url);
  } catch (error) {
    console.error(`manual-documents blob ${label} error:`, error);
  }
}

// Documents with their files attached: { ..., files: [{ role, filename,
// fileUrl, fileSize }] } (original first). `filename`/`fileUrl`/`fileSize`
// also stay at the top level, mirroring the original, so older cached
// front-ends keep working. Rows from before the files table existed fall
// back to the legacy columns.
async function fetchDocuments(id = null) {
  const docs = id
    ? await sql`
        SELECT id, title, category, filename AS "legacyFilename", file_url AS "legacyUrl",
               file_size AS "legacySize", created_at AS "createdAt",
               to_char(revision_date, 'YYYY-MM-DD') AS "revisionDate", revision_type AS "revisionType"
        FROM manual_documents WHERE id = ${id}
      `
    : await sql`
        SELECT id, title, category, filename AS "legacyFilename", file_url AS "legacyUrl",
               file_size AS "legacySize", created_at AS "createdAt",
               to_char(revision_date, 'YYYY-MM-DD') AS "revisionDate", revision_type AS "revisionType"
        FROM manual_documents ORDER BY created_at DESC
      `;
  const fileRows = id
    ? await sql`
        SELECT document_id AS "documentId", role, filename, file_url AS "fileUrl", file_size AS "fileSize"
        FROM manual_document_files WHERE document_id = ${id}
      `
    : await sql`
        SELECT document_id AS "documentId", role, filename, file_url AS "fileUrl", file_size AS "fileSize"
        FROM manual_document_files
      `;

  const byDocument = new Map();
  for (const row of fileRows.rows) {
    const list = byDocument.get(row.documentId) ?? [];
    list.push({ role: row.role, filename: row.filename, fileUrl: row.fileUrl, fileSize: row.fileSize });
    byDocument.set(row.documentId, list);
  }

  return docs.rows.map(({ legacyFilename, legacyUrl, legacySize, ...doc }) => {
    const files = (byDocument.get(doc.id) ?? []).sort((a, b) => (a.role === b.role ? 0 : a.role === "original" ? -1 : 1));
    if (!files.some((f) => f.role === "original") && legacyUrl) {
      files.unshift({ role: "original", filename: legacyFilename, fileUrl: legacyUrl, fileSize: legacySize });
    }
    const original = files.find((f) => f.role === "original");
    return {
      ...doc,
      filename: original?.filename ?? null,
      fileUrl: original?.fileUrl ?? null,
      fileSize: original?.fileSize ?? 0,
      files,
    };
  });
}

async function fetchDocument(id) {
  return (await fetchDocuments(id))[0] ?? null;
}

// PUT/DELETE target a single document via ?id=<uuid> for the same reason as
// the other content endpoints — see api/work-manuals.js for the fuller
// explanation. `?file=preview` addresses the optional preview PDF of that
// document instead of the document itself; the original file is created and
// replaced through POST / plain PUT. Each request carries at most one file
// (see api/_lib/uploadLimits.js for why).
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
      let documents;
      try {
        documents = await fetchDocuments();
      } catch (error) {
        // GET skips the schema check for speed; if the files table doesn't
        // exist yet (first request after a deploy), create it and retry once.
        if (error?.code !== "42P01") throw error;
        await ensureSchema();
        documents = await fetchDocuments();
      }
      return res.status(200).json({ documents });
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

    const upload = parseUpload(filename, dataUrl);
    if (upload.error) return res.status(upload.error.status).json({ message: upload.error.message });

    let blobUrl = null;
    let documentId = null;
    try {
      const id = randomUUID();
      const blob = await put(`manual-documents/${id}-${upload.safeName}`, upload.buffer, {
        access: "public",
        contentType: upload.contentType,
      });
      blobUrl = blob.url;
      await sql`
        INSERT INTO manual_documents (id, title, category, filename, file_url, file_size, revision_date, revision_type)
        VALUES (${id}, ${title.trim()}, ${category}, ${upload.safeName}, ${blob.url}, ${upload.buffer.length},
                ${revisionDate}, ${revisionType})
      `;
      documentId = id;
      await sql`
        INSERT INTO manual_document_files (id, document_id, role, filename, file_url, file_size)
        VALUES (${randomUUID()}, ${id}, 'original', ${upload.safeName}, ${blob.url}, ${upload.buffer.length})
      `;
      return res.status(201).json({ document: await fetchDocument(id) });
    } catch (error) {
      console.error("manual-documents POST error:", error);
      // Don't leave a half-created document (or its blob) behind.
      if (documentId) await sql`DELETE FROM manual_documents WHERE id = ${documentId}`.catch(() => {});
      await deleteBlobQuietly(blobUrl, "create-cleanup");
      return res.status(500).json({ message: "매뉴얼 등록 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "PUT") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id, file } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    // ---- Preview PDF: add or replace --------------------------------------
    if (file === "preview") {
      const { filename, dataUrl } = req.body ?? {};
      const upload = parseUpload(filename, dataUrl, { pdfOnly: true });
      if (upload.error) return res.status(upload.error.status).json({ message: upload.error.message });

      try {
        const existing = await fetchDocument(id);
        if (!existing) return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });
        if (extensionOf(existing.filename) === "pdf") {
          return res.status(400).json({ message: "원본 파일이 PDF이면 미리보기용 PDF가 필요하지 않습니다." });
        }

        const blob = await put(`manual-documents/${id}-preview-${Date.now()}-${upload.safeName}`, upload.buffer, {
          access: "public",
          contentType: upload.contentType,
        });
        const oldPreview = existing.files.find((f) => f.role === "preview");
        await sql`
          INSERT INTO manual_document_files (id, document_id, role, filename, file_url, file_size)
          VALUES (${randomUUID()}, ${id}, 'preview', ${upload.safeName}, ${blob.url}, ${upload.buffer.length})
          ON CONFLICT (document_id, role)
          DO UPDATE SET filename = EXCLUDED.filename, file_url = EXCLUDED.file_url, file_size = EXCLUDED.file_size
        `;
        await deleteBlobQuietly(oldPreview?.fileUrl, "preview-replace-delete");
        return res.status(200).json({ document: await fetchDocument(id) });
      } catch (error) {
        console.error("manual-documents preview PUT error:", error);
        return res.status(500).json({ message: "미리보기용 PDF 업로드 중 오류가 발생했습니다." });
      }
    }

    // ---- Document: metadata, optionally replacing the original file -------
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
    let upload = null;
    if (replacingFile) {
      upload = parseUpload(filename, dataUrl);
      if (upload.error) return res.status(upload.error.status).json({ message: upload.error.message });
    }

    try {
      const existing = await fetchDocument(id);
      if (!existing) return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });

      if (replacingFile) {
        const blob = await put(`manual-documents/${id}-${Date.now()}-${upload.safeName}`, upload.buffer, {
          access: "public",
          contentType: upload.contentType,
        });
        await sql`
          INSERT INTO manual_document_files (id, document_id, role, filename, file_url, file_size)
          VALUES (${randomUUID()}, ${id}, 'original', ${upload.safeName}, ${blob.url}, ${upload.buffer.length})
          ON CONFLICT (document_id, role)
          DO UPDATE SET filename = EXCLUDED.filename, file_url = EXCLUDED.file_url, file_size = EXCLUDED.file_size
        `;
        await sql`
          UPDATE manual_documents
          SET title = ${title.trim()}, category = ${category}, filename = ${upload.safeName},
              file_url = ${blob.url}, file_size = ${upload.buffer.length},
              revision_date = ${revisionDate}, revision_type = ${revisionType}
          WHERE id = ${id}
        `;
        await deleteBlobQuietly(existing.fileUrl, "replace-delete");

        // A PDF original is previewed directly, so a separate preview PDF would
        // only be a stale second copy — drop it.
        if (extensionOf(upload.safeName) === "pdf") {
          const stalePreview = existing.files.find((f) => f.role === "preview");
          if (stalePreview) {
            await sql`DELETE FROM manual_document_files WHERE document_id = ${id} AND role = 'preview'`;
            await deleteBlobQuietly(stalePreview.fileUrl, "preview-superseded-delete");
          }
        }
      } else {
        await sql`
          UPDATE manual_documents
          SET title = ${title.trim()}, category = ${category},
              revision_date = ${revisionDate}, revision_type = ${revisionType}
          WHERE id = ${id}
        `;
      }
      return res.status(200).json({ document: await fetchDocument(id) });
    } catch (error) {
      console.error("manual-documents PUT error:", error);
      return res.status(500).json({ message: "매뉴얼 수정 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id, file } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    try {
      // ---- Preview PDF: remove --------------------------------------------
      if (file === "preview") {
        const removed = await sql`
          DELETE FROM manual_document_files WHERE document_id = ${id} AND role = 'preview' RETURNING file_url AS "fileUrl"
        `;
        await deleteBlobQuietly(removed.rows[0]?.fileUrl, "preview-delete");
        const document = await fetchDocument(id);
        if (!document) return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });
        return res.status(200).json({ document });
      }

      // ---- Whole document: remove every file with it ----------------------
      const existing = await fetchDocument(id);
      if (!existing) return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });

      // The files table cascades with the document row.
      await sql`DELETE FROM manual_documents WHERE id = ${id}`;
      for (const f of existing.files) await deleteBlobQuietly(f.fileUrl, "delete");
      return res.status(200).json({ id });
    } catch (error) {
      console.error("manual-documents DELETE error:", error);
      return res.status(500).json({ message: "매뉴얼 삭제 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
