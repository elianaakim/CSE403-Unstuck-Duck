import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiClient = openai;

// Generates question
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
    console.error("Error generating duck question:", error);
    throw error;
  }
}

// Uses AI to evaluate teaching ability with feedback
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
    understanding: number;
  };
}> {
  try {
    const prompt = `
      Evaluate this teaching explanation about "${topic}":
      
      Student's explanation: "${userResponse}"
      
      Conversation context: ${conversationContext}
      
      Rate from 0-100 based on teaching quality.
      Consider: clarity, depth, use of examples, and how well the user understands the topic.
      
      Return ONLY JSON with this exact format:
      {
        "score": number (0-100),
        "feedback": "string with specific feedback",
        "breakdown": {
          "clarity": number (0-25),
          "depth": number (0-25),
          "examples": number (0-25),
          "understanding": number (0-25)
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

    const toClampedNumber = (value: any, min: number, max: number): number => {
      const num =
        typeof value === "number"
          ? value
          : parseFloat(typeof value === "string" ? value : String(value));
      if (!Number.isFinite(num)) {
        return min;
      }
      return Math.min(max, Math.max(min, num));
    };

    const rawBreakdown =
      result && typeof result.breakdown === "object" && result.breakdown !== null
        ? result.breakdown
        : {};

    const normalizedBreakdown = {
      clarity: toClampedNumber(rawBreakdown.clarity, 0, 25),
      depth: toClampedNumber(rawBreakdown.depth, 0, 25),
      examples: toClampedNumber(rawBreakdown.examples, 0, 25),
      understanding: toClampedNumber(rawBreakdown.understanding, 0, 25),
    };

    return {
      score: toClampedNumber(result.score, 0, 100),
      feedback: result.feedback || "AI evaluation failed",
      breakdown: normalizedBreakdown,
    };
  } catch (error) {
    console.error("AI evaluation failed:", error);
    throw new Error("AI evaluation service unavailable");
  }
}

// Returns a teaching score from 1-100.
export async function evaluateTeachingScore(
  question: string,
  userAnswer: string,
  subject: string
): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Return ONLY a number from 1-100. No other text.",
        },
        {
          role: "user",
          content: `Subject: ${subject}\nQ: ${question}\nA: ${userAnswer}\nScore (1-100):`,
        },
      ],
      max_tokens: 20,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "";
    const match = content.match(/\b\d{1,3}\b/);
    const score = match ? parseInt(match[0], 10) : 0;
    return Math.max(1, Math.min(100, score));
  } catch (error) {
    console.error("Error in evaluateTeachingScore:", error);
    throw error; 
  }
}
