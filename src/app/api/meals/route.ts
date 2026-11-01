import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
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
    const { meal_type, logged_date, food_name, serving_weight_g, calories, protein_g, carbs_g, fat_g } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Item saved to local session storage." },
        { status: 200 }
      );
    }

    // Insert meal session
    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        meal_type,
        logged_date: logged_date || new Date().toISOString().split("T")[0],
        total_calories: calories,
        total_protein_g: protein_g,
        total_carbs_g: carbs_g,
        total_fat_g: fat_g,
      })
      .select()
      .single();

    if (mealError) {
      return NextResponse.json({ error: mealError.message }, { status: 500 });
    }

    // Insert line item
    const { error: itemError } = await supabase.from("meal_items").insert({
      meal_id: meal.id,
      food_name,
      serving_weight_g,
      calories,
      protein_g,
      carbs_g,
      fat_g,
    });

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, meal }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
