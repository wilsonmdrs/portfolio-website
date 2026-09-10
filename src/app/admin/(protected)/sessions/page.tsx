"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionPanel } from "../components/SessionPanel";
import type { Turn } from "../types";

// Only the active session's id is stored here — the transcript isn't (see
// below, it's re-fetched instead). RiveScript's own in-memory session state
// (uservars etc.) doesn't survive a refresh either way.
const ACTIVE_SESSION_KEY = "admin-active-session";

type HistoryItem = { id: string; message: string; reply: string };

export default function SessionsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restoredId: string | null = null;
    try {
      restoredId = window.localStorage.getItem(ACTIVE_SESSION_KEY);
      setUserId(restoredId);
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }

    // The transcript itself is just this page's React state, so it's gone
    // the moment this component unmounts (navigating to another admin tab
    // and back, not only a hard refresh) — even though the session id
    // above survives, and the conversation is still live server-side.
    // Re-fetch it from the same durable log the History page reads from
    // (recordConversationTurn persists every turn there in real time) so
    // switching tabs and coming back doesn't look like the history vanished.
    if (!restoredId) return;
    fetch(`/api/admin/history/${encodeURIComponent(restoredId)}`)
      .then((res) => res.json())
      .then((data) => {
        const items: HistoryItem[] = Array.isArray(data.items) ? data.items : [];
        setTurns(items.map((item) => ({ id: item.id, message: item.message, reply: item.reply, vars: null })));
      })
      .catch(() => {
        // best-effort restore — an empty transcript just means "type to continue"
      });
  }, []);

  function persistActiveSession(id: string | null) {
    try {
      if (id) window.localStorage.setItem(ACTIVE_SESSION_KEY, id);
      else window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {
      // ignore
    }
  }

  // Only one session is ever live at a time. Starting a new one closes out
  // whatever's currently active first — not a data-safety step (every turn
  // is already persisted as it happens), just server-side hygiene so the
  // old session's RiveScript state doesn't linger in memory once the admin
  // has moved on from it.
  async function newSession() {
    if (userId) {
      fetch("/api/admin/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => {
        // best-effort cleanup — starting the new session matters more than this succeeding
      });
    }
    const next = uuidv4();
    setUserId(next);
    persistActiveSession(next);
    setTurns([]);
  }

  function addTurn(turn: Turn) {
    setTurns((prev) => [...prev, turn]);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <Button size="sm" variant="secondary" onClick={newSession}>
          <Plus className="h-3.5 w-3.5" />
          New session
        </Button>
      </div>

      {userId ? (
        <SessionPanel key={userId} userId={userId} turns={turns} onTurn={addTurn} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No session open. Click &quot;New session&quot; to start testing the bot.
        </p>
      )}
    </div>
  );
}
