import { ApiRequestError } from "./apiErrors";

// Display only app-controlled messages, never raw provider or proxy responses.
export function aiSummaryErrorMessage(error: unknown): string {
  const fallback = "AI summaries are temporarily unavailable. The original article link remains usable.";
  if (!(error instanceof ApiRequestError)) return fallback;

  switch (error.code) {
    case "insufficient_article_text":
      return "This article does not provide enough accessible text for a reliable AI summary. Please use the original article link.";
    case "summary_format_failed":
      return "AI could not produce a reliable two-paragraph, 120–180-word summary. Please try again or use the original article link.";
    case "summaries_disabled":
      return "AI summaries are switched off. The original article link remains usable.";
    case "invalid_api_key":
    case "not_configured":
      return "AI summaries need a working OpenAI API key. An administrator can update it in Secrets. The original article link remains usable.";
    case "model_unavailable":
      return "The selected AI model is unavailable for this account. An administrator can check the AI settings. The original article link remains usable.";
    case "quota_exceeded":
      return "The OpenAI usage limit has been reached. Please try later or ask an administrator to check API billing. The original article link remains usable.";
    default:
      return fallback;
  }
}
