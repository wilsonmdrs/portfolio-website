// src/lib/riveBot.ts
import RiveScript from "rivescript";
import { promises as fs } from "node:fs";
import path from "node:path";
import { preProcessEn } from "./textPreps.en";

const KB_ROOT = path.join(process.cwd(), "src", "knowledgeBase");

/** In-memory session registry: userId -> active */
const sessions = new Set<string>();

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

async function initBot(): Promise<RiveScript> {
  const bot = new RiveScript({ debug: false });

  const files = await readAllRiveFiles(KB_ROOT);
  for (const content of files) bot.stream(content, (e) => console.log(e));

  bot.sortReplies();
  return bot;
}

export async function getBot(): Promise<RiveScript> {
  if (!botPromise) botPromise = initBot();
  return botPromise;
}

/** Start a conversation for a given userId. Idempotent. */
export async function startConversation(userId: string): Promise<void> {
  if (!userId) throw new Error("userId is required");
  await getBot(); // ensure bot initialized
  sessions.add(userId);
}

/** Check if a conversation has been started for userId */
export function hasConversation(userId: string): boolean {
  return sessions.has(userId);
}

/** Optional: end a conversation (clear RiveScript user vars and session) */
export async function endConversation(userId: string): Promise<void> {
  const bot = await getBot();
  sessions.delete(userId);
  try {
    bot.clearUservars(userId); // clears memory for that user
  } catch {
    // ignore
  }
}

/** Ask a question on behalf of a started user session */

export async function ask(message: string, userId: string): Promise<string> {
  if (!message) throw new Error("message is required");
  if (!userId) throw new Error("userId is required");
  if (!hasConversation(userId)) {
    startConversation(userId);
  }

  // 1) Preprocess English input (expand contractions + normalize)
  const prep = preProcessEn(message, { expandContractions: true });

  console.log("Prep", prep);

  const bot = await getBot();

  // 2) (Optional) Store normalized text for debugging/introspection
  // try {
  //   await bot.setUservar(userId, "_norm", prep.normalized);
  // } catch {}

  // 3) Ask RiveScript with normalized English
  const reply = await bot.reply(userId, prep.normalized);
  console.log("Reply", reply);
  return reply;
}
