"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Camera,
  BookOpen,
  Search,
  Bot,
  CalendarDays,
  BarChart3,
  User,
  Settings,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/dashboard", icon: Flame },
    { label: "AI Food Scanner", href: "/scanner", icon: Camera, badge: "AI" },
    { label: "Food Diary", href: "/diary", icon: BookOpen },
    { label: "Food Search", href: "/foods", icon: Search },
    { label: "Tarik AI Chatbot", href: "/assistant", icon: Bot, badge: "AI" },
    { label: "Meal Planner", href: "/meal-planner", icon: CalendarDays },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "User Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/10 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      link.badge === "AI"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Database Badge */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Nutrition</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Nutritional values backed by ICMR-NIN IFCT 2017 & USDA FoodData Central.
          </p>
        </div>
      </div>

      {/* User Card */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">Arun Kumar</p>
            <p className="text-[11px] text-slate-500 truncate">B.Tech AI & DS</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
