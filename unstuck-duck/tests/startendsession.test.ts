import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import proxyquire from "proxyquire";
import { NextRequest } from "next/server";
import { getSessionsStore } from "../app/lib/sessionsStore";

// Mock the generateFirstQuestion function
const mockGenerateFirstQuestion = async (topic: string) => {
  return `Hi! Can you teach me about ${topic}?`;
};

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: async (token: string) => {
      if (token === "valid-token") {
        return {
          data: { user: { id: "user-123", email: "test@example.com" } },
          error: null,
        };
      }
      return { data: { user: null }, error: null };
    },
  },
  from: (table: string) => {
    return {
      insert: (data: any) => {
        return {
          select: () => {
            return {
              single: async () => {
                if (table === "Sessions") {
                  return {
                    data: { session_id: "db-session-123", ...data },
                    error: null,
                  };
                }
                return { data: null, error: null };
              },
            };
          },
        };
      },
    };
  },
};

const mockGetServiceSupabase = () => mockSupabaseClient;

// Use .noCallThru() to prevent loading real modules
const startModule = proxyquire.noCallThru()("../app/api/sessions/start/route", {
  "../../../../core/conversation/dialogue": {
    generateFirstQuestion: mockGenerateFirstQuestion,
  },
});

const endModule = proxyquire.noCallThru()("../app/api/sessions/end/route", {
  "../../../../supabase/supabase": {
    getServiceSupabase: mockGetServiceSupabase,
    "@noCallThru": true, // This tells proxyquire not to load the real module
  },
});

const { POST: startPOST } = startModule;
const { POST: endPOST } = endModule;
const { GET } = proxyquire("../app/api/sessions/[sessionId]/route", {});

describe("Session API Routes", () => {
  let sessions: Map<string, any>;

  beforeEach(() => {
    sessions = getSessionsStore();
    sessions.clear();
  });

  afterEach(() => {
    sessions.clear();
  });

  describe("POST /api/sessions/start", () => {
    it("should create a new session with valid topic", async () => {
      const req = new NextRequest("http://localhost:3000/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "programming" }),
      });

      const response = await startPOST(req);
      const data = await response.json();

      // Verify response structure
      expect(response.status).to.equal(200);
      expect(data).to.have.property("sessionId");
      expect(data).to.have.property("duckQuestion");
      expect(data).to.have.property("topic", "programming");
      expect(data).to.have.property("startTime");
      expect(data).to.have.property("teachingScore", 0);
      expect(data).to.have.property("message");

      // Verify question includes topic
      expect(data.duckQuestion).to.include("programming");

      // Verify session was stored
      expect(sessions.has(data.sessionId)).to.be.true;
      const session = sessions.get(data.sessionId);
      expect(session).to.exist;
      expect(session.topic).to.equal("programming");
      expect(session.status).to.equal("active");
    });

    it("should create session with correct conversation history", async () => {
      const req = new NextRequest("http://localhost:3000/api/sessions/start", {
        method: "POST",
        body: JSON.stringify({ topic: "biology" }),
      });

      const response = await startPOST(req);
      const data = await response.json();

      const session = sessions.get(data.sessionId);

      // Should have 2 messages: system + assistant
      expect(session.conversationHistory).to.have.length(2);
      expect(session.conversationHistory[0]).to.deep.equal({
        role: "system",
        content: "Learning about biology",
      });
      expect(session.conversationHistory[1]).to.deep.equal({
        role: "assistant",
        content: "Hi! Can you teach me about biology?",
      });
    });

    it("should initialize session with correct default values", async () => {
      const req = new NextRequest("http://localhost:3000/api/sessions/start", {
        method: "POST",
        body: JSON.stringify({ topic: "science" }),
      });

      const response = await startPOST(req);
      const data = await response.json();

      const session = sessions.get(data.sessionId);

      expect(session.teachingScore).to.equal(0);
      expect(session.status).to.equal("active");
      expect(session.lastEvaluatedAt).to.be.null;
      expect(session.evaluationCount).to.equal(0);
      expect(session.startTime).to.be.instanceOf(Date);
    });

    it("should generate unique session IDs", async () => {
      const req1 = new NextRequest("http://localhost:3000/api/sessions/start", {
        method: "POST",
        body: JSON.stringify({ topic: "math" }),
      });

      const req2 = new NextRequest("http://localhost:3000/api/sessions/start", {
        method: "POST",
        body: JSON.stringify({ topic: "physics" }),
      });

      const response1 = await startPOST(req1);
      const data1 = await response1.json();

      const response2 = await startPOST(req2);
      const data2 = await response2.json();

      expect(data1.sessionId).to.not.equal(data2.sessionId);
      expect(sessions.size).to.equal(2);
    });

    it("should trim whitespace from topic", async () => {
      const req = new NextRequest("http://localhost:3000/api/sessions/start", {
        method: "POST",
        body: JSON.stringify({ topic: "   history   " }),
      });

      const response = await startPOST(req);
      const data = await response.json();

      expect(data.topic).to.equal("history");
      const session = sessions.get(data.sessionId);
      expect(session.topic).to.equal("history");
    });

    describe("Validation", () => {
      it("should reject missing topic", async () => {
        const req = new NextRequest(
          "http://localhost:3000/api/sessions/start",
          {
            method: "POST",
            body: JSON.stringify({}),
          }
        );

        const response = await startPOST(req);
        const data = await response.json();

        expect(response.status).to.equal(400);
        expect(data).to.have.property("error", "Valid topic is required");
        expect(sessions.size).to.equal(0);
      });

      it("should reject empty string topic", async () => {
        const req = new NextRequest(
          "http://localhost:3000/api/sessions/start",
          {
            method: "POST",
            body: JSON.stringify({ topic: "" }),
          }
        );

        const response = await startPOST(req);
        const data = await response.json();

        expect(response.status).to.equal(400);
        expect(data.error).to.equal("Valid topic is required");
      });

      it("should reject whitespace-only topic", async () => {
        const req = new NextRequest(
          "http://localhost:3000/api/sessions/start",
          {
            method: "POST",
            body: JSON.stringify({ topic: "   " }),
          }
        );

        const response = await startPOST(req);

        expect(response.status).to.equal(400);
      });

      it("should reject non-string topic", async () => {
        const req = new NextRequest(
          "http://localhost:3000/api/sessions/start",
          {
            method: "POST",
            body: JSON.stringify({ topic: 123 }),
          }
        );

        const response = await startPOST(req);

        expect(response.status).to.equal(400);
      });

      it("should reject null topic", async () => {
        const req = new NextRequest(
          "http://localhost:3000/api/sessions/start",
          {
            method: "POST",
            body: JSON.stringify({ topic: null }),
          }
        );

        const response = await startPOST(req);

        expect(response.status).to.equal(400);
      });
    });

    describe("Error Handling", () => {
      it("should handle invalid JSON body", async () => {
        const req = new NextRequest(
          "http://localhost:3000/api/sessions/start",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "invalid json{",
          }
        );

        const response = await startPOST(req);

        expect(response.status).to.equal(500);
      });
    });

    describe("Session ID Format", () => {
      it("should generate session ID with correct format", async () => {
        const req = new NextRequest(
          "http://localhost:3000/api/sessions/start",
          {
            method: "POST",
            body: JSON.stringify({ topic: "test" }),
          }
        );

        const response = await startPOST(req);
        const data = await response.json();

        // Should start with "session_"
        expect(data.sessionId).to.match(/^session_\d+_[a-z0-9]+$/);
      });
    });
  });

  describe("POST /api/sessions/end", () => {
    it("should end a session successfully", async () => {
      const sessionId = "test-session-123";
      const startTime = new Date(Date.now() - 300000); // 5 minutes ago

      sessions.set(sessionId, {
        sessionId,
        topic: "programming",
        startTime,
        conversationHistory: [
          { role: "system", content: "Learning about programming" },
          { role: "assistant", content: "What is programming?" },
          { role: "user", content: "It's writing code" },
        ],
        status: "active",
        teachingScore: 85,
        evaluationCount: 1,
      });

      const req = new NextRequest("http://localhost:3000/api/sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const response = await endPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(200);
      expect(data).to.have.property("sessionId", sessionId);
      expect(data).to.have.property("finalTeachingScore", 85);
      expect(data).to.have.property("duration");
      expect(data).to.have.property("topic", "programming");
      expect(data).to.have.property("startTime");
      expect(data).to.have.property("endTime");
      expect(data).to.have.property("evaluationCount", 1);

      // Verify session was updated
      const session = sessions.get(sessionId);
      expect(session.status).to.equal("completed");
      expect(session.endTime).to.be.instanceOf(Date);
      expect(session.duration).to.be.a("number");
      expect(session.duration).to.be.greaterThan(0);
    });

    it("should calculate duration correctly", async () => {
      const sessionId = "duration-test";
      const startTime = new Date(Date.now() - 600000); // 10 minutes ago

      sessions.set(sessionId, {
        sessionId,
        topic: "math",
        startTime,
        conversationHistory: [],
        status: "active",
        teachingScore: 0,
        evaluationCount: 0,
      });

      const req = new NextRequest("http://localhost:3000/api/sessions/end", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const response = await endPOST(req);
      const data = await response.json();

      const session = sessions.get(sessionId);

      expect(data.duration).to.equal(session.duration);
      expect(session.duration).to.be.approximately(600000, 1000); // ~10 minutes
    });

    it("should end session without authentication", async () => {
      const sessionId = "no-auth-session";

      sessions.set(sessionId, {
        sessionId,
        topic: "science",
        startTime: new Date(),
        conversationHistory: [],
        status: "active",
        teachingScore: 70,
        evaluationCount: 2,
      });

      const req = new NextRequest("http://localhost:3000/api/sessions/end", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const response = await endPOST(req);

      expect(response.status).to.equal(200);

      const session = sessions.get(sessionId);
      expect(session.status).to.equal("completed");
    });

    it("should end session with valid authentication", async () => {
      const sessionId = "auth-session";

      sessions.set(sessionId, {
        sessionId,
        topic: "history",
        startTime: new Date(),
        conversationHistory: [
          { role: "system", content: "Learning" },
          { role: "assistant", content: "Question" },
          { role: "user", content: "Answer" },
        ],
        status: "active",
        teachingScore: 90,
        evaluationCount: 1,
      });

      const req = new NextRequest("http://localhost:3000/api/sessions/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ sessionId }),
      });

      const response = await endPOST(req);

      expect(response.status).to.equal(200);

      const session = sessions.get(sessionId);
      expect(session.status).to.equal("completed");
    });

    describe("Validation", () => {
      it("should reject missing sessionId", async () => {
        const req = new NextRequest("http://localhost:3000/api/sessions/end", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const response = await endPOST(req);
        const data = await response.json();

        expect(response.status).to.equal(400);
        expect(data).to.have.property("error", "sessionId is required");
      });

      it("should reject null sessionId", async () => {
        const req = new NextRequest("http://localhost:3000/api/sessions/end", {
          method: "POST",
          body: JSON.stringify({ sessionId: null }),
        });

        const response = await endPOST(req);

        expect(response.status).to.equal(400);
      });

      it("should reject non-existent session", async () => {
        const req = new NextRequest("http://localhost:3000/api/sessions/end", {
          method: "POST",
          body: JSON.stringify({ sessionId: "non-existent-session" }),
        });

        const response = await endPOST(req);
        const data = await response.json();

        expect(response.status).to.equal(404);
        expect(data).to.have.property("error", "Session not found");
      });
    });

    describe("Session State Updates", () => {
      it("should set status to completed", async () => {
        const sessionId = "status-test";

        sessions.set(sessionId, {
          sessionId,
          topic: "test",
          startTime: new Date(),
          conversationHistory: [],
          status: "active",
          teachingScore: 0,
          evaluationCount: 0,
        });

        const req = new NextRequest("http://localhost:3000/api/sessions/end", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });

        await endPOST(req);

        const session = sessions.get(sessionId);
        expect(session.status).to.equal("completed");
      });

      it("should set endTime to current time", async () => {
        const sessionId = "endtime-test";
        const beforeEnd = new Date();

        sessions.set(sessionId, {
          sessionId,
          topic: "test",
          startTime: new Date(Date.now() - 60000),
          conversationHistory: [],
          status: "active",
          teachingScore: 0,
          evaluationCount: 0,
        });

        const req = new NextRequest("http://localhost:3000/api/sessions/end", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });

        await endPOST(req);

        const afterEnd = new Date();
        const session = sessions.get(sessionId);

        expect(session.endTime).to.be.instanceOf(Date);
        expect(session.endTime.getTime()).to.be.at.least(beforeEnd.getTime());
        expect(session.endTime.getTime()).to.be.at.most(afterEnd.getTime());
      });
    });

    describe("Response Format", () => {
      it("should return all required fields", async () => {
        const sessionId = "response-test";

        sessions.set(sessionId, {
          sessionId,
          topic: "biology",
          startTime: new Date(Date.now() - 120000),
          conversationHistory: [],
          status: "active",
          teachingScore: 88,
          evaluationCount: 3,
        });

        const req = new NextRequest("http://localhost:3000/api/sessions/end", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });

        const response = await endPOST(req);
        const data = await response.json();

        expect(data).to.have.all.keys(
          "sessionId",
          "finalTeachingScore",
          "duration",
          "topic",
          "startTime",
          "endTime",
          "evaluationCount"
        );
      });
    });
  });

  describe("Integration: Full Session Flow", () => {
    it("should complete a full session lifecycle", async () => {
      // 1. Start session
      const startReq = new NextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({ topic: "integration-test" }),
        }
      );

      const startRes = await startPOST(startReq);
      const startData = await startRes.json();

      expect(startRes.status).to.equal(200);
      const sessionId = startData.sessionId;
      expect(sessionId).to.exist;

      // 2. Verify session is active
      let session = sessions.get(sessionId);
      expect(session.status).to.equal("active");
      expect(session.topic).to.equal("integration-test");

      // 3. End session
      const endReq = new NextRequest("http://localhost:3000/api/sessions/end", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const endRes = await endPOST(endReq);
      const endData = await endRes.json();

      expect(endRes.status).to.equal(200);
      expect(endData.sessionId).to.equal(sessionId);

      // 4. Verify session is completed
      session = sessions.get(sessionId);
      expect(session.status).to.equal("completed");
      expect(session.endTime).to.exist;
    });
  });
});
describe("GET /api/sessions/[sessionId]", () => {
  it("should retrieve session details", async () => {
    const sessionId = "get-test-session";
    const startTime = new Date(Date.now() - 300000);

    sessions.set(sessionId, {
      sessionId,
      topic: "mathematics",
      status: "active",
      startTime,
      teachingScore: 75,
      evaluationCount: 2,
      conversationHistory: [
        { role: "system", content: "Learning" },
        { role: "assistant", content: "Question" },
        { role: "user", content: "Answer" },
      ],
      lastEvaluatedAt: new Date(),
      endTime: null,
      duration: null,
    });

    const req = new NextRequest(
      `http://localhost:3000/api/sessions/${sessionId}`,
      { method: "GET" }
    );

    // Mock the params object as a Promise
    const mockParams = Promise.resolve({ sessionId });
    const response = await GET(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("sessionId", sessionId);
    expect(data).to.have.property("topic", "mathematics");
    expect(data).to.have.property("status", "active");
    expect(data).to.have.property("teachingScore", 75);
    expect(data).to.have.property("evaluationCount", 2);
    expect(data).to.have.property("conversationLength", 3);
    expect(data).to.have.property("lastEvaluatedAt");
  });

  it("should return 404 for non-existent session", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/sessions/non-existent",
      { method: "GET" }
    );

    const mockParams = Promise.resolve({ sessionId: "non-existent" });
    const response = await GET(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).to.equal(404);
    expect(data).to.have.property("error", "Session not found");
  });
});
