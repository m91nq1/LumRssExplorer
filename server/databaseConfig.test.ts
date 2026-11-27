import assert from "node:assert/strict";
import test from "node:test";
import { databasePoolConfig } from "./databaseConfig";
import { supabaseCertificate } from "./supabaseCertificate";
import { X509Certificate } from "node:crypto";

test("Supabase session pooler uses PostgreSQL TCP and verified TLS", () => {
  const config = databasePoolConfig(
    "postgresql://postgres.example:synthetic%23password@pooler.example.test:5432/postgres?sslmode=require",
  );
  const url = new URL(config.connectionString!);
  assert.equal(url.protocol, "postgresql:");
  assert.equal(url.port, "5432");
  assert.equal(url.username, "postgres.example");
  assert.equal(decodeURIComponent(url.password), "synthetic#password");
  assert.equal(url.searchParams.has("sslmode"), false);
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
  assert.equal(config.max, 5);
  assert.equal(config.connectionTimeoutMillis, 10_000);
});

test("connection URL cannot override verified TLS", () => {
  const config = databasePoolConfig(
    "postgres://user:synthetic@db.example.test/db?ssl=no-verify&sslmode=no-verify&uselibpqcompat=true",
    "-----BEGIN CERTIFICATE-----\\nsynthetic\\n-----END CERTIFICATE-----",
  );
  assert.equal(new URL(config.connectionString!).search, "");
  assert.deepEqual(config.ssl, {
    rejectUnauthorized: true,
    ca: "-----BEGIN CERTIFICATE-----\nsynthetic\n-----END CERTIFICATE-----",
  });
});

test("plaintext is allowed only when explicitly requested outside production", () => {
  assert.equal(databasePoolConfig("postgres://user:synthetic@localhost/db?sslmode=disable", undefined, "development").ssl, false);
  assert.throws(() => databasePoolConfig("postgres://user:synthetic@remote.test/db?sslmode=disable", undefined, "production"), /verified TLS/);
});

test("Supabase endpoints trust its public CA while still verifying the server", () => {
  const certificate = new X509Certificate(supabaseCertificate);
  assert.ok(certificate.ca);
  const config = databasePoolConfig("postgres://user:synthetic@aws-0-example.pooler.supabase.com:5432/postgres");
  assert.deepEqual(config.ssl, { rejectUnauthorized: true, ca: supabaseCertificate });
  assert.deepEqual(databasePoolConfig("postgres://user:synthetic@not-supabase.test/db").ssl, { rejectUnauthorized: true });
});

test("invalid configuration errors never echo credentials", () => {
  for (const input of [undefined, "secret-invalid-url", "https://user:secret@db.test", "wss://user:secret@db.test/v2"]) {
    assert.throws(() => databasePoolConfig(input), error =>
      error instanceof Error && !error.message.includes("secret"));
  }
  assert.throws(
    () => databasePoolConfig("postgres://user:secret@db.test/db?sslrootcert=/private/cert"),
    /DATABASE_SSL_CA/,
  );
});
