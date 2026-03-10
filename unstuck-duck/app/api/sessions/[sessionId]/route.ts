import { NextRequest, NextResponse } from "next/server";
import { getSessionsStore } from "../../../lib/sessionsStore";
import { getServiceSupabase } from "@/supabase/supabase";

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

// Add this DELETE function
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", detail: authError?.message },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    // Verify ownership
    const { data: session, error: fetchError } = await supabase
      .from("Sessions")
      .select("user_id")
      .eq("session_id", sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete messages first
    await supabase
      .from("Messages")
      .delete()
      .eq("session_id", sessionId);

    // Delete session
    const { error: deleteError } = await supabase
      .from("Sessions")
      .delete()
      .eq("session_id", sessionId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
