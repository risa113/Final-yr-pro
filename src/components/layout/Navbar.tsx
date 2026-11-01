"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Camera,
  BookOpen,
  CalendarDays,
  Bot,
  BarChart3,
  Search,
  User,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Flame,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on landing or auth pages, render minimal public navbar
  const isAuthOrLanding =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  if (isAuthOrLanding) {
    return (
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">NutriContext</span>
              <span className="text-[10px] block font-semibold text-emerald-600 uppercase tracking-wider">AI Nutrition Platform</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/#features" className="hover:text-emerald-600 transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</Link>
            <Link href="/#nutrition-science" className="hover:text-emerald-600 transition-colors">Science & IFCT</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-sm transition-all shadow-emerald-600/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base hidden sm:inline">NutriContext AI</span>
          </Link>
        </div>

        {/* Center: Quick Action Food Scanner */}
        <div className="flex items-center gap-2">
          <Link
            href="/scanner"
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Food Scan</span>
          </Link>

          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors hidden sm:inline-flex"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Nutritionist</span>
          </Link>
        </div>

        {/* Right: Quick Links & Profile */}
        <div className="flex items-center gap-3">
          <Link
            href="/foods"
            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Search Foods"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-2 p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center">
              AK
            </div>
            <span className="text-xs font-medium hidden md:inline">Arun Kumar</span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/dashboard" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Flame className="w-4 h-4 text-emerald-600" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/scanner"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/scanner" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>AI Scanner</span>
          </Link>
          <Link
            href="/diary"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/diary" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Food Diary</span>
          </Link>
          <Link
            href="/foods"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/foods" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Food Search</span>
          </Link>
          <Link
            href="/assistant"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/assistant" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>AI Assistant</span>
          </Link>
          <Link
            href="/meal-planner"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/meal-planner" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>Meal Planner</span>
          </Link>
          <Link
            href="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/analytics" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Analytics</span>
          </Link>
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/settings" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </header>
  );
}
