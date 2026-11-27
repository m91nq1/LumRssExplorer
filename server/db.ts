import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { databasePoolConfig } from "./databaseConfig";

export const pool = new pg.Pool(databasePoolConfig(
  process.env.DATABASE_URL,
  process.env.DATABASE_SSL_CA,
));
// An idle socket may be closed by the upstream pooler. Handle its error event
// without exposing credentials, SQL, hostnames or terminating the process.
pool.on("error", () => {
  console.error("[Database] An idle PostgreSQL connection closed unexpectedly; the pool will reconnect on demand.");
});
export const db = drizzle({ client: pool, schema });
