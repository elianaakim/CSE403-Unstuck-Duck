import { NextRequest, NextResponse } from "next/server";
import { getSessionsStore } from "../../../lib/sessionsStore";
import { getServiceSupabase } from "../../../../backend/src/supabase/supabase";

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

    // Save to Supabase if user is authenticated
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      try {
        const supabase = getServiceSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser(token);

        if (user) {
          // Save session
          const { data: savedSession, error: sessionError } = await supabase
            .from("Sessions")
            .insert({
              user_id: user.id,
              topic: session.topic,
              started_at: session.startTime.toISOString(),
              ended_at: session.endTime.toISOString(),
              score: session.teachingScore,
            })
            .select()
            .single();

          if (sessionError) {
            console.error("Error saving session:", sessionError);
          } else {
            // Save messages (skip system messages)
            const messages = session.conversationHistory
              .filter((m) => m.role !== "system")
              .map((m) => ({
                session_id: savedSession.session_id,
                role: m.role,
                content: m.content,
                created_at: new Date().toISOString(),
              }));

            const { error: messagesError } = await supabase
              .from("Messages")
              .insert(messages);

            if (messagesError)
              console.error("Error saving messages:", messagesError);
          }
        }
      } catch (dbError) {
        // Don't fail the whole request if DB save fails
        console.error("DB save error:", dbError);
      }
    }

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