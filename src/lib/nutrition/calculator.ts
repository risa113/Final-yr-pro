export type Gender = "male" | "female" | "other";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type GoalType =
  | "weight_loss"
  | "weight_gain"
  | "maintenance"
  | "muscle_building"
  | "general_health";

export interface UserBiometrics {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType?: GoalType;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
}

export interface MacroNutrients {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface DetailedNutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  cholesterolMg: number;
  potassiumMg: number;
  calciumMg: number;
  ironMg: number;
  vitaminAMcg: number;
  vitaminCMg: number;
  vitaminDUg?: number;
  vitaminB12Ug?: number;
}

/**
 * Calculates Basal Metabolic Rate using the validated Mifflin-St Jeor Equation.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 1800;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") {
    return Math.round((base + 5) * 100) / 100;
  } else if (gender === "female") {
    return Math.round((base - 161) * 100) / 100;
  } else {
    // Non-binary / unspecified biological average
    return Math.round((base - 78) * 100) / 100;
  }
}

/**
 * Maps activity levels to validated physical activity multipliers.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Desk job, little or no exercise
  lightly_active: 1.375, // Light exercise/sports 1-3 days/week
  moderately_active: 1.55, // Moderate exercise/sports 3-5 days/week
  very_active: 1.725, // Hard exercise/sports 6-7 days/week
  extra_active: 1.9, // Very hard daily training or physical labor
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier * 100) / 100;
}

/**
 * Calculates full daily nutrition and macronutrient targets.
 */
export function calculateDailyTargets(biometrics: UserBiometrics): NutritionTargets {
  const bmr = calculateBMR(
    biometrics.weightKg,
    biometrics.heightCm,
    biometrics.age,
    biometrics.gender
  );

  const tdee = calculateTDEE(bmr, biometrics.activityLevel);

  let targetCalories = tdee;
  const goal = biometrics.goalType || "maintenance";

  if (goal === "weight_loss") {
    targetCalories = Math.max(1200, tdee - 500); // 500 kcal deficit
  } else if (goal === "weight_gain") {
    targetCalories = tdee + 400; // 400 kcal surplus
  } else if (goal === "muscle_building") {
    targetCalories = tdee + 250;
  }

  // Protein targets based on bodyweight and goal
  const proteinPerKg =
    goal === "muscle_building" || goal === "weight_loss" ? 1.8 : 1.2;
  const targetProteinG = Math.round(biometrics.weightKg * proteinPerKg);

  // Fat targets: 25-30% of total calories (9 kcal per gram)
  const fatCalories = targetCalories * 0.28;
  const targetFatG = Math.round(fatCalories / 9);

  // Carbs: Remaining calories (4 kcal per gram)
  const remainingCalories = targetCalories - targetProteinG * 4 - targetFatG * 9;
  const targetCarbsG = Math.max(50, Math.round(remainingCalories / 4));

  // Fiber: 14g per 1000 kcal
  const targetFiberG = Math.round((targetCalories / 1000) * 14);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetFiberG,
  };
}

/**
 * Scales basic macronutrient values per 100g to actual confirmed serving weight.
 */
export function scaleNutrients(
  per100g: MacroNutrients,
  actualWeightG: number
): MacroNutrients {
  const factor = Math.max(0, actualWeightG) / 100.0;
  return {
    calories: Math.round(per100g.calories * factor * 10) / 10,
    proteinG: Math.round(per100g.proteinG * factor * 10) / 10,
    carbsG: Math.round(per100g.carbsG * factor * 10) / 10,
    fatG: Math.round(per100g.fatG * factor * 10) / 10,
    fiberG: Math.round(per100g.fiberG * factor * 10) / 10,
  };
}

/**
 * Scales full detailed nutrients (macros & micros) to actual weight in grams.
 */
export function scaleDetailedNutrition(
  per100g: DetailedNutrition,
  actualWeightG: number
): DetailedNutrition {
  const factor = Math.max(0, actualWeightG) / 100.0;
  return {
    calories: Math.round(per100g.calories * factor),
    proteinG: Math.round(per100g.proteinG * factor * 10) / 10,
    carbsG: Math.round(per100g.carbsG * factor * 10) / 10,
    fatG: Math.round(per100g.fatG * factor * 10) / 10,
    saturatedFatG: Math.round((per100g.saturatedFatG || 0) * factor * 10) / 10,
    fiberG: Math.round((per100g.fiberG || 0) * factor * 10) / 10,
    sugarG: Math.round((per100g.sugarG || 0) * factor * 10) / 10,
    sodiumMg: Math.round((per100g.sodiumMg || 0) * factor),
    cholesterolMg: Math.round((per100g.cholesterolMg || 0) * factor),
    potassiumMg: Math.round((per100g.potassiumMg || 0) * factor),
    calciumMg: Math.round((per100g.calciumMg || 0) * factor),
    ironMg: Math.round((per100g.ironMg || 0) * factor * 10) / 10,
    vitaminAMcg: Math.round((per100g.vitaminAMcg || 0) * factor),
    vitaminCMg: Math.round((per100g.vitaminCMg || 0) * factor * 10) / 10,
    vitaminDUg: per100g.vitaminDUg ? Math.round(per100g.vitaminDUg * factor * 10) / 10 : undefined,
    vitaminB12Ug: per100g.vitaminB12Ug ? Math.round(per100g.vitaminB12Ug * factor * 10) / 10 : undefined,
  };
}
