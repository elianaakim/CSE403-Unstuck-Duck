import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "../../../backend/src/supabase/supabase";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    console.log("History: token present?", !!token);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    console.log("History: supabase created");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    console.log("History: user?", !!user, "error?", authError?.message);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", detail: authError?.message },
        { status: 401 }
      );
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("Sessions")
      .select(
        `
        session_id,
        topic,
        started_at,
        ended_at,
        score,
        Messages (
          message_id,
          role,
          content,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .gte("started_at", thirtyDaysAgo.toISOString())
      .order("started_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sessions: data });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch history" },
      { status: 500 }
    );
  }
}
