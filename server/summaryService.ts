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

async function requestGeminiSummary(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
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
        temperature: 0.5,
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

  let generatedSummary = await requestGeminiSummary(apiKey, systemPrompt, userPrompt);
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

    generatedSummary = await requestGeminiSummary(apiKey, systemPrompt, revisionPrompt);
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
