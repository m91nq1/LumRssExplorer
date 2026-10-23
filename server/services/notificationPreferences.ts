import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { initializeEmailDatabase } from "./emailDatabase";

export const notificationPreferencesSchema = z.object({
  frequency: z.enum(["daily", "weekly"]),
  countries: z.array(z.string().trim().min(2).max(60)).max(30),
  breakingEnabled: z.boolean(),
  personalizedEnabled: z.boolean(),
}).strict();
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export const defaultNotificationPreferences: NotificationPreferences = {
  frequency: "daily", countries: [], breakingEnabled: false, personalizedEnabled: false,
};
export async function getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
  await initializeEmailDatabase();
  const result = await db.execute(sql`SELECT frequency, countries,
    breaking_enabled AS "breakingEnabled", personalized_enabled AS "personalizedEnabled"
    FROM email_notification_preferences WHERE user_id = ${userId}`);
  return result.rows[0] as NotificationPreferences || { ...defaultNotificationPreferences };
}
export async function saveNotificationPreferences(userId: number, prefs: NotificationPreferences) {
  await initializeEmailDatabase();
  await db.execute(sql`INSERT INTO email_notification_preferences
    (user_id, frequency, countries, breaking_enabled, personalized_enabled)
    VALUES (${userId}, ${prefs.frequency},
      ARRAY[${sql.join(prefs.countries.map(country => sql`${country}`), sql`, `)}]::text[],
      ${prefs.breakingEnabled}, ${prefs.personalizedEnabled})
    ON CONFLICT (user_id) DO UPDATE SET frequency = EXCLUDED.frequency,
      countries = EXCLUDED.countries, breaking_enabled = EXCLUDED.breaking_enabled,
      personalized_enabled = EXCLUDED.personalized_enabled, updated_at = now()`);
}
