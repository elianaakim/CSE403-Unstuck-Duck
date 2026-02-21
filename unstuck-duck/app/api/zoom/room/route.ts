import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getRoom, setRoom } from "../../../lib/zoomRoomsStore";

/**
 * POST /api/zoom/room
 *
 * "Get or create" a Zoom meeting for a given topic.
 *
 * Body: { topic: string }
 *
 * - If a room for this topic already exists (and hasn't expired), return it.
 * - Otherwise create a new Zoom meeting, store it, and return it.
 *
 * The first person to hit this endpoint for a topic effectively becomes the
 * host; everyone else receives the same join_url and joins as a participant.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { topic?: string };
    const topic = body?.topic?.trim();

    if (!topic) {
      return NextResponse.json(
        { error: "A topic is required." },
        { status: 400 }
      );
    }

    // ── Check for an existing room ──
    const existing = getRoom(topic);
    if (existing) {
      return NextResponse.json({
        join_url: existing.joinUrl,
        meeting_id: existing.meetingId,
        password: existing.password,
        reused: true,
      });
    }

    // ── No active room – create a new Zoom meeting ──

    // 1. Get access token
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

    const accessToken = tokenResponse.data.access_token;

    // 2. Create the meeting
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

    const { join_url, id: meetingId, password } = zoomResponse.data;

    // 3. Store the room
    setRoom({
      topic,
      meetingId: String(meetingId),
      joinUrl: join_url,
      password: password ?? "",
      createdAt: Date.now(),
    });

    return NextResponse.json({
      join_url,
      meeting_id: meetingId,
      password,
      reused: false,
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: unknown };
      message?: string;
    };

    console.error("Zoom Room API Error:", err.response?.data || err.message);

    return NextResponse.json(
      {
        error: "Failed to get or create Zoom room",
        details: err.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
