import type { PoolConfig } from "pg";
import { supabaseCertificate } from "./supabaseCertificate";

// Shared by Drizzle, session storage and the read-only connection diagnostic.
// Never log the returned config: it contains the database password.
export function databasePoolConfig(
  connectionString: string | undefined,
  certificateAuthority?: string,
  environment = process.env.NODE_ENV,
): PoolConfig {
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use postgres:// or postgresql://, not HTTPS or WebSockets.");
  }
  const disableSsl = url.searchParams.get("sslmode") === "disable";
  if (disableSsl && environment === "production") {
    throw new Error("Production database connections require verified TLS; remove sslmode=disable.");
  }
  if (["sslcert", "sslkey", "sslrootcert"].some(key => url.searchParams.has(key))) {
    throw new Error("Use DATABASE_SSL_CA with PEM certificate contents instead of URL certificate file options.");
  }
  // pg URL SSL options override the explicit ssl object. Remove them so neither
  // sslmode=require nor ssl=no-verify can silently disable certificate checking.
  for (const key of ["sslmode", "ssl", "uselibpqcompat", "sslnegotiation"]) {
    url.searchParams.delete(key);
  }
  const isSupabase = url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".pooler.supabase.com");
  const ca = certificateAuthority || (isSupabase ? supabaseCertificate : undefined);
  return {
    connectionString: url.toString(),
    ssl: disableSsl ? false : {
      rejectUnauthorized: true,
      ...(ca ? { ca: ca.replace(/\\n/g, "\n") } : {}),
    },
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    keepAlive: true,
    application_name: "lum-news",
  };
}
