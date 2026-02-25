"use client";

import { useCallback, useState, useEffect } from "react";
import { ZoomMtg } from "@zoom/meetingsdk";
import "@zoom/meetingsdk/dist/ui/zoom-meetingsdk.css";

const ZOOM_CREATE_MEETING_ENDPOINT = "/api/zoom";
const ZOOM_SIGNATURE_ENDPOINT =
  process.env.NEXT_PUBLIC_ZOOM_SIGNATURE_URL || "/api/zoom/signature";

export default function ZoomMeeting() {
  const [status, setStatus] = useState<"idle" | "creating" | "joining">("idle");
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);

  // Join form state
  const [meetingNumber, setMeetingNumber] = useState("");
  const [passcode, setPasscode] = useState("");
  const [userName, setUserName] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinedInPage, setJoinedInPage] = useState(false);

  useEffect(() => {
    ZoomMtg.setZoomJSLib("https://source.zoom.us/3.13.2/lib", "/av");
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();
  }, []);

  // --- CREATE ---
  const createAndJoinMeeting = useCallback(async () => {
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
        setMeetingId(meeting_id);
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

  // --- JOIN ---
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
            success: () => setJoinedInPage(true),
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

  if (joinedInPage) {
    return <div id="zmmtg-root" className="w-full h-full" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left mb-10">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black">
            Lake page
          </h1>
          <p className="max-w-md text-sm text-slate-600">
            Create a new Zoom meeting or join an existing one.
          </p>
        </div>

        <div className="flex w-full flex-col gap-6">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {meetingId ? (
            <p className="text-sm text-green-600">
              Successfully created meeting: {meetingId}
            </p>
          ) : null}

          {/* Create button */}
          <button
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={createAndJoinMeeting}
            disabled={status === "creating" || status === "joining"}
          >
            {status === "creating"
              ? "Creating Meeting..."
              : "Create and Join Meeting"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Join section */}
          {!showJoinForm ? (
            <button
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setShowJoinForm(true)}
              disabled={status === "creating" || status === "joining"}
            >
              Join an Existing Meeting
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
                Meeting number
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={meetingNumber}
                  onChange={(e) => setMeetingNumber(e.target.value)}
                  placeholder="123 456 7890"
                />
              </label>
              <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
                Passcode (optional)
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Passcode"
                />
              </label>
              <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
                Your name
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </label>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={joinMeeting}
                  disabled={status === "joining" || status === "creating"}
                >
                  {status === "joining" ? "Joining..." : "Join Meeting"}
                </button>
                <button
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    setShowJoinForm(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <div id="zmmtg-root" />
    </div>
  );
}
