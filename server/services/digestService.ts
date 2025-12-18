import { storage } from '../storage';
import { sendTopicDigestEmail, type StorySummary } from './emailService';
import type { User, UserPreferences } from '@shared/schema';
import cron from 'node-cron';

export async function buildUserDigest(
  preferences: UserPreferences
): Promise<StorySummary[]> {
  if (!preferences.favouriteTopics || preferences.favouriteTopics.length === 0) {
    return [];
  }

  // Get articles from our database that match user's topic preferences
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { articles } = await storage.getArticles({
    topics: preferences.favouriteTopics,
    regions: preferences.preferredRegions || undefined,
    since: oneDayAgo,
    page: 1,
    pageSize: 15,
  });

  // Convert database articles to StorySummary format
  return articles.map(article => ({
    title: article.title,
    source: article.sourceName || 'Unknown Source',
    region: article.sourceRegion || undefined,
    url: article.link,
    summary: article.summary || article.aiSummary || undefined,
    publishedAt: article.publishedAt,
  }));
}

export async function buildBehaviorBasedDigest(
  userId: number
): Promise<{ topics: string[]; stories: StorySummary[] }> {
  // Get inferred topics from user's reading behavior (bookmarks + read history)
  const inferredTopics = await storage.getUserInferredTopics(userId);
  
  if (inferredTopics.length === 0) {
    return { topics: [], stories: [] };
  }

  // Get articles from the last 2 days matching inferred topics
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const { articles } = await storage.getArticles({
    topics: inferredTopics,
    since: twoDaysAgo,
    page: 1,
    pageSize: 15,
  });

  const stories = articles.map(article => ({
    title: article.title,
    source: article.sourceName || 'Unknown Source',
    region: article.sourceRegion || undefined,
    url: article.link,
    summary: article.summary || article.aiSummary || undefined,
    publishedAt: article.publishedAt,
  }));

  return { topics: inferredTopics, stories };
}

export async function runDigestsForAllUsers(): Promise<{
  usersProcessed: number;
  emailsSent: number;
  errors: number;
}> {
  const stats = { usersProcessed: 0, emailsSent: 0, errors: 0 };

  try {
    const usersWithPrefs = await storage.getUsersWithDigestPreferences();
    console.log(`[DigestService] Found ${usersWithPrefs.length} users with digest preferences`);

    for (const { user, preferences } of usersWithPrefs) {
      stats.usersProcessed++;

      try {
        if (!user.email) {
          console.log(`[DigestService] User ${user.username} has no email, skipping`);
          continue;
        }

        const stories = await buildUserDigest(preferences);

        if (stories.length === 0) {
          console.log(`[DigestService] No stories for user ${user.username}, skipping`);
          continue;
        }

        const name = user.firstName || user.username || 'there';
        await sendTopicDigestEmail(
          user.email,
          name,
          preferences.favouriteTopics || [],
          stories
        );

        stats.emailsSent++;
      } catch (error) {
        console.error(`[DigestService] Error processing user ${user.username}:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('[DigestService] Fatal error running digests:', error);
    throw error;
  }

  console.log(`[DigestService] Complete: ${stats.usersProcessed} users, ${stats.emailsSent} emails, ${stats.errors} errors`);
  return stats;
}

export async function runBehaviorBasedDigests(): Promise<{
  usersProcessed: number;
  emailsSent: number;
  errors: number;
}> {
  const stats = { usersProcessed: 0, emailsSent: 0, errors: 0 };

  try {
    // Get all users with email addresses
    const usersWithEmail = await storage.getAllUsersWithEmail();
    console.log(`[DigestService] Running behavior-based digests for ${usersWithEmail.length} users with email`);

    for (const user of usersWithEmail) {
      stats.usersProcessed++;

      try {
        const { topics, stories } = await buildBehaviorBasedDigest(user.id);

        if (stories.length === 0) {
          console.log(`[DigestService] No behavior-based stories for user ${user.username}, skipping`);
          continue;
        }

        const name = user.firstName || user.username || 'there';
        await sendTopicDigestEmail(
          user.email!,
          name,
          topics,
          stories
        );

        stats.emailsSent++;
        console.log(`[DigestService] Sent behavior-based digest to ${user.email} with topics: ${topics.join(', ')}`);
      } catch (error) {
        console.error(`[DigestService] Error processing user ${user.username}:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('[DigestService] Fatal error running behavior-based digests:', error);
    throw error;
  }

  console.log(`[DigestService] Behavior-based digests complete: ${stats.usersProcessed} users, ${stats.emailsSent} emails, ${stats.errors} errors`);
  return stats;
}

// Guard to prevent duplicate scheduler registrations
let schedulerStarted = false;

// Schedule behavior-based digests every 2 days at 9 AM
export function startDigestScheduler(): void {
  if (schedulerStarted) {
    console.log('[DigestService] Scheduler already running, skipping duplicate registration');
    return;
  }
  
  // Cron expression: "0 9 */2 * *" = At 09:00 every 2nd day
  cron.schedule('0 9 */2 * *', async () => {
    console.log('[DigestService] Running scheduled behavior-based digest...');
    try {
      const stats = await runBehaviorBasedDigests();
      console.log(`[DigestService] Scheduled digest complete:`, stats);
    } catch (error) {
      console.error('[DigestService] Scheduled digest failed:', error);
    }
  });
  
  schedulerStarted = true;
  console.log('[DigestService] Behavior-based digest scheduler started (every 2 days at 9 AM)');
}
