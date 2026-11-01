import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateDailyTargets, type Gender, type ActivityLevel, type GoalType } from "@/lib/nutrition/calculator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // In guest or local mode, return default guest profile
      const defaultProfile = {
        fullName: "Arun Kumar",
        email: "arun.kumar@student.edu",
        age: 22,
        gender: "male" as Gender,
        heightCm: 175,
        weightKg: 70,
        activityLevel: "moderately_active" as ActivityLevel,
        goalType: "maintenance" as GoalType,
        dietaryType: "vegetarian",
        allergies: ["Peanuts"],
        preferredCuisines: ["South Indian", "North Indian"],
        mealFrequency: 3,
        targets: calculateDailyTargets({
          age: 22,
          gender: "male",
          heightCm: 175,
          weightKg: 70,
          activityLevel: "moderately_active",
          goalType: "maintenance",
        }),
      };
      return NextResponse.json({ profile: defaultProfile, isGuest: true }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: preferences } = await supabase
      .from("dietary_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ profile, preferences }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel,
      goalType,
      dietaryType,
      allergies,
      preferredCuisines,
    } = body;

    const targets = calculateDailyTargets({
      age: Number(age) || 22,
      gender: gender || "male",
      heightCm: Number(heightCm) || 175,
      weightKg: Number(weightKg) || 70,
      activityLevel: activityLevel || "moderately_active",
      goalType: goalType || "maintenance",
    });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // In guest/local mode, acknowledge update with recalculated targets
      return NextResponse.json(
        { success: true, targets, message: "Profile updated locally." },
        { status: 200 }
      );
    }

    // Update profiles table
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        age,
        gender,
        height_cm: heightCm,
        weight_kg: weightKg,
        activity_level: activityLevel,
        bmr: targets.bmr,
        tdee: targets.tdee,
        target_calories: targets.targetCalories,
        target_protein_g: targets.targetProteinG,
        target_carbs_g: targets.targetCarbsG,
        target_fat_g: targets.targetFatG,
        target_fiber_g: targets.targetFiberG,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Update dietary preferences
    await supabase
      .from("dietary_preferences")
      .update({
        dietary_type: dietaryType,
        allergies,
        preferred_cuisines: preferredCuisines,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, targets }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
