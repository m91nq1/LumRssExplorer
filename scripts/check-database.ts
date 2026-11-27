// Read-only diagnostic. Never prints connection strings, credentials or raw errors.
// Optional argument selects an existing env var for a one-off test; runtime uses
// DATABASE_URL exclusively. No schema creation, data writes or provider fallback.
import pg from "pg";
import { lookup } from "node:dns/promises";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { databasePoolConfig } from "../server/databaseConfig";
import { articles } from "../shared/schema";

const key = process.argv[2] || "DATABASE_URL";
if (!["DATABASE_URL", "SUPABASE_DATABASE_URL", "NEON_DATABASE_URL"].includes(key)) {
  console.error("Select DATABASE_URL, SUPABASE_DATABASE_URL or NEON_DATABASE_URL.");
  process.exit(1);
}
let pool: pg.Pool | undefined;
try {
  const config = databasePoolConfig(process.env[key], process.env.DATABASE_SSL_CA);
  const url = new URL(config.connectionString!);
  const kind = url.hostname.endsWith(".pooler.supabase.com") ? "Supabase shared pooler"
    : url.hostname.endsWith(".supabase.co") ? "Supabase direct"
    : url.hostname.endsWith(".neon.tech") ? "Neon PostgreSQL" : "PostgreSQL";
  console.log(`Target: ${key}; type: ${kind}; TCP port: ${url.port || "5432"}; TLS certificate verification: ${config.ssl === false ? "disabled explicitly for development" : "enabled"}.`);
  const addresses = await lookup(url.hostname, { all: true });
  console.log(`DNS: IPv4 ${addresses.some(a => a.family === 4) ? "available" : "absent"}; IPv6 ${addresses.some(a => a.family === 6) ? "available" : "absent"}.`);
  pool = new pg.Pool(config);
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await client.query("SELECT 1 AS ok");
    if (result.rows[0]?.ok !== 1) throw new Error("Unexpected database response.");
    const tls = await client.query("SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()");
    if (config.ssl !== false && tls.rows[0]?.ssl !== true) throw new Error("TLS was not active.");
    // Exercise the real ORM adapter and existing articles table without exposing data.
    await drizzle({ client }).select({ id: articles.id }).from(articles).limit(1);
    await drizzle({ client }).execute(sql`SELECT 1 AS ok`);
    await client.query("ROLLBACK");
    console.log(`PASS: SELECT 1, ${tls.rows[0]?.ssl ? "active TLS" : "explicit development plaintext"}, Drizzle query against existing articles; read-only transaction, no data changes.`);
  } finally {
    client.release();
  }
} catch (error) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const safeCodes = new Set(["ENETUNREACH", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "28P01", "3D000", "42P01", "SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "ERR_TLS_CERT_ALTNAME_INVALID"]);
  console.error(`FAIL: database check${safeCodes.has(code) ? ` (${code})` : ""}. No credentials or raw provider errors were logged.`);
  console.error("Check the saved connection URL, database password, Session Pooler endpoint on port 5432, and DATABASE_SSL_CA if a private CA is required.");
  process.exitCode = 1;
} finally {
  await pool?.end();
}
