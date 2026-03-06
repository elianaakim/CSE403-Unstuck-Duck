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
    description: "Sorting, trees, graphs, and complexity.",
    index: "01",
  },
  {
    id: 2,
    title: "Web Development Basics",
    description: "HTML, CSS, JavaScript, and frameworks.",
    index: "02",
  },
  {
    id: 3,
    title: "Machine Learning 101",
    description: "Intro to ML concepts and models.",
    index: "03",
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
  const [showZoomFrame, setShowZoomFrame] = useState(false);
  const [mounted, setMounted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingCredentials = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
  }, []);

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
      setError(err instanceof Error ? err.message : "Unexpected error");
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
      } else throw new Error("No join_url received from the server.");
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
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
      } else throw new Error("No join_url received from the server.");
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setStatus("idle");
    }
  }, []);

  const busy = status === "joining" || status === "creating";

  return (
    <>
      <style>{`
        @keyframes l-fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes l-zoomIn {
          from { opacity:0; transform:scale(0.97); }
          to   { opacity:1; transform:scale(1); }
        }

        .l-s1 { animation: l-fadeUp 0.5s 0.04s cubic-bezier(0.22,1,0.36,1) both; }
        .l-s2 { animation: l-fadeUp 0.5s 0.10s cubic-bezier(0.22,1,0.36,1) both; }
        .l-s3 { animation: l-fadeUp 0.5s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
        .l-s4 { animation: l-fadeUp 0.5s 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .l-s5 { animation: l-fadeUp 0.5s 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .l-zoom-overlay { animation: l-zoomIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }

        .l-input {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border2);
          border-left: 3px solid rgba(56,189,248,0.5);
          color: var(--white);
          font-family: var(--font-body);
          font-size: 14px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          border-radius: 0;
        }
        .l-input::placeholder { color: rgba(80,76,68,0.5); }
        .l-input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 1px #38bdf8;
        }

        .l-btn-sky {
          font-family: var(--font-display);
          font-size: 13px;
          letter-spacing: 0.12em;
          padding: 12px 28px;
          background: #38bdf8;
          color: var(--black);
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .l-btn-sky:hover:not(:disabled) {
          background: #7dd3fc;
          transform: translateY(-1px);
          box-shadow: 0 4px 0 rgba(56,189,248,0.3);
        }
        .l-btn-sky:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
        .l-btn-sky:disabled { opacity: 0.35; cursor: not-allowed; }

        .l-btn-ghost {
          font-family: var(--font-display);
          font-size: 13px;
          letter-spacing: 0.12em;
          padding: 12px 28px;
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border2);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .l-btn-ghost:hover:not(:disabled) {
          border-color: var(--white);
          color: var(--white);
        }
        .l-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }

        .l-topic-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          background: var(--card);
          border: 1px solid var(--border);
          border-left: 3px solid rgba(56,189,248,0.3);
          transition: border-color 0.15s, background 0.15s;
          cursor: default;
        }
        .l-topic-row:hover {
          border-color: rgba(56,189,248,0.5);
          border-left-color: #38bdf8;
          background: rgba(56,189,248,0.04);
        }

        .l-divider-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          white-space: nowrap;
          padding: 0 12px;
        }
      `}</style>

      <div
        className="z1 min-h-screen flex flex-col items-center"
        style={{
          fontFamily: "var(--font-body)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.3s ease",
          paddingTop: 56,
        }}
      >
        <main className="w-full max-w-3xl px-8 py-10">
          {/* ── Header ── */}
          <div
            className="l-s1 mb-10 pb-6"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "#38bdf8",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              / Collaborative Study
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 7vw, 72px)",
                lineHeight: 0.9,
                letterSpacing: "0.02em",
                color: "var(--white)",
                marginBottom: 12,
              }}
            >
              THE
              <br />
              <span style={{ color: "#38bdf8" }}>LAKE.</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--muted)",
                letterSpacing: "0.05em",
              }}
            >
              Pick a topic room or join / create a Zoom session below.
            </p>
          </div>

          {/* ── Topic Rooms ── */}
          <section className="l-s2 mb-10">
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "var(--muted)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              / Topic Rooms
              <span
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--border)",
                  display: "inline-block",
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              {PLACEHOLDER_TOPICS.map((topic, i) => (
                <div
                  key={topic.id}
                  className="l-topic-row l-s2"
                  style={{ animationDelay: `${0.1 + i * 0.06}s` }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "rgba(56,189,248,0.5)",
                        letterSpacing: "0.1em",
                        flexShrink: 0,
                      }}
                    >
                      {topic.index}
                    </span>
                    <div className="min-w-0">
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 15,
                          letterSpacing: "0.06em",
                          color: "var(--white)",
                          textTransform: "uppercase",
                        }}
                      >
                        {topic.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: "var(--muted)",
                          letterSpacing: "0.04em",
                          marginTop: 2,
                        }}
                      >
                        {topic.description}
                      </div>
                    </div>
                  </div>
                  <button
                    className="l-btn-sky flex-shrink-0"
                    onClick={() => joinTopic(topic.title)}
                    disabled={busy}
                    style={{ padding: "10px 22px", fontSize: 12 }}
                  >
                    {busy ? "…" : "JOIN →"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Divider ── */}
          <div className="l-s3 flex items-center mb-10">
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span className="l-divider-label">or join / create manually</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* ── Manual Join / Create ── */}
          <section
            className="l-s4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid rgba(56,189,248,0.4)",
              padding: "24px 24px 20px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "var(--lo)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              / Manual Session
              <span
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--border)",
                  display: "inline-block",
                }}
              />
            </div>

            <div className="flex flex-col gap-4">
              {/* Meeting ID */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Meeting ID
                </div>
                <input
                  className="l-input"
                  value={meetingNumber}
                  onChange={(e) => setMeetingNumber(e.target.value)}
                  placeholder="123 456 7890"
                />
              </div>

              {/* Password */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Password{" "}
                  <span style={{ color: "var(--lo)" }}>(optional)</span>
                </div>
                <input
                  className="l-input"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••"
                  type="password"
                />
              </div>

              {/* Name */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Your Name
                </div>
                <input
                  className="l-input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255,107,107,0.07)",
                    border: "1px solid rgba(255,107,107,0.3)",
                    borderLeft: "3px solid #ff6b6b",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "#ff6b6b",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ⚠ {error}
                  </p>
                </div>
              )}

              {/* Success */}
              {createdMeetingId && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(200,241,53,0.06)",
                    border: "1px solid rgba(200,241,53,0.25)",
                    borderLeft: "3px solid var(--acid)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--acid)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ✓ Meeting created — ID: {createdMeetingId}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  className="l-btn-sky flex-1"
                  onClick={joinMeeting}
                  disabled={busy}
                >
                  {status === "joining" ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          border: "2px solid rgba(0,0,0,0.2)",
                          borderTop: "2px solid black",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      JOINING…
                    </span>
                  ) : (
                    "JOIN MEETING"
                  )}
                </button>
                <button
                  className="l-btn-ghost flex-1"
                  onClick={createMeeting}
                  disabled={busy}
                >
                  {status === "creating" ? "CREATING…" : "CREATE MEETING"}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ── Zoom iframe overlay ── */}
      {showZoomFrame && (
        <div
          className="l-zoom-overlay fixed inset-0 z-50 flex flex-col"
          style={{ background: "var(--black)" }}
        >
          {/* Overlay header */}
          <div
            className="flex items-center justify-between px-6 py-3 flex-shrink-0"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--card)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "#38bdf8",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#38bdf8",
                  display: "inline-block",
                  boxShadow: "0 0 6px #38bdf8",
                }}
              />
              ZOOM SESSION LIVE
            </div>
            <button
              onClick={closeZoomFrame}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 12,
                letterSpacing: "0.12em",
                padding: "8px 20px",
                background: "rgba(255,107,107,0.1)",
                color: "#ff6b6b",
                border: "1px solid rgba(255,107,107,0.35)",
                cursor: "pointer",
                transition: "all 0.15s",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,107,107,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,107,107,0.1)";
              }}
            >
              ■ LEAVE
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
    </>
  );
}
