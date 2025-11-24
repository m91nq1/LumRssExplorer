import { z } from "zod";

// RSS Feed Source Configuration
export const feedSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  sourceType: z.literal("rss"),
  country: z.string().optional(),
  category: z.string(),
});

export type FeedSource = z.infer<typeof feedSourceSchema>;

// Article Schema
export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string().url(),
  sourceName: z.string(),
  sourceId: z.string(),
  publishedAt: z.string(),
  summary: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export type Article = z.infer<typeof articleSchema>;

// Source with Article Count
export const sourceWithCountSchema = z.object({
  id: z.string(),
  name: z.string(),
  articleCount: z.number(),
});

export type SourceWithCount = z.infer<typeof sourceWithCountSchema>;

// API Response Types
export const articlesResponseSchema = z.object({
  articles: z.array(articleSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type ArticlesResponse = z.infer<typeof articlesResponseSchema>;

export const sourcesResponseSchema = z.object({
  sources: z.array(sourceWithCountSchema),
  lastRefreshTime: z.string(),
});

export type SourcesResponse = z.infer<typeof sourcesResponseSchema>;

// Query Parameters
export const articleQuerySchema = z.object({
  sourceId: z.string().optional(),
  search: z.string().optional(),
  since: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

export type ArticleQuery = z.infer<typeof articleQuerySchema>;
