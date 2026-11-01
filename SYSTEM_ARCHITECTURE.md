# SYSTEM ARCHITECTURE
## Context-Aware AI Food and Nutrition Assistant

---

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  Next.js 15+ App Router, React 19, TypeScript, Tailwind CSS, Recharts, Lucide UI  |
+-----------------------------------------+-----------------------------------------+
                                          |
                      (HTTPS / REST / Server Actions)
                                          |
+-----------------------------------------v-----------------------------------------+
|                                APPLICATION LAYER                                  |
|                            Next.js Route Handlers                                 |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | /api/food-scan     |  | /api/foods/search    |  | /api/assistant/chat       |  |
|  | Multi-modal AI     |  | USDA / ICMR-NIN      |  | Context-Aware RAG         |  |
|  +---------+----------+  +----------+-----------+  +-------------+-------------+  |
|            |                        |                            |                |
|  +---------v------------------------v----------------------------v-------------+  |
|  |                        BUSINESS LOGIC SERVICES                              |  |
|  |  * Gemini Multimodal Engine        * Mifflin-St Jeor Nutrition Engine      |  |
|  |  * ICMR-NIN IFCT Nutrition Service * Open Food Facts Service                |  |
|  |  * Context Formulator Service      * USDA FoodData Central Client           |  |
|  +----------------------------------+------------------------------------------+  |
+-------------------------------------+---------------------------------------------+
                                      |
                     (Postgres RLS / HTTPS API Calls)
                                      |
+-------------------------------------v---------------------------------------------+
|                                EXTERNAL SERVICES                                  |
|                                                                                   |
|  +----------------------+   +-----------------------+   +----------------------+  |
|  |  Supabase Platform   |   |   Google Gemini API   |   | USDA FoodData        |  |
|  |  * Postgres (RLS)    |   |   * Gemini 2.5 Flash  |   | Open Food Facts      |  |
|  |  * GoTrue Auth       |   |   * Structured Vision |   | ICMR-NIN IFCT Data   |  |
|  |  * Storage Buckets   |   |   * Conversational AI |   | Nutrition Databases  |  |
|  +----------------------+   +-----------------------+   +----------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Multimodal Food Recognition Subsystem
- **Principle of Separation**: Computer Vision and Large Language Models are probabilistic and cannot directly weigh food or determine chemical composition from pixels.
- **Workflow**:
  1. Image upload validation (MIME type check: `image/jpeg`, `image/png`, `image/webp`; max size: 5MB).
  2. Gemini Multimodal API processes the image with structured JSON output enforcing:
     - Primary detected food dish name and alternative candidates.
     - Visible ingredients list.
     - Visual portion estimation with qualitative uncertainty indicators (e.g., standard bowl, piece, cup, slice).
  3. User Confirmation Interface: The detected dish and estimated weight in grams are presented to the user for one-click verification or manual adjustment.
  4. Empirical Nutrition Fetching: Upon user confirmation, nutrient densities (calories, protein, carbs, fat, fiber per 100g) are queried from empirical database tables (ICMR-NIN IFCT or USDA FoodData Central).
  5. Proportional Calculation: Final nutrients = `(Nutrient_per_100g * Confirmed_Weight_g) / 100`.

### 2.2 Context-Aware Recommendation Engine
- **Profile Context**: Age, biological sex, height, weight, activity level (Sedentary, Lightly Active, Moderately Active, Very Active, Extra Active).
- **Mathematical Formulations**:
  - **Mifflin-St Jeor Equation**:
    $$\text{BMR}_{\text{male}} = 10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} + 5$$
    $$\text{BMR}_{\text{female}} = 10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} - 161$$
  - **TDEE (Total Daily Energy Expenditure)**:
    $$\text{TDEE} = \text{BMR} \times \text{Activity Multiplier}$$
  - **Target Calorie Adjustments**:
    - Weight Loss: $\text{TDEE} - 500 \text{ kcal/day}$
    - Weight Gain: $\text{TDEE} + 400 \text{ kcal/day}$
    - Maintenance: $\text{TDEE}$
  - **Macronutrient Distribution**:
    - Protein: $1.6 - 2.0\text{g/kg}$ for fitness, $1.0 - 1.2\text{g/kg}$ standard.
    - Fat: $25-30\%$ of total calories ($9\text{ kcal/g}$).
    - Carbohydrates: Remaining calories divided by $4\text{ kcal/g}$.
- **Dynamic Context Injection**: Every query to the conversational AI retrieves the user's active daily log, remaining calories, allergens, and dietary preference (vegetarian, vegan, non-vegetarian, eggetarian, keto) before issuing prompt instructions to Gemini.

### 2.3 Empirical Nutrition Data Layer
- **ICMR-NIN IFCT 2017**: Built-in, high-precision dataset covering Indian staple foods (Idli, Dosa, Sambar, Rasam, Paneer Butter Masala, Roti, Chicken Biryani, Dal Makhani, Pongal, Upma, etc.) ensuring verified nutrient profiles without foreign database misalignments.
- **USDA FoodData Central API**: Secondary empirical fallback for global whole foods, western recipes, and commercial raw ingredients.
- **Open Food Facts API**: Dedicated barcode lookup service querying packaged grocery items via global GTIN/EAN barcodes.

### 2.4 Multi-Tenant Database & Security Subsystem
- **PostgreSQL Row Level Security (RLS)**: Enforces that every SELECT, INSERT, UPDATE, DELETE query matches `auth.uid() = user_id`.
- **Zero Client-Side Secret Leakage**: All API keys (`GEMINI_API_KEY`, `USDA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are restricted to Next.js server-side route handlers.
- **SSR Cookie Sessions**: Supabase GoTrue tokens are stored in secure HTTP-only cookies managed via `@supabase/ssr`.
