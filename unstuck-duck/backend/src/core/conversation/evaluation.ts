import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function evaluateConversation(req: any) {
  try {
    console.log("HERE");
    const body = await req.json();
    const { question, userAnswer, subject } = body || {}; // Get the AI's question & user's answer

    if (
      typeof question !== "string" ||
      question.trim().length === 0 ||
      typeof userAnswer !== "string" ||
      userAnswer.trim().length === 0 ||
      typeof subject !== "string" ||
      subject.trim().length === 0
    ) {
      return Response.json(
        { error: "Invalid request body: 'question', 'userAnswer', and 'subject' must be non-empty strings." },
        { status: 400 }
      );
    }
    // Step 1: Evaluate how well the user answered the question
    const evaluationResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI evaluator that assigns a score from 1-100 based on how well the user's response answers the given question, in the context of the given subject. If the answer is not in relation to the subject at all, then give a score of 1. Consider relevance, clarity, and completeness. Allow room for improvement with subsequent attempts. Return only the number, with no extra text.",
        },
        {
          role: "user",
          content: `Subject: "${subject}"\nQuestion: "${question}"\nUser's Answer: "${userAnswer}"\nScore (1-100):`,
        },
      ],
      max_tokens: 10,
    });
    console.log(evaluationResponse);

    let newScore = 0;
    if (
      evaluationResponse.choices[0].message &&
      evaluationResponse.choices[0].message.content
    ) {
      const parsed = parseInt(
        evaluationResponse.choices[0].message.content.trim(),
        10
      );
      newScore = !isNaN(parsed) ? parsed : 0;
    }

    return new Response(JSON.stringify({ score: newScore }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error calculating score:", error);
    return new Response(
      JSON.stringify({ error: "Failed to calculate score" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
