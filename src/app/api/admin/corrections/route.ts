// src/app/api/admin/corrections/route.ts
import { NextResponse } from "next/server";
import { appendCorrection, listCorrections, type NewCorrectionInput } from "@/lib/adminCorrections";
import { blockInProduction } from "@/lib/adminGuard";

export async function GET() {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  const corrections = await listCorrections();
  return NextResponse.json({ corrections }, { status: 200 });
}

export async function POST(req: Request) {
  const blocked = await blockInProduction();
  if (blocked) return blocked;

  try {
    const body = (await req.json()) as Partial<NewCorrectionInput>;

    if (!body.sessionUserId || !body.conversation || !body.vars || !body.instructions?.trim()) {
      return NextResponse.json(
        { error: "sessionUserId, conversation, vars, and instructions are required" },
        { status: 400 },
      );
    }

    const entry = await appendCorrection({
      sessionUserId: body.sessionUserId,
      conversation: body.conversation,
      vars: body.vars,
      instructions: body.instructions,
      suggestion: body.suggestion,
    });

    return NextResponse.json({ correction: entry }, { status: 201 });
  } catch (error) {
    console.log("admin corrections POST error", error);
    return NextResponse.json({ error: "Failed to save correction" }, { status: 500 });
  }
}
