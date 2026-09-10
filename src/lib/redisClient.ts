// src/lib/redisClient.ts
//
// Shared Redis client singleton for both chat interaction logging
// (interactionLog.ts) and the admin corrections queue (adminCorrections.ts)
// — one lazily-connected, memoized client per process rather than each
// module opening its own connection to the same database.
//
// Uses the `redis` package (standard Redis wire protocol, node-redis v4+
// client — camelCase multi-word commands: rPush/lRange/hGetAll/hSet/...),
// not a REST-based client — the provisioned database is a real Redis
// instance (Redis Cloud/Enterprise, given a `redis://` connection string
// with an embedded password), not Upstash's REST API, despite the env
// var's name.
//
// Two things matter here that a REST client wouldn't need: (1) the client
// is only actually connected once, lazily, memoized (module-level
// singleton) — `.connect()` is called at most once per warm process, not
// per request; (2) an `error` listener is mandatory — node-redis (like
// most TCP clients) treats an unhandled `error` event as an uncaught
// exception, which can crash the process, not just fail the one call.
//
// Never throws, by design: if the connection string isn't set (fresh
// local dev before Redis is configured, the vitest suite, or a
// misconfigured prod deploy) or the database is unreachable, callers get
// `null` and quietly no-op — same principle already used for
// semanticFallback.ts/typoCorrection.ts's local-model failures.
import { createClient, type RedisClientType } from "redis";

let clientPromise: Promise<RedisClientType | null> | undefined;

export function getRedisClient(): Promise<RedisClientType | null> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const url = process.env.UPSTASH_REDIS_REST_REDIS_URL;
    if (!url) {
      console.log("[redisClient] REDIS_URL not set — persistence disabled");
      return null;
    }
    try {
      const client: RedisClientType = createClient({ url });
      client.on("error", (err) => {
        console.log("[redisClient] Redis connection error", err);
      });
      await client.connect();
      return client;
    } catch (err) {
      console.log("[redisClient] failed to connect to Redis", err);
      return null;
    }
  })();

  return clientPromise;
}
