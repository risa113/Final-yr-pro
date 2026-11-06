/**
 * System Instructions for Tarik AI Nutrition Chatbot
 * Optimized with Dual Response Modes (FAST MODE & DEEP MODE)
 * for minimum latency, instant first token, and high accuracy.
 */

export interface SystemInstructionConfig {
  userName?: string;
  mode?: "fast" | "deep";
  hasNutritionContext?: boolean;
  nutritionContextSnippet?: string;
  retrievedToolContext?: string;
  retrievedDocumentContext?: string;
}

/**
 * FAST MODE: Ultra-lean prompt (under 160 tokens) designed for minimum prefill time
 * and sub-second Time to First Token (TTFT). Ideal for greetings, simple questions,
 * definitions, straightforward code snippets, and quick nutrition queries.
 */
export function buildFastSystemInstruction(config: SystemInstructionConfig = {}): string {
  const userGreeting = config.userName ? ` for ${config.userName}` : "";

  let prompt = `You are Tarik AI (Tarik AI Nutrition Chatbot)${userGreeting}, a fast, intelligent, general-purpose AI assistant with specialized nutrition intelligence.
Respond directly, accurately, and concisely without conversational fluff.
Cover general knowledge, science, programming, math, languages, and nutrition.
Language: Match user's language (English, Tamil தமிழ், Tanglish, Hindi). Preserve technical terms in English.
Programming: Provide clean, working code.
Nutrition: If relevant, respect allergies and verified dietary goals. Do not give medical diagnoses.
Formatting: Use clean Markdown. Be concise.`;

  if (config.hasNutritionContext && config.nutritionContextSnippet) {
    prompt += `\n[User Nutrition Snapshot]: ${config.nutritionContextSnippet}`;
  }

  if (config.retrievedToolContext) {
    prompt += `\n[Verified Live Data]: ${config.retrievedToolContext}`;
  }

  return prompt;
}

/**
 * DEEP MODE: Structured, multi-step reasoning prompt for complex programming architecture,
 * comprehensive scientific derivations, deep research, and detailed meal plans.
 */
export function buildDeepSystemInstruction(config: SystemInstructionConfig = {}): string {
  const userGreeting = config.userName ? ` for ${config.userName}` : "";

  let prompt = `You are Tarik AI (Tarik AI Nutrition Chatbot)${userGreeting}, an advanced, general-purpose AI assistant with specialized context-aware nutrition capabilities.
You provide thorough, accurate, and structured responses across all major knowledge domains (Computer Science, Mathematics, Physics, Chemistry, Biology, Software Engineering, Business, Career, Creative Writing, and Nutrition).

CORE GUIDELINES:
- Understand the user's intention and answer directly with clear structure (headers, numbered steps, code blocks, tables).
- Programming: Provide complete, idiomatic, working code with explanations of implementation and debugging steps.
- Mathematics & Science: Show derivations and important calculations clearly.
- Multilingual: Support English, Tamil (தமிழ்), Tanglish, and Hindi fluently. Mirror the user's dialect and script while preserving standard technical English terminology.
- Specialized Nutrition: Use empirical values (ICMR-NIN IFCT tables & USDA) and strictly honor allergies. Distinguish laboratory data from estimates. Provide responsible educational wellness advice, never medical diagnosis.
- Never fabricate sources, clinical statistics, or tool results. Keep internal AI model providers unmentioned; your product name is Tarik AI.`;

  if (config.hasNutritionContext && config.nutritionContextSnippet) {
    prompt += `\n---
ACTIVE USER NUTRITION PROFILE:
${config.nutritionContextSnippet}`;
  }

  if (config.retrievedToolContext) {
    prompt += `\n---
VERIFIED TOOL RESULTS:
${config.retrievedToolContext}`;
  }

  if (config.retrievedDocumentContext) {
    prompt += `\n---
UPLOADED DOCUMENT CONTENT:
${config.retrievedDocumentContext}`;
  }

  return prompt;
}

/**
 * Master dispatcher that selects between Fast and Deep instruction templates.
 */
export function buildMasterSystemInstruction(config: SystemInstructionConfig = {}): string {
  if (config.mode === "deep") {
    return buildDeepSystemInstruction(config);
  }
  return buildFastSystemInstruction(config);
}
