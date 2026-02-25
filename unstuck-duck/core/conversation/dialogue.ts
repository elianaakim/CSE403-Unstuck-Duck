import { ollamaClient } from "../../app/lib/ollama";

function extractAnswer(content: string): string {
  // Remove thinking tags if present
  const withoutThink = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // If we got something after removing think tags, use it
  if (withoutThink) {
    return withoutThink;
  }

  // Otherwise return original (for models that don't use think tags)
  return content.trim();
}

/**
 * Generates the first question to start the conversation
 * The duck acts as a curious student who wants to learn about the subject
 */
export async function generateFirstQuestion(subject: string): Promise<string> {
  try {
    const response = await ollamaClient.chat({
      model: "llama3.2",
      messages: [
        {
          role: "system",
          content: `You are a curious rubber duck student who wants to learn about "${subject}". Ask an open-ended question to get the user to start explaining the topic. Keep it simple and conversational. Ask only ONE question. Be enthusiastic and genuinely curious.`,
        },
        {
          role: "user",
          content: `Generate a first question to ask about ${subject}`,
        },
      ],
      options: {
        num_predict: 100,
        temperature: 0.8,
      },
    });

    return response.message.content || `Hi! Can you teach me about ${subject}?`;
  } catch (error) {
    console.error("Error generating first question:", error);
    return `Hi! Can you teach me about ${subject}?`;
  }
}

/**
 * Generates follow-up questions based on conversation history
 * The duck acts as a curious, slightly confused student who asks questions to deepen understanding
 */
export async function generateFollowUpQuestion(
  subject: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userLastResponse: string
): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a curious rubber duck student learning about "${subject}". Based on the conversation so far:
- Ask follow-up questions to deepen understanding
- If the explanation is vague, ask for clarification
- If there are no examples, ask for one
- If something seems confusing or contradictory, express confusion and ask about it
- Never lecture or give correct answers
- Stay in character as a genuinely curious, slightly confused student
- Keep questions natural and conversational
- Ask only ONE question at a time
- Generate your next question as the curious duck student.`,
      },
      ...conversationHistory,
      {
        role: "user",
        content: userLastResponse,
      },
    ];

    const response = await ollamaClient.chat({
      model: "llama3.2",
      messages: messages as Array<{ role: string; content: string }>,
      options: {
        num_predict: 150,
        temperature: 0.8,
      },
    });

    const rawContent = response.message.content || "";
    // console.log("Raw LLM response:", rawContent);

    const cleanedAnswer = extractAnswer(rawContent);
    // console.log("Cleaned answer:", cleanedAnswer);

    return cleanedAnswer || "That's interesting! Can you tell me more?";
  } catch (error) {
    console.error("Error generating follow-up question:", error);
    return "That's interesting! Can you tell me more?";
  }
}
