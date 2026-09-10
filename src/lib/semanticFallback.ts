// src/lib/semanticFallback.ts
//
// Retrieval, not generation: when unknown.rive's catch-all fires, embed the
// message with a small local model (zero cost, zero network call) and
// compare it against embeddings of canonical phrases for real CV-content
// intents. If the best match clears a threshold, riveBot.ts asks the
// visitor to CONFIRM before answering — never auto-answers on a semantic
// guess alone.
//
// This confirm-first design exists because empirical testing (a throwaway
// tuning script, run before this file was written) showed that auto-routing
// to the top match was NOT reliable enough for several closely-related CV
// topics (e.g. "how do i get in touch with wilson" scored highest against
// "wilsonoverview", not "contact" — the correct answer often ranked 4th-7th
// out of 25, not a close second). A wrong top-1 pick is cheap to recover
// from via a yes/no confirmation (reusing the same yeswords/nowords pattern
// already used for name capture elsewhere in this KB); it would not be cheap
// if silently answered as fact. This also means the threshold here can be
// looser than a "just answer it" design would allow — a wrong guess costs a
// "no" and a graceful fallback, not a wrong confident answer.
import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import { preProcessEn } from "./textPreps.en";

export type CanonicalPhrase = { key: string; phrase: string };

/**
 * Multiple phrases per key, mined directly from each trigger's OWN existing
 * alternation list in the .rive files (not invented wording) — a single
 * prototype phrase per key wasn't enough for the model to discriminate
 * between semantically-adjacent CV topics (confirmed via the tuning
 * script). The FIRST entry for a given key is the "primary" one: it's what
 * gets shown in the confirmation question and what riveBot.ts re-asks
 * RiveScript with on a "yes" — the rest only widen what can match.
 *
 * `wilsonoverview` deliberately excluded: it was the single largest source
 * of wrong-topic matches (stealing hits meant for `summary`/`contact`/
 * `companies`), and it already has its own broad `[*] ... [*]`-wrapped
 * trigger in topics.rive, so it doesn't need semantic routing to be
 * reachable.
 */
export const CANONICAL_PHRASES: CanonicalPhrase[] = [
  { key: "summary", phrase: "who is wilson" },
  { key: "summary", phrase: "about wilson" },
  { key: "summary", phrase: "professional summary" },
  { key: "summary", phrase: "about yourself" },
  { key: "name", phrase: "wilsons name" },
  { key: "name", phrase: "his full name" },
  { key: "location", phrase: "where are you from" },
  { key: "location", phrase: "where do you live" },
  { key: "location", phrase: "where is wilson based" },
  { key: "contact", phrase: "how can i contact you" },
  { key: "contact", phrase: "contact details" },
  { key: "contact", phrase: "linkedin profile" },
  { key: "skills", phrase: "what are your skills" },
  { key: "skills", phrase: "skill set" },
  { key: "languages", phrase: "what languages do you speak" },
  { key: "education", phrase: "what is your education" },
  { key: "education", phrase: "school" },
  { key: "experience", phrase: "what is your experience" },
  { key: "experience", phrase: "career" },
  { key: "experience", phrase: "employment history" },
  { key: "experience", phrase: "professional experience" },
  { key: "companies", phrase: "what companies have you worked for" },
  { key: "companies", phrase: "which companies have you worked for" },
  { key: "companies", phrase: "employers" },
  { key: "smartdebrief", phrase: "tell me about smart debrief" },
  { key: "smartdebrief", phrase: "what did you do at smart debrief" },
  { key: "smartdebrief", phrase: "experience at smart debrief" },
  { key: "moomenti", phrase: "tell me about moomenti" },
  { key: "moomenti", phrase: "what did you do at moomenti" },
  { key: "moomenti", phrase: "experience at moomenti" },
  { key: "redit", phrase: "tell me about red it" },
  { key: "redit", phrase: "what did you do at red it" },
  { key: "redit", phrase: "experience at red it" },
  { key: "exactcode", phrase: "tell me about exact code sistemas" },
  { key: "exactcode", phrase: "what did you do at exact code sistemas" },
  { key: "exactcode", phrase: "experience at exact code sistemas" },
  { key: "mobiweb", phrase: "tell me about mobiweb" },
  { key: "mobiweb", phrase: "what did you do at mobiweb" },
  { key: "mobiweb", phrase: "experience at mobiweb" },
  { key: "frontend", phrase: "tell me about your frontend experience" },
  { key: "frontend", phrase: "frontend developer" },
  { key: "mobile", phrase: "tell me about mobile development" },
  { key: "mobile", phrase: "app manager" },
  { key: "mobile", phrase: "react native" },
  { key: "testing", phrase: "tell me about testing" },
  { key: "testing", phrase: "unit tests" },
  { key: "testing", phrase: "integration tests" },
  { key: "design", phrase: "tell me about design" },
  { key: "design", phrase: "ui ux" },
  { key: "backend", phrase: "tell me about backend" },
  { key: "backend", phrase: "restful api" },
  { key: "ai", phrase: "tell me about ai" },
  { key: "ai", phrase: "artificial intelligence" },
  { key: "ai", phrase: "transcription and summarization" },
  { key: "leadership", phrase: "tell me about leadership" },
  { key: "leadership", phrase: "mentoring" },
  { key: "leadership", phrase: "code review" },
  { key: "tools", phrase: "what tools do you use" },
  { key: "careersummary", phrase: "can you summarize your career" },
  { key: "careersummary", phrase: "career summary" },
  { key: "botidentity", phrase: "who are you" },
  { key: "botidentity", phrase: "what are you" },
];

/**
 * Starting point, picked from the tuning script's SHOULD_NOT_MATCH scores
 * (max ~0.33 for genuinely off-topic input) with a small margin. Looser
 * than a "just answer it" design would allow, since a wrong guess here
 * only leads to a confirmation question, not a stated fact.
 */
const SIMILARITY_THRESHOLD = 0.4;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;
async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    // Dynamic, not a top-level import: @huggingface/transformers is
    // serverExternalPackages'd (next.config.ts), and Turbopack's
    // "externalImport" mechanism `require()`s a static import of an
    // external package EAGERLY the moment this module loads — which is
    // riveBot.ts, so on every /api/chat/* and /api/admin/* request. A
    // static import here meant a broken onnxruntime-node native binding
    // (confirmed on Vercel: "libonnxruntime.so.1: cannot open shared
    // object file") crashed the whole request before ask()'s own
    // try/catch around findSemanticMatch (below) ever got a chance to
    // run — including requests that never call this file at all, like
    // /api/chat/start. Deferring the import to here means that same
    // failure is just a rejected promise this function returns, which
    // IS inside that try/catch, restoring the graceful-degradation this
    // module's own design already intends.
    extractorPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      // Vendored weights (see src/models/all-MiniLM-L6-v2) — never
      // attempt a network fetch at runtime, so this works the same in a
      // Vercel serverless function (read-only filesystem, no guaranteed
      // egress) as it does locally.
      env.allowRemoteModels = false;
      env.localModelPath = "src/models";
      return pipeline("feature-extraction", MODEL_ID, {
        dtype: "q8",
        device: "cpu", // this library's Node entry point only supports cpu/coreml/webgpu — no "wasm" under Node
      });
    })();
  }
  return extractorPromise;
}

async function embed(normalizedText: string): Promise<Float32Array> {
  const extractor = await getExtractor();
  const output = await extractor(normalizedText, { pooling: "mean", normalize: true });
  return output.data as Float32Array;
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

type CanonicalEmbedding = CanonicalPhrase & { vector: Float32Array };

// Recomputed once per process lifetime — this list only changes when this
// file itself changes, which already forces a dev-server recompile/restart,
// so there's no need for riveBot.ts's mtime-signature hot-reload trick here.
let canonicalEmbeddingsPromise: Promise<CanonicalEmbedding[]> | null = null;
async function getCanonicalEmbeddings(): Promise<CanonicalEmbedding[]> {
  if (!canonicalEmbeddingsPromise) {
    canonicalEmbeddingsPromise = (async () => {
      const items: CanonicalEmbedding[] = [];
      for (const { key, phrase } of CANONICAL_PHRASES) {
        // Same normalization as the live message side, for a symmetric comparison.
        const normalized = preProcessEn(phrase, { expandContractions: true }).normalized;
        items.push({ key, phrase, vector: await embed(normalized) });
      }
      return items;
    })();
  }
  return canonicalEmbeddingsPromise;
}

/** The first (primary) canonical phrase for a key — shown in the confirmation question and re-asked to RiveScript on "yes". */
export function primaryPhraseForKey(key: string): string | undefined {
  return CANONICAL_PHRASES.find((c) => c.key === key)?.phrase;
}

export type SemanticMatch = { key: string; phrase: string; score: number };

/**
 * Compares an already-normalized user message against the canonical
 * phrase set. Returns the best-scoring KEY's primary phrase if the score
 * clears SIMILARITY_THRESHOLD, otherwise null (caller falls through to the
 * existing generic unknown-fallback behavior unchanged).
 */
export async function findSemanticMatch(normalizedMessage: string): Promise<SemanticMatch | null> {
  const [messageVector, canonical] = await Promise.all([
    embed(normalizedMessage),
    getCanonicalEmbeddings(),
  ]);

  let best: { key: string; score: number } | null = null;
  for (const c of canonical) {
    const score = cosineSimilarity(messageVector, c.vector);
    if (!best || score > best.score) best = { key: c.key, score };
  }
  if (!best || best.score < SIMILARITY_THRESHOLD) return null;

  const phrase = primaryPhraseForKey(best.key);
  if (!phrase) return null; // should never happen, but keep the return type honest
  return { key: best.key, phrase, score: best.score };
}

// Kept in sync by hand with begin.rive's yeswords/nowords/maybewords
// arrays. Duplicated here (rather than parsed out of the .rive file)
// because the confirm-then-answer flow below is deliberately plain JS,
// not a RiveScript %-Previous trigger — routing it through RiveScript
// would require the confirmation QUESTION itself to have been produced by
// bot.reply() (so it lands in RiveScript's own reply history for %  to
// match against next turn), which would mean generating that question
// from inside a .rive trigger, conditioned on an arbitrary one-of-~20
// key — doable, but a lot of RiveScript machinery for what's really just
// app-level conversation-flow bookkeeping, not CV knowledge. Tracking the
// pending phrase in a plain uservar and classifying the reply in JS is
// simpler and has no tag-ordering pitfalls to worry about.
const YES_WORDS = [
  "yes", "yeah", "yep", "correct", "thats right", "that is right", "right",
  "seems good", "sounds good", "sure", "ok", "okay", "alright", "affirmative",
  "roger", "indeed",
];
const NO_WORDS = [
  "no", "nope", "not quite", "thats not right", "that is not right", "wrong",
  "nah", "negative", "never", "not at all",
];
const MAYBE_WORDS = ["maybe", "not sure", "perhaps", "possibly", "i dont know", "not certain", "unsure"];

function containsPhrase(normalized: string, phrase: string): boolean {
  return (
    normalized === phrase ||
    normalized.startsWith(`${phrase} `) ||
    normalized.endsWith(` ${phrase}`) ||
    normalized.includes(` ${phrase} `)
  );
}

/**
 * Classifies a reply to the "did you mean to ask about X?" confirmation.
 * Checked in maybe -> no -> yes order deliberately: several no/maybe
 * phrases ("thats not right", "not sure") contain a bare yesword
 * ("right", "sure") as a substring, so the more specific longer phrases
 * must be checked first or they'd be misread as "yes" — the same
 * collision already found and fixed once this session in the RiveScript
 * trigger version of these word lists.
 */
export function classifyYesNoMaybe(normalizedMessage: string): "yes" | "no" | "maybe" | null {
  if (MAYBE_WORDS.some((w) => containsPhrase(normalizedMessage, w))) return "maybe";
  if (NO_WORDS.some((w) => containsPhrase(normalizedMessage, w))) return "no";
  if (YES_WORDS.some((w) => containsPhrase(normalizedMessage, w))) return "yes";
  return null;
}
