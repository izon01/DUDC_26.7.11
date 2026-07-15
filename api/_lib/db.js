import { sql } from "@vercel/postgres";

let schemaReady = null;

// Lazily creates the content tables on first use so a fresh deploy doesn't
// need a separate manual migration step. Cheap no-op once the tables exist.
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await Promise.all([
        sql`
          CREATE TABLE IF NOT EXISTS work_manuals (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            spreads JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `,
        sql`
          CREATE TABLE IF NOT EXISTS culture_posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            body_html TEXT NOT NULL DEFAULT '',
            check_points JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `,
        sql`
          CREATE TABLE IF NOT EXISTS community_posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            author_name TEXT NOT NULL,
            author_email TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `,
        sql`
          CREATE TABLE IF NOT EXISTS community_comments (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
            author_name TEXT NOT NULL,
            author_email TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `,
      ]);

      // Admin-managed sidebar reorder feature: both lists need a persisted
      // sort position. Added as a nullable column (rather than in the
      // CREATE TABLE above) so it backfills cleanly on tables that already
      // existed before this feature shipped.
      await Promise.all([
        sql`ALTER TABLE work_manuals ADD COLUMN IF NOT EXISTS sort_order INTEGER`,
        sql`ALTER TABLE culture_posts ADD COLUMN IF NOT EXISTS sort_order INTEGER`,
      ]);

      // One-time backfill for any row inserted before sort_order existed —
      // WHERE ... IS NULL makes this a no-op once every row has a value.
      await Promise.all([
        sql`
          UPDATE work_manuals AS w
          SET sort_order = ranked.rn
          FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn FROM work_manuals) AS ranked
          WHERE w.id = ranked.id AND w.sort_order IS NULL
        `,
        sql`
          UPDATE culture_posts AS c
          SET sort_order = ranked.rn
          FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn FROM culture_posts) AS ranked
          WHERE c.id = ranked.id AND c.sort_order IS NULL
        `,
      ]);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
