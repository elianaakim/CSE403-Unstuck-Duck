import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "../supabase";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) throw error;

    // Get additional user info
    const { data: userInfo, error: infoError } = await supabase
      .from("User_Info")
      .select(
        `
        first_name,
        last_name,
        is_teacher,
        Users!inner (
          username,
          email,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        ...(typeof userInfo === "object" && userInfo !== null ? userInfo : {}),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Not authenticated" },
      { status: 401 }
    );
  }
}
