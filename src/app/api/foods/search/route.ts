import { NextRequest, NextResponse } from "next/server";
import { searchAllFoods } from "@/lib/nutrition/food-service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = Number(searchParams.get("limit")) || 20;

    if (!query.trim()) {
      // If query is empty, return top items from ICMR-NIN database
      const initialFoods = await searchAllFoods("rice", limit);
      return NextResponse.json({ results: initialFoods }, { status: 200 });
    }

    const results = await searchAllFoods(query, limit);

    return NextResponse.json({ results }, { status: 200 });
  } catch (error: any) {
    console.error("Food search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search food items." },
      { status: 500 }
    );
  }
}
