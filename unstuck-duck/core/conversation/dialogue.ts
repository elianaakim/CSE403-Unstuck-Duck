import { chat } from "../../app/lib/gemini";

function extractAnswer(content: string): string {
  const withoutThink = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  return withoutThink || content.trim();
}

export async function generateFirstQuestion(subject: string): Promise<string> {
  try {
    const messages = [
      {
        role: "user",
        content: `You are a curious student who wants to learn about "${subject}". Ask one open-ended question to get the user to start explaining. Be enthusiastic and genuinely curious.`,
      },
    ];
    return (await chat(messages)) || `Hi! Can you teach me about ${subject}?`;
  } catch (error) {
    console.error("Error generating first question:", error);
    return `Hi! Can you teach me about ${subject}?`;
  }
}

export async function generateFollowUpQuestion(
  subject: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userLastResponse: string
): Promise<string> {
  try {
    const systemPrompt = `You are a curious student learning about "${subject}". Ask follow-up questions, never give answers. Ask only ONE question at a time.`;
    const messages = [
      { role: "user", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userLastResponse },
    ];
    const answer = await chat(messages);
    return extractAnswer(answer) || "That's interesting! Can you tell me more?";
  } catch (error) {
    console.error("Error generating follow-up question:", error);
    return "That's interesting! Can you tell me more?";
  }
}
