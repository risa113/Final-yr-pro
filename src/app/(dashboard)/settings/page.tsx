"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  HeartPulse,
  Flame,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Save,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import {
  calculateDailyTargets,
  type Gender,
  type ActivityLevel,
  type GoalType,
} from "@/lib/nutrition/calculator";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("Muhammed Thariq");
  const [email, setEmail] = useState("muhammed.thariq@student.edu");
  const [age, setAge] = useState(22);
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderately_active");
  const [goalType, setGoalType] = useState<GoalType>("maintenance");
  const [dietaryType, setDietaryType] = useState("vegetarian");
  const [allergies, setAllergies] = useState<string[]>(["Peanuts"]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Recalculate targets dynamically
  const liveTargets = calculateDailyTargets({
    age,
    gender,
    heightCm,
    weightKg,
    activityLevel,
    goalType,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          age,
          gender,
          heightCm,
          weightKg,
          activityLevel,
          goalType,
          dietaryType,
          allergies,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Settings className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile & Parameters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account & Context Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Update your physical measurements and dietary rules. Targets recalculate instantly.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile biometrics and daily caloric targets successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Account Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Identity & Credentials</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Physical Biometrics */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>Biometrics & Energy Formulation</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sex</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
              >
                <option value="sedentary">Sedentary (1.2x)</option>
                <option value="lightly_active">Lightly Active (1.375x)</option>
                <option value="moderately_active">Moderately Active (1.55x)</option>
                <option value="very_active">Very Active (1.725x)</option>
                <option value="extra_active">Extra Active (1.9x)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Goal</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
              >
                <option value="maintenance">Maintenance</option>
                <option value="weight_loss">Weight Loss (-500 kcal)</option>
                <option value="weight_gain">Weight Gain (+400 kcal)</option>
                <option value="muscle_building">Muscle Building (+250 kcal)</option>
              </select>
            </div>
          </div>

          {/* Live computed banner */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs mt-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Computed Target</span>
              <span className="text-xl font-extrabold text-emerald-400">{liveTargets.targetCalories} kcal/day</span>
            </div>
            <div className="flex gap-4 text-slate-300">
              <span>BMR: <strong>{liveTargets.bmr}</strong></span>
              <span>TDEE: <strong>{liveTargets.tdee}</strong></span>
              <span>Protein: <strong>{liveTargets.targetProteinG}g</strong></span>
              <span>Carbs: <strong>{liveTargets.targetCarbsG}g</strong></span>
            </div>
          </div>
        </div>

        {/* 3. Dietary Safety */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dietary Pattern & Allergens</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Dietary Pattern</label>
            <select
              value={dietaryType}
              onChange={(e) => setDietaryType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none capitalize"
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="omnivore">Omnivore</option>
              <option value="eggetarian">Eggetarian</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
        </button>
      </form>
    </div>
  );
}
