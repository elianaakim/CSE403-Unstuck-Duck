"use client";

import { useState, useRef } from "react";

export default function Recorder({
  onTranscription,
}: {
  onTranscription: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    chunksRef.current = [];
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const text = await sendToTranscribe(blob);
      const cleaned = text.trim();
      // Filter out silence/noise markers — anything that looks like [word] or [ word ] with no real speech
      if (!cleaned || cleaned.length < 2) return;
      if (/^\[.*\]$/.test(cleaned)) return;
      onTranscription(cleaned);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <>
      <style>{`

        .rec-btn {
          position: relative;
          width: 100%;
          padding: 14px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--card);
          border: 1px solid var(--border2);
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 0;
          outline: none;
        }
        .rec-btn:hover {
          border-color: var(--acid);
          background: var(--card2);
        }
        .rec-btn.active {
          border-color: #f97316;
          background: rgba(249,115,22,0.06);
          border-left: 3px solid #f97316;
        }

        .rec-icon {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          color: var(--muted);
          transition: color 0.15s;
        }
        .rec-btn:hover .rec-icon { color: var(--white); }
        .rec-btn.active .rec-icon { color: #f97316; }
        .rec-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--lo);
          transition: color 0.15s;
          position: relative;
          z-index: 1;
        }
        .rec-btn:hover .rec-label { color: var(--muted); }
        .rec-btn.active .rec-label { color: #f97316; }
      `}</style>

      <button
        type="button"
        className={`rec-btn${recording ? " active" : ""}`}
        onClick={recording ? stopRecording : startRecording}
      >
        <div className="rec-icon">
          {/* Mic SVG */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <rect x="9" y="2" width="6" height="11" rx="0" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>

        <span className="rec-label">
          {recording ? "● REC — tap to stop" : "tap to record"}
        </span>
      </button>
    </>
  );
}

async function sendToTranscribe(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", blob);
  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return data.text;
}
