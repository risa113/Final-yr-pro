/**
 * Modular AI Provider Manager
 * Manages vision & text model selection, quota-aware fallback,
 * provider health tracking, and HTTP 429 / RESOURCE_EXHAUSTED handling.
 */

import { GoogleGenAI } from "@google/genai";
import { getDefaultGeminiApiKey } from "../utils";

export type AIProviderName = "gemini" | "openai";

export interface ProviderHealth {
  provider: AIProviderName;
  model: string;
  isAvailable: boolean;
  isQuotaExhausted: boolean;
  cooldownUntil: number;
  lastError?: string;
  successCount: number;
  failureCount: number;
  lastLatencyMs?: number;
}

// In-memory provider health tracker
const providerHealthMap = new Map<string, ProviderHealth>();

export function getProviderHealth(key: string): ProviderHealth {
  const existing = providerHealthMap.get(key);
  if (existing) return existing;

  const initial: ProviderHealth = {
    provider: key.startsWith("openai") ? "openai" : "gemini",
    model: key,
    isAvailable: true,
    isQuotaExhausted: false,
    cooldownUntil: 0,
    successCount: 0,
    failureCount: 0,
  };
  providerHealthMap.set(key, initial);
  return initial;
}

export function recordProviderSuccess(key: string, latencyMs: number) {
  const h = getProviderHealth(key);
  h.isAvailable = true;
  h.isQuotaExhausted = false;
  h.cooldownUntil = 0;
  h.successCount += 1;
  h.lastLatencyMs = latencyMs;
}

export function recordProviderFailure(key: string, error: any) {
  const h = getProviderHealth(key);
  h.failureCount += 1;
  h.lastError = error?.message || String(error);

  const isQuota = isQuotaExhaustedError(error);
  if (isQuota) {
    h.isQuotaExhausted = true;
    // Set 60-second cooldown before retrying this specific model
    h.cooldownUntil = Date.now() + 60 * 1000;
    console.warn(`[AI Provider Quota Exhausted]: Model ${key} cooldown until ${new Date(h.cooldownUntil).toISOString()}`);
  } else {
    h.isAvailable = false;
    // 15-second cooldown for transient network issues
    h.cooldownUntil = Date.now() + 15 * 1000;
  }
}

/**
 * Determines whether an error is an HTTP 429 / RESOURCE_EXHAUSTED quota error.
 */
export function isQuotaExhaustedError(error: any): boolean {
  if (!error) return false;
  const msg = (error?.message || error?.statusText || String(error)).toLowerCase();
  const status = error?.status || error?.statusCode || error?.code;

  return (
    status === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("exceeded your current quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit_exceeded")
  );
}

/**
 * Ordered vision model candidate list.
 * Fast, reliable 2026 models with immediate quota availability.
 */
export const VISION_MODEL_CANDIDATES = [
  process.env.PRIMARY_VISION_MODEL || "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
];

export interface MultimodalVisionOptions {
  prompt: string;
  base64Image: string;
  mimeType?: string;
  temperature?: number;
}

export interface MultimodalVisionResult {
  text: string;
  provider: AIProviderName;
  model: string;
  latencyMs: number;
}

/**
 * Analyzes an image with automatic quota-aware model & provider fallback.
 */
export async function executeVisionAnalysis(
  options: MultimodalVisionOptions
): Promise<MultimodalVisionResult> {
  const { prompt, base64Image, mimeType = "image/jpeg", temperature = 0.2 } = options;
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  let lastError: any = null;
  let allQuotaExhausted = false;

  // 1. Try Gemini Vision candidates
  const geminiKey = getDefaultGeminiApiKey();
  if (geminiKey && geminiKey !== "AIzaSy...") {
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    for (const model of VISION_MODEL_CANDIDATES) {
      const health = getProviderHealth(model);
      // Skip model if currently in cooldown
      if (health.cooldownUntil > Date.now()) {
        console.log(`[Vision Dispatcher] Skipping model ${model} (cooldown active)`);
        continue;
      }

      const t0 = Date.now();
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature,
          },
        });

        const text = response.text || "";
        if (text) {
          const latency = Date.now() - t0;
          recordProviderSuccess(model, latency);
          return {
            text,
            provider: "gemini",
            model,
            latencyMs: latency,
          };
        }
      } catch (err: any) {
        lastError = err;
        const isQuota = isQuotaExhaustedError(err);
        if (!isQuota) {
          allQuotaExhausted = false;
        }
        recordProviderFailure(model, err);
        console.warn(`[Vision Dispatcher] Gemini model ${model} failed: ${err.message?.slice(0, 100)}`);
      }
    }
  }

  // 2. Try Secondary Vision Provider (OpenAI) if configured
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.startsWith("sk-")) {
    const openaiModel = process.env.SECONDARY_VISION_MODEL || "gpt-4o-mini";
    const health = getProviderHealth(`openai_${openaiModel}`);

    if (health.cooldownUntil <= Date.now()) {
      const t0 = Date.now();
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: { url: `data:${mimeType};base64,${cleanBase64}` },
                  },
                ],
              },
            ],
            response_format: { type: "json_object" },
            temperature,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || "";
          if (content) {
            const latency = Date.now() - t0;
            recordProviderSuccess(`openai_${openaiModel}`, latency);
            return {
              text: content,
              provider: "openai",
              model: openaiModel,
              latencyMs: latency,
            };
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `OpenAI vision responded with status ${res.status}`);
        }
      } catch (openAiErr: any) {
        lastError = openAiErr;
        recordProviderFailure(`openai_${openaiModel}`, openAiErr);
        console.warn(`[Vision Dispatcher] OpenAI fallback failed: ${openAiErr.message?.slice(0, 100)}`);
      }
    }
  }

  // 3. Transparent Quota / Failure Error
  if (lastError && (isQuotaExhaustedError(lastError) || allQuotaExhausted)) {
    const error: any = new Error(
      "The AI Vision service has temporarily reached its Free Tier quota limit. Please wait a minute and retry, or enter portions manually."
    );
    error.isQuotaExhausted = true;
    error.canRetry = true;
    error.retryAfterSeconds = 60;
    throw error;
  }

  throw new Error(
    lastError?.message ||
      "All configured AI vision providers failed to analyze the image. Please verify your connection or try again."
  );
}
