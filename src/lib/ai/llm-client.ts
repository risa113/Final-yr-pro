import { GoogleGenAI } from "@google/genai";

/**
 * Production model configurations optimized for minimum latency.
 * Fast mode prefers low-latency flash-lite models with <600ms TTFT.
 * Deep mode uses higher-capacity reasoning models.
 */
export const FAST_MODEL = process.env.GEMINI_FAST_MODEL || "gemini-3.1-flash-lite";
export const DEEP_MODEL = process.env.GEMINI_DEEP_MODEL || "gemini-3.5-flash";

export const FAST_MODEL_CANDIDATES = [
  FAST_MODEL,
  "gemini-flash-lite-latest",
  DEEP_MODEL,
  "gemini-3.8-flash",
];

export const DEEP_MODEL_CANDIDATES = [
  DEEP_MODEL,
  FAST_MODEL,
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
];

export const DEFAULT_MODEL_CANDIDATES = FAST_MODEL_CANDIDATES;

export interface LLMMessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
}

export interface LLMMessage {
  role: "user" | "model" | "system" | "assistant";
  parts: (string | LLMMessagePart)[];
}

export interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: any;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

/**
 * Centralized Gemini Client provider.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "AIzaSy...") {
    throw new Error(
      "GEMINI_API_KEY is not configured in .env.local. Please obtain your key from https://aistudio.google.com/app/apikey to enable AI capabilities."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Normalizes message contents for @google/genai
 */
function normalizeContents(messages: LLMMessage[]) {
  return messages.map((m) => {
    const role = m.role === "assistant" ? "model" : m.role;
    const parts = m.parts.map((p) => {
      if (typeof p === "string") {
        return { text: p };
      }
      return p;
    });
    return { role, parts };
  });
}

/**
 * Executes a generateContent call with automatic model fallback and retries.
 */
export async function generateTextWithFallback(
  messages: LLMMessage[],
  options: GenerateOptions = {}
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  const modelsToTry = options.model
    ? [options.model, ...DEFAULT_MODEL_CANDIDATES.filter((m) => m !== options.model)]
    : DEFAULT_MODEL_CANDIDATES;

  const normalizedContents = normalizeContents(messages);

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {
        temperature: options.temperature ?? 0.7,
      };

      if (options.systemInstruction) {
        config.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      if (options.maxOutputTokens) {
        config.maxOutputTokens = options.maxOutputTokens;
      }

      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: normalizedContents as any,
        config,
      });

      const responseText = response.text || "";
      return { text: responseText, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("429");

      console.warn(`[LLM Client] Model ${model} failed (${err.message?.slice(0, 80)}). Trying next fallback...`);

      if (!isTransient && !err?.message?.includes("not found") && !err?.message?.includes("404")) {
        // Non-transient error (e.g. invalid arguments), stop immediately
        throw err;
      }
    }
  }

  throw new Error(
    `All available AI models failed to respond. Last error: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Streams content back chunk by chunk with fallback.
 */
export async function* streamTextWithFallback(
  messages: LLMMessage[],
  options: GenerateOptions = {}
): AsyncGenerator<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  const modelsToTry = options.model
    ? [options.model, ...DEFAULT_MODEL_CANDIDATES.filter((m) => m !== options.model)]
    : DEFAULT_MODEL_CANDIDATES;

  const normalizedContents = normalizeContents(messages);
  let successModel = "";
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {
        temperature: options.temperature ?? 0.7,
      };

      if (options.systemInstruction) {
        config.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      if (options.maxOutputTokens) {
        config.maxOutputTokens = options.maxOutputTokens;
      }

      const streamResult = await ai.models.generateContentStream({
        model,
        contents: normalizedContents as any,
        config,
      });

      successModel = model;

      for await (const chunk of streamResult) {
        const text = chunk.text || "";
        if (text) {
          yield { text, modelUsed: model };
        }
      }

      return; // Streamed successfully to the end
    } catch (err: any) {
      lastError = err;
      console.warn(`[LLM Stream] Model ${model} stream error: ${err.message?.slice(0, 80)}`);
      // If we haven't yielded anything yet, try the next fallback model
      if (!successModel) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `All streaming models failed. Last error: ${lastError?.message || "Unknown error"}`
  );
}
