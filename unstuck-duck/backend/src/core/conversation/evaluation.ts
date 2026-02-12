import { evaluateTeachingScore } from "../../routes/ollama";

// Evaluates the student with a teaching score from 1-100.
export async function evaluateConversation(req: Request) {
  try {
    const body = await req.json();
    const { question, userAnswer, subject } = body || {};

    // Validation
    if (!question || !userAnswer || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Get AI-generated score
    const score = await evaluateTeachingScore(question, userAnswer, subject);

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
}
