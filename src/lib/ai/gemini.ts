import { GoogleGenAI } from "@google/genai";
import { findClosestIFCTFood, searchAllFoods } from "../nutrition/food-service";
import { scaleNutrients } from "../nutrition/calculator";

export interface FoodScanResult {
  scanId: string;
  detectedFoodName: string;
  confidenceScore: number;
  alternativeCandidates: string[];
  detectedIngredients: string[];
  estimatedServingG: number;
  servingDescription: string;
  confidenceReasoning: string;
  preparationMethod: string;
  uncertaintyNotes: string;
  matchedNutrition: {
    foodName: string;
    source: "ICMR_NIN" | "USDA" | "OPEN_FOOD_FACTS" | "AI_ESTIMATED";
    sourceId: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    isVerified: boolean;
  };
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "AIzaSy...") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your key in .env.local to enable AI features."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyzes food image using Gemini 2.5 Flash Multimodal API.
 * Follows the strict architectural rule: Gemini identifies the food and estimates portion;
 * verified laboratory databases (ICMR-NIN IFCT / USDA) provide the nutrient values.
 */
export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<FoodScanResult> {
  const ai = getGeminiClient();

  const prompt = `You are an expert AI Food & Nutrition Scientist specializing in global and traditional Indian cuisines.
Analyze this food photograph and return a structured JSON response matching the following schema.

IMPORTANT GUIDELINES:
1. Identify the primary dish accurately (e.g., 'Idli with Sambar', 'Masala Dosa', 'Chicken Biryani', 'Chapati with Dal Tadka', 'Apple', 'Oatmeal').
2. Provide 2-3 realistic alternative candidates if there is visual ambiguity.
3. List the visible ingredients.
4. Estimate the visible edible serving weight in grams based on standard bowl/plate proportions.
5. Provide a clear reasoning statement and note the inherent uncertainty of 2D visual weight estimation.

Return ONLY a valid JSON object with these exact keys:
{
  "detectedFoodName": "string (dish name)",
  "confidenceScore": number (0.0 to 1.0),
  "alternativeCandidates": ["string", "string"],
  "detectedIngredients": ["string", "string"],
  "estimatedServingG": number (grams, e.g. 150),
  "servingDescription": "string (e.g. 1 medium bowl, 2 pieces)",
  "confidenceReasoning": "string (why you identified this)",
  "preparationMethod": "string (e.g. steamed, deep fried, pan-roasted)",
  "uncertaintyNotes": "string (honest statement regarding depth/oil uncertainty)"
}`;

  // Clean base64 data if it contains data URI header
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2, // Low temperature for factual precision
    },
  });

  const responseText = response.text || "";
  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", responseText);
    throw new Error("AI returned an unparseable response. Please try again.");
  }

  const detectedFoodName = parsed.detectedFoodName || "Unknown Food Item";
  const estimatedServingG = Number(parsed.estimatedServingG) || 100;

  // STEP 2: Decoupled Empirical Nutrition Retrieval
  // Look up verified nutrients from ICMR-NIN IFCT or USDA
  const matchedIFCT = findClosestIFCTFood(detectedFoodName);

  let matchedNutrition: FoodScanResult["matchedNutrition"];

  if (matchedIFCT) {
    const scaled = scaleNutrients(
      {
        calories: matchedIFCT.caloriesPer100g,
        proteinG: matchedIFCT.proteinPer100g,
        carbsG: matchedIFCT.carbsPer100g,
        fatG: matchedIFCT.fatPer100g,
        fiberG: matchedIFCT.fiberPer100g,
      },
      estimatedServingG
    );

    matchedNutrition = {
      foodName: matchedIFCT.name,
      source: "ICMR_NIN",
      sourceId: matchedIFCT.sourceId,
      calories: scaled.calories,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
      fiberG: scaled.fiberG,
      isVerified: true,
    };
  } else {
    // Search USDA if not in local ICMR database
    const usdaMatches = await searchAllFoods(detectedFoodName, 1);
    if (usdaMatches.length > 0) {
      const top = usdaMatches[0];
      const scaled = scaleNutrients(
        {
          calories: top.caloriesPer100g,
          proteinG: top.proteinPer100g,
          carbsG: top.carbsPer100g,
          fatG: top.fatPer100g,
          fiberG: top.fiberPer100g,
        },
        estimatedServingG
      );

      matchedNutrition = {
        foodName: top.name,
        source: top.source,
        sourceId: top.sourceId,
        calories: scaled.calories,
        proteinG: scaled.proteinG,
        carbsG: scaled.carbsG,
        fatG: scaled.fatG,
        fiberG: scaled.fiberG,
        isVerified: true,
      };
    } else {
      // Conservative estimation placeholder clearly labeled
      matchedNutrition = {
        foodName: detectedFoodName,
        source: "AI_ESTIMATED",
        sourceId: "ESTIMATED",
        calories: Math.round(estimatedServingG * 1.5),
        proteinG: Math.round(estimatedServingG * 0.05 * 10) / 10,
        carbsG: Math.round(estimatedServingG * 0.2 * 10) / 10,
        fatG: Math.round(estimatedServingG * 0.05 * 10) / 10,
        fiberG: Math.round(estimatedServingG * 0.02 * 10) / 10,
        isVerified: false,
      };
    }
  }

  return {
    scanId: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    detectedFoodName,
    confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.85)),
    alternativeCandidates: Array.isArray(parsed.alternativeCandidates)
      ? parsed.alternativeCandidates
      : [],
    detectedIngredients: Array.isArray(parsed.detectedIngredients)
      ? parsed.detectedIngredients
      : [],
    estimatedServingG,
    servingDescription: parsed.servingDescription || `${estimatedServingG}g serving`,
    confidenceReasoning: parsed.confidenceReasoning || "Identified based on visual morphology.",
    preparationMethod: parsed.preparationMethod || "Standard culinary preparation",
    uncertaintyNotes:
      parsed.uncertaintyNotes ||
      "Photographic portion estimation is approximate. Confirm actual grams before logging.",
    matchedNutrition,
  };
}

export interface AssistantContext {
  userName?: string;
  age?: number;
  gender?: string;
  weightKg?: number;
  heightCm?: number;
  goalType?: string;
  dietaryType?: string;
  allergies?: string[];
  intolerances?: string[];
  dailyTargets: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  todayConsumed: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  recentMeals: {
    mealType: string;
    foodName: string;
    calories: number;
    proteinG: number;
  }[];
}

/**
 * Context-Aware Nutritionist Chat Assistant using Gemini.
 * Injects user context snapshot into the prompt for strictly personalized, allergy-safe responses.
 */
export async function chatWithAssistant(
  userMessage: string,
  context: AssistantContext,
  conversationHistory: { role: "user" | "model"; parts: [{ text: string }] }[] = []
): Promise<string> {
  const ai = getGeminiClient();

  const remainingCalories = Math.max(
    0,
    context.dailyTargets.calories - context.todayConsumed.calories
  );
  const remainingProtein = Math.max(
    0,
    context.dailyTargets.proteinG - context.todayConsumed.proteinG
  );

  const systemInstruction = `You are the Context-Aware AI Nutrition Assistant for ${
    context.userName || "the user"
  }.
You are an expert clinical nutrition scientist and supportive dietary coach.

USER PROFILE & CONTEXT:
- Biometrics: ${context.age || 25} yrs, ${context.gender || "unspecified"}, ${
    context.weightKg || 70
  } kg, ${context.heightCm || 170} cm.
- Primary Goal: ${context.goalType || "Maintenance"}.
- Dietary Pattern: ${context.dietaryType || "Omnivore"}.
- CRITICAL ALLERGIES: ${
    context.allergies && context.allergies.length > 0
      ? context.allergies.join(", ")
      : "None reported"
  }.
- Intolerances: ${
    context.intolerances && context.intolerances.length > 0
      ? context.intolerances.join(", ")
      : "None reported"
  }.

TODAY'S LIVE BUDGET & CONSUMPTION:
- Target Calories: ${context.dailyTargets.calories} kcal | Consumed: ${
    context.todayConsumed.calories
  } kcal | REMAINING: ${remainingCalories} kcal.
- Target Protein: ${context.dailyTargets.proteinG}g | Consumed: ${
    context.todayConsumed.proteinG
  }g | REMAINING: ${remainingProtein}g.
- Target Carbs: ${context.dailyTargets.carbsG}g | Consumed: ${
    context.todayConsumed.carbsG
  }g.
- Target Fat: ${context.dailyTargets.fatG}g | Consumed: ${
    context.todayConsumed.fatG
  }g.

TODAY'S LOGGED MEALS:
${
  context.recentMeals.length > 0
    ? context.recentMeals
        .map(
          (m) =>
            `- [${m.mealType.toUpperCase()}] ${m.foodName}: ${m.calories} kcal, ${
              m.proteinG
            }g protein`
        )
        .join("\n")
    : "No meals logged yet today."
}

CORE INSTRUCTIONS:
1. ALWAYS respect the user's dietary pattern (${context.dietaryType || "omnivore"}) and STRICTLY NEVER suggest foods containing their reported allergies (${
    context.allergies?.join(", ") || "none"
  }).
2. Base meal recommendations on their REMAINING daily budget (${remainingCalories} kcal and ${remainingProtein}g protein remaining).
3. If they ask what to eat, offer 2-3 specific, realistic food choices (prioritize culturally familiar options like traditional Indian meals if preferred) with exact estimated calories and protein.
4. Clearly distinguish between verified laboratory nutrition and general estimates.
5. If the user asks for medical diagnoses or severe therapeutic diets, politely refuse and recommend consulting a licensed physician or registered dietitian.
6. Keep tone professional, empathetic, scientific, and concise with GitHub Markdown formatting.`;

  const contents = [
    ...conversationHistory,
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents as any,
    config: {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      temperature: 0.4,
    },
  });

  return response.text || "I apologize, but I could not formulate a response at this time.";
}
