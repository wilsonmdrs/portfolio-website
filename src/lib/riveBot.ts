// src/lib/riveBot.ts
import RiveScript from "rivescript";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { recordConversationTurn } from "./chatHistory";
import { preProcessEn } from "./textPreps.en";

const KB_ROOT = path.join(process.cwd(), "src", "knowledgeBase");

/**
 * The browser sends a stable, long-lived `userId` (persisted in
 * localStorage) that identifies the visitor across separate visits — it's
 * what chat history (chatHistory.ts) is keyed by.
 *
 * That's a different concept from a RiveScript *session*: `currentSession`
 * (opening/development/closing) should start fresh every time a
 * conversation actually begins, not stay stuck wherever it was left days
 * ago just because the visitor's browser id never changes. So each call to
 * startConversation() mints a brand-new session id and this map remembers
 * which one is currently active for a given visitor. RiveScript's uservar
 * store (name, botIntention, ctrl_*, currentSession, ...) is keyed by that
 * session id, not the visitor id — a returning visitor keeps their chat
 * history, but the bot starts a clean slate each session (matching a real
 * conversation: you'd re-introduce yourself to someone you haven't spoken
 * to in a while).
 */
const activeSessions = new Map<string, string>(); // visitor userId -> session id

// Singleton bot loader
let botPromise: Promise<RiveScript> | null = null;

// Freelance work at Exact Code Sistemas began here (see cv_roles in
// begin.rive) — the start of Wilson's continuous professional experience.
const EXPERIENCE_START = Date.UTC(2017, 2, 1); // month is 0-indexed: 2 = March

/**
 * Whole years elapsed from EXPERIENCE_START to now, floored (so it only
 * ticks over on the actual March 1st anniversary, not just the new year).
 * Recomputed fresh each time a session starts (see startConversation()
 * below) rather than hardcoded in a .rive file, so it never goes stale —
 * the whole reason this exists instead of a literal "9 years" in cv.rive.
 */
function calculateYearsOfExperience(now: Date = new Date()): number {
  const start = new Date(EXPERIENCE_START);
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  const beforeAnniversaryThisYear =
    now.getUTCMonth() < start.getUTCMonth() ||
    (now.getUTCMonth() === start.getUTCMonth() && now.getUTCDate() < start.getUTCDate());
  if (beforeAnniversaryThisYear) years -= 1;
  return years;
}

async function readAllRiveFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const contents: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      contents.push(...(await readAllRiveFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".rive")) {
      const file = await fs.readFile(full, "utf8");
      contents.push(file);
    }
  }
  return contents;
}

/**
 * Debug macro: logs the session id, userIntention, botIntention,
 * currentSession, and the full uservar set for a given RiveScript session.
 * Called automatically after every reply in ask() below; also registered
 * as a RiveScript object macro ("logvars") so it can be dropped into any
 * .rive reply manually via <call>logvars <id></call> for one-off debugging.
 */
async function logInteractionVars(bot: RiveScript, sessionId: string): Promise<void> {
  const vars = await bot.getUservars(sessionId);
  console.log(
    `[riveBot] session=${sessionId} currentSession=${vars.currentSession ?? "undefined"} userIntention=${vars.userIntention ?? "undefined"} botIntention=${vars.botIntention ?? "undefined"}`,
    vars,
  );
}

async function initBot(): Promise<RiveScript> {
  const bot = new RiveScript({ debug: false });

  const files = await readAllRiveFiles(KB_ROOT);
  for (const content of files) bot.stream(content, (e) => console.log(e));

  bot.sortReplies();

  bot.setSubroutine("logvars", async (rs, args) => {
    await logInteractionVars(bot, args[0]);
    return "";
  });

  return bot;
}

async function collectRiveFilePaths(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) paths.push(...(await collectRiveFilePaths(full)));
    else if (entry.isFile() && entry.name.endsWith(".rive")) paths.push(full);
  }
  return paths;
}

/** mtimes of every .rive file, joined — changes whenever any of them is edited. */
async function computeKbSignature(): Promise<string> {
  const files = await collectRiveFilePaths(KB_ROOT);
  const stats = await Promise.all(
    files.sort().map(async (file) => `${file}:${(await fs.stat(file)).mtimeMs}`),
  );
  return stats.join("|");
}

let botSignature = "";

/**
 * Checked fresh on every call (dev only — a no-op in production, where
 * .rive files never change at runtime) instead of relying on a background
 * watcher/timer to notice edits and invalidate a cached bot. A prior
 * fs.watch-based version, and later a setInterval-polling version, both
 * proved unreliable in practice: edits sometimes silently weren't picked
 * up (confirmed more than once — a verified-correct .rive fix kept
 * replaying its old, wrong answer until a server restart or an unrelated
 * extra file touch nudged it). Re-checking the mtime signature on every
 * actual use, rather than on a timer that can silently stop firing or
 * belong to a different module instance than the one serving a given
 * request, removes that whole class of bug — the cost is a handful of
 * cheap fs.stat calls per request, negligible for local dev tooling.
 */
export async function getBot(): Promise<RiveScript> {
  if (process.env.NODE_ENV !== "production") {
    try {
      const sig = await computeKbSignature();
      if (sig !== botSignature) {
        botSignature = sig;
        botPromise = initBot();
      }
    } catch (err) {
      console.log("[riveBot] KB signature check failed, using cached bot", err);
    }
  }
  if (!botPromise) botPromise = initBot();
  return botPromise;
}

/**
 * Start a conversation for a given visitor. Mints a fresh, unique
 * RiveScript session id for this visitor every time it's called — this is
 * the "the user should have a unique id when the session starts" piece —
 * and seeds currentSession=opening on it. Safe to call again for a visitor
 * who already has an active session: it simply starts a new one.
 */
export async function startConversation(userId: string): Promise<void> {
  if (!userId) throw new Error("userId is required");
  const bot = await getBot();

  const sessionId = randomUUID();
  activeSessions.set(userId, sessionId);
  await bot.setUservar(sessionId, "currentSession", "opening");
  // Per-session, not a global `! var` despite the cv_ prefix matching the
  // naming convention for CV facts elsewhere in begin.rive — it has to be
  // read via <get cv_experience_years> in .rive replies, not <bot ...>.
  await bot.setUservar(sessionId, "cv_experience_years", String(calculateYearsOfExperience()));
}

/** Check if a conversation has been started for userId */
export function hasConversation(userId: string): boolean {
  return activeSessions.has(userId);
}

/**
 * Look up the full RiveScript uservar snapshot for a visitor's active
 * session — the same data logInteractionVars() prints to console, but
 * returned for callers (the admin page) that need to render it instead of
 * just logging it. Returns null if the visitor has no active session.
 */
export async function getSessionVars(userId: string): Promise<Record<string, unknown> | null> {
  const sessionId = activeSessions.get(userId);
  if (!sessionId) return null;
  const bot = await getBot();
  return bot.getUservars(sessionId);
}

/** Optional: end a conversation (clear RiveScript session vars) */
export async function endConversation(userId: string): Promise<void> {
  const bot = await getBot();
  const sessionId = activeSessions.get(userId);
  activeSessions.delete(userId);
  if (!sessionId) return;
  try {
    bot.clearUservars(sessionId); // clears memory for that session
  } catch {
    // ignore
  }
}

/**
 * Replay a full conversation (oldest message first) against the current
 * knowledge base in a throwaway session — not tied to any visitor/admin
 * tab, never recorded into chatHistory. Returns the reply to the LAST
 * message, i.e. the one that was originally flagged.
 *
 * Replaying only the flagged message in isolation is not equivalent to
 * what actually happened: RiveScript's `%` (Previous) triggers match
 * against the bot's immediately preceding reply, so a single-message
 * replay silently loses that context and can produce a *different* wrong
 * reply that looks "changed" but was never actually fixed. Feeding the
 * whole prior exchange back in first reconstructs that context, the same
 * way the real session built it up turn by turn.
 *
 * `priorInputs` must already be normalized (this is exactly what
 * RiveScript's own `__history__.input` stores, since ask() below always
 * calls bot.reply() with prep.normalized) — do not re-preprocess them.
 */
export async function replayConversation(
  priorInputs: string[],
  finalMessage: string,
): Promise<{ reply: string; vars: Record<string, unknown> }> {
  if (!finalMessage) throw new Error("finalMessage is required");
  const bot = await getBot();

  const sessionId = randomUUID();
  await bot.setUservar(sessionId, "currentSession", "opening");
  await bot.setUservar(sessionId, "cv_experience_years", String(calculateYearsOfExperience()));

  for (const input of priorInputs) {
    await bot.reply(sessionId, input);
  }

  const prep = preProcessEn(finalMessage, { expandContractions: true });
  const reply = await bot.reply(sessionId, prep.normalized);
  const vars = await bot.getUservars(sessionId);
  try {
    bot.clearUservars(sessionId);
  } catch {
    // ignore
  }
  return { reply, vars };
}

/** Ask a question on behalf of a started user session */

export async function ask(message: string, userId: string): Promise<string> {
  if (!message) throw new Error("message is required");
  if (!userId) throw new Error("userId is required");
  if (!hasConversation(userId)) {
    await startConversation(userId);
  }
  const sessionId = activeSessions.get(userId) as string;

  // 1) Preprocess English input (expand contractions + normalize)
  const prep = preProcessEn(message, { expandContractions: true });

  console.log("Prep", prep);

  const bot = await getBot();

  // 2) (Optional) Store normalized text for debugging/introspection
  // try {
  //   await bot.setUservar(sessionId, "_norm", prep.normalized);
  // } catch {}

  // 3) Ask RiveScript with normalized English, scoped to this session
  const reply = await bot.reply(sessionId, prep.normalized);
  await logInteractionVars(bot, sessionId);
  recordConversationTurn({
    userId,
    message,
    normalizedMessage: prep.normalized,
    reply,
  });
  console.log("Reply", reply);
  return reply;
}
