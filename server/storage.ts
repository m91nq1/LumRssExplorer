import {
  users,
  articles,
  feedSources,
  bookmarks,
  readStatus,
  userPreferences,
  systemSettings,
  type User,
  type InsertUser,
  type UpsertUser,
  type Article,
  type InsertArticle,
  type FeedSource,
  type InsertFeedSource,
  type Bookmark,
  type InsertBookmark,
  type ReadStatus,
  type InsertReadStatus,
  type UserPreferences,
  type InsertUserPreferences,
  type ArticleWithStatus,
  type SourceWithCount,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, gte, and, or, sql, inArray, count, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getOrCreateUser(username: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserBySupabaseId(data: { supabaseId: string; email: string; firstName?: string; lastName?: string }): Promise<{ user: User; isNewUser: boolean }>;

  // Feed Sources
  getFeedSources(): Promise<FeedSource[]>;
  getEnabledFeedSources(): Promise<FeedSource[]>;
  getFeedSource(id: string): Promise<FeedSource | undefined>;
  createFeedSource(source: InsertFeedSource): Promise<FeedSource>;
  updateFeedSource(id: string, source: Partial<InsertFeedSource>): Promise<FeedSource | undefined>;
  deleteFeedSource(id: string): Promise<boolean>;

  // Articles
  getArticles(options: {
    sourceId?: string;
    topics?: string[];
    regions?: string[];
    search?: string;
    since?: Date;
    page: number;
    pageSize: number;
    userId?: number;
    bookmarkedOnly?: boolean;
    unreadOnly?: boolean;
    mostPolarised?: boolean;
  }): Promise<{ articles: ArticleWithStatus[]; total: number }>;
  getArticle(id: string, userId?: number): Promise<ArticleWithStatus | undefined>;
  upsertArticle(article: InsertArticle): Promise<Article>;
  upsertArticles(articles: InsertArticle[]): Promise<number>;
  getSourcesWithCounts(): Promise<SourceWithCount[]>;

  // Bookmarks
  getBookmark(userId: number, articleId: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: number, articleId: string): Promise<boolean>;
  getUserBookmarks(userId: number): Promise<Bookmark[]>;

  // Read Status
  getReadStatus(userId: number, articleId: string): Promise<ReadStatus | undefined>;
  markAsRead(userId: number, articleId: string): Promise<ReadStatus>;
  getUserReadArticles(userId: number): Promise<ReadStatus[]>;
  getReadHistory(userId: number, limit?: number): Promise<any[]>;
  clearReadHistory(userId: number): Promise<void>;

  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  getUsersWithDigestPreferences(): Promise<Array<{ user: User; preferences: UserPreferences }>>;
  
  // Inferred Topics from User Behavior
  getUserInferredTopics(userId: number, limit?: number): Promise<string[]>;
  getAllUsersWithEmail(): Promise<User[]>;

  // System Settings
  getLastRefreshTime(): Promise<string | null>;
  setLastRefreshTime(time: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USERS ====================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getOrCreateUser(username: string): Promise<User> {
    let user = await this.getUserByUsername(username);
    if (!user) {
      user = await this.createUser({ username });
    }
    return user;
  }

  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByReplitId(userData.replitId);
    
    if (existingUser) {
      const [updated] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.replitId, userData.replitId))
        .returning();
      return updated;
    } else {
      const username = userData.email?.split("@")[0] || `user_${userData.replitId}`;
      const [created] = await db
        .insert(users)
        .values({
          username,
          replitId: userData.replitId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
        })
        .returning();
      return created;
    }
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
    return user || undefined;
  }

  async upsertUserBySupabaseId(data: { supabaseId: string; email: string; firstName?: string; lastName?: string }): Promise<{ user: User; isNewUser: boolean }> {
    const existingUser = await this.getUserBySupabaseId(data.supabaseId);
    
    if (existingUser) {
      const [updated] = await db
        .update(users)
        .set({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          updatedAt: new Date(),
        })
        .where(eq(users.supabaseId, data.supabaseId))
        .returning();
      return { user: updated, isNewUser: false };
    } else {
      // Generate unique username from email
      const baseUsername = data.email.split("@")[0];
      let username = baseUsername;
      let counter = 1;
      
      while (await this.getUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      const [created] = await db
        .insert(users)
        .values({
          username,
          supabaseId: data.supabaseId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        })
        .returning();
      
      // Create default preferences for new user (with email digest enabled by default)
      await db.insert(userPreferences).values({
        userId: created.id,
        emailDigestEnabled: true,
        loginNotificationEnabled: true,
      }).onConflictDoNothing();
      
      return { user: created, isNewUser: true };
    }
  }

  // ==================== FEED SOURCES ====================
  async getFeedSources(): Promise<FeedSource[]> {
    return db.select().from(feedSources).orderBy(feedSources.name);
  }

  async getEnabledFeedSources(): Promise<FeedSource[]> {
    // Only return RSS feeds, not API sources (which are handled separately by newsProviderService)
    return db.select().from(feedSources)
      .where(and(
        eq(feedSources.isEnabled, true),
        or(eq(feedSources.sourceType, 'rss'), isNull(feedSources.sourceType))
      ))
      .orderBy(feedSources.name);
  }

  async getFeedSource(id: string): Promise<FeedSource | undefined> {
    const [source] = await db.select().from(feedSources).where(eq(feedSources.id, id));
    return source || undefined;
  }

  async createFeedSource(source: InsertFeedSource): Promise<FeedSource> {
    const [newSource] = await db.insert(feedSources).values(source).returning();
    return newSource;
  }

  async updateFeedSource(id: string, source: Partial<InsertFeedSource>): Promise<FeedSource | undefined> {
    const [updated] = await db.update(feedSources).set(source).where(eq(feedSources.id, id)).returning();
    return updated || undefined;
  }

  async deleteFeedSource(id: string): Promise<boolean> {
    const result = await db.delete(feedSources).where(eq(feedSources.id, id));
    return true;
  }

  // ==================== ARTICLES ====================
  async getArticles(options: {
    sourceId?: string;
    topics?: string[];
    regions?: string[];
    search?: string;
    since?: Date;
    page: number;
    pageSize: number;
    userId?: number;
    bookmarkedOnly?: boolean;
    unreadOnly?: boolean;
    mostPolarised?: boolean;
  }): Promise<{ articles: ArticleWithStatus[]; total: number }> {
    const { sourceId, topics, regions, search, since, page, pageSize, userId, bookmarkedOnly, unreadOnly, mostPolarised } = options;
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];

    if (sourceId) {
      const sourceIds = sourceId.split(",").map((id) => id.trim());
      conditions.push(inArray(articles.sourceId, sourceIds));
    }

    if (topics && topics.length > 0) {
      conditions.push(sql`${articles.topics} && ARRAY[${sql.join(topics.map(t => sql`${t}`), sql`, `)}]::text[]`);
    }

    if (regions && regions.length > 0) {
      conditions.push(inArray(feedSources.region, regions));
    }

    if (search) {
      conditions.push(
        or(
          ilike(articles.title, `%${search}%`),
          ilike(articles.summary, `%${search}%`)
        )
      );
    }

    if (since) {
      conditions.push(gte(articles.publishedAt, since));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const needsJoin = regions && regions.length > 0;

    // Get total count (with join if needed for region filter)
    let totalCount: number;
    if (needsJoin) {
      const [result] = await db
        .select({ count: count() })
        .from(articles)
        .innerJoin(feedSources, eq(feedSources.id, articles.sourceId))
        .where(whereClause);
      totalCount = Number(result.count);
    } else {
      const [result] = await db
        .select({ count: count() })
        .from(articles)
        .where(whereClause);
      totalCount = Number(result.count);
    }

    // Build articles query with optional join and polarisation sorting
    const selectFields = {
      id: articles.id,
      title: articles.title,
      link: articles.link,
      sourceName: articles.sourceName,
      sourceId: articles.sourceId,
      sourceRegion: feedSources.region,
      publishedAt: articles.publishedAt,
      summary: articles.summary,
      imageUrl: articles.imageUrl,
      topics: articles.topics,
      polarisationScore: articles.polarisationScore,
    };

    let articleRows;
    if (mostPolarised) {
      if (needsJoin) {
        articleRows = await db
          .select(selectFields)
          .from(articles)
          .innerJoin(feedSources, eq(feedSources.id, articles.sourceId))
          .where(whereClause)
          .orderBy(desc(articles.polarisationScore), desc(articles.publishedAt))
          .limit(pageSize)
          .offset(offset);
      } else {
        articleRows = await db
          .select(selectFields)
          .from(articles)
          .leftJoin(feedSources, eq(feedSources.id, articles.sourceId))
          .where(whereClause)
          .orderBy(desc(articles.polarisationScore), desc(articles.publishedAt))
          .limit(pageSize)
          .offset(offset);
      }
    } else {
      if (needsJoin) {
        articleRows = await db
          .select(selectFields)
          .from(articles)
          .innerJoin(feedSources, eq(feedSources.id, articles.sourceId))
          .where(whereClause)
          .orderBy(desc(articles.publishedAt))
          .limit(pageSize)
          .offset(offset);
      } else {
        articleRows = await db
          .select(selectFields)
          .from(articles)
          .leftJoin(feedSources, eq(feedSources.id, articles.sourceId))
          .where(whereClause)
          .orderBy(desc(articles.publishedAt))
          .limit(pageSize)
          .offset(offset);
      }
    }

    // If userId provided, get bookmark and read status
    let articlesWithStatus: ArticleWithStatus[];
    if (userId && articleRows.length > 0) {
      const articleIds = articleRows.map((a) => a.id);
      
      const userBookmarks = await db
        .select({ articleId: bookmarks.articleId })
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.articleId, articleIds)));
      
      const userReads = await db
        .select({ articleId: readStatus.articleId })
        .from(readStatus)
        .where(and(eq(readStatus.userId, userId), inArray(readStatus.articleId, articleIds)));

      const bookmarkedIds = new Set(userBookmarks.map((b) => b.articleId));
      const readIds = new Set(userReads.map((r) => r.articleId));

      articlesWithStatus = articleRows.map((article) => ({
        ...article,
        sourceRegion: article.sourceRegion || "Global",
        publishedAt: article.publishedAt.toISOString(),
        isBookmarked: bookmarkedIds.has(article.id),
        isRead: readIds.has(article.id),
      }));

      // Apply bookmarked/unread filters if needed
      if (bookmarkedOnly) {
        articlesWithStatus = articlesWithStatus.filter((a) => a.isBookmarked);
      }
      if (unreadOnly) {
        articlesWithStatus = articlesWithStatus.filter((a) => !a.isRead);
      }
    } else {
      articlesWithStatus = articleRows.map((article) => ({
        ...article,
        sourceRegion: article.sourceRegion || "Global",
        publishedAt: article.publishedAt.toISOString(),
        isBookmarked: false,
        isRead: false,
      }));
    }

    return {
      articles: articlesWithStatus,
      total: totalCount,
    };
  }

  async getArticle(id: string, userId?: number): Promise<ArticleWithStatus | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    if (!article) return undefined;

    let isBookmarked = false;
    let isRead = false;

    if (userId) {
      const [bookmark] = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.articleId, id)));
      isBookmarked = !!bookmark;

      const [read] = await db
        .select()
        .from(readStatus)
        .where(and(eq(readStatus.userId, userId), eq(readStatus.articleId, id)));
      isRead = !!read;
    }

    return {
      ...article,
      publishedAt: article.publishedAt.toISOString(),
      isBookmarked,
      isRead,
    };
  }

  async upsertArticle(article: InsertArticle): Promise<Article> {
    const [result] = await db
      .insert(articles)
      .values(article)
      .onConflictDoUpdate({
        target: articles.id,
        set: {
          title: article.title,
          summary: article.summary,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
        },
      })
      .returning();
    return result;
  }

  async upsertArticles(articlesList: InsertArticle[]): Promise<number> {
    if (articlesList.length === 0) return 0;

    // Batch insert with conflict handling
    let inserted = 0;
    const batchSize = 50;
    
    for (let i = 0; i < articlesList.length; i += batchSize) {
      const batch = articlesList.slice(i, i + batchSize);
      try {
        await db
          .insert(articles)
          .values(batch)
          .onConflictDoNothing();
        inserted += batch.length;
      } catch (error) {
        console.error(`Error inserting batch ${i}:`, error);
      }
    }
    
    return inserted;
  }

  async getSourcesWithCounts(): Promise<SourceWithCount[]> {
    const sources = await db.select().from(feedSources).orderBy(feedSources.name);
    
    const counts = await db
      .select({
        sourceId: articles.sourceId,
        count: count(),
      })
      .from(articles)
      .groupBy(articles.sourceId);

    const countMap = new Map(counts.map((c) => [c.sourceId, Number(c.count)]));

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      articleCount: countMap.get(source.id) || 0,
      isEnabled: source.isEnabled,
    }));
  }

  // ==================== BOOKMARKS ====================
  async getBookmark(userId: number, articleId: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.articleId, articleId)));
    return bookmark || undefined;
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [result] = await db.insert(bookmarks).values(bookmark).returning();
    return result;
  }

  async deleteBookmark(userId: number, articleId: string): Promise<boolean> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.articleId, articleId)));
    return true;
  }

  async getUserBookmarks(userId: number): Promise<Bookmark[]> {
    return db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  // ==================== READ STATUS ====================
  async getReadStatus(userId: number, articleId: string): Promise<ReadStatus | undefined> {
    const [status] = await db
      .select()
      .from(readStatus)
      .where(and(eq(readStatus.userId, userId), eq(readStatus.articleId, articleId)));
    return status || undefined;
  }

  async markAsRead(userId: number, articleId: string): Promise<ReadStatus> {
    const existing = await this.getReadStatus(userId, articleId);
    if (existing) return existing;

    const [result] = await db
      .insert(readStatus)
      .values({ userId, articleId })
      .returning();
    return result;
  }

  async getUserReadArticles(userId: number): Promise<ReadStatus[]> {
    return db.select().from(readStatus).where(eq(readStatus.userId, userId));
  }

  async getReadHistory(userId: number, limit: number = 50): Promise<any[]> {
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        link: articles.link,
        sourceId: articles.sourceId,
        sourceName: articles.sourceName,
        publishedAt: articles.publishedAt,
        summary: articles.summary,
        imageUrl: articles.imageUrl,
        topics: articles.topics,
        readAt: readStatus.readAt,
        region: feedSources.region,
      })
      .from(readStatus)
      .innerJoin(articles, eq(readStatus.articleId, articles.id))
      .innerJoin(feedSources, eq(articles.sourceId, feedSources.id))
      .where(eq(readStatus.userId, userId))
      .orderBy(desc(readStatus.readAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r,
      topic: r.topics?.[0] || null,
      isRead: true,
    }));
  }

  async clearReadHistory(userId: number): Promise<void> {
    await db.delete(readStatus).where(eq(readStatus.userId, userId));
  }

  // ==================== USER PREFERENCES ====================
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const [result] = await db
      .insert(userPreferences)
      .values(prefs)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          favoriteSources: prefs.favoriteSources,
          favouriteTopics: prefs.favouriteTopics,
          preferredRegions: prefs.preferredRegions,
          defaultSearchQuery: prefs.defaultSearchQuery,
          defaultTimeFilter: prefs.defaultTimeFilter,
          emailDigestEnabled: prefs.emailDigestEnabled,
          loginNotificationEnabled: prefs.loginNotificationEnabled,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getUsersWithDigestPreferences(): Promise<Array<{ user: User; preferences: UserPreferences }>> {
    const results = await db
      .select({
        user: users,
        preferences: userPreferences,
      })
      .from(users)
      .innerJoin(userPreferences, eq(users.id, userPreferences.userId))
      .where(
        and(
          sql`array_length(${userPreferences.favouriteTopics}, 1) > 0`,
          eq(userPreferences.emailDigestEnabled, true)
        )
      );
    return results;
  }

  async getUserInferredTopics(userId: number, limit: number = 50): Promise<string[]> {
    // Get topics from bookmarked articles (stronger signal - weight 2x)
    const bookmarkedTopics = await db
      .select({ topics: articles.topics })
      .from(bookmarks)
      .innerJoin(articles, eq(bookmarks.articleId, articles.id))
      .where(eq(bookmarks.userId, userId))
      .limit(limit);

    // Get topics from read articles (normal weight)
    const readTopics = await db
      .select({ topics: articles.topics })
      .from(readStatus)
      .innerJoin(articles, eq(readStatus.articleId, articles.id))
      .where(eq(readStatus.userId, userId))
      .orderBy(desc(readStatus.readAt))
      .limit(limit);

    // Count topic occurrences with bookmarks weighted 2x
    const topicCounts = new Map<string, number>();
    
    for (const row of bookmarkedTopics) {
      if (row.topics) {
        for (const topic of row.topics) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 2);
        }
      }
    }
    
    for (const row of readTopics) {
      if (row.topics) {
        for (const topic of row.topics) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
      }
    }

    // Sort by count and return top topics
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  async getAllUsersWithEmail(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(sql`${users.email} IS NOT NULL AND ${users.email} != ''`);
  }

  // ==================== SYSTEM SETTINGS ====================
  async getLastRefreshTime(): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "lastRefreshTime"));
    return setting?.value || null;
  }

  async setLastRefreshTime(time: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key: "lastRefreshTime", value: time })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: time, updatedAt: new Date() },
      });
  }

  // ==================== ARTICLE NAVIGATION ====================
  async getArticleNeighbors(articleId: string): Promise<{ prev: string | null; next: string | null }> {
    const article = await this.getArticle(articleId);
    if (!article) {
      return { prev: null, next: null };
    }

    const articleDate = new Date(article.publishedAt);

    const prevArticle = await db
      .select({ id: articles.id })
      .from(articles)
      .where(
        or(
          sql`${articles.publishedAt} > ${articleDate}`,
          and(
            eq(articles.publishedAt, articleDate),
            sql`${articles.id} < ${articleId}`
          )
        )
      )
      .orderBy(articles.publishedAt, desc(articles.id))
      .limit(1);

    const nextArticle = await db
      .select({ id: articles.id })
      .from(articles)
      .where(
        or(
          sql`${articles.publishedAt} < ${articleDate}`,
          and(
            eq(articles.publishedAt, articleDate),
            sql`${articles.id} > ${articleId}`
          )
        )
      )
      .orderBy(desc(articles.publishedAt), articles.id)
      .limit(1);

    const prevId = prevArticle.length > 0 ? prevArticle[0].id : null;
    const nextId = nextArticle.length > 0 ? nextArticle[0].id : null;

    return { prev: prevId, next: nextId };
  }
}

export const storage = new DatabaseStorage();
