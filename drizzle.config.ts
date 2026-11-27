import { defineConfig } from "drizzle-kit";
import { databasePoolConfig } from "./server/databaseConfig";

const connection = databasePoolConfig(process.env.DATABASE_URL, process.env.DATABASE_SSL_CA);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connection.connectionString!,
    ssl: connection.ssl,
  },
});
