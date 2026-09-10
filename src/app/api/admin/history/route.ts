// src/app/api/admin/history/route.ts
import { NextResponse } from "next/server";
import { getSessions } from "@/lib/interactionLog";
import { blockInProduction } from "@/lib/adminGuard";

export async function GET() {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const sessions = await getSessions();
  return NextResponse.json({ sessions }, { status: 200 });
}
