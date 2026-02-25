import { NextRequest, NextResponse } from "next/server";
import { clientSupabase } from "../supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const { data, error } = await clientSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get additional user info from your tables
    const { data: userInfo, error: infoError } = await clientSupabase
      .from("User_Info")
      .select(
        `
        first_name,
        last_name,
        Users!inner (
          username,
          email,
          created_at
        )
      `
      )
      .eq("user_id", data.user.id)
      .single();

    return NextResponse.json({
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...userInfo,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
