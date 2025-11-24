import { Article, SourceWithCount } from "@shared/schema";
import { RSS_FEEDS } from "./rssFeedsConfig";
import { ingestAllFeeds } from "./rssIngestor";
import cron from "node-cron";

export class ArticleStore {
  private articles: Map<string, Article> = new Map();
  private lastRefreshTime: string | null = null;
  private isRefreshing = false;

  constructor() {
    this.scheduleRefresh();
  }

  async initialize() {
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
      const newArticles = await ingestAllFeeds(RSS_FEEDS);

      for (const article of newArticles) {
        this.articles.set(article.id, article);
      }

      this.lastRefreshTime = new Date().toISOString();
      console.log(`Refresh complete. Total articles: ${this.articles.size}`);
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

  getAllArticles(): Article[] {
    return Array.from(this.articles.values()).sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  getFilteredArticles(
    sourceId?: string,
    search?: string,
    since?: string
  ): Article[] {
    let articles = this.getAllArticles();

    if (sourceId) {
      const sourceIds = sourceId.split(",").map((id) => id.trim());
      articles = articles.filter((a) => sourceIds.includes(a.sourceId));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.summary?.toLowerCase().includes(searchLower)
      );
    }

    if (since) {
      const sinceDate = new Date(since);
      articles = articles.filter(
        (a) => new Date(a.publishedAt) >= sinceDate
      );
    }

    return articles;
  }

  getPaginatedArticles(
    articles: Article[],
    page: number,
    pageSize: number
  ) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedArticles = articles.slice(start, end);
    const total = articles.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
      articles: paginatedArticles,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  getSources(): SourceWithCount[] {
    const sourceCounts = new Map<string, number>();

    const articles = Array.from(this.articles.values());
    for (const article of articles) {
      sourceCounts.set(
        article.sourceId,
        (sourceCounts.get(article.sourceId) || 0) + 1
      );
    }

    return RSS_FEEDS.map((feed) => ({
      id: feed.id,
      name: feed.name,
      articleCount: sourceCounts.get(feed.id) || 0,
    }));
  }

  getLastRefreshTime(): string | null {
    return this.lastRefreshTime;
  }
}

export const articleStore = new ArticleStore();
