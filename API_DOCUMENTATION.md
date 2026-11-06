# API DOCUMENTATION
## Context-Aware AI Food and Nutrition Assistant

All endpoints are hosted under `/api`. Protected routes require a valid Supabase Auth session token (passed via session cookies or `Authorization: Bearer <token>`).

---

## 1. Authentication Endpoints
Managed via `@supabase/ssr` / Supabase GoTrue Auth client.
- `POST /auth/v1/signup`: Creates new user account.
- `POST /auth/v1/token?grant_type=password`: Logs in user with email & password.
- `POST /auth/v1/recover`: Triggers password reset email.
- `POST /auth/v1/logout`: Invalidates session cookie.

---

## 2. Profile & Biometrics
### `GET /api/profile`
Retrieves authenticated user's profile and dietary preferences.
- **Headers**: Cookie session / Bearer token.
- **Response `200 OK`**:
```json
{
  "profile": {
    "id": "c1f7b889-1064-4e4b-936d-9bebeae25816",
    "email": "user@example.com",
    "full_name": "Muhammed Thariq",
    "age": 22,
    "gender": "male",
    "height_cm": 175.0,
    "weight_kg": 70.0,
    "activity_level": "moderately_active",
    "bmr": 1668.75,
    "tdee": 2586.56,
    "target_calories": 2586.56,
    "target_protein_g": 140.0,
    "target_carbs_g": 323.0,
    "target_fat_g": 86.0,
    "target_fiber_g": 35.0,
    "onboarding_completed": true
  },
  "preferences": {
    "dietary_type": "vegetarian",
    "allergies": ["peanuts"],
    "intolerances": ["lactose"],
    "preferred_cuisines": ["South Indian", "North Indian"],
    "meal_frequency": 3
  }
}
```

### `PUT /api/profile`
Updates profile biometrics and recalculates BMR/TDEE targets.
- **Body**:
```json
{
  "full_name": "Muhammed Thariq",
  "age": 22,
  "gender": "male",
  "height_cm": 175,
  "weight_kg": 70,
  "activity_level": "moderately_active",
  "goal_type": "maintenance",
  "dietary_type": "vegetarian",
  "allergies": ["peanuts"],
  "preferred_cuisines": ["South Indian", "North Indian"]
}
```

---

## 3. Food Search & Nutrition Lookup
### `GET /api/foods/search?q={query}&source={source}`
Searches across the ICMR-NIN IFCT dataset and USDA FoodData Central.
- **Query Params**:
  - `q` (string, required): Search term (e.g., `idli`, `paneer`, `apple`).
  - `source` (optional): `all` | `icmr` | `usda` | `openfoodfacts`.
- **Response `200 OK`**:
```json
{
  "results": [
    {
      "id": "ifct_001",
      "name": "Idli (Steamed Rice & Urad Dal Cake)",
      "category": "Cereal & Pulse Preparations",
      "serving_unit": "piece (standard ~50g)",
      "standard_serving_g": 50.0,
      "source": "ICMR_NIN",
      "source_id": "IFCT_2017_C001",
      "calories": 75.0,
      "protein_g": 2.0,
      "carbs_g": 16.0,
      "fat_g": 0.2,
      "fiber_g": 0.8
    }
  ]
}
```

### `GET /api/foods/barcode?code={ean}`
Looks up packaged food items using Open Food Facts API v2.
- **Query Params**: `code` (string): e.g. `8901030383701`.

---

## 4. Multimodal AI Food Scanner
### `POST /api/food-scan`
Uploads food photo, invokes Gemini 2.5 Flash with structured schema, and returns visual identification with uncertainty indicators.
- **Body (Multipart Form-Data or JSON Base64)**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "meal_type": "lunch"
}
```
- **Response `200 OK`**:
```json
{
  "scan_id": "97e5ad4d-5655-4074-a690-3fb2cbcf7ba8",
  "detected_food_name": "Masala Dosa with Sambar and Chutney",
  "confidence_score": 0.94,
  "alternative_candidates": ["Plain Dosa", "Uttapam"],
  "detected_ingredients": ["Rice and black gram batter", "Potato masala", "Mustard seeds", "Sambar"],
  "estimated_serving_g": 180.0,
  "confidence_reasoning": "Visible thin fermented crepe rolled around spiced potato stuffing accompanied by coconut chutney and lentil sambar bowl.",
  "matched_nutrition": {
    "source": "ICMR_NIN",
    "calories": 360.0,
    "protein_g": 6.8,
    "carbs_g": 54.0,
    "fat_g": 12.5,
    "fiber_g": 4.2
  }
}
```

### `POST /api/food-scan/confirm`
Confirms or corrects scan results and logs directly to the user's food diary.
- **Body**:
```json
{
  "scan_id": "97e5ad4d-5655-4074-a690-3fb2cbcf7ba8",
  "confirmed_food_name": "Masala Dosa",
  "confirmed_serving_g": 180.0,
  "meal_type": "breakfast",
  "logged_date": "2026-11-01"
}
```

---

## 5. Food Diary & Meal Logging
### `GET /api/meals?date={YYYY-MM-DD}`
Fetches all meals and items for a specific date, along with cumulative daily macros.
### `POST /api/meals`
Adds a manual food item to a meal slot.
- **Body**:
```json
{
  "meal_type": "breakfast",
  "logged_date": "2026-11-01",
  "food_name": "Idli",
  "serving_weight_g": 100.0,
  "calories": 150.0,
  "protein_g": 4.0,
  "carbs_g": 32.0,
  "fat_g": 0.4,
  "fiber_g": 1.6
}
```
### `DELETE /api/meals/[id]`
Deletes a logged meal item and recalculates the daily summary.

---

## 6. Context-Aware Conversational Assistant
### `POST /api/assistant/chat`
Performs a Retrieval-Augmented Generation (RAG) query combining:
1. User's biometrics and dietary restrictions.
2. Today's remaining caloric and macronutrient budget.
3. Recent logged meals.
4. User's question.
- **Body**:
```json
{
  "message": "What should I eat for dinner? I have 600 calories left and need 30g protein.",
  "conversation_id": "optional-uuid"
}
```
- **Response `200 OK`**:
```json
{
  "conversation_id": "b304c1e4-3995-4eb8-b4b0-377f0d0469b6",
  "reply": "Based on your remaining budget (586 kcal and 32g protein) and your vegetarian preference:\n\n1. **Paneer Tikka (150g)**: ~390 kcal, 27g protein, 8g carbs, 28g fat.\n2. **Moong Dal Chilla with Mint Chutney (2 medium, ~120g)**: ~240 kcal, 14g protein, 32g carbs, 6g fat.\n\nOption 1 paired with a small cucumber salad hits your protein target accurately while staying under your 600 kcal ceiling."
}
```

---

## 7. Analytics & Progress
### `GET /api/analytics/overview`
Returns today's intake vs targets, 7-day caloric trend, macro breakdown percentages, and logged weight progression.
