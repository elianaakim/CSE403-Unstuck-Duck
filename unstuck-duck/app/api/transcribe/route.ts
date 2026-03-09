import { NextResponse } from "next/server";
import { pipeline, type Pipeline } from "@xenova/transformers";
import fs from "fs";
import os from "os";
import path from "path";
import { decodeToPCM } from "@/lib/decode-audio";

// Cache the pipeline across requests
let transcriber: Pipeline | null = null;

// Start loading the model immediately when the server boots —
// this way it's ready by the time the first request comes in
const warmup = (async () => {
  try {
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-base.en"
    );
    console.log("[transcribe] Whisper model ready");
  } catch (err) {
    console.error("[transcribe] Failed to preload Whisper model:", err);
  }
})();

async function getTranscriber(): Promise<Pipeline> {
  if (!transcriber) {
    // If warmup is still in progress, wait for it
    await warmup;
  }
  if (!transcriber) {
    // Warmup failed — try one more time
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-base.en"
    );
  }
  return transcriber;
}

export async function POST(req: Request) {
  let tempPath: string | null = null;

  try {
    const form = await req.formData();
    const audio = form.get("audio") as File | null;

    if (!audio) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert File → Buffer
    const buffer = Buffer.from(await audio.arrayBuffer());

    // Save to a temp file
    tempPath = path.join(os.tmpdir(), `audio-${Date.now()}`);
    fs.writeFileSync(tempPath, buffer);

    // Decode audio → Float32Array PCM
    const pcm = await decodeToPCM(tempPath);

    // Load Whisper (should already be warmed up)
    const transcriber = await getTranscriber();

    // Run transcription
    const result = await transcriber(pcm);

    return NextResponse.json({ text: result.text ?? "" });
  } catch (err) {
    console.error("[transcribe] Error:", err);
    return NextResponse.json({ text: "" }, { status: 200 });
    // Return 200 with empty text so the client doesn't crash
  } finally {
    // Clean up temp file
    if (tempPath) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  }
}
