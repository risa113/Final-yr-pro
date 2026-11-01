export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  ingredientsText?: string;
  allergens?: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingSizeG?: number;
}

export async function lookupBarcodeOpenFoodFacts(
  barcode: string
): Promise<OpenFoodFactsProduct | null> {
  const cleanCode = barcode.trim();
  if (!cleanCode) return null;

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      cleanCode
    )}.json?fields=code,product_name,brands,categories,nutriments,ingredients_text,image_url,allergens_tags,serving_size`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "ContextAwareAINutritionAssistant/1.0 (academic final-year project)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // 24 hours
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;
    const nutriments = p.nutriments || {};

    // Open Food Facts nutrient names
    const calories =
      Number(nutriments["energy-kcal_100g"]) ||
      Number(nutriments["energy-kcal"]) ||
      Math.round((Number(nutriments["energy_100g"]) || 0) / 4.184) ||
      0;

    const protein =
      Number(nutriments["proteins_100g"]) || Number(nutriments["proteins"]) || 0;
    const carbs =
      Number(nutriments["carbohydrates_100g"]) ||
      Number(nutriments["carbohydrates"]) ||
      0;
    const fat = Number(nutriments["fat_100g"]) || Number(nutriments["fat"]) || 0;
    const fiber =
      Number(nutriments["fiber_100g"]) || Number(nutriments["fiber"]) || 0;

    const allergens = Array.isArray(p.allergens_tags)
      ? p.allergens_tags.map((a: string) => a.replace(/^[a-z]{2}:/, ""))
      : [];

    return {
      barcode: p.code || cleanCode,
      name: p.product_name || "Packaged Food Product",
      brand: p.brands,
      category: p.categories?.split(",")?.[0]?.trim() || "Packaged Grocery",
      imageUrl: p.image_url,
      ingredientsText: p.ingredients_text,
      allergens,
      caloriesPer100g: Math.round(calories * 10) / 10,
      proteinPer100g: Math.round(protein * 10) / 10,
      carbsPer100g: Math.round(carbs * 10) / 10,
      fatPer100g: Math.round(fat * 10) / 10,
      fiberPer100g: Math.round(fiber * 10) / 10,
    };
  } catch (error) {
    console.error("Open Food Facts lookup error:", error);
    return null;
  }
}
