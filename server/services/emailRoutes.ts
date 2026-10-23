import type { Express, Request } from "express";
import { Resend } from "resend";
import { Webhook } from "svix";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { storage } from "../storage";
import { emailConfig, escapeEmailHtml } from "./emailConfig";
import { sendEmail, plainTextEmail, emailIdentity, EmailDeliveryError } from "./emailDelivery";
import { initializeEmailDatabase } from "./emailDatabase";
import { verifyUnsubscribeToken } from "./emailUnsubscribe";
import { requireEmailUser } from "./verifiedEmailUser";
import { verifiedAdmin } from "./aiSettingsRoutes";
import { getNotificationPreferences, notificationPreferencesSchema, saveNotificationPreferences } from "./notificationPreferences";

function rawBody(req: Request): string {
  if (!Buffer.isBuffer(req.rawBody)) throw new Error("Raw webhook body unavailable.");
  return req.rawBody.toString("utf8");
}

export function registerEmailRoutes(app: Express) {
  app.get("/api/email/auth-status", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    let configured = false;
    try { emailConfig(); configured = Boolean(process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET); } catch {}
    res.json({ passwordResetAvailable: configured });
  });
  app.get("/api/email/preferences", requireEmailUser, async (req, res) => {
    try {
      const prefs = await getNotificationPreferences((req as any).emailUser.id);
      const sources = await storage.getFeedSources();
      res.json({ preferences: prefs, countries: Array.from(new Set(sources.flatMap(s => s.country ? [s.country] : []))).sort() });
    } catch { res.status(503).json({ error: "Notification preferences are unavailable." }); }
  });
  app.put("/api/email/preferences", requireEmailUser, async (req, res) => {
    const parsed = notificationPreferencesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Choose valid notification preferences." });
    try {
      const user = (req as any).emailUser;
      await saveNotificationPreferences(user.id, parsed.data);
      // A deliberate authenticated opt-in can reverse an unsubscribe, but never
      // override provider bounce/complaint suppressions.
      await db.execute(sql`DELETE FROM email_suppressions WHERE recipient = ${user.email.toLowerCase()} AND reason = 'unsubscribed'`);
      res.json({ preferences: parsed.data });
    } catch { res.status(503).json({ error: "Notification preferences could not be saved." }); }
  });

  // GET is a confirmation page, not a mutation (protects against link scanners).
  app.get("/api/email/unsubscribe", (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");
    if (!verifyUnsubscribeToken(token)) return res.status(400).send("This unsubscribe link is invalid or expired. Manage email preferences in Settings.");
    res.type("html").send(`<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><title>LUM News — Unsubscribe</title><body style="font:16px Arial;padding:40px;background:#f5f5f5"><h1>LUM News</h1><p>Stop all non-essential news emails? Account security emails are unaffected.</p><form method="post" action="/api/email/unsubscribe?token=${encodeURIComponent(token)}"><button style="padding:12px">Unsubscribe from news emails</button></form></body></html>`);
  });
  app.post("/api/email/unsubscribe", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const email = verifyUnsubscribeToken(typeof req.query.token === "string" ? req.query.token : "");
    if (!email) return res.status(400).send("Invalid or expired unsubscribe link.");
    try {
      await initializeEmailDatabase();
      await db.transaction(async tx => {
        await tx.execute(sql`INSERT INTO email_suppressions (recipient, reason) VALUES (${email}, 'unsubscribed')
          ON CONFLICT (recipient) DO NOTHING`);
        await tx.execute(sql`UPDATE user_preferences SET email_digest_enabled = false, updated_at = now()
          WHERE user_id IN (SELECT id FROM users WHERE lower(email) = ${email})`);
        await tx.execute(sql`UPDATE email_notification_preferences SET breaking_enabled = false, personalized_enabled = false, updated_at = now()
          WHERE user_id IN (SELECT id FROM users WHERE lower(email) = ${email})`);
      });
      res.type("text").send("You have unsubscribed from LUM News news emails. Account security emails are unchanged.");
    } catch { res.status(503).send("Unable to save your choice. Please try again."); }
  });

  app.post("/api/email/webhooks/resend", async (req, res) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ error: "Webhook is not configured." });
    let event: any;
    try {
      event = new Resend(process.env.RESEND_API_KEY || "unused").webhooks.verify({
        payload: rawBody(req), webhookSecret: secret,
        headers: { id: String(req.headers["svix-id"] || ""),
          timestamp: String(req.headers["svix-timestamp"] || ""),
          signature: String(req.headers["svix-signature"] || "") },
      });
    } catch { return res.status(400).json({ error: "Invalid webhook signature." }); }
    const id = String(req.headers["svix-id"]);
    const providerId = event?.data?.email_id;
    if (typeof providerId !== "string" || typeof event.type !== "string") return res.sendStatus(200);
    try {
      await initializeEmailDatabase();
      await db.transaction(async tx => {
        const inserted = await tx.execute(sql`INSERT INTO email_delivery_events (id, provider_id, type)
          VALUES (${id}, ${providerId}, ${event.type}) ON CONFLICT DO NOTHING RETURNING id`);
        if (!inserted.rows.length) return;
        const states: Record<string, string> = {
          "email.delivered": "delivered", "email.bounced": "bounced", "email.complained": "complained",
          "email.failed": "failed_permanent",
        };
        const status = states[event.type];
        if (status) await tx.execute(sql`UPDATE email_deliveries SET status = ${status}, updated_at = now()
          WHERE provider_id = ${providerId} AND status NOT IN ('bounced', 'complained')
          AND NOT (status = 'delivered' AND ${status} = 'failed_permanent')`);
        if (["email.bounced", "email.complained"].includes(event.type)) {
          // Only suppress recipients from our own records, not untrusted payload addresses.
          await tx.execute(sql`INSERT INTO email_suppressions (recipient, reason)
            SELECT recipient, ${event.type} FROM email_deliveries WHERE provider_id = ${providerId}
            ON CONFLICT (recipient) DO UPDATE SET reason = EXCLUDED.reason`);
        }
      });
      res.json({ received: true });
    } catch { res.status(503).json({ error: "Please retry this event." }); }
  });

  app.get("/api/admin/email-status", verifiedAdmin, async (_req, res) => {
    try {
      await initializeEmailDatabase();
      const counts = await db.execute(sql`SELECT kind, status, count(*)::int AS count FROM email_deliveries
        WHERE created_at > now() - interval '30 days' GROUP BY kind, status`);
      const recent = await db.execute(sql`SELECT kind, status, error_code, attempts, created_at, updated_at
        FROM email_deliveries ORDER BY updated_at DESC LIMIT 20`);
      const missing = ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "APP_URL", "SUPPORT_EMAIL"]
        .filter(key => !process.env[key]);
      res.json({ provider: "Resend", configured: missing.length === 0, missing,
        authHookConfigured: Boolean(process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET),
        webhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET),
        counts: counts.rows, recent: recent.rows });
    } catch { res.status(503).json({ error: "Email status unavailable." }); }
  });

  // Supabase owns token generation and expiry. We only deliver its signed hook.
  app.post("/api/email/hooks/supabase", async (req, res) => {
    const secret = process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET;
    if (!secret) return res.status(503).json({ error: { http_code: 503, message: "Email hook is not configured." } });
    let payload: any;
    try {
      payload = new Webhook(secret.replace(/^v1,whsec_/, "")).verify(rawBody(req), {
        "webhook-id": String(req.headers["webhook-id"] || ""),
        "webhook-timestamp": String(req.headers["webhook-timestamp"] || ""),
        "webhook-signature": String(req.headers["webhook-signature"] || ""),
      });
    } catch { return res.status(401).json({ error: { http_code: 401, message: "Invalid hook signature." } }); }
    const parsed = z.object({
      user: z.object({ email: z.string().email(), new_email: z.string().email().optional() }).passthrough(),
      email_data: z.object({ email_action_type: z.string(), token_hash: z.string().min(1),
        token_hash_new: z.string().optional() }).passthrough(),
    }).safeParse(payload);
    if (!parsed.success) return res.status(400).json({ error: { http_code: 400, message: "Unsupported auth email payload." } });
    const { user, email_data: email } = parsed.data;
    if (email.email_action_type === "signup") {
      return res.status(400).json({ error: { http_code: 400, message: "Disable Confirm email in Supabase. LUM News does not send signup verification emails." } });
    }
    const supported: Record<string, string> = { recovery: "Reset your LUM News password", magiclink: "Sign in to LUM News",
      invite: "You are invited to LUM News", email_change: "Confirm your email change" };
    const subject = supported[email.email_action_type];
    if (!subject || !process.env.SUPABASE_URL) return res.status(400).json({ error: { http_code: 400, message: "Unsupported email action." } });
    try {
      const config = emailConfig();
      const deliveries = email.email_action_type === "email_change" && user.new_email
        ? [{ to: user.new_email, hash: email.token_hash },
          ...(email.token_hash_new ? [{ to: user.email, hash: email.token_hash_new }] : [])]
        : [{ to: user.email, hash: email.token_hash }];
      for (const delivery of deliveries) {
        const link = new URL("/auth/v1/verify", process.env.SUPABASE_URL);
        link.searchParams.set("token", delivery.hash);
        link.searchParams.set("type", email.email_action_type);
        link.searchParams.set("redirect_to", `${config.appUrl}/${email.email_action_type === "recovery" ? "reset-password" : "home"}`);
        const html = `<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><body style="margin:0;background:#f5f5f5;font:16px Arial"><div style="max-width:600px;margin:auto;padding:32px;background:white"><h1 style="color:#1e174b">LUM News</h1><h2>${subject}</h2><p>Use this secure link to continue. If you did not request this, ignore this email.</p><p><a style="display:inline-block;padding:14px;background:#1e174b;color:white" href="${escapeEmailHtml(link.href)}">Continue securely</a></p><p>Never share this link. Need help? ${escapeEmailHtml(config.supportEmail)}</p></div></body></html>`;
        await sendEmail({ to: delivery.to, subject, html, text: plainTextEmail(html),
          kind: `auth-${email.email_action_type}`, identity: emailIdentity("auth", delivery.hash, delivery.to) });
      }
      res.json({});
    } catch (error) {
      console.error("[EmailService] Supabase email hook failed.", error instanceof EmailDeliveryError ? error.code : "configuration_or_storage_error");
      res.status(503).json({ error: { http_code: 503, message: "Email delivery unavailable. Please retry." } });
    }
  });
}
