import { sql } from "@vercel/postgres";

// Vercel Cron fires this every 10 minutes, all day, every day (Hobby plan
// can't restrict a cron's own schedule to a time window) — so the actual
// "only during business hours" gating happens here instead, in code. This
// keeps Neon's compute from auto-suspending during KST business hours
// without paying for an always-on DB plan or pinging it around the clock.
function isWithinBusinessHoursKST(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);

  const isWeekday = weekday && !["Sat", "Sun"].includes(weekday);
  const isBusinessHour = hour >= 8 && hour < 19;
  return Boolean(isWeekday && isBusinessHour);
}

export default async function handler(req, res) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` on cron-triggered
  // requests when CRON_SECRET is set in the project's env vars — verifying
  // it (when configured) stops randoms from hitting this endpoint and
  // spamming the DB. No-ops harmlessly if CRON_SECRET isn't set yet.
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  if (!isWithinBusinessHoursKST()) {
    return res.status(200).json({ pinged: false, reason: "outside KST business hours" });
  }

  try {
    await sql`SELECT 1`;
    return res.status(200).json({ pinged: true });
  } catch (error) {
    console.error("keep-warm ping error:", error);
    return res.status(500).json({ pinged: false, message: "ping failed" });
  }
}
