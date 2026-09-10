"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CorrectionForm } from "./CorrectionForm";

type ConversationTurn = {
  id: string;
  userId: string;
  message: string;
  normalizedMessage: string;
  reply: string;
  matched: boolean;
  createdAt: string;
};

export function SessionHistoryDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/history/${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("request failed");
      toast.success("Session deleted");
      router.push("/admin/history");
    } catch {
      toast.error("Failed to delete session");
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/history/${encodeURIComponent(userId)}`);
        const data = await res.json();
        setItems(data.items ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/history"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sessions
          </Link>
          <h2 className="mt-2 text-lg font-semibold">Session {userId.slice(0, 8)}</h2>
          <p className="font-mono text-[11px] text-muted-foreground">{userId}</p>
        </div>
        <Button size="sm" variant="destructive" onClick={remove} disabled={deleting}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete session
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages found for this session.</p>
      ) : (
        <div className="space-y-3 rounded-md border p-3">
          {items.map((turn, index) => (
            <div key={turn.id} className="space-y-1">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                  {turn.message}
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  className={
                    turn.matched
                      ? "max-w-[80%] rounded-lg bg-muted px-3 py-1.5 text-sm"
                      : "max-w-[80%] rounded-lg border border-amber-400 bg-muted px-3 py-1.5 text-sm"
                  }
                >
                  {turn.reply}
                </div>
              </div>
              <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground">
                <span>{!turn.matched && "unmatched"}</span>
                <span>{new Date(turn.createdAt).toLocaleString()}</span>
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
                  turn={{
                    id: turn.id,
                    message: turn.message,
                    reply: turn.reply,
                    // History has no real RiveScript uservar snapshot for
                    // this turn (unlike a live Sessions-page correction,
                    // where vars comes straight from getSessionVars()) —
                    // synthesize just enough of one for replay to work.
                    // adminCorrections.ts's extractPriorInputs() expects
                    // __history__.input in RiveScript's own most-recent-
                    // first convention (index 0 = this message itself),
                    // then does slice(1) + reverse() to get oldest-first
                    // — build it in that shape from this session's turns
                    // that came before this one so replay actually
                    // rebuilds the real prior conversation instead of
                    // asking the flagged message in isolation.
                    vars: {
                      __history__: {
                        input: [
                          turn.message,
                          ...items
                            .slice(0, index)
                            .map((t) => t.message)
                            .reverse(),
                        ],
                      },
                    },
                  }}
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
      )}
    </div>
  );
}
