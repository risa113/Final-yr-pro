"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Utensils,
  ArrowRight,
  Info,
  Layers,
  RefreshCw,
} from "lucide-react";

interface ScanResult {
  scanId: string;
  detectedFoodName: string;
  confidenceScore: number;
  alternativeCandidates: string[];
  detectedIngredients: string[];
  estimatedServingG: number;
  servingDescription: string;
  confidenceReasoning: string;
  preparationMethod: string;
  uncertaintyNotes: string;
  matchedNutrition: {
    foodName: string;
    source: string;
    sourceId: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    isVerified: boolean;
  };
}

export default function ScannerPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [confirmedServingG, setConfirmedServingG] = useState<number>(180);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image exceeds 5MB size limit. Please choose a smaller photo.");
      return;
    }

    setErrorMessage("");
    setScanResult(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run AI multimodal recognition
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setErrorMessage("");
    setScanResult(null);

    try {
      const res = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          mimeType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze image.");
      }

      setScanResult(data);
      setConfirmedServingG(data.estimatedServingG || 150);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Re-calculate nutrients when user adjusts the serving weight
  const adjustedNutrition = React.useMemo(() => {
    if (!scanResult) return null;
    const base = scanResult.matchedNutrition;
    const baseWeight = scanResult.estimatedServingG || 100;
    const ratio = confirmedServingG / (baseWeight || 1);

    return {
      calories: Math.round(base.calories * ratio),
      proteinG: Math.round(base.proteinG * ratio * 10) / 10,
      carbsG: Math.round(base.carbsG * ratio * 10) / 10,
      fatG: Math.round(base.fatG * ratio * 10) / 10,
      fiberG: Math.round(base.fiberG * ratio * 10) / 10,
    };
  }, [scanResult, confirmedServingG]);

  // Log confirmed meal to diary
  const handleSaveToDiary = () => {
    if (!scanResult || !adjustedNutrition) return;

    const newMeal = {
      id: `meal_${Date.now()}`,
      mealType,
      foodName: scanResult.detectedFoodName,
      servingG: confirmedServingG,
      calories: adjustedNutrition.calories,
      proteinG: adjustedNutrition.proteinG,
      carbsG: adjustedNutrition.carbsG,
      fatG: adjustedNutrition.fatG,
      fiberG: adjustedNutrition.fiberG,
      source: scanResult.matchedNutrition.source,
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
      list.push(newMeal);
      localStorage.setItem("nutri_daily_meals", JSON.stringify(list));
    }

    setSavedSuccess(true);
    setTimeout(() => {
      router.push("/diary");
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multimodal Vision &bull; Google Gemini</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Food Recognition & Portion Estimation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload any meal photograph. Gemini identifies dishes and estimates portion;
          laboratory databases (ICMR-NIN IFCT & USDA) retrieve verified nutrients.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Notice Regarding AI Scanning:</p>
            <p className="text-xs text-amber-800 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* WORKFLOW GRID */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: UPLOAD & PREVIEW (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>1. Capture / Select Image</span>
            </h2>

            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={selectedImage}
                    alt="Food Photograph Preview"
                    className="w-full h-full object-cover"
                  />
                  {analyzing && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                      <p className="font-bold text-sm">Gemini Multimodal Inference...</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Detecting morphology, visible ingredients & portion scale
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{analyzing ? "Processing..." : "Run AI Recognition"}</span>
                  </button>

                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer transition-all">
                    <span>Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl aspect-square flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Upload Food Photo</p>
                <p className="text-xs text-slate-500 mt-1">JPEG, PNG, or WebP up to 5MB</p>
                <span className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI IDENTIFICATION & VERIFIED NUTRITION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {scanResult && adjustedNutrition ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* Top detected banner */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{(scanResult.confidenceScore * 100).toFixed(0)}% Visual Confidence</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ID: {scanResult.scanId}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {scanResult.detectedFoodName}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Preparation: {scanResult.preparationMethod} &bull; {scanResult.servingDescription}
                </p>
              </div>

              {/* Alternative Candidates */}
              {scanResult.alternativeCandidates.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alternative Candidates
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.alternativeCandidates.map((alt) => (
                      <span
                        key={alt}
                        className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Visible Ingredients */}
              {scanResult.detectedIngredients.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Visible Ingredients
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.detectedIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-0.5 rounded-md font-medium"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: USER CONFIRMATION & PORTION ADJUSTMENT */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Confirmed Serving Weight
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-sm">
                    <span>{confirmedServingG}</span>
                    <span className="text-xs text-slate-500">grams</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={20}
                  max={600}
                  step={10}
                  value={confirmedServingG}
                  onChange={(e) => setConfirmedServingG(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Small (50g)</span>
                  <span>Standard Portion (~180g)</span>
                  <span>Large (400g+)</span>
                </div>
              </div>

              {/* VERIFIED EMPIRICAL NUTRITION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Calculated Nutrients ({confirmedServingG}g)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Source: {scanResult.matchedNutrition.source}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Calories</span>
                    <span className="text-lg font-extrabold text-emerald-950">{adjustedNutrition.calories}</span>
                    <span className="text-[10px] text-emerald-600 block">kcal</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Protein</span>
                    <span className="text-lg font-extrabold text-slate-900">{adjustedNutrition.proteinG}</span>
                    <span className="text-[10px] text-slate-500 block">g</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Carbs</span>
                    <span className="text-lg font-extrabold text-slate-900">{adjustedNutrition.carbsG}</span>
                    <span className="text-[10px] text-slate-500 block">g</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Fat</span>
                    <span className="text-lg font-extrabold text-slate-900">{adjustedNutrition.fatG}</span>
                    <span className="text-[10px] text-slate-500 block">g</span>
                  </div>
                </div>
              </div>

              {/* SAVE ACTION */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600">Meal Slot:</label>
                  <select
                    value={mealType}
                    onChange={(e: any) => setMealType(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 capitalize"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveToDiary}
                  disabled={savedSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:bg-emerald-800"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Logged to Food Diary! Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="w-4 h-4" />
                      <span>Confirm & Save to {mealType.toUpperCase()}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Awaiting Food Photograph</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Select or capture a food photo on the left. Gemini will process visual morphology, extract ingredients, and retrieve verified ICMR-NIN nutritional values.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
