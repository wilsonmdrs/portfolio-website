// src/app/api/chat/revoke/route.ts
//
// A visitor withdrawing consent from the /privacy page (see
// RevokeConsent). Public, not admin-gated — same trust model as the rest
// of the /api/chat/* routes: userId is an unguessable client-generated
// UUID, and this only ever acts on the one passed in, i.e. the caller's
// own.
import { NextResponse } from "next/server";
import { endConversation } from "@/lib/riveBot";
import { clearUserTurns } from "@/lib/chatHistory";
import { deleteSession, recordRevocation } from "@/lib/interactionLog";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { userId?: string };
  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await endConversation(userId);
  clearUserTurns(userId);
  await deleteSession(userId);
  await recordRevocation(userId);

  return NextResponse.json({ ok: true }, { status: 200 });
}
