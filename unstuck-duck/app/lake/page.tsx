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
  const [status, setStatus] = useState<"idle" | "joining" | "joined" | "creating">("idle");
  const [error, setError] = useState<string | null>(null);
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);

  const [showZoomFrame, setShowZoomFrame] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingCredentials = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== "zoom-status") return;

      switch (event.data.status) {
        case "ready":
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

  const closeZoomFrame = useCallback(() => {
    setShowZoomFrame(false);
    setStatus("idle");
    pendingCredentials.current = null;
  }, []);

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
    <div className="flex min-h-screen font-sans transition-colors duration-300 bg-stone-50 dark:bg-neutral-950">
      <main className="flex w-full max-w-5xl mx-auto gap-8 px-8 py-10">

        {/* ── Right: Content ── */}
        <div className="flex-1 flex flex-col min-h-[calc(100vh-5rem)]">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">The Lake</h1>
            <p className="text-sm text-stone-500 dark:text-neutral-400">
              Pick a topic to start a Zoom session, or join/create your own meeting below.
            </p>
          </div>

          {/* ── Topic Cards ── */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-stone-900 dark:text-white">Topic Rooms</h2>
            <div className="flex flex-col gap-3">
              {PLACEHOLDER_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between rounded-2xl border p-5 transition-colors duration-300 bg-white dark:bg-white/5 border-stone-200 dark:border-white/10"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-stone-900 dark:text-white">
                      {topic.title}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-neutral-400">
                      {topic.description}
                    </span>
                  </div>
                  <button
                    className="ml-4 shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-sky-400 hover:bg-sky-300 text-neutral-950"
                    onClick={() => joinTopic(topic.title)}
                    disabled={busy}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-stone-200 dark:bg-white/10 transition-colors duration-300" />
            <span className="text-xs text-stone-400 dark:text-neutral-600 transition-colors duration-300">
              or join / create manually
            </span>
            <div className="h-px flex-1 bg-stone-200 dark:bg-white/10 transition-colors duration-300" />
          </div>

          {/* ── Manual Join/Create Section ── */}
          <section className="rounded-2xl border p-6 transition-colors duration-300 bg-white dark:bg-white/5 border-stone-200 dark:border-white/10">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-stone-700 dark:text-neutral-300">Meeting ID</span>
                <input
                  className="px-4 py-3 rounded-xl text-sm border-2 transition-colors duration-200 focus:outline-none focus:ring-2
                    bg-white dark:bg-white/5 border-stone-200 dark:border-white/10
                    text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-neutral-600
                    focus:border-sky-400 focus:ring-sky-400/20"
                  value={meetingNumber}
                  onChange={(e) => setMeetingNumber(e.target.value)}
                  placeholder="123 456 7890"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-stone-700 dark:text-neutral-300">Password (optional)</span>
                <input
                  className="px-4 py-3 rounded-xl text-sm border-2 transition-colors duration-200 focus:outline-none focus:ring-2
                    bg-white dark:bg-white/5 border-stone-200 dark:border-white/10
                    text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-neutral-600
                    focus:border-sky-400 focus:ring-sky-400/20"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Password"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-stone-700 dark:text-neutral-300">Your name</span>
                <input
                  className="px-4 py-3 rounded-xl text-sm border-2 transition-colors duration-200 focus:outline-none focus:ring-2
                    bg-white dark:bg-white/5 border-stone-200 dark:border-white/10
                    text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-neutral-600
                    focus:border-sky-400 focus:ring-sky-400/20"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </label>

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              )}
              
              {createdMeetingId && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Meeting created: {createdMeetingId}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-400 hover:bg-sky-300 text-neutral-950"
                  onClick={joinMeeting}
                  disabled={busy}
                >
                  {status === "joining" ? "Joining..." : "Join Meeting"}
                </button>
                <button
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-neutral-300"
                  onClick={createMeeting}
                  disabled={busy}
                >
                  {status === "creating" ? "Creating..." : "Create Meeting"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Zoom iframe overlay ── */}
      {showZoomFrame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-50 dark:bg-neutral-950 transition-colors duration-300">
          <div className="flex items-center justify-between border-b px-4 py-3 border-stone-200 dark:border-white/10 transition-colors duration-300">
            <span className="text-sm font-semibold text-stone-900 dark:text-white">
              Zoom Meeting
            </span>
            <button
              className="rounded-xl px-4 py-2 text-sm font-semibold transition-colors bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-neutral-300"
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