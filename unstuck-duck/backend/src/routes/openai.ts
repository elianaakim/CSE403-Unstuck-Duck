import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Uses AI to generate a more natural/contextual duck question
 * Falls back to rule-based if AI fails
 */
export async function generateAIDuckQuestion(
  topic: string,
  lastUserResponse: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const prompt = `
      You are a curious student learning about ${topic}.
      The teacher just said: "${lastUserResponse}"
      
      Previous conversation: ${JSON.stringify(conversationHistory.slice(-3))}
      
      Ask ONE clarifying question that shows genuine curiosity and confusion.
      Be slightly confused but eager to learn.
      Keep it under 2 sentences.
      NEVER give answers or solutions.
      
      Your question:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a curious student who asks clarifying questions. Be confused, inquisitive, and never give answers.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.warn("OpenAI failed, using rule-based fallback");
    return ""; // Empty string triggers fallback
  }
}

/**
 * Uses AI to evaluate teaching quality with detailed feedback
 */
export async function evaluateWithAI(
  topic: string,
  userResponse: string,
  conversationContext: string
): Promise<{
  score: number;
  feedback: string;
  breakdown: {
    clarity: number;
    depth: number;
    examples: number;
    coherence: number;
  };
}> {
  try {
    const prompt = `
      Evaluate this teaching explanation about "${topic}":
      
      Student's explanation: "${userResponse}"
      
      Conversation context: ${conversationContext}
      
      Rate from 0-100 based on teaching quality.
      Consider: clarity, depth, use of examples, logical flow.
      
      Return ONLY JSON with this exact format:
      {
        "score": number (0-100),
        "feedback": "string with specific feedback",
        "breakdown": {
          "clarity": number (0-25),
          "depth": number (0-25),
          "examples": number (0-25),
          "coherence": number (0-25)
        }
      }`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You evaluate teaching explanations. Return only JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    // Convert 0-100 score to your 0-800 scale (×8)
    const scaledScore = Math.round((result.score || 0) * 8);

    return {
      score: scaledScore,
      feedback: result.feedback || "AI evaluation failed",
      breakdown: result.breakdown || {
        clarity: 0,
        depth: 0,
        examples: 0,
        coherence: 0,
      },
    };
  } catch (error) {
    console.error("AI evaluation failed:", error);
    throw new Error("AI evaluation service unavailable");
  }
}
