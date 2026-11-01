"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Flame,
  Award,
  Calendar,
  Scale,
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  // Calorie trend data
  const calorieTrend = [
    { date: "Oct 26", calories: 2320, target: 2450 },
    { date: "Oct 27", calories: 2410, target: 2450 },
    { date: "Oct 28", calories: 2200, target: 2450 },
    { date: "Oct 29", calories: 2490, target: 2450 },
    { date: "Oct 30", calories: 2380, target: 2450 },
    { date: "Oct 31", calories: 2520, target: 2450 },
    { date: "Nov 01", calories: 2400, target: 2450 },
  ];

  // Macronutrient distribution data
  const macroData = [
    { name: "Carbohydrates (55%)", value: 55, color: "#14b8a6" },
    { name: "Protein (22%)", value: 22, color: "#059669" },
    { name: "Fat (23%)", value: 23, color: "#f59e0b" },
  ];

  // Weight progression data
  const weightData = [
    { week: "Week 1", weight: 72.4 },
    { week: "Week 2", weight: 71.8 },
    { week: "Week 3", weight: 71.1 },
    { week: "Week 4", weight: 70.0 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Empirical Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Nutrition & Biometric Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualizing longitudinal caloric consistency, macro distribution ratios, and weight progression.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeRange("7d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeRange === "7d"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeRange === "30d"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* SUMMARY STATS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Daily Intake</span>
            <Flame className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">2,388</p>
          <span className="text-[11px] text-emerald-600 font-semibold">97.4% adherence</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Protein Consistency</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">128g</p>
          <span className="text-[11px] text-slate-500">Target: 135g / day</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Weight Change</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">-2.4 kg</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Healthy linear rate</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Logging Streak</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">7 Days</p>
          <span className="text-[11px] text-amber-600 font-semibold">Active consistency</span>
        </div>
      </div>

      {/* CHARTS ROW 1: 7-DAY CALORIES & MACRO DONUT */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calorie Trend Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Calorie Consumption vs Target Ceiling</span>
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Daily intake (bars) compared against your calculated 2,450 kcal TDEE threshold.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calorieTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
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

        {/* Macro Distribution Donut (1 Col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Macronutrient Ratio</h2>
            <p className="text-xs text-slate-500 mb-4">Ratio of Carbs, Protein, and Fat.</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-slate-100 text-xs">
            {macroData.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: m.color }}
                  ></span>
                  <span>{m.name.split(" ")[0]}</span>
                </span>
                <span className="font-bold text-slate-900">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: WEIGHT PROGRESSION LINE */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-600" />
          <span>Biometric Weight Progression (kg)</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Logged weigh-ins demonstrating gradual metabolic response.
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
