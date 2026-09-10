// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { getDailyStats } from "@/lib/interactionLog";
import { blockInProduction } from "@/lib/adminGuard";

const DEFAULT_DAYS = 3;

export async function GET(req: Request) {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("days");
  // Number(null) is 0, not NaN — checking `raw === null` first is what
  // makes "no param" fall back to the default instead of clamping to 1.
  const requested = raw === null ? DEFAULT_DAYS : Number(raw);
  const days = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 90) : DEFAULT_DAYS;

  const stats = await getDailyStats(days);
  return NextResponse.json({ stats }, { status: 200 });
}
