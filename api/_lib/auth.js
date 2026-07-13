import jwt from "jsonwebtoken";

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Verifies the request's JWT and returns its decoded payload, or null if
// missing/invalid. Does not write a response — callers decide how to react.
export function getAuthenticatedUser(req) {
  const token = getBearerToken(req);
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Verifies the request is from a logged-in admin. On failure it writes the
// appropriate error response itself and returns null; callers should `return`
// immediately when this returns null.
export function requireAdmin(req, res) {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set");
    res.status(500).json({ message: "서버 설정 오류입니다." });
    return null;
  }

  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ message: "인증이 필요합니다." });
    return null;
  }
  if (user.role !== "admin") {
    res.status(403).json({ message: "관리자만 수행할 수 있는 작업입니다." });
    return null;
  }
  return user;
}
