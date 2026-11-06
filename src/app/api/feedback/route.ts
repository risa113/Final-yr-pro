import { NextRequest, NextResponse } from "next/server";

export interface FeedbackEntry {
  id: string;
  messageId: string;
  rating: "up" | "down";
  category?: string;
  comment?: string;
  timestamp: string;
}

const feedbackLogs: FeedbackEntry[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, rating, category, comment } = body;

    if (!messageId || !rating) {
      return NextResponse.json({ error: "messageId and rating are required." }, { status: 400 });
    }

    const entry: FeedbackEntry = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      messageId,
      rating,
      category: category || "general",
      comment: comment || "",
      timestamp: new Date().toISOString(),
    };

    feedbackLogs.push(entry);
    console.log(`[AI Feedback Recorded]: ${rating.toUpperCase()} for message ${messageId}`);

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ feedbackCount: feedbackLogs.length, entries: feedbackLogs.slice(-50) });
}
