"use client";

import { useCallback, useState } from "react";

const ZOOM_SIGNATURE_ENDPOINT =
  process.env.NEXT_PUBLIC_ZOOM_SIGNATURE_URL || "/api/zoom";
const ZOOM_CREATE_MEETING_ENDPOINT = "/api/zoom";

const PLACEHOLDER_TOPICS = [
  {
    id: 1,
    title: "Data Structures & Algorithms",
    description: "Discuss sorting, trees, graphs, and more.",
  },
  {
    id: 2,
    title: "Web Development Basics",
    description: "HTML, CSS, JavaScript, and frameworks.",
  },
  {
    id: 3,
    title: "Machine Learning 101",
    description: "Intro to ML concepts and models.",
  },
];

export default function Lake() {
  const [meetingNumber, setMeetingNumber] = useState("");
  const [passcode, setPasscode] = useState("");
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "joining" | "joined" | "creating"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);

  // --- JOIN an existing meeting ---
  const joinMeeting = useCallback(async () => {
    setError(null);

    if (!meetingNumber.trim() || !userName.trim()) {
      setError("Meeting number and name are required.");
      return;
    }

    setStatus("joining");

    try {
      const response = await fetch(ZOOM_SIGNATURE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingNumber, role: 0 }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || "Failed to fetch Zoom signature");
      }

      const { signature, sdkKey } = (await response.json()) as {
        signature: string;
        sdkKey: string;
      };

      const { ZoomMtg } = await import("@zoom/meetingsdk");

      ZoomMtg.setZoomJSLib("https://source.zoom.us/3.13.2/lib", "/av");
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();

      ZoomMtg.init({
        leaveUrl: window.location.href,
        disablePreview: true,
        success: () => {
          ZoomMtg.join({
            signature,
            sdkKey,
            meetingNumber,
            userName,
            passWord: passcode,
            success: () => setStatus("joined"),
            error: (joinError: { message?: string }) => {
              setError(joinError?.message || "Failed to join meeting");
              setStatus("idle");
            },
          });
        },
        error: (initError: { message?: string }) => {
          setError(initError?.message || "Failed to initialize Zoom");
          setStatus("idle");
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setStatus("idle");
    }
  }, [meetingNumber, passcode, userName]);

  // --- CREATE a new Zoom meeting ---
  const createMeeting = useCallback(async () => {
    setError(null);
    setStatus("creating");

    try {
      const response = await fetch(ZOOM_CREATE_MEETING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        throw new Error(
          payload.error || payload.details || "Failed to create Zoom meeting"
        );
      }

      const { join_url, meeting_id } = (await response.json()) as {
        join_url: string;
        meeting_id: string;
      };

      if (join_url) {
        setCreatedMeetingId(meeting_id);
        window.open(join_url, "_blank");
      } else {
        throw new Error("No join_url received from the server.");
      }

      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setStatus("idle");
    }
  }, []);

  // --- JOIN a placeholder topic (creates a meeting for that topic) ---
  const joinTopic = useCallback(async (topicTitle: string) => {
    setError(null);
    setStatus("creating");

    try {
      const response = await fetch(ZOOM_CREATE_MEETING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicTitle }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        throw new Error(
          payload.error || payload.details || "Failed to create Zoom meeting"
        );
      }

      const { join_url, meeting_id } = (await response.json()) as {
        join_url: string;
        meeting_id: string;
      };

      if (join_url) {
        setCreatedMeetingId(meeting_id);
        window.open(join_url, "_blank");
      } else {
        throw new Error("No join_url received from the server.");
      }

      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setStatus("idle");
    }
  }, []);

  const busy = status === "joining" || status === "creating";

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <main className="flex w-full max-w-3xl flex-col gap-10 py-16 px-8 sm:px-16">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black">
            Lake
          </h1>
          <p className="text-sm text-slate-600">
            Pick a topic to start a Zoom session, or join / create your own
            meeting below.
          </p>
        </div>

        {/* ── Topic Cards ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-black">Topics</h2>
          {PLACEHOLDER_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-5 py-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-black">
                  {topic.title}
                </span>
                <span className="text-xs text-slate-500">
                  {topic.description}
                </span>
              </div>
              <button
                className="ml-4 shrink-0 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => joinTopic(topic.title)}
                disabled={busy}
              >
                Join
              </button>
            </div>
          ))}
        </section>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">
            or join / create manually
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* ── Manual Join / Create Section ── */}
        <section className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
            Meeting ID
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={meetingNumber}
              onChange={(event) => setMeetingNumber(event.target.value)}
              placeholder="123 456 7890"
            />
          </label>
          <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
            Password (optional)
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Password"
            />
          </label>
          <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
            Your name
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Jane Doe"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {createdMeetingId ? (
            <p className="text-sm text-green-600">
              Meeting created: {createdMeetingId}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={joinMeeting}
              disabled={busy}
            >
              {status === "joining" ? "Joining..." : "Join Meeting"}
            </button>
            <button
              className="flex-1 rounded-md border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={createMeeting}
              disabled={busy}
            >
              {status === "creating" ? "Creating..." : "Create Zoom Meeting"}
            </button>
          </div>
        </section>
      </main>
      <div id="zmmtg-root" />
    </div>
  );
}
