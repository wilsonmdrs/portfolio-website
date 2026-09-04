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

export async function getBot(): Promise<RiveScript> {
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
}

/** Check if a conversation has been started for userId */
export function hasConversation(userId: string): boolean {
  return activeSessions.has(userId);
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
