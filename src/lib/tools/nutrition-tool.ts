/**
 * Nutrition Database Query Tool
 * Queries empirical ICMR-NIN IFCT tables and USDA FoodData Central.
 */

import { searchAllFoods, findClosestIFCTFood } from "@/lib/nutrition/food-service";

export interface NutritionToolResult {
  query: string;
  matched: boolean;
  foods: {
    name: string;
    source: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
    standardServingG: number;
    dietaryType?: string;
    allergens?: string[];
  }[];
  summary: string;
}

export async function queryNutritionDatabase(foodQuery: string): Promise<NutritionToolResult> {
  const clean = foodQuery.trim();
  if (!clean) {
    return {
      query: foodQuery,
      matched: false,
      foods: [],
      summary: "Empty food query.",
    };
  }

  // 1. Check exact/closest ICMR IFCT entry
  const ifct = findClosestIFCTFood(clean);
  if (ifct) {
    return {
      query: foodQuery,
      matched: true,
      foods: [
        {
          name: ifct.name,
          source: "ICMR-NIN IFCT (Indian Food Composition Tables)",
          caloriesPer100g: ifct.caloriesPer100g,
          proteinPer100g: ifct.proteinPer100g,
          carbsPer100g: ifct.carbsPer100g,
          fatPer100g: ifct.fatPer100g,
          fiberPer100g: ifct.fiberPer100g,
          standardServingG: ifct.standardServingG,
          dietaryType: ifct.dietaryType,
          allergens: ifct.commonAllergens,
        },
      ],
      summary: `Verified in ICMR-NIN: ${ifct.name} contains ${ifct.caloriesPer100g} kcal, ${ifct.proteinPer100g}g protein, ${ifct.carbsPer100g}g carbs, and ${ifct.fatPer100g}g fat per 100g. Standard serving: ${ifct.standardServingG}g.`,
    };
  }

  // 2. Search USDA and database
  const searchResults = await searchAllFoods(clean, 3);
  if (searchResults.length > 0) {
    const list = searchResults.map((f) => ({
      name: f.name,
      source: f.source === "ICMR_NIN" ? "ICMR-NIN IFCT" : "USDA FoodData Central",
      caloriesPer100g: f.caloriesPer100g,
      proteinPer100g: f.proteinPer100g,
      carbsPer100g: f.carbsPer100g,
      fatPer100g: f.fatPer100g,
      fiberPer100g: f.fiberPer100g,
      standardServingG: f.standardServingG,
      dietaryType: f.dietaryType,
      allergens: f.commonAllergens,
    }));

    const top = list[0];
    return {
      query: foodQuery,
      matched: true,
      foods: list,
      summary: `Found in ${top.source}: ${top.name} has ${top.caloriesPer100g} kcal and ${top.proteinPer100g}g protein per 100g.`,
    };
  }

  return {
    query: foodQuery,
    matched: false,
    foods: [],
    summary: `No laboratory record found in ICMR-NIN IFCT or USDA for "${clean}".`,
  };
}
