import { NextRequest, NextResponse } from "next/server";
import { getSessionsStore } from "../../../lib/sessionsStore";

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

    session.endTime = new Date();
    session.status = "completed";
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    return NextResponse.json({
      sessionId,
      finalTeachingScore: session.teachingScore,
      duration: session.duration,
      topic: session.topic,
      startTime: session.startTime,
      endTime: session.endTime,
      evaluationCount: session.evaluationCount,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
