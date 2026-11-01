"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, KeyRound, ExternalLink } from "lucide-react";

interface StatusBannerProps {
  hasGeminiKey?: boolean;
  hasSupabase?: boolean;
  hasUsdaKey?: boolean;
}

export function StatusBanner({
  hasGeminiKey = false,
  hasSupabase = false,
  hasUsdaKey = false,
}: StatusBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const missingKeys = [];
  if (!hasGeminiKey) missingKeys.push("Google Gemini API (Vision & Assistant)");
  if (!hasSupabase) missingKeys.push("Supabase (PostgreSQL & Auth)");
  if (!hasUsdaKey) missingKeys.push("USDA FoodData API (Optional)");

  if (hasGeminiKey && hasSupabase) {
    return null; // All core services active!
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong className="font-semibold">Setup Notice:</strong> {missingKeys.length} external service{missingKeys.length > 1 ? "s are" : " is"} not connected in <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code>. Independent features (BMR/TDEE calculations, ICMR-NIN Indian food database, UI simulation) are active.
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 font-medium text-amber-800 hover:text-amber-950 ml-3 underline cursor-pointer"
        >
          <span>{isExpanded ? "Hide Details" : "View Setup Guide"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-amber-200/60 grid sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between font-semibold text-xs text-slate-800 mb-1">
              <span>Google Gemini API</span>
              {hasGeminiKey ? (
                <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
              ) : (
                <span className="text-amber-600 flex items-center gap-0.5"><KeyRound className="w-3.5 h-3.5" /> Needed</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mb-2">Required for AI Food Image Recognition and Context-Aware Chat Assistant.</p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
            >
              Get Free Gemini Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between font-semibold text-xs text-slate-800 mb-1">
              <span>Supabase PostgreSQL</span>
              {hasSupabase ? (
                <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
              ) : (
                <span className="text-amber-600 flex items-center gap-0.5"><KeyRound className="w-3.5 h-3.5" /> Needed</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mb-2">Required for real database persistence, user authentication, and RLS policies.</p>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
            >
              Create Free Project <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between font-semibold text-xs text-slate-800 mb-1">
              <span>USDA FoodData Central</span>
              {hasUsdaKey ? (
                <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
              ) : (
                <span className="text-slate-500">Optional Fallback</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mb-2">Built-in ICMR-NIN IFCT dataset is already active. USDA expands western food search.</p>
            <a
              href="https://fdc.nal.usda.gov/api-key-signup.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
