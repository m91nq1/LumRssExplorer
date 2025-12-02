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
import { eq, desc, ilike, gte, and, or, sql, inArray, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getOrCreateUser(username: string): Promise<User>;

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
    search?: string;
    since?: Date;
    page: number;
    pageSize: number;
    userId?: number;
    bookmarkedOnly?: boolean;
    unreadOnly?: boolean;
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

  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;

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

  // ==================== FEED SOURCES ====================
  async getFeedSources(): Promise<FeedSource[]> {
    return db.select().from(feedSources).orderBy(feedSources.name);
  }

  async getEnabledFeedSources(): Promise<FeedSource[]> {
    return db.select().from(feedSources).where(eq(feedSources.isEnabled, true)).orderBy(feedSources.name);
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
    search?: string;
    since?: Date;
    page: number;
    pageSize: number;
    userId?: number;
    bookmarkedOnly?: boolean;
    unreadOnly?: boolean;
  }): Promise<{ articles: ArticleWithStatus[]; total: number }> {
    const { sourceId, search, since, page, pageSize, userId, bookmarkedOnly, unreadOnly } = options;
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];

    if (sourceId) {
      const sourceIds = sourceId.split(",").map((id) => id.trim());
      conditions.push(inArray(articles.sourceId, sourceIds));
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

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(articles)
      .where(whereClause);

    // Get articles with bookmark and read status if userId provided
    let articlesQuery = db
      .select({
        id: articles.id,
        title: articles.title,
        link: articles.link,
        sourceName: articles.sourceName,
        sourceId: articles.sourceId,
        publishedAt: articles.publishedAt,
        summary: articles.summary,
        imageUrl: articles.imageUrl,
      })
      .from(articles)
      .where(whereClause)
      .orderBy(desc(articles.publishedAt))
      .limit(pageSize)
      .offset(offset);

    const articleRows = await articlesQuery;

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
        publishedAt: article.publishedAt.toISOString(),
        isBookmarked: false,
        isRead: false,
      }));
    }

    return {
      articles: articlesWithStatus,
      total: Number(totalCount),
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
          defaultSearchQuery: prefs.defaultSearchQuery,
          defaultTimeFilter: prefs.defaultTimeFilter,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
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
