import { NextResponse } from "next/server";
import { pipeline, type Pipeline } from "@xenova/transformers";
import fs from "fs";
import os from "os";
import path from "path";
import { decodeToPCM } from "@/lib/decode-audio";

// Cache the pipeline across requests
let transcriber: Pipeline | null = null;

async function getTranscriber(): Promise<Pipeline> {
  if (!transcriber) {
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-base.en"
    );
  }
  return transcriber;
}

export async function POST(req: Request) {
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
  const tempPath = path.join(os.tmpdir(), `audio-${Date.now()}`);
  fs.writeFileSync(tempPath, buffer);

  // Decode audio → Float32Array PCM
  const pcm = await decodeToPCM(tempPath);

  // Load Whisper
  const transcriber = await getTranscriber();

  // Run transcription
  const result = await transcriber(pcm);

  return NextResponse.json({ text: result.text });
}
