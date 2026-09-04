// Server-only: calls Groq's free-tier hosted inference API (OpenAI-compatible
// chat completions) grounded in Wilson's CV. Requires GROQ_API_KEY.
import { recordConversationTurn } from "./chatHistory";
import { CV_SYSTEM_PROMPT } from "./cvContext";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// gpt-oss models spend part of the token budget on hidden reasoning before
// the visible answer, so max_tokens needs headroom beyond the answer length.
const GROQ_MODEL = "openai/gpt-oss-20b";

export async function ask(message: string, userId: string): Promise<string> {
  if (!message) throw new Error("message is required");
  if (!userId) throw new Error("userId is required");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: CV_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const reply: string = data?.choices?.[0]?.message?.content?.trim() || "";

  recordConversationTurn({
    userId,
    message,
    normalizedMessage: message,
    reply,
  });

  return reply;
}
