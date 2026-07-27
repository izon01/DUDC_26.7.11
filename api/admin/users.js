import { sql } from "@vercel/postgres";
import { ensureSchema } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  // Skip on GET (hot path) — see culture-posts.js for the same reasoning.
  // The admin console is low-traffic, but there's still no reason to pay
  // the migration round-trip on a plain list load.
  if (req.method !== "GET") {
    try {
      await ensureSchema();
    } catch (error) {
      console.error("admin/users schema error:", error);
      return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT id, email, name, affiliation, role, created_at AS "createdAt"
        FROM users
        ORDER BY created_at DESC
      `;
      return res.status(200).json({ users: result.rows });
    } catch (error) {
      console.error("admin/users GET error:", error);
      return res.status(500).json({ message: "유저 목록을 불러오지 못했습니다." });
    }
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    const { role } = req.body ?? {};
    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ message: "role은 admin 또는 user여야 합니다." });
    }

    // Stop an admin from stripping their own admin role — that would lock
    // them (and potentially everyone else) out of this page with no way back
    // in short of a direct DB edit.
    if (String(id) === String(admin.id) && role !== "admin") {
      return res.status(400).json({ message: "본인의 관리자 권한은 스스로 회수할 수 없습니다." });
    }

    try {
      const result = await sql`
        UPDATE users SET role = ${role} WHERE id = ${id}
        RETURNING id, email, name, affiliation, role, created_at AS "createdAt"
      `;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      return res.status(200).json({ user: result.rows[0] });
    } catch (error) {
      console.error("admin/users PUT error:", error);
      return res.status(500).json({ message: "권한 변경 중 오류가 발생했습니다." });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "id가 필요합니다." });

    if (String(id) === String(admin.id)) {
      return res.status(400).json({ message: "본인 계정은 삭제할 수 없습니다." });
    }

    try {
      const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      return res.status(200).json({ id });
    } catch (error) {
      console.error("admin/users DELETE error:", error);
      return res.status(500).json({ message: "유저 삭제 중 오류가 발생했습니다." });
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ message: "Method Not Allowed" });
}
