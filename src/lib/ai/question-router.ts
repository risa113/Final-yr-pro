/**
 * Intelligent Question Routing Engine
 * Identifies domain category, intent, language, and tool activation needs.
 */

export type DomainCategory =
  | "GENERAL_KNOWLEDGE"
  | "SCIENCE"
  | "MATHEMATICS"
  | "PROGRAMMING"
  | "TECHNOLOGY"
  | "EDUCATION"
  | "BUSINESS"
  | "WRITING"
  | "RESEARCH"
  | "NUTRITION"
  | "HEALTH"
  | "CREATIVE"
  | "OTHER";

export type DetectedLanguage = "en" | "ta" | "tanglish" | "hi" | "other";

export interface ToolTriggerRecommendation {
  toolName: "calculator" | "unit_converter" | "datetime" | "web_search" | "nutrition_db" | "none";
  params: Record<string, any>;
  reason: string;
}

export interface RoutingDecision {
  primaryDomain: DomainCategory;
  confidence: number;
  detectedLanguage: DetectedLanguage;
  requiresNutritionContext: boolean;
  recommendedTool?: ToolTriggerRecommendation;
  isFollowUpCandidate: boolean;
  mode: "fast" | "deep";
}

/**
 * Fast intent analyzer and classifier.
 * Employs robust semantic pattern recognition and linguistic cues
 * without adding latency, while falling back gracefully to GENERAL_KNOWLEDGE.
 */
export function routeUserQuestion(
  message: string,
  hasFileAttached: boolean = false
): RoutingDecision {
  const text = message.trim();
  const lower = text.toLowerCase();

  // Smart Mode Determination (Fast Mode for rapid daily interactions; Deep Mode for complex reasoning)
  const isDeepQuery =
    hasFileAttached ||
    lower.includes("in-depth") ||
    lower.includes("comprehensive") ||
    lower.includes("architecture") ||
    lower.includes("step by step") ||
    lower.includes("step-by-step") ||
    lower.includes("detailed explanation") ||
    lower.includes("business plan") ||
    lower.includes("debug this") ||
    (lower.includes("write a complete") && text.length > 50) ||
    text.split(/\s+/).length > 40;

  const mode: "fast" | "deep" = isDeepQuery ? "deep" : "fast";

  // 1. Language detection
  const detectedLanguage = detectLanguage(text);

  // 2. Mathematical calculation detection
  // e.g. "250 * 48", "calculate 1500 / 12", "what is 45 + 98", "sqrt(144)"
  const mathCalcRegex =
    /(?:what is|calculate|evaluate|solve)?\s*(\b\d+(?:\.\d+)?\s*(?:[\+\-\*\/\^×÷]|multiplied by|divided by|plus|minus)\s*\d+(?:\.\d+)?(?:\s*[\+\-\*\/\^×÷]\s*\d+(?:\.\d+)?)*)/i;
  const directMathMatch = lower.match(mathCalcRegex);

  if (
    directMathMatch &&
    (lower.includes("multiplied") ||
      lower.includes("divided") ||
      /[0-9]\s*[\*\/\+\-\^×÷]\s*[0-9]/.test(lower) ||
      lower.startsWith("calculate") ||
      lower.startsWith("what is ") && /\d/.test(lower))
  ) {
    let expr = directMathMatch[1]
      .replace(/multiplied by/gi, "*")
      .replace(/divided by/gi, "/")
      .replace(/plus/gi, "+")
      .replace(/minus/gi, "-");

    return {
      primaryDomain: "MATHEMATICS",
      confidence: 0.95,
      detectedLanguage,
      requiresNutritionContext: false,
      recommendedTool: {
        toolName: "calculator",
        params: { expression: expr.trim() },
        reason: "User requested arithmetic or mathematical calculation.",
      },
      isFollowUpCandidate: false,
      mode: "fast",
    };
  }

  // 3. Unit conversion detection
  const unitRegex =
    /(?:convert|what is|how many)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z°]+)\s+(?:in|to|into)\s+([a-zA-Z°]+)/i;
  const unitMatch = lower.match(unitRegex);
  if (unitMatch) {
    return {
      primaryDomain: "MATHEMATICS",
      confidence: 0.92,
      detectedLanguage,
      requiresNutritionContext: false,
      recommendedTool: {
        toolName: "unit_converter",
        params: {
          value: parseFloat(unitMatch[1]),
          fromUnit: unitMatch[2],
          toUnit: unitMatch[3],
        },
        reason: "User requested unit conversion.",
      },
      isFollowUpCandidate: false,
      mode: "fast",
    };
  }

  // 4. Date & Time inquiry detection
  if (
    lower.includes("what is today's date") ||
    lower.includes("current date") ||
    lower.includes("what day is it") ||
    lower.includes("current time") ||
    lower.includes("what is the time") ||
    lower.includes("today's date")
  ) {
    return {
      primaryDomain: "GENERAL_KNOWLEDGE",
      confidence: 0.95,
      detectedLanguage,
      requiresNutritionContext: false,
      recommendedTool: {
        toolName: "datetime",
        params: { timeZone: "local" },
        reason: "User asked for real-time temporal verification.",
      },
      isFollowUpCandidate: false,
      mode: "fast",
    };
  }

  // 5. Food & Nutrition detection
  const nutritionKeywords = [
    "calorie",
    "calories",
    "protein",
    "carbs",
    "carbohydrates",
    "fat",
    "fiber",
    "nutrition",
    "nutrients",
    "diet",
    "meal",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "biryani",
    "idli",
    "dosa",
    "sambar",
    "chapati",
    "paneer",
    "food",
    "eat",
    "intake",
    "bmr",
    "tdee",
    "weight loss",
    "weight gain",
    "allergy",
    "allergies",
    "icmr",
    "ifct",
  ];

  const hasNutritionKeyword = nutritionKeywords.some((k) =>
    new RegExp(`\\b${k}\\b`, "i").test(lower)
  );

  if (hasNutritionKeyword) {
    // Check if it's a specific food query for database lookup
    const foodLookupMatch = lower.match(
      /(?:calories|protein|nutrients|nutrition|benefits).*?\b(?:in|of)\s+([a-zA-Z\s]+)/i
    );
    let toolRec: ToolTriggerRecommendation | undefined = undefined;

    if (foodLookupMatch) {
      const queriedFood = foodLookupMatch[1]
        .replace(/100g|100\s*g|cooked|raw|according to.*|ifct|icmr/gi, "")
        .trim();
      toolRec = {
        toolName: "nutrition_db",
        params: { query: queriedFood },
        reason: "User queried laboratory nutritional values for a specific food item.",
      };
    }

    return {
      primaryDomain: "NUTRITION",
      confidence: 0.9,
      detectedLanguage,
      requiresNutritionContext: true,
      recommendedTool: toolRec,
      isFollowUpCandidate: true,
      mode,
    };
  }

  // 6. Live Web Search indicator
  // Prioritize live search queries such as "latest version of React", "recent news", etc.
  if (
    lower.includes("latest") ||
    lower.includes("current version") ||
    lower.includes("recent news") ||
    lower.includes("what happened in") ||
    lower.includes("who is the current")
  ) {
    return {
      primaryDomain: "GENERAL_KNOWLEDGE",
      confidence: 0.85,
      detectedLanguage,
      requiresNutritionContext: false,
      recommendedTool: {
        toolName: "web_search",
        params: { query: text },
        reason: "User requested up-to-date real-world information.",
      },
      isFollowUpCandidate: false,
      mode: "fast",
    };
  }

  // 7. Programming & Software Development detection
  const programmingKeywords = [
    "code",
    "function",
    "react",
    "next.js",
    "javascript",
    "typescript",
    "python",
    "bug",
    "debug",
    "error",
    "syntax",
    "database",
    "sql",
    "nosql",
    "api",
    "rest",
    "graphql",
    "class",
    "component",
    "props",
    "hooks",
    "git",
    "algorithm",
    "docker",
    "html",
    "css",
    "tailwind",
  ];

  if (
    programmingKeywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower)) ||
    text.includes("```") ||
    text.includes("function(") ||
    text.includes("const ") ||
    text.includes("import ")
  ) {
    return {
      primaryDomain: "PROGRAMMING",
      confidence: 0.9,
      detectedLanguage,
      requiresNutritionContext: false,
      isFollowUpCandidate: true,
      mode,
    };
  }

  // 8. Science (Physics, Chemistry, Biology)
  const scienceKeywords = [
    "physics",
    "chemistry",
    "biology",
    "newton",
    "quantum",
    "thermodynamics",
    "gravity",
    "velocity",
    "molecule",
    "atom",
    "photosynthesis",
    "dna",
    "cell",
    "gravity",
    "relativity",
    "electron",
  ];
  if (scienceKeywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower))) {
    return {
      primaryDomain: "SCIENCE",
      confidence: 0.88,
      detectedLanguage,
      requiresNutritionContext: false,
      isFollowUpCandidate: true,
      mode,
    };
  }

  // 9. Mathematics (General concepts, proofs, formulas)
  const mathConcepts = [
    "calculus",
    "algebra",
    "matrix",
    "eigenvalue",
    "integral",
    "derivative",
    "probability",
    "theorem",
    "geometry",
  ];
  if (mathConcepts.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower))) {
    return {
      primaryDomain: "MATHEMATICS",
      confidence: 0.88,
      detectedLanguage,
      requiresNutritionContext: false,
      isFollowUpCandidate: true,
      mode,
    };
  }

  // 10. Business & Career
  const businessKeywords = [
    "business plan",
    "startup",
    "marketing",
    "resume",
    "interview",
    "career",
    "roi",
    "sales",
    "entrepreneur",
    "invest",
  ];
  if (businessKeywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower))) {
    return {
      primaryDomain: "BUSINESS",
      confidence: 0.85,
      detectedLanguage,
      requiresNutritionContext: false,
      isFollowUpCandidate: true,
      mode,
    };
  }

  // 11. Creative Writing
  const creativeKeywords = ["poem", "story", "write a letter", "creative", "fiction", "screenplay"];
  if (creativeKeywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower))) {
    return {
      primaryDomain: "CREATIVE",
      confidence: 0.85,
      detectedLanguage,
      requiresNutritionContext: false,
      isFollowUpCandidate: true,
      mode,
    };
  }

  // Fallback to GENERAL_KNOWLEDGE
  return {
    primaryDomain: "GENERAL_KNOWLEDGE",
    confidence: 0.75,
    detectedLanguage,
    requiresNutritionContext: false,
    isFollowUpCandidate: true,
    mode,
  };
}

/**
 * Detects whether the query is in English, Tamil, Tanglish, or Hindi.
 */
function detectLanguage(text: string): DetectedLanguage {
  // Check Tamil script (Unicode \u0B80-\u0BFF)
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return "ta";
  }

  // Check Devanagari / Hindi script (Unicode \u0900-\u097F)
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi";
  }

  // Tanglish cues (Tamil phrases written in Latin script)
  const tanglishMarkers = [
    /\bvanakkam\b/i,
    /\beppadi irukkeenga\b/i,
    /\beppadi irukka\b/i,
    /\bsollunga\b/i,
    /\benna panreenga\b/i,
    /\broba nandri\b/i,
    /\bnandri\b/i,
    /\btheriyuma\b/i,
    /\bpadikkanum\b/i,
    /\bvango\b/i,
    /\bseri\b/i,
  ];

  if (tanglishMarkers.some((regex) => regex.test(text))) {
    return "tanglish";
  }

  return "en";
}
