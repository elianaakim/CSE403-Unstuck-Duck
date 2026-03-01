import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import proxyquire from "proxyquire";
import sinon from "sinon";
import { NextRequest } from "next/server";

describe("POST /api/transcribe", () => {
  let transcribePOST: any;
  let mockPipeline: sinon.SinonStub;
  let mockTranscriberInstance: any;
  let mockDecodeToPCM: sinon.SinonStub;
  let mockFsWriteFileSync: sinon.SinonStub;
  let mockFsUnlinkSync: sinon.SinonStub;
  let mockOsTmpdir: sinon.SinonStub;
  let writtenFiles: string[];

  beforeEach(() => {
    writtenFiles = [];

    // Mock transcriber instance
    mockTranscriberInstance = sinon.stub().resolves({
      text: "This is the transcribed text from the audio file.",
    });

    // Mock pipeline function
    mockPipeline = sinon.stub().resolves(mockTranscriberInstance);

    // Mock decodeToPCM
    mockDecodeToPCM = sinon.stub().resolves(new Float32Array([0.1, 0.2, 0.3]));

    // Mock fs functions
    mockFsWriteFileSync = sinon.stub().callsFake((path: string) => {
      writtenFiles.push(path);
    });
    mockFsUnlinkSync = sinon.stub();

    // Mock os.tmpdir()
    mockOsTmpdir = sinon.stub().returns("/tmp");

    // Import the REAL route with mocked dependencies
    const module = proxyquire.noCallThru()("../app/api/transcribe/route", {
      "@xenova/transformers": {
        pipeline: mockPipeline,
      },
      fs: {
        writeFileSync: mockFsWriteFileSync,
        unlinkSync: mockFsUnlinkSync,
      },
      os: {
        tmpdir: mockOsTmpdir,
      },
      "@/lib/decode-audio": {
        decodeToPCM: mockDecodeToPCM,
      },
    });

    transcribePOST = module.POST;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should transcribe audio file successfully", async () => {
    // Create mock audio file
    const audioBuffer = Buffer.from("fake audio data");
    const audioFile = new File([audioBuffer], "test.mp3", {
      type: "audio/mpeg",
    });

    // Create FormData
    const formData = new FormData();
    formData.append("audio", audioFile);

    // Create request
    const req = new Request("http://localhost:3000/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const response = await transcribePOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("text");
    expect(data.text).to.equal(
      "This is the transcribed text from the audio file."
    );
  });

  it("should save audio to temp file", async () => {
    const audioBuffer = Buffer.from("audio content");
    const audioFile = new File([audioBuffer], "recording.wav", {
      type: "audio/wav",
    });

    const formData = new FormData();
    formData.append("audio", audioFile);

    const req = new Request("http://localhost:3000/api/transcribe", {
      method: "POST",
      body: formData,
    });

    await transcribePOST(req);

    // Verify temp file was written
    expect(mockFsWriteFileSync.calledOnce).to.be.true;
    expect(writtenFiles.length).to.equal(1);
    expect(writtenFiles[0]).to.match(/^\/tmp\/audio-\d+$/);

    // Verify correct buffer was written
    const writtenBuffer = mockFsWriteFileSync.firstCall.args[1];
    expect(Buffer.isBuffer(writtenBuffer)).to.be.true;
  });

  it("should call decodeToPCM with temp file path", async () => {
    const audioFile = new File([Buffer.from("data")], "test.m4a", {
      type: "audio/m4a",
    });

    const formData = new FormData();
    formData.append("audio", audioFile);

    const req = new Request("http://localhost:3000/api/transcribe", {
      method: "POST",
      body: formData,
    });

    await transcribePOST(req);

    expect(mockDecodeToPCM.calledOnce).to.be.true;
    const decodePath = mockDecodeToPCM.firstCall.args[0];
    expect(decodePath).to.match(/^\/tmp\/audio-\d+$/);
  });

  it("should initialize Whisper pipeline on first request", async () => {
    const audioFile = new File([Buffer.from("audio")], "test.mp3");
    const formData = new FormData();
    formData.append("audio", audioFile);

    const req = new Request("http://localhost:3000/api/transcribe", {
      method: "POST",
      body: formData,
    });

    await transcribePOST(req);

    expect(mockPipeline.calledOnce).to.be.true;
    expect(mockPipeline.firstCall.args[0]).to.equal(
      "automatic-speech-recognition"
    );
    expect(mockPipeline.firstCall.args[1]).to.equal("Xenova/whisper-base.en");
  });

  it("should pass PCM data to transcriber", async () => {
    const mockPCM = new Float32Array([0.5, 0.6, 0.7]);
    mockDecodeToPCM.resolves(mockPCM);

    const audioFile = new File([Buffer.from("audio")], "test.mp3");
    const formData = new FormData();
    formData.append("audio", audioFile);

    const req = new Request("http://localhost:3000/api/transcribe", {
      method: "POST",
      body: formData,
    });

    await transcribePOST(req);

    expect(mockTranscriberInstance.calledOnce).to.be.true;
    expect(mockTranscriberInstance.firstCall.args[0]).to.equal(mockPCM);
  });

  it("should handle different audio formats", async () => {
    const formats = [
      { name: "test.mp3", type: "audio/mpeg" },
      { name: "test.wav", type: "audio/wav" },
      { name: "test.m4a", type: "audio/m4a" },
      { name: "test.ogg", type: "audio/ogg" },
    ];

    for (const format of formats) {
      const audioFile = new File([Buffer.from("audio")], format.name, {
        type: format.type,
      });
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await transcribePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(200);
      expect(data).to.have.property("text");
    }
  });

  describe("Validation", () => {
    it("should reject request without audio file", async () => {
      const formData = new FormData();

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await transcribePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data).to.have.property("error", "No audio file provided");
    });

    it("should reject FormData without audio field", async () => {
      const formData = new FormData();
      formData.append(
        "wrongField",
        new File([Buffer.from("data")], "test.mp3")
      );

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await transcribePOST(req);

      expect(response.status).to.equal(400);
    });
  });

  describe("Error Handling", () => {
    it("should handle decodeToPCM errors", async () => {
      mockDecodeToPCM.rejects(new Error("FFmpeg decoding failed"));

      const audioFile = new File([Buffer.from("audio")], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      try {
        await transcribePOST(req);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("FFmpeg decoding failed");
      }
    });

    it("should handle transcription errors", async () => {
      mockTranscriberInstance.rejects(new Error("Transcription failed"));

      const audioFile = new File([Buffer.from("audio")], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      try {
        await transcribePOST(req);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Transcription failed");
      }
    });

    it("should handle pipeline initialization errors", async () => {
      mockPipeline.rejects(new Error("Failed to load Whisper model"));

      const audioFile = new File([Buffer.from("audio")], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      try {
        await transcribePOST(req);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Failed to load Whisper model");
      }
    });

    it("should handle file write errors", async () => {
      mockFsWriteFileSync.throws(new Error("EACCES: permission denied"));

      const audioFile = new File([Buffer.from("audio")], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      try {
        await transcribePOST(req);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("permission denied");
      }
    });
  });

  describe("Temp File Naming", () => {
    it("should generate unique temp file names", async () => {
      for (let i = 0; i < 3; i++) {
        const audioFile = new File([Buffer.from("audio")], "test.mp3");

        const formData = new FormData();
        formData.append("audio", audioFile);

        const req = new Request("http://localhost:3000/api/transcribe", {
          method: "POST",
          body: formData,
        });

        await transcribePOST(req);

        // Add small delay to ensure Date.now() changes
        await new Promise((resolve) => setTimeout(resolve, 2));
      }

      // All temp file names should be unique
      const uniqueFiles = new Set(writtenFiles);
      expect(uniqueFiles.size).to.equal(3);
    });

    it("should use tmpdir for temp files", async () => {
      const audioFile = new File([Buffer.from("audio")], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      await transcribePOST(req);

      expect(mockOsTmpdir.calledOnce).to.be.true;
    });
  });

  describe("Response Format", () => {
    it("should return JSON with text property", async () => {
      mockTranscriberInstance.resolves({
        text: "Hello world this is a test transcription.",
      });

      const audioFile = new File([Buffer.from("audio")], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await transcribePOST(req);
      const data = await response.json();

      expect(data).to.have.all.keys("text");
      expect(data.text).to.be.a("string");
    });

    it("should handle empty transcription", async () => {
      mockTranscriberInstance.resolves({ text: "" });

      const audioFile = new File([Buffer.from("audio")], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await transcribePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(200);
      expect(data.text).to.equal("");
    });
  });

  describe("File Conversion", () => {
    it("should convert File to Buffer correctly", async () => {
      const testData = "test audio binary data";
      const audioFile = new File([Buffer.from(testData)], "test.mp3");
      const formData = new FormData();
      formData.append("audio", audioFile);

      const req = new Request("http://localhost:3000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      await transcribePOST(req);

      const writtenBuffer = mockFsWriteFileSync.firstCall.args[1];
      expect(writtenBuffer.toString()).to.equal(testData);
    });
  });
});
