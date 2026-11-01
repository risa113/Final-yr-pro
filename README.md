# Context-Aware AI Food and Nutrition Assistant
### B.Tech Final Year Capstone Project (AI & Data Science)

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-orange?logo=google)](https://aistudio.google.com/)

---

## 🌟 Overview
The **Context-Aware AI Food and Nutrition Assistant** is an intelligent, full-stack nutrition platform engineered to eliminate manual calorie tracking friction through multimodal AI while maintaining empirical scientific accuracy.

Unlike generic calorie counters or pure LLM wrappers that hallucinate nutritional values, this system implements a strict **two-stage architecture**:
1. **Multimodal Visual Intelligence (Google Gemini)** identifies dishes, visible ingredients, and estimates visual portions with qualitative uncertainty indicators.
2. **Deterministic Empirical Retrieval (ICMR-NIN IFCT & USDA FoodData Central)** fetches laboratory-measured nutritional density per 100g and computes precise macronutrient totals proportionally to the user-confirmed serving weight.
3. **Dynamic Context Engine** personalizes recommendations in real-time based on the user's age, biometrics (Mifflin-St Jeor BMR/TDEE), dietary preferences, allergies, and intra-day remaining calorie/macronutrient allowances.

---

## 🚀 Key Features
- **Multimodal AI Food Scanner**: Upload a meal photo to automatically detect Indian & international dishes, detect ingredients, and estimate portion sizes.
- **Empirical Nutrition Engine**: 100+ verified Indian staple foods (ICMR-NIN IFCT 2017) + USDA FoodData Central integration + Open Food Facts packaged goods lookup.
- **Context-Aware Conversational AI**: A Retrieval-Augmented Generation (RAG) assistant that reads the user's live daily food logs before offering personalized dietary advice.
- **Comprehensive Daily Food Diary**: Log meals across Breakfast, Lunch, Dinner, and Snacks with instant macronutrient summation.
- **Interactive Analytics**: Visual 7-day caloric intake trends, macronutrient ratio breakdowns, and goal tracking built with Recharts.
- **Smart Meal Planner**: Generate personalized daily and weekly meal plans filtered strictly by allergies and dietary preferences.
- **Production-Grade Security**: PostgreSQL Row Level Security (RLS) policies guaranteeing multi-tenant privacy, with zero client-side secret exposure.

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend**: Next.js Route Handlers, Server Actions, Zod validation.
- **Database & Auth**: PostgreSQL 15+ on Supabase with Row Level Security (RLS) & GoTrue JWT authentication.
- **Artificial Intelligence**: Google Gemini 2.5 Flash (`@google/genai` SDK) with structured JSON Schema output.
- **Nutrition References**: ICMR-NIN Indian Food Composition Tables (IFCT 2017), USDA FoodData Central API, Open Food Facts API v2.

---

## 📂 Project Structure
```
final-yr-pro/
├── src/
│   ├── app/                      # Next.js App Router Pages and APIs
│   │   ├── (auth)/               # Login, Register, Forgot Password
│   │   ├── (dashboard)/          # Dashboard, Scanner, Diary, Assistant, Analytics
│   │   ├── api/                  # Backend REST API Routes
│   │   ├── globals.css           # Tailwind v4 Styles & Design Tokens
│   │   └── layout.tsx            # Root Application Layout
│   ├── components/               # Modular UI Components & Widgets
│   │   ├── ui/                   # Reusable UI Primitives (Button, Card, Modal, etc.)
│   │   ├── navigation/           # Sidebar, Navbar, Mobile Menu
│   │   ├── scanner/              # AI Food Scanner & Confirmation Modal
│   │   ├── diary/                # Meal Logging & Daily Tracker Widgets
│   │   ├── analytics/            # Recharts Visualizations
│   │   └── assistant/            # Context-Aware Chat Window
│   └── lib/                      # Core Business Logic & External Adapters
│       ├── ai/                   # Gemini Multimodal API Client & Prompts
│       ├── nutrition/            # BMR/TDEE Calculator & IFCT/USDA Services
│       ├── supabase/             # Client, Server, and Middleware DB Helpers
│       └── utils.ts              # Formatting & Helper Utilities
├── supabase/
│   └── schema.sql                # Complete 14-Table PostgreSQL DDL with RLS
├── PROJECT_PLAN.md               # Detailed Project Plan & Milestones
├── SYSTEM_ARCHITECTURE.md        # Architecture, Data Flow & System Diagrams
├── DATABASE_SCHEMA.md            # Detailed Schema Documentation & DDL
├── API_DOCUMENTATION.md          # Full REST Endpoints Specification
├── ENVIRONMENT_SETUP.md          # Setup Instructions for Supabase & Gemini
├── REVIEW_PRESENTATION.md        # Slide-by-Slide First Review Script
├── REVIEW_VIVA_QUESTIONS.md      # 30+ Viva Voce Questions & Detailed Answers
├── TASK_TRACKER.md               # Live Development Task Tracker
└── .env.example                  # Environment Variables Template
```

---

## ⚡ Quick Start
See [ENVIRONMENT_SETUP.md](file:///d:/final-yr-pro/ENVIRONMENT_SETUP.md) for full setup instructions.
```bash
# 1. Clone & install dependencies
git clone https://github.com/your-username/final-yr-pro.git
cd final-yr-pro
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Add your Supabase and Gemini keys in .env.local

# 3. Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📜 Academic Attribution & References
- **National Institute of Nutrition (ICMR-NIN)**: *Indian Food Composition Tables (IFCT)*, 2017.
- **U.S. Department of Agriculture (USDA)**: *Agricultural Research Service, FoodData Central*, 2024.
- **Open Food Facts**: Open-source database of packaged food products worldwide.
- **Mifflin, M. D., et al.**: "A new predictive equation for resting energy expenditure in healthy individuals." *The American Journal of Clinical Nutrition*, 1990.
