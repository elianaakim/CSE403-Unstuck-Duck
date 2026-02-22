import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function chat(messages: Array<{ role: string; content: string }>) {
  try {
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const messagesWithSystem = nonSystemMessages.map((m, i) => ({
      ...m,
      content:
        i === 0 && systemMessage
          ? `${systemMessage.content}\n\n${m.content}`
          : m.content,
    }));

    const history = messagesWithSystem.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    console.log(
      "History being sent to Gemini:",
      JSON.stringify(history, null, 2)
    );

    const lastMessage = messagesWithSystem[messagesWithSystem.length - 1];
    const chatSession = geminiModel.startChat({ history });
    const result = await chatSession.sendMessage(lastMessage.content);
    return result.response.text();
  } catch (error) {
    console.error("Gemini chat error:", error);
    throw error;
  }
}

export async function evaluateTeachingScore(
  question: string,
  userAnswer: string,
  subject: string
): Promise<number> {
  const prompt = `You are evaluating how well someone explained a topic.
Subject: ${subject}
Question asked: ${question}
User's explanation: ${userAnswer}

Rate the explanation from 0 to 100 based on clarity, accuracy, and depth.
Respond with ONLY a number between 0 and 100.`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text().trim();
  const score = parseInt(text, 10);
  return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
}
