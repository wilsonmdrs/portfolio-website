"use client";

import React, { KeyboardEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { MessageCircle, XIcon } from "lucide-react";
import { useChat } from "@/app/hooks/useChat";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "motion/react";
import {
  CHAT_USER_ID_KEY,
  setStoredConsent,
  useCookieConsent,
  type ConsentValue,
} from "@/lib/cookieConsent";

type Message = {
  id: string;
  user: string;
  content: string;
};

type ChatTurn = {
  id: string;
  message: string;
  reply: string;
};

type ChatHistory = {
  history: ChatTurn[];
};

export const Chat = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const consent = useCookieConsent();
  // Only created (and only ever persisted to localStorage) once the visitor
  // has accepted the cookie & data notice — before that, userId stays "",
  // which makes every network call in useChat a no-op. See cookieConsent.ts.
  const [persistedId, setPersistedId] = useState("");
  useEffect(() => {
    if (consent !== "accepted") return;
    try {
      const stored = window.localStorage.getItem(CHAT_USER_ID_KEY);
      if (stored) {
        setPersistedId(stored);
        return;
      }
      const id = uuidv4();
      window.localStorage.setItem(CHAT_USER_ID_KEY, id);
      setPersistedId(id);
    } catch {
      // Storage blocked (private mode) — still let chat work for this tab,
      // just without persistence across a refresh.
      setPersistedId(uuidv4());
    }
  }, [consent]);
  const userId = consent === "accepted" ? persistedId : "";
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const { sendMessage, loadHistory, provider } = useChat({
    userId,
  });

  function decide(value: ConsentValue) {
    setStoredConsent(value);
    if (value === "declined") setOpen(false);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        chatRef.current &&
        !chatRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    loadHistory()
      .then(({ history }) => {
        if (history.length === 0) return;
        setMessages(
          history.flatMap((turn: ChatTurn) => [
            {
              id: `${turn.id}-user`,
              user: "wm/visitor",
              content: turn.message,
            },
            {
              id: `${turn.id}-bot`,
              user: "wm/chat",
              content: turn.reply,
            },
          ]),
        );
      })
      .catch(() => {
        setMessages([]);
      });
  }, [loadHistory, open]);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Enter" && value.trim().length > 0) {
      if (value.trim().toLowerCase() === "exit") {
        setOpen(false);
        setValue("");
        return;
      }

      // add user message immediately
      const typedValue = value.trim();
      setMessages((prev) => [
        ...prev,

        {
          user: "wm/visitor",
          content: typedValue,
          id: uuidv4(),
        },
      ]);
      setValue("");
      setIsTyping(true);

      try {
        const res = await sendMessage(typedValue);
        setMessages((prev) => [
          ...prev,
          {
            user: "wm/chat",
            content: res,
            id: uuidv4(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,

          {
            user: "wm/chat",
            content: "Oops, something went wrong. Please try again.",
            id: uuidv4(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  if (open) {
    return (
      <AnimatePresence>
        <motion.div
          ref={chatRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed bottom-8 right-8 z-50 w-[92vw] max-w-lg h-[75vh] rounded-2xl border border-primary/60 bg-slate-950/95 p-4 shadow-primary backdrop-blur"
        >
          <div className="flex items-center justify-between pb-3 border-b border-primary/30">
            <div>
              <p className="text-base font-bold text-white tracking-wide">
                wm.chat
              </p>
              <p className="text-xs text-white/70">artificial intelligence</p>
            </div>
            <Button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full bg-primary/20 hover:bg-primary/40 p-0"
              aria-label="Close chat"
            >
              <XIcon color="white" className="h-4 w-4" />
            </Button>
          </div>

          {consent === "accepted" ? (
            <>
              <div
                ref={scrollRef}
                className="mt-3 flex h-[calc(100%-150px)] flex-col overflow-y-auto rounded-xl bg-slate-950/60 p-3 backdrop-blur-sm"
              >
                <div className="mb-2 flex gap-2 rounded-md bg-primary/20 p-2 text-sm text-white">
                  <p className="font-bold text-white">System:</p>
                  <p className="text-white">
                    Welcome to Wilson Medeiros portfolio chatbot
                    {provider === "browser-ai"
                      ? " (running on your browser's on-device AI)."
                      : provider === "groq"
                        ? " (powered by Groq AI)."
                        : " (no generative AI)."}
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {messages.map(({ user, content, id }) => {
                    const isUser = user === "wm/visitor";
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, x: isUser ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={
                          "rounded-lg p-2 text-sm " +
                          (isUser
                            ? "self-end bg-primary/20 text-white"
                            : "self-start bg-zinc-800/70 text-white")
                        }
                      >
                        <p className="font-semibold text-xs uppercase tracking-widest text-cyan-200/90">
                          {user}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{content}</p>
                      </motion.div>
                    );
                  })}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="self-start rounded-lg bg-primary/20 p-2 text-sm text-white"
                    >
                      <p className="text-xs font-semibold uppercase text-cyan-200/90">
                        wm/chat
                      </p>
                      <p className="animate-pulse">
                        typing<span className="ml-1">●</span>
                        <span className="mx-1">●</span>
                        <span>●</span>
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-primary/30 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-primary"
                  placeholder="Enter message..."
                  value={value}
                  autoFocus
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </>
          ) : (
            <div className="mt-3 flex h-[calc(100%-70px)] flex-col items-center justify-center gap-4 rounded-xl bg-slate-950/60 p-6 text-center backdrop-blur-sm">
              <p className="text-sm text-white/80">
                This assistant works by storing a chat ID in your browser and logging
                your messages so it can hold a conversation. Accept the notice below to
                start chatting.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => decide("declined")}>
                  Decline
                </Button>
                <Button size="sm" onClick={() => decide("accepted")}>
                  Accept
                </Button>
              </div>
              <Link href="/privacy" className="text-xs text-primary underline hover:no-underline">
                Read the privacy &amp; cookies page
              </Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }
  return (
    <div className="fixed bottom-8 right-8 z-40">
      <motion.button
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: [1, 1.1, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
        onClick={() => setOpen(true)}
        className="rounded-full border-2 border-primary/80 bg-black/70 p-2 text-primary shadow-primary hover:bg-primary/20 cursor-pointer"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  );
};
