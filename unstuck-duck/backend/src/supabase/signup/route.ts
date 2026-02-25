import { NextRequest, NextResponse } from "next/server";
import { createUserWithProfile } from "../users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, firstName, lastName, isTeacher } = body;
    console.log("Signup called with:", {
      username,
      email,
      firstName,
      lastName,
    });

    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await createUserWithProfile({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    console.log("User created:", user);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Signup error full details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
