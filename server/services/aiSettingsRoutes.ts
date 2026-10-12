import type { Express, Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  AI_MODELS, encryptApiKey, getAiConfig, saveAiConfig, resolveApiKey,
  publicAiSettings, recordAiError, recordUsage,
} from "./aiSettings";
import { AiServiceError, requestOpenAiSummary, verifyModelAccess } from "./openaiClient";

// Secrets endpoints must never trust x-supabase-id, x-username, or query identities.
async function verifiedAdmin(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  const allowedEmails = (process.env.ADMIN_EMAILS || "ljmginqi0.1@gmail.com,lumginqi1@gmail.com,8468bbr9@gmail.com")
    .split(",").map(email => email.trim().toLowerCase());
  try {
    let email: string | undefined;
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (token && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) return res.status(401).json({ error: "Please sign in again." });
      if (!data.user.email_confirmed_at) return res.status(403).json({ error: "A verified administrator email is required." });
      email = data.user.email;
    } else if (req.isAuthenticated?.()) {
      email = (req.user as any)?.claims?.email;
    } else {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!email || !allowedEmails.includes(email.toLowerCase())) {
      return res.status(403).json({ error: "Authorised administrator access required." });
    }
    // Reject browser cross-origin writes (including session-authenticated CSRF).
    if (req.method !== "GET" && req.headers.origin) {
      const origin = new URL(req.headers.origin);
      if (origin.host !== req.get("host")) return res.status(403).json({ error: "Cross-origin settings changes are not allowed." });
    }
    next();
  } catch {
    res.status(401).json({ error: "Unable to verify administrator session." });
  }
}

const settingsSchema = z.object({
  model: z.string().refine(model => AI_MODELS.includes(model), "Unsupported model."),
  enabled: z.boolean(),
  apiKey: z.string().trim().min(20).max(512).regex(/^sk-[A-Za-z0-9_-]+$/).optional(),
}).strict();

async function testConfig(config: Awaited<ReturnType<typeof getAiConfig>>) {
  const key = resolveApiKey(config);
  if (!key) throw new AiServiceError("Save an OpenAI API key before testing or enabling summaries.", 400);
  await verifyModelAccess(key, config.model);
  const result = await requestOpenAiSummary(key, config.model, "Reply with the word OK only.", "Connection test.");
  await recordUsage(result.usage);
  if (!result.complete || !result.text) throw new AiServiceError("OpenAI did not complete the connection test.");
  config.verifiedAt = new Date().toISOString();
}

export function registerAiSettingsRoutes(app: Express) {
  // Serialize admin changes/tests so an older test cannot re-enable a removed key.
  let queue = Promise.resolve();
  const handler = (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response) => {
      queue = queue.then(async () => {
        try { await fn(req, res); }
        catch (error) {
          const message = error instanceof AiServiceError ? error.message : "AI settings could not be updated. Please try again.";
          try { await recordAiError(message); } catch { /* Do not disclose DB errors. */ }
          const status = error instanceof AiServiceError ? error.status : 500;
          // Authentication already succeeded. Provider access errors must not
          // be confused with loss of the administrator's application session.
          res.status(status === 401 || status === 403 ? 400 : status).json({ error: message });
        }
      });
    };

  app.get("/api/ai-summary/status", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const config = await getAiConfig();
      res.json({ enabled: config.enabled && Boolean(config.verifiedAt), model: config.model });
    } catch { res.status(503).json({ error: "AI summaries are temporarily unavailable." }); }
  });
  app.get("/api/admin/ai-settings", verifiedAdmin, handler(async (_req, res) => {
    res.json(await publicAiSettings());
  }));
  app.put("/api/admin/ai-settings", verifiedAdmin, handler(async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Choose a supported model and supply a valid OpenAI key if updating it." }); return; }
    const current = await getAiConfig();
    const next = { ...current, model: parsed.data.model, enabled: parsed.data.enabled };
    if (parsed.data.apiKey) {
      next.encryptedKey = encryptApiKey(parsed.data.apiKey);
      next.environmentKeyDisabled = true;
      next.verifiedAt = null;
    }
    if (next.model !== current.model) next.verifiedAt = null;
    if (next.enabled) await testConfig(next);
    await saveAiConfig(next);
    await recordAiError(null);
    res.json(await publicAiSettings(next));
  }));
  app.post("/api/admin/ai-settings/test", verifiedAdmin, handler(async (_req, res) => {
    const config = await getAiConfig();
    await testConfig(config);
    await saveAiConfig(config);
    await recordAiError(null);
    res.json({ ...await publicAiSettings(config), message: "OpenAI connection and model access verified." });
  }));
  app.delete("/api/admin/ai-settings", verifiedAdmin, handler(async (_req, res) => {
    const config = await getAiConfig();
    delete config.encryptedKey;
    config.environmentKeyDisabled = true;
    config.enabled = false;
    config.verifiedAt = null;
    await saveAiConfig(config);
    await recordAiError(null);
    res.json(await publicAiSettings(config));
  }));
}
