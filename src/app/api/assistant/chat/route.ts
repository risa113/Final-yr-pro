import { NextRequest, NextResponse } from "next/server";
import { chatWithAssistant, type AssistantContext } from "@/lib/ai/gemini";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context, history } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    // Default context snapshot if not passed or in guest mode
    const assistantContext: AssistantContext = context || {
      userName: "Arun Kumar",
      age: 22,
      gender: "male",
      weightKg: 70,
      heightCm: 175,
      goalType: "maintenance",
      dietaryType: "vegetarian",
      allergies: ["peanuts"],
      intolerances: ["lactose"],
      dailyTargets: {
        calories: 2450,
        proteinG: 135,
        carbsG: 290,
        fatG: 75,
      },
      todayConsumed: {
        calories: 860,
        proteinG: 34,
        carbsG: 120,
        fatG: 26,
      },
      recentMeals: [
        {
          mealType: "breakfast",
          foodName: "Idli with Sambar & Coconut Chutney",
          calories: 340,
          proteinG: 9.8,
        },
        {
          mealType: "lunch",
          foodName: "Steamed Rice with Dal Tadka & Chapati",
          calories: 520,
          proteinG: 18.5,
        },
      ],
    };

    const reply = await chatWithAssistant(message, assistantContext, history || []);

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error: any) {
    console.error("AI Assistant error:", error);

    if (error.message?.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured in .env.local. Please obtain your free key from https://aistudio.google.com/app/apikey and add it to .env.local to enable the conversational assistant.",
          isBlockedByCredentials: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to communicate with AI Assistant." },
      { status: 500 }
    );
  }
}
