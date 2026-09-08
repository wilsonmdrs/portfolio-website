// src/lib/adminCorrections.ts
//
// Local-dev-only review queue for the /admin chatbot testing page. Plain
// JSON-file-backed store (no database, matching the rest of this app) at
// admin-data/corrections.json, git-ignored. Not meant to be read/written in
// production — routes calling into this module gate on NODE_ENV themselves.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { replayConversation } from "./riveBot";

const DATA_DIR = path.join(process.cwd(), "admin-data");
const DATA_FILE = path.join(DATA_DIR, "corrections.json");

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
   * and derives the actual trigger phrases / KEY / reply text / unknownhint
   * from it (see `suggestion`, below) — the admin doesn't author those.
   */
  instructions: string;
  /**
   * Drafted from `instructions` (by a coding session or the
   * /review-chat-corrections skill), never typed by the admin directly — a
   * proposed fix for the admin to review. `approved` is the signal that
   * this is ready to be written into the real .rive files as-is; if not,
   * `reviewNotes` says what should change before it's approved.
   */
  suggestion?: {
    triggerPhrases: string[];
    suggestedKey: string;
    unknownhint: string;
    correctAnswer: string;
    reasoning: string;
  };
  /**
   * Explicit sign-off that `suggestion` is ready to be written into the
   * real .rive files as-is — the signal a coding session should look for.
   * Not approved yet just means "still under review, may need a revision
   * note in `reviewNotes`."
   */
  approved?: boolean;
  /** What should change before this is approved, if it isn't already. */
  reviewNotes?: string;
  /**
   * Result of re-asking `conversation.message` against the live bot,
   * refreshed automatically (see /api/admin/corrections/replay) whenever
   * the corrections list loads for entries that are `approved` — lets the
   * admin see, without any manual step, whether a KB edit landed for this
   * correction yet.
   */
  replay?: {
    reply: string;
    vars: Record<string, unknown>;
    repliedAt: string;
  };
};

export type NewCorrectionInput = Omit<Correction, "id" | "createdAt">;

/**
 * Every read-modify-write against the file goes through this in-process
 * lock (a simple promise-chain mutex — this is a single Node process, so
 * this is sufficient, no cross-process file locking needed). Without it,
 * two nearly-simultaneous requests (e.g. two admin tabs both loading the
 * Corrections list, each triggering a replay pass) can each read the file,
 * mutate their own in-memory copy, and write back — the second write can
 * land mid-way through the first `fs.writeFile()` call, interleaving their
 * output into invalid JSON. Confirmed this happening in practice: a
 * corrupted file showed a `]` from one write immediately followed by a
 * timestamp fragment from a different write.
 */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readAll(): Promise<Correction[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(entries: Correction[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

export function listCorrections(): Promise<Correction[]> {
  return withLock(() => readAll());
}

export function appendCorrection(input: NewCorrectionInput): Promise<Correction> {
  return withLock(async () => {
    const entries = await readAll();
    const entry: Correction = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    entries.push(entry);
    await writeAll(entries);
    return entry;
  });
}

export function updateCorrection(
  id: string,
  patch: Partial<
    Pick<Correction, "instructions" | "suggestion" | "approved" | "reviewNotes" | "replay">
  >,
): Promise<Correction | null> {
  return withLock(async () => {
    const entries = await readAll();
    const index = entries.findIndex((entry) => entry.id === id);
    if (index === -1) return null;

    entries[index] = { ...entries[index], ...patch };
    await writeAll(entries);
    return entries[index];
  });
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
 * Re-runs every approved correction's original conversation (full prior
 * history + the flagged message) against the current knowledge base and
 * stores the fresh reply as `replay`. Called every time the admin
 * Corrections list loads (see CorrectionsList.tsx's load()) — safe to run
 * on every load because riveBot.ts's getBot() re-checks the KB's mtime
 * signature on every call, so this always sees the latest .rive content.
 */
export function replayApprovedCorrections(): Promise<Correction[]> {
  return withLock(async () => {
    const entries = await readAll();

    // One read, mutate the in-memory array across the whole loop, one
    // write at the end — not a read+write per entry (which is both
    // needlessly slow and was itself a source of the same interleaving
    // risk this lock exists to prevent, if this function's own iterations
    // were ever the two racing writers).
    for (const entry of entries) {
      if (!entry.approved) continue;
      const priorInputs = extractPriorInputs(entry.vars);
      const { reply, vars } = await replayConversation(priorInputs, entry.conversation.message);
      entry.replay = { reply, vars, repliedAt: new Date().toISOString() };
    }

    await writeAll(entries);
    return entries;
  });
}

export function deleteCorrection(id: string): Promise<boolean> {
  return withLock(async () => {
    const entries = await readAll();
    const next = entries.filter((entry) => entry.id !== id);
    if (next.length === entries.length) return false;
    await writeAll(next);
    return true;
  });
}
