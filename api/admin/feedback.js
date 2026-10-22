import { sql } from "@vercel/postgres";
import { ensureSchema } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";

const STATUSES = ["received", "in_progress", "done"];

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    // The table is created lazily, and this endpoint can be hit before anyone
    // has submitted feedback — so reads need it too (unlike the other admin
    // list endpoints whose tables always predate them).
    await ensureSchema();
  } catch (error) {
    console.error("admin/feedback schema error:", error);
    return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
  }

  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT id, page_path AS "pagePath", type, content, status,
               author_name AS "authorName", author_email AS "authorEmail", created_at AS "createdAt"
        FROM feedbacks
        ORDER BY created_at DESC
      `;
      return res.status(200).json({ feedbacks: result.rows });
    } catch (error) {
      console.error("admin/feedback GET error:", error);
      return res.status(500).json({ message: "의견 목록을 불러오지 못했습니다." });
    }
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    const { status } = req.body ?? {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "올바르지 않은 처리 상태입니다." });
    }

    try {
      const result = await sql`
        UPDATE feedbacks SET status = ${status} WHERE id = ${id}
        RETURNING id, page_path AS "pagePath", type, content, status,
                  author_name AS "authorName", author_email AS "authorEmail", created_at AS "createdAt"
      `;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "의견을 찾을 수 없습니다." });
      }
      return res.status(200).json({ feedback: result.rows[0] });
    } catch (error) {
      console.error("admin/feedback PUT error:", error);
      return res.status(500).json({ message: "상태 변경 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ message: "Method Not Allowed" });
}
