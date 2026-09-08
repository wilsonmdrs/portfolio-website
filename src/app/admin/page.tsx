"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { SessionPanel } from "./components/SessionPanel";
import { CorrectionsList } from "./components/CorrectionsList";
import type { Turn } from "./types";

const TABS_STORAGE_KEY = "admin-chat-tabs";

export default function AdminPage() {
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [turnsByTab, setTurnsByTab] = useState<Record<string, Turn[]>>({});
  const [view, setView] = useState<"chat" | "corrections">("chat");
  const [hydrated, setHydrated] = useState(false);

  // Restore which tabs were open (list only — transcripts and RiveScript
  // session state are not persisted; they live in this page's state and the
  // dev server's memory respectively).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TABS_STORAGE_KEY);
      const restored: string[] = stored ? JSON.parse(stored) : [];
      setTabs(restored);
      setActiveTab(restored[0] ?? null);
      setTurnsByTab(Object.fromEntries(restored.map((id) => [id, []])));
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  function persistTabs(next: string[]) {
    try {
      window.localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function newSession() {
    const userId = uuidv4();
    const next = [...tabs, userId];
    setTabs(next);
    persistTabs(next);
    setTurnsByTab((prev) => ({ ...prev, [userId]: [] }));
    setActiveTab(userId);
  }

  function closeSession(userId: string) {
    const next = tabs.filter((id) => id !== userId);
    setTabs(next);
    persistTabs(next);
    setTurnsByTab((prev) => {
      const rest = { ...prev };
      delete rest[userId];
      return rest;
    });
    if (activeTab === userId) setActiveTab(next[0] ?? null);
  }

  function addTurn(userId: string, turn: Turn) {
    setTurnsByTab((prev) => ({ ...prev, [userId]: [...(prev[userId] ?? []), turn] }));
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Chatbot admin</h1>
          <p className="text-xs text-muted-foreground">
            Local dev tool — talks directly to the RiveScript KB, not affected by CHAT_PROVIDER.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "chat" ? "default" : "outline"} size="sm" onClick={() => setView("chat")}>
            Sessions
          </Button>
          <Button
            variant={view === "corrections" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("corrections")}
          >
            Corrections
          </Button>
        </div>
      </div>

      {view === "chat" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((id) => (
              <div key={id} className="flex items-center gap-1">
                <Button
                  variant={activeTab === id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(id)}
                >
                  {id.slice(0, 8)}
                </Button>
                <button
                  type="button"
                  aria-label="Close session"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => closeSession(id)}
                >
                  ×
                </button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={newSession}>
              + New session
            </Button>
          </div>

          {activeTab ? (
            <SessionPanel
              key={activeTab}
              userId={activeTab}
              turns={turnsByTab[activeTab] ?? []}
              onTurn={(turn) => addTurn(activeTab, turn)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No sessions open. Click &quot;New session&quot; to start testing the bot.
            </p>
          )}
        </div>
      ) : (
        <CorrectionsList />
      )}
    </div>
  );
}
