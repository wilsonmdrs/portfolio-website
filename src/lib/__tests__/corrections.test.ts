// src/lib/__tests__/corrections.test.ts
//
// Regression suite for behaviors verified against the real engine this
// session — both corrections that went through the /admin review queue
// (admin-data/corrections.json) and standalone features (semantic
// fallback, typo correction, name-capture edge cases, conversational
// flows). Each case reproduces a real reported/tested scenario and
// asserts the actual fix (not just "no crash") — the point is to catch a
// REGRESSION, the same way every fix here was itself verified against
// the real engine before being applied.
//
// Runs the real ask() pipeline end-to-end (real RiveScript engine, real
// local embedding/typo-correction models) rather than mocking anything —
// consistent with this project's rule of never assuming behavior without
// exercising the real engine. The first case in a run is slow (one-time
// model load); the rest are fast.
//
// To add a new case: append one entry to whichever CASES array it
// belongs to (or add a new array + describe block for a new category).
// `steps` is a conversation: each step sends a message and can assert on
// ITS OWN reply, so multi-turn flows (yes/no/maybe confirmations,
// name-capture across two messages) are expressed the same way as a
// single-message case with only one step.
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ask, startConversation } from "../riveBot";

type ConversationStep = {
  send: string;
  /** Substring(s) this step's reply must contain (case-insensitive). */
  expectContains?: string | string[];
  /** Substring(s) this step's reply must NOT contain (case-insensitive). */
  expectNotContains?: string | string[];
};

type ConversationCase = {
  /** Short label shown in test output — what's being verified, not the bug. */
  name: string;
  steps: ConversationStep[];
};

async function freshSession(): Promise<string> {
  const userId = randomUUID();
  await startConversation(userId);
  return userId;
}

function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function run(c: ConversationCase): Promise<void> {
  const userId = await freshSession();
  for (const step of c.steps) {
    const reply = (await ask(step.send, userId)).toLowerCase();
    for (const expected of toList(step.expectContains)) {
      expect(reply).toContain(expected.toLowerCase());
    }
    for (const unexpected of toList(step.expectNotContains)) {
      expect(reply).not.toContain(unexpected.toLowerCase());
    }
  }
}

// --- Resolved as real .rive knowledge-base fixes ---
const KB_FIX_CASES: ConversationCase[] = [
  {
    name: "open-ended 'tell me about Wilson' gets the overview prompt, not the generic fallback",
    steps: [{ send: "I want to know more about Wilson", expectContains: "What would you like to know about Wilson" }],
  },
  {
    name: "a nickname override on confirmation uses the short name, not the full captured name",
    steps: [
      { send: "hi" },
      { send: "Mary Monroe" },
      { send: "yes, but you can call only Mary", expectContains: "Mary", expectNotContains: "Monroe" },
    ],
  },
  {
    name: "'yes it is' confirms a bare-captured name instead of falling through to the unknown fallback",
    steps: [{ send: "hi" }, { send: "Ana" }, { send: "yes it is", expectContains: "Nice to meet you, Ana" }],
  },
  {
    name: "a two-word bare name is captured (reduced to its first word), not rejected as unparseable",
    steps: [
      {
        send: "hi",
      },
      {
        send: "Madelaine Kincaid",
        expectContains: "Is Madelaine your name?",
        expectNotContains: "Kincaid",
      },
    ],
  },
];

// --- Resolved via the typo-correction feature (code-level, not .rive) ---
const TYPO_CORRECTION_CASES: ConversationCase[] = [
  {
    name: "a typo'd single-word greeting still triggers the greet flow",
    steps: [{ send: "helo", expectContains: "what should i call you" }],
  },
  {
    name: "two typos in one name-capture message ('dan'/'mw') still captures the name",
    steps: [{ send: "hi" }, { send: "you dan call mw Ana", expectContains: "Nice to meet you, Ana" }],
  },
  {
    name: "a single typo in a name-capture message ('cal') still captures the name",
    steps: [{ send: "hi" }, { send: "you can cal me Ana", expectContains: "Nice to meet you, Ana" }],
  },
  {
    name: "two adjacent typos ('cal'/'mew') don't corrupt the name that follows them",
    steps: [
      { send: "hi" },
      {
        send: "you can cal mew Hannah",
        expectContains: "Nice to meet you, Hannah",
        // the two false-positive corrections found while fixing this
        expectNotContains: ["nice to meet you, an", "nice to meet you, see"],
      },
    ],
  },
];

// --- Semantic fallback: confirm-before-answering on the catch-all path ---
const SEMANTIC_FALLBACK_CASES: ConversationCase[] = [
  {
    name: "a paraphrase with no literal trigger match gets a confirmation prompt, and 'yes' gives the real answer",
    steps: [
      {
        send: "how do i get in touch with wilson",
        expectContains: 'did you mean to ask about "who is wilson"',
      },
      { send: "yes", expectContains: "wilson is a software engineer" },
    ],
  },
  {
    name: "declining a semantic-fallback confirmation with 'no' gives a graceful decline, not the wrong answer",
    steps: [
      { send: "how do i get in touch with wilson" },
      { send: "no", expectContains: "no problem", expectNotContains: "software engineer" },
    ],
  },
  {
    name: "answering 'maybe' to a semantic-fallback confirmation signals availability, not an answer",
    steps: [
      { send: "how do i get in touch with wilson" },
      { send: "maybe", expectContains: "take your time", expectNotContains: "software engineer" },
    ],
  },
  {
    name: "a genuinely off-topic message does NOT get a semantic-fallback confirmation prompt",
    steps: [{ send: "what is the weather today", expectNotContains: "did you mean" }],
  },
];

// --- Name-capture edge cases ---
const NAME_CAPTURE_CASES: ConversationCase[] = [
  {
    name: "a three-word bare name is captured (reduced to its first word), not rejected",
    steps: [
      { send: "hi" },
      {
        send: "Ana Maria Silva",
        expectContains: "Is Ana your name?",
        expectNotContains: ["maria", "silva"],
      },
      {
        send: "yes",
        expectContains: "Nice to meet you, Ana",
        expectNotContains: ["maria", "silva"],
      },
    ],
  },
  {
    name: "a mid-conversation correction ('actually, call me X') overrides a name given earlier in the same session",
    steps: [
      { send: "hi" },
      { send: "my name is Bob" },
      { send: "actually, call me Ana", expectContains: "Got it, Ana" },
    ],
  },
  {
    name: "a filler word between the lead-in phrase and the name isn't captured as part of the name (and a trailing surname is dropped)",
    steps: [
      {
        send: "my name is actually Ana Silva",
        expectContains: "Nice to meet you, Ana",
        expectNotContains: ["actually", "silva"],
      },
    ],
  },
];

// --- Off-topic / skeptical message handling ---
const OFF_TOPIC_CASES: ConversationCase[] = [
  {
    name: "a hiring/fit question gets pointed at contact details, not the generic fallback",
    steps: [
      {
        send: "is wilson a good fit for this role",
        expectContains: "skills and experience speak for themselves",
      },
    ],
  },
  {
    name: "a complaint about the bot itself gets acknowledged and redirected, not answered as a CV question",
    steps: [{ send: "this bot is annoying", expectContains: "sorry this hasn't been helpful" }],
  },
];

// --- Per-company follow-up flow ---
const COMPANY_FOLLOWUP_CASES: ConversationCase[] = [
  {
    name: "a company blurb's trailing question, answered 'yes', lists the other companies and skill areas",
    steps: [
      { send: "tell me about smart debrief", expectContains: "want to hear about another company" },
      { send: "yes", expectContains: "smart debrief, moomenti, mobiweb, red it, or exact code sistemas" },
    ],
  },
];

// --- Generic topic-continuation follow-up ("what else can you tell me") ---
// Previously fell straight through to unknown.rive's catch-all instead of
// continuing whatever topic was already in play — reported bug: asked
// about skills, then "what else can you tell me?" got a generic "I did
// not quite follow" reply instead of more detail or a topic suggestion.
const TOPIC_CONTINUATION_CASES: ConversationCase[] = [
  {
    name: "'what else can you tell me' after a skills answer suggests another subject, not the generic fallback",
    steps: [
      { send: "what are your skills", expectContains: "wilson's skills include" },
      {
        send: "what else can you tell me?",
        expectContains: "wilson's skills",
        expectNotContains: "i did not quite follow",
      },
    ],
  },
  {
    name: "'what else can you tell me' after the experience answer offers the same company follow-up as its own trailing question",
    steps: [
      { send: "what is your experience" },
      {
        send: "what else can you tell me?",
        expectContains: "smart debrief",
        expectNotContains: "i did not quite follow",
      },
    ],
  },
  {
    name: "'what else can you tell me' after a company blurb offers the same 'another company or skill' follow-up",
    steps: [
      { send: "tell me about mobiweb" },
      {
        send: "what else can you tell me?",
        expectContains: "moomenti",
        expectNotContains: "i did not quite follow",
      },
    ],
  },
  {
    name: "the wilsonoverview randomized-topic prompt still works after adding the generic continuation trigger (regression: 'tell me more' substring collision)",
    steps: [
      { send: "tell me more about wilson", expectContains: "what would you like to know about wilson" },
    ],
  },
];

describe("regression suite", () => {
  describe("knowledge-base fixes", () => {
    for (const c of KB_FIX_CASES) it(c.name, () => run(c));
  });

  describe("typo correction", () => {
    for (const c of TYPO_CORRECTION_CASES) it(c.name, () => run(c));
  });

  describe("semantic fallback", () => {
    for (const c of SEMANTIC_FALLBACK_CASES) it(c.name, () => run(c));
  });

  describe("name capture edge cases", () => {
    for (const c of NAME_CAPTURE_CASES) it(c.name, () => run(c));
  });

  describe("off-topic / skeptical messages", () => {
    for (const c of OFF_TOPIC_CASES) it(c.name, () => run(c));
  });

  describe("per-company follow-up", () => {
    for (const c of COMPANY_FOLLOWUP_CASES) it(c.name, () => run(c));
  });

  describe("generic topic-continuation follow-up", () => {
    for (const c of TOPIC_CONTINUATION_CASES) it(c.name, () => run(c));
  });

  // Not table-driven: the "tell me more about Wilson" prompt randomly
  // suggests one of four topics (experience/skills/education/languages),
  // so the follow-up assertion depends on which one was actually offered
  // — this needs branching logic a static case can't express.
  describe("wilsonoverview randomized topic follow-through", () => {
    const TOPIC_ANSWERS: Record<string, string> = {
      experience: "years of professional experience",
      skills: "wilson's skills include",
      education: "bachelor of computer science",
      languages: "wilson speaks",
    };

    it("'yes' after the randomized prompt answers whichever topic was actually suggested", async () => {
      const userId = await freshSession();
      const prompt = await ask("tell me more about wilson", userId);
      const offeredTopic = Object.keys(TOPIC_ANSWERS).find((topic) => prompt.toLowerCase().includes(topic));
      expect(offeredTopic, `prompt didn't mention a known topic: ${prompt}`).toBeDefined();

      const reply = (await ask("yes", userId)).toLowerCase();
      expect(reply).toContain(TOPIC_ANSWERS[offeredTopic as string]);
    });
  });
});
