---
name: review-chat-corrections
description: Reads admin-data/corrections.json (from the /admin chatbot testing page) and, for each entry that has instructions but no suggestion yet, drafts a proposed fix — a KEY, trigger phrases, the correct answer, and a matching unknownhint — writing it back as a "suggestion" for the admin to review and approve, without touching the real .rive files. Use when the user asks to review, prefill, or draft answers for chatbot corrections/the admin review queue, or whenever a new correction shows up without a suggestion.
---

# Review chat corrections

The `/admin` page (local dev only) lets the user run the portfolio's RiveScript
chatbot through many test conversations and flag replies that were wrong,
recording each one in `admin-data/corrections.json` — a JSON array of entries
shaped like:

```ts
type Correction = {
  id: string;
  createdAt: string;
  sessionUserId: string;
  conversation: { message: string; reply: string };
  vars: Record<string, unknown>; // currentSession, userIntention, botIntention, ctrl_*, name, ...
  instructions: string; // the admin's directive, in their own words — NOT a literal reply, NOT a KEY
  suggestion?: { triggerPhrases: string[]; suggestedKey: string; unknownhint: string; correctAnswer: string; reasoning: string };
  approved?: boolean;
  reviewNotes?: string;
  replay?: { reply: string; vars: Record<string, unknown>; repliedAt: string }; // auto-refreshed by the admin page once approved
};
```

`instructions` is the admin's own input — what should change, described in
their own words (e.g. "the bot should suggest a new subject"), never a
drafted sentence and never a KEY. `suggestion` is what this skill writes: a
drafted fix, derived from `instructions`, for the admin to review and
approve — never the real fix on its own. `replay` is written automatically by
the admin page (not by this skill) after a correction is approved, by
re-asking `conversation.message` against the live bot — it's how the admin
checks whether a `.rive` edit actually landed; leave it alone.

## What to do

1. Read `admin-data/corrections.json`. If it doesn't exist or is empty, say so
   and stop — there's nothing to review.

2. For each entry where `suggestion` is missing (unless the user names specific
   entries to re-run), gather context:
   - `conversation.message` / `conversation.reply` — what the visitor asked and
     what the bot wrongly said.
   - `instructions` — what the admin says should happen instead. Treat this as
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

4. Write the `suggestion` back into that entry in `admin-data/corrections.json`,
   preserving every other field exactly (`instructions`, `approved`,
   `reviewNotes`, `replay` if present — never touch them).

5. Report back concisely: one line per entry processed ("`<message>` → KEY
   `<key>`: `<short answer preview>`"), and remind the user they can review and
   approve each one either right here in the conversation or in the `/admin`
   page's Corrections tab.

## Proactive behavior

Whenever a new correction shows up in `admin-data/corrections.json` without a
`suggestion` — noticed via a file-change notice or by the user mentioning it —
draft a suggestion for it in the same turn without waiting to be asked again.

## What NOT to do

- Do not edit any `.rive` file. This skill only fills in `suggestion` fields in
  the JSON review queue — turning an *approved* correction into a real KB
  change is a separate, deliberate step (a normal editing session, tested
  against the real engine the way every KB change in this project has been).
- Do not overwrite an existing `suggestion` unless the user explicitly asked to
  re-run that entry.
- Do not touch `instructions`, `approved`, `reviewNotes`, or `replay` — those
  are the admin's own input or the admin page's own automated output.
