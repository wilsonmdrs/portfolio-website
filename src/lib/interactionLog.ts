// src/lib/interactionLog.ts
//
// Persistent, cross-request chat interaction log backed by Redis. This
// exists because chatHistory.ts's in-memory Map does not reliably survive
// Vercel's serverless/ephemeral execution model — different requests can
// land on different, short-lived containers. See redisClient.ts for the
// shared connection (also used by adminCorrections.ts) and why it never
// throws.
//
// Never breaks the chat itself, by design: if getRedisClient() returns
// null (Redis unset/unreachable), every function here becomes a no-op —
// same principle already used for semanticFallback.ts/typoCorrection.ts's
// local-model failures.
import { getRedisClient as getClient } from "./redisClient";
import type { ConversationTurn } from "./chatHistory";

const LOG_KEY = "chat:interactions";
// ~months of history at a personal-portfolio-site scale (dozens to hundreds
// of turns a day) — a plain capped list, not per-user and not a sorted set.
// Read side groups by userId in JS after a full LRANGE — at this cap (3000
// small JSON entries), that's cheap, and avoids maintaining a separate
// per-session index just to answer "show me sessions, newest first."
const MAX_ENTRIES = 3000;

export async function appendInteraction(turn: ConversationTurn): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    await redis.rPush(LOG_KEY, JSON.stringify(turn));
    await redis.lTrim(LOG_KEY, -MAX_ENTRIES, -1);
  } catch (err) {
    console.log("[interactionLog] failed to persist interaction", err);
  }
  await bumpDailyStats(turn.userId, turn.matched);
}

// Durable per-day counters for the admin dashboard's graphs — deliberately
// separate from chat:interactions (capped, and purged per-user by
// deleteSession/revoke below) so a deleted or revoked session doesn't
// retroactively change what a past day's chart showed. Bumped in real
// time as each turn happens, one Hash per day: "messages"/"unmatched"
// increment on every turn; "sessions" increments once per userId per day
// (STATS_LAST_SEEN_KEY tracks the last day each userId was already
// counted on, so a multi-turn conversation only adds 1 to that day's
// session count, not once per message).
const STATS_DAILY_PREFIX = "stats:daily:";
const STATS_LAST_SEEN_KEY = "stats:lastSeenDay";

async function bumpDailyStats(userId: string, matched: boolean): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const key = `${STATS_DAILY_PREFIX}${day}`;
    await redis.hIncrBy(key, "messages", 1);
    if (!matched) await redis.hIncrBy(key, "unmatched", 1);

    const lastSeenDay = await redis.hGet(STATS_LAST_SEEN_KEY, userId);
    if (lastSeenDay !== day) {
      await redis.hIncrBy(key, "sessions", 1);
      await redis.hSet(STATS_LAST_SEEN_KEY, userId, day);
    }
  } catch (err) {
    console.log("[interactionLog] failed to bump daily stats", err);
  }
}

export type DailyStat = { day: string; sessions: number; messages: number; unmatched: number };

/** One entry per day for the last `days` days (oldest first), zero-filled for days with no activity. */
export async function getDailyStats(days: number): Promise<DailyStat[]> {
  const out: DailyStat[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push({ day: d.toISOString().slice(0, 10), sessions: 0, messages: 0, unmatched: 0 });
  }

  const redis = await getClient();
  if (!redis) return out;
  try {
    for (const stat of out) {
      const raw = await redis.hGetAll(`${STATS_DAILY_PREFIX}${stat.day}`);
      stat.sessions = Number(raw.sessions ?? 0);
      stat.messages = Number(raw.messages ?? 0);
      stat.unmatched = Number(raw.unmatched ?? 0);
    }
  } catch (err) {
    console.log("[interactionLog] failed to read daily stats", err);
  }
  return out;
}

async function getAllTurns(): Promise<ConversationTurn[]> {
  const redis = await getClient();
  if (!redis) return [];
  try {
    const raw = await redis.lRange(LOG_KEY, 0, -1); // oldest first
    return raw
      .map((entry) => {
        try {
          return JSON.parse(entry) as ConversationTurn;
        } catch {
          return null;
        }
      })
      .filter((t): t is ConversationTurn => t !== null);
  } catch (err) {
    console.log("[interactionLog] failed to read interactions", err);
    return [];
  }
}

export type SessionSummary = {
  userId: string;
  firstMessage: string;
  messageCount: number;
  unmatchedCount: number;
  firstAt: string;
  lastAt: string;
};

/** One row per session (userId), most recently active first. */
export async function getSessions(): Promise<SessionSummary[]> {
  const turns = await getAllTurns();
  const byUser = new Map<string, ConversationTurn[]>();
  for (const turn of turns) {
    const existing = byUser.get(turn.userId);
    if (existing) existing.push(turn);
    else byUser.set(turn.userId, [turn]);
  }

  const summaries: SessionSummary[] = [];
  for (const [userId, sessionTurns] of byUser) {
    // Entries for the same userId are already in chronological order —
    // they were appended in real time as that session's turns happened,
    // even though other sessions' turns are interleaved between them in
    // the shared list.
    summaries.push({
      userId,
      firstMessage: sessionTurns[0].message,
      messageCount: sessionTurns.length,
      unmatchedCount: sessionTurns.filter((t) => !t.matched).length,
      firstAt: sessionTurns[0].createdAt,
      lastAt: sessionTurns[sessionTurns.length - 1].createdAt,
    });
  }

  summaries.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return summaries;
}

/** Every turn for one session, in chronological order. */
export async function getSessionInteractions(userId: string): Promise<ConversationTurn[]> {
  const turns = await getAllTurns();
  return turns.filter((t) => t.userId === userId);
}

/**
 * Removes every turn for one session from the shared list. Unlike the
 * write/read paths above, this is an explicit admin action the caller
 * needs to know the outcome of — so it returns false on failure instead
 * of silently no-op'ing, letting the API route surface a real error to
 * the admin UI's toast rather than pretending it worked.
 *
 * Redis has no "delete matching entries" list command, so this reads the
 * whole list, filters out the target session, and replaces the list
 * contents in a MULTI so a concurrent append can't land between the
 * DEL and the RPUSH and get silently dropped.
 */
const REVOKED_KEY = "chat:revoked";
// Same cap/rationale as MAX_ENTRIES above — a plain capped list, not a
// per-day index. The admin dashboard buckets these by day in JS at read
// time (see admin/(protected)/page.tsx), same as it already does for
// sessions from getSessions() below.
const MAX_REVOKED_ENTRIES = 3000;

export type Revocation = { userId: string; revokedAt: string };

/**
 * Records that a visitor withdrew consent — kept separately from
 * chat:interactions (which deleteSession below purges for this userId) so
 * the admin dashboard can still show "N sessions revoked" as a count even
 * though the actual conversation content is gone. Just a userId + a
 * timestamp, no message content.
 */
export async function recordRevocation(userId: string): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    const entry: Revocation = { userId, revokedAt: new Date().toISOString() };
    await redis.rPush(REVOKED_KEY, JSON.stringify(entry));
    await redis.lTrim(REVOKED_KEY, -MAX_REVOKED_ENTRIES, -1);
  } catch (err) {
    console.log("[interactionLog] failed to persist revocation", err);
  }
}

/** Every recorded revocation, oldest first. */
export async function getRevocations(): Promise<Revocation[]> {
  const redis = await getClient();
  if (!redis) return [];
  try {
    const raw = await redis.lRange(REVOKED_KEY, 0, -1);
    return raw
      .map((entry) => {
        try {
          return JSON.parse(entry) as Revocation;
        } catch {
          return null;
        }
      })
      .filter((r): r is Revocation => r !== null);
  } catch (err) {
    console.log("[interactionLog] failed to read revocations", err);
    return [];
  }
}

export async function deleteSession(userId: string): Promise<boolean> {
  const redis = await getClient();
  if (!redis) return false;
  try {
    const turns = await getAllTurns();
    const remaining = turns.filter((t) => t.userId !== userId).map((t) => JSON.stringify(t));
    const multi = redis.multi();
    multi.del(LOG_KEY);
    if (remaining.length > 0) multi.rPush(LOG_KEY, remaining);
    await multi.exec();
    return true;
  } catch (err) {
    console.log("[interactionLog] failed to delete session", err);
    return false;
  }
}
