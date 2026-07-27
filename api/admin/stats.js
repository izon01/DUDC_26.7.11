import { sql } from "@vercel/postgres";
import { ensureSchema } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await ensureSchema();
  } catch (error) {
    console.error("admin/stats schema error:", error);
    return res.status(500).json({ message: "데이터베이스 초기화 중 오류가 발생했습니다." });
  }

  try {
    const [userCount, manualCount, culturePostCount, communityPostCount, recentUsers, recentCommunityPosts] =
      await Promise.all([
        sql`SELECT COUNT(*)::int AS count FROM users`,
        sql`SELECT COUNT(*)::int AS count FROM work_manuals`,
        sql`SELECT COUNT(*)::int AS count FROM culture_posts`,
        sql`SELECT COUNT(*)::int AS count FROM community_posts`,
        sql`SELECT id, name, email, role, created_at AS "createdAt" FROM users ORDER BY created_at DESC LIMIT 5`,
        sql`
          SELECT id, title, author_name AS "authorName", created_at AS "createdAt"
          FROM community_posts
          ORDER BY created_at DESC
          LIMIT 5
        `,
      ]);

    return res.status(200).json({
      totals: {
        users: userCount.rows[0].count,
        workManuals: manualCount.rows[0].count,
        culturePosts: culturePostCount.rows[0].count,
        communityPosts: communityPostCount.rows[0].count,
      },
      recentUsers: recentUsers.rows,
      recentCommunityPosts: recentCommunityPosts.rows,
    });
  } catch (error) {
    console.error("admin/stats GET error:", error);
    return res.status(500).json({ message: "통계를 불러오지 못했습니다." });
  }
}
