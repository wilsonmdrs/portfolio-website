import { getConversationHistory, getKnowledgeBaseSuggestions } from "@/lib/chatHistory";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const history = getConversationHistory(userId);
  const suggestions = getKnowledgeBaseSuggestions(userId);

  return NextResponse.json(
    {
      userId,
      history,
      suggestions,
      unmatchedCount: suggestions.reduce((total, item) => total + item.count, 0),
    },
    { status: 200 },
  );
}
