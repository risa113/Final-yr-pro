import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // In guest or local mode, client handles localStorage fallback
      return NextResponse.json({ meals: [], isGuest: true }, { status: 200 });
    }

    const { data: meals, error } = await supabase
      .from("meals")
      .select(`
        id,
        meal_type,
        logged_date,
        logged_time,
        total_calories,
        total_protein_g,
        total_carbs_g,
        total_fat_g,
        meal_items (
          id,
          food_name,
          serving_weight_g,
          calories,
          protein_g,
          carbs_g,
          fat_g
        )
      `)
      .eq("user_id", user.id)
      .eq("logged_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ meals: meals || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      meal_type = "lunch",
      logged_date,
      food_name,
      serving_weight_g,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      total_calories,
      total_protein_g,
      total_carbs_g,
      total_fat_g,
      items,
    } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const mealCalories = total_calories ?? calories ?? 0;
    const mealProtein = total_protein_g ?? protein_g ?? 0;
    const mealCarbs = total_carbs_g ?? carbs_g ?? 0;
    const mealFat = total_fat_g ?? fat_g ?? 0;

    if (!user) {
      return NextResponse.json(
        {
          message: "Item saved to local session storage.",
          isGuest: true,
          meal: {
            id: `local_${Date.now()}`,
            meal_type,
            logged_date: logged_date || new Date().toISOString().split("T")[0],
            total_calories: mealCalories,
            total_protein_g: mealProtein,
            total_carbs_g: mealCarbs,
            total_fat_g: mealFat,
            meal_items: items || [
              {
                food_name: food_name || "Food Item",
                serving_weight_g: serving_weight_g || 100,
                calories: mealCalories,
                protein_g: mealProtein,
                carbs_g: mealCarbs,
                fat_g: mealFat,
              },
            ],
          },
        },
        { status: 200 }
      );
    }

    // Insert meal session in Supabase
    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        meal_type,
        logged_date: logged_date || new Date().toISOString().split("T")[0],
        total_calories: mealCalories,
        total_protein_g: mealProtein,
        total_carbs_g: mealCarbs,
        total_fat_g: mealFat,
      })
      .select()
      .single();

    if (mealError) {
      return NextResponse.json({ error: mealError.message }, { status: 500 });
    }

    // Prepare line items
    let lineItemsToInsert: any[] = [];
    if (Array.isArray(items) && items.length > 0) {
      lineItemsToInsert = items.map((it: any) => ({
        meal_id: meal.id,
        food_name: it.name || it.food_name || "Food Item",
        serving_weight_g: it.portionG || it.serving_weight_g || 100,
        calories: it.calories || 0,
        protein_g: it.proteinG ?? it.protein_g ?? 0,
        carbs_g: it.carbsG ?? it.carbs_g ?? 0,
        fat_g: it.fatG ?? it.fat_g ?? 0,
      }));
    } else {
      lineItemsToInsert = [
        {
          meal_id: meal.id,
          food_name: food_name || "Meal",
          serving_weight_g: serving_weight_g || 100,
          calories: mealCalories,
          protein_g: mealProtein,
          carbs_g: mealCarbs,
          fat_g: mealFat,
        },
      ];
    }

    const { error: itemError } = await supabase.from("meal_items").insert(lineItemsToInsert);

    if (itemError) {
      console.warn("[POST /api/meals] meal_items insert warning:", itemError.message);
    }

    return NextResponse.json({ success: true, meal }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
