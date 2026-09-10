---
name: review-chat-corrections
description: Fetches the corrections list from the running admin API (from the /admin chatbot testing page) and, for each entry that has instructions but no suggestion yet, drafts a proposed fix — a KEY, trigger phrases, the correct answer, and a matching unknownhint — PATCHing it back as a "suggestion" for the admin to review, without touching the real .rive files. Use when the user asks to review, prefill, or draft answers for chatbot corrections/the admin review queue, or whenever a new correction shows up without a suggestion.
---

# Review chat corrections

The `/admin` page lets the user run the portfolio's RiveScript chatbot
through many test conversations and flag replies that were wrong. Each
flagged reply is a `Correction`, stored in Redis (not a file) and served by
the admin API — this skill needs the local dev server running
(`pnpm run dev`, default `http://localhost:3000`) to do anything, same
prerequisite the admin page itself has. Shape:

```ts
type Correction = {
  id: string;
  createdAt: string;
  sessionUserId: string;
  conversation: { message: string; reply: string };
  vars: Record<string, unknown>; // currentSession, userIntention, botIntention, ctrl_*, name, ...
  instructions: string; // the admin's directive, in their own words — NOT a literal reply, NOT a KEY
  suggestion?: { triggerPhrases: string[]; suggestedKey: string; unknownhint: string; correctAnswer: string; reasoning: string };
  needsReedit?: boolean; // admin flagged this for another edit pass after a retest
  reviewNotes?: string;
  replay?: { reply: string; vars: Record<string, unknown>; repliedAt: string }; // auto-refreshed by the admin page on every load
};
```

`instructions` is the admin's own input — what should change, described in
their own words (e.g. "the bot should suggest a new subject"), never a
drafted sentence and never a KEY. `suggestion` is what this skill writes: a
drafted fix, derived from `instructions`, for the admin to review — never
the real fix on its own, and nothing in this app requires it before a
correction can be acted on directly from `instructions`/`reviewNotes`.
`replay` is written automatically by the admin page (not by this skill),
by re-asking `conversation.message` against the live bot on every page
load, for every correction — it's how the admin checks whether a `.rive`
edit actually landed; leave it alone.

## What to do

1. `curl http://localhost:3000/api/admin/corrections` to fetch the current
   list (`{ corrections: Correction[] }`). If the request fails to connect,
   say so and stop — the dev server likely isn't running. If the list is
   empty, say so and stop — there's nothing to review.

2. For each entry where `suggestion` is missing (unless the user names specific
   entries to re-run), gather context:
   - `conversation.message` / `conversation.reply` — what the visitor asked and
     what the bot wrongly said.
   - `instructions` (and `reviewNotes`, if this is a re-run after a flagged
     re-edit) — what the admin says should happen instead. Treat this as
     a directive to satisfy, not text to copy: construct the actual trigger
     phrases, KEY, and reply wording yourself from what you know of the KB and
     of Wilson's background (see `begin.rive`'s `cv_*` vars).
   - `vars.userIntention` / `vars.botIntention` — what the bot thought was going
     on at the time. If set, the miss likely happened right after a real
     topic — the correction may belong as a new phrasing on an *existing*
     trigger rather than a whole new one.
   - Read `src/knowledgeBase/begin.rive`, `src/knowledgeBase/cv.rive`, and
     `src/knowledgeBase/unknown.rive` (and any other `.rive` file that looks
     relevant) to check whether an existing trigger/KEY already covers this, or
     nearly does — don't propose a duplicate.

3. Draft a `suggestion` for that entry, following this KB's established
   authoring convention (see `begin.rive`'s `setintent` comment and the
   `rivescript-agent` project agent for the full rules — array/KEY names must
   never contain an underscore, `<set>` not `<bot>` for anything per-visitor,
   etc.):
   - `suggestedKey`: short, lowercase, no underscore.
   - `triggerPhrases`: a small set of natural phrasings a visitor might
     actually type — base these on `conversation.message` plus close variants,
     not just the one literal message.
   - `correctAnswer`: satisfies `instructions`, third person about Wilson (not
     first person as Wilson — that persona question was already resolved this
     project), matching the tone of neighboring `cv.rive` replies.
   - `unknownhint`: mandatory per the pairing rule — a short "if you meant X,
     try '...'" hint, matching the existing `unknownhint_KEY` style in
     `begin.rive`.
   - `reasoning`: one sentence — why this KEY/phrasing, and whether it's a new
     trigger or an addition to an existing one.

4. `curl -X PATCH http://localhost:3000/api/admin/corrections/<id> -H
   "Content-Type: application/json" -d '{"suggestion": {...}}'` to write it
   back. The PATCH merges into the stored entry server-side, so send only
   the `suggestion` field — no need to re-send or worry about preserving
   `instructions`/`reviewNotes`/`needsReedit`/`replay`, they're untouched
   automatically.

5. Report back concisely: one line per entry processed ("`<message>` → KEY
   `<key>`: `<short answer preview>`"), and remind the user they can review
   each one either right here in the conversation or in the `/admin` page's
   Corrections tab, then edit the real `.rive` files directly from
   `instructions`/`reviewNotes` (and this draft, if useful) whenever ready —
   no approval step required first.

## Proactive behavior

Whenever a new correction shows up without a `suggestion` — noticed via the
user mentioning it, or by re-fetching the list — draft a suggestion for it
in the same turn without waiting to be asked again.

## What NOT to do

- Do not edit any `.rive` file. This skill only fills in `suggestion` fields
  via the admin API — turning a correction into a real KB change is a
  separate, deliberate step (a normal editing session, tested against the
  real engine the way every KB change in this project has been).
- Do not overwrite an existing `suggestion` unless the user explicitly asked to
  re-run that entry.
- Do not PATCH `instructions`, `needsReedit`, `reviewNotes`, or `replay` —
  those are the admin's own input or the admin page's own automated output.
