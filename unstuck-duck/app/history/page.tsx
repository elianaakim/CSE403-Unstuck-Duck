"use client";

import { useEffect, useState } from "react";
import { clientSupabase } from "@/supabase/supabase";
import ProtectedRoute from "@/Components/ProtectedRoute";
import Image from "next/image";

interface Message {
  message_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Session {
  session_id: string;
  topic: string;
  started_at: string;
  ended_at: string;
  score: number;
  Messages: Message[];
}

function scoreColor(s: number) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#f0b429";
  return "#ff6b6b";
}
function scoreLabel(s: number) {
  if (s >= 80) return "EXCELLENT";
  if (s >= 60) return "PROGRESS";
  return "KEEP GOING";
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const {
        data: { session: authSession },
      } = await clientSupabase.auth.getSession();
      const res = await fetch("/api/history", {
        headers: { Authorization: `Bearer ${authSession?.access_token ?? ""}` },
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <ProtectedRoute>
      <style>{`
        @keyframes h-fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes h-expand {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes h-msgDuck {
          from { opacity:0; transform:translateX(-10px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes h-msgUser {
          from { opacity:0; transform:translateX(10px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .h-row {
          animation: h-fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        .h-expanded {
          animation: h-expand 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
        .h-msg-duck { animation: h-msgDuck 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .h-msg-user { animation: h-msgUser 0.22s cubic-bezier(0.22,1,0.36,1) both; }

        .h-session-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .h-session-btn:hover {
          background: rgba(255,255,255,0.02);
        }

        .h-score-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.06);
          width: 100%;
          margin-top: 6px;
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
        <main className="w-full max-w-4xl px-8 py-10">
          {/* ── Header ── */}
          <div
            className="mb-10 pb-6"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "#a78bfa",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              / Your Sessions
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
              TEACHING
              <br />
              <span style={{ color: "#a78bfa" }}>HISTORY.</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--muted)",
                letterSpacing: "0.05em",
              }}
            >
              {loading
                ? "Loading…"
                : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} recorded`}
            </p>
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: 24,
                background: "rgba(255,107,107,0.07)",
                border: "1px solid rgba(255,107,107,0.3)",
                borderLeft: "3px solid #ff6b6b",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "#ff6b6b",
                  letterSpacing: "0.05em",
                }}
              >
                ⚠ {error}
              </p>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 72,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    opacity: 0.4 - i * 0.08,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div style={{ opacity: 0.25 }}>
                <Image
                  src="/duck_l.png"
                  alt="Duck"
                  width={100}
                  height={100}
                  style={{ filter: "grayscale(1)" }}
                />
              </div>
              <div className="text-center">
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    color: "var(--white)",
                    letterSpacing: "0.05em",
                    marginBottom: 8,
                  }}
                >
                  NO SESSIONS YET
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--muted)",
                    letterSpacing: "0.05em",
                  }}
                >
                  Start teaching the duck to see your history here.
                </p>
              </div>
            </div>
          )}

          {/* ── Sessions list ── */}
          {!loading && sessions.length > 0 && (
            <div className="flex flex-col gap-3">
              {sessions.map((session, idx) => {
                const isOpen = expanded === session.session_id;
                const sc = session.score;
                const col = scoreColor(sc);

                return (
                  <div
                    key={session.session_id}
                    className="h-row overflow-hidden"
                    style={{
                      background: "var(--card)",
                      border: `1px solid ${isOpen ? col + "33" : "var(--border)"}`,
                      borderLeft: `3px solid ${isOpen ? col : "var(--border2)"}`,
                      transition: "border-color 0.2s",
                      animationDelay: `${idx * 0.05}s`,
                    }}
                  >
                    {/* Session row */}
                    <button
                      className="h-session-btn"
                      onClick={() =>
                        setExpanded(isOpen ? null : session.session_id)
                      }
                    >
                      {/* Left: duck + topic */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(249,115,22,0.06)",
                            border: "1px solid rgba(249,115,22,0.2)",
                            overflow: "hidden",
                          }}
                        >
                          <Image
                            src="/duck.png"
                            alt="Duck"
                            width={28}
                            height={28}
                            style={{ objectFit: "contain" }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: 16,
                              letterSpacing: "0.05em",
                              color: "var(--white)",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {session.topic}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10,
                              color: "var(--muted)",
                              letterSpacing: "0.1em",
                              marginTop: 2,
                            }}
                          >
                            {formatDate(session.started_at)}
                            {" · "}
                            {session.Messages.length} msg
                            {session.Messages.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>

                      {/* Right: score + chevron */}
                      <div className="flex items-center gap-5 flex-shrink-0 ml-4">
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 9,
                              color: "var(--lo)",
                              letterSpacing: "0.2em",
                              textTransform: "uppercase",
                              marginBottom: 2,
                            }}
                          >
                            Score
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: 28,
                              color: col,
                              letterSpacing: "0.02em",
                              lineHeight: 1,
                            }}
                          >
                            {sc}
                          </div>
                          {/* Score bar */}
                          <div
                            className="h-score-bar-track"
                            style={{ width: 64 }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${sc}%`,
                                background: col,
                                transition:
                                  "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                                boxShadow: `0 0 6px ${col}`,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 8,
                              color: col,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              marginTop: 3,
                            }}
                          >
                            {scoreLabel(sc)}
                          </div>
                        </div>

                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: isOpen ? "var(--acid)" : "var(--lo)",
                            transition: "transform 0.2s, color 0.2s",
                            transform: isOpen
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                            display: "inline-block",
                          }}
                        >
                          ▶
                        </div>
                      </div>
                    </button>

                    {/* Expanded transcript */}
                    {isOpen && (
                      <div
                        className="h-expanded"
                        style={{
                          borderTop: `1px solid ${col}22`,
                          padding: "16px 20px",
                          maxHeight: 420,
                          overflowY: "auto",
                        }}
                      >
                        {/* Transcript label */}
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9,
                            color: "var(--lo)",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            marginBottom: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          / Transcript
                          <span
                            style={{
                              flex: 1,
                              height: 1,
                              background: "var(--border)",
                              display: "inline-block",
                            }}
                          />
                        </div>

                        <div className="flex flex-col gap-3">
                          {session.Messages.map((msg, mi) => (
                            <div
                              key={msg.message_id}
                              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse h-msg-user" : "h-msg-duck"}`}
                              style={{ animationDelay: `${mi * 0.03}s` }}
                            >
                              {/* Avatar */}
                              <div
                                style={{
                                  flexShrink: 0,
                                  width: 26,
                                  height: 26,
                                  marginTop: 2,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: `1px solid ${msg.role !== "user" ? "rgba(249,115,22,0.25)" : "var(--border2)"}`,
                                  background:
                                    msg.role !== "user"
                                      ? "rgba(249,115,22,0.06)"
                                      : "var(--card2)",
                                  overflow: "hidden",
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 8,
                                  color: "var(--muted)",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {msg.role !== "user" ? (
                                  <Image
                                    src="/duck.png"
                                    alt="Duck"
                                    width={20}
                                    height={20}
                                    style={{ objectFit: "contain" }}
                                  />
                                ) : (
                                  "ME"
                                )}
                              </div>

                              {/* Bubble */}
                              <div
                                style={{
                                  maxWidth: "75%",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems:
                                    msg.role === "user"
                                      ? "flex-end"
                                      : "flex-start",
                                  gap: 3,
                                }}
                              >
                                <div
                                  style={
                                    msg.role !== "user"
                                      ? {
                                          padding: "10px 14px",
                                          background: "var(--card2)",
                                          border: "1px solid var(--border)",
                                          borderLeft:
                                            "3px solid rgba(249,115,22,0.35)",
                                          color: "var(--white)",
                                          fontSize: 13,
                                          lineHeight: 1.6,
                                          fontFamily: "var(--font-body)",
                                          wordBreak: "break-word",
                                        }
                                      : {
                                          padding: "10px 14px",
                                          background: "var(--acid)",
                                          color: "var(--black)",
                                          fontSize: 13,
                                          lineHeight: 1.6,
                                          fontFamily: "var(--font-body)",
                                          fontWeight: 500,
                                          wordBreak: "break-word",
                                        }
                                  }
                                >
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
