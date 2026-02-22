"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ZOOM_SIGNATURE_ENDPOINT =
  process.env.NEXT_PUBLIC_ZOOM_SIGNATURE_URL || "/api/zoom/signature";
const ZOOM_CREATE_MEETING_ENDPOINT = "/api/zoom";
const ZOOM_ROOM_ENDPOINT = "/api/zoom/room";

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

  // ── Iframe-based Zoom join ──
  const [showZoomFrame, setShowZoomFrame] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingCredentials = useRef<Record<string, string> | null>(null);

  // Listen for status messages coming back from the Zoom iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== "zoom-status") return;

      switch (event.data.status) {
        case "ready":
          // Iframe scripts loaded → send the credentials we stored earlier
          if (pendingCredentials.current && iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              pendingCredentials.current,
              "*"
            );
            pendingCredentials.current = null;
          }
          break;
        case "joined":
          setStatus("joined");
          break;
        case "error":
          setError(event.data.message || "Zoom meeting error");
          setStatus("idle");
          setShowZoomFrame(false);
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  /** Close the Zoom iframe overlay. */
  const closeZoomFrame = useCallback(() => {
    setShowZoomFrame(false);
    setStatus("idle");
    pendingCredentials.current = null;
  }, []);

  // --- JOIN an existing meeting (via isolated iframe) ---
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

      // Store credentials; the iframe will request them on "ready"
      pendingCredentials.current = {
        type: "join-meeting",
        signature,
        sdkKey,
        meetingNumber,
        userName,
        passWord: passcode,
      };

      setShowZoomFrame(true);
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

  // --- JOIN a topic room (get existing or create new) ---
  const joinTopic = useCallback(async (topicTitle: string) => {
    setError(null);
    setStatus("creating");
  
    try {
      const response = await fetch(ZOOM_ROOM_ENDPOINT, {
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
          payload.error || payload.details || "Failed to get Zoom meeting"
        );
      }
  
      const { join_url, meeting_id, password } = (await response.json()) as {
        join_url: string;
        meeting_id: string;
        password: string;
      };
  
      if (join_url) {
        // Use the direct join URL - Zoom handles joining existing meetings
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

      {/* ── Zoom iframe overlay ── */}
      {showZoomFrame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <span className="text-sm font-semibold text-black">
              Zoom Meeting
            </span>
            <button
              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              onClick={closeZoomFrame}
            >
              Leave
            </button>
          </div>
          <iframe
            ref={iframeRef}
            src="/zoom-frame.html"
            className="flex-1 w-full border-0"
            allow="camera; microphone; display-capture; autoplay; fullscreen"
          />
        </div>
      )}
    </div>
  );
}
