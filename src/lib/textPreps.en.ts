// src/lib/textPrep.en.ts

/** Replace curly quotes, collapse repeated punctuation, remove controls */
function normalizePunctuation(s: string) {
  return s
    .replace(FANCY_QUOTES_RE, '"')
    .replace(FANCY_APOSTROPHE_RE, "'")
    .replace(MULTI_PUNCT_RE, "$1")
    .replace(CONTROL_RE, "");
}

/** Expand common English contractions. */
function expandContractions(s: string) {
  // Handle specific forms first
  for (const [k, v] of Object.entries(CONTRACTIONS)) {
    // escape for regex
    const r = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`\\b${r}\\b`, "g"), v);
  }
  // Handle generic n't that slipped through
  s = s.replace(/\b(\w+)n't\b/g, (_m, p1) => `${p1} not`);
  return s;
}

/** Optional tokenization (English‑ish heuristic). */
function tokenizeEn(s: string) {
  // Split by non-word-ish boundaries but keep apostrophes/numbers within tokens.
  return s.split(/[^a-z0-9]+/i).filter(Boolean);
}

/** Exported API */
export function preProcessEn(
  message: string,
  opts?: { tokenize?: boolean; expandContractions?: boolean },
): PrepOutput {
  const original = message ?? "";
  let normalized = original.normalize("NFC");

  normalized = normalizePunctuation(normalized);
  normalized = normalized.replace(MULTI_WS_RE, " ").trim().toLowerCase();

  if (opts?.expandContractions !== false) {
    normalized = expandContractions(normalized);
  }

  const out: PrepOutput = { original, normalized };

  if (opts?.tokenize) {
    out.tokens = tokenizeEn(normalized);
  }
  return out;
}
export type PrepOutput = {
  original: string;
  normalized: string; // normalized lowercase text for matching
  tokens?: string[]; // optional word tokens
};

const CONTROL_RE = /[\u0000-\u001F\u007F]/g;
const MULTI_WS_RE = /\s+/g;
const MULTI_PUNCT_RE = /([!?])\1+/g; // "!!!" -> "!"
const FANCY_QUOTES_RE = /[“”«»„‟‹›]/g;
const FANCY_APOSTROPHE_RE = /[’`´ʹ]/g;

/** Basic English contractions map -> expand to help rule matching */
const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "that's": "that is",
  "there's": "there is",
  "what's": "what is",
  "who's": "who is",
  "where's": "where is",
  "when's": "when is",
  "how's": "how is",

  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",

  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",

  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will",

  "can't": "cannot",
  "won't": "will not",
  "n't": " not",
  "'s": " is",
};
