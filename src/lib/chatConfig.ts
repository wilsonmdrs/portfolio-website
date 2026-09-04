export type ChatProvider = "server" | "browser-ai" | "groq";

/**
 * Developer-only switch for which backend powers the chat widget.
 * Not exposed in the UI — flip this constant to change it.
 *
 * "server":     RiveScript knowledge-base backend (/api/chat/*), no generative AI.
 * "browser-ai": Chrome's on-device Prompt API (window.LanguageModel),
 *               runs fully client-side, no server round-trip.
 * "groq":       Groq's hosted free-tier API, called server-side from
 *               /api/chat/* (requires GROQ_API_KEY in the environment).
 */
export const CHAT_PROVIDER: ChatProvider = "server";
