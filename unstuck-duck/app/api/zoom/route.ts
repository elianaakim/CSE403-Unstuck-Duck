// This route creates a new Zoom meeting directly, without topic reuse or persistent storage.
// Use this only if you need to create meetings that are not tied to a topic or Supabase.
// For topic-based persistent rooms, see zoom/room/route.ts.
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    // Read optional topic from request body
    let topic = "Scheduled Meeting";
    try {
      const body = (await request.json()) as { topic?: string };
      if (body?.topic) topic = body.topic;
    } catch {
      // no body or invalid JSON – use default topic
    }

    // Get access token
    const tokenResponse = await axios.post(
      "https://zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "account_credentials",
        account_id: String(process.env.ZOOM_ACCOUNT_ID ?? ""),
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${String(process.env.ZOOM_CLIENT_ID ?? "")}:${String(
              process.env.ZOOM_CLIENT_SECRET ?? ""
            )}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Token Response:", tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;

    // Create Zoom meeting
    const zoomResponse = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 2,
        start_time: new Date().toISOString(),
        duration: 30,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Zoom Response:", zoomResponse.data);

    return NextResponse.json({
      join_url: zoomResponse.data.join_url,
      meeting_id: zoomResponse.data.id,
      password: zoomResponse.data.password,
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: unknown };
      message?: string;
    };

    console.error("Zoom API Error:", err.response?.data || err.message);

    return NextResponse.json(
      {
        error: "Failed to create Zoom meeting",
        details: err.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
