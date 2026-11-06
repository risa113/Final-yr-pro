import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { getDefaultGeminiApiKey } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tarik AI Nutrition Chatbot – Context-Aware AI Food & Nutrition Platform",
  description:
    "Fast, intelligent AI nutrition platform combining real-time multimodal food recognition with empirical ICMR-NIN IFCT & USDA databases and personalized context awareness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasGemini = Boolean(
    getDefaultGeminiApiKey() && getDefaultGeminiApiKey() !== "AIzaSy..."
  );
  const hasSupabase = Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qulrphvenonbrglgqrsf.supabase.co") &&
      !(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qulrphvenonbrglgqrsf.supabase.co").includes("placeholder") &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        "sb_publishable_gcvsN2kBx1t5bObvnCVvrA_3h946OXr")
  );
  const hasUsda = Boolean(
    (process.env.USDA_API_KEY && process.env.USDA_API_KEY !== "DEMO_KEY") || true
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <StatusBanner
          hasGeminiKey={hasGemini}
          hasSupabase={hasSupabase}
          hasUsdaKey={hasUsda}
        />
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
