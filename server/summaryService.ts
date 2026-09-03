import { db } from "./db";
import { articles } from "@shared/schema";
import { eq } from "drizzle-orm";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

function formatSummary(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const cappedWords = normalized.split(/\s+/).slice(0, 200);
  const cappedText = cappedWords.join(" ");
  const sentences =
    cappedText.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) ||
    [];

  if (sentences.length >= 2) {
    const targetWords = Math.ceil(cappedWords.length / 2);
    let firstParagraphWords = 0;
    let splitIndex = 1;

    for (let index = 0; index < sentences.length - 1; index += 1) {
      firstParagraphWords += sentences[index].split(/\s+/).length;
      splitIndex = index + 1;
      if (firstParagraphWords >= targetWords) break;
    }

    return `${sentences.slice(0, splitIndex).join(" ")}\n\n${sentences
      .slice(splitIndex)
      .join(" ")}`;
  }

  const splitIndex = Math.max(1, Math.ceil(cappedWords.length / 2));
  return `${cappedWords.slice(0, splitIndex).join(" ")}\n\n${cappedWords
    .slice(splitIndex)
    .join(" ")}`;
}

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
    const formattedSummary = formatSummary(article.aiSummary);

    if (formattedSummary !== article.aiSummary) {
      await db
        .update(articles)
        .set({ aiSummary: formattedSummary })
        .where(eq(articles.id, articleId));
    }

    return { summary: formattedSummary, cached: true };
  }

  const articleContent = article.content || article.summary || article.title;
  
  const systemPrompt = `You are a professional news analyst. Your task is to provide concise summaries of news articles. Focus on:
- The main facts and key points
- Who is involved and what happened
- Why it matters (significance/impact)
- Keep it objective and neutral
- Use simple, accessible language
Format: Write exactly 2 paragraphs, separated by a blank line. Do not exceed 200 words total.`;

  const userPrompt = `Please summarize this news article:

Title: ${article.title}

Content: ${articleContent}

Source: ${article.sourceName || "Unknown"}`;

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google AI Studio API error:", response.status, errorText);
    
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new Error("Google AI Studio rejected the request. Please check the Gemini API key and its permissions.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    
    throw new Error(`AI service error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  
  if (!data.candidates?.length) {
    if (data.promptFeedback?.blockReason) {
      throw new Error(`AI summary was blocked: ${data.promptFeedback.blockReason}`);
    }
    throw new Error("No response from AI service");
  }

  const generatedSummary = data.candidates[0].content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!generatedSummary) {
    throw new Error("No response from AI service");
  }

  const summary = formatSummary(generatedSummary);

  await db
    .update(articles)
    .set({ aiSummary: summary })
    .where(eq(articles.id, articleId));

  return { summary, cached: false };
}
