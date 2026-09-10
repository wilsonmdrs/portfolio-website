// src/app/api/admin/session/end/route.ts
//
// Closes out an admin test session's RiveScript state server-side (clears
// its uservars, frees the entry in riveBot.ts's in-memory activeSessions
// map). Not a data-safety step — every turn is already persisted to
// interactionLog.ts in real time as it happens (see chatHistory.ts's
// recordConversationTurn), so there's nothing left to "save" at this
// point; this is purely hygiene so an abandoned session doesn't linger.
import { NextResponse } from "next/server";
import { endConversation } from "@/lib/riveBot";
import { blockInProduction } from "@/lib/adminGuard";

export async function POST(req: Request) {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as { userId?: string };
  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await endConversation(userId);
  return NextResponse.json({ ok: true }, { status: 200 });
}
