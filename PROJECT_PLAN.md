# PROJECT PLAN
## Context-Aware AI Food and Nutrition Assistant
**Final Year B.Tech Project – Artificial Intelligence and Data Science**

---

## 1. Executive Summary
The **Context-Aware AI Food and Nutrition Assistant** is an end-to-end, full-stack intelligent nutrition platform designed to bridge the gap between static calorie counting applications and real-world dietary dynamics. Unlike traditional nutrition trackers that burden users with tedious manual search and generic caloric formulas, this system:
1. Recognizes food items, ingredients, and portion sizes from uploaded food imagery using the **Google Gemini Multimodal API**.
2. Retrieves verified, empirical nutritional data from authoritative databases (**USDA FoodData Central**, **Open Food Facts**, and **ICMR-NIN Indian Food Composition Tables [IFCT]**).
3. Adapts all recommendations to the user's personal context (age, biometrics, Basal Metabolic Rate [BMR], Total Daily Energy Expenditure [TDEE], cultural cuisine preferences, allergies, and daily remaining nutrient allowance).
4. Provides a conversational AI nutritionist capable of answering queries based on real database records rather than hallucinations.

---

## 2. Core Project Objectives
- **Multimodal AI Recognition**: Separate visual recognition (Gemini) from empirical nutrient calculation (USDA / ICMR-NIN / Open Food Facts) to prevent AI calorie hallucinations.
- **Context-Aware Personalization**: Continuously compute user macro and micronutrient targets using Mifflin-St Jeor BMR and physical activity coefficients.
- **Robust Relational Data Modeling**: Implement PostgreSQL Row Level Security (RLS) on Supabase ensuring complete multi-tenant privacy.
- **Comprehensive Food Diary & Analytics**: Enable users to log meals by breakfast, lunch, dinner, and snacks, tracking real-time intake versus daily targets via interactive Recharts visualizations.
- **Smart Meal Planner**: Generate allergy-safe, culturally aligned, and macro-balanced meal recommendations.
- **Academic Rigor & Review Preparedness**: Maintain complete documentation, mathematical formulations, and viva explanations for university project evaluations.

---

## 3. Work Breakdown Structure (WBS)

### Phase 1: Foundation & Architecture Setup
- [x] Workspace inspection and environment verification (Node.js, Git, TypeScript).
- [x] Next.js 15+ App Router initialization with Tailwind CSS v4.
- [x] Dependency installation (Supabase SSR, Google GenAI SDK, Recharts, Lucide Icons, Zod).
- [x] Comprehensive documentation creation (`PROJECT_PLAN.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_DOCUMENTATION.md`, `ENVIRONMENT_SETUP.md`, `TASK_TRACKER.md`).

### Phase 2: Database & Backend Architecture
- [ ] Supabase PostgreSQL schema with 14 normalized tables.
- [ ] Row Level Security (RLS) policies for user data isolation.
- [ ] Supabase Auth SSR middleware and session management.
- [ ] Client & Server Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`).

### Phase 3: Nutrition Engine & Data Sources
- [ ] BMR (Mifflin-St Jeor) and TDEE calculation engine (`src/lib/nutrition/calculator.ts`).
- [ ] Verified Indian Food Composition database (ICMR-NIN IFCT dataset) embedded with 100+ staples (Idli, Dosa, Biryani, Dal, Roti, Sambar, etc.).
- [ ] USDA FoodData Central REST API client (`src/lib/nutrition/usda.ts`).
- [ ] Open Food Facts API client for packaged food barcodes (`src/lib/nutrition/openfoodfacts.ts`).
- [ ] Unified multi-source food search and retrieval service (`src/lib/nutrition/food-service.ts`).

### Phase 4: Gemini Multimodal Food Scanner
- [ ] Image upload validation and preprocessing (`src/lib/ai/gemini.ts`).
- [ ] Structured prompt engineering with JSON schema enforcement.
- [ ] Separation of identification/portion estimation from empirical nutrient lookup.
- [ ] User confirmation workflow (allow users to adjust detected serving size or correct item).

### Phase 5: UI/UX & Core Pages
- [ ] Modern health-tech design system with emerald/teal/slate palette.
- [ ] Landing page (`/`), Login (`/login`), Register (`/register`), Forgot Password (`/forgot-password`).
- [ ] Interactive Onboarding / Health Profile setup (`/onboarding`).
- [ ] Central Health & Nutrition Dashboard (`/dashboard`).
- [ ] AI Food Scanner (`/scanner`).
- [ ] Food Search & Database Explorer (`/foods`).
- [ ] Daily Food Diary & Meal Logger (`/diary`).
- [ ] Smart AI Meal Planner (`/meal-planner`).
- [ ] Context-Aware AI Chat Assistant (`/assistant`).
- [ ] Progress & Nutrient Analytics (`/analytics`).
- [ ] User Settings & Preferences (`/settings`).

### Phase 6: Testing, Hardening & Academic Viva Prep
- [ ] TypeScript strict compilation checks.
- [ ] API integration tests and mock safety fallback.
- [ ] Error boundary handling for missing API keys.
- [ ] Production build verification (`npm run build`).
- [ ] 30+ Viva Voce questions and detailed answers (`REVIEW_VIVA_QUESTIONS.md`).
- [ ] Slide deck outline for Monday project review (`REVIEW_PRESENTATION.md`).

---

## 4. Milestone Schedule for Monday Review

| Milestone | Target Completion | Status |
| :--- | :--- | :--- |
| **M1: Architecture, Documentation & Schema** | Day 1 Morning | Completed |
| **M2: Database, Auth & Calculation Engine** | Day 1 Afternoon | In Progress |
| **M3: Nutrition APIs & Food Scanner** | Day 1 Evening | Upcoming |
| **M4: Diary, Analytics & AI Chat Assistant** | Day 2 Morning | Upcoming |
| **M5: UI Polish, Build Verification & Viva Prep** | Day 2 Afternoon | Upcoming |
