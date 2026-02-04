// AI prompting & response logic using OpenAI
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates the first question to start the conversation
 * The duck acts as a curious student who wants to learn about the subject
 */
export async function generateFirstQuestion(subject: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
      max_tokens: 100,
      temperature: 0.8,
    });

    return (
      response.choices[0].message?.content ||
      `Hi! Can you teach me about ${subject}?`
    );
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

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages as any,
      max_tokens: 150,
      temperature: 0.8,
    });

    return (
      response.choices[0].message?.content ||
      "That's interesting! Can you tell me more?"
    );
  } catch (error) {
    console.error("Error generating follow-up question:", error);
    return "That's interesting! Can you tell me more?";
  }
}
