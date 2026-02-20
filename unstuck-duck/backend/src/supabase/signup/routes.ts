import { NextRequest, NextResponse } from "next/server";
import { createUserWithProfile } from "../users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, firstName, lastName, isTeacher } = body;

    // Validation
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
      isTeacher: isTeacher || false,
    });

    // Don't return sensitive data
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isTeacher: user.is_teacher,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
