import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { articles, feedSources, type UserPreferences } from "@shared/schema";
import { db } from "../db";
import { storage } from "../storage";
import { sendTopicDigestEmail, type StorySummary } from "./emailService";
import { emailConfig } from "./emailConfig";
import { EmailDeliveryError } from "./emailDelivery";
import { initializeEmailDatabase } from "./emailDatabase";
import { getNotificationPreferences } from "./notificationPreferences";
import cron from "node-cron";

async function selectStories(topics: string[], regions: string[], countries: string[], days: number, breaking = false) {
  if (!topics.length) return [];
  const conditions = [
    sql`${articles.topics} && ARRAY[${sql.join(topics.map(t => sql`${t}`), sql`, `)}]::text[]`,
    gte(articles.publishedAt, new Date(Date.now() - days * 86_400_000)),
  ];
  if (regions.length) conditions.push(inArray(feedSources.region, regions));
  if (countries.length) conditions.push(inArray(feedSources.country, countries));
  // No AI-invented urgency: only headlines explicitly marked breaking.
  if (breaking) conditions.push(sql`${articles.title} ~* '\\mbreaking\\M'`);
  return db.select({
    id: articles.id, title: articles.title, source: articles.sourceName,
    region: feedSources.region, url: articles.link, summary: articles.summary,
    publishedAt: articles.publishedAt,
  }).from(articles).innerJoin(feedSources, eq(articles.sourceId, feedSources.id))
    .where(and(...conditions)).orderBy(desc(articles.publishedAt)).limit(breaking ? 3 : 15);
}

function asStories(rows: Awaited<ReturnType<typeof selectStories>>): StorySummary[] {
  return rows.map(row => ({
    title: row.title, source: row.source, url: row.url,
    summary: row.summary || undefined, region: row.region || undefined,
    publishedAt: row.publishedAt.toISOString(),
  }));
}

export async function buildUserDigest(preferences: UserPreferences): Promise<StorySummary[]> {
  const extra = await getNotificationPreferences(preferences.userId);
  return asStories(await selectStories(preferences.favouriteTopics || [],
    preferences.preferredRegions || [], extra.countries, extra.frequency === "weekly" ? 7 : 1));
}
export async function buildBehaviorBasedDigest(userId: number) {
  const prefs = await storage.getUserPreferences(userId);
  const extra = await getNotificationPreferences(userId);
  const topics = await storage.getUserInferredTopics(userId);
  return { topics, stories: asStories(await selectStories(topics,
    prefs?.preferredRegions || [], extra.countries, 2)) };
}

/** UTC Monday anchor: stable across retries, manual runs and worker restarts. */
export function digestPeriod(frequency: string, now = new Date()): string {
  const day = new Date(now);
  if (frequency === "weekly") day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return `${frequency}:${day.toISOString().slice(0, 10)}`;
}

async function runNotifications(kind: "digest" | "personalized" | "breaking", scheduled = false) {
  const stats = { usersProcessed: 0, emailsSent: 0, errors: 0 };
  emailConfig(); // no fake success when delivery isn't configured
  await initializeEmailDatabase();
  const recipients = await storage.getUsersWithDigestPreferences();
  for (const { user, preferences } of recipients) {
    if (!user.email) continue;
    try {
      const extra = await getNotificationPreferences(user.id);
      if (kind === "personalized" && !extra.personalizedEnabled) continue;
      if (kind === "breaking" && !extra.breakingEnabled) continue;
      if (kind === "digest" && scheduled && extra.frequency === "weekly" && new Date().getUTCDay() !== 1) continue;
      stats.usersProcessed++;
      const name = user.firstName || user.username || "there";
      if (kind === "breaking") {
        const rows = await selectStories(preferences.favouriteTopics || [],
          preferences.preferredRegions || [], extra.countries, 1 / 24, true);
        for (const row of rows) {
          const result = await sendTopicDigestEmail(user.email, name, preferences.favouriteTopics || [],
            asStories([row]), { kind: "breaking", period: row.id });
          if (result === "sent") stats.emailsSent++;
        }
      } else {
        const digest = kind === "personalized" ? await buildBehaviorBasedDigest(user.id)
          : { topics: preferences.favouriteTopics || [], stories: await buildUserDigest(preferences) };
        if (!digest.stories.length) continue;
        const result = await sendTopicDigestEmail(user.email, name, digest.topics, digest.stories, {
          kind, period: digestPeriod(kind === "personalized" ? "weekly" : extra.frequency),
        });
        if (result === "sent") stats.emailsSent++;
      }
    } catch (error) {
      stats.errors++;
      console.error("[DigestService] Delivery failed.", error instanceof EmailDeliveryError ? error.code : "configuration_or_storage_error");
      if (error instanceof EmailDeliveryError && error.code === "application_budget_exceeded") break;
    }
  }
  return stats;
}

export const runDigestsForAllUsers = () => runNotifications("digest");
export const runBehaviorBasedDigests = () => runNotifications("personalized");

let schedulerStarted = false;
export function startDigestScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;
  // Schedules share the same durable duplicate guard as manual sends.
  for (const [schedule, kind] of [
    ["0 9 * * *", "digest"], ["0 10 * * 1", "personalized"], ["*/10 * * * *", "breaking"],
  ] as const) {
    let running = false;
    cron.schedule(schedule, async () => {
      if (running) return;
      running = true;
      try { await runNotifications(kind, true); }
      catch { console.error(`[DigestService] ${kind} emails unavailable; check email configuration.`); }
      finally { running = false; }
    }, { timezone: "UTC" });
  }
  console.log("[DigestService] Gmail news notification schedules started (UTC).");
}
