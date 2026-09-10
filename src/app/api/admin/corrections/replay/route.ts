// src/app/api/admin/corrections/replay/route.ts
//
// Re-checks corrections against the live bot — every one (called by
// CorrectionsList.tsx on every load) or just one (the per-item "Recheck"
// button, via an optional `id` in the body, so checking on a single fix
// in progress doesn't also re-replay everything else). Safe to do this
// often because riveBot.ts's getBot() re-checks the KB's mtime signature
// on every call, so this always reflects the latest .rive content without
// needing a separate background watcher to notice edits.
import { NextResponse } from "next/server";
import { replayAllCorrections, replayCorrection } from "@/lib/adminCorrections";
import { blockInProduction } from "@/lib/adminGuard";

export async function POST(req: Request) {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (body.id) {
    const correction = await replayCorrection(body.id);
    if (!correction) {
      return NextResponse.json({ error: "Correction not found" }, { status: 404 });
    }
    return NextResponse.json({ correction }, { status: 200 });
  }

  const corrections = await replayAllCorrections();
  return NextResponse.json({ corrections }, { status: 200 });
}
