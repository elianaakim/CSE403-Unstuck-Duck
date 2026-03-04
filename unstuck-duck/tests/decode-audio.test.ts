// import { expect } from "chai";
// import { describe, it, beforeEach, afterEach } from "mocha";
// import proxyquire from "proxyquire";
// import sinon from "sinon";
// import { EventEmitter } from "events";

// describe("decodeToPCM", function () {
//   let mockPipeStream: EventEmitter;
//   let mockCommand: any;
//   let ffmpegStub: sinon.SinonStub;
//   let setFfmpegPathStub: sinon.SinonStub;
//   let decodeToPCM: any;

//   beforeEach(() => {
//     // Create a mock pipe stream that extends EventEmitter
//     mockPipeStream = new EventEmitter();

//     // Create mock command object
//     mockCommand = {
//       format: sinon.stub().returnsThis(),
//       audioChannels: sinon.stub().returnsThis(),
//       audioFrequency: sinon.stub().returnsThis(),
//       on: sinon.stub().returnsThis(),
//       pipe: sinon.stub().returns(mockPipeStream),
//     };

//     // Stub the ffmpeg function
//     ffmpegStub = sinon.stub().returns(mockCommand);
//     setFfmpegPathStub = sinon.stub();
//     ffmpegStub.setFfmpegPath = setFfmpegPathStub;

//     // Import the module with mocked ffmpeg
//     const module = proxyquire("../lib/decode-audio", {
//       "fluent-ffmpeg": ffmpegStub,
//     });

//     decodeToPCM = module.decodeToPCM;
//   });

//   afterEach(() => {
//     sinon.restore();
//   });

//   it("should decode audio file to Float32Array", async () => {
//     const testFilePath = "/path/to/test.mp3";

//     // Create mock PCM data (16 samples)
//     const sampleCount = 16;
//     const buffer = Buffer.allocUnsafe(sampleCount * 4); // 4 bytes per float32
//     for (let i = 0; i < sampleCount; i++) {
//       buffer.writeFloatLE(i * 0.1, i * 4);
//     }

//     // Start the decode operation
//     const decodePromise = decodeToPCM(testFilePath);

//     // Simulate data chunks
//     setImmediate(() => {
//       mockPipeStream.emit("data", buffer.slice(0, 32)); // First 8 samples
//       mockPipeStream.emit("data", buffer.slice(32)); // Last 8 samples
//       mockPipeStream.emit("end");
//     });

//     const result = await decodePromise;

//     // Verify ffmpeg was called correctly
//     expect(ffmpegStub.calledOnce).to.be.true;
//     expect(ffmpegStub.firstCall.args[0]).to.equal(testFilePath);

//     // Verify ffmpeg configuration
//     expect(mockCommand.format.calledWith("f32le")).to.be.true;
//     expect(mockCommand.audioChannels.calledWith(1)).to.be.true;
//     expect(mockCommand.audioFrequency.calledWith(16000)).to.be.true;

//     // Verify result
//     expect(result).to.be.instanceOf(Float32Array);
//     expect(result.length).to.equal(sampleCount);
//   });

//   it("should configure ffmpeg with correct settings", async () => {
//     const testFilePath = "/path/to/audio.wav";

//     const decodePromise = decodeToPCM(testFilePath);

//     setImmediate(() => {
//       mockPipeStream.emit("data", Buffer.alloc(16));
//       mockPipeStream.emit("end");
//     });

//     await decodePromise;

//     // Verify format is 32-bit float PCM
//     expect(mockCommand.format.calledWith("f32le")).to.be.true;

//     // Verify mono audio (1 channel)
//     expect(mockCommand.audioChannels.calledWith(1)).to.be.true;

//     // Verify 16kHz sample rate (Whisper requirement)
//     expect(mockCommand.audioFrequency.calledWith(16000)).to.be.true;
//   });

//   it("should handle multiple data chunks correctly", async () => {
//     const testFilePath = "/path/to/audio.m4a";

//     const chunk1 = Buffer.allocUnsafe(16);
//     const chunk2 = Buffer.allocUnsafe(16);
//     const chunk3 = Buffer.allocUnsafe(16);

//     chunk1.writeFloatLE(1.0, 0);
//     chunk2.writeFloatLE(2.0, 0);
//     chunk3.writeFloatLE(3.0, 0);

//     const decodePromise = decodeToPCM(testFilePath);

//     setImmediate(() => {
//       mockPipeStream.emit("data", chunk1);
//       mockPipeStream.emit("data", chunk2);
//       mockPipeStream.emit("data", chunk3);
//       mockPipeStream.emit("end");
//     });

//     const result = await decodePromise;

//     // Total size should be sum of all chunks
//     expect(result.length).to.equal(12); // 48 bytes / 4 bytes per float
//   });

//   it("should reject on ffmpeg error", async () => {
//     const testFilePath = "/path/to/invalid.mp3";
//     const testError = new Error("FFmpeg conversion failed");

//     // Capture the error handler
//     let errorHandler: Function;
//     mockCommand.on = sinon
//       .stub()
//       .callsFake((event: string, handler: Function) => {
//         if (event === "error") {
//           errorHandler = handler;
//         }
//         return mockCommand;
//       });

//     const decodePromise = decodeToPCM(testFilePath);

//     setImmediate(() => {
//       if (errorHandler) {
//         errorHandler(testError);
//       }
//     });

//     try {
//       await decodePromise;
//       expect.fail("Should have thrown an error");
//     } catch (error) {
//       expect(error).to.equal(testError);
//       expect(error.message).to.equal("FFmpeg conversion failed");
//     }
//   });

//   it("should handle empty audio file", async () => {
//     const testFilePath = "/path/to/empty.mp3";

//     const decodePromise = decodeToPCM(testFilePath);

//     setImmediate(() => {
//       mockPipeStream.emit("end");
//     });

//     const result = await decodePromise;

//     expect(result).to.be.instanceOf(Float32Array);
//     expect(result.length).to.equal(0);
//   });

//   it("should convert buffer to Float32Array correctly", async () => {
//     const testFilePath = "/path/to/test.wav";

//     // Create buffer with known float values
//     const buffer = Buffer.allocUnsafe(12); // 3 floats
//     buffer.writeFloatLE(1.5, 0);
//     buffer.writeFloatLE(-2.75, 4);
//     buffer.writeFloatLE(3.25, 8);

//     const decodePromise = decodeToPCM(testFilePath);

//     setImmediate(() => {
//       mockPipeStream.emit("data", buffer);
//       mockPipeStream.emit("end");
//     });

//     const result = await decodePromise;

//     expect(result.length).to.equal(3);
//     expect(result[0]).to.be.closeTo(1.5, 0.001);
//     expect(result[1]).to.be.closeTo(-2.75, 0.001);
//     expect(result[2]).to.be.closeTo(3.25, 0.001);
//   });

//   it("should handle large audio files with many chunks", async () => {
//     const testFilePath = "/path/to/large.mp3";
//     const chunkCount = 100;
//     const chunkSize = 1024; // bytes

//     const decodePromise = decodeToPCM(testFilePath);

//     setImmediate(() => {
//       for (let i = 0; i < chunkCount; i++) {
//         mockPipeStream.emit("data", Buffer.alloc(chunkSize));
//       }
//       mockPipeStream.emit("end");
//     });

//     const result = await decodePromise;

//     const expectedLength = (chunkCount * chunkSize) / 4; // 4 bytes per float
//     expect(result.length).to.equal(expectedLength);
//   });

//   it("should call pipe() to start processing", async () => {
//     const testFilePath = "/path/to/audio.mp3";

//     const decodePromise = decodeToPCM(testFilePath);

//     setImmediate(() => {
//       mockPipeStream.emit("end");
//     });

//     await decodePromise;

//     expect(mockCommand.pipe.calledOnce).to.be.true;
//   });

//   describe("Error Scenarios", () => {
//     it("should handle file not found error", async () => {
//       const testFilePath = "/nonexistent/file.mp3";
//       const fileNotFoundError = new Error("ENOENT: no such file or directory");

//       let errorHandler: Function;
//       mockCommand.on = sinon
//         .stub()
//         .callsFake((event: string, handler: Function) => {
//           if (event === "error") {
//             errorHandler = handler;
//           }
//           return mockCommand;
//         });

//       const decodePromise = decodeToPCM(testFilePath);

//       setImmediate(() => {
//         if (errorHandler) {
//           errorHandler(fileNotFoundError);
//         }
//       });

//       await expect(decodePromise).to.be.rejectedWith(fileNotFoundError);
//     });

//     it("should handle unsupported format error", async () => {
//       const testFilePath = "/path/to/unsupported.xyz";
//       const formatError = new Error("Unsupported audio format");

//       let errorHandler: Function;
//       mockCommand.on = sinon
//         .stub()
//         .callsFake((event: string, handler: Function) => {
//           if (event === "error") {
//             errorHandler = handler;
//           }
//           return mockCommand;
//         });

//       const decodePromise = decodeToPCM(testFilePath);

//       setImmediate(() => {
//         if (errorHandler) {
//           errorHandler(formatError);
//         }
//       });

//       await expect(decodePromise).to.be.rejected;
//     });
//   });

//   describe("Audio Format Verification", () => {
//     it("should use 32-bit float format (f32le)", async () => {
//       const decodePromise = decodeToPCM("/test.mp3");

//       setImmediate(() => mockPipeStream.emit("end"));

//       await decodePromise;

//       expect(mockCommand.format.calledWith("f32le")).to.be.true;
//     });

//     it("should use mono audio (1 channel)", async () => {
//       const decodePromise = decodeToPCM("/test.mp3");

//       setImmediate(() => mockPipeStream.emit("end"));

//       await decodePromise;

//       expect(mockCommand.audioChannels.calledWith(1)).to.be.true;
//     });

//     it("should use 16kHz sample rate", async () => {
//       const decodePromise = decodeToPCM("/test.mp3");

//       setImmediate(() => mockPipeStream.emit("end"));

//       await decodePromise;

//       expect(mockCommand.audioFrequency.calledWith(16000)).to.be.true;
//     });
//   });
// });
