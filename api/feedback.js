import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { ensureSchema } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";

const FEEDBACK_TYPES = ["improvement", "inquiry", "bug", "other"];
const MAX_CONTENT_LENGTH = 2000;

// Any logged-in user can submit; the admin console reads/updates them via
// api/admin/feedback.js.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const { pageTitle, type, content } = req.body ?? {};
  const trimmedContent = typeof content === "string" ? content.trim() : "";
  // Stored in the legacy-named `page_path` column: newer rows hold a Korean
  // breadcrumb title, older ones a raw URL path.
  const trimmedTitle = typeof pageTitle === "string" ? pageTitle.trim().slice(0, 500) : "";

  if (!trimmedTitle || !trimmedContent || !FEEDBACK_TYPES.includes(type)) {
    return res.status(400).json({ message: "대상 페이지, 의견 유형, 의견 내용이 필요합니다." });
  }
  if (trimmedContent.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({ message: `의견 내용은 ${MAX_CONTENT_LENGTH}자 이내로 작성해주세요.` });
  }

  try {
    await ensureSchema();
    const id = randomUUID();
    const authorName = user.name || user.email;
    await sql`
      INSERT INTO feedbacks (id, page_path, type, content, author_name, author_email)
      VALUES (${id}, ${trimmedTitle}, ${type}, ${trimmedContent}, ${authorName}, ${user.email})
    `;
    return res.status(201).json({ id });
  } catch (error) {
    console.error("feedback POST error:", error);
    return res.status(500).json({ message: "의견 등록 중 오류가 발생했습니다." });
  }
}
