"use client";

import { useState, useRef } from "react";
import Image from "next/image";

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
      const SILENCE_MARKERS = ["[BLANK_AUDIO]", "[ Silence ]", "[silence]"];

      if (
        !cleaned ||
        cleaned.length === 0 ||
        SILENCE_MARKERS.includes(cleaned)
      ) {
        return;
      }

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
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        className={`
          relative flex items-center justify-center rounded-full border-4 mx-auto
          transition-all duration-300 active:scale-95
          bg-white dark:bg-white/5 border-stone-300 dark:border-white/20

          ${
            recording
              ? "border-amber-400 shadow-[0_0_18px_rgba(255,200,0,0.45)] animate-[pulse_2s_ease-in-out_infinite]"
              : "hover:scale-105 hover:opacity-80"
          }
        `}
      >
        <Image
          src="/mic.png"
          alt="Record"
          width={80}
          height={80}
          className={`rounded-full transition-opacity duration-300 ${
            recording ? "opacity-70" : ""
          }`}
        />

        {recording && (
          <div className="absolute inset-0 rounded-full bg-amber-300/20 animate-[ping_2.5s_ease-in-out_infinite]"></div>
        )}
      </button>

      {recording && (
        <p className="text-amber-500 font-medium text-sm animate-[pulse_2s_ease-in-out_infinite]">
          Listening…
        </p>
      )}
    </div>
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
