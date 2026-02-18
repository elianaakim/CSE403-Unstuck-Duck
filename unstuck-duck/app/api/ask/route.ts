import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpQuestion } from "../../../core/conversation/dialogue";
import { getSessionsStore } from "../../lib/sessionsStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userResponse } = body;

    if (!sessionId || typeof userResponse !== "string") {
      return NextResponse.json(
        {
          error: "sessionId and userResponse (string) are required",
        },
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

    session.conversationHistory.push({
      role: "user",
      content: userResponse,
    });

    const followUpQuestion = await generateFollowUpQuestion(
      session.topic,
      session.conversationHistory.slice(0, -1),
      userResponse
    );

    session.conversationHistory.push({
      role: "assistant",
      content: followUpQuestion,
    });

    return NextResponse.json({
      sessionId,
      duckQuestion: followUpQuestion,
      currentTeachingScore: session.teachingScore,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error generating question:", error);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
