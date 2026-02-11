import ollama from "ollama";

export const ollamaClient = ollama;

// This function actually evaluates the student's answer
export async function evaluateTeachingScore(
  question: string,
  userAnswer: string,
  subject: string
) {
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

  const raw = response.message?.content?.trim() || "0";
  const score = parseInt(raw, 10);

  return isNaN(score) ? 0 : score;
}
