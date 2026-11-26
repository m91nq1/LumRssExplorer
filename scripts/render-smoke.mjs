// Smoke-test the REAL production bundle without Replit identity or scheduled jobs.
// Does not send email, generate AI text, mutate articles, or reset database data.
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const env = { ...process.env, NODE_ENV: "production", PORT: "5101",
  ENABLE_REPLIT_AUTH: "false", RUN_BACKGROUND_JOBS: "false" };
for (const key of Object.keys(env)) if (/^(REPLIT_|REPL_ID$)/.test(key)) delete env[key];
const child = spawn(process.execPath, ["dist/index.js"], {
  env, stdio: ["ignore", "pipe", "pipe"],
});
// Capture only in memory; do not print potentially sensitive server/provider details.
let exited = false;
child.once("exit", () => { exited = true; });
child.stdout.resume();
child.stderr.resume();
const base = "http://127.0.0.1:5101";
const request = (path, options) => fetch(`${base}${path}`, {
  signal: AbortSignal.timeout(15_000), ...options,
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (exited) throw new Error("Production process exited before opening its port.");
    try { ready = (await request("/healthz")).ok; } catch {}
    if (ready) break;
    await delay(1000);
  }
  assert.ok(ready, "Production server must become healthy.");
  const index = await request("/");
  assert.equal(index.status, 200);
  const html = await index.text();
  assert.match(html, /<div id="root">/);
  assert.equal(index.headers.get("x-powered-by"), null);
  assert.equal(index.headers.get("x-content-type-options"), "nosniff");
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(asset, "Built JavaScript asset is referenced.");
  assert.equal((await request(asset)).status, 200);
  assert.equal((await request("/login")).status, 200);
  assert.equal((await request("/api/missing-endpoint")).status, 404);
  const listing = await request("/api/articles?page=1&pageSize=1");
  assert.equal(listing.status, 200);
  assert.ok(Array.isArray((await listing.json()).articles), "Articles API reaches the existing database.");
  assert.equal((await request("/api/auth/user")).status, 401);
  assert.equal((await request("/api/feeds?supabaseId=forged-id")).status, 401);
  assert.equal((await request("/api/admin/check?supabaseId=forged-id")).status, 401);
  const login = await request("/api/login", { redirect: "manual" });
  assert.equal(login.status, 302);
  assert.equal(login.headers.get("location"), "/login");
  const malformed = await request("/api/auth/supabase-login", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{invalid",
  });
  assert.equal(malformed.status, 400);
  assert.equal((await request("/healthz")).status, 200, "Malformed requests must not crash the server.");
  console.log("PASS: production startup without Replit env; SPA, asset, database-backed articles API, health, admin protection, login routing, safe malformed-JSON handling.");
} finally {
  if (!exited) {
    const exit = new Promise(resolve => child.once("exit", resolve));
    child.kill("SIGTERM");
    await Promise.race([exit, delay(3000)]);
    if (!exited) child.kill("SIGKILL");
  }
}
