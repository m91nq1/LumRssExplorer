import { storage } from '../storage';
import { sendTopicDigestEmail, type StorySummary } from './emailService';
import { fetchPersonalisedStories } from './newsProviderService';
import type { User, UserPreferences } from '@shared/schema';

export async function buildUserDigest(
  preferences: UserPreferences
): Promise<StorySummary[]> {
  if (!preferences.favouriteTopics || preferences.favouriteTopics.length === 0) {
    return [];
  }
  return fetchPersonalisedStories(
    preferences.favouriteTopics,
    preferences.preferredRegions || undefined
  );
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
