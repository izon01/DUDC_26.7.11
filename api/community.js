import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { ensureSchema } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";

// Single post detail + delete both target the record via ?id=<uuid> rather
// than a /community/[id] dynamic route file — vercel dev's local routing on
// Windows fails to resolve nested bracket routes (falls through to the SPA
// rewrite instead of the function). See api/work-manuals.js for the same
// pattern and a fuller explanation.
export default async function handler(req, res) {
  try {
    await ensureSchema();
  } catch (error) {
    console.error("community schema error:", error);
    return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
  }

  if (req.method === "GET") {
    const { id } = req.query;

    if (id) {
      try {
        const postResult = await sql`
          SELECT id, title, content, category, author_name AS "authorName", author_email AS "authorEmail",
                 created_at AS "createdAt"
          FROM community_posts
          WHERE id = ${id}
        `;
        if (postResult.rows.length === 0) {
          return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }
        const commentsResult = await sql`
          SELECT id, post_id AS "postId", author_name AS "authorName", author_email AS "authorEmail",
                 content, created_at AS "createdAt"
          FROM community_comments
          WHERE post_id = ${id}
          ORDER BY created_at ASC
        `;
        return res.status(200).json({ post: postResult.rows[0], comments: commentsResult.rows });
      } catch (error) {
        console.error("community GET detail error:", error);
        return res.status(500).json({ message: "게시글을 불러오지 못했습니다." });
      }
    }

    try {
      const result = await sql`
        SELECT p.id, p.title, p.content, p.category, p.author_name AS "authorName", p.author_email AS "authorEmail",
               p.created_at AS "createdAt", COUNT(c.id)::int AS "commentCount"
        FROM community_posts p
        LEFT JOIN community_comments c ON c.post_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;
      return res.status(200).json({ posts: result.rows });
    } catch (error) {
      console.error("community GET list error:", error);
      return res.status(500).json({ message: "게시글 목록을 불러오지 못했습니다." });
    }
  }

  if (req.method === "POST") {
    const user = requireAuth(req, res);
    if (!user) return;

    const { title, content, category } = req.body ?? {};
    if (!title || !content || !category) {
      return res.status(400).json({ message: "제목, 내용, 카테고리가 필요합니다." });
    }

    try {
      const authorName = user.name || user.email;

      const id = randomUUID();
      const result = await sql`
        INSERT INTO community_posts (id, title, content, category, author_name, author_email)
        VALUES (${id}, ${title}, ${content}, ${category}, ${authorName}, ${user.email})
        RETURNING id, title, content, category, author_name AS "authorName", author_email AS "authorEmail",
                  created_at AS "createdAt"
      `;
      return res.status(201).json({ post: { ...result.rows[0], commentCount: 0 } });
    } catch (error) {
      console.error("community POST error:", error);
      return res.status(500).json({ message: "게시글 작성 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const user = requireAuth(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    try {
      const existing = await sql`SELECT author_email AS "authorEmail" FROM community_posts WHERE id = ${id}`;
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
      }
      if (existing.rows[0].authorEmail !== user.email && user.role !== "admin") {
        return res.status(403).json({ message: "작성자 본인 또는 관리자만 삭제할 수 있습니다." });
      }

      await sql`DELETE FROM community_posts WHERE id = ${id}`;
      return res.status(200).json({ id });
    } catch (error) {
      console.error("community DELETE error:", error);
      return res.status(500).json({ message: "게시글 삭제 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
