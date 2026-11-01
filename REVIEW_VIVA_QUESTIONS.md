# ACADEMIC REVIEW & VIVA VOCE QUESTIONS
## Context-Aware AI Food and Nutrition Assistant
**Final Year B.Tech (Artificial Intelligence and Data Science)**

---

### Q1: What is the primary motivation and problem statement of this project?
**Answer:** Most existing calorie trackers (like MyFitnessPal or HealthifyMe) suffer from high user friction, requiring manual searches through thousands of confusing database entries and relying on static, generic calorie numbers. They do not understand the user's real-time physical state or dietary context. This project solves this by using Multimodal AI (Google Gemini) for one-click food identification from imagery, combined with empirical nutritional reference databases (ICMR-NIN IFCT & USDA), and a dynamic context engine that personalizes advice based on current caloric deficit, allergies, and cultural preferences.

### Q2: What does "Context-Aware" mean in the context of this system?
**Answer:** "Context-Aware" means the system does not give isolated, generic answers. Every AI response and meal recommendation dynamically takes into account:
1. User biometrics (Age, Gender, Height, Weight).
2. Energy targets computed via Mifflin-St Jeor formula (BMR and TDEE).
3. Cultural cuisine and dietary constraints (e.g., vegetarian, vegan, lactose intolerance, nut allergy).
4. Real-time daily budget: The assistant inspects what the user has *already logged today* and calculates remaining calories and macros before suggesting food.

### Q3: Why did you choose Google Gemini over OpenAI GPT-4 Vision?
**Answer:**
1. Gemini (specifically Gemini 2.5 Flash / Flash Lite) provides native multimodal reasoning with superior latency and token pricing.
2. It offers strict JSON Schema enforcement directly in the API call (`responseSchema`), preventing parsing failures.
3. It has strong semantic understanding of regional cuisines, including traditional Indian dishes.

### Q4: How does the AI food image recognition work step-by-step?
**Answer:**
1. The user uploads a food photo through the frontend scanner.
2. The image is validated for MIME type (JPEG/PNG/WebP) and capped at 5MB.
3. The server converts the buffer to base64 and invokes the Gemini Multimodal model with a prompt designed to identify dishes, visible ingredients, and qualitative portion cues.
4. Gemini returns structured JSON containing the detected dish, alternative candidates, visible ingredients, and estimated weight in grams.
5. The system requests user confirmation or adjustment of portion size.
6. Once confirmed, nutrients are calculated using empirical databases rather than LLM guesswork.

### Q5: Why do you separate visual recognition from calorie calculation?
**Answer:** This is a crucial engineering design decision. Large Language Models are probabilistic text generators, not analytical chemistry scales. If an LLM is asked to directly state the calories of an image, it often hallucinates inaccurate numbers. By using the AI solely for identification and visual portion estimation, and retrieving the actual nutritional values from verified laboratory tables (ICMR-NIN / USDA), we ensure nutritional integrity and safety.

### Q6: What is BMR, and which mathematical formulation is used?
**Answer:** Basal Metabolic Rate (BMR) is the minimum amount of energy (calories) your body requires to maintain vital life functions at complete rest. We use the clinically validated **Mifflin-St Jeor Equation**:
- For Males: $\text{BMR} = 10 \times \text{Weight (kg)} + 6.25 \times \text{Height (cm)} - 5 \times \text{Age (years)} + 5$
- For Females: $\text{BMR} = 10 \times \text{Weight (kg)} + 6.25 \times \text{Height (cm)} - 5 \times \text{Age (years)} - 161$

### Q7: What is TDEE and how is it derived from BMR?
**Answer:** Total Daily Energy Expenditure (TDEE) is the total calories burned in a 24-hour period including physical activity. It is calculated by multiplying BMR with the Pal (Physical Activity Level) coefficient:
- Sedentary (desk job, minimal exercise): $\text{BMR} \times 1.2$
- Lightly active (light exercise 1-3 days/week): $\text{BMR} \times 1.375$
- Moderately active (moderate exercise 3-5 days/week): $\text{BMR} \times 1.55$
- Very active (hard exercise 6-7 days/week): $\text{BMR} \times 1.725$
- Extra active (intense training or physical labor): $\text{BMR} \times 1.9$

### Q8: What database is used and why?
**Answer:** We use PostgreSQL hosted on Supabase. PostgreSQL was chosen for its strict ACID compliance, relational integrity, foreign key cascading, JSONB indexing for AI metadata, full-text search capabilities, and native Row Level Security (RLS).

### Q9: What is Supabase and what role does it play?
**Answer:** Supabase is an open-source Firebase alternative built around PostgreSQL. It provides GoTrue authentication (JWT-based session management), an auto-generated PostgREST API layer, secure S3-compatible file storage for food photos, and Row Level Security for multi-tenant data isolation.

### Q10: How is Row Level Security (RLS) implemented?
**Answer:** RLS policies are defined directly on the PostgreSQL tables. For example, in the `meals` and `profiles` tables, every query evaluates `auth.uid() = user_id`. Even if an authenticated user attempts to request another user's UUID via the API, the PostgreSQL engine filters out the unauthorized records at the kernel level.

### Q11: What is the ICMR-NIN IFCT database?
**Answer:** The Indian Food Composition Tables (IFCT 2017) published by the National Institute of Nutrition (NIN) and Indian Council of Medical Research (ICMR) is the gold-standard scientific compositional reference for Indian foods. It provides laboratory-tested macronutrient and micronutrient values for traditional Indian cooked dishes, grains, pulses, and spices.

### Q12: Why is USDA FoodData Central also integrated?
**Answer:** USDA FoodData Central provides an extensive, open REST API covering over 300,000 branded and foundation whole foods worldwide. Integrating it ensures that non-Indian foods, western recipes, and global produce have reliable nutritional attribution.

### Q13: What is Open Food Facts and how does the barcode lookup work?
**Answer:** Open Food Facts is a collaborative, open-access database of food products worldwide. The application queries `https://world.openfoodfacts.org/api/v2/product/{barcode}` using standard GTIN/EAN barcodes to retrieve packaged food labels, ingredient lists, allergens, and nutritional declaration tables.

### Q14: How does the Context-Aware AI Chatbot prevent hallucinations?
**Answer:** It uses a Retrieval-Augmented Generation (RAG) pattern. When the user sends a message:
1. The backend retrieves the user's active biometrics and goals from `profiles`.
2. It fetches all logged meals for the current day from `meals` and computes total calories/macros consumed and remaining.
3. It fetches dietary preferences, allergies, and dislikes from `dietary_preferences`.
4. This structured context snapshot is injected into the system prompt passed to Gemini, strictly ordering the model to cite verified figures and respect constraints.

### Q15: How does the system ensure allergy safety in meal recommendations?
**Answer:** In both the AI Chat Assistant and the Smart Meal Planner, the user's allergy array (e.g. `['peanuts', 'shellfish', 'gluten']`) acts as a hard filter. The prompts and rule-based filter algorithms reject any ingredient or dish containing matching allergen tags before returning suggestions to the user.

### Q16: What frontend framework is used and why Next.js App Router?
**Answer:** Next.js 15+ with App Router was chosen because:
- **Server Components (RSC)**: Minimize client JavaScript bundle size and improve Core Web Vitals.
- **Route Handlers**: Allow secure backend API creation within the same codebase, keeping private API keys off the browser.
- **SSR/Streaming**: Faster initial page render for nutrition dashboards and analytics.
- **Built-in TypeScript and Optimization**: Native image optimization, font optimization, and type safety.

### Q17: What styling library is used and why?
**Answer:** Tailwind CSS v4 and shadcn/ui design patterns. Tailwind provides utility-first CSS that compiles into a tiny production stylesheet, while shadcn/ui provides clean, accessible, modern interactive primitives (dialogs, cards, badges, tabs, progress bars).

### Q18: What is the limitation of estimating portion size from a 2D photograph?
**Answer:** A single 2D image lacks depth and volumetric density. Two identical-looking bowls of curry may have vastly different calories depending on whether heavy cream, butter, or oil was used. Our system acknowledges this limitation honestly by labeling portion sizes as estimates (with uncertainty indicators) and empowering the user to adjust the weight in grams before saving.

### Q19: How are the charts generated? Is the data real?
**Answer:** Charts are built using **Recharts**, a composable React charting library. They are strictly rendered from live PostgreSQL database records (aggregating the user's logged meals across the last 7 days). If no data exists, the application displays an authentic empty state prompting the user to log their first meal.

### Q20: What security measures are implemented?
**Answer:**
1. All API keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept on the server side.
2. PostgreSQL Row Level Security (RLS) restricts database queries to `auth.uid()`.
3. File uploads are validated for MIME type, extension, and file size limits (5MB max).
4. Input validation is performed using Zod schemas on both client and server.
5. All sensitive credentials are stored in `.env.local` and excluded via `.gitignore`.

### Q21: What is an API and how do REST endpoints communicate?
**Answer:** An API (Application Programming Interface) defines a set of rules allowing software applications to communicate. Our application uses HTTP REST endpoints (`GET`, `POST`, `PUT`, `DELETE`) with standard status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`) and JSON payloads.

### Q22: What happens if the Gemini API or USDA API is temporarily unreachable?
**Answer:** The architecture incorporates defensive programming:
1. If the Gemini API fails or times out, a clear user-facing error is displayed with a retry button, never a fabricated result.
2. If the USDA API fails, the application falls back to the embedded ICMR-NIN IFCT database.
3. Error boundaries prevent the entire dashboard from crashing.

### Q23: How do you calculate macronutrient targets?
**Answer:**
1. Total Calories = Target Calories (from BMR $\times$ Activity Level $\pm$ Goal Adjustment).
2. Protein = $1.6\text{g} - 2.0\text{g}$ per kg of bodyweight (for muscle building/maintenance) or $1.0\text{g} - 1.2\text{g}$ standard.
3. Fat = $25\% - 30\%$ of total calories ($1\text{g fat} = 9\text{ kcal}$).
4. Carbohydrates = Remaining calories divided by $4\text{ kcal/g}$.
5. Fiber = $14\text{g}$ per $1,000\text{ kcal}$ consumed (standard AHA/ICMR guideline).

### Q24: What is the difference between AI Inference and Database Retrieval?
**Answer:**
- **AI Inference**: The model runs weights through neural network layers to probabilistically generate predictions (identifying "Dosa" from pixel patterns).
- **Database Retrieval**: Deterministic querying of an exact, indexed record from a verified relational table where calorie and macronutrient counts are fixed and verifiable.

### Q25: How is user authentication handled?
**Answer:** Supabase GoTrue Auth is used. Users register with email and password (hashed with bcrypt/argon2 in the database). On login, the server issues signed JWT tokens stored securely in HTTP-only session cookies via `@supabase/ssr`.

### Q26: Can a user modify their nutritional goals?
**Answer:** Yes. The User Settings and Onboarding modules allow updating weight, activity level, or goal type (e.g. from weight loss to maintenance), which automatically re-runs the Mifflin-St Jeor formulas and updates the targets in the database.

### Q27: How does the Daily Food Diary group meals?
**Answer:** It groups meals into four distinct chronological categories: Breakfast, Lunch, Dinner, and Snacks. Each meal displays its constituent items with individual gram weights and calories, alongside a subtotal and progress relative to the day's total budget.

### Q28: How does the AI Assistant handle medical queries?
**Answer:** The assistant is explicitly instructed via system prompt to act as a supportive nutritional guide, not a medical practitioner. It refuses to make medical diagnoses or prescribe diets for severe clinical conditions (e.g., chronic kidney disease, severe diabetes) and directs the user to consult a certified physician or registered dietitian.

### Q29: What is the role of Git and GitHub in this project?
**Answer:** Git provides distributed version control, tracking changes across commits, branching for features, and enabling clean rollback if needed. GitHub hosts the remote repository, facilitating CI/CD integration with hosting platforms like Vercel.

### Q30: What are the main future enhancements planned for this project?
**Answer:**
1. Real-time video stream food scanning using WebRTC.
2. Wearable fitness tracker integration (Apple Health / Google Fit API) for live calorie expenditure syncing.
3. Multilingual voice interface supporting regional Indian languages (Hindi, Tamil, Telugu, etc.).
4. Barcode scanning directly via smartphone camera using ZXing/HTML5 QR scanner.
