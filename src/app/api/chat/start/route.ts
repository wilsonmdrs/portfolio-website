// src/app/api/chat/start/route.ts
import { startConversation } from "@/lib/riveBot";
import { NextResponse } from "next/server";

type StartBody = { userId?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as StartBody;
    const userId = body.userId?.trim();
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    await startConversation(userId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
