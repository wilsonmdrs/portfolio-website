// src/app/api/admin/corrections/replay/route.ts
//
// Re-checks every approved correction against the live bot. Called by
// CorrectionsList.tsx on every load — safe to do that often because
// riveBot.ts's getBot() re-checks the KB's mtime signature on every call,
// so this always reflects the latest .rive content without needing a
// separate background watcher to notice edits.
import { NextResponse } from "next/server";
import { replayApprovedCorrections } from "@/lib/adminCorrections";
import { blockInProduction } from "@/lib/adminGuard";

export async function POST() {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  const corrections = await replayApprovedCorrections();
  return NextResponse.json({ corrections }, { status: 200 });
}
