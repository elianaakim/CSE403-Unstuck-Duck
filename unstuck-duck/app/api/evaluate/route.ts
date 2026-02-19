import { NextRequest, NextResponse } from "next/server";
import { evaluateConversation } from "../../../core/conversation/evaluation";
import { getSessionsStore } from "../../lib/sessionsStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const sessions = getSessionsStore();
    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Session is not active" },
        { status: 400 }
      );
    }

    const conversation = session.conversationHistory;

    const lastUserIndex = [...conversation]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find((x) => x.m.role === "user")?.i;

    if (lastUserIndex === undefined || lastUserIndex <= 0) {
      return NextResponse.json(
        {
          error: "Need at least one question and answer to evaluate teaching",
        },
        { status: 400 }
      );
    }

    const lastUserAnswer = conversation[lastUserIndex].content;
    const lastQuestion = conversation[lastUserIndex - 1].content;

    const evaluation = await evaluateConversation({
      question: lastQuestion,
      userAnswer: lastUserAnswer,
      subject: session.topic,
    });

    session.teachingScore = evaluation.score;
    session.lastEvaluatedAt = new Date();
    session.evaluationCount++;

    let feedback = "";
    if (session.teachingScore >= 90) {
      feedback = "Outstanding teaching! I feel very prepared for the exam.";
    } else if (session.teachingScore >= 80) {
      feedback = "Great teaching! I have a strong understanding.";
    } else if (session.teachingScore >= 70) {
      feedback = "Good teaching. I'm getting the main concepts.";
    } else if (session.teachingScore >= 60) {
      feedback = "Fair teaching. I understand the basics.";
    } else if (session.teachingScore >= 50) {
      feedback = "Okay teaching. I need more clarity on some points.";
    } else {
      feedback = "Keep teaching! I need more explanation to understand.";
    }

    return NextResponse.json({
      sessionId,
      teachingScore: session.teachingScore,
      lastQuestion,
      feedback,
      message: `Based on your teaching, I think I'd score around a ${session.teachingScore}/100 on an exam. ${feedback}`,
      evaluationCount: session.evaluationCount,
      timestamp: session.lastEvaluatedAt,
    });
  } catch (error) {
    console.error("Error evaluating teaching:", error);
    return NextResponse.json(
      { error: "Failed to evaluate teaching" },
      { status: 500 }
    );
  }
}
