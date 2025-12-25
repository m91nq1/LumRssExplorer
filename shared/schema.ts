import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, serial, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== SESSION TABLE (Replit Auth) ====================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ==================== DATABASE TABLES ====================

// Topic definitions for article classification
export const TOPICS = [
  "War / Conflict",
  "US Politics",
  "Europe Politics",
  "AI & Technology",
  "Finance & Markets",
  "Crime & Justice",
  "Science & Health",
  "Celebrity & Entertainment",
  "Environment / Climate",
  "Other / Offbeat",
] as const;

export type Topic = typeof TOPICS[number];

// Region definitions for source classification
export const REGIONS = [
  "Global",
  "US",
  "Europe",
  "UK",
  "Russia",
  "China",
  "Africa",
  "Middle East",
  "Asia-Pacific",
] as const;

export type Region = typeof REGIONS[number];

// RSS Feed Sources (configurable via UI)
export const feedSources = pgTable("feed_sources", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull().default("rss"),
  country: text("country"),
  region: text("region").default("Global"),
  category: text("category").notNull().default("world"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedSourcesRelations = relations(feedSources, ({ many }) => ({
  articles: many(articles),
}));

export const insertFeedSourceSchema = createInsertSchema(feedSources).omit({
  createdAt: true,
});
export type InsertFeedSource = z.infer<typeof insertFeedSourceSchema>;
export type FeedSource = typeof feedSources.$inferSelect;

// Articles table
export const articles = pgTable("articles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  sourceName: text("source_name").notNull(),
  sourceId: varchar("source_id", { length: 50 }).notNull().references(() => feedSources.id),
  publishedAt: timestamp("published_at").notNull(),
  summary: text("summary"),
  content: text("content"),
  imageUrl: text("image_url"),
  aiSummary: text("ai_summary"),
  topics: text("topics").array(),
  polarisationScore: integer("polarisation_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("articles_source_id_idx").on(table.sourceId),
  index("articles_published_at_idx").on(table.publishedAt),
]);

export const articlesRelations = relations(articles, ({ one, many }) => ({
  source: one(feedSources, {
    fields: [articles.sourceId],
    references: [feedSources.id],
  }),
  bookmarks: many(bookmarks),
  readStatus: many(readStatus),
}));

export const insertArticleSchema = createInsertSchema(articles).omit({
  createdAt: true,
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

// Users table (Supabase Auth compatible)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  replitId: varchar("replit_id", { length: 50 }).unique(),
  supabaseId: varchar("supabase_id", { length: 100 }).unique(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  bookmarks: many(bookmarks),
  readStatus: many(readStatus),
  preferences: one(userPreferences),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type UpsertUser = {
  replitId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: varchar("article_id", { length: 64 }).notNull().references(() => articles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("bookmarks_user_id_idx").on(table.userId),
  index("bookmarks_article_id_idx").on(table.articleId),
]);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [bookmarks.articleId],
    references: [articles.id],
  }),
}));

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Read Status table
export const readStatus = pgTable("read_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: varchar("article_id", { length: 64 }).notNull().references(() => articles.id),
  readAt: timestamp("read_at").defaultNow().notNull(),
}, (table) => [
  index("read_status_user_id_idx").on(table.userId),
  index("read_status_article_id_idx").on(table.articleId),
]);

export const readStatusRelations = relations(readStatus, ({ one }) => ({
  user: one(users, {
    fields: [readStatus.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [readStatus.articleId],
    references: [articles.id],
  }),
}));

export const insertReadStatusSchema = createInsertSchema(readStatus).omit({
  id: true,
  readAt: true,
});
export type InsertReadStatus = z.infer<typeof insertReadStatusSchema>;
export type ReadStatus = typeof readStatus.$inferSelect;

// User Preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  favoriteSources: text("favorite_sources").array(),
  favouriteTopics: text("favourite_topics").array(),
  preferredRegions: text("preferred_regions").array(),
  defaultSearchQuery: text("default_search_query"),
  defaultTimeFilter: text("default_time_filter").default("all"),
  emailDigestEnabled: boolean("email_digest_enabled").default(true),
  loginNotificationEnabled: boolean("login_notification_enabled").default(true),
  lastDigestSentAt: timestamp("last_digest_sent_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// System Settings table (for last refresh time, etc.)
export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// News Providers table (external API providers)
export const newsProviders = pgTable("news_providers", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKeyEnvVar: text("api_key_env_var").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  rateLimitPerDay: integer("rate_limit_per_day"),
  supportedCategories: text("supported_categories").array(),
  supportedCountries: text("supported_countries").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNewsProviderSchema = createInsertSchema(newsProviders).omit({
  createdAt: true,
});
export type InsertNewsProvider = z.infer<typeof insertNewsProviderSchema>;
export type NewsProvider = typeof newsProviders.$inferSelect;

// ==================== ZOD SCHEMAS FOR API ====================

// Source with Article Count (API response)
export const sourceWithCountSchema = z.object({
  id: z.string(),
  name: z.string(),
  articleCount: z.number(),
  isEnabled: z.boolean().optional(),
});

export type SourceWithCount = z.infer<typeof sourceWithCountSchema>;

// Article with extra data for frontend (API response)
export const articleWithStatusSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string(),
  sourceName: z.string(),
  sourceId: z.string(),
  sourceRegion: z.string().optional(),
  publishedAt: z.string(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  aiSummary: z.string().optional().nullable(),
  topics: z.array(z.string()).optional().nullable(),
  polarisationScore: z.number().optional().nullable(),
  isBookmarked: z.boolean().optional(),
  isRead: z.boolean().optional(),
});

export type ArticleWithStatus = z.infer<typeof articleWithStatusSchema>;

// API Response Types
export const articlesResponseSchema = z.object({
  articles: z.array(articleWithStatusSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type ArticlesResponse = z.infer<typeof articlesResponseSchema>;

export const sourcesResponseSchema = z.object({
  sources: z.array(sourceWithCountSchema),
  lastRefreshTime: z.string().nullable(),
});

export type SourcesResponse = z.infer<typeof sourcesResponseSchema>;

// Query Parameters
export const articleQuerySchema = z.object({
  sourceId: z.string().optional(),
  topics: z.string().optional(),
  regions: z.string().optional(),
  search: z.string().optional(),
  since: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
  bookmarkedOnly: z.boolean().optional(),
  unreadOnly: z.boolean().optional(),
  mostPolarised: z.boolean().optional(),
});

export type ArticleQuery = z.infer<typeof articleQuerySchema>;
