"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Correction = {
  id: string;
  createdAt: string;
  sessionUserId: string;
  conversation: { message: string; reply: string };
  vars: Record<string, unknown>;
  instructions: string;
  suggestion?: {
    triggerPhrases: string[];
    suggestedKey: string;
    unknownhint: string;
    correctAnswer: string;
    reasoning: string;
  };
  approved?: boolean;
  reviewNotes?: string;
  replay?: {
    reply: string;
    vars: Record<string, unknown>;
    repliedAt: string;
  };
};

export function CorrectionsList() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      // POST, not GET: replays every approved entry's original message
      // (full prior history, not just the flagged line — see
      // riveBot.ts's replayConversation) against the live bot before
      // returning the list, so the changed/unchanged badge is always
      // current. Safe to do on every load now that getBot() re-checks the
      // KB's mtime signature on every call (see riveBot.ts) instead of
      // relying on a background watcher to notice edits.
      const res = await fetch("/api/admin/corrections/replay", { method: "POST" });
      const data = await res.json();
      const list: Correction[] = data.corrections ?? [];
      setCorrections(list);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        for (const entry of list) {
          if (!(entry.id in next)) next[entry.id] = entry.reviewNotes ?? "";
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, body: Partial<Pick<Correction, "approved" | "reviewNotes">>) {
    await fetch(`/api/admin/corrections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function toggleApprove(entry: Correction) {
    await patch(entry.id, { approved: !entry.approved });
  }

  async function saveNote(id: string) {
    await patch(id, { reviewNotes: noteDrafts[id] ?? "" });
  }

  async function remove(id: string) {
    await fetch(`/api/admin/corrections/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (corrections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No corrections yet. Flag a bad reply in a session to add one.
      </p>
    );
  }

  const hasApproved = corrections.some((entry) => entry.approved);

  return (
    <div className="space-y-3">
      {hasApproved && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Approved entries are re-checked against the live bot every time this loads.
          </p>
          <Button size="sm" variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      )}
      {corrections.map((entry) => {
        const needsSuggestion = !entry.suggestion;
        return (
          <Card
            key={entry.id}
            className={
              entry.approved ? "border-green-500" : needsSuggestion ? "border-amber-400" : undefined
            }
          >
            <CardHeader>
              <CardTitle className="text-sm">
                &quot;{entry.conversation.message}&quot;
                {entry.approved && (
                  <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-normal text-green-900">
                    ✓ approved
                  </span>
                )}
                {!entry.approved && needsSuggestion && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-normal text-amber-900">
                    awaiting suggestion
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p>
                <span className="font-semibold">Bot said:</span> {entry.conversation.reply}
              </p>
              <p>
                <span className="font-semibold">Instructions:</span> {entry.instructions}
              </p>

              {entry.suggestion ? (
                <div className="rounded border border-dashed p-2">
                  <p className="font-semibold">Suggestion (AI-drafted, review before approving)</p>
                  <p>Should say: {entry.suggestion.correctAnswer}</p>
                  <p>Trigger phrases: {entry.suggestion.triggerPhrases.join(", ")}</p>
                  <p>KEY: {entry.suggestion.suggestedKey}</p>
                  <p>unknownhint: {entry.suggestion.unknownhint}</p>
                  <p className="italic text-muted-foreground">{entry.suggestion.reasoning}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No suggestion drafted yet for these instructions.
                </p>
              )}

              {entry.approved && entry.replay && (
                <div
                  className={
                    entry.replay.reply === entry.conversation.reply
                      ? "rounded border border-amber-300 bg-amber-50 p-2 text-amber-900"
                      : "rounded border border-green-300 bg-green-50 p-2 text-green-900"
                  }
                >
                  <p className="font-semibold">
                    {entry.replay.reply === entry.conversation.reply
                      ? "Still unchanged — the .rive fix may not be live yet"
                      : "Reply changed since the original — check it's correct now"}
                  </p>
                  <p>Bot says now: {entry.replay.reply}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium">Notes for revision</label>
                <textarea
                  className="mt-1 w-full rounded border bg-transparent p-1.5 text-xs"
                  rows={2}
                  placeholder="What should change before this is approved?"
                  value={noteDrafts[entry.id] ?? ""}
                  onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1"
                  onClick={() => saveNote(entry.id)}
                  disabled={(noteDrafts[entry.id] ?? "") === (entry.reviewNotes ?? "")}
                >
                  Save note
                </Button>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant={entry.approved ? "outline" : "default"}
                  disabled={!entry.suggestion}
                  onClick={() => toggleApprove(entry)}
                >
                  {entry.approved ? "Unapprove" : "Approve"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(entry.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
