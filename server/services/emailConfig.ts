export function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const supportEmail = process.env.SUPPORT_EMAIL;
  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (!apiKey || !from || !appUrl || !supportEmail) {
    throw new Error("Email configuration incomplete: set RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL and SUPPORT_EMAIL.");
  }
  const url = new URL(appUrl);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("APP_URL must be the application's HTTP(S) origin.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }
  if (!/^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(supportEmail)
    || !/^[^\r\n]+$/.test(from)) throw new Error("Invalid email sender or support address.");
  return { apiKey, from, supportEmail, appUrl };
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
