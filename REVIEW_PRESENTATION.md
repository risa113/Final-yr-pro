# FIRST PROJECT REVIEW PRESENTATION OUTLINE
## Context-Aware AI Food and Nutrition Assistant
**Department of Artificial Intelligence and Data Science**

---

### Slide 1: Title Slide
- **Project Title**: Context-Aware AI Food and Nutrition Assistant
- **Domain**: Multimodal AI, Natural Language Processing, Full-Stack Health-Tech
- **Student Name & Register Number**: [Your Name & Reg No.]
- **Supervisor / Guide**: [Guide Name & Designation]
- **Department**: Artificial Intelligence and Data Science

---

### Slide 2: Problem Statement & Motivation
- **The Challenge**: Obesity, diabetes, and metabolic disorders are rising globally, particularly in India.
- **Flaws in Existing Systems**:
  - Manual food entry in apps like MyFitnessPal has high drop-off rates (over 60% within 2 weeks).
  - Western databases do not accurately capture diverse regional cuisines (e.g., South/North Indian cooked foods).
  - Calorie recommendations are static and do not consider what the user has eaten earlier in the day or their cultural context.
  - Generative AI tools (ChatGPT) hallucinate arbitrary calorie numbers when asked about pictures.
- **The Solution**: An intelligent assistant that identifies dishes from photos, fetches verified empirical data from ICMR-NIN/USDA, and delivers contextual recommendations based on real-time intake.

---

### Slide 3: Project Objectives
1. **Multimodal Recognition**: Automated food dish and ingredient recognition from smartphone photographs via Google Gemini.
2. **Empirical Nutrition Verification**: Decouple visual recognition from nutrient calculations by querying verified scientific databases (ICMR-NIN IFCT 2017 & USDA FoodData Central).
3. **Context-Aware Dynamic Personalization**: Formulate daily caloric and macronutrient targets using Mifflin-St Jeor BMR and activity multipliers.
4. **Interactive Food Diary & Analytics**: Real-time logging of meals with visual progress tracking via interactive charts.
5. **Conversational AI Nutritionist**: RAG-powered chatbot that reads the user's live daily food logs before offering tailored dietary advice.

---

### Slide 4: Literature Survey Summary
| Paper / System | Approach | Limitations | Our Proposed Advantage |
| :--- | :--- | :--- | :--- |
| **Traditional Trackers (MyFitnessPal)** | Keyword text search in crowdsourced databases | High friction, inaccurate user-submitted entries | One-click multimodal photo scanner + ICMR-NIN verified dataset |
| **Pure LLM Prompts (ChatGPT-4V)** | Direct image-to-calories zero-shot generation | Severe hallucinations on portion weights and macro counts | Strict decoupling: AI identifies food, verified database retrieves nutrients |
| **Static Nutrition Calculators** | Fixed caloric budgets | Ignores daily eating dynamics and intra-day deficits | Real-time RAG context injection into conversational agent |

---

### Slide 5: System Architecture
*(Present the architectural diagram from `SYSTEM_ARCHITECTURE.md`)*
- **Frontend Layer**: Next.js 15+ App Router, React 19, TypeScript, Tailwind CSS, Recharts.
- **Application / API Layer**: Secure Next.js Server Route Handlers implementing authentication checks, Zod validation, and business logic.
- **AI & Data Layer**:
  - Google Gemini 2.5 Flash for multimodal vision and natural language reasoning.
  - ICMR-NIN IFCT 2017 & USDA FoodData Central & Open Food Facts APIs.
  - Supabase PostgreSQL with Row Level Security (RLS) for multi-tenant data isolation.

---

### Slide 6: Mathematical Formulations
- **Basal Metabolic Rate (BMR) - Mifflin-St Jeor**:
  $$\text{BMR} = 10 \times \text{Weight (kg)} + 6.25 \times \text{Height (cm)} - 5 \times \text{Age (yr)} + s \quad (s = +5 \text{ for M}, -161 \text{ for F})$$
- **Total Daily Energy Expenditure (TDEE)**:
  $$\text{TDEE} = \text{BMR} \times \text{Activity Multiplier} \quad (1.2 \text{ to } 1.9)$$
- **Proportional Nutrient Calculation**:
  $$\text{Nutrient}_{\text{actual}} = \frac{\text{Nutrient}_{\text{per 100g}} \times \text{Confirmed Weight (g)}}{100}$$

---

### Slide 7: Database Design & Security
- **14 Normalized Relational Tables**: `profiles`, `dietary_preferences`, `food_items`, `nutrition_records`, `meals`, `meal_items`, `food_scans`, `daily_nutrition_summaries`, `nutrition_goals`, `weight_logs`, `meal_plans`, `meal_plan_items`, `chat_conversations`, `chat_messages`.
- **Row Level Security (RLS)**: Cryptographically guarantees that users cannot read or modify another user's private dietary logs.
- **Server-Side Secret Management**: Zero client-side leakage of API tokens.

---

### Slide 8: Key Features & Demonstration Walkthrough
1. **User Onboarding**: Collects biometrics, dietary preferences (vegetarian, vegan, allergies), computes personal BMR/TDEE.
2. **AI Food Scanner**: Upload photo -> Gemini identifies food + ingredients + portion -> user confirms -> nutrients queried from ICMR-NIN -> logged to diary.
3. **Daily Food Diary**: Tracks breakfast, lunch, dinner, snacks with live macro progress.
4. **Context-Aware AI Chat**: Asks "What should I eat for dinner?" -> system reads today's remaining 450 calories and vegetarian preference -> suggests high-protein Paneer Bhurji / Moong Dal Chilla.
5. **Analytics**: 7-day caloric trend, macro distribution donut chart, weight progression.

---

### Slide 9: Implementation Status & Progress
- **Completed**:
  - Project architecture & repository initialization.
  - Complete database schema & RLS policies (`supabase/schema.sql`).
  - Nutrition calculation engine (BMR, TDEE, macro distribution).
  - Indian Food Composition (ICMR-NIN IFCT) reference dataset.
  - Next.js 15 App Router pages, responsive design system.
  - Multimodal Gemini scanner integration & Context-Aware Assistant.
- **In Progress / Next Steps**:
  - Barcode camera scanner integration with Open Food Facts.
  - Extended longitudinal nutritional analytics.

---

### Slide 10: Conclusion & Q&A
- **Summary**: Delivered a working, production-grade, context-aware nutrition assistant that combines cutting-edge generative AI with empirical scientific rigor.
- **Ready for Questions**: Thank you to the evaluation committee.
