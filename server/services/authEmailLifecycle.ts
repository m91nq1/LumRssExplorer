import type { User } from "@shared/schema";
import { sendLoginNotificationEmail } from "./emailService";

/** Called only after the backend has verified Supabase identity. */
export async function sendAuthEmailForLogin(user: User, isNewUser: boolean, sessionId: string) {
  if (!user.email) return;
  // Security notifications are required for every successful authenticated
  // session, including registration. News opt-outs must not suppress them.
  return sendLoginNotificationEmail(user.email, user.firstName || user.username, sessionId, isNewUser);
}
