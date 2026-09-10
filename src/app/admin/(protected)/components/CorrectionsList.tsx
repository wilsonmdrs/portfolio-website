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
  needsReedit?: boolean;
  reviewNotes?: string;
  replay?: {
    reply: string;
    vars: Record<string, unknown>;
    repliedAt: string;
  };
};

function correctionsToMarkdown(entries: Correction[]): string {
  const lines: string[] = [
    "# Chatbot corrections export",
    `Generated: ${new Date().toISOString()}`,
    `Total: ${entries.length}`,
    "",
  ];

  entries.forEach((entry, index) => {
    const replayChanged = entry.replay ? entry.replay.reply !== entry.conversation.reply : null;
    lines.push(
      "---",
      "",
      `## ${index + 1}. "${entry.conversation.message}"`,
      "",
      `- id: ${entry.id}`,
      `- created: ${entry.createdAt}`,
      `- needs re-edit: ${entry.needsReedit ? "yes" : "no"}`,
      `- bot replied: "${entry.conversation.reply}"`,
      `- instructions: ${entry.instructions}`,
      `- reviewer notes: ${entry.reviewNotes || "(none)"}`,
    );

    if (entry.suggestion) {
      lines.push(
        "- drafted suggestion:",
        `  - key: ${entry.suggestion.suggestedKey}`,
        `  - trigger phrases: ${entry.suggestion.triggerPhrases.join(", ")}`,
        `  - correct answer: ${entry.suggestion.correctAnswer}`,
        `  - unknownhint: ${entry.suggestion.unknownhint}`,
        `  - reasoning: ${entry.suggestion.reasoning}`,
      );
    } else {
      lines.push("- drafted suggestion: (none yet)");
    }

    if (entry.replay) {
      lines.push(
        "- latest retest:",
        `  - replied now: "${entry.replay.reply}"`,
        `  - changed since flagged: ${replayChanged ? "yes" : "no"}`,
        `  - checked at: ${entry.replay.repliedAt}`,
      );
    } else {
      lines.push("- latest retest: (not run yet)");
    }

    lines.push("");
  });

  return lines.join("\n");
}

export function CorrectionsList() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [recheckingId, setRecheckingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      // POST, not GET: replays every entry's original message (full
      // prior history, not just the flagged line — see riveBot.ts's
      // replayConversation) against the live bot before returning the
      // list, so the changed/unchanged box is always current. Safe to do
      // on every load now that getBot() re-checks the KB's mtime
      // signature on every call (see riveBot.ts) instead of relying on a
      // background watcher to notice edits.
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

  async function patch(id: string, body: Partial<Pick<Correction, "needsReedit" | "reviewNotes">>) {
    await fetch(`/api/admin/corrections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function toggleNeedsReedit(entry: Correction) {
    await patch(entry.id, { needsReedit: !entry.needsReedit });
  }

  // Rechecks just this one entry — a full load()/Refresh replays every
  // correction in the queue, which is wasteful (and slow) when you're
  // only iterating on a single fix.
  async function recheckOne(id: string) {
    setRecheckingId(id);
    try {
      const res = await fetch("/api/admin/corrections/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.correction) {
        setCorrections((prev) => prev.map((c) => (c.id === id ? data.correction : c)));
      }
    } finally {
      setRecheckingId(null);
    }
  }

  async function saveNote(id: string) {
    await patch(id, { reviewNotes: noteDrafts[id] ?? "" });
  }

  async function remove(id: string) {
    await fetch(`/api/admin/corrections/${id}`, { method: "DELETE" });
    await load();
  }

  function downloadExport() {
    const markdown = correctionsToMarkdown(corrections);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatbot-corrections-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (corrections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No corrections yet. Flag a bad reply in a session to add one.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Every correction is re-checked against the live bot each time this loads.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={downloadExport}>
            Download corrections (.md)
          </Button>
          <Button size="sm" variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>
      {corrections.map((entry) => {
        return (
          <Card key={entry.id} className={entry.needsReedit ? "border-amber-400" : undefined}>
            <CardHeader>
              <CardTitle className="text-sm">
                &quot;{entry.conversation.message}&quot;
                {entry.needsReedit && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-normal text-amber-900">
                    needs re-edit
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
                  <p className="font-semibold">Suggestion (AI-drafted, review before applying)</p>
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

              {entry.replay && (
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
                  placeholder="What should change on the next edit pass?"
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
                  variant="outline"
                  onClick={() => recheckOne(entry.id)}
                  disabled={recheckingId === entry.id}
                >
                  {recheckingId === entry.id ? "Rechecking…" : "Recheck"}
                </Button>
                <Button
                  size="sm"
                  variant={entry.needsReedit ? "default" : "outline"}
                  onClick={() => toggleNeedsReedit(entry)}
                >
                  {entry.needsReedit ? "Marked for re-edit ✓" : "Mark for re-edit"}
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
