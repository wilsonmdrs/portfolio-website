"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useChat({ userId }: { userId: string }) {
  const startedRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (startedRef.current) return true;
    setError(null);
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

  const sendMessage = useCallback(
    async (message: string) => {
      setPending(true);
      setError(null);
      try {
        if (!startedRef.current) {
          const ok = await start();
          if (!ok) throw new Error("Conversation not started");
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
        setError("Failed to send message");
        return "";
      } finally {
        setPending(false);
      }
    },
    [start, userId],
  );

  useEffect(() => {
    start();
  }, [start]);

  return {
    start, // call once on mount or before first send
    sendMessage, // call to get replies (after start)
    reply, // last reply
    pending, // network in-flight
    error, // last error string
    started: startedRef.current,
  };
}
