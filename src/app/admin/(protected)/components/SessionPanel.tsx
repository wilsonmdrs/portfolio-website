"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { VarsInspector } from "./VarsInspector";
import { CorrectionForm } from "./CorrectionForm";
import type { Turn } from "../types";

export function SessionPanel({
  userId,
  turns,
  onTurn,
}: {
  userId: string;
  turns: Turn[];
  onTurn: (turn: Turn) => void;
}) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const lastTurn = turns[turns.length - 1] ?? null;

  // The input is disabled while a request is in flight (see below), and
  // disabling an input drops browser focus with nothing to restore it —
  // refocus once it's re-enabled so typing can continue without reclicking.
  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending]);

  async function send() {
    const message = value.trim();
    if (!message || pending) return;
    setPending(true);
    setValue("");
    try {
      const res = await fetch("/api/admin/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message }),
      });
      const data = await res.json().catch(() => ({}));
      onTurn({
        id: uuidv4(),
        message,
        reply: res.ok ? (data.reply ?? "") : `Error: ${data.error ?? res.status}`,
        vars: res.ok ? (data.vars ?? null) : null,
      });
    } catch {
      onTurn({ id: uuidv4(), message, reply: "Error: request failed", vars: null });
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div>
        <div className="h-[50vh] space-y-3 overflow-y-auto rounded-md border p-3">
          {turns.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Session {userId.slice(0, 8)}… — no messages yet.
            </p>
          )}
          {turns.map((turn) => (
            <div key={turn.id} className="space-y-1">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                  {turn.message}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted px-3 py-1.5 text-sm">
                  {turn.reply}
                </div>
              </div>
              <div className="flex justify-start pl-1">
                {savedIds.has(turn.id) ? (
                  <span className="text-xs text-muted-foreground">✓ correction saved</span>
                ) : correctingId === turn.id ? null : (
                  <button
                    type="button"
                    className="text-xs text-primary underline-offset-2 hover:underline"
                    onClick={() => setCorrectingId(turn.id)}
                  >
                    This reply is wrong →
                  </button>
                )}
              </div>
              {correctingId === turn.id && (
                <CorrectionForm
                  sessionUserId={userId}
                  turn={turn}
                  onCancel={() => setCorrectingId(null)}
                  onSaved={() => {
                    setSavedIds((prev) => new Set(prev).add(turn.id));
                    setCorrectingId(null);
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            placeholder="Type a message…"
            value={value}
            disabled={pending}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={send} disabled={pending || !value.trim()}>
            Send
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Live vars (this session)
        </h3>
        <VarsInspector vars={lastTurn?.vars ?? null} />
      </div>
    </div>
  );
}
