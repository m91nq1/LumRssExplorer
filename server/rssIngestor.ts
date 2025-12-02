import Parser from "rss-parser";
import { InsertArticle, FeedSource } from "@shared/schema";
import crypto from "crypto";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "LUM RSS Explorer/1.0",
  },
});

export interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  guid?: string;
  enclosure?: {
    url?: string;
    type?: string;
  };
}

export async function ingestFeed(feed: FeedSource): Promise<InsertArticle[]> {
  try {
    const result = await parser.parseURL(feed.url);
    const articles: InsertArticle[] = [];

    for (const item of result.items as RSSItem[]) {
      if (!item.title || !item.link) {
        continue;
      }

      const id = generateArticleId(item.link, item.guid);
      const publishedAt = item.pubDate
        ? new Date(item.pubDate)
        : new Date();

      const summary = item.contentSnippet || item.content || "";
      const cleanSummary = summary
        .replace(/<[^>]*>/g, "")
        .replace(/\n\n+/g, "\n")
        .trim()
        .slice(0, 500);

      const imageUrl = item.enclosure?.url
        ? item.enclosure.url
        : undefined;

      articles.push({
        id,
        title: item.title.trim(),
        link: item.link,
        sourceName: feed.name,
        sourceId: feed.id,
        publishedAt,
        summary: cleanSummary || null,
        imageUrl: imageUrl || null,
      });
    }

    return articles;
  } catch (error) {
    console.error(`Error ingesting feed ${feed.name}:`, error);
    return [];
  }
}

function generateArticleId(link: string, guid?: string): string {
  const baseString = guid || link;
  return crypto.createHash("md5").update(baseString).digest("hex");
}
