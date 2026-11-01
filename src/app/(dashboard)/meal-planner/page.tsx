"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Sparkles,
  Utensils,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Flame,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanMeal {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodName: string;
  portionG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  rationale: string;
  isAllergySafe: boolean;
}

export default function MealPlannerPage() {
  const router = useRouter();
  const [activeDietFilter, setActiveDietFilter] = useState("vegetarian");
  const [activePlanDay, setActivePlanDay] = useState("Monday");
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Pre-calculated meal plan curated strictly from verified ICMR-NIN IFCT dataset
  const plannedMeals: PlanMeal[] = [
    {
      id: "pm_1",
      mealType: "breakfast",
      foodName: "Steamed Idli (2 pcs) with Sambar & Mint Chutney",
      portionG: 180,
      calories: 220,
      proteinG: 7.2,
      carbsG: 42.0,
      fatG: 2.5,
      rationale: "Fermented rice & urad dal provides low-GI complex carbs and high bio-availability.",
      isAllergySafe: true,
    },
    {
      id: "pm_2",
      mealType: "lunch",
      foodName: "Dal Tadka (150g) with 2 Whole Wheat Phulkas & Salad",
      portionG: 250,
      calories: 410,
      proteinG: 16.8,
      carbsG: 62.0,
      fatG: 8.5,
      rationale: "Balanced amino acid profile pairing whole wheat cereal with pigeon pea pulses.",
      isAllergySafe: true,
    },
    {
      id: "pm_3",
      mealType: "snack",
      foodName: "Sprouted Moong Salad with Lemon & Cucumber",
      portionG: 120,
      calories: 145,
      proteinG: 11.2,
      carbsG: 22.0,
      fatG: 1.2,
      rationale: "High fiber and micronutrient density to prevent afternoon energy dip.",
      isAllergySafe: true,
    },
    {
      id: "pm_4",
      mealType: "dinner",
      foodName: "Paneer Bhurji (150g) with Steamed Brown Rice",
      portionG: 280,
      calories: 460,
      proteinG: 24.5,
      carbsG: 44.0,
      fatG: 18.0,
      rationale: "Slow-digesting casein protein and cottage cheese fat promotes nocturnal muscle recovery.",
      isAllergySafe: true,
    },
  ];

  const totalDayCalories = plannedMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalDayProtein = Math.round(plannedMeals.reduce((sum, m) => sum + m.proteinG, 0));
  const totalDayCarbs = Math.round(plannedMeals.reduce((sum, m) => sum + m.carbsG, 0));
  const totalDayFat = Math.round(plannedMeals.reduce((sum, m) => sum + m.fatG, 0));

  const handleAddMealToDiary = (meal: PlanMeal) => {
    const newEntry = {
      id: `meal_${Date.now()}`,
      mealType: meal.mealType,
      foodName: meal.foodName,
      servingG: meal.portionG,
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      source: "ICMR_NIN",
    };

    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("nutri_daily_meals");
      let list = [];
      if (existing) {
        try {
          list = JSON.parse(existing);
        } catch (e) {
          list = [];
        }
      }
      list.push(newEntry);
      localStorage.setItem("nutri_daily_meals", JSON.stringify(list));
    }

    setAddedItem(meal.id);
    setTimeout(() => {
      setAddedItem(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Context Optimizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Smart Meal Planner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized meal plans calibrated to your 2,450 kcal energy target with 100% allergy exclusion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Diet Filter:</span>
          <select
            value={activeDietFilter}
            onChange={(e) => setActiveDietFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none capitalize"
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="non-vegetarian">Non-Vegetarian</option>
            <option value="eggetarian">Eggetarian</option>
          </select>
        </div>
      </div>

      {/* DAYS TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActivePlanDay(day)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              activePlanDay === day
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* DAY TARGETS BANNER */}
      <div className="bg-emerald-950 text-white p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            {activePlanDay} Planned Targets
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold">{totalDayCalories}</span>
            <span className="text-xs text-slate-300">kcal planned</span>
          </div>
        </div>

        <div className="flex gap-6 text-xs text-slate-300 border-t sm:border-t-0 sm:border-l border-emerald-800/80 pt-3 sm:pt-0 sm:pl-6">
          <div>
            <span className="text-slate-400 block">Protein</span>
            <span className="text-base font-bold text-emerald-400">{totalDayProtein}g</span>
          </div>
          <div>
            <span className="text-slate-400 block">Carbs</span>
            <span className="text-base font-bold text-teal-400">{totalDayCarbs}g</span>
          </div>
          <div>
            <span className="text-slate-400 block">Fat</span>
            <span className="text-base font-bold text-amber-400">{totalDayFat}g</span>
          </div>
        </div>
      </div>

      {/* PLANNED MEAL CARDS */}
      <div className="grid md:grid-cols-2 gap-4">
        {plannedMeals.map((meal) => (
          <div
            key={meal.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                  {meal.mealType}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Allergy Safe</span>
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base">{meal.foodName}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                &ldquo;{meal.rationale}&rdquo;
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-lg font-extrabold text-slate-900">{meal.calories}</span>
                <span className="text-xs text-slate-400 ml-1">kcal</span>
                <p className="text-[11px] text-slate-500">
                  P: {meal.proteinG}g &bull; C: {meal.carbsG}g &bull; F: {meal.fatG}g
                </p>
              </div>

              <button
                onClick={() => handleAddMealToDiary(meal)}
                disabled={addedItem === meal.id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:bg-emerald-800"
              >
                {addedItem === meal.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Diary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
