import { extract } from "@extractus/article-extractor";
import { db } from "./db";
import { articles } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface ExtractedContent {
  title?: string;
  content?: string;
  author?: string;
  publishedTime?: string;
  source?: string;
  image?: string;
  wordCount: number;
  cached: boolean;
}

export async function extractArticleContent(
  articleId: string
): Promise<ExtractedContent> {
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!article) {
    throw new Error("Article not found");
  }

  if (article.content && article.content.length > 500) {
    return {
      title: article.title,
      content: article.content,
      source: article.sourceName,
      image: article.imageUrl || undefined,
      wordCount: article.content.split(/\s+/).length,
      cached: true,
    };
  }

  try {
    const extracted = await extract(article.link);

    if (!extracted || !extracted.content) {
      return {
        title: article.title,
        content: article.summary || undefined,
        source: article.sourceName,
        image: article.imageUrl || undefined,
        wordCount: article.summary?.split(/\s+/).length || 0,
        cached: false,
      };
    }

    const cleanContent = extracted.content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanContent.length > 200) {
      await db
        .update(articles)
        .set({ content: cleanContent.slice(0, 10000) })
        .where(eq(articles.id, articleId));
    }

    return {
      title: extracted.title || article.title,
      content: cleanContent,
      author: extracted.author || undefined,
      publishedTime: extracted.published || undefined,
      source: extracted.source || article.sourceName,
      image: extracted.image || article.imageUrl || undefined,
      wordCount: cleanContent.split(/\s+/).length,
      cached: false,
    };
  } catch (error) {
    console.error(`Content extraction failed for ${article.link}:`, error);
    return {
      title: article.title,
      content: article.summary || undefined,
      source: article.sourceName,
      image: article.imageUrl || undefined,
      wordCount: article.summary?.split(/\s+/).length || 0,
      cached: false,
    };
  }
}
