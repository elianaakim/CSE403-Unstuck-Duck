import ollama from "ollama";

export const ollamaClient = ollama;

export async function evaluateTeachingScore(
  question: string,
  userAnswer: string,
  subject: string
): Promise<number> {
  const prompt = `
You are a strict evaluator. Score the student's answer from 1 to 100.

Subject: ${subject}
Question: ${question}
Student Answer: ${userAnswer}

Respond ONLY with a number.
`;

  const response = await ollama.chat({
    model: "gpt-oss",
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.message?.content?.trim() ?? "0";
  const score = parseInt(raw, 10);

  return Number.isNaN(score) ? 0 : score;
}
