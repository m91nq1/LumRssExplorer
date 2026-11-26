import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { rateLimit, sameOriginWrites } from "./requestGuards";

test("request guards reject foreign writes and throttle repeated requests", async () => {
  const app = express();
  app.use(sameOriginWrites);
  app.get("/limited", rateLimit(2), (_req, res) => res.json({ ok: true }));
  app.post("/write", (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(`${origin}/write`, { method: "POST", headers: { origin: "https://foreign.example" } })).status, 403);
    assert.equal((await fetch(`${origin}/write`, { method: "POST", headers: { origin } })).status, 200);
    assert.equal((await fetch(`${origin}/write`, { method: "POST" })).status, 200);
    assert.equal((await fetch(`${origin}/limited`)).status, 200);
    assert.equal((await fetch(`${origin}/limited`)).status, 200);
    const rejected = await fetch(`${origin}/limited`);
    assert.equal(rejected.status, 429);
    assert.ok(Number(rejected.headers.get("retry-after")) > 0);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
