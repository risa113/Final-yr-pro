import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/ai/gemini";
import { isQuotaExhaustedError } from "@/lib/ai/provider-manager";

export const maxDuration = 60; // Multimodal AI processing allocation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType, userProfile } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required (base64 string)." },
        { status: 400 }
      );
    }

    // Validate base64 payload size (Limit: 8MB)
    const approximateSizeInBytes = (image.length * 3) / 4;
    if (approximateSizeInBytes > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds maximum allowed size of 8MB. Please select a smaller photo or allow auto-compression." },
        { status: 400 }
      );
    }

    // Run multimodal recognition & empirical laboratory nutrition retrieval
    const scanResult = await analyzeFoodImage(image, mimeType || "image/jpeg", userProfile);

    return NextResponse.json(scanResult, { status: 200 });
  } catch (error: any) {
    console.error("[API /api/food-scan] Scan error:", error);

    // Quota exhaustion handling (HTTP 429)
    if (error?.isQuotaExhausted || isQuotaExhaustedError(error)) {
      return NextResponse.json(
        {
          error:
            "The AI Vision service has temporarily reached its Free Tier rate limit. Please wait 60 seconds before retrying, or input portion grams manually.",
          isQuotaExhausted: true,
          canRetry: true,
          retryAfterSeconds: error?.retryAfterSeconds || 60,
        },
        { status: 429 }
      );
    }

    // Missing API credentials handling
    if (error?.message?.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured in .env.local. Please add your key to enable THARIQ AI Food Scanning.",
          isBlockedByCredentials: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to process food image. Please try again." },
      { status: 500 }
    );
  }
}
