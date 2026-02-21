// import ollama from "ollama";

// export const ollamaClient = ollama;

// // This function actually evaluates the student's answer
// export async function evaluateTeachingScore(
//   question: string,
//   userAnswer: string,
//   subject: string
// ) {
//   const prompt = `
// You are a strict evaluator. Score the student's answer from 1 to 100.

// Subject: ${subject}
// Question: ${question}
// Student Answer: ${userAnswer}

// Respond ONLY with a number. DO NOT include any explanations,
// just the score. The score should reflect how well the student's
// answer addresses the question and demonstrates understanding of the subject.
// `;

//   const response = await ollama.chat({
//     model: "llama3.2",
//     messages: [{ role: "user", content: prompt }],
//   });

//   const raw = response.message?.content?.trim() || "0";
//   console.log("Raw evaluation response:", raw);

//   const score = raw.match(/\d+/)?.[0]
//     ? parseInt(raw.match(/\d+/)?.[0] || "0", 10)
//     : NaN;
//   console.log("Parsed score:", score);

//   if (isNaN(score)) {
//     return -1; // Indicate an error in parsing the score
//   }
//   return score;
// }
