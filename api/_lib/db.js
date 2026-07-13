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
    ]).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
