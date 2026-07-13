import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { ensureSchema } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();
  } catch (error) {
    console.error("community-comments schema error:", error);
    return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
  }

  if (req.method === "POST") {
    const user = requireAuth(req, res);
    if (!user) return;

    const { postId, content } = req.body ?? {};
    if (!postId || !content) {
      return res.status(400).json({ message: "게시글과 내용이 필요합니다." });
    }

    try {
      const postCheck = await sql`SELECT id FROM community_posts WHERE id = ${postId}`;
      if (postCheck.rows.length === 0) {
        return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
      }

      const userRow = await sql`SELECT name FROM users WHERE id = ${user.id}`;
      const authorName = userRow.rows[0]?.name || user.email;

      const id = randomUUID();
      const result = await sql`
        INSERT INTO community_comments (id, post_id, author_name, author_email, content)
        VALUES (${id}, ${postId}, ${authorName}, ${user.email}, ${content})
        RETURNING id, post_id AS "postId", author_name AS "authorName", author_email AS "authorEmail",
                  content, created_at AS "createdAt"
      `;
      return res.status(201).json({ comment: result.rows[0] });
    } catch (error) {
      console.error("community-comments POST error:", error);
      return res.status(500).json({ message: "댓글 작성 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const user = requireAuth(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    try {
      const existing = await sql`SELECT author_email AS "authorEmail" FROM community_comments WHERE id = ${id}`;
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
      }
      if (existing.rows[0].authorEmail !== user.email && user.role !== "admin") {
        return res.status(403).json({ message: "작성자 본인 또는 관리자만 삭제할 수 있습니다." });
      }

      await sql`DELETE FROM community_comments WHERE id = ${id}`;
      return res.status(200).json({ id });
    } catch (error) {
      console.error("community-comments DELETE error:", error);
      return res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "POST, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
