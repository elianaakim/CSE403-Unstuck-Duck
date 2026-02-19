"use client";

import { useCallback, useState } from "react";
import "@zoom/meetingsdk/dist/css/bootstrap.css";
import "@zoom/meetingsdk/dist/css/react-select.css";

const ZOOM_SIGNATURE_ENDPOINT =
  process.env.NEXT_PUBLIC_ZOOM_SIGNATURE_URL || "/api/zoom";

export default function Lake() {
  const [meetingNumber, setMeetingNumber] = useState("");
  const [passcode, setPasscode] = useState("");
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<"idle" | "joining" | "joined">("idle");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black">
            Lake page
          </h1>
          <p className="max-w-md text-sm text-slate-600">
            Join a Zoom meeting directly from this page.
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 text-base font-medium">
          <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
            Meeting number
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={meetingNumber}
              onChange={(event) => setMeetingNumber(event.target.value)}
              placeholder="123 456 7890"
            />
          </label>
          <label className="flex flex-col gap-2 text-left text-sm text-slate-700">
            Passcode (optional)
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Passcode"
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
          <button
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={joinMeeting}
            disabled={status === "joining"}
          >
            {status === "joining" ? "Joining..." : "Join meeting"}
          </button>
        </div>
      </main>
      <div id="zmmtg-root" />
    </div>
  );
}
