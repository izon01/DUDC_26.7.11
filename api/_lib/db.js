import { sql } from "@vercel/postgres";

let schemaReady = null;

// Lazily creates the content tables on first use so a fresh deploy doesn't
// need a separate manual migration step. Cheap no-op once the tables exist.
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = Promise.all([
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
    ]).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
