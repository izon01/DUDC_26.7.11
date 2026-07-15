import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";
import { batchUpdateSortOrder, ensureSchema } from "./_lib/db.js";
import { requireAdmin } from "./_lib/auth.js";

// PUT/DELETE target a single manual via ?id=<uuid> rather than a
// /work-manuals/[id] dynamic route file, since vercel dev's local routing
// on Windows fails to resolve nested bracket routes (falls through to the
// SPA rewrite instead of the function) — this form works identically in
// local dev and production.
export default async function handler(req, res) {
  try {
    await ensureSchema();
  } catch (error) {
    console.error("work-manuals schema error:", error);
    return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
  }

  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT id, title, spreads, created_at AS "createdAt"
        FROM work_manuals
        ORDER BY sort_order ASC NULLS LAST, created_at ASC
      `;
      return res.status(200).json({ manuals: result.rows });
    } catch (error) {
      console.error("work-manuals GET error:", error);
      return res.status(500).json({ message: "매뉴얼 목록을 불러오지 못했습니다." });
    }
  }

  if (req.method === "POST") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { title, spreads } = req.body ?? {};
    if (!title || typeof title !== "string" || !Array.isArray(spreads)) {
      return res.status(400).json({ message: "제목과 스프레드 데이터가 필요합니다." });
    }

    try {
      const id = randomUUID();
      const result = await sql`
        INSERT INTO work_manuals (id, title, spreads, sort_order)
        VALUES (
          ${id}, ${title}, ${JSON.stringify(spreads)}::jsonb,
          COALESCE((SELECT MAX(sort_order) FROM work_manuals), -1) + 1
        )
        RETURNING id, title, spreads, created_at AS "createdAt"
      `;
      return res.status(201).json({ manual: result.rows[0] });
    } catch (error) {
      console.error("work-manuals POST error:", error);
      return res.status(500).json({ message: "매뉴얼 생성 중 오류가 발생했습니다." });
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
        await batchUpdateSortOrder("work_manuals", order);
        return res.status(200).json({ message: "순서가 저장되었습니다." });
      } catch (error) {
        console.error("work-manuals reorder error:", error);
        return res.status(500).json({ message: "순서 저장 중 오류가 발생했습니다." });
      }
    }

    const { title, spreads } = req.body ?? {};
    if (!title || typeof title !== "string" || !Array.isArray(spreads)) {
      return res.status(400).json({ message: "제목과 스프레드 데이터가 필요합니다." });
    }

    try {
      const result = await sql`
        UPDATE work_manuals
        SET title = ${title}, spreads = ${JSON.stringify(spreads)}::jsonb
        WHERE id = ${id}
        RETURNING id, title, spreads, created_at AS "createdAt"
      `;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });
      }
      return res.status(200).json({ manual: result.rows[0] });
    } catch (error) {
      console.error("work-manuals PUT error:", error);
      return res.status(500).json({ message: "매뉴얼 수정 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    try {
      const result = await sql`DELETE FROM work_manuals WHERE id = ${id} RETURNING id`;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "매뉴얼을 찾을 수 없습니다." });
      }
      return res.status(200).json({ id });
    } catch (error) {
      console.error("work-manuals DELETE error:", error);
      return res.status(500).json({ message: "매뉴얼 삭제 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
