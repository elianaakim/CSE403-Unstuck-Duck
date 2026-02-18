import { evaluateTeachingScore } from "../../routes/ollama";

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

    if (score === -1) {
      return new Response(JSON.stringify({ error: "Failed to parse score" }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ score }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error evaluating conversation:", error);
    return new Response(JSON.stringify({ error: "Failed to evaluate" }), {
      status: 500,
    });
  }

  // Call your Ollama scoring function
  const score = await evaluateTeachingScore(question, userAnswer, subject);

  return { score };
}
