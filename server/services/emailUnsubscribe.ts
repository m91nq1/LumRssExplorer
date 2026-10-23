import { createHmac, timingSafeEqual } from "node:crypto";
import { emailConfig } from "./emailConfig";

function signingKey() {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Configure a stable EMAIL_UNSUBSCRIBE_SECRET or SESSION_SECRET (at least 32 characters).");
  return secret;
}
export function createUnsubscribeToken(email: string, now = Date.now()): string {
  const data = Buffer.from(JSON.stringify({
    email: email.toLowerCase(), expires: now + 120 * 24 * 60 * 60 * 1000,
  })).toString("base64url");
  const sig = createHmac("sha256", signingKey()).update(data).digest("base64url");
  return `${data}.${sig}`;
}
export function verifyUnsubscribeToken(token: string, now = Date.now()): string | null {
  try {
    if (token.length > 1500) return null;
    const [data, sig, extra] = token.split(".");
    if (!data || !sig || extra) return null;
    const expected = createHmac("sha256", signingKey()).update(data).digest();
    const supplied = Buffer.from(sig, "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return typeof payload.email === "string" && payload.expires > now ? payload.email : null;
  } catch { return null; }
}
export function unsubscribeUrl(email: string): string {
  return `${emailConfig().appUrl}/api/email/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`;
}
