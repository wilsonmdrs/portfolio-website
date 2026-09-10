import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { appendInteraction } from "./interactionLog";

export type ConversationTurn = {
  id: string;
  userId: string;
  message: string;
  normalizedMessage: string;
  reply: string;
  matched: boolean;
  createdAt: string;
};

type HistoryStore = {
  turnsByUser: Map<string, ConversationTurn[]>;
};

const store: HistoryStore = {
  turnsByUser: new Map(),
};

const MAX_TURNS_PER_USER = 50;
const FALLBACK_MARKERS = [
  "i did not quite follow",
  "i didn’t quite follow",
  "i didn't quite follow",
  "i can also answer cv questions",
  "you can ask about wilson",
  "no reply matched",
];

function normalizeForSuggestions(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function isFallbackReply(reply: string): boolean {
  const normalized = normalizeForSuggestions(reply);
  return FALLBACK_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * Schedules the persistent-log write without making recordConversationTurn
 * itself async (it's called from 5 places across riveBot.ts/groqBot.ts with
 * no `await` today, since there was previously nothing to await). after()
 * runs this once the response has been sent but keeps the serverless
 * function alive until it settles — a bare fire-and-forget promise has no
 * such guarantee and could be silently dropped once Vercel tears down the
 * execution environment. after() requires an active request scope (Route
 * Handler/Server Action/Server Component render); it throws synchronously
 * outside one — which is exactly what src/lib/__tests__/corrections.test.ts
 * does by calling ask() directly, so the catch falls back to a plain call
 * there instead of letting every test in that suite throw.
 */
function scheduleInteractionPersist(turn: ConversationTurn): void {
  const task = () => {
    appendInteraction(turn).catch((err) => {
      console.log("[chatHistory] interaction persistence failed", err);
    });
  };
  try {
    after(task);
  } catch {
    task();
  }
}

export function recordConversationTurn(input: {
  userId: string;
  message: string;
  normalizedMessage: string;
  reply: string;
}): ConversationTurn {
  const turn: ConversationTurn = {
    id: randomUUID(),
    userId: input.userId,
    message: input.message,
    normalizedMessage: input.normalizedMessage,
    reply: input.reply,
    matched: !isFallbackReply(input.reply),
    createdAt: new Date().toISOString(),
  };

  const history = store.turnsByUser.get(input.userId) ?? [];
  history.push(turn);
  store.turnsByUser.set(
    input.userId,
    history.slice(-MAX_TURNS_PER_USER),
  );

  scheduleInteractionPersist(turn);
  return turn;
}

export function getConversationHistory(userId: string): ConversationTurn[] {
  return [...(store.turnsByUser.get(userId) ?? [])];
}

/**
 * Drops this process's in-memory turns for a user — part of revoking
 * consent (see /api/chat/revoke). Ephemeral anyway, but no reason to keep
 * serving them from this instance once the visitor has asked to be
 * forgotten.
 */
export function clearUserTurns(userId: string): void {
  store.turnsByUser.delete(userId);
}

export type KnowledgeBaseSuggestion = {
  normalizedMessage: string;
  count: number;
  examples: string[];
};

export function getKnowledgeBaseSuggestions(
  userId?: string,
): KnowledgeBaseSuggestion[] {
  const turns = userId
    ? getConversationHistory(userId)
    : Array.from(store.turnsByUser.values()).flat();

  const buckets = new Map<string, KnowledgeBaseSuggestion>();

  for (const turn of turns) {
    if (turn.matched) continue;

    const key = normalizeForSuggestions(turn.normalizedMessage);
    if (!key) continue;

    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      if (existing.examples.length < 3 && !existing.examples.includes(turn.message)) {
        existing.examples.push(turn.message);
      }
      continue;
    }

    buckets.set(key, {
      normalizedMessage: key,
      count: 1,
      examples: [turn.message],
    });
  }

  return [...buckets.values()].sort((a, b) => b.count - a.count);
}
