export interface USDANutrientResult {
  id: string;
  name: string;
  category: string;
  source: "USDA";
  sourceId: string;
  standardServingG: number;
  servingUnit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}

export async function searchUSDAFoods(
  query: string,
  limit: number = 8
): Promise<USDANutrientResult[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey || apiKey === "DEMO_KEY") {
    // If USDA key is default demo or not configured, return empty array gracefully
    return [];
  }

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(
      apiKey
    )}&query=${encodeURIComponent(query)}&pageSize=${limit}&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache results for 1 hour
    });

    if (!res.ok) {
      console.warn(`USDA API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map((item: any) => {
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      let fiber = 0;

      // Extract nutrients from foodNutrients array
      if (item.foodNutrients && Array.isArray(item.foodNutrients)) {
        for (const n of item.foodNutrients) {
          const name = (n.nutrientName || "").toLowerCase();
          const value = Number(n.value) || 0;

          if (name.includes("energy") && (n.unitName === "KCAL" || !n.unitName)) {
            calories = value;
          } else if (name === "protein" || name.startsWith("protein")) {
            protein = value;
          } else if (name.includes("carbohydrate")) {
            carbs = value;
          } else if (name.includes("total lipid") || name === "fat") {
            fat = value;
          } else if (name.includes("fiber")) {
            fiber = value;
          }
        }
      }

      return {
        id: `usda_${item.fdcId}`,
        name: item.description,
        category: item.foodCategory || "Whole & Processed Foods",
        source: "USDA",
        sourceId: String(item.fdcId),
        standardServingG: item.servingSize || 100,
        servingUnit: item.servingSizeUnit || "g",
        caloriesPer100g: Math.round(calories * 10) / 10,
        proteinPer100g: Math.round(protein * 10) / 10,
        carbsPer100g: Math.round(carbs * 10) / 10,
        fatPer100g: Math.round(fat * 10) / 10,
        fiberPer100g: Math.round(fiber * 10) / 10,
      };
    });
  } catch (error) {
    console.error("USDA API fetch error:", error);
    return [];
  }
}
