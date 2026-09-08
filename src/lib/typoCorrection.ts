// src/lib/typoCorrection.ts
//
// Corrects likely typos in a message that failed to match any RiveScript
// trigger, using a local masked-language model (zero cost, zero network
// call — same vendoring approach as semanticFallback.ts). Unlike
// semanticFallback.ts, a correction from here is never a guess about
// *topic*: riveBot.ts only ever uses a correction after re-asking
// RiveScript with it and confirming that produces a REAL trigger match
// (not the catch-all again) — so this only ever fixes spelling, then lets
// the existing, trusted trigger system decide the actual answer. That's
// why this doesn't need a confirmation step the way semantic fallback
// does.
//
// Design notes from empirical testing (a throwaway tuning script, run
// before this file was written):
// - This library's fill-mask pipeline only ever fills the FIRST [MASK]
//   token in an input and silently drops the rest (confirmed by reading
//   its source — it does `ids.findIndex(x => x == mask_token_id)`). A
//   multi-typo message therefore needs sequential masking — one
//   suspicious word at a time, left to right, using the already-corrected
//   working sentence as context for the next one — not one call with
//   multiple [MASK] tokens.
// - Masking a word while OTHER typos remain elsewhere in the sentence
//   badly confuses the model (predicts subword garbage) — another reason
//   corrections must be applied incrementally, not all at once from a
//   single pass over the original text.
// - The model's raw top-1 prediction is often not what's wanted (e.g. for
//   "what are your [MASK]" it prefers punctuation over "skills" — this
//   model has no CV-domain fine-tuning). Candidates are therefore first
//   filtered by edit distance to the original typo (closer spelling
//   wins), THEN by model confidence as a plausibility gate — not the
//   other way around.
// - A minimum absolute confidence is required before accepting ANY
//   candidate. Without it, this produced real, observed false positives:
//   "ana" -> "mama" at score 0.003, "skils" -> "sins" at score 0.002 —
//   both technically the "best available" edit-distance match, but the
//   model had essentially no real signal either way. Rejecting weak
//   guesses and leaving the word alone (falling through to whatever
//   would otherwise happen) is always safer than a confident-looking but
//   baseless substitution.
// - A single-word message ("helo") gives the model no sentence context
//   to predict from at all (masking the only word yields near-random
//   punctuation). Left uncorrected by design — semantic fallback or the
//   existing generic catch-all handle it instead, same as before this
//   feature existed.
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline, env, type FillMaskPipeline } from "@huggingface/transformers";

env.allowRemoteModels = false;
env.localModelPath = "src/models";

const KB_ROOT = path.join(process.cwd(), "src", "knowledgeBase");
const MODEL_ID = "Xenova/distilbert-base-uncased";

// Common English function words the KB's own trigger text wouldn't
// naturally contain much of — without these, ordinary grammar words get
// flagged as "suspicious" just because they're rare in domain-specific
// trigger phrasing.
const COMMON_WORDS = [
  "i", "you", "he", "she", "it", "we", "they", "am", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "can", "could", "shall", "should", "may", "might", "must", "the",
  "a", "an", "and", "or", "but", "if", "then", "else", "for", "to", "of", "in",
  "on", "at", "by", "with", "from", "as", "this", "that", "these", "those",
  "my", "your", "his", "her", "its", "our", "their", "me", "him", "them", "us",
  "not", "no", "ok", "yes",
];

const MIN_SCORE = 0.02;
const MAX_EDIT_DISTANCE = 2;

/**
 * Single-word messages ("helo") give the masked-LM no sentence context to
 * predict from at all — confirmed by testing: masking the only word in a
 * one-word input yields near-random punctuation, not a useful guess. This
 * separate path handles that case without the model at all: a tight
 * (distance-1 only — no sentence context means less margin for error)
 * edit-distance search against the same KB vocabulary, with ties broken
 * by this fixed priority list. Ties are common at this distance (e.g.
 * "helo" is equidistant from "hello" and "help") and a lone word is by
 * far most likely an attempted greeting, so greetings are checked first.
 * Whatever this proposes still goes through the same replay-verification
 * gate as the sentence path (in riveBot.ts) before ever being used.
 */
const SINGLE_WORD_PRIORITY = ["hi", "hey", "hello", "howdy", "yo", "cv", "resume", "skills", "help"];
const SINGLE_WORD_MAX_DISTANCE = 1;

function singleWordPriorityRank(word: string): number {
  const index = SINGLE_WORD_PRIORITY.indexOf(word);
  return index === -1 ? SINGLE_WORD_PRIORITY.length : index;
}

let vocabPromise: Promise<Set<string>> | null = null;

/**
 * Words considered "already known" and never masked/corrected — every
 * word appearing in a trigger (`+`) or array (`! array`) line across the
 * whole KB, plus a small common-English-word list. Built from trigger
 * text specifically (not reply prose), same technique used to build the
 * vocabulary in semanticFallback.ts's tuning script.
 */
async function getVocabulary(): Promise<Set<string>> {
  if (!vocabPromise) {
    vocabPromise = (async () => {
      const vocab = new Set(COMMON_WORDS);
      const files = await fs.readdir(KB_ROOT);
      for (const file of files) {
        if (!file.endsWith(".rive")) continue;
        const content = await fs.readFile(path.join(KB_ROOT, file), "utf8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("+") || trimmed.startsWith("! array")) {
            for (const word of trimmed.toLowerCase().match(/[a-z]+/g) ?? []) {
              if (word.length >= 2) vocab.add(word);
            }
          }
        }
      }
      return vocab;
    })();
  }
  return vocabPromise;
}

let extractorPromise: Promise<FillMaskPipeline> | null = null;
async function getFillMask(): Promise<FillMaskPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("fill-mask", MODEL_ID, { dtype: "q8" });
  }
  return extractorPromise;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Name-capture lead-in phrases from greetings.rive's own triggers,
 * word-tokenized. Capitalization is not a reliable enough signal that a
 * word is a name — real users often type names lowercase ("call me
 * ana") — confirmed by testing that this let "ana" get "corrected" to
 * "an" when a genuine typo elsewhere in the same message ("cal" for
 * "call") also triggered correction. If the message's own words fuzzy-
 * match one of these lead-ins (allowing a typo in the lead-in itself,
 * which is exactly the case that needs fixing), everything AFTER that
 * lead-in is the free-text name slot the real trigger's own `*` wildcard
 * would capture — never a candidate for correction, regardless of case.
 */
const NAME_LEAD_INS = [
  ["you", "can", "call", "me"],
  ["my", "name", "is"],
  ["call", "me"],
  ["it", "is"],
  ["i", "am"],
];

function findNameLeadInEnd(working: string[]): number | null {
  for (const leadIn of NAME_LEAD_INS) {
    if (working.length <= leadIn.length) continue; // must have at least one word after it
    if (leadIn.every((w, i) => levenshtein(working[i], w) <= 1)) return leadIn.length;
  }
  return null;
}

async function correctSingleWord(rawWord: string, originalMessage: string): Promise<TypoCorrectionResult> {
  const noChange: TypoCorrectionResult = { corrected: originalMessage, changed: false, corrections: [] };
  const lower = rawWord.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.length < 2) return noChange;

  const vocab = await getVocabulary();
  if (vocab.has(lower)) return noChange; // already a real, known word

  let bestDistance = Infinity;
  let candidates: string[] = [];
  for (const word of vocab) {
    const dist = levenshtein(lower, word);
    if (dist < bestDistance) {
      bestDistance = dist;
      candidates = [word];
    } else if (dist === bestDistance) {
      candidates.push(word);
    }
  }
  if (bestDistance > SINGLE_WORD_MAX_DISTANCE || candidates.length === 0) return noChange;

  candidates.sort((a, b) => singleWordPriorityRank(a) - singleWordPriorityRank(b));
  const best = candidates[0];
  return { corrected: best, changed: true, corrections: [{ from: rawWord, to: best, score: 1 }] };
}

export type TypoCorrectionResult = {
  corrected: string;
  changed: boolean;
  corrections: { from: string; to: string; score: number }[];
};

/**
 * Attempts to fix likely typos in `message`. Operates on the RAW
 * (un-normalized) message, not RiveScript-normalized text, specifically
 * to keep capitalization available as a signal for "this is probably a
 * proper noun, don't touch it" — normalization lowercases everything
 * before this would ever see it.
 */
export async function correctTypos(message: string): Promise<TypoCorrectionResult> {
  const rawWords = message.trim().split(/\s+/).filter(Boolean);
  const noChange: TypoCorrectionResult = { corrected: message, changed: false, corrections: [] };
  if (rawWords.length === 0) return noChange;
  if (rawWords.length === 1) return correctSingleWord(rawWords[0], message);

  const vocab = await getVocabulary();
  const working = rawWords.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""));
  const protectedFrom = findNameLeadInEnd(working);

  const isSuspicious = (raw: string, index: number): boolean => {
    const lower = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (lower.length < 2) return false;
    if (protectedFrom !== null && index >= protectedFrom) return false; // the free-text name slot itself
    if (/^[A-Z]/.test(raw) && index !== 0) return false; // looks like a proper noun
    return lower.length > 0 && !vocab.has(lower);
  };

  const suspiciousIndices = working
    .map((_, i) => i)
    .filter((i) => working[i].length > 0 && isSuspicious(rawWords[i], i));

  if (suspiciousIndices.length === 0) return noChange;

  // Draft pass: a rough, context-free vocabulary guess for every
  // suspicious word, used ONLY to give the refinement pass below
  // something better than a raw typo to look at for the OTHER suspicious
  // positions. Two adjacent typos each poison the model's context for the
  // other (confirmed by testing: "you can cal mew hannah" — masking "cal"
  // while "mew" is still a visible typo predicts nothing close to "call"
  // at all, since "mew" breaks the local grammar the model relies on).
  // A rough draft need not be right on its own — it only has to be
  // "closer to real English" than the original typo for the refinement
  // pass to work with, and a wrong draft is caught by the replay
  // verification in riveBot.ts before ever being used, so there's no
  // safety cost to being liberal here.
  const draft = [...working];
  for (const i of suspiciousIndices) {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const word of vocab) {
      const dist = levenshtein(working[i], word);
      if (dist < bestDist) {
        bestDist = dist;
        best = word;
      }
    }
    if (best && bestDist <= MAX_EDIT_DISTANCE) draft[i] = best;
  }

  // Refinement pass: mask each suspicious position using the DRAFT (not
  // the raw typos) for every OTHER suspicious position, so the model sees
  // plausible English around the word it's actually predicting. Falls
  // back to the draft guess for a position if refinement can't find a
  // confident candidate of its own (rather than reverting to the
  // original typo) — the draft was often already right in testing, just
  // not independently confirmable by the model in isolation.
  const refined = [...draft];
  const corrections: TypoCorrectionResult["corrections"] = [];
  for (const i of suspiciousIndices) {
    const fillMask = await getFillMask();
    const masked = working
      .map((w, j) => (j === i ? "[MASK]" : suspiciousIndices.includes(j) ? draft[j] : w))
      .join(" ");
    const results = await fillMask(masked, { top_k: 50 });

    // Distance <= 1 here, not MAX_EDIT_DISTANCE — this step should only
    // ever OVERRIDE the draft when the model is confidently close to the
    // original typo; a looser distance-2 match is exactly what let a
    // weak, unrelated word ("mew" -> "see", score 0.05) win out over
    // trusting the draft's own closer guess ("me") in testing. When
    // nothing qualifies here, `refined[i]` stays at the draft's value
    // (already assigned above) rather than the original typo.
    const candidates = results
      .filter((r) => /^[a-z]+$/.test(r.token_str) && r.score >= MIN_SCORE)
      .map((r) => ({ ...r, dist: levenshtein(r.token_str, working[i]) }))
      .filter((r) => r.dist <= 1)
      .sort((a, b) => a.dist - b.dist || b.score - a.score);

    if (candidates[0]) refined[i] = candidates[0].token_str;

    if (refined[i] !== working[i]) {
      corrections.push({ from: rawWords[i], to: refined[i], score: candidates[0]?.score ?? 0 });
    }
  }

  if (corrections.length === 0) return noChange;
  return { corrected: refined.join(" "), changed: true, corrections };
}
