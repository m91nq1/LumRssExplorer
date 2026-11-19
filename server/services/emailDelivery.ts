import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { initializeEmailDatabase } from "./emailDatabase";
import { emailConfig } from "./emailConfig";

export type DeliveryResult = "sent" | "duplicate" | "suppressed";
export interface EmailMessage {
  to: string; subject: string; html: string; text: string;
  kind: string; identity: string; nonEssential?: boolean;
  headers?: Record<string, string>;
}

export function emailIdentity(kind: string, identity: string, recipient: string): string {
  return createHash("sha256").update(`${kind}:${identity}:${recipient.trim().toLowerCase()}`).digest("hex");
}

export class EmailDeliveryError extends Error {
  constructor(public code: string) {
    super(`Email delivery failed (${code}). Check Gmail App Password configuration or delivery records.`);
  }
}

/** SDK errors can contain request details; only allowlisted codes reach logs. */
export function safeEmailError(code?: string): string {
  return ["validation_error", "missing_api_key", "invalid_api_key", "restricted_api_key",
    "rate_limit_exceeded", "daily_quota_exceeded", "monthly_quota_exceeded",
    "application_error", "internal_server_error", "smtp_auth_failed", "smtp_rejected",
    "smtp_temporary_failure", "delivery_status_unknown"].includes(code || "") ? code! : "provider_error";
}

export function plainTextEmail(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(?:p|div|tr|h[1-6])>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

let sendQueue = Promise.resolve();
let nextSendAt = 0;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// A single-process rate limiter plus bounded retries; database claims protect
// duplicate logical sends across workers. SMTP has no provider idempotency API.
export function sendEmail(message: EmailMessage): Promise<DeliveryResult> {
  const result = sendQueue.then(() => deliverEmail(message));
  sendQueue = result.then(() => {}, () => {});
  return result;
}

async function deliverEmail(message: EmailMessage): Promise<DeliveryResult> {
  const config = emailConfig(); // fail explicitly, never silently "skip" a send
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(message.to)) throw new EmailDeliveryError("invalid_recipient");
  await initializeEmailDatabase();
  const recipient = message.to.trim().toLowerCase();
  const id = emailIdentity(message.kind, message.identity, recipient);
  if (message.nonEssential) {
    const suppressed = await db.execute(sql`SELECT 1 FROM email_suppressions WHERE recipient = ${recipient}`);
    if (suppressed.rows.length) return "suppressed";
  }
  // Atomic cross-worker quota check and claim. These are application budgets,
  // not an assertion about the account's actual plan limits or other apps.
  const claimed = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(7619234)`);
    const existing = await tx.execute(sql`SELECT status, updated_at, created_at FROM email_deliveries WHERE id = ${id}`);
    const row = existing.rows[0] as {status: string; updated_at: string; created_at: string} | undefined;
    if (row && (row.status === "delivery_unknown" || row.status === "pending")) {
      // A crash or connection loss may occur after Gmail accepts the message.
      // Never automatically resend an ambiguous SMTP attempt.
      throw new EmailDeliveryError("delivery_status_unknown");
    }
    if (row && (["sent", "delivered", "bounced", "complained"].includes(row.status)
      || (row.status === "pending" && Date.now() - new Date(row.updated_at).getTime() < 120_000))) return false;
    const usage = await tx.execute(sql`SELECT
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS daily,
      COUNT(*)::int AS monthly FROM email_deliveries
      WHERE created_at >= date_trunc('month', now())`);
    const counts = usage.rows[0] as {daily: number; monthly: number};
    const dailyLimit = Number(process.env.EMAIL_DAILY_LIMIT || 90);
    const monthlyLimit = Number(process.env.EMAIL_MONTHLY_LIMIT || 2900);
    if (!Number.isFinite(dailyLimit) || !Number.isFinite(monthlyLimit)
      || counts.daily >= dailyLimit || counts.monthly >= monthlyLimit) throw new EmailDeliveryError("application_budget_exceeded");
    await tx.execute(sql`INSERT INTO email_deliveries (id, recipient, kind) VALUES (${id}, ${recipient}, ${message.kind})
      ON CONFLICT (id) DO UPDATE SET status = 'pending', updated_at = now()`);
    return true;
  });
  if (!claimed) return "duplicate";
  const client = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000,
    logger: false, debug: false,
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    await delay(Math.max(0, nextSendAt - Date.now()));
    nextSendAt = Date.now() + 600;
    await db.execute(sql`UPDATE email_deliveries SET attempts = attempts + 1, updated_at = now() WHERE id = ${id}`);
    let code = "delivery_status_unknown";
    let retryable = false;
    let accepted = false;
    try {
      const data = await client.sendMail({
        from: config.from, to: recipient, replyTo: config.supportEmail,
        subject: message.subject, html: message.html, text: message.text,
        headers: message.headers, messageId: `<${id}@${config.user.split("@")[1]}>`,
      });
      accepted = Boolean(data.accepted?.length);
      if (accepted) {
        await db.execute(sql`UPDATE email_deliveries
          SET provider_id = ${String(data.messageId)}, status = 'sent', error_code = NULL, updated_at = now()
          WHERE id = ${id}`);
        return "sent";
      }
      code = "smtp_rejected";
    } catch (error) {
      // Never serialize SMTP responses, credentials, recipients or reset links.
      const smtp = error as { code?: string; responseCode?: number };
      if (!accepted && smtp.code === "EAUTH") code = "smtp_auth_failed";
      else if (!accepted && smtp.responseCode && smtp.responseCode >= 400 && smtp.responseCode < 500) {
        code = "smtp_temporary_failure"; retryable = true;
      } else if (!accepted && smtp.responseCode && smtp.responseCode >= 500) code = "smtp_rejected";
    }
    await db.execute(sql`UPDATE email_deliveries
      SET status = ${code === "delivery_status_unknown" ? "delivery_unknown" : retryable ? "failed_retryable" : "failed_permanent"}, error_code = ${code}, updated_at = now()
      WHERE id = ${id}`);
    if (!retryable || attempt === 2) throw new EmailDeliveryError(code);
    await delay(1000 * 2 ** attempt);
  }
  throw new EmailDeliveryError("provider_error");
}
