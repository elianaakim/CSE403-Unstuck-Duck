import { NextRequest, NextResponse } from "next/server";
import { generateFirstQuestion } from "../../../../core/conversation/dialogue";
import { getSessionsStore } from "../../../lib/sessionsStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Valid topic is required" },
        { status: 400 }
      );
    }

    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const firstQuestion = await generateFirstQuestion(topic);

    const session = {
      sessionId,
      topic: topic.trim(),
      startTime: new Date(),
      conversationHistory: [
        { role: "system" as const, content: `Learning about ${topic}` },
        { role: "assistant" as const, content: firstQuestion },
      ],
      status: "active" as const,
      teachingScore: 0,
      lastEvaluatedAt: null,
      evaluationCount: 0,
    };

    const sessions = getSessionsStore();
    sessions.set(sessionId, session);

    return NextResponse.json({
      sessionId,
      duckQuestion: firstQuestion,
      topic: session.topic,
      startTime: session.startTime,
      teachingScore: 0,
      message: `Started teaching session on "${topic}"`,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    );
  }
}
