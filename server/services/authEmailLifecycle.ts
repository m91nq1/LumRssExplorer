import type { User } from "@shared/schema";
import { storage } from "../storage";
import { sendLoginNotificationEmail, sendWelcomeEmail } from "./emailService";

/** Called only after the backend has verified Supabase identity. */
export async function sendAuthEmailForLogin(user: User, isNewUser: boolean, sessionId: string) {
  if (!user.email) return;
  if (isNewUser) return sendWelcomeEmail(user.email, user.firstName || user.username);
  const prefs = await storage.getUserPreferences(user.id);
  if (prefs?.loginNotificationEnabled === false) return;
  return sendLoginNotificationEmail(user.email, user.firstName || user.username, sessionId);
}
