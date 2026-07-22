import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { batchUpdateSortOrder, ensureSchema } from "./_lib/db.js";
import { requireAdmin } from "./_lib/auth.js";

// PUT/DELETE target a single post via ?id=<uuid> rather than a
// /culture-posts/[id] dynamic route file, since vercel dev's local routing
// on Windows fails to resolve nested bracket routes (falls through to the
// SPA rewrite instead of the function) — this form works identically in
// local dev and production.
export default async function handler(req, res) {
  // Skip the migration check on reads — it's idempotent and only matters for
  // a fresh/empty DB, so paying its round-trip cost on every page load (the
  // hot path) instead of only on writes was adding ~1s to every GET.
  if (req.method !== "GET") {
    try {
      await ensureSchema();
    } catch (error) {
      console.error("culture-posts schema error:", error);
      return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT id, title, body_html AS "bodyHtml", check_points AS "checkPoints", created_at AS "createdAt"
        FROM culture_posts
        ORDER BY sort_order ASC NULLS LAST, created_at ASC
      `;
      return res.status(200).json({ posts: result.rows });
    } catch (error) {
      console.error("culture-posts GET error:", error);
      return res.status(500).json({ message: "포스트 목록을 불러오지 못했습니다." });
    }
  }

  if (req.method === "POST") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { title, bodyHtml, checkPoints } = req.body ?? {};
    if (!title || typeof title !== "string" || typeof bodyHtml !== "string" || !Array.isArray(checkPoints)) {
      return res.status(400).json({ message: "제목, 본문, 체크포인트가 필요합니다." });
    }

    try {
      const id = randomUUID();
      const result = await sql`
        INSERT INTO culture_posts (id, title, body_html, check_points, sort_order)
        VALUES (
          ${id}, ${title}, ${bodyHtml}, ${JSON.stringify(checkPoints)}::jsonb,
          COALESCE((SELECT MAX(sort_order) FROM culture_posts), -1) + 1
        )
        RETURNING id, title, body_html AS "bodyHtml", check_points AS "checkPoints", created_at AS "createdAt"
      `;
      return res.status(201).json({ post: result.rows[0] });
    } catch (error) {
      console.error("culture-posts POST error:", error);
      return res.status(500).json({ message: "포스트 생성 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "PUT") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;

    if (!id) {
      const { order } = req.body ?? {};
      if (!Array.isArray(order) || order.length === 0) {
        return res.status(400).json({ message: "순서 배열이 필요합니다." });
      }
      try {
        await batchUpdateSortOrder("culture_posts", order);
        return res.status(200).json({ message: "순서가 저장되었습니다." });
      } catch (error) {
        console.error("culture-posts reorder error:", error);
        return res.status(500).json({ message: "순서 저장 중 오류가 발생했습니다." });
      }
    }

    const { title, bodyHtml, checkPoints } = req.body ?? {};
    if (!title || typeof title !== "string" || typeof bodyHtml !== "string" || !Array.isArray(checkPoints)) {
      return res.status(400).json({ message: "제목, 본문, 체크포인트가 필요합니다." });
    }

    try {
      const result = await sql`
        UPDATE culture_posts
        SET title = ${title}, body_html = ${bodyHtml}, check_points = ${JSON.stringify(checkPoints)}::jsonb
        WHERE id = ${id}
        RETURNING id, title, body_html AS "bodyHtml", check_points AS "checkPoints", created_at AS "createdAt"
      `;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
      }
      return res.status(200).json({ post: result.rows[0] });
    } catch (error) {
      console.error("culture-posts PUT error:", error);
      return res.status(500).json({ message: "포스트 수정 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    try {
      const result = await sql`DELETE FROM culture_posts WHERE id = ${id} RETURNING id`;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
      }
      return res.status(200).json({ id });
    } catch (error) {
      console.error("culture-posts DELETE error:", error);
      return res.status(500).json({ message: "포스트 삭제 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
