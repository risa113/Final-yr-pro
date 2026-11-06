import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/ai/context-manager";

export async function GET() {
  try {
    const list = memoryStore.listConversations();
    return NextResponse.json({ conversations: list }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const newConv = memoryStore.createConversation(body.title);
    return NextResponse.json(newConv, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
