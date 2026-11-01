"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Flame,
  Camera,
  Search,
  Droplets,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface DiaryItem {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodName: string;
  servingG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source?: string;
}

export default function FoodDiaryPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [waterMl, setWaterMl] = useState<number>(1500);

  const [meals, setMeals] = useState<DiaryItem[]>([
    {
      id: "d_1",
      mealType: "breakfast",
      foodName: "Idli (Steamed Rice Cake)",
      servingG: 100,
      calories: 140,
      proteinG: 4.8,
      carbsG: 28.5,
      fatG: 0.4,
      source: "ICMR_NIN",
    },
    {
      id: "d_2",
      mealType: "breakfast",
      foodName: "Sambar (Lentil Stew)",
      servingG: 150,
      calories: 87,
      proteinG: 4.2,
      carbsG: 12.8,
      fatG: 2.1,
      source: "ICMR_NIN",
    },
    {
      id: "d_3",
      mealType: "lunch",
      foodName: "Steamed White Rice",
      servingG: 150,
      calories: 195,
      proteinG: 4.1,
      carbsG: 42.3,
      fatG: 0.5,
      source: "ICMR_NIN",
    },
    {
      id: "d_4",
      mealType: "lunch",
      foodName: "Dal Tadka",
      servingG: 150,
      calories: 168,
      proteinG: 8.4,
      carbsG: 22.2,
      fatG: 5.3,
      source: "ICMR_NIN",
    },
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);

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

  // Save to localStorage when updated
  const syncStorage = (updated: DiaryItem[]) => {
    setMeals(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nutri_daily_meals", JSON.stringify(updated));
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = meals.filter((m) => m.id !== id);
    syncStorage(updated);
  };

  // Calculations
  const targetCalories = 2450;
  const targetProtein = 135;
  const targetCarbs = 290;
  const targetFat = 75;

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = Math.round(meals.reduce((sum, m) => sum + m.proteinG, 0));
  const totalCarbs = Math.round(meals.reduce((sum, m) => sum + m.carbsG, 0));
  const totalFat = Math.round(meals.reduce((sum, m) => sum + m.fatG, 0));

  const mealSlots: Array<"breakfast" | "lunch" | "dinner" | "snack"> = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER & DATE SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Intake Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Food Diary & Meal Tracker
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* DAILY BUDGET SUMMARY BAR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs grid sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-center">
        <div className="pt-2 sm:pt-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Energy Intake
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{totalCalories}</span>
          <span className="text-xs text-slate-400 ml-1">/ {targetCalories} kcal</span>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {Math.max(0, targetCalories - totalCalories)} kcal left
          </p>
        </div>

        <div className="pt-2 sm:pt-0 sm:pl-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Protein
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{totalProtein}</span>
          <span className="text-xs text-slate-400 ml-1">/ {targetProtein}g</span>
          <div className="w-20 mx-auto bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-2 sm:pt-0 sm:pl-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Carbohydrates
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{totalCarbs}</span>
          <span className="text-xs text-slate-400 ml-1">/ {targetCarbs}g</span>
          <div className="w-20 mx-auto bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-2 sm:pt-0 sm:pl-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Fats
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{totalFat}</span>
          <span className="text-xs text-slate-400 ml-1">/ {targetFat}g</span>
          <div className="w-20 mx-auto bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* MEAL SECTIONS */}
      <div className="space-y-4">
        {mealSlots.map((slot) => {
          const slotItems = meals.filter((m) => m.mealType === slot);
          const slotCalories = slotItems.reduce((sum, m) => sum + m.calories, 0);
          const slotProtein = slotItems.reduce((sum, m) => sum + m.proteinG, 0);

          return (
            <div
              key={slot}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Slot Header */}
              <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider capitalize">
                    {slot}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {slotCalories} kcal &bull; {Math.round(slotProtein * 10) / 10}g protein
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/scanner"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan</span>
                  </Link>

                  <Link
                    href="/foods"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </Link>
                </div>
              </div>

              {/* Items List */}
              {slotItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No food logged for {slot} yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {slotItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {item.foodName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {item.servingG}g
                          </span>
                          {item.source && (
                            <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {item.source}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          P: {item.proteinG}g &bull; C: {item.carbsG}g &bull; F: {item.fatG}g
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-base font-bold text-slate-900">
                            {item.calories}
                          </span>
                          <span className="text-[10px] text-slate-400 block">kcal</span>
                        </div>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete entry"
                          className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* WATER INTAKE TRACKER */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Water Hydration</h3>
            <p className="text-xs text-slate-500">
              Logged: <strong className="text-blue-700">{waterMl} ml</strong> / 2,500 ml target
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWaterMl((prev) => Math.max(0, prev - 250))}
            className="px-3 py-1.5 bg-white border border-blue-200 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-50 cursor-pointer"
          >
            -250ml
          </button>
          <button
            onClick={() => setWaterMl((prev) => prev + 250)}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            +250ml Glass
          </button>
        </div>
      </div>
    </div>
  );
}
