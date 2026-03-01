import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import proxyquire from "proxyquire";
import { NextRequest } from "next/server";
import { getSessionsStore } from "../app/lib/sessionsStore";

// Mock only the dialogue module
const mockGenerateFollowUpQuestion = async (
  topic: string,
  history: any[],
  userResponse: string
) => {
  // Return deterministic mock responses for testing
  return `Can you explain more about ${topic}?`;
};

// Mock the dialogue module
const dialogueMock = {
  generateFollowUpQuestion: mockGenerateFollowUpQuestion,
};

// Import the REAL route with mocked dependencies
const { POST: askPOST } = proxyquire("../app/api/ask/route", {
  "../../../core/conversation/dialogue": dialogueMock,
});

describe("POST /api/ask", () => {
  let sessions: Map<string, any>;

  beforeEach(() => {
    sessions = getSessionsStore();
    sessions.clear();
  });

  afterEach(() => {
    sessions.clear();
  });

  it("should generate a follow-up question using real route", async () => {
    // Setup: Create a session
    const sessionId = "test-session-123";
    sessions.set(sessionId, {
      sessionId,
      topic: "programming",
      conversationHistory: [
        {
          role: "assistant",
          content: "Hi! Can you teach me about programming?",
        },
      ],
      status: "active",
      teachingScore: 0,
    });

    // Create Next.js request
    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        userResponse: "Programming is writing instructions for computers",
      }),
    });

    // Call the REAL route handler
    const response = await askPOST(req);
    const data = await response.json();

    // Assertions
    expect(response.status).to.equal(200);
    expect(data).to.have.property("sessionId", sessionId);
    expect(data).to.have.property("duckQuestion");
    expect(data.duckQuestion).to.include("programming");

    // Verify session was updated with real logic
    const session = sessions.get(sessionId);
    expect(session.conversationHistory).to.have.length(3); // Initial + user + AI
    expect(session.conversationHistory[1].role).to.equal("user");
    expect(session.conversationHistory[2].role).to.equal("assistant");
  });

  it("should reject missing sessionId", async () => {
    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: JSON.stringify({
        userResponse: "test response",
      }),
    });

    const response = await askPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(400);
    expect(data).to.have.property("error");
  });

  it("should reject non-existent session", async () => {
    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "non-existent",
        userResponse: "test",
      }),
    });

    const response = await askPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(404);
    expect(data.error).to.include("not found");
  });

  it("should reject inactive session", async () => {
    const sessionId = "inactive-session";
    sessions.set(sessionId, {
      sessionId,
      topic: "math",
      conversationHistory: [],
      status: "completed", // Not active
      teachingScore: 0,
    });

    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        userResponse: "test",
      }),
    });

    const response = await askPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(400);
    expect(data.error).to.include("not active");
  });

  it("should update conversation history correctly", async () => {
    const sessionId = "history-test";
    const initialHistory = [
      { role: "assistant", content: "First question" },
      { role: "user", content: "First answer" },
      { role: "assistant", content: "Second question" },
    ];

    sessions.set(sessionId, {
      sessionId,
      topic: "science",
      conversationHistory: [...initialHistory],
      status: "active",
      teachingScore: 0,
    });

    const userResponse = "This is my answer about science";

    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        userResponse,
      }),
    });

    await askPOST(req);

    const session = sessions.get(sessionId);

    // Should have added 2 new messages (user + assistant)
    expect(session.conversationHistory).to.have.length(5);
    expect(session.conversationHistory[3]).to.deep.equal({
      role: "user",
      content: userResponse,
    });
    expect(session.conversationHistory[4].role).to.equal("assistant");
  });
});
