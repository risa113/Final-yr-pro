"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  calculateDailyTargets,
  type Gender,
  type ActivityLevel,
  type GoalType,
} from "@/lib/nutrition/calculator";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Scale,
  ShieldCheck,
  CheckCircle2,
  HeartPulse,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();

  // Biometrics State
  const [age, setAge] = useState<number>(22);
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderately_active");
  const [goalType, setGoalType] = useState<GoalType>("maintenance");

  // Preferences State
  const [dietaryType, setDietaryType] = useState<string>("vegetarian");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([
    "South Indian",
    "North Indian",
  ]);
  const [mealFrequency, setMealFrequency] = useState<number>(3);

  const availableAllergies = [
    "Peanuts",
    "Tree Nuts",
    "Dairy / Lactose",
    "Gluten / Wheat",
    "Shellfish",
    "Soy",
    "Eggs",
    "Fish",
  ];

  const availableCuisines = [
    "South Indian",
    "North Indian",
    "Continental",
    "Mediterranean",
    "Asian / Chinese",
  ];

  // Real-time Mifflin-St Jeor calculation
  const calculatedTargets = useMemo(() => {
    return calculateDailyTargets({
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel,
      goalType,
    });
  }, [age, gender, heightCm, weightKg, activityLevel, goalType]);

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist to localStorage for client session demo and submit to API
    const profileData = {
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel,
      goalType,
      dietaryType,
      allergies: selectedAllergies,
      preferredCuisines: selectedCuisines,
      mealFrequency,
      targets: calculatedTargets,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("nutri_user_profile", JSON.stringify(profileData));
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 2 of 2 &bull; Context Formulation</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Build Your Personal Nutrition Context
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            These parameters empower our AI to calculate exact energy expenditures
            (BMR/TDEE) and provide personalized, allergy-safe recommendations.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM COLUMN (2 Cols) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            {/* 1. Biometrics */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <span>1. Physical Biometrics</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Biological Sex
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={300}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* 2. Activity & Goal */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-600" />
                <span>2. Activity Level & Target Goal</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Daily Physical Activity
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) =>
                      setActivityLevel(e.target.value as ActivityLevel)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="sedentary">Sedentary (Little or no exercise)</option>
                    <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                    <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                    <option value="very_active">Very Active (6-7 days/week)</option>
                    <option value="extra_active">Extra Active (Heavy physical training)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Primary Nutrition Goal
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="maintenance">Weight Maintenance</option>
                    <option value="weight_loss">Weight Loss (-500 kcal)</option>
                    <option value="weight_gain">Weight Gain (+400 kcal)</option>
                    <option value="muscle_building">Muscle Building (+250 kcal)</option>
                    <option value="general_health">General Balanced Health</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Dietary Preferences & Allergies */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3. Dietary Constraints & Safety</span>
              </h2>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Dietary Pattern
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["vegetarian", "vegan", "omnivore", "eggetarian"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDietaryType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-all cursor-pointer ${
                        dietaryType === type
                          ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Known Food Allergies & Intolerances (Strict Exclusions)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableAllergies.map((allergy) => {
                    const isSelected = selectedAllergies.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-red-50 border-red-500 text-red-700 font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {allergy}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Confirm Profile & Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* REAL-TIME NUTRITION FORMULATION CARD (1 Col) */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Scale className="w-4 h-4" />
                <span>Formulated Nutrition Targets</span>
              </div>

              <div className="mb-6">
                <span className="text-xs text-slate-400 block font-medium">Daily Energy Target</span>
                <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                  {calculatedTargets.targetCalories}
                </span>
                <span className="text-xs text-slate-400 ml-1">kcal / day</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block">Basal Metabolic Rate</span>
                  <span className="text-base font-bold text-white">{calculatedTargets.bmr} kcal</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block">Total Expenditure</span>
                  <span className="text-base font-bold text-white">{calculatedTargets.tdee} kcal</span>
                </div>
              </div>

              <div className="border-t border-slate-700/80 pt-4 space-y-2.5 text-xs">
                <p className="font-semibold text-slate-300 mb-2">Macro Distribution:</p>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Protein</span>
                  <span className="font-bold text-emerald-400">{calculatedTargets.targetProteinG}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Carbohydrates</span>
                  <span className="font-bold text-teal-400">{calculatedTargets.targetCarbsG}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Fat</span>
                  <span className="font-bold text-amber-400">{calculatedTargets.targetFatG}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Dietary Fiber</span>
                  <span className="font-bold text-blue-400">{calculatedTargets.targetFiberG}g</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-800 block mb-1">Mifflin-St Jeor Formula:</strong>
              Energy estimations are computed using clinical biometric coefficients. Calorie goals are dynamically adapted to preserve lean mass and metabolic health.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
