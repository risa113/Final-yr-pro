"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Camera,
  Bot,
  BookOpen,
  Search,
  Settings,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  // Hide mobile nav on landing and pure auth screens
  const isAuthOrLanding =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/onboarding";

  if (isAuthOrLanding) return null;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Flame },
    { label: "Food Diary", href: "/diary", icon: BookOpen },
    {
      label: "AI Scan",
      href: "/scanner",
      icon: Camera,
      isPrimary: true,
    },
    { label: "Tarik AI", href: "/assistant", icon: Bot },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href === "/assistant" && pathname.startsWith("/assistant"));

        if (item.isPrimary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center -mt-4 group relative"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-100"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 mt-1">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive
                ? "text-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
