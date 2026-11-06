import { GoogleGenAI } from "@google/genai";
import { getDefaultGeminiApiKey } from "../utils";
import {
  findClosestIFCTFood,
  searchAllFoods,
  getDetailedFoodProfile,
  type DetailedFoodNutrientProfile,
} from "../nutrition/food-service";
import {
  scaleNutrients,
  scaleDetailedNutrition,
  type DetailedNutrition,
} from "../nutrition/calculator";
import {
  executeVisionAnalysis,
  isQuotaExhaustedError,
} from "./provider-manager";

export interface DetectedFoodItem {
  id: string;
  name: string;
  portionG: number;
  portionDescription: string;
  cookingMethod: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  ingredients: string[];
  source: string;
  isVerified: boolean;
  per100g: DetailedNutrition;
}

export interface FoodScanResult {
  scanId: string;
  detectedFoodName: string;
  confidenceScore: number;
  servingDescription: string;
  estimatedServingG: number;
  preparationMethod: string;
  confidenceReasoning: string;
  uncertaintyNotes: string;
  alternativeCandidates: string[];
  detectedIngredients: string[];
  isMultiItem: boolean;
  detectedItems: DetectedFoodItem[];
  totalNutrition: DetailedNutrition & {
    source: "ICMR_NIN" | "USDA" | "AI_CALIBRATED";
    isVerified: boolean;
  };
  matchedNutrition: {
    foodName: string;
    source: string;
    sourceId: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    isVerified: boolean;
  };
  healthAnalysis: {
    strengths: string[];
    concerns: string[];
    goalSuitability: {
      weightLoss: "excellent" | "favorable" | "moderate" | "caution";
      muscleBuilding: "excellent" | "favorable" | "moderate" | "low";
      bloodSugar: "favorable" | "moderate" | "high_gi";
      heartHealth: "heart_healthy" | "moderate" | "high_sodium_fat";
    };
  };
  recommendations: {
    portionAdvice: string;
    healthierSwaps: string[];
    allergyWarnings: string[];
  };
  providerUsed: string;
  modelUsed: string;
  latencyMs: number;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getDefaultGeminiApiKey();
  if (!apiKey || apiKey === "AIzaSy...") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your key to enable AI features."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Evaluates dietary health analysis & goal compatibility from nutrient values.
 */
function evaluateHealthMetrics(
  total: DetailedNutrition,
  servingG: number,
  prepMethod: string
) {
  const strengths: string[] = [];
  const concerns: string[] = [];

  // Strengths
  if (total.proteinG >= 20) {
    strengths.push("High in muscle-building lean protein (≥20g)");
  } else if (total.proteinG >= 10) {
    strengths.push("Moderate protein source helping satiety");
  }

  if (total.fiberG >= 5) {
    strengths.push("Excellent fiber content (≥5g), promoting digestive motility");
  } else if (total.fiberG >= 2.5) {
    strengths.push("Beneficial source of dietary fiber");
  }

  if (total.ironMg >= 2.5) {
    strengths.push("Substantial dietary iron, aiding red blood cell oxygenation");
  }

  if (total.calciumMg >= 150) {
    strengths.push("Good calcium content supporting bone mineral density");
  }

  if (total.vitaminCMg >= 15) {
    strengths.push("Rich in antioxidant Vitamin C");
  }

  if (total.saturatedFatG <= 2 && total.fatG > 0) {
    strengths.push("Low in saturated fatty acids");
  }

  if (strengths.length === 0) {
    strengths.push("Provides immediate carbohydrate energy for physical activity");
  }

  // Concerns
  const prepLower = prepMethod.toLowerCase();
  if (prepLower.includes("fried") || prepLower.includes("deep fry")) {
    concerns.push("Fried preparation significantly increases oxidized lipid load");
  }

  if (total.sodiumMg >= 700) {
    concerns.push("High sodium content (≥700mg) — watch blood pressure & fluid retention");
  } else if (total.sodiumMg >= 450) {
    concerns.push("Moderate-to-high sodium from gravies or seasonings");
  }

  if (total.saturatedFatG >= 6) {
    concerns.push("Elevated saturated fat (≥6g) — consume in moderation for LDL cholesterol");
  }

  if (total.sugarG >= 15) {
    concerns.push("High simple sugar content (≥15g), potential for rapid glucose spike");
  }

  const calDensity = total.calories / Math.max(1, servingG);
  if (calDensity >= 2.5) {
    concerns.push("High calorie density per gram — portion control recommended");
  }

  if (concerns.length === 0) {
    concerns.push("Well-balanced nutritional profile with minimal inflammatory markers");
  }

  // Goal Suitability
  let weightLoss: "excellent" | "favorable" | "moderate" | "caution" = "favorable";
  if (calDensity < 1.3 && total.proteinG >= 15 && total.fiberG >= 4) {
    weightLoss = "excellent";
  } else if (calDensity > 2.2 || total.calories > 650) {
    weightLoss = "caution";
  } else if (total.calories > 450 || total.sugarG > 12) {
    weightLoss = "moderate";
  }

  let muscleBuilding: "excellent" | "favorable" | "moderate" | "low" = "favorable";
  if (total.proteinG >= 25) {
    muscleBuilding = "excellent";
  } else if (total.proteinG >= 15) {
    muscleBuilding = "favorable";
  } else if (total.proteinG >= 8) {
    muscleBuilding = "moderate";
  } else {
    muscleBuilding = "low";
  }

  let bloodSugar: "favorable" | "moderate" | "high_gi" = "moderate";
  const carbRatio = total.carbsG / Math.max(1, total.proteinG + total.fatG);
  if (total.fiberG >= 4 && total.sugarG <= 5 && carbRatio <= 2) {
    bloodSugar = "favorable";
  } else if (total.sugarG > 15 || (total.carbsG > 50 && total.fiberG < 2)) {
    bloodSugar = "high_gi";
  }

  let heartHealth: "heart_healthy" | "moderate" | "high_sodium_fat" = "moderate";
  if (total.sodiumMg <= 350 && total.saturatedFatG <= 2.5 && total.fiberG >= 3) {
    heartHealth = "heart_healthy";
  } else if (total.sodiumMg > 650 || total.saturatedFatG > 6) {
    heartHealth = "high_sodium_fat";
  }

  return {
    strengths,
    concerns,
    goalSuitability: {
      weightLoss,
      muscleBuilding,
      bloodSugar,
      heartHealth,
    },
  };
}

/**
 * Analyzes food image using multimodal AI with automatic provider failover,
 * then maps dishes to laboratory databases (ICMR-NIN IFCT 2017 & USDA FoodData Central).
 */
export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string = "image/jpeg",
  userContext?: {
    allergies?: string[];
    dietaryType?: string;
    goalType?: string;
    targetCalories?: number;
  }
): Promise<FoodScanResult> {
  const prompt = `You are an expert AI Food Recognition Scientist specializing in global cuisines and traditional Indian culinary preparations (South Indian, North Indian, regional curries, rice dishes, breads, snacks).

Analyze this food photograph and return a precise JSON response matching the schema below.

CRITICAL INSTRUCTIONS:
1. Identify the dish accurately (e.g., 'Chicken Biryani with Onion Raita', 'Masala Dosa with Sambar & Chutney', '2 Chapatis with Dal Tadka and Mixed Salad', 'Paneer Butter Masala with Jeera Rice', 'Oatmeal with Blueberries').
2. If multiple distinct food items are visible on the plate or tray, set "isMultiItem": true and list each component in "detectedItems" with its individual estimated weight in grams.
3. If it is a single item, provide it in "detectedItems" with its portion.
4. Estimate realistic serving weights in grams (e.g. 1 standard bowl of dal = 150g, 1 chapati = 40g, 1 cup cooked rice = 150g, 1 piece idli = 40g).
5. Specify detectable cooking method (Steamed, Deep-fried, Pan-roasted, Boiled, Stewed, Grilled, Baked, Raw).
6. Provide 2-3 realistic alternative dish interpretations.
7. List visible ingredients.
8. State honest scientific uncertainty regarding 2D photographic portion estimation and hidden cooking fats.

Return ONLY a valid JSON object matching this schema:
{
  "detectedFoodName": "string (overall meal title)",
  "confidenceScore": number (0.50 to 0.99),
  "isMultiItem": boolean,
  "servingDescription": "string (e.g. 1 full plate, 2 pieces with 1 cup gravy)",
  "estimatedServingG": number (total edible grams),
  "preparationMethod": "string (e.g. Steamed and shallow fried)",
  "confidenceReasoning": "string (visual cues: color, texture, garnish)",
  "uncertaintyNotes": "string (photometric limits on depth/gravy thickness)",
  "alternativeCandidates": ["string", "string"],
  "detectedIngredients": ["string", "string", "string"],
  "detectedItems": [
    {
      "name": "string (item name e.g. 'Idli')",
      "portionG": number (grams e.g. 80),
      "portionDescription": "string (e.g. 2 pieces)",
      "cookingMethod": "string (e.g. Steamed)",
      "ingredients": ["string", "string"]
    }
  ]
}`;

  // Execute vision analysis with failover and quota detection
  const visionResult = await executeVisionAnalysis({
    prompt,
    base64Image,
    mimeType,
    temperature: 0.2,
  });

  let parsed: any;
  try {
    // Strip markdown code fences if wrapped
    const cleanText = visionResult.text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    parsed = JSON.parse(cleanText);
  } catch (err) {
    console.error("[analyzeFoodImage] Failed to parse JSON:", visionResult.text);
    throw new Error("AI returned an unparseable response. Please try again with a clearer photograph.");
  }

  const detectedFoodName = parsed.detectedFoodName || "Identified Meal";
  const confidenceScore = Math.min(0.99, Math.max(0.5, Number(parsed.confidenceScore) || 0.88));
  const servingDescription = parsed.servingDescription || `${parsed.estimatedServingG || 180}g plate`;
  const estimatedServingG = Math.max(20, Number(parsed.estimatedServingG) || 180);
  const preparationMethod = parsed.preparationMethod || "Culinary Preparation";
  const confidenceReasoning = parsed.confidenceReasoning || "Visual morphology, plate geometry, and surface texture identified.";
  const uncertaintyNotes =
    parsed.uncertaintyNotes ||
    "2D photographic estimation has ±15% volume variance. Adjust portion grams manually if scale is available.";
  const alternativeCandidates = Array.isArray(parsed.alternativeCandidates) ? parsed.alternativeCandidates : [];
  const detectedIngredients = Array.isArray(parsed.detectedIngredients) ? parsed.detectedIngredients : [];

  // Parse detected sub-items
  const rawItems = Array.isArray(parsed.detectedItems) && parsed.detectedItems.length > 0
    ? parsed.detectedItems
    : [
        {
          name: detectedFoodName,
          portionG: estimatedServingG,
          portionDescription: servingDescription,
          cookingMethod: preparationMethod,
          ingredients: detectedIngredients,
        },
      ];

  // STEP 2: Decoupled Empirical Nutrition Retrieval (ICMR-NIN IFCT & USDA)
  const processedItems: DetectedFoodItem[] = [];
  let totalCalories = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;
  let totalSaturatedFatG = 0;
  let totalFiberG = 0;
  let totalSugarG = 0;
  let totalSodiumMg = 0;
  let totalCholesterolMg = 0;
  let totalPotassiumMg = 0;
  let totalCalciumMg = 0;
  let totalIronMg = 0;
  let totalVitaminAMcg = 0;
  let totalVitaminCMg = 0;

  let primarySource: "ICMR_NIN" | "USDA" | "AI_CALIBRATED" = "ICMR_NIN";
  let hasVerified = false;

  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i];
    const itemName = raw.name || `Item ${i + 1}`;
    const itemGrams = Math.max(10, Number(raw.portionG) || Math.round(estimatedServingG / rawItems.length));
    
    // Retrieve empirical laboratory profile
    const profile = await getDetailedFoodProfile(itemName);
    if (profile.isVerified) hasVerified = true;
    if (profile.source === "USDA" && primarySource !== "ICMR_NIN") primarySource = "USDA";

    const scaled = scaleDetailedNutrition(profile.per100g, itemGrams);

    totalCalories += scaled.calories;
    totalProteinG += scaled.proteinG;
    totalCarbsG += scaled.carbsG;
    totalFatG += scaled.fatG;
    totalSaturatedFatG += scaled.saturatedFatG;
    totalFiberG += scaled.fiberG;
    totalSugarG += scaled.sugarG;
    totalSodiumMg += scaled.sodiumMg;
    totalCholesterolMg += scaled.cholesterolMg;
    totalPotassiumMg += scaled.potassiumMg;
    totalCalciumMg += scaled.calciumMg;
    totalIronMg += scaled.ironMg;
    totalVitaminAMcg += scaled.vitaminAMcg;
    totalVitaminCMg += scaled.vitaminCMg;

    processedItems.push({
      id: `item_${i + 1}_${Math.random().toString(36).substring(2, 6)}`,
      name: profile.foodName || itemName,
      portionG: itemGrams,
      portionDescription: raw.portionDescription || `${itemGrams}g`,
      cookingMethod: raw.cookingMethod || preparationMethod,
      calories: scaled.calories,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
      fiberG: scaled.fiberG,
      ingredients: Array.isArray(raw.ingredients) && raw.ingredients.length > 0 ? raw.ingredients : profile.commonAllergens,
      source: profile.source,
      isVerified: profile.isVerified,
      per100g: profile.per100g,
    });
  }

  const totalNutrition: FoodScanResult["totalNutrition"] = {
    calories: Math.round(totalCalories),
    proteinG: Math.round(totalProteinG * 10) / 10,
    carbsG: Math.round(totalCarbsG * 10) / 10,
    fatG: Math.round(totalFatG * 10) / 10,
    saturatedFatG: Math.round(totalSaturatedFatG * 10) / 10,
    fiberG: Math.round(totalFiberG * 10) / 10,
    sugarG: Math.round(totalSugarG * 10) / 10,
    sodiumMg: Math.round(totalSodiumMg),
    cholesterolMg: Math.round(totalCholesterolMg),
    potassiumMg: Math.round(totalPotassiumMg),
    calciumMg: Math.round(totalCalciumMg),
    ironMg: Math.round(totalIronMg * 10) / 10,
    vitaminAMcg: Math.round(totalVitaminAMcg),
    vitaminCMg: Math.round(totalVitaminCMg * 10) / 10,
    source: hasVerified ? primarySource : "AI_CALIBRATED",
    isVerified: hasVerified,
  };

  // STEP 3: Health Analysis & Goal Compatibility
  const healthAnalysis = evaluateHealthMetrics(totalNutrition, estimatedServingG, preparationMethod);

  // STEP 4: Personalized Recommendations & Allergy Checks
  const userAllergies = userContext?.allergies || [];
  const allergyWarnings: string[] = [];

  const checkIngredients = [...detectedIngredients, ...processedItems.map(i => i.name.toLowerCase())].join(" ");
  for (const allergy of userAllergies) {
    const allergen = allergy.toLowerCase();
    if (checkIngredients.includes(allergen)) {
      allergyWarnings.push(`⚠️ Contains or may contain ${allergy}, which matches your reported profile allergy.`);
    }
  }

  // Common allergens check if none triggered
  if (allergyWarnings.length === 0) {
    const allergensFound: string[] = [];
    if (checkIngredients.includes("peanut") || checkIngredients.includes("groundnut")) allergensFound.push("Peanuts");
    if (checkIngredients.includes("milk") || checkIngredients.includes("paneer") || checkIngredients.includes("curd") || checkIngredients.includes("ghee") || checkIngredients.includes("cheese")) allergensFound.push("Dairy (Lactose)");
    if (checkIngredients.includes("maida") || checkIngredients.includes("wheat") || checkIngredients.includes("roti") || checkIngredients.includes("bread")) allergensFound.push("Gluten (Wheat)");
    if (checkIngredients.includes("egg")) allergensFound.push("Eggs");
    if (checkIngredients.includes("fish") || checkIngredients.includes("prawn")) allergensFound.push("Seafood");
    if (checkIngredients.includes("soy") || checkIngredients.includes("tofu")) allergensFound.push("Soy");

    if (allergensFound.length > 0) {
      allergyWarnings.push(`Contains potential allergens: ${allergensFound.join(", ")}.`);
    }
  }

  // Portion & Swaps Advice
  let portionAdvice = `A standard ${Math.round(estimatedServingG)}g portion yields ${totalNutrition.calories} kcal and ${totalNutrition.proteinG}g protein.`;
  if (userContext?.targetCalories) {
    const mealBudget = Math.round(userContext.targetCalories * 0.35);
    if (totalNutrition.calories > mealBudget) {
      const suggestedG = Math.round((mealBudget / totalNutrition.calories) * estimatedServingG);
      portionAdvice = `This meal represents ${( (totalNutrition.calories / userContext.targetCalories) * 100 ).toFixed(0)}% of your daily budget (${userContext.targetCalories} kcal). To stay within your ${mealBudget} kcal target, reduce portion to ~${suggestedG}g.`;
    }
  }

  const healthierSwaps: string[] = [];
  if (totalNutrition.carbsG > 60 && totalNutrition.fiberG < 3) {
    healthierSwaps.push("Pair with a raw cucumber/tomato salad or green sabzi to double dietary fiber and blunt blood sugar response.");
  }
  if (preparationMethod.toLowerCase().includes("fried")) {
    healthierSwaps.push("Request or prepare with shallow tawa roasting instead of deep frying to save ~120-180 kcal of oil.");
  }
  if (totalNutrition.proteinG < 12) {
    healthierSwaps.push("Add boiled eggs, grilled paneer, or sprouted moong dal to elevate protein intake to ≥20g.");
  }
  if (totalNutrition.sodiumMg > 500) {
    healthierSwaps.push("Ask for gravy/sauce on the side to reduce excess sodium intake by up to 40%.");
  }
  if (healthierSwaps.length === 0) {
    healthierSwaps.push("Excellent balanced meal composition — maintain current portion ratios.");
  }

  return {
    scanId: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    detectedFoodName,
    confidenceScore,
    servingDescription,
    estimatedServingG,
    preparationMethod,
    confidenceReasoning,
    uncertaintyNotes,
    alternativeCandidates,
    detectedIngredients,
    isMultiItem: rawItems.length > 1,
    detectedItems: processedItems,
    totalNutrition,
    matchedNutrition: {
      foodName: detectedFoodName,
      source: totalNutrition.source,
      sourceId: "VERIFIED_COMPOSITE",
      calories: totalNutrition.calories,
      proteinG: totalNutrition.proteinG,
      carbsG: totalNutrition.carbsG,
      fatG: totalNutrition.fatG,
      fiberG: totalNutrition.fiberG,
      isVerified: totalNutrition.isVerified,
    },
    healthAnalysis,
    recommendations: {
      portionAdvice,
      healthierSwaps,
      allergyWarnings,
    },
    providerUsed: visionResult.provider,
    modelUsed: visionResult.model,
    latencyMs: visionResult.latencyMs,
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

  const systemInstruction = `You are THARIQ AI, the Context-Aware AI Nutrition Assistant for ${
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
3. If they ask what to eat, offer 2-3 specific, realistic food choices with exact estimated calories and protein.
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

  const candidateModels = [
    process.env.PRIMARY_VISION_MODEL || "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
  ];

  let replyText = "";
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: contents as any,
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          temperature: 0.4,
        },
      });
      replyText = response.text || "";
      if (replyText) break;
    } catch (err: any) {
      console.warn(`[chatWithAssistant] Model ${model} failed, trying next fallback:`, err.message?.slice(0, 80));
    }
  }

  return replyText || "I apologize, but I could not formulate a response at this time.";
}
