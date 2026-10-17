import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { db, pool } from "../db";
import { registerAiSettingsRoutes } from "./aiSettingsRoutes";
import { encryptApiKey, resolveApiKey } from "./aiSettings";
import { AiServiceError, requestOpenAiSummary } from "./openaiClient";
import { meetsSummaryRequirements, normalizeSummary, wordCount } from "./summaryFormat";
import { articles } from "@shared/schema";
import { generateAISummary, visibleAiSummary } from "../summaryService";
import { ApiRequestError } from "../../client/src/lib/apiErrors";
import { aiSummaryErrorMessage } from "../../client/src/lib/aiSummaryErrors";

const paragraph = (count: number) => Array.from({ length: count }, (_, i) => `word${i}`).join(" ") + ".";
const fakeKey = "sk-test-only-not-a-real-key-1234567890";

test("article summary failures distinguish inaccessible text from key, model and quota errors safely", () => {
  const cases = [
    ["insufficient_article_text", /enough accessible text/],
    ["summary_format_failed", /120–180-word/],
    ["invalid_api_key", /working OpenAI API key/],
    ["not_configured", /working OpenAI API key/],
    ["model_unavailable", /model is unavailable/],
    ["quota_exceeded", /usage limit/],
    ["summaries_disabled", /switched off/],
  ] as const;
  for (const [code, expected] of cases) {
    const error = new ApiRequestError(422, JSON.stringify({ code, error: fakeKey }));
    const message = aiSummaryErrorMessage(error);
    assert.match(message, expected);
    assert.equal(message.includes(fakeKey), false, "raw error bodies must never be displayed");
    assert.match(message, /original article link/);
  }
  const generic = aiSummaryErrorMessage(new Error(fakeKey));
  assert.match(generic, /temporarily unavailable/);
  assert.equal(aiSummaryErrorMessage(new ApiRequestError(502, "<html>proxy failure</html>")), generic);
  assert.equal(aiSummaryErrorMessage(new ApiRequestError(500, JSON.stringify({ code: fakeKey }))), generic);
});

test("summary guardrails preserve paragraphs and reject short, long and malformed output", () => {
  for (const size of [60, 75, 90]) {
    const summary = `${paragraph(size)}\n\n${paragraph(size)}`;
    assert.equal(meetsSummaryRequirements(summary), true);
    assert.equal(wordCount(summary), size * 2);
    assert.equal(normalizeSummary(`  ${summary}  `), summary);
  }
  for (const [first, second] of [[54, 68], [95, 65], [55, 65], [100, 80]]) {
    assert.equal(meetsSummaryRequirements(`${paragraph(first)}\n\n${paragraph(second)}`), true,
      "The 120-180 word range applies to the complete summary, not each paragraph");
  }
  for (const summary of [
    `${paragraph(59)}\n\n${paragraph(60)}`,
    `${paragraph(91)}\n\n${paragraph(90)}`,
    paragraph(150),
    `${paragraph(60)}\n\n${paragraph(60)}\n\n${paragraph(60)}`,
    `# Summary ${paragraph(75)}\n\n${paragraph(75)}`,
  ]) assert.equal(meetsSummaryRequirements(summary), false);
  const long = `${paragraph(110)}\n\n${paragraph(110)}`;
  assert.equal(wordCount(normalizeSummary(long)), 220, "normalization must not truncate words or sentences");
});

test("saved credentials use authenticated encryption and reject tampering", () => {
  const encryptedKey = encryptApiKey(fakeKey);
  assert.equal(encryptedKey.includes(fakeKey), false);
  assert.equal(resolveApiKey({ model: "gpt-5-nano", enabled: false, verifiedAt: null, encryptedKey }), fakeKey);
  const parts = encryptedKey.split(".");
  parts[2] = Buffer.from("tampered").toString("base64");
  assert.throws(() => resolveApiKey({ model: "gpt-5-nano", enabled: false, verifiedAt: null, encryptedKey: parts.join(".") }), /Unable to decrypt/);
});

test("Responses API uses nano-safe parameters, reports tokens and sanitizes errors", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      const body = JSON.parse(String(options?.body));
      assert.equal(body.model, "gpt-5-nano");
      assert.equal(body.store, false);
      assert.equal(body.reasoning.effort, "minimal");
      assert.equal("temperature" in body, false);
      return new Response(JSON.stringify({
        status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "Summary" }] }],
        usage: { input_tokens: 100, output_tokens: 25 },
      }), { status: 200 });
    };
    const result = await requestOpenAiSummary(fakeKey, "gpt-5-nano", "instructions", "article");
    assert.deepEqual(result.usage, { inputTokens: 100, outputTokens: 25, requests: 1 });
    assert.equal(result.text, "Summary");
    for (const status of [401, 403, 429, 500]) {
      globalThis.fetch = async () => new Response(fakeKey, { status });
      await assert.rejects(requestOpenAiSummary(fakeKey, "gpt-5-nano", "instructions", "article"), error =>
        error instanceof AiServiceError && !error.message.includes(fakeKey));
    }
  } finally { globalThis.fetch = originalFetch; }
});

test("admin-only Secrets lifecycle verifies model before enabling and never returns key material", async () => {
  const data = new Map<string, string>();
  const originalSelect = db.select;
  const originalInsert = db.insert;
  const originalExecute = db.execute;
  const originalUpdate = db.update;
  const originalTransaction = db.transaction;
  const originalFetch = globalThis.fetch;
  const articleFixture = {
    id: "test-summary-article", title: "Test headline", sourceName: "Test publisher",
    content: paragraph(180), aiSummary: null as string | null,
  };
  (db as any).select = () => ({
    from: (table: any) => ({ where: (condition: any) => ({ limit: () => {
      if (table === articles) return Promise.resolve([articleFixture]);
      // Drizzle equality wraps the key in a Param; find it without querying a DB.
      const key = condition.queryChunks.find((part: any) => typeof part?.value === "string")?.value;
      return Promise.resolve(data.has(key) ? [{ value: data.get(key) }] : []);
    } }) }),
  });
  (db as any).insert = () => ({ values: (row: any) => ({
    onConflictDoUpdate: async () => { data.set(row.key, row.value); },
  }) });
  (db as any).update = () => ({ set: (changes: any) => ({ where: async () => {
    articleFixture.aiSummary = changes.aiSummary;
  } }) });
  (db as any).transaction = async (fn: any) => fn(db);
  (db as any).execute = async () => {
    const key = "openai_summary_usage";
    const usage = JSON.parse(data.get(key) || '{"inputTokens":0,"outputTokens":0,"requests":0}');
    usage.inputTokens += 5; usage.outputTokens += 1; usage.requests += 1;
    data.set(key, JSON.stringify(usage));
    return { rows: [] };
  };
  let unavailable = false;
  let invalidSummary = false;
  let summaryCalls = 0;
  const summaryModels: string[] = [];
  globalThis.fetch = async (url, options) => {
    if (unavailable) return new Response("provider error containing secret", { status: 403 });
    if (String(url).includes("/models/")) return new Response(JSON.stringify({ id: "gpt-5-nano" }));
    const isSummary = String(options?.body).includes("Headline:");
    if (isSummary) {
      summaryCalls++;
      summaryModels.push(JSON.parse(String(options?.body)).model);
    }
    const text = isSummary ? invalidSummary ? paragraph(10) : `${paragraph(54)}\n\n${paragraph(68)}` : "OK";
    return new Response(JSON.stringify({
      status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }],
      usage: { input_tokens: 5, output_tokens: 1 },
    }));
  };
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    // Isolated test fixture only: emulate the existing verified session API.
    req.isAuthenticated = (() => req.headers["x-test-role"] !== undefined) as any;
    (req as any).user = { claims: { email: req.headers["x-test-role"] === "admin" ? "admin@example.test" : "member@example.test" } };
    next();
  });
  registerAiSettingsRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address() as { port: number };
  async function call(method: string, path = "", body?: object, role?: string) {
    const response = await originalFetch(`http://127.0.0.1:${address.port}/api/admin/ai-settings${path}`, {
      method, headers: { "Content-Type": "application/json", ...(role ? { "x-test-role": role } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json();
    assert.equal(JSON.stringify(payload).includes(fakeKey), false);
    assert.equal("encryptedKey" in payload, false);
    return { status: response.status, payload };
  }
  try {
    for (const method of ["GET", "PUT", "DELETE"]) assert.equal((await call(method)).status, 401);
    assert.equal((await call("POST", "/test")).status, 401);
    assert.equal((await call("GET", "?supabaseId=forged-admin")).status, 401);
    assert.equal((await call("GET", "", undefined, "member")).status, 403);
    assert.equal((await call("PUT", "", { model: "gpt-5", enabled: true }, "member")).status, 403);
    const saved = await call("PUT", "", { apiKey: fakeKey, model: "gpt-5-nano", enabled: false }, "admin");
    assert.equal(saved.status, 200);
    assert.equal(saved.payload.keySource, "encrypted");
    assert.equal(saved.payload.verifiedAt, null);
    assert.equal(data.get("openai_summary_config")?.includes(fakeKey), false);
    await assert.rejects(generateAISummary(articleFixture.id), /disabled/);
    const tested = await call("POST", "/test", {}, "admin");
    assert.equal(tested.status, 200);
    assert.ok(tested.payload.verifiedAt);
    assert.equal(tested.payload.enabled, false, "testing must not implicitly enable summaries");
    const enabled = await call("PUT", "", { model: "gpt-5-nano", enabled: true }, "admin");
    assert.equal(enabled.payload.enabled, true);
    assert.ok(enabled.payload.usage.requests >= 2);
    const simultaneous = await Promise.all([generateAISummary(articleFixture.id), generateAISummary(articleFixture.id)]);
    assert.equal(simultaneous[0].cached, false);
    assert.equal(simultaneous[1].summary, simultaneous[0].summary);
    assert.equal(summaryCalls, 1, "concurrent article requests must share generation");
    const cached = await generateAISummary(articleFixture.id);
    assert.equal(cached.cached, true);
    assert.equal(summaryCalls, 1, "cached result must not call OpenAI again");
    invalidSummary = true;
    await assert.rejects(generateAISummary("other-test-article"), /required format/);
    assert.equal(summaryCalls, 3, "invalid output must receive only one corrective retry");
    assert.equal(articleFixture.aiSummary, simultaneous[0].summary, "failed output must not replace cached content");
    invalidSummary = false;
    for (const model of ["gpt-5-mini", "gpt-5", "gpt-5-nano"]) {
      const changed = await call("PUT", "", { model, enabled: true }, "admin");
      assert.equal(changed.status, 200);
      assert.equal(changed.payload.model, model);
      assert.equal(await visibleAiSummary(articleFixture), null, "a previous-model cache must not be displayed");
      const before = summaryCalls;
      const regenerated = await generateAISummary(articleFixture.id);
      assert.equal(regenerated.cached, false, "switching models must generate a summary with the new model");
      assert.equal(summaryModels.at(-1), model, "the saved administrator choice must reach OpenAI");
      assert.equal(await visibleAiSummary(articleFixture), regenerated.summary);
      assert.equal((await generateAISummary(articleFixture.id)).cached, true);
      assert.equal(summaryCalls, before + 1, "repeated requests must reuse the selected-model cache");
    }
    const unsupported = await call("PUT", "", { model: "unsupported-model", enabled: true }, "admin");
    assert.equal(unsupported.status, 400);
    assert.equal((await call("GET", "", undefined, "admin")).payload.model, "gpt-5-nano");
    unavailable = true;
    const denied = await call("PUT", "", { model: "gpt-5-mini", enabled: true }, "admin");
    assert.equal(denied.status, 400);
    assert.equal((await call("GET", "", undefined, "admin")).payload.model, "gpt-5-nano");
    const removed = await call("DELETE", "", undefined, "admin");
    assert.equal(removed.payload.keyConfigured, false);
    assert.equal(removed.payload.enabled, false);
    assert.equal(removed.payload.verifiedAt, null);
    assert.equal(JSON.parse(data.get("openai_summary_config")!).encryptedKey, undefined);
  } finally {
    db.select = originalSelect;
    db.insert = originalInsert;
    db.execute = originalExecute;
    db.update = originalUpdate;
    db.transaction = originalTransaction;
    globalThis.fetch = originalFetch;
    await new Promise<void>(resolve => server.close(() => resolve()));
    await pool.end();
  }
});
