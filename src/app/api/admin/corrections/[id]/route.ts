// src/app/api/admin/corrections/[id]/route.ts
import { NextResponse } from "next/server";
import { deleteCorrection, updateCorrection, type Correction } from "@/lib/adminCorrections";
import { blockInProduction } from "@/lib/adminGuard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  const { id } = await params;
  const patch = (await req.json()) as Partial<
    Pick<Correction, "instructions" | "suggestion" | "approved" | "reviewNotes" | "replay">
  >;

  const updated = await updateCorrection(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Correction not found" }, { status: 404 });
  }
  return NextResponse.json({ correction: updated }, { status: 200 });
}

export async function DELETE(req: Request, { params }: Params) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  const { id } = await params;
  const deleted = await deleteCorrection(id);
  if (!deleted) {
    return NextResponse.json({ error: "Correction not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
