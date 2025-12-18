import { storage } from '../storage';
import { sendTopicDigestEmail, type StorySummary } from './emailService';
import type { User, UserPreferences } from '@shared/schema';

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
