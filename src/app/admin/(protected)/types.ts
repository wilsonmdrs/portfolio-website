// src/app/admin/types.ts
export type Turn = {
  id: string;
  message: string;
  reply: string;
  vars: Record<string, unknown> | null;
};

const CURATED_VAR_KEYS = [
  "currentSession",
  "userIntention",
  "botIntention",
  "name",
  "unknownStreak",
] as const;

/** Split a raw uservars snapshot into the small set worth showing up front vs. everything else. */
export function splitVars(vars: Record<string, unknown> | null) {
  if (!vars) return { curated: {}, rest: {} };

  const curated: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(vars)) {
    if ((CURATED_VAR_KEYS as readonly string[]).includes(key) || key.startsWith("ctrl_")) {
      curated[key] = value;
    } else {
      rest[key] = value;
    }
  }

  return { curated, rest };
}
