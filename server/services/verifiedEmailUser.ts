import type { Request, Response, NextFunction } from "express";
import { createClient, type User } from "@supabase/supabase-js";
import { storage } from "../storage";

export async function verifyEmailUser(req: Request): Promise<User | null> {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  return !error && data.user?.email ? data.user : null;
}

export async function requireEmailUser(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const user = await verifyEmailUser(req);
    if (!user) return res.status(401).json({ error: "Please sign in again." });
    const local = await storage.getUserBySupabaseId(user.id);
    if (!local) return res.status(401).json({ error: "Please sign in again to finish setting up your account." });
    (req as any).emailUser = local;
    (req as any).userId = local.id;
    next();
  } catch { res.status(503).json({ error: "Unable to verify your session." }); }
}
