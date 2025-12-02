import { InsertArticle, InsertFeedSource, FeedSource, SourceWithCount, ArticleWithStatus } from "@shared/schema";
import { storage } from "./storage";
import { ingestFeed } from "./rssIngestor";
import cron from "node-cron";

// Default RSS feeds to seed on first run
const DEFAULT_FEEDS: InsertFeedSource[] = [
  {
    id: "bbc-world",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/world/rss.xml",
    sourceType: "rss",
    country: "UK",
    category: "world",
  },
  {
    id: "cnn-world",
    name: "CNN",
    url: "http://rss.cnn.com/rss/edition_world.rss",
    sourceType: "rss",
    country: "US",
    category: "world",
  },
  {
    id: "cnbc-international",
    name: "CNBC",
    url: "https://www.cnbc.com/id/100727362/device/rss/rss.html",
    sourceType: "rss",
    country: "US",
    category: "world",
  },
  {
    id: "ndtv-world",
    name: "NDTV",
    url: "http://feeds.feedburner.com/ndtvnews-world-news",
    sourceType: "rss",
    country: "India",
    category: "world",
  },
  {
    id: "nyt-world",
    name: "NYT",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    sourceType: "rss",
    country: "US",
    category: "world",
  },
  {
    id: "google-news",
    name: "Google News",
    url: "https://news.google.com/rss",
    sourceType: "rss",
    category: "world",
  },
  {
    id: "washpost-world",
    name: "Washington Post",
    url: "http://feeds.washingtonpost.com/rss/world",
    sourceType: "rss",
    country: "US",
    category: "world",
  },
  {
    id: "reddit-worldnews",
    name: "Reddit r/worldnews",
    url: "https://www.reddit.com/r/worldnews/.rss",
    sourceType: "rss",
    category: "world",
  },
  {
    id: "toi-world",
    name: "Times of India",
    url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    sourceType: "rss",
    country: "India",
    category: "world",
  },
  {
    id: "guardian-world",
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    sourceType: "rss",
    country: "UK",
    category: "world",
  },
];

export class ArticleStore {
  private isRefreshing = false;
  private initialized = false;

  constructor() {
    this.scheduleRefresh();
  }

  async initialize() {
    if (this.initialized) return;
    
    // Seed default feeds if none exist
    const existingSources = await storage.getFeedSources();
    if (existingSources.length === 0) {
      console.log("Seeding default RSS feeds...");
      for (const feed of DEFAULT_FEEDS) {
        try {
          await storage.createFeedSource(feed);
        } catch (error) {
          console.error(`Error seeding feed ${feed.name}:`, error);
        }
      }
    }

    this.initialized = true;
    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.isRefreshing) {
      console.log("Refresh already in progress, skipping...");
      return;
    }

    this.isRefreshing = true;
    console.log("Starting RSS feed refresh...");

    try {
      const feeds = await storage.getEnabledFeedSources();
      const allArticles: InsertArticle[] = [];

      const results = await Promise.allSettled(
        feeds.map(async (feed) => {
          const articles = await ingestFeed(feed);
          return articles;
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          allArticles.push(...result.value);
        }
      }

      // Upsert all articles to database
      const inserted = await storage.upsertArticles(allArticles);
      
      // Update last refresh time
      await storage.setLastRefreshTime(new Date().toISOString());
      
      console.log(`Refresh complete. Processed ${allArticles.length} articles.`);
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      this.isRefreshing = false;
    }
  }

  private scheduleRefresh() {
    cron.schedule("*/10 * * * *", async () => {
      console.log("Scheduled refresh triggered");
      await this.refresh();
    });
  }

  async getFilteredArticles(
    sourceId?: string,
    search?: string,
    since?: string,
    page: number = 1,
    pageSize: number = 20,
    userId?: number,
    bookmarkedOnly?: boolean,
    unreadOnly?: boolean
  ) {
    const sinceDate = since ? new Date(since) : undefined;
    
    const result = await storage.getArticles({
      sourceId,
      search,
      since: sinceDate,
      page,
      pageSize,
      userId,
      bookmarkedOnly,
      unreadOnly,
    });

    return {
      articles: result.articles,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async getSources(): Promise<SourceWithCount[]> {
    return storage.getSourcesWithCounts();
  }

  async getLastRefreshTime(): Promise<string | null> {
    return storage.getLastRefreshTime();
  }

  async getArticle(id: string, userId?: number): Promise<ArticleWithStatus | undefined> {
    return storage.getArticle(id, userId);
  }

  async getRelatedArticles(articleId: string, limit: number = 5): Promise<ArticleWithStatus[]> {
    const article = await storage.getArticle(articleId);
    if (!article) return [];

    // Get articles from the same source
    const result = await storage.getArticles({
      sourceId: article.sourceId,
      page: 1,
      pageSize: limit + 1, // +1 to account for current article
    });

    return result.articles.filter((a) => a.id !== articleId).slice(0, limit);
  }
}

export const articleStore = new ArticleStore();
