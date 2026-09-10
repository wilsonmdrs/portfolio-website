// src/app/api/admin/message/route.ts
import { NextResponse } from "next/server";
import { ask, getSessionVars } from "@/lib/riveBot";
import { blockInProduction } from "@/lib/adminGuard";

type MsgBody = { userId?: string; message?: string };

export async function POST(req: Request) {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  try {
    const body = (await req.json()) as MsgBody;
    const userId = body.userId?.trim();
    const message = body.message?.trim();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Admin testing always talks to the RiveScript bot directly, regardless
    // of the public site's current CHAT_PROVIDER — the whole point is
    // exercising the KB itself. ask() lazily starts a session for a new
    // userId on its own, so there's no separate "start" call needed here.
    const reply = await ask(message, userId);
    const vars = await getSessionVars(userId);

    return NextResponse.json({ reply, vars }, { status: 200 });
  } catch (error) {
    console.log("admin message error", error);
    return NextResponse.json({ error: "Failed to get reply" }, { status: 500 });
  }
}
