"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Database,
  Filter,
  Plus,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Barcode,
  ExternalLink,
} from "lucide-react";
import { ICMR_NIN_FOOD_DATABASE, type VerifiedFoodItem } from "@/lib/nutrition/ifct-data";

export default function FoodSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [items, setItems] = useState<VerifiedFoodItem[]>(ICMR_NIN_FOOD_DATABASE);
  const [selectedItem, setSelectedItem] = useState<VerifiedFoodItem | null>(null);
  const [servingWeightG, setServingWeightG] = useState<number>(100);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Barcode search state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");

  const categories = [
    "All",
    "Breakfast & Tiffin",
    "Curries & Stews",
    "Breads & Flatbreads",
    "Biryanis & Rice Dishes",
    "Meat & Poultry",
    "Eggs",
    "Fish & Seafood",
    "Fruits",
    "Dairy",
    "Beverages",
  ];

  // Filter items based on search and category
  useEffect(() => {
    let list = ICMR_NIN_FOOD_DATABASE;

    if (selectedCategory !== "All") {
      list = list.filter((i) => i.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.aliases.some((a) => a.toLowerCase().includes(q)) ||
          i.category.toLowerCase().includes(q)
      );
    }

    setItems(list);
  }, [searchQuery, selectedCategory]);

  const handleOpenItem = (item: VerifiedFoodItem) => {
    setSelectedItem(item);
    setServingWeightG(item.standardServingG || 100);
    setAddedSuccess(false);
  };

  const handleAddToDiary = () => {
    if (!selectedItem) return;

    const factor = servingWeightG / 100.0;
    const newEntry = {
      id: `meal_${Date.now()}`,
      mealType,
      foodName: selectedItem.name,
      servingG: servingWeightG,
      calories: Math.round(selectedItem.caloriesPer100g * factor),
      proteinG: Math.round(selectedItem.proteinPer100g * factor * 10) / 10,
      carbsG: Math.round(selectedItem.carbsPer100g * factor * 10) / 10,
      fatG: Math.round(selectedItem.fatPer100g * factor * 10) / 10,
      fiberG: Math.round(selectedItem.fiberPer100g * factor * 10) / 10,
      source: selectedItem.source,
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

    setAddedSuccess(true);
    setTimeout(() => {
      setSelectedItem(null);
      setAddedSuccess(false);
    }, 1200);
  };

  // Barcode Lookup with Open Food Facts
  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setBarcodeLoading(true);
    setBarcodeError("");

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          barcodeInput.trim()
        )}.json`
      );
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        const nutriments = p.nutriments || {};
        const cal =
          nutriments["energy-kcal_100g"] ||
          nutriments["energy-kcal"] ||
          Math.round((nutriments["energy_100g"] || 0) / 4.184) ||
          150;

        const customItem: VerifiedFoodItem = {
          id: `off_${p.code}`,
          name: p.product_name || "Packaged Food",
          aliases: [p.brands || ""],
          category: "Packaged Product",
          source: "OPEN_FOOD_FACTS",
          sourceId: p.code,
          standardServingG: 100,
          servingUnit: "serving (100g)",
          caloriesPer100g: Number(cal),
          proteinPer100g: Number(nutriments.proteins_100g) || 0,
          carbsPer100g: Number(nutriments.carbohydrates_100g) || 0,
          fatPer100g: Number(nutriments.fat_100g) || 0,
          fiberPer100g: Number(nutriments.fiber_100g) || 0,
          dietaryType: "vegetarian",
          commonAllergens: [],
        };

        handleOpenItem(customItem);
      } else {
        setBarcodeError("Product not found in Open Food Facts database.");
      }
    } catch (err: any) {
      setBarcodeError("Failed to reach Open Food Facts service.");
    } finally {
      setBarcodeLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Reference Databases</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Food & Nutrition Database Explorer
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore lab-tested nutritional composition for Indian foods (ICMR-NIN IFCT 2017) and scan global packaged goods via Open Food Facts.
        </p>
      </div>

      {/* SEARCH AND BARCODE BAR */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish (e.g. Idli, Dosa, Sambar, Parotta, Biryani, Apple)..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-xs"
          />
        </div>

        <form onSubmit={handleBarcodeSearch} className="relative">
          <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Enter Barcode / EAN..."
            className="w-full pl-10 pr-20 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-600 shadow-xs"
          />
          <button
            type="submit"
            disabled={barcodeLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {barcodeLoading ? "..." : "Lookup"}
          </button>
        </form>
      </div>

      {barcodeError && (
        <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          {barcodeError}
        </p>
      )}

      {/* CATEGORY FILTER PILLS */}
      <div className="flex gap-2 overflow-x-auto pb-2 text-xs no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FOOD CARDS GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenItem(item)}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.category}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {item.source}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard unit: {item.servingUnit}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-lg font-extrabold text-slate-900">
                  {item.caloriesPer100g}
                </span>
                <span className="text-xs text-slate-500 ml-1">kcal / 100g</span>
              </div>
              <div className="text-right text-xs text-slate-500 space-x-2">
                <span>P: <strong>{item.proteinPer100g}g</strong></span>
                <span>C: <strong>{item.carbsPer100g}g</strong></span>
                <span>F: <strong>{item.fatPer100g}g</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PORTION ADJUSTMENT MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white max-w-md w-full rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedItem.source} Reference
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{selectedItem.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: {selectedItem.category} &bull; Reference ID: {selectedItem.sourceId}
              </p>
            </div>

            {/* Scale serving grams */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Portion Weight</span>
                </span>
                <span className="text-sm font-mono text-emerald-700">{servingWeightG} grams</span>
              </div>

              <input
                type="range"
                min={20}
                max={500}
                step={5}
                value={servingWeightG}
                onChange={(e) => setServingWeightG(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Calculated Nutrients */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Calories</span>
                <span className="text-base font-extrabold text-emerald-950">
                  {Math.round((selectedItem.caloriesPer100g * servingWeightG) / 100)}
                </span>
                <span className="text-[10px] text-emerald-600 block">kcal</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Protein</span>
                <span className="text-base font-extrabold text-slate-900">
                  {Math.round(((selectedItem.proteinPer100g * servingWeightG) / 100) * 10) / 10}
                </span>
                <span className="text-[10px] text-slate-500 block">g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Carbs</span>
                <span className="text-base font-extrabold text-slate-900">
                  {Math.round(((selectedItem.carbsPer100g * servingWeightG) / 100) * 10) / 10}
                </span>
                <span className="text-[10px] text-slate-500 block">g</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Fat</span>
                <span className="text-base font-extrabold text-slate-900">
                  {Math.round(((selectedItem.fatPer100g * servingWeightG) / 100) * 10) / 10}
                </span>
                <span className="text-[10px] text-slate-500 block">g</span>
              </div>
            </div>

            {/* Meal Slot Selection & Add Button */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Add to Meal Slot:</span>
                <select
                  value={mealType}
                  onChange={(e: any) => setMealType(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold capitalize focus:outline-none"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <button
                onClick={handleAddToDiary}
                disabled={addedSuccess}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:bg-emerald-800"
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Added to Food Diary!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add {servingWeightG}g to {mealType.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
