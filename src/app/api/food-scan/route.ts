import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/ai/gemini";

export const maxDuration = 60; // Allow sufficient time for multimodal AI processing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required (base64 string)." },
        { status: 400 }
      );
    }

    // Validate base64 payload size (Limit: 5MB)
    const approximateSizeInBytes = (image.length * 3) / 4;
    if (approximateSizeInBytes > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds maximum allowed size of 5MB." },
        { status: 400 }
      );
    }

    // Run multimodal recognition & empirical nutrition retrieval
    const scanResult = await analyzeFoodImage(image, mimeType || "image/jpeg");

    return NextResponse.json(scanResult, { status: 200 });
  } catch (error: any) {
    console.error("Food scan error:", error);

    // Honest handling of missing credentials as required by Phase 22
    if (error.message?.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured in .env.local. Please obtain a free key from https://aistudio.google.com/app/apikey and add it to .env.local to enable real AI food scanning.",
          isBlockedByCredentials: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process food image." },
      { status: 500 }
    );
  }
}
