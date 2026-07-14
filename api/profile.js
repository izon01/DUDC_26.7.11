import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { requireAuth } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const authUser = requireAuth(req, res);
  if (!authUser) return;

  const { affiliation, password } = req.body ?? {};

  if (!affiliation && !password) {
    return res.status(400).json({ message: "변경할 정보를 입력해주세요." });
  }
  if (affiliation !== undefined && affiliation !== null && !String(affiliation).trim()) {
    return res.status(400).json({ message: "소속을 입력해주세요." });
  }
  if (password && password.length < 8) {
    return res.status(400).json({ message: "비밀번호는 8자 이상이어야 합니다." });
  }

  try {
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const result = await sql`
      UPDATE users
      SET affiliation = COALESCE(${affiliation || null}, affiliation),
          password = COALESCE(${passwordHash}, password)
      WHERE id = ${authUser.id}
      RETURNING id, email, name, affiliation, role
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error("profile PUT error:", error);
    return res.status(500).json({ message: "프로필 수정 중 오류가 발생했습니다." });
  }
}
