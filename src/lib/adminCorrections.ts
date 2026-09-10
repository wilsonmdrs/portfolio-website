// src/lib/adminCorrections.ts
//
// Review queue for the /admin chatbot testing page, backed by a Redis Hash
// (CORRECTIONS_KEY, field = correction id, value = JSON) via the same
// shared client chat history uses — see redisClient.ts. A Hash (not a
// list, unlike interactionLog.ts's chat log) is the right structure here
// because this store needs get/set/delete BY ID, which a Hash gives as
// single atomic commands (hGet/hSet/hDel) — no read-modify-write-the-
// whole-thing race to guard against, unlike a JSON file or a list.
import { randomUUID } from "node:crypto";
import { getRedisClient } from "./redisClient";
import { replayConversation } from "./riveBot";

const CORRECTIONS_KEY = "admin:corrections";

export type Correction = {
  id: string;
  createdAt: string;
  sessionUserId: string;
  conversation: {
    message: string;
    reply: string;
  };
  /** Full uservar snapshot from getSessionVars() at the time of capture. */
  vars: Record<string, unknown>;
  /**
   * The admin's directive — what should change, in their own words. NOT the
   * literal bot reply and NOT a KEY: e.g. "the bot should suggest a new
   * subject" rather than a drafted sentence. A coding session reads this
   * (and `reviewNotes`, below) and derives the actual trigger phrases /
   * KEY / reply text / unknownhint from it — the admin doesn't author
   * those directly, and edits the real .rive files straight from this
   * plus `reviewNotes`, no separate approval step required.
   */
  instructions: string;
  /**
   * Optional drafted fix (by a coding session or the
   * /review-chat-corrections skill), never typed by the admin directly —
   * extra context for whoever edits the KB next. Purely informational:
   * nothing in this app requires it before a correction can be acted on.
   */
  suggestion?: {
    triggerPhrases: string[];
    suggestedKey: string;
    unknownhint: string;
    correctAnswer: string;
    reasoning: string;
  };
  /**
   * The admin looked at the latest `replay` and it still isn't right —
   * flags this entry for another local KB-editing pass. Purely a signal
   * for the admin/coding session; nothing here gates on it.
   */
  needsReedit?: boolean;
  /** What should change on the next edit pass — the admin's own notes. */
  reviewNotes?: string;
  /**
   * Result of re-asking `conversation.message` against the live bot,
   * refreshed automatically (see /api/admin/corrections/replay) every
   * time the corrections list loads, for every entry — lets the admin
   * see, without any manual step, whether a KB edit landed yet.
   */
  replay?: {
    reply: string;
    vars: Record<string, unknown>;
    repliedAt: string;
  };
};

export type NewCorrectionInput = Omit<Correction, "id" | "createdAt">;

function parseEntry(raw: string): Correction | null {
  try {
    return JSON.parse(raw) as Correction;
  } catch {
    return null;
  }
}

async function readAll(): Promise<Correction[]> {
  const redis = await getRedisClient();
  if (!redis) return [];
  const raw = await redis.hGetAll(CORRECTIONS_KEY);
  return Object.values(raw)
    .map(parseEntry)
    .filter((entry): entry is Correction => entry !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function listCorrections(): Promise<Correction[]> {
  return readAll();
}

export async function appendCorrection(input: NewCorrectionInput): Promise<Correction> {
  const entry: Correction = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const redis = await getRedisClient();
  if (redis) await redis.hSet(CORRECTIONS_KEY, entry.id, JSON.stringify(entry));
  return entry;
}

export async function updateCorrection(
  id: string,
  patch: Partial<
    Pick<Correction, "instructions" | "suggestion" | "needsReedit" | "reviewNotes" | "replay">
  >,
): Promise<Correction | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const raw = await redis.hGet(CORRECTIONS_KEY, id);
  if (!raw) return null;
  const current = parseEntry(raw);
  if (!current) return null;

  const updated: Correction = { ...current, ...patch };
  await redis.hSet(CORRECTIONS_KEY, id, JSON.stringify(updated));
  return updated;
}

/**
 * The RiveScript uservar snapshot stores `__history__.input` most-recent-
 * first, already normalized (see riveBot.ts's ask()), padded with the
 * literal string "undefined" for unused slots, and index 0 is the
 * flagged message itself. This pulls out everything BEFORE it, oldest
 * first, so replayConversation() can rebuild the `%`-Previous context the
 * original session had — without that, a `%`-scoped trigger has nothing
 * to match against and a replay can look "changed" while still broken.
 */
function extractPriorInputs(vars: Record<string, unknown>): string[] {
  const history = vars.__history__ as { input?: unknown } | undefined;
  const input = Array.isArray(history?.input) ? history.input : [];
  return input
    .slice(1)
    .filter((entry): entry is string => typeof entry === "string" && entry !== "undefined")
    .reverse();
}

/**
 * Re-runs one correction's original conversation (full prior history +
 * the flagged message) against the current knowledge base, stores the
 * fresh reply as `replay`, and returns the updated entry — shared by
 * replayAllCorrections (below) and replayCorrection's single-entry path.
 */
async function replayEntry(entry: Correction): Promise<Correction> {
  const priorInputs = extractPriorInputs(entry.vars);
  const { reply, vars } = await replayConversation(priorInputs, entry.conversation.message);
  entry.replay = { reply, vars, repliedAt: new Date().toISOString() };
  return entry;
}

/**
 * Re-runs every correction's original conversation against the current
 * knowledge base. Called every time the admin Corrections list loads (see
 * CorrectionsList.tsx's load()) — safe to run on every load because
 * riveBot.ts's getBot() re-checks the KB's mtime signature on every call,
 * so this always sees the latest .rive content, and each entry's `hSet`
 * below is its own atomic write (no batching needed, unlike the old
 * JSON-file version of this store).
 */
export async function replayAllCorrections(): Promise<Correction[]> {
  const redis = await getRedisClient();
  if (!redis) return [];

  const entries = await readAll();
  for (const entry of entries) {
    await replayEntry(entry);
    await redis.hSet(CORRECTIONS_KEY, entry.id, JSON.stringify(entry));
  }
  return entries;
}

/**
 * Re-runs just one correction — for the per-item "Recheck" button, so
 * checking on a single fix in progress doesn't also re-replay every other
 * entry in the queue. Returns null if the id doesn't exist.
 */
export async function replayCorrection(id: string): Promise<Correction | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const raw = await redis.hGet(CORRECTIONS_KEY, id);
  if (!raw) return null;
  const entry = parseEntry(raw);
  if (!entry) return null;

  await replayEntry(entry);
  await redis.hSet(CORRECTIONS_KEY, id, JSON.stringify(entry));
  return entry;
}

export async function deleteCorrection(id: string): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) return false;
  const removed = await redis.hDel(CORRECTIONS_KEY, id);
  return removed > 0;
}
