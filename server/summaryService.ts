import { db } from "./db";
import { articles } from "@shared/schema";
import { eq } from "drizzle-orm";

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: number | string;
  };
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

function formatSummary(text: string): string {
  const originalParagraphs = text
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (
    originalParagraphs.length === 2 &&
    originalParagraphs.every((paragraph) => {
      const paragraphWords = paragraph.split(/\s+/).length;
      return paragraphWords >= 80 && paragraphWords <= 100;
    }) &&
    originalParagraphs.join(" ").split(/\s+/).length <= 200
  ) {
    return originalParagraphs.join("\n\n");
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  const cappedWords = normalized.split(/\s+/).slice(0, 200);
  const cappedText = cappedWords.join(" ");
  const sentences =
    cappedText.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) ||
    [];

  if (sentences.length >= 2) {
    const targetWords = Math.ceil(cappedWords.length / 2);
    let runningWords = 0;
    let splitIndex = 1;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < sentences.length - 1; index += 1) {
      runningWords += sentences[index].split(/\s+/).length;
      const secondParagraphWords = cappedWords.length - runningWords;
      const distance = Math.abs(runningWords - targetWords);

      if (
        runningWords >= 80 &&
        runningWords <= 100 &&
        secondParagraphWords >= 80 &&
        secondParagraphWords <= 100 &&
        distance < closestDistance
      ) {
        splitIndex = index + 1;
        closestDistance = distance;
      }
    }

    if (closestDistance === Number.POSITIVE_INFINITY) {
      const wordSplitIndex = Math.ceil(cappedWords.length / 2);
      return `${cappedWords.slice(0, wordSplitIndex).join(" ")}\n\n${cappedWords
        .slice(wordSplitIndex)
        .join(" ")}`;
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

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function meetsSummaryRequirements(summary: string): boolean {
  const paragraphs = summary.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());
  const totalWords = wordCount(summary);

  return (
    paragraphs.length === 2 &&
    totalWords >= 160 &&
    totalWords <= 200 &&
    paragraphs.every((paragraph) => {
      const paragraphWords = wordCount(paragraph);
      return paragraphWords >= 80 && paragraphWords <= 100;
    })
  );
}

async function requestOpenRouterSummary(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", response.status, errorText);

    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid OpenRouter API key or insufficient permissions.");
    }
    if (response.status === 402) {
      throw new Error("Insufficient OpenRouter credits.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    throw new Error(`AI service error: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();

  if (data.error?.message) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  const generatedSummary = data.choices?.[0]?.message?.content?.trim();

  if (!generatedSummary) {
    throw new Error("No response from AI service");
  }

  return generatedSummary;
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

    if (meetsSummaryRequirements(formattedSummary)) {
      if (formattedSummary !== article.aiSummary) {
        await db
          .update(articles)
          .set({ aiSummary: formattedSummary })
          .where(eq(articles.id, articleId));
      }

      return { summary: formattedSummary, cached: true };
    } else {
      await db
        .update(articles)
        .set({ aiSummary: null })
        .where(eq(articles.id, articleId));
    }
  }

  const articleContent = article.content || article.summary || article.title;
  
  const systemPrompt = `You are a professional news analyst. Your task is to provide concise summaries of news articles. Focus on:
- The main facts and key points
- Who is involved and what happened
- Why it matters (significance/impact)
- Keep it objective and neutral
- Use simple, accessible language
Format: Write exactly 2 paragraphs, separated by a blank line. Write 80-100 words in each paragraph, aiming for about 100 words per paragraph. The complete summary must contain 160-200 words—never fewer than 160 and never more than 200.`;

  const userPrompt = `Please summarize this news article:

Title: ${article.title}

Content: ${articleContent}

Source: ${article.sourceName || "Unknown"}`;

  let generatedSummary = await requestOpenRouterSummary(apiKey, systemPrompt, userPrompt);
  let summary = formatSummary(generatedSummary);

  if (!meetsSummaryRequirements(summary)) {
    const revisionPrompt = `Rewrite the draft summary below so it follows every format rule exactly.

- Return exactly two paragraphs separated by one blank line.
- Each paragraph must contain 80-100 words.
- The total must contain 160-200 words.
- Preserve only facts supported by the supplied article.
- Do not include a title, labels, bullet points, or commentary.

Article title: ${article.title}
Article content: ${articleContent}

Draft to revise:
${generatedSummary}`;

    generatedSummary = await requestOpenRouterSummary(apiKey, systemPrompt, revisionPrompt);
    summary = formatSummary(generatedSummary);
  }

  if (!meetsSummaryRequirements(summary)) {
    console.error("AI summary failed format validation", {
      totalWords: wordCount(summary),
      paragraphWords: summary
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph) => wordCount(paragraph)),
    });
    throw new Error("AI service returned a summary outside the required 160-200 word range. Please try again.");
  }

  await db
    .update(articles)
    .set({ aiSummary: summary })
    .where(eq(articles.id, articleId));

  return { summary, cached: false };
}
