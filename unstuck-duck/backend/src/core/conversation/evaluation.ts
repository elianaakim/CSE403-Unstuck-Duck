// import { evaluateTeachingScore } from "../../routes/ollama";

// export interface EvaluationInput {
//   question: string;
//   userAnswer: string;
//   subject: string;
// }

// export interface EvaluationResult {
//   score: number;
// }

// export async function evaluateConversation(
//   input: EvaluationInput
// ): Promise<Response> {
//   const { question, userAnswer, subject } = input;

//   try {

//     const score = await evaluateTeachingScore(question, userAnswer, subject);

//     if (score === -1) {
//       return new Response(JSON.stringify({ error: "Failed to parse score" }), {
//         status: 500,
//       });
//     }

//     return new Response(JSON.stringify({ score }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Error evaluating conversation:", error);
//     return new Response(JSON.stringify({ error: "Failed to evaluate" }), {
//       status: 500,
//     });
//   }
// }
