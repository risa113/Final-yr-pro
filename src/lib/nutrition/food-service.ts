import { ICMR_NIN_FOOD_DATABASE, type VerifiedFoodItem } from "./ifct-data";
import { searchUSDAFoods } from "./usda";

export interface UnifiedFoodSearchResult {
  id: string;
  name: string;
  category: string;
  source: "ICMR_NIN" | "USDA" | "OPEN_FOOD_FACTS";
  sourceId: string;
  standardServingG: number;
  servingUnit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  dietaryType?: string;
  commonAllergens?: string[];
}

/**
 * Searches across local ICMR-NIN IFCT dataset first, and augments with USDA if needed.
 */
export async function searchAllFoods(
  query: string,
  limit: number = 10
): Promise<UnifiedFoodSearchResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const results: UnifiedFoodSearchResult[] = [];

  // 1. Search ICMR-NIN IFCT dataset (Local verified Indian foods)
  const matchedIFCT = ICMR_NIN_FOOD_DATABASE.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(cleanQuery);
    const categoryMatch = item.category.toLowerCase().includes(cleanQuery);
    const aliasMatch = item.aliases.some((a) => a.toLowerCase().includes(cleanQuery));
    return nameMatch || categoryMatch || aliasMatch;
  });

  for (const item of matchedIFCT) {
    results.push({
      id: item.id,
      name: item.name,
      category: item.category,
      source: "ICMR_NIN",
      sourceId: item.sourceId,
      standardServingG: item.standardServingG,
      servingUnit: item.servingUnit,
      caloriesPer100g: item.caloriesPer100g,
      proteinPer100g: item.proteinPer100g,
      carbsPer100g: item.carbsPer100g,
      fatPer100g: item.fatPer100g,
      fiberPer100g: item.fiberPer100g,
      dietaryType: item.dietaryType,
      commonAllergens: item.commonAllergens,
    });
  }

  // 2. If fewer than desired results, query USDA FoodData Central
  if (results.length < limit) {
    const remainingSlots = limit - results.length;
    const usdaResults = await searchUSDAFoods(cleanQuery, remainingSlots);
    for (const item of usdaResults) {
      results.push({
        id: item.id,
        name: item.name,
        category: item.category,
        source: "USDA",
        sourceId: item.sourceId,
        standardServingG: item.standardServingG,
        servingUnit: item.servingUnit,
        caloriesPer100g: item.caloriesPer100g,
        proteinPer100g: item.proteinPer100g,
        carbsPer100g: item.carbsPer100g,
        fatPer100g: item.fatPer100g,
        fiberPer100g: item.fiberPer100g,
      });
    }
  }

  return results.slice(0, limit);
}

/**
 * Finds the closest verified nutrient record by food name.
 */
export function findClosestIFCTFood(foodName: string): VerifiedFoodItem | null {
  const clean = foodName.toLowerCase().trim();
  if (!clean) return null;

  // Exact match
  const exact = ICMR_NIN_FOOD_DATABASE.find(
    (item) =>
      item.name.toLowerCase() === clean ||
      item.aliases.some((a) => a.toLowerCase() === clean)
  );
  if (exact) return exact;

  // Substring match
  const partial = ICMR_NIN_FOOD_DATABASE.find(
    (item) =>
      clean.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(clean) ||
      item.aliases.some((a) => clean.includes(a.toLowerCase()))
  );
  return partial || null;
}
