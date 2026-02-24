import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Use service key for server routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? ""
);

type ZoomRoomRow = {
  topic: string;
  meeting_id: string;
  join_url: string;
  password: string | null;
  created_at: string;
};

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

    // 1️⃣ Check for existing room
    const { data: existing, error: selectErr } = await supabase
      .from("zoom_rooms")
      .select("topic, meeting_id, join_url, password, created_at")
      .eq("topic", topic)
      .maybeSingle<ZoomRoomRow>();

    if (selectErr) {
      console.error("Supabase select error:", selectErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existing) {
      const createdAtMs = new Date(existing.created_at).getTime();
      const isFresh = Date.now() - createdAtMs < ROOM_TTL_MS;

      if (isFresh) {
        return NextResponse.json({
          join_url: existing.join_url,
          meeting_id: existing.meeting_id,
          password: existing.password,
          reused: true,
        });
      }
    }

    // 2️⃣ Get Zoom access token
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

    // 3️⃣ Create new Zoom meeting
    const zoomResponse = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 2,
        start_time: new Date().toISOString(),
        duration: 30,
        timezone: "America/Los_Angeles",
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

    const meetingId = String(zoomResponse.data.id);
    const joinUrl = String(zoomResponse.data.join_url);
    const password = zoomResponse.data.password
      ? String(zoomResponse.data.password)
      : null;

    // 4️⃣ Store in Supabase (topic must be UNIQUE)
    const { error: upsertErr } = await supabase.from("zoom_rooms").upsert(
      {
        topic,
        meeting_id: meetingId,
        join_url: joinUrl,
        password,
        created_at: new Date().toISOString(),
      },
      { onConflict: "topic" }
    );

    if (upsertErr) {
      console.error("Supabase upsert error:", upsertErr);
    }

    return NextResponse.json({
      join_url: joinUrl,
      meeting_id: meetingId,
      password,
      reused: false,
    });
  } catch (error: any) {
    console.error("Zoom Room Error:", error.response?.data || error.message);

    return NextResponse.json(
      {
        error: "Failed to get/create Zoom room",
        details: error.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
