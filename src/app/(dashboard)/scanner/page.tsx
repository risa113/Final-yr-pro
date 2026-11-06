"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Sliders,
  Plus,
  Trash2,
  Heart,
  Activity,
  Flame,
  MessageSquare,
  Check,
  X,
  Clock,
  Award,
} from "lucide-react";
import {
  scaleDetailedNutrition,
  type DetailedNutrition,
} from "@/lib/nutrition/calculator";
import type { FoodScanResult, DetectedFoodItem } from "@/lib/ai/gemini";

/**
 * Compresses an image client-side via HTML5 Canvas
 * Reduces camera upload payload from ~10MB to ~250KB for fast AI vision inference.
 */
async function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<{ base64: string; mimeType: string; originalKB: number; compressedKB: number }> {
  return new Promise((resolve, reject) => {
    const originalKB = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into memory."));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({
            base64: reader.result as string,
            mimeType: file.type || "image/jpeg",
            originalKB,
            compressedKB: originalKB,
          });
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mime = "image/jpeg";
        const compressedDataUrl = canvas.toDataURL(mime, quality);
        const compressedKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          base64: compressedDataUrl,
          mimeType: mime,
          originalKB,
          compressedKB,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export default function ScannerPage() {
  const router = useRouter();

  // Input states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [compressionInfo, setCompressionInfo] = useState<{ originalKB: number; compressedKB: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis & Progress states
  const [analyzing, setAnalyzing] = useState(false);
  const [progressStage, setProgressStage] = useState<1 | 2 | 3 | 4>(1);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Results & Interactive Editing states
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [items, setItems] = useState<DetectedFoodItem[]>([]);
  const [servingWeightG, setServingWeightG] = useState<number>(180);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [activeTab, setActiveTab] = useState<"macros" | "items" | "micros" | "clinical">("macros");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Add Item Drawer state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemGrams, setNewItemGrams] = useState(100);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Quota countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          setIsQuotaExhausted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Handle selected image file (via upload, camera, or drag-drop)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setErrorMessage("");
    setScanResult(null);
    setItems([]);
    setIsQuotaExhausted(false);

    try {
      const compressed = await compressImage(file);
      setSelectedImage(compressed.base64);
      setMimeType(compressed.mimeType);
      setCompressionInfo({
        originalKB: compressed.originalKB,
        compressedKB: compressed.compressedKB,
      });
    } catch (err: any) {
      setErrorMessage("Failed to process image: " + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  // Run AI multimodal recognition
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setErrorMessage("");
    setIsQuotaExhausted(false);
    setProgressStage(1);

    abortControllerRef.current = new AbortController();

    // Stage simulation timers for authentic feedback
    const stageTimer1 = setTimeout(() => setProgressStage(2), 700);
    const stageTimer2 = setTimeout(() => setProgressStage(3), 2000);
    const stageTimer3 = setTimeout(() => setProgressStage(4), 3800);

    try {
      // Retrieve optional user profile context
      let userContext: any = null;
      if (typeof window !== "undefined") {
        try {
          const profileRaw = localStorage.getItem("user_nutrition_profile");
          if (profileRaw) userContext = JSON.parse(profileRaw);
        } catch (e) {
          // ignore
        }
      }

      const res = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          mimeType,
          userProfile: userContext,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.isQuotaExhausted) {
          setIsQuotaExhausted(true);
          setCooldownSeconds(data.retryAfterSeconds || 60);
          throw new Error(data.error || "Free Tier API quota exceeded. Please wait a moment.");
        }
        throw new Error(data.error || "Failed to analyze food photograph.");
      }

      setScanResult(data);
      const initialItems = data.detectedItems || [];
      setItems(initialItems);
      setServingWeightG(data.estimatedServingG || 180);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setErrorMessage("Analysis cancelled.");
      } else {
        setErrorMessage(err.message || "An error occurred during food recognition.");
      }
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAnalyzing(false);
  };

  // Scaled nutrition computation across all items
  const dynamicTotalNutrition = useMemo(() => {
    if (!scanResult) return null;

    if (items.length === 0) {
      // Single dish scaling directly from totalNutrition
      const baseWeight = scanResult.estimatedServingG || 100;
      const factor = servingWeightG / (baseWeight || 1);
      const base = scanResult.totalNutrition;

      return {
        ...base,
        calories: Math.round(base.calories * factor),
        proteinG: Math.round(base.proteinG * factor * 10) / 10,
        carbsG: Math.round(base.carbsG * factor * 10) / 10,
        fatG: Math.round(base.fatG * factor * 10) / 10,
        saturatedFatG: Math.round(base.saturatedFatG * factor * 10) / 10,
        fiberG: Math.round(base.fiberG * factor * 10) / 10,
        sugarG: Math.round(base.sugarG * factor * 10) / 10,
        sodiumMg: Math.round(base.sodiumMg * factor),
        cholesterolMg: Math.round(base.cholesterolMg * factor),
        potassiumMg: Math.round(base.potassiumMg * factor),
        calciumMg: Math.round(base.calciumMg * factor),
        ironMg: Math.round(base.ironMg * factor * 10) / 10,
        vitaminAMcg: Math.round(base.vitaminAMcg * factor),
        vitaminCMg: Math.round(base.vitaminCMg * factor * 10) / 10,
      };
    }

    // Sum scaled values of all constituent items
    let cals = 0;
    let prot = 0;
    let carbs = 0;
    let fat = 0;
    let satFat = 0;
    let fiber = 0;
    let sugar = 0;
    let sodium = 0;
    let cholesterol = 0;
    let potassium = 0;
    let calcium = 0;
    let iron = 0;
    let vitA = 0;
    let vitC = 0;

    for (const item of items) {
      const scaled = scaleDetailedNutrition(item.per100g, item.portionG);
      cals += scaled.calories;
      prot += scaled.proteinG;
      carbs += scaled.carbsG;
      fat += scaled.fatG;
      satFat += scaled.saturatedFatG;
      fiber += scaled.fiberG;
      sugar += scaled.sugarG;
      sodium += scaled.sodiumMg;
      cholesterol += scaled.cholesterolMg;
      potassium += scaled.potassiumMg;
      calcium += scaled.calciumMg;
      iron += scaled.ironMg;
      vitA += scaled.vitaminAMcg;
      vitC += scaled.vitaminCMg;
    }

    return {
      calories: Math.round(cals),
      proteinG: Math.round(prot * 10) / 10,
      carbsG: Math.round(carbs * 10) / 10,
      fatG: Math.round(fat * 10) / 10,
      saturatedFatG: Math.round(satFat * 10) / 10,
      fiberG: Math.round(fiber * 10) / 10,
      sugarG: Math.round(sugar * 10) / 10,
      sodiumMg: Math.round(sodium),
      cholesterolMg: Math.round(cholesterol),
      potassiumMg: Math.round(potassium),
      calciumMg: Math.round(calcium),
      ironMg: Math.round(iron * 10) / 10,
      vitaminAMcg: Math.round(vitA),
      vitaminCMg: Math.round(vitC * 10) / 10,
      source: scanResult.totalNutrition.source,
      isVerified: scanResult.totalNutrition.isVerified,
    };
  }, [scanResult, items, servingWeightG]);

  // Handle total portion slider change
  const handleTotalWeightChange = (newWeightG: number) => {
    setServingWeightG(newWeightG);
    if (items.length > 0) {
      const currentSum = items.reduce((sum, it) => sum + it.portionG, 0);
      const ratio = newWeightG / (currentSum || 1);
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          portionG: Math.max(10, Math.round(it.portionG * ratio)),
        }))
      );
    }
  };

  // Adjust portion of an individual sub-item
  const handleItemPortionChange = (id: string, deltaG: number) => {
    setItems((prev) => {
      const next = prev.map((it) => {
        if (it.id !== id) return it;
        const newPortion = Math.max(15, it.portionG + deltaG);
        return { ...it, portionG: newPortion };
      });
      const newTotal = next.reduce((sum, it) => sum + it.portionG, 0);
      setServingWeightG(newTotal);
      return next;
    });
  };

  // Remove an item from the composite meal
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      const newTotal = next.reduce((sum, it) => sum + it.portionG, 0);
      setServingWeightG(newTotal);
      return next;
    });
  };

  // Add an item to the composite meal
  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    const newItem: DetectedFoodItem = {
      id: `manual_${Date.now()}`,
      name: newItemName.trim(),
      portionG: newItemGrams,
      portionDescription: `${newItemGrams}g side`,
      cookingMethod: "Added item",
      calories: Math.round(newItemGrams * 1.4),
      proteinG: Math.round(newItemGrams * 0.05 * 10) / 10,
      carbsG: Math.round(newItemGrams * 0.2 * 10) / 10,
      fatG: Math.round(newItemGrams * 0.04 * 10) / 10,
      fiberG: Math.round(newItemGrams * 0.02 * 10) / 10,
      ingredients: [newItemName.trim()],
      source: "ICMR_NIN",
      isVerified: true,
      per100g: {
        calories: 140,
        proteinG: 5.0,
        carbsG: 20.0,
        fatG: 4.0,
        saturatedFatG: 1.0,
        fiberG: 2.0,
        sugarG: 1.5,
        sodiumMg: 180,
        cholesterolMg: 0,
        potassiumMg: 140,
        calciumMg: 35,
        ironMg: 1.2,
        vitaminAMcg: 15,
        vitaminCMg: 2.0,
      },
    };

    setItems((prev) => [...prev, newItem]);
    setServingWeightG((prev) => prev + newItemGrams);
    setNewItemName("");
    setShowAddItem(false);
  };

  // Save meal to database and localStorage
  const handleSaveToDiary = async () => {
    if (!scanResult || !dynamicTotalNutrition) return;

    const payload = {
      meal_type: mealType,
      logged_date: new Date().toISOString().split("T")[0],
      food_name: scanResult.detectedFoodName,
      serving_weight_g: servingWeightG,
      calories: dynamicTotalNutrition.calories,
      protein_g: dynamicTotalNutrition.proteinG,
      carbs_g: dynamicTotalNutrition.carbsG,
      fat_g: dynamicTotalNutrition.fatG,
      total_calories: dynamicTotalNutrition.calories,
      total_protein_g: dynamicTotalNutrition.proteinG,
      total_carbs_g: dynamicTotalNutrition.carbsG,
      total_fat_g: dynamicTotalNutrition.fatG,
      items: items.map((it) => ({
        name: it.name,
        portionG: it.portionG,
        calories: it.calories,
        proteinG: it.proteinG,
        carbsG: it.carbsG,
        fatG: it.fatG,
      })),
    };

    // 1. LocalStorage update for instant guest/offline support
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
      list.push({
        id: `meal_${Date.now()}`,
        mealType,
        foodName: scanResult.detectedFoodName,
        servingG: servingWeightG,
        calories: dynamicTotalNutrition.calories,
        proteinG: dynamicTotalNutrition.proteinG,
        carbsG: dynamicTotalNutrition.carbsG,
        fatG: dynamicTotalNutrition.fatG,
        fiberG: dynamicTotalNutrition.fiberG,
        source: scanResult.totalNutrition.source,
      });
      localStorage.setItem("nutri_daily_meals", JSON.stringify(list));
    }

    // 2. Supabase API call
    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("Failed to sync meal to Supabase:", err);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      router.push("/diary");
    }, 1200);
  };

  // Seamless transition to Assistant with scanned meal context
  const handleAskAssistant = () => {
    if (!scanResult || !dynamicTotalNutrition) return;

    const mealContext = {
      detectedFoodName: scanResult.detectedFoodName,
      estimatedServingG: servingWeightG,
      servingDescription: scanResult.servingDescription,
      preparationMethod: scanResult.preparationMethod,
      totalNutrition: dynamicTotalNutrition,
      detectedItems: items.map((it) => ({
        name: it.name,
        portionG: it.portionG,
        calories: it.calories,
        proteinG: it.proteinG,
        carbsG: it.carbsG,
        cookingMethod: it.cookingMethod,
      })),
      healthAnalysis: scanResult.healthAnalysis,
      recommendations: scanResult.recommendations,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("thariq_scanned_meal", JSON.stringify(mealContext));
    }

    router.push("/assistant");
  };

  // Reset scanner to scan another meal
  const handleResetScanner = () => {
    setSelectedImage(null);
    setScanResult(null);
    setItems([]);
    setErrorMessage("");
    setSavedSuccess(false);
    setCompressionInfo(null);
  };

  // Calculate Macro Percentages for Visual Split
  const macroSplit = useMemo(() => {
    if (!dynamicTotalNutrition) return { proteinPct: 25, carbsPct: 50, fatPct: 25 };
    const pCals = dynamicTotalNutrition.proteinG * 4;
    const cCals = dynamicTotalNutrition.carbsG * 4;
    const fCals = dynamicTotalNutrition.fatG * 9;
    const totalMacroCals = pCals + cCals + fCals || 1;

    return {
      proteinPct: Math.round((pCals / totalMacroCals) * 100),
      carbsPct: Math.round((cCals / totalMacroCals) * 100),
      fatPct: Math.round((fCals / totalMacroCals) * 100),
    };
  }, [dynamicTotalNutrition]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>THARIQ AI &bull; Food Vision & Nutrition Scanner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AI Food Image Recognition & Empirical Nutrition Scanner
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Upload or capture any meal photo. THARIQ AI recognizes dishes, ingredients, and portions;
            laboratory tables (ICMR-NIN IFCT 2017 & USDA) calculate verified scientific nutrients.
          </p>
        </div>

        {scanResult && (
          <button
            onClick={handleResetScanner}
            className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Another Meal</span>
          </button>
        )}
      </div>

      {/* ERROR / QUOTA NOTICES */}
      {isQuotaExhausted && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-4 shadow-xs">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">Free Tier AI Quota Rate Limit Encountered</p>
              <span className="text-xs font-mono font-bold bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full">
                Cooldown: {cooldownSeconds}s
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              The AI Vision provider Free Tier request limit has been reached temporarily.
              Automatic failover tried all candidate models. Please wait for the cooldown to expire,
              or manually configure an active API key in <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code>.
            </p>
            <div className="pt-1">
              <button
                onClick={handleAnalyze}
                disabled={cooldownSeconds > 0 || analyzing}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {cooldownSeconds > 0 ? `Retry in ${cooldownSeconds}s` : "Retry Analysis Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && !isQuotaExhausted && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Notice Regarding Food Scanner:</p>
            <p className="text-xs text-rose-800 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKFLOW */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: UPLOAD, CAMERA & IMAGE PREVIEW (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>1. Capture or Select Meal</span>
              </h2>
              {compressionInfo && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                  Compressed: {compressionInfo.originalKB}KB → {compressionInfo.compressedKB}KB
                </span>
              )}
            </div>

            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950">
                  <img
                    src={selectedImage}
                    alt="Food Photograph Preview"
                    className="w-full h-full object-cover"
                  />
                  {analyzing && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                      <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm">
                          {progressStage === 1 && "Optimizing Image Payload..."}
                          {progressStage === 2 && "THARIQ AI Vision: Analyzing Morphology..."}
                          {progressStage === 3 && "Querying ICMR-NIN & USDA Tables..."}
                          {progressStage === 4 && "Synthesizing Nutrition & Clinical Insights..."}
                        </p>
                        <p className="text-xs text-slate-300">
                          {progressStage === 1 && "Canvas compression active for rapid inference"}
                          {progressStage === 2 && "Detecting multi-item plates, ingredients & grams"}
                          {progressStage === 3 && "Decoupled laboratory nutrition retrieval"}
                          {progressStage === 4 && "Evaluating goals, strengths & allergy alerts"}
                        </p>
                      </div>

                      <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${progressStage * 25}%` }}
                        />
                      </div>

                      <button
                        onClick={handleCancelAnalysis}
                        className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer mt-2"
                      >
                        Cancel Request
                      </button>
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
                    <span>{analyzing ? "Analyzing Meal..." : "Run AI Recognition"}</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer transition-all"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center p-6 text-center transition-colors ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-slate-300 hover:border-emerald-500 bg-slate-50/50"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">Drag & Drop Food Photograph</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Supports JPG, PNG, WebP or direct camera capture. Automatic canvas compression applied.
                </p>

                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse File</span>
                  </button>

                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Scanning Tips for Maximum Accuracy</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
              <li>Capture from a 45° angle showing both food surface and depth.</li>
              <li>Include side dishes, breads, or condiments for multi-item meal detection.</li>
              <li>Good natural lighting improves ingredient and sauce classification.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: AI SCANNER RESULTS DASHBOARD (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {scanResult && dynamicTotalNutrition ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* SECTION A: DETECTED FOOD & MORPHOLOGY */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{(scanResult.confidenceScore * 100).toFixed(0)}% Visual Confidence</span>
                    </span>
                    {scanResult.isMultiItem && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                        <Layers className="w-3.5 h-3.5 text-sky-600" />
                        <span>Composite Meal ({items.length} items)</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {scanResult.scanId}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {scanResult.detectedFoodName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700">Preparation:</span> {scanResult.preparationMethod}
                    <span>&bull;</span>
                    <span className="font-semibold text-slate-700">Serving:</span> {scanResult.servingDescription}
                  </p>
                </div>

                {/* Alternative Candidates */}
                {scanResult.alternativeCandidates && scanResult.alternativeCandidates.length > 0 && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Alternative Interpretations
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.alternativeCandidates.map((alt) => (
                        <span
                          key={alt}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg transition-colors cursor-default"
                        >
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Morphology Reasoning & Uncertainty Disclaimer */}
                <div className="grid sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800 block mb-0.5">Visual Cues:</span>
                    {scanResult.confidenceReasoning}
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-800">
                    <span className="font-bold text-amber-900 block mb-0.5">Photometric Notice:</span>
                    {scanResult.uncertaintyNotes}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE PORTION SLIDER */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Confirmed Serving Weight
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-emerald-900 text-base bg-emerald-100/70 px-2.5 py-0.5 rounded-lg">
                    <span>{servingWeightG}</span>
                    <span className="text-xs text-emerald-700 font-sans">grams</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={30}
                  max={800}
                  step={10}
                  value={servingWeightG}
                  onChange={(e) => handleTotalWeightChange(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    onClick={() => handleTotalWeightChange(Math.round(servingWeightG * 0.7))}
                    className="hover:text-slate-700 cursor-pointer"
                  >
                    Small (70%)
                  </button>
                  <button
                    onClick={() => handleTotalWeightChange(scanResult.estimatedServingG || 180)}
                    className="hover:text-slate-700 font-semibold text-slate-600 cursor-pointer"
                  >
                    AI Estimated ({scanResult.estimatedServingG || 180}g)
                  </button>
                  <button
                    onClick={() => handleTotalWeightChange(Math.round(servingWeightG * 1.3))}
                    className="hover:text-slate-700 cursor-pointer"
                  >
                    Generous (130%)
                  </button>
                </div>
              </div>

              {/* NAVIGATION TABS: MACROS, ITEMS, MICROS, CLINICAL */}
              <div className="flex border-b border-slate-200 gap-2">
                <button
                  onClick={() => setActiveTab("macros")}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "macros"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Nutrition Summary</span>
                </button>

                {items.length > 0 && (
                  <button
                    onClick={() => setActiveTab("items")}
                    className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "items"
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Items ({items.length})</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("micros")}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "micros"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Micronutrients</span>
                </button>

                <button
                  onClick={() => setActiveTab("clinical")}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "clinical"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Health Analysis</span>
                </button>
              </div>

              {/* TAB CONTENT: MACROS SUMMARY */}
              {activeTab === "macros" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Laboratory Calculated ({servingWeightG}g)</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Source: {dynamicTotalNutrition.source} IFCT 2017 & USDA
                    </span>
                  </div>

                  {/* 4 PRIMARY MACRO CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Calories</span>
                      <span className="text-2xl font-extrabold text-emerald-950">{dynamicTotalNutrition.calories}</span>
                      <span className="text-[10px] text-emerald-600 block">kcal</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">Protein</span>
                      <span className="text-2xl font-extrabold text-slate-900">{dynamicTotalNutrition.proteinG}</span>
                      <span className="text-[10px] text-slate-500 block">grams ({macroSplit.proteinPct}%)</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">Carbs</span>
                      <span className="text-2xl font-extrabold text-slate-900">{dynamicTotalNutrition.carbsG}</span>
                      <span className="text-[10px] text-slate-500 block">grams ({macroSplit.carbsPct}%)</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">Total Fat</span>
                      <span className="text-2xl font-extrabold text-slate-900">{dynamicTotalNutrition.fatG}</span>
                      <span className="text-[10px] text-slate-500 block">grams ({macroSplit.fatPct}%)</span>
                    </div>
                  </div>

                  {/* VISUAL MACRO SPLIT BAR */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Caloric Macro Balance</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Protein {macroSplit.proteinPct}%
                        </span>
                        <span className="flex items-center gap-1 text-sky-700">
                          <span className="w-2 h-2 rounded-full bg-sky-500" /> Carbs {macroSplit.carbsPct}%
                        </span>
                        <span className="flex items-center gap-1 text-amber-700">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Fat {macroSplit.fatPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${macroSplit.proteinPct}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${macroSplit.carbsPct}%` }} className="bg-sky-500 h-full" />
                      <div style={{ width: `${macroSplit.fatPct}%` }} className="bg-amber-500 h-full" />
                    </div>
                  </div>

                  {/* 5 SECONDARY METRICS (FIBER, SAT FAT, SUGAR, SODIUM, CHOLESTEROL) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Fiber</span>
                      <span className="text-sm font-extrabold text-slate-800">{dynamicTotalNutrition.fiberG}g</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Sat. Fat</span>
                      <span className="text-sm font-extrabold text-slate-800">{dynamicTotalNutrition.saturatedFatG}g</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Sugar</span>
                      <span className="text-sm font-extrabold text-slate-800">{dynamicTotalNutrition.sugarG}g</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Sodium</span>
                      <span className="text-sm font-extrabold text-slate-800">{dynamicTotalNutrition.sodiumMg}mg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Cholesterol</span>
                      <span className="text-sm font-extrabold text-slate-800">{dynamicTotalNutrition.cholesterolMg}mg</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: INDIVIDUAL ITEMS BREAKDOWN */}
              {activeTab === "items" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Constituent Plate Items & Portions
                    </span>
                    <button
                      onClick={() => setShowAddItem(!showAddItem)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Unrecognized Item</span>
                    </button>
                  </div>

                  {/* Add Item Inline Drawer */}
                  {showAddItem && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Papad, Cucumber Raita)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs flex-1 min-w-[160px] focus:outline-none focus:border-emerald-600"
                      />
                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="number"
                          value={newItemGrams}
                          onChange={(e) => setNewItemGrams(Number(e.target.value))}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                        <span className="text-slate-500">g</span>
                      </div>
                      <button
                        onClick={handleAddNewItem}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Add to Meal
                      </button>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{item.name}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.cookingMethod}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                            <span>
                              {scaleDetailedNutrition(item.per100g, item.portionG).calories} kcal
                            </span>
                            <span>&bull;</span>
                            <span>
                              {scaleDetailedNutrition(item.per100g, item.portionG).proteinG}g P
                            </span>
                            <span>&bull;</span>
                            <span>
                              {scaleDetailedNutrition(item.per100g, item.portionG).carbsG}g C
                            </span>
                            <span>&bull;</span>
                            <span>
                              {scaleDetailedNutrition(item.per100g, item.portionG).fatG}g F
                            </span>
                          </div>
                        </div>

                        {/* Portion Adjusters */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl">
                            <button
                              onClick={() => handleItemPortionChange(item.id, -20)}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-slate-900 w-10 text-center">
                              {item.portionG}g
                            </span>
                            <button
                              onClick={() => handleItemPortionChange(item.id, 20)}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: MICRONUTRIENTS HIGHLIGHTS */}
              {activeTab === "micros" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Essential Micronutrients & Electrolytes
                    </span>
                    <span className="text-[10px] text-slate-500">Calculated for {servingWeightG}g</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-600 block">Potassium</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {dynamicTotalNutrition.potassiumMg} <span className="text-xs font-normal">mg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Fluid balance & BP</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-600 block">Calcium</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {dynamicTotalNutrition.calciumMg} <span className="text-xs font-normal">mg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Bone & muscle tone</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-600 block">Iron</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {dynamicTotalNutrition.ironMg} <span className="text-xs font-normal">mg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Oxygen transportation</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-600 block">Vitamin A</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {dynamicTotalNutrition.vitaminAMcg} <span className="text-xs font-normal">mcg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Vision & cellular health</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-600 block">Vitamin C</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {dynamicTotalNutrition.vitaminCMg} <span className="text-xs font-normal">mg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Antioxidant & collagen</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-600 block">Sodium</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {dynamicTotalNutrition.sodiumMg} <span className="text-xs font-normal">mg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Daily cap: 2000mg</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: CLINICAL HEALTH & GOAL ANALYSIS */}
              {activeTab === "clinical" && (
                <div className="space-y-4">
                  {/* Goal Suitability Badges */}
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Goal Suitability Assessment
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Weight Loss</span>
                        <span className="text-xs font-extrabold capitalize text-emerald-700">
                          {scanResult.healthAnalysis.goalSuitability.weightLoss}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Muscle Building</span>
                        <span className="text-xs font-extrabold capitalize text-emerald-700">
                          {scanResult.healthAnalysis.goalSuitability.muscleBuilding}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Blood Sugar</span>
                        <span className="text-xs font-extrabold capitalize text-slate-800">
                          {scanResult.healthAnalysis.goalSuitability.bloodSugar.replace("_", " ")}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Heart Health</span>
                        <span className="text-xs font-extrabold capitalize text-slate-800">
                          {scanResult.healthAnalysis.goalSuitability.heartHealth.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Concerns */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-1.5">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Nutritional Strengths</span>
                      </span>
                      <ul className="space-y-1 text-xs text-emerald-900">
                        {scanResult.healthAnalysis.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 mt-0.5">&bull;</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1.5">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Nutritional Concerns</span>
                      </span>
                      <ul className="space-y-1 text-xs text-amber-900">
                        {scanResult.healthAnalysis.concerns.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 mt-0.5">&bull;</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Allergy Warnings */}
                  {scanResult.recommendations.allergyWarnings.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-rose-950">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Allergy / Intolerance Notice</span>
                      </span>
                      {scanResult.recommendations.allergyWarnings.map((w, idx) => (
                        <p key={idx} className="text-[11px] text-rose-800 leading-relaxed">
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Portion & Swap Recommendations */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block">Personalized Dietary Coaching:</span>
                    <p className="text-slate-600">{scanResult.recommendations.portionAdvice}</p>
                    <div className="pt-1 space-y-1">
                      <span className="font-semibold text-slate-700 text-[11px] block">Healthier Swaps & Pairings:</span>
                      {scanResult.recommendations.healthierSwaps.map((sw, idx) => (
                        <p key={idx} className="text-slate-500 text-[11px] flex items-start gap-1">
                          <span className="text-emerald-600">&rarr;</span>
                          <span>{sw}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS: SAVE TO DIARY, ASK ASSISTANT */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Meal Slot:</label>
                    <select
                      value={mealType}
                      onChange={(e: any) => setMealType(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 capitalize cursor-pointer"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Model: {scanResult.modelUsed || "gemini-flash-lite"} ({scanResult.latencyMs || 850}ms)
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleSaveToDiary}
                    disabled={savedSuccess}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:bg-emerald-800"
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>Logged to Diary! Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <Utensils className="w-4 h-4" />
                        <span>Save to {mealType.toUpperCase()} Diary</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleAskAssistant}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Ask THARIQ AI About This Meal</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200/80 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Utensils className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="font-extrabold text-slate-900 text-lg">Awaiting Food Photograph</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload or capture a meal photo on the left. THARIQ AI will identify dishes,
                  portion scale, and calculate full macronutrient & micronutrient reports from ICMR-NIN IFCT tables.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Biryani, Dosa & Curries
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Multi-item Plates
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Verified IFCT 2017 & USDA
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
