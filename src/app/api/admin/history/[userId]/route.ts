// src/app/api/admin/history/[userId]/route.ts
import { NextResponse } from "next/server";
import { deleteSession, getSessionInteractions } from "@/lib/interactionLog";
import { blockInProduction } from "@/lib/adminGuard";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const { userId } = await params;
  const items = await getSessionInteractions(userId);
  return NextResponse.json({ userId, items }, { status: 200 });
}

export async function DELETE(_req: Request, { params }: Params) {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const { userId } = await params;
  const ok = await deleteSession(userId);
  if (!ok) {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
