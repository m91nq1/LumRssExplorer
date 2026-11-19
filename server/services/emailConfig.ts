export function emailConfig() {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASS?.replace(/\s/g, "");
  // Gmail sends as the authenticated Google account; arbitrary From aliases
  // require separate Google configuration and are deliberately not accepted.
  const from = `LUM News <${user}>`;
  const supportEmail = process.env.SUPPORT_EMAIL || user;
  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (!user || !password || !appUrl || !supportEmail) {
    throw new Error("Email configuration incomplete: set SMTP_USER, SMTP_PASS and APP_URL.");
  }
  const url = new URL(appUrl);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("APP_URL must be the application's HTTP(S) origin.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }
  if (!/^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(user)
    || !/^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(supportEmail)
    || !/^[^\r\n]+$/.test(from)) throw new Error("Invalid email sender or support address.");
  return { user, password, from, supportEmail, appUrl };
}

export function escapeEmailHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

export function safeEmailUrl(value: string): string {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "#";
  } catch { return "#"; }
}
