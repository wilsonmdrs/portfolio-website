// src/app/api/chat/message/route.ts
import { NextResponse } from "next/server";
import { ask } from "@/lib/riveBot";

type MsgBody = { userId?: string; message?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MsgBody;
    const userId = body.userId?.trim();
    const message = body.message?.trim();

    if (!userId)
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    if (!message)
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );

    const reply = await ask(message, userId);
    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    if (!!error && typeof error === "object" && "message" in error) {
      console.log("error", error);
      const msg = error?.message ?? "Failed to get reply";
      const status = msg === "Conversation not started" ? 409 : 500;
      return NextResponse.json({ error }, { status });
    }
  }
}
