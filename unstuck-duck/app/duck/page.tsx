"use client";

import Image from "next/image";
import Recorder from "@/Components/Recorder";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientSupabase } from "@/supabase/supabase";
import ProtectedRoute from "@/Components/ProtectedRoute";

type Role = "user" | "duck";
interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  time: string;
}
type SessionStatus = "idle" | "active" | "ended";

// ── Score ring — SVG with count-up ──
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const [val, setVal] = useState(0);
  const [dash, setDash] = useState(circ);

  useEffect(() => {
    let start: number | null = null;
    const dur = 1000;
    const raf = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(e * score));
      setDash(circ - ((e * score) / 100) * circ);
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [score]);

  return (
    <div
      style={{
        position: "relative",
        width: 100,
        height: 100,
        margin: "0 auto",
      }}
    >
      <svg
        width="100"
        height="100"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="3"
          stroke="rgba(255,255,255,0.06)"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="3"
          stroke={color}
          strokeLinecap="square"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: "stroke-dashoffset 0.02s linear",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            color,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          {val}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--lo)",
            letterSpacing: "0.1em",
          }}
        >
          / 100
        </span>
      </div>
    </div>
  );
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

export default function Duck() {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teachingScore, setTeachingScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState<string | null>(null);
  const [hasNewMessageSinceEval, setHasNewMessageSinceEval] = useState(false);
  const [scoreKey, setScoreKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
  }, []);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [chat]);

  function now() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  function addMsg(role: Role, text: string) {
    setMessages((p) => [
      ...p,
      { id: `${Date.now()}-${Math.random()}`, role, text, time: now() },
    ]);
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!topicInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setSessionId(d.sessionId);
      setTopic(d.topic);
      setTeachingScore(d.teachingScore ?? 0);
      setStatus("active");
      addMsg("duck", d.duckQuestion);
    } catch {
      addMsg("duck", "Quack! Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!chat.trim() || !sessionId || status !== "active" || isLoading) return;
    const txt = chat.trim();
    setChat("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    addMsg("user", txt);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userResponse: txt }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      addMsg("duck", d.duckQuestion);
      if (d.currentTeachingScore != null)
        setTeachingScore(d.currentTeachingScore);
    } catch {
      addMsg("duck", "Quack! I didn't catch that. Could you try again?");
    } finally {
      setIsLoading(false);
      setHasNewMessageSinceEval(true);
    }
  }

  async function handleEvaluate() {
    if (!sessionId || isEvaluating) return;
    setIsEvaluating(true);
    setHasNewMessageSinceEval(false);
    try {
      const res = await fetch(`/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setTeachingScore(d.teachingScore);
      setScoreKey((k) => k + 1);
      setFeedback(d.feedback);
      addMsg("duck", d.message);
    } catch {
      addMsg("duck", "Quack! Couldn't evaluate right now. Keep teaching!");
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleEnd() {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const {
        data: { session: auth },
      } = await clientSupabase.auth.getSession();
      const res = await fetch(`/api/sessions/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.access_token ?? ""}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setTeachingScore(d.finalTeachingScore);
      setScoreKey((k) => k + 1);
      setFinalAssessment(d.finalAssessment);
      setStatus("ended");
      addMsg("duck", d.message);
    } catch {
      console.error("end failed");
    } finally {
      setIsLoading(false);
    }
  }

  const sc = teachingScore ?? 0;

  return (
    <ProtectedRoute>
      <style>{`
        @keyframes d-fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes d-msgDuck {
          from { opacity:0; transform:translateX(-12px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes d-msgUser {
          from { opacity:0; transform:translateX(12px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes d-bob {
          0%,100% { transform:translateY(0) rotate(-2deg); }
          50%     { transform:translateY(-10px) rotate(2deg); }
        }
        @keyframes d-dot {
          0%,60%,100% { transform:translateY(0); opacity:0.3; }
          30%         { transform:translateY(-5px); opacity:1; }
        }
        @keyframes d-scoreIn {
          from { opacity:0; transform:scale(0.85); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes d-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }

        .d-s1 { animation: d-fadeUp 0.45s 0.04s cubic-bezier(0.22,1,0.36,1) both; }
        .d-s2 { animation: d-fadeUp 0.45s 0.10s cubic-bezier(0.22,1,0.36,1) both; }
        .d-s3 { animation: d-fadeUp 0.45s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
        .d-bob      { animation: d-bob 2.8s ease-in-out infinite; }
        .d-score-in { animation: d-scoreIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .d-msg-duck { animation: d-msgDuck 0.25s cubic-bezier(0.22,1,0.36,1) both; }
        .d-msg-user { animation: d-msgUser 0.25s cubic-bezier(0.22,1,0.36,1) both; }
        .d-cursor   { animation: d-blink 1s step-end infinite; }

        .d-btn-acid {
          font-family: var(--font-display);
          font-size: 13px;
          letter-spacing: 0.12em;
          padding: 11px 0;
          width: 100%;
          background: var(--acid);
          color: var(--black);
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .d-btn-acid:hover:not(:disabled) {
          background: #fb923c;
          transform: translateY(-1px);
          box-shadow: 0 4px 0 rgba(249,115,22,0.3);
        }
        .d-btn-acid:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
        .d-btn-acid:disabled { opacity: 0.3; cursor: not-allowed; }

        .d-btn-ghost {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          padding: 10px 0;
          width: 100%;
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border2);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .d-btn-ghost:hover:not(:disabled) { border-color: var(--white); color: var(--white); }
        .d-btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

        .d-input {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border2);
          border-left: 3px solid var(--acid);
          color: var(--white);
          font-family: var(--font-body);
          font-size: 14px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.15s;
          border-radius: 0;
        }
        .d-input::placeholder { color: rgba(80,76,68,0.5); }
        .d-input:focus { border-color: var(--acid); box-shadow: 0 0 0 1px var(--acid); }

        .d-textarea {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border2);
          border-left: 3px solid var(--acid);
          color: var(--white);
          font-family: var(--font-body);
          font-size: 14px;
          padding: 14px 16px;
          outline: none;
          resize: none;
          overflow: hidden;
          transition: border-color 0.15s;
          border-radius: 0;
          line-height: 1.5;
        }
        .d-textarea::placeholder { color: rgba(80,76,68,0.5); }
        .d-textarea:focus { border-color: var(--acid); box-shadow: 0 0 0 1px var(--acid); }

        .d-sidebar-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .d-sidebar-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border2);
        }
      `}</style>

      <div
        className="z1 flex flex-col min-h-screen items-center"
        style={{
          fontFamily: "var(--font-body)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.3s ease",
          paddingTop: 56,
        }}
      >
        {/* Top mini ticker */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            height: 2,
            background: status === "active" ? "var(--acid)" : "var(--border)",
            transition: "background 0.5s",
          }}
        />

        <main
          className="flex w-full max-w-5xl gap-0 px-8"
          style={{ paddingTop: 2 }}
        >
          {/* ── SIDEBAR ── */}
          <aside
            className="d-s1 flex flex-col gap-0 flex-shrink-0 border-r"
            style={{
              width: 200,
              borderColor: "var(--border)",
              minHeight: "calc(100vh - 2px)",
            }}
          >
            {/* Duck panel */}
            <div
              className="flex flex-col items-center py-8 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              {status === "active" ? (
                <div className="d-bob relative">
                  <div
                    style={{
                      position: "absolute",
                      inset: -20,
                      background:
                        "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                  <Image
                    src="/duck_l.png"
                    alt="Duck"
                    width={148}
                    height={148}
                    priority
                  />
                </div>
              ) : (
                <Image
                  src="/duck_l.png"
                  alt="Duck"
                  width={100}
                  height={100}
                  style={{ opacity: 0, filter: "grayscale(0.5)" }}
                />
              )}

              <div
                className="mt-4"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: status === "active" ? "var(--acid)" : "var(--lo)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                {status === "idle"
                  ? ""
                  : status === "active"
                  ? "● LIVE"
                  : "COMPLETE"}
              </div>
            </div>

            {/* Score panel */}
            {teachingScore !== null && status !== "idle" && (
              <div
                key={scoreKey}
                className="d-score-in py-6 px-5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="d-sidebar-label">Score</div>
                <ScoreRing score={sc} color={scoreColor(sc)} />
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    textAlign: "center",
                    marginTop: 8,
                    color: scoreColor(sc),
                  }}
                >
                  {scoreLabel(sc)}
                </div>
                {feedback && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--muted)",
                      lineHeight: 1.6,
                      marginTop: 10,
                      letterSpacing: "0.03em",
                      paddingTop: 10,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    {feedback}
                  </p>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-2 p-4 flex-1">
              {status === "active" && (
                <>
                  {/* Voice recorder */}
                  <div className="d-sidebar-label">Voice Send</div>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      padding: "8px 0",
                    }}
                  >
                    <Recorder
                      onTranscription={(text) => {
                        setChat((prev) => (prev ? prev + " " + text : text));
                      }}
                    />
                  </div>

                  <div className="d-sidebar-label" style={{ marginTop: 8 }}>
                    Actions
                  </div>
                  <button
                    className="d-btn-acid"
                    onClick={handleEvaluate}
                    disabled={
                      isEvaluating ||
                      !hasNewMessageSinceEval ||
                      messages.filter((m) => m.role === "user").length === 0
                    }
                  >
                    {isEvaluating ? (
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
                        SCORING
                      </span>
                    ) : (
                      "✦ GET SCORE"
                    )}
                  </button>
                  <button
                    onClick={handleEnd}
                    disabled={isLoading}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 13,
                      letterSpacing: "0.12em",
                      padding: "11px 0",
                      width: "100%",
                      background: "rgba(255,107,107,0.08)",
                      color: "#ff6b6b",
                      border: "1px solid rgba(255,107,107,0.4)",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      textTransform: "uppercase",
                      opacity: isLoading ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,107,107,0.16)";
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "#ff6b6b";
                        (e.currentTarget as HTMLButtonElement).style.transform =
                          "translateY(-1px)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 4px 0 rgba(255,107,107,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,107,107,0.08)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(255,107,107,0.4)";
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "none";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "none";
                    }}
                  >
                    ■ END SESSION
                  </button>

                  {/* Disclaimer */}
                  <div
                    style={{
                      marginTop: 6,
                      padding: "8px 10px",
                      background: "rgba(255,107,107,0.05)",
                      border: "1px solid rgba(255,107,107,0.15)",
                      borderLeft: "2px solid rgba(255,107,107,0.5)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "rgba(255,107,107,0.7)",
                        letterSpacing: "0.06em",
                        lineHeight: 1.6,
                        textTransform: "uppercase",
                      }}
                    >
                      ⚠ Chat is only saved to history when you click End
                      Session.
                    </p>
                  </div>
                </>
              )}

              {status === "ended" && finalAssessment && (
                <>
                  <div className="d-sidebar-label" style={{ marginTop: 8 }}>
                    Session Over
                  </div>
                  <button
                    className="d-btn-acid"
                    onClick={() => {
                      setStatus("idle");
                      setSessionId(null);
                      setMessages([]);
                      setTopicInput("");
                      setTeachingScore(null);
                      setFeedback(null);
                      setFinalAssessment(null);
                    }}
                  >
                    NEW SESSION
                  </button>
                  <button
                    className="d-btn-ghost"
                    onClick={() => router.push("/history")}
                  >
                    VIEW HISTORY
                  </button>
                </>
              )}
            </div>

            {/* Bottom decorative strip */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "var(--lo)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              unstuck-duck
              <span className="d-cursor" style={{ color: "var(--acid)" }}>
                _
              </span>
            </div>
          </aside>

          {/* ── CHAT PANEL ── */}
          <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
            {/* ── IDLE ── */}
            {status === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-10 px-12 py-16">
                <div className="d-s1 text-center">
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--acid)",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      marginBottom: 16,
                    }}
                  >
                    / new session
                  </div>
                  <h1
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(42px, 7vw, 72px)",
                      lineHeight: 0.9,
                      letterSpacing: "0.02em",
                      color: "var(--white)",
                      marginBottom: 16,
                    }}
                  >
                    WHAT ARE
                    <br />
                    WE LEARNING
                    <br />
                    <span style={{ color: "var(--acid)" }}>TODAY?</span>
                  </h1>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                      letterSpacing: "0.05em",
                      marginTop: 12,
                    }}
                  >
                    Enter a topic — your duck will ask the hard questions.
                  </p>
                </div>

                <form
                  onSubmit={handleStart}
                  className="d-s2 flex gap-0 w-full max-w-md"
                >
                  <input
                    className="d-input flex-1"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Binary search trees"
                    disabled={isLoading}
                    autoFocus
                    style={{ borderRight: "none" }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !topicInput.trim()}
                    className="d-btn-acid flex-shrink-0"
                    style={{ width: "auto", padding: "12px 24px" }}
                  >
                    {isLoading ? "…" : "START →"}
                  </button>
                </form>
              </div>
            )}

            {/* ── ACTIVE / ENDED ── */}
            {status !== "idle" && (
              <>
                {/* Header */}
                <div
                  className="d-s1 flex items-center justify-between px-7 py-4 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--acid)",
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        marginRight: 10,
                      }}
                    >
                      / TOPIC
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 18,
                        letterSpacing: "0.05em",
                        color: "var(--white)",
                      }}
                    >
                      {topic.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto flex flex-col gap-0 px-7 py-5"
                  style={{ maxHeight: "calc(100vh - 200px)" }}
                >
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 mb-4 ${
                        msg.role === "user"
                          ? "flex-row-reverse d-msg-user"
                          : "d-msg-duck"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-mono)",
                          fontSize: 9,
                          letterSpacing: "0.05em",
                          border: `1px solid ${
                            msg.role === "duck"
                              ? "rgba(249,115,22,0.3)"
                              : "var(--border2)"
                          }`,
                          color:
                            msg.role === "duck"
                              ? "var(--acid)"
                              : "var(--muted)",
                          background:
                            msg.role === "duck"
                              ? "rgba(249,115,22,0.06)"
                              : "var(--card)",
                          flexDirection: "column",
                          marginTop: 2,
                        }}
                      >
                        {msg.role === "duck" ? (
                          <Image
                            src="/duck.png"
                            alt="Duck"
                            width={22}
                            height={22}
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          "ME"
                        )}
                      </div>

                      <div
                        style={{
                          maxWidth: "74%",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          alignItems:
                            msg.role === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={
                            msg.role === "duck"
                              ? {
                                  padding: "12px 16px",
                                  background: "var(--card)",
                                  border: "1px solid var(--border)",
                                  borderLeft: "3px solid rgba(249,115,22,0.4)",
                                  color: "var(--white)",
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                  fontFamily: "var(--font-body)",
                                }
                              : {
                                  padding: "12px 16px",
                                  background: "var(--acid)",
                                  color: "var(--black)",
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                  fontFamily: "var(--font-body)",
                                  fontWeight: 500,
                                }
                          }
                        >
                          {msg.text}
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9,
                            color: "var(--lo)",
                            letterSpacing: "0.1em",
                            paddingLeft: msg.role === "duck" ? 2 : 0,
                            paddingRight: msg.role === "user" ? 2 : 0,
                          }}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Typing */}
                  {isLoading && (
                    <div className="d-msg-duck flex gap-3 mb-4">
                      <div
                        style={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(249,115,22,0.3)",
                          background: "rgba(249,115,22,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src="/duck.png"
                          alt="Duck"
                          width={22}
                          height={22}
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderLeft: "3px solid rgba(249,115,22,0.4)",
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            style={{
                              width: 5,
                              height: 5,
                              background: "var(--muted)",
                              display: "inline-block",
                              animation: `d-dot 1s ${
                                i * 0.18
                              }s ease-in-out infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                {status === "active" && (
                  <div
                    className="px-7 py-4 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <form onSubmit={handleSend} className="flex gap-0">
                      <textarea
                        ref={textareaRef}
                        value={chat}
                        onChange={(e) => {
                          setChat(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height =
                            Math.min(e.target.scrollHeight, 160) + "px";
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Explain to the duck… (Shift+Enter for new line)"
                        disabled={isLoading}
                        rows={1}
                        className="d-textarea flex-1"
                        style={{
                          minHeight: 50,
                          maxHeight: 160,
                          borderRight: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !chat.trim()}
                        className="d-btn-acid flex-shrink-0"
                        style={{
                          width: "auto",
                          padding: "0 24px",
                          minHeight: 50,
                          alignSelf: "flex-end",
                        }}
                      >
                        SEND
                      </button>
                    </form>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--lo)",
                        letterSpacing: "0.1em",
                        marginTop: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      ↵ to send · shift+↵ for new line
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
