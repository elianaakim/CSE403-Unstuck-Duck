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

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const { data: { session: authSession } } = await clientSupabase.auth.getSession();
      
      const res = await fetch("/api/history", {
        headers: {
          Authorization: `Bearer ${authSession?.access_token ?? ""}`,
        },
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-neutral-950">
          <div className="text-stone-600 dark:text-neutral-400">Loading history...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen font-sans transition-colors duration-300 bg-stone-50 dark:bg-neutral-950">
        <main className="w-full max-w-5xl mx-auto px-8 py-10">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
              Teaching History
            </h1>
            <p className="text-sm text-stone-500 dark:text-neutral-400">
              Review your past teaching sessions
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
                No sessions yet
              </h2>
              <p className="text-stone-500 dark:text-neutral-400 text-sm">
                Start teaching the duck to see your history here!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sessions.map((session) => {
                const isExpanded = expandedSession === session.session_id;
                
                return (
                  <div
                    key={session.session_id}
                    className="rounded-2xl border transition-colors duration-300 bg-white dark:bg-white/5 border-stone-200 dark:border-white/10 overflow-hidden"
                  >
                    {/* Session Header */}
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : session.session_id)}
                      className="w-full p-5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                      <Image
                                    src="/duck.png"
                                    alt="Duck"
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                  />
                        <div className="text-left">
                          <h3 className="font-semibold text-stone-900 dark:text-white">
                            {session.topic}
                          </h3>
                          <p className="text-xs text-stone-500 dark:text-neutral-400">
                            {formatDate(session.started_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-stone-400 dark:text-neutral-500 uppercase tracking-wider">Score</p>
                          <p className={`text-2xl font-bold ${scoreColor(session.score)}`}>
                            {session.score}
                          </p>
                        </div>
                        <div className="text-stone-400 dark:text-neutral-500">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Messages */}
                    {isExpanded && (
                      <div className="border-t border-stone-200 dark:border-white/10 p-5">
                        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                          {session.Messages.map((msg) => (
                            <div
                              key={msg.message_id}
                              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                              <div className="flex-shrink-0">
                                {msg.role === 'assistant' ? (
                                  <Image
                                    src="/duck.png"
                                    alt="Duck"
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-neutral-950 font-bold text-xs">
                                    You
                                  </div>
                                )}
                              </div>
                              <div className={`max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`px-3 py-2 rounded-xl text-sm leading-relaxed break-words  ${
                                    msg.role === 'assistant'
                                        ? 'bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-neutral-200'
                                        : 'bg-amber-400 text-neutral-950 whitespace-pre-wrap'
                                    }`}
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