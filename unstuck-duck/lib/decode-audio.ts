import ffmpeg from "fluent-ffmpeg";

// Use system ffmpeg instead of ffmpeg-static
ffmpeg.setFfmpegPath("/opt/homebrew/bin/ffmpeg");


export async function decodeToPCM(filePath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const command = ffmpeg(filePath)
      .format("f32le") // 32‑bit float PCM
      .audioChannels(1)
      .audioFrequency(16000) // Whisper expects 16kHz
      .on("error", reject)
      .on("end", () => {
        const buffer = Buffer.concat(chunks);
        const floatData = new Float32Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.length / 4
        );
        resolve(floatData);
      })
      .pipe();

    command.on("data", (chunk: Buffer) => chunks.push(chunk));
  });
}
