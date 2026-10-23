import { sql } from "drizzle-orm";
import { db } from "../db";

let ready: Promise<void> | undefined;
/** Additive only: reuse the application's existing PostgreSQL database. */
export function initializeEmailDatabase(): Promise<void> {
  return ready ??= (async () => {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS email_notification_preferences (
      user_id integer PRIMARY KEY REFERENCES users(id),
      frequency text NOT NULL DEFAULT 'daily',
      countries text[] NOT NULL DEFAULT '{}',
      breaking_enabled boolean NOT NULL DEFAULT false,
      personalized_enabled boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS email_deliveries (
      id text PRIMARY KEY, recipient text NOT NULL, kind text NOT NULL,
      provider_id text, status text NOT NULL DEFAULT 'pending',
      attempts integer NOT NULL DEFAULT 0, error_code text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS email_deliveries_provider_idx ON email_deliveries(provider_id)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS email_delivery_events (
      id text PRIMARY KEY, provider_id text NOT NULL, type text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS email_suppressions (
      recipient text PRIMARY KEY, reason text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  })().catch(error => { ready = undefined; throw error; });
}
