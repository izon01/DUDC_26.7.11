import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요." });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set");
    return res.status(500).json({ message: "서버 설정 오류입니다." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await sql`
      SELECT id, email, name, affiliation, password, role
      FROM users
      WHERE email = ${normalizedEmail}
    `;
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        affiliation: user.affiliation,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다." });
  }
}
