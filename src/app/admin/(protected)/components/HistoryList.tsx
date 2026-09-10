"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionSummary = {
  userId: string;
  firstMessage: string;
  messageCount: number;
  unmatchedCount: number;
  firstAt: string;
  lastAt: string;
};

export function HistoryList() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/history");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(e: React.MouseEvent, userId: string) {
    // Each card is wrapped in a Link (navigate to the session) — without
    // stopping propagation, clicking delete would also trigger that
    // navigation.
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/history/${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("request failed");
      toast.success("Session deleted");
      await load();
    } catch {
      toast.error("Failed to delete session");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {sessions.length} session{sessions.length === 1 ? "" : "s"} (most recently active first).
        </p>
        <Button size="sm" variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link key={session.userId} href={`/admin/history/${session.userId}`} className="block">
              <Card className={session.unmatchedCount > 0 ? "border-amber-400 hover:bg-muted/50" : "hover:bg-muted/50"}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm font-normal">
                    <span className="truncate">&quot;{session.firstMessage}&quot;</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(session.lastAt).toLocaleString()}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => remove(e, session.userId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{session.userId.slice(0, 8)}</span>
                  <span>
                    {session.messageCount} message{session.messageCount === 1 ? "" : "s"}
                    {session.unmatchedCount > 0 ? ` · ${session.unmatchedCount} unmatched` : ""}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
