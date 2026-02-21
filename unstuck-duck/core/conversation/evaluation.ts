import { evaluateTeachingScore } from "../../app/lib/gemini";

export interface EvaluationInput {
  question: string;
  userAnswer: string;
  subject: string;
}

export interface EvaluationResult {
  score: number;
}

export async function evaluateConversation(
  input: EvaluationInput
): Promise<EvaluationResult> {
  const { question, userAnswer, subject } = input;

  // Basic validation
  if (
    !question ||
    typeof question !== "string" ||
    !userAnswer ||
    typeof userAnswer !== "string" ||
    !subject ||
    typeof subject !== "string"
  ) {
    throw new Error("Missing required fields");
  }

  // Call your Ollama scoring function
  const score = await evaluateTeachingScore(question, userAnswer, subject);

  return { score };
}
