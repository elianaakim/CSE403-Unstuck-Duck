import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function generateMeetingSdkSignature(
  sdkKey: string,
  sdkSecret: string,
  meetingNumber: string,
  role: number
): string {
  const issuedAt = Math.floor(Date.now() / 1000) - 30;
  const expiresAt = issuedAt + 60 * 60 * 2;

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sdkKey,
    appKey: sdkKey,
    mn: meetingNumber,
    role,
    iat: issuedAt,
    exp: expiresAt,
    tokenExp: expiresAt,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = base64UrlEncode(
    crypto.createHmac("sha256", sdkSecret).update(data).digest()
  );

  return `${data}.${signature}`;
}

export async function POST(req: NextRequest) {
  try {
    const { meetingNumber, role } = (await req.json()) as {
      meetingNumber?: string | number;
      role?: number;
    };

    if (!meetingNumber) {
      return NextResponse.json(
        { error: "meetingNumber is required" },
        { status: 400 }
      );
    }

    const sdkKey =
      process.env.ZOOM_MEETING_SDK_KEY ||
      process.env.ZOOM_SDK_KEY ||
      process.env.ZOOM_API_KEY;

    const sdkSecret =
      process.env.ZOOM_MEETING_SDK_SECRET ||
      process.env.ZOOM_CLIENT_SECRET ||
      process.env.SECRET_TOKEN;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom Meeting SDK credentials are not configured" },
        { status: 500 }
      );
    }

    const signature = generateMeetingSdkSignature(
      sdkKey,
      sdkSecret,
      String(meetingNumber).trim(),
      role === 1 ? 1 : 0
    );

    return NextResponse.json({ signature, sdkKey });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
