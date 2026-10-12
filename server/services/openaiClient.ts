export class AiServiceError extends Error {
  constructor(message: string, public status = 503) {
    super(message);
  }
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  requests: number;
}

function providerError(status: number): AiServiceError {
  if (status === 401) return new AiServiceError("OpenAI rejected the API key. Update it in admin Secrets settings.", 401);
  if (status === 403 || status === 404) return new AiServiceError("The selected OpenAI model is not available to this account.", 403);
  if (status === 429) return new AiServiceError("OpenAI quota or rate limit reached. Check account billing or try again later.", 429);
  return new AiServiceError("OpenAI is temporarily unavailable. Please try again later.");
}

async function request(apiKey: string, path: string, body?: object) {
  try {
    const response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw providerError(response.status);
    return await response.json();
  } catch (error) {
    if (error instanceof AiServiceError) throw error;
    // Never retain or log provider bodies, headers, keys, or raw exceptions.
    throw new AiServiceError("OpenAI connection timed out or failed. Please try again later.");
  }
}

export async function verifyModelAccess(apiKey: string, model: string) {
  await request(apiKey, `models/${encodeURIComponent(model)}`);
}

export async function requestOpenAiSummary(apiKey: string, model: string, instructions: string, input: string) {
  const data = await request(apiKey, "responses", {
    model,
    instructions,
    input,
    store: false,
    reasoning: { effort: "minimal" },
    text: { verbosity: "low" },
    max_output_tokens: 2048,
  });
  const usage: AiUsage = {
    inputTokens: Number(data.usage?.input_tokens) || 0,
    outputTokens: Number(data.usage?.output_tokens) || 0,
    requests: 1,
  };
  const text = (data.output || [])
    .filter((item: any) => item.type === "message")
    .flatMap((item: any) => item.content || [])
    .filter((part: any) => part.type === "output_text")
    .map((part: any) => part.text)
    .join("\n")
    .trim();
  return { text, usage, complete: data.status === "completed" };
}
