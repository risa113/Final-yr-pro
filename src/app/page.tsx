import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Camera,
  Brain,
  ShieldCheck,
  Scale,
  ArrowRight,
  Database,
  Flame,
  CheckCircle2,
  Utensils,
  Layers,
  Bot,
  Radio,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Academic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Final Year B.Tech Project – AI & Data Science</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Context-Aware AI Food &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Nutrition Assistant
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminating manual calorie counting friction through Google Gemini
            multimodal vision, backed by empirical ICMR-NIN Indian Food
            Composition Tables and personalized biometric context.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-xl mx-auto">
            <Link
              href="/assistant?mode=voice"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm"
            >
              <Radio className="w-4 h-4 animate-pulse text-emerald-200" />
              <span>Live Voice Assistant</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm transition-all text-sm"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/scanner"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm transition-all text-sm"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>AI Food Scanner</span>
            </Link>

            <Link
              href="/assistant"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-6 py-3.5 rounded-xl border border-indigo-200 transition-all text-sm"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Tarik AI Chatbot</span>
            </Link>
          </div>

          {/* Core Metrics Pill */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">100+</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">Verified Indian Dishes (IFCT)</p>
            </div>
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">Gemini AI</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">Multimodal Vision Pipeline</p>
            </div>
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">Mifflin-St Jeor</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">Validated BMR Formulation</p>
            </div>
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xl sm:text-2xl font-bold text-indigo-600">PostgreSQL RLS</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">Multi-Tenant Data Privacy</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY THIS MATTERS - THE 3-STAGE ARCHITECTURAL PIPELINE */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              The Scientific Engineering Principle
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
              Why We Decouple AI Vision from Calorie Calculation
            </p>
            <p className="mt-4 text-base text-slate-600">
              Generic LLMs hallucinate nutritional numbers when asked directly. Our architecture enforces a rigorous 3-stage validation pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Multimodal Identification</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Google Gemini analyzes food morphology, identifying dishes (e.g. Masala Dosa, Chicken Biryani) and estimating visible portion size with qualitative uncertainty.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">User Confirmation</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                The user reviews the detected dish and adjusts the portion weight in grams. 2D photos cannot detect density or hidden fats; honest confirmation prevents errors.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Empirical Laboratory Lookup</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Nutrient totals are queried deterministically from ICMR-NIN IFCT tables or USDA FoodData Central and scaled strictly to the confirmed weight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              End-to-End Capabilities
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
              Engineered for Real Daily Nutrition Management
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">AI Food Scanner</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Snap or upload food images to instantly identify dishes, visible ingredients, and portion weights with confidence scores.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">ICMR-NIN IFCT Database</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Verified nutritional profiles for South and North Indian dishes: Idli, Dosa, Sambar, Parotta, Biryani, Curd Rice, and more.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Context-Aware AI Chat</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Conversational assistant that checks what you already ate today and strictly respects your allergy and dietary preferences.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Mifflin-St Jeor Energy Formulation</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Calculates BMR and TDEE based on biometrics, activity multipliers, and fitness objectives (loss, maintenance, muscle gain).
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Utensils className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Daily Multi-Meal Diary</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Chronologically organize Breakfast, Lunch, Dinner, and Snacks with real-time calorie and macronutrient summation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">PostgreSQL Row Level Security</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Guarantees complete multi-tenant isolation. Your dietary and health logs are accessible only to your authenticated session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">NutriContext AI</span>
            <span>&bull;</span>
            <span>Final Year B.Tech Project (Artificial Intelligence & Data Science)</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-emerald-600 font-medium">Dashboard</Link>
            <Link href="/scanner" className="hover:text-emerald-600 font-medium">Scanner</Link>
            <Link href="/foods" className="hover:text-emerald-600 font-medium">Food Database</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
