import { db } from "./db";
import { articles } from "@shared/schema";
import { eq } from "drizzle-orm";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "x-ai/grok-3-mini-beta";

export async function generateAISummary(
  articleId: string,
  apiKey: string
): Promise<{ summary: string; cached: boolean }> {
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!article) {
    throw new Error("Article not found");
  }

  if (article.aiSummary) {
    return { summary: article.aiSummary, cached: true };
  }

  const articleContent = article.content || article.summary || article.title;
  
  const systemPrompt = `You are a professional news analyst. Your task is to provide comprehensive summaries of news articles. Focus on:
- The main facts and key points
- Who is involved and what happened
- The background and context
- Why it matters (significance/impact)
- Potential implications or what to watch for next
- Keep it objective and neutral
- Use simple, accessible language
Format: Write 4-5 detailed paragraphs (about 300-400 words total).`;

  const userPrompt = `Please summarize this news article:

Title: ${article.title}

Content: ${articleContent}

Source: ${article.sourceName || "Unknown"}`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : "http://localhost:5000",
      "X-Title": "LUM News",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", response.status, errorText);
    
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your OpenRouter API key.");
    }
    if (response.status === 402) {
      throw new Error("Insufficient credits. Please add credits to your OpenRouter account.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    
    throw new Error(`AI service error: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from AI service");
  }

  const summary = data.choices[0].message.content.trim();

  await db
    .update(articles)
    .set({ aiSummary: summary })
    .where(eq(articles.id, articleId));

  return { summary, cached: false };
}

export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }
  if (apiKey.length < 20) {
    return false;
  }
  if (!apiKey.startsWith("sk-or-")) {
    return false;
  }
  return true;
}
