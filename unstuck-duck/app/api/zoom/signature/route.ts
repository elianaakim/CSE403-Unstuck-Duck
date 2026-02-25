import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * POST /api/zoom/signature
 *
 * Generates a Meeting SDK JWT signature so the client-side Zoom Web SDK
 * can join a meeting in the browser.
 *
 * Body: { meetingNumber: string, role: number }
 *   - role 0 = attendee, role 1 = host
 *
 * Uses ZOOM_SDK_CLIENT_ID and ZOOM_SDK_CLIENT_SECRET from .env
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      meetingNumber?: string;
      role?: number;
    };

    const meetingNumber = body?.meetingNumber;
    const role = body?.role ?? 0;

    if (!meetingNumber) {
      return NextResponse.json(
        { error: "meetingNumber is required." },
        { status: 400 }
      );
    }

    const sdkKey = process.env.ZOOM_SDK_CLIENT_ID ?? "";
    const sdkSecret = process.env.ZOOM_SDK_CLIENT_SECRET ?? "";

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom SDK credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const iat = Math.round(Date.now() / 1000) - 30; // 30 seconds in the past
    const exp = iat + 60 * 60 * 2; // 2 hours

    const payload = {
      sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      tokenExp: exp,
    };

    const signature = jwt.sign(payload, sdkSecret);

    return NextResponse.json({ signature, sdkKey });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Zoom Signature Error:", err.message);

    return NextResponse.json(
      {
        error: "Failed to generate Zoom signature",
        details: err.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
