import { NextRequest, NextResponse } from "next/server";
import { getSessionsStore } from "../../../lib/sessionsStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessions = getSessionsStore();
    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      sessionId,
      topic: session.topic,
      status: session.status,
      startTime: session.startTime,
      teachingScore: session.teachingScore,
      evaluationCount: session.evaluationCount,
      conversationLength: session.conversationHistory.length,
      lastEvaluatedAt: session.lastEvaluatedAt,
      endTime: session.endTime,
      duration: session.duration,
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
