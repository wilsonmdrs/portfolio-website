// src/app/api/admin/revocations/route.ts
import { NextResponse } from "next/server";
import { getRevocations } from "@/lib/interactionLog";
import { blockInProduction } from "@/lib/adminGuard";

export async function GET() {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const revocations = await getRevocations();
  return NextResponse.json({ revocations }, { status: 200 });
}
