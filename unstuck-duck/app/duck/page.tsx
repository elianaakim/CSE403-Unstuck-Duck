'use client';

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Role = "user" | "duck";

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  time: string;
}

type SessionStatus = "idle" | "active" | "ended";

export default function Duck() {
  // ── Session state ──
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [topicInput, setTopicInput] = useState("");

  // ── Chat state ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Score state ──
  const [teachingScore, setTeachingScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function addMessage(role: Role, text: string) {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      role,
      text,
      time: now(),
    }]);
  }

  // ── 1. Start session ──
  async function handleStartSession(e: React.FormEvent) {
    e.preventDefault();
    if (!topicInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/duck/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSessionId(data.sessionId);
      setTopic(data.topic);
      setTeachingScore(data.teachingScore ?? 0);
      setStatus("active");
      addMessage("duck", data.duckQuestion);
    } catch (err) {
      console.error("Failed to start session:", err);
      addMessage("duck", "Quack! Something went wrong starting the session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── 2. Send a message ──
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!chat.trim() || !sessionId || status !== "active" || isLoading) return;
    const userText = chat.trim();
    setChat("");
    addMessage("user", userText);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/duck/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userResponse: userText }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      addMessage("duck", data.duckQuestion);
      if (data.currentTeachingScore != null) setTeachingScore(data.currentTeachingScore);
    } catch (err) {
      console.error("Failed to send message:", err);
      addMessage("duck", "Quack! I didn't catch that. Could you try again?");
    } finally {
      setIsLoading(false);
    }
  }

  // ── 3. Evaluate ──
  async function handleEvaluate() {
    if (!sessionId || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const res = await fetch(`${API_BASE}/api/duck/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTeachingScore(data.teachingScore);
      setFeedback(data.feedback);
      addMessage("duck", data.message);
    } catch (err) {
      console.error("Failed to evaluate:", err);
      addMessage("duck", "Quack! I couldn't evaluate right now. Keep teaching!");
    } finally {
      setIsEvaluating(false);
    }
  }

  // ── 4. End session ──
  async function handleEndSession() {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/duck/sessions/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTeachingScore(data.finalTeachingScore);
      setFinalAssessment(data.finalAssessment);
      setStatus("ended");
      addMessage("duck", data.message);
    } catch (err) {
      console.error("Failed to end session:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  }

  return (
    <div className="flex min-h-screen font-sans transition-colors duration-300 bg-stone-50 dark:bg-neutral-950">
      <main className="flex w-full max-w-5xl mx-auto gap-8 px-8 py-10">

        {/* ── Left: duck + controls ── */}
        <aside className="flex flex-col items-center gap-6 w-56 flex-shrink-0 pt-4">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-2xl scale-110 bg-amber-400 transition-opacity duration-500 ${status === "active" ? "opacity-30" : "opacity-10"}`} />
            <Image src="/duck.png" alt="Duck" width={180} height={180} className="relative drop-shadow-xl" />
          </div>

          {/* Score badge */}
          {teachingScore !== null && status !== "idle" && (
            <div className="w-full rounded-2xl border p-4 text-center transition-colors duration-300 bg-white dark:bg-white/5 border-stone-200 dark:border-white/10">
              <p className="text-xs uppercase tracking-widest mb-1 text-stone-400 dark:text-neutral-500">Teaching Score</p>
              <p className={`text-4xl font-bold ${scoreColor(teachingScore)}`}>
                {teachingScore}
                <span className="text-lg font-normal text-stone-400 dark:text-neutral-500">/100</span>
              </p>
              {feedback && <p className="mt-2 text-xs text-stone-500 dark:text-neutral-400 leading-relaxed">{feedback}</p>}
            </div>
          )}

          {status === "active" && (
            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || !chat.trim()}
                className="flex items-center justify-center rounded-full border-4 mx-auto transition-all duration-200 hover:scale-105 hover:opacity-80 active:scale-95 disabled:opacity-40 border-stone-300 dark:border-white/20 bg-white dark:bg-white/5"
              >
                <Image src="/mic.png" alt="Send" width={80} height={80} className="rounded-full" />
              </button>

              <button
                type="button"
                onClick={handleEvaluate}
                disabled={isEvaluating || messages.filter(m => m.role === "user").length === 0}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 bg-amber-400 hover:bg-amber-300 text-neutral-950"
              >
                {isEvaluating ? "Evaluating…" : "Get Score"}
              </button>

              <button
                type="button"
                onClick={handleEndSession}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-neutral-300"
              >
                End Session
              </button>
            </div>
          )}

          {status === "ended" && finalAssessment && (
            <div className="w-full rounded-2xl border p-4 text-center transition-colors duration-300 bg-white dark:bg-white/5 border-stone-200 dark:border-white/10">
              <p className="text-xs uppercase tracking-widest mb-2 text-stone-400 dark:text-neutral-500">Session Complete</p>
              <p className="text-sm text-stone-600 dark:text-neutral-300 leading-relaxed">{finalAssessment}</p>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle"); setSessionId(null); setMessages([]);
                  setTopicInput(""); setTeachingScore(null); setFeedback(null); setFinalAssessment(null);
                }}
                className="mt-3 w-full py-2 rounded-xl text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors"
              >
                Start New Session
              </button>
            </div>
          )}
        </aside>

        {/* ── Right: chat ── */}
        <div className="flex-1 flex flex-col min-h-[calc(100vh-5rem)]">

          {/* Idle: topic picker */}
          {status === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2 text-stone-900 dark:text-white">What are we learning today?</h1>
                <p className="text-stone-500 dark:text-neutral-400 text-sm">Enter a topic and your duck will start asking questions.</p>
              </div>
              <form onSubmit={handleStartSession} className="flex gap-3 w-full max-w-md">
                <input
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  placeholder="e.g. Binary search trees"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl text-sm border-2 transition-colors duration-200 focus:outline-none focus:ring-2
                    bg-white dark:bg-white/5 border-stone-200 dark:border-white/10
                    text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-neutral-600
                    focus:border-amber-400 focus:ring-amber-400/20"
                />
                <button
                  type="submit"
                  disabled={isLoading || !topicInput.trim()}
                  className="px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 bg-amber-400 hover:bg-amber-300 text-neutral-950"
                >
                  {isLoading ? "Starting…" : "Start →"}
                </button>
              </form>
            </div>
          )}

          {/* Active / ended: chat view */}
          {status !== "idle" && (
            <>
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
                  Teaching: <span className="text-amber-500">{topic}</span>
                </h1>
              </div>

              <div
                className="flex-1 overflow-y-auto rounded-2xl border p-5 flex flex-col gap-4 mb-4 transition-colors duration-300 bg-white dark:bg-white/5 border-stone-200 dark:border-white/10"
                style={{ maxHeight: "calc(100vh - 260px)" }}
              >
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className="flex-shrink-0">
                      {msg.role === "duck" ? (
                        <Image src="/duck.png" alt="Duck" width={36} height={36} className="rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-neutral-950 font-bold text-xs">You</div>
                      )}
                    </div>
                    <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-colors duration-300 ${
                        msg.role === "duck"
                          ? "rounded-tl-sm bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-neutral-200"
                          : "rounded-tr-sm bg-amber-400 text-neutral-950"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-xs text-stone-400 dark:text-neutral-600 px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <Image src="/duck.png" alt="Duck" width={36} height={36} className="rounded-full" />
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-stone-100 dark:bg-white/10 flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full bg-stone-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {status === "active" && (
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    value={chat}
                    onChange={e => setChat(e.target.value)}
                    placeholder="Explain to the duck…"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-xl text-sm border-2 transition-colors duration-200 focus:outline-none focus:ring-2
                      bg-white dark:bg-white/5 border-stone-200 dark:border-white/10
                      text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-neutral-600
                      focus:border-amber-400 focus:ring-amber-400/20"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !chat.trim()}
                    className="px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 bg-amber-400 hover:bg-amber-300 text-neutral-950"
                  >
                    Send
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}