"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationTurn, KnowledgeBaseSuggestion } from "@/lib/chatHistory";
import { CHAT_PROVIDER, type ChatProvider } from "@/lib/chatConfig";
import { askBrowserAI, getBrowserAIStatus } from "@/lib/browserAi";

// userId is "" when the visitor hasn't accepted the cookie & data notice
// yet (see components/Chat) — every entry point below is a no-op in that
// case so nothing is sent to the server until they do.
export function useChat({ userId }: { userId: string }) {
  const startedRef = useRef(false);
  // Actual provider for this session — may be downgraded from "browser-ai"
  // to "server" at start() time if the on-device model isn't usable here.
  const providerRef = useRef<ChatProvider>(CHAT_PROVIDER);
  const [provider, setProviderState] = useState<ChatProvider>(CHAT_PROVIDER);
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [suggestions, setSuggestions] = useState<KnowledgeBaseSuggestion[]>([]);

  const setProvider = (next: ChatProvider) => {
    providerRef.current = next;
    setProviderState(next);
  };

  const startServer = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      startedRef.current = true;
      return true;
    } catch (e) {
      console.log(e);
      setError("Failed to start conversation");
      return false;
    }
  }, [userId]);

  const start = useCallback(async () => {
    if (!userId) return false;
    if (startedRef.current) return true;
    setError(null);

    if (providerRef.current === "browser-ai") {
      const status = await getBrowserAIStatus();
      if (status === "available" || status === "downloadable") {
        // "downloadable" still works — create() triggers the download itself.
        startedRef.current = true;
        return true;
      }
      console.log(`Browser AI unavailable (${status}) — falling back to server chat`);
      setProvider("server");
    }

    return startServer();
  }, [startServer, userId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!userId) {
        setError("Accept the cookie & data notice to use the chat.");
        return "";
      }
      setPending(true);
      setError(null);
      try {
        if (!startedRef.current) {
          const ok = await start();
          if (!ok) throw new Error("Conversation not started");
        }

        if (providerRef.current === "browser-ai") {
          const replyText = await askBrowserAI(message);
          setReply(replyText);
          return replyText;
        }

        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, message }),
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        setReply(data.reply || "");
        return data.reply || "";
      } catch (e) {
        console.log(e);
        setError(e instanceof Error ? e.message : "Failed to send message");
        return "";
      } finally {
        setPending(false);
      }
    },
    [start, userId],
  );

  const loadHistory = useCallback(async () => {
    if (!userId) return { history: [], suggestions: [] };
    setError(null);
    // Ensure the provider (browser-ai vs. server fallback) is resolved first.
    await start();

    if (providerRef.current === "browser-ai") {
      // Browser AI sessions are local and not persisted server-side.
      setHistory([]);
      setSuggestions([]);
      return { history: [], suggestions: [] };
    }

    try {
      const res = await fetch(`/api/chat/history?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setHistory(Array.isArray(data.history) ? data.history : []);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      return {
        history: Array.isArray(data.history) ? data.history : [],
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      };
    } catch (e) {
      console.log(e);
      setError("Failed to load conversation history");
      return { history: [], suggestions: [] };
    }
  }, [start, userId]);

  useEffect(() => {
    if (!userId) return;
    start();
  }, [start, userId]);

  return {
    start, // call once on mount or before first send
    sendMessage, // call to get replies (after start)
    loadHistory,
    reply, // last reply
    pending, // network in-flight
    error, // last error string
    history,
    suggestions,
    started: startedRef.current,
    provider, // actual provider in use this session ("server" | "browser-ai")
  };
}
