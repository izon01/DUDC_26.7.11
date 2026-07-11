import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, name, affiliation, password } = req.body ?? {};

  if (!email || !name || !affiliation || !password) {
    return res.status(400).json({ message: "이메일, 이름, 소속, 비밀번호를 모두 입력해주세요." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "비밀번호는 8자 이상이어야 합니다." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await sql`
      INSERT INTO users (email, name, affiliation, password, role)
      VALUES (${normalizedEmail}, ${name}, ${affiliation}, ${passwordHash}, 'user')
      RETURNING id, email, name, affiliation, role
    `;

    return res.status(201).json({ user: inserted.rows[0] });
  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({ message: "회원가입 처리 중 오류가 발생했습니다." });
  }
}
