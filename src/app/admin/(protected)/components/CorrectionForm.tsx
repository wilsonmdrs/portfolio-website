"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Turn } from "../types";

export function CorrectionForm({
  sessionUserId,
  turn,
  onSaved,
  onCancel,
}: {
  sessionUserId: string;
  turn: Turn;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!instructions.trim()) {
      setError("What should the bot have done instead?");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionUserId,
          conversation: { message: turn.message, reply: turn.reply },
          vars: turn.vars ?? {},
          instructions: instructions.trim(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSaved();
    } catch {
      setError("Failed to save correction");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border bg-background p-3">
      <div>
        <label className="text-xs font-medium">
          What should the bot have done instead? Describe it, don&apos;t write the exact reply — a
          coding session will draft the trigger, wording, etc. from this.
        </label>
        <textarea
          className="mt-1 w-full rounded border bg-transparent p-1.5 text-xs"
          rows={3}
          placeholder='e.g. "the bot should suggest a new subject" or "it should recognize this as a greeting even with extra words"'
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
