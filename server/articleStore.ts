import { InsertArticle, InsertFeedSource, FeedSource, SourceWithCount, ArticleWithStatus } from "@shared/schema";
import { storage } from "./storage";
import { ingestFeed } from "./rssIngestor";
import { tagArticleTopics, generatePolarisationScore, mapCountryToRegion } from "./topicTagger";
import { newsProviderService } from "./newsProviderService";
import cron from "node-cron";

// Default RSS feeds to seed on first run
const DEFAULT_FEEDS: InsertFeedSource[] = [
  // World News
  {
    id: "bbc-world",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/world/rss.xml",
    sourceType: "rss",
    country: "UK",
    region: "UK",
    category: "world",
  },
  {
    id: "cnn-world",
    name: "CNN",
    url: "http://rss.cnn.com/rss/edition_world.rss",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "world",
  },
  {
    id: "nyt-world",
    name: "NYT",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "world",
  },
  {
    id: "guardian-world",
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    sourceType: "rss",
    country: "UK",
    region: "UK",
    category: "world",
  },
  {
    id: "google-news",
    name: "Google News",
    url: "https://news.google.com/rss",
    sourceType: "rss",
    region: "Global",
    category: "world",
  },
  // Technology
  {
    id: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "technology",
  },
  {
    id: "the-verge",
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "technology",
  },
  {
    id: "wired",
    name: "Wired",
    url: "https://www.wired.com/feed/rss",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "technology",
  },
  {
    id: "ars-technica",
    name: "Ars Technica",
    url: "https://feeds.feedburner.com/arstechnica/index",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "technology",
  },
  // Startups & VC
  {
    id: "hacker-news",
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "startups",
  },
  {
    id: "venturebeat",
    name: "VentureBeat",
    url: "https://venturebeat.com/feed/",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "startups",
  },
  // AI & Machine Learning
  {
    id: "openai-blog",
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss/",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "ai",
  },
  {
    id: "mit-tech-ai",
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "ai",
  },
  // Programming & Development
  {
    id: "dev-to",
    name: "DEV Community",
    url: "https://dev.to/feed",
    sourceType: "rss",
    country: "US",
    region: "Global",
    category: "programming",
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    url: "https://github.blog/feed/",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "programming",
  },
  {
    id: "freecodecamp",
    name: "freeCodeCamp",
    url: "https://www.freecodecamp.org/news/rss/",
    sourceType: "rss",
    country: "US",
    region: "Global",
    category: "programming",
  },
  // Cybersecurity
  {
    id: "krebs-security",
    name: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "cybersecurity",
  },
  {
    id: "hacker-news-security",
    name: "The Hacker News",
    url: "https://feeds.feedburner.com/TheHackersNews",
    sourceType: "rss",
    region: "Global",
    category: "cybersecurity",
  },
  // Business & Finance
  {
    id: "cnbc-business",
    name: "CNBC",
    url: "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "business",
  },
  {
    id: "marketwatch",
    name: "MarketWatch",
    url: "https://www.marketwatch.com/rss/topstories",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "finance",
  },
  // Cryptocurrency
  {
    id: "coindesk",
    name: "CoinDesk",
    url: "https://www.coindesk.com/feed/",
    sourceType: "rss",
    country: "US",
    region: "Global",
    category: "crypto",
  },
  {
    id: "cointelegraph",
    name: "CoinTelegraph",
    url: "https://cointelegraph.com/rss",
    sourceType: "rss",
    region: "Global",
    category: "crypto",
  },
  // Science
  {
    id: "science-daily",
    name: "Science Daily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "science",
  },
  {
    id: "nasa",
    name: "NASA",
    url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "science",
  },
  {
    id: "space-com",
    name: "Space.com",
    url: "https://www.space.com/feeds/all",
    sourceType: "rss",
    country: "US",
    region: "US",
    category: "science",
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
    
    // Upsert default feeds (add new ones, update existing ones with region metadata)
    const existingSources = await storage.getFeedSources();
    const existingSourcesMap = new Map(existingSources.map(s => [s.id, s]));
    
    let newFeedsAdded = 0;
    let feedsUpdated = 0;
    for (const feed of DEFAULT_FEEDS) {
      const existing = existingSourcesMap.get(feed.id);
      if (!existing) {
        try {
          await storage.createFeedSource(feed);
          newFeedsAdded++;
        } catch (error) {
          console.error(`Error seeding feed ${feed.name}:`, error);
        }
      } else if (existing.region !== feed.region) {
        try {
          await storage.updateFeedSource(feed.id, { region: feed.region });
          feedsUpdated++;
        } catch (error) {
          console.error(`Error updating feed region ${feed.name}:`, error);
        }
      }
    }
    
    if (newFeedsAdded > 0) {
      console.log(`Added ${newFeedsAdded} new RSS feeds`);
    }
    if (feedsUpdated > 0) {
      console.log(`Updated ${feedsUpdated} feed sources with region metadata`);
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

      // Tag articles with topics and polarisation scores
      const taggedArticles = allArticles.map(article => ({
        ...article,
        topics: article.topics || tagArticleTopics(article.title, article.summary),
        polarisationScore: article.polarisationScore ?? generatePolarisationScore(),
      }));

      // Upsert all articles to database
      const inserted = await storage.upsertArticles(taggedArticles);
      
      console.log(`RSS refresh complete. Processed ${allArticles.length} articles.`);

      // Fetch from external news API providers (if any are enabled)
      if (newsProviderService.isAvailable()) {
        try {
          console.log("Starting external news API providers refresh...");
          const providerResults = await newsProviderService.refreshFromExternalProviders();
          const totalExternal = providerResults.reduce((sum, r) => sum + r.articlesIngested, 0);
          if (providerResults.length > 0) {
            console.log(`External providers refresh complete. Ingested ${totalExternal} articles from ${providerResults.length} provider(s).`);
          }
        } catch (error) {
          console.error("Error refreshing from external providers:", error);
        }
      }

      // Update last refresh time
      await storage.setLastRefreshTime(new Date().toISOString());
      
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

  async getFilteredArticles(params: {
    sourceId?: string;
    topics?: string;
    regions?: string;
    search?: string;
    caseSensitive?: boolean;
    exactPhrase?: boolean;
    since?: string;
    page?: number;
    pageSize?: number;
    userId?: number;
    bookmarkedOnly?: boolean;
    unreadOnly?: boolean;
    mostPolarised?: boolean;
  }) {
    const {
      sourceId,
      topics,
      regions,
      search,
      caseSensitive,
      exactPhrase,
      since,
      page = 1,
      pageSize = 20,
      userId,
      bookmarkedOnly,
      unreadOnly,
      mostPolarised,
    } = params;

    const sinceDate = since ? new Date(since) : undefined;
    const topicsArray = topics ? topics.split(",").map(t => t.trim()) : undefined;
    const regionsArray = regions ? regions.split(",").map(r => r.trim()) : undefined;
    
    const result = await storage.getArticles({
      sourceId,
      topics: topicsArray,
      regions: regionsArray,
      search,
      caseSensitive,
      exactPhrase,
      since: sinceDate,
      page,
      pageSize,
      userId,
      bookmarkedOnly,
      unreadOnly,
      mostPolarised,
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
