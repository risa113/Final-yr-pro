# ENVIRONMENT SETUP GUIDE
## Context-Aware AI Food and Nutrition Assistant

This project is built using **Next.js 15+ App Router**, **TypeScript**, **Tailwind CSS**, **Supabase PostgreSQL**, **Google Gemini API**, and **USDA FoodData Central API**.

---

## 1. Prerequisites
- **Node.js**: v18.18.0 or newer (v24.x supported).
- **npm**: v9.0.0 or newer.
- **Git**: Installed and configured.

---

## 2. Environment Variables Overview

Create a `.env.local` file in the project root based on `.env.example`.

| Variable Name | Required | Purpose | Where to Get |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project REST Endpoint | Supabase Dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Public Anonymous Client Key | Supabase Dashboard -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Administrative Backend Key | Supabase Dashboard -> Project Settings -> API (Keep Private!) |
| `GEMINI_API_KEY` | Yes | Google Gemini 2.5 Flash Vision & AI SDK | Google AI Studio (https://aistudio.google.com/app/apikey) |
| `USDA_API_KEY` | Optional | USDA FoodData Central REST API Key | USDA FDC (https://fdc.nal.usda.gov/api-key-signup.html) |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for redirects and authentication | `http://localhost:3000` for local dev |

---

## 3. Step-by-Step Setup Instructions

### 3.1 Supabase Configuration
1. Go to [https://supabase.com](https://supabase.com) and create a free project named `nutrition-assistant`.
2. Once the project finishes provisioning, navigate to the **SQL Editor** on the left menu.
3. Open `DATABASE_SCHEMA.md` or `supabase/schema.sql` from this repository.
4. Copy the complete DDL script and paste it into the Supabase SQL Editor.
5. Click **Run**. All 14 tables, constraints, foreign keys, indexes, and Row Level Security (RLS) policies will be created.
6. Enable Email Authentication under **Authentication -> Providers -> Email**:
   - Turn "Confirm email" OFF for easy local development testing, or leave it ON if using real verification emails.
7. Under **Project Settings -> API**, copy:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY`

### 3.2 Google Gemini API Configuration
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key**.
4. Copy the generated key and assign it to `GEMINI_API_KEY` in `.env.local`.

### 3.3 USDA FoodData Central (Optional but Recommended)
1. Visit [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html).
2. Enter your name and email to receive a free API key immediately.
3. If omitted, the application uses the built-in ICMR-NIN IFCT database and Open Food Facts with graceful fallback.

---

## 4. Local Execution
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 5. Production Build Verification
To ensure everything compiles without TypeScript or linting errors:
```bash
npm run build
```
