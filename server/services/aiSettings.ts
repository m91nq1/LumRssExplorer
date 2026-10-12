import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { systemSettings } from "@shared/schema";
import { AiServiceError, type AiUsage } from "./openaiClient";

export const AI_MODELS = ["gpt-5-nano", "gpt-5-mini", "gpt-5"];
const CONFIG_KEY = "openai_summary_config";
const USAGE_KEY = "openai_summary_usage";
const ERROR_KEY = "openai_summary_error";

export interface AiConfig {
  model: string;
  enabled: boolean;
  encryptedKey?: string;
  environmentKeyDisabled?: boolean;
  verifiedAt: string | null;
}
const defaults: AiConfig = { model: "gpt-5-nano", enabled: false, verifiedAt: null };

export async function readSetting(key: string) {
  const [row] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return row?.value || null;
}

export async function writeSetting(key: string, value: string) {
  await db.insert(systemSettings).values({ key, value })
    .onConflictDoUpdate({ target: systemSettings.key, set: { value, updatedAt: new Date() } });
}

function encryptionKey() {
  const secret = process.env.AI_SECRET_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new AiServiceError("Server secret encryption is not configured. Configure a stable encryption secret of at least 32 characters.", 503);
  }
  return createHash("sha256").update(`lum-openai-secrets-v1:${secret}`).digest();
}

export function encryptApiKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString("base64")).join(".");
}

export async function getAiConfig(): Promise<AiConfig> {
  const saved = await readSetting(CONFIG_KEY);
  return saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults };
}

export async function saveAiConfig(config: AiConfig) {
  await writeSetting(CONFIG_KEY, JSON.stringify(config));
}

export function resolveApiKey(config: AiConfig): string | undefined {
  if (config.encryptedKey) {
    try {
      const [iv, tag, ciphertext] = config.encryptedKey.split(".").map(part => Buffer.from(part, "base64"));
      const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    } catch {
      throw new AiServiceError("Unable to decrypt the saved key. Restore the encryption secret or save the API key again.");
    }
  }
  return config.environmentKeyDisabled ? undefined : process.env.OPENAI_API_KEY;
}

export async function recordUsage(usage: AiUsage) {
  const value = JSON.stringify(usage);
  await db.execute(sql`
    INSERT INTO system_settings (key, value, updated_at) VALUES (${USAGE_KEY}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = jsonb_build_object(
      'inputTokens', (system_settings.value::jsonb->>'inputTokens')::bigint + ${usage.inputTokens},
      'outputTokens', (system_settings.value::jsonb->>'outputTokens')::bigint + ${usage.outputTokens},
      'requests', (system_settings.value::jsonb->>'requests')::bigint + ${usage.requests}
    )::text, updated_at = NOW()
  `);
}

export async function recordAiError(message: string | null) {
  await writeSetting(ERROR_KEY, JSON.stringify(message ? { message, at: new Date().toISOString() } : null));
}

export async function publicAiSettings(config?: AiConfig) {
  const current = config || await getAiConfig();
  const [usage, error] = await Promise.all([readSetting(USAGE_KEY), readSetting(ERROR_KEY)]);
  return {
    model: current.model,
    enabled: current.enabled,
    keyConfigured: Boolean(current.encryptedKey || (!current.environmentKeyDisabled && process.env.OPENAI_API_KEY)),
    keySource: current.encryptedKey ? "encrypted" : !current.environmentKeyDisabled && process.env.OPENAI_API_KEY ? "environment" : "none",
    verifiedAt: current.verifiedAt,
    lastError: error ? JSON.parse(error)?.message || null : null,
    usage: usage ? JSON.parse(usage) : { inputTokens: 0, outputTokens: 0, requests: 0 },
    models: AI_MODELS,
  };
}
