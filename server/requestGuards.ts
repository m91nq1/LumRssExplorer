import type { RequestHandler } from "express";

// Single-process protection. Multi-replica deployments need a shared rate-limit store.
export function rateLimit(limit: number, windowMs = 60_000): RequestHandler {
  const clients = new Map<string, { count: number; resetAt: number }>();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    if (clients.size >= 5000) {
      clients.forEach((value, ip) => { if (value.resetAt <= now) clients.delete(ip); });
    }
    let client = clients.get(key);
    if (!client || client.resetAt <= now) {
      if (!client && clients.size >= 5000) {
        res.setHeader("Retry-After", "60");
        res.status(429).json({ error: "Too many requests. Please try again shortly." });
        return;
      }
      client = { count: 0, resetAt: now + windowMs };
      clients.set(key, client);
    }
    if (++client.count > limit) {
      res.setHeader("Retry-After", String(Math.ceil((client.resetAt - now) / 1000)));
      res.status(429).json({ error: "Too many requests. Please try again shortly." });
      return;
    }
    next();
  };
}

export const sameOriginWrites: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || !req.headers.origin) return next();
  try {
    if (new URL(req.headers.origin).host === req.get("host")) return next();
  } catch { /* Invalid origins are denied. */ }
  res.status(403).json({ error: "Cross-origin changes are not allowed." });
};
