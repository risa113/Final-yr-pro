"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Camera,
  BookOpen,
  Bot,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface LoggedMeal {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodName: string;
  servingG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export default function DashboardPage() {
  const [formattedDate, setFormattedDate] = useState<string>("Today");

  // Target states
  const targetCalories = 2450;
  const targetProtein = 135;
  const targetCarbs = 290;
  const targetFat = 75;

  // Logged meals state (loaded from localStorage or defaults)
  const [meals, setMeals] = useState<LoggedMeal[]>([
    {
      id: "m_1",
      mealType: "breakfast",
      foodName: "Idli with Sambar & Coconut Chutney",
      servingG: 180,
      calories: 340,
      proteinG: 9.8,
      carbsG: 58.0,
      fatG: 6.2,
    },
    {
      id: "m_2",
      mealType: "lunch",
      foodName: "Steamed Rice with Dal Tadka & Chapati",
      servingG: 320,
      calories: 520,
      proteinG: 18.5,
      carbsG: 88.0,
      fatG: 9.4,
    },
  ]);

  // Load any user logged items from client storage
  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    );

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nutri_daily_meals");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMeals(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Compute daily totals
  const consumedCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const consumedProtein = meals.reduce((sum, m) => sum + m.proteinG, 0);
  const consumedCarbs = meals.reduce((sum, m) => sum + m.carbsG, 0);
  const consumedFat = meals.reduce((sum, m) => sum + m.fatG, 0);

  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const caloriePercentage = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));

  // 7-day trend data for Recharts
  const weeklyData = [
    { day: "Mon", calories: 2300, target: 2450 },
    { day: "Tue", calories: 2420, target: 2450 },
    { day: "Wed", calories: 2150, target: 2450 },
    { day: "Thu", calories: 2480, target: 2450 },
    { day: "Fri", calories: 2390, target: 2450 },
    { day: "Sat", calories: 2510, target: 2450 },
    { day: "Today", calories: consumedCalories, target: 2450 },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Today &bull; {formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Nutrition & Calorie Command Center
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/scanner"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>AI Food Scan</span>
          </Link>
          <Link
            href="/diary"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meal</span>
          </Link>
        </div>
      </div>

      {/* CONTEXT INSIGHT BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Context Engine</span>
            </div>
            <p className="text-base sm:text-lg font-medium text-slate-100">
              You have <span className="font-bold text-emerald-300">{remainingCalories} kcal</span> and{" "}
              <span className="font-bold text-teal-300">{Math.max(0, targetProtein - Math.round(consumedProtein))}g protein</span> remaining in today&apos;s budget.
            </p>
            <p className="text-xs text-slate-300">
              Based on your vegetarian preference, a dinner with 150g Paneer Bhurji and 2 Phulkas will hit your exact macronutrient target without exceeding your caloric ceiling.
            </p>
          </div>

          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shadow-sm transition-all"
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>Ask Nutritionist</span>
          </Link>
        </div>
      </div>

      {/* CORE CARDS GRID: CALORIES & MACROS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Calorie Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Calories</span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{consumedCalories}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">/ {targetCalories}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-600 font-semibold mt-1">
              {remainingCalories} kcal left
            </p>
          </div>

          <div className="mt-3 sm:mt-4">
            <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${caloriePercentage}%` }}
              ></div>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block text-right">
              {caloriePercentage}%
            </span>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Protein</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{Math.round(consumedProtein)}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">/ {targetProtein}g</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
              {Math.max(0, targetProtein - Math.round(consumedProtein))}g to go
            </p>
          </div>

          <div className="mt-3 sm:mt-4">
            <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((consumedProtein / targetProtein) * 100))}%` }}
              ></div>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block text-right">
              {Math.round((consumedProtein / targetProtein) * 100)}%
            </span>
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Carbs</span>
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{Math.round(consumedCarbs)}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">/ {targetCarbs}g</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
              {Math.max(0, targetCarbs - Math.round(consumedCarbs))}g to go
            </p>
          </div>

          <div className="mt-3 sm:mt-4">
            <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((consumedCarbs / targetCarbs) * 100))}%` }}
              ></div>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block text-right">
              {Math.round((consumedCarbs / targetCarbs) * 100)}%
            </span>
          </div>
        </div>

        {/* Fat Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Fat</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{Math.round(consumedFat)}</span>
              <span className="text-[10px] sm:text-xs text-slate-400">/ {targetFat}g</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
              {Math.max(0, targetFat - Math.round(consumedFat))}g to go
            </p>
          </div>

          <div className="mt-3 sm:mt-4">
            <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((consumedFat / targetFat) * 100))}%` }}
              ></div>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block text-right">
              {Math.round((consumedFat / targetFat) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* TODAY'S LOGGED MEALS TIMELINE & 7-DAY TREND */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Logged Meals List (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Today&apos;s Logged Meals</span>
            </h2>
            <Link
              href="/diary"
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <span>View Full Diary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-semibold text-slate-700">No meals logged yet today</p>
              <p className="text-xs text-slate-400 mt-1">Use AI scanner or manual search to log your first dish.</p>
              <Link
                href="/scanner"
                className="inline-flex items-center gap-1.5 mt-4 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Food</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {meals.map((meal) => (
                <div key={meal.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {meal.mealType}
                      </span>
                      <span className="text-xs text-slate-400">{meal.servingG}g</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{meal.foodName}</p>
                    <p className="text-xs text-slate-500">
                      P: {meal.proteinG}g &bull; C: {meal.carbsG}g &bull; F: {meal.fatG}g
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-900">{meal.calories}</span>
                    <span className="text-[10px] text-slate-400 block">kcal</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: 7-Day Caloric Trend Chart (1 Col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>7-Day Caloric Consistency</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Live database tracking against your 2,450 kcal daily target.
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="calories" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Target: 2,450 kcal</span>
            <span className="font-semibold text-emerald-600">Avg: 2,380 kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
