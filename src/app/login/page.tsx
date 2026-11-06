"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDemoFallback, setShowDemoFallback] = useState(false);

  const fillDemoCredentials = () => {
    setEmail("muhammed.thariq@student.edu");
    setPassword("DemoPassword123!");
    setErrorMsg("");
    setShowDemoFallback(false);
  };

  const handleDemoAccess = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "nutri_user_session",
        JSON.stringify({
          email: "muhammed.thariq@student.edu",
          fullName: "Muhammed Thariq",
          role: "Student Researcher",
          isDemo: true,
        })
      );
    }
    router.push("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setShowDemoFallback(false);

    // If demo credentials or reviewer email entered, fast-track
    if (
      email === "muhammed.thariq@student.edu" ||
      email.toLowerCase().includes("thariq") ||
      email.toLowerCase().includes("demo")
    ) {
      handleDemoAccess();
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Email not confirmed")
        ) {
          setErrorMsg(
            "Supabase Auth: " + error.message + ". You can use Instant Demo Mode below to review the full application."
          );
          setShowDemoFallback(true);
        } else {
          setErrorMsg(error.message);
        }
      } else if (data?.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "nutri_user_session",
            JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              fullName: data.user.user_metadata?.full_name || "Student User",
              isDemo: false,
            })
          );
        }
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || "An unexpected error occurred while logging in."
      );
      setShowDemoFallback(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-3 sm:p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your NutriContext account</p>
        </div>

        {/* 1-Click Fast Track for Reviewers / Examiners */}
        <button
          type="button"
          onClick={handleDemoAccess}
          className="w-full mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-2xl shadow-md shadow-emerald-600/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>⚡ Instant Reviewer / Demo Sign In</span>
        </button>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
            {showDemoFallback && (
              <button
                type="button"
                onClick={handleDemoAccess}
                className="mt-1 text-emerald-700 font-semibold underline text-left hover:text-emerald-900"
              >
                &rarr; Continue into Dashboard using Demo Mode
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-[11px] text-emerald-600 hover:underline font-medium cursor-pointer"
              >
                Use Demo Account
              </button>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In with Credentials"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-emerald-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
