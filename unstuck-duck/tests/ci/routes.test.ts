import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import request from "supertest";
import express from "express";

// Create a simplified test version of the router
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Simple in-memory session storage
  const sessions = new Map();

  // Routes
  app.post("/api/sessions/start", async (req, res) => {
    try {
      const { topic } = req.body;

      if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
        return res.status(400).json({ error: "Valid topic is required" });
      }

      const sessionId = `test_${Date.now()}`;
      const firstQuestion = `Hi! Can you teach me about ${topic}?`;

      const session = {
        sessionId,
        topic: topic.trim(),
        conversationHistory: [{ role: "assistant", content: firstQuestion }],
        status: "active",
        teachingScore: 0,
      };

      sessions.set(sessionId, session);

      res.json({
        sessionId,
        duckQuestion: firstQuestion,
        topic: session.topic,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  app.post("/api/ask", async (req, res) => {
    try {
      const { sessionId, userResponse } = req.body;

      if (!sessionId || !userResponse) {
        return res
          .status(400)
          .json({ error: "sessionId and userResponse are required" });
      }

      const session = sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Add user response
      session.conversationHistory.push({
        role: "user",
        content: userResponse,
      });

      // Generate AI response (simplified)
      const aiQuestion = "Can you explain that in more detail?";

      // Add AI response
      session.conversationHistory.push({
        role: "assistant",
        content: aiQuestion,
      });

      res.json({
        sessionId,
        duckQuestion: aiQuestion,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate question" });
    }
  });

  app.post("/api/evaluate", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const score = 75; // Mock score
      session.teachingScore = score;

      // Generate feedback based on score
      let feedback = "";
      if (score >= 90) feedback = "Outstanding teaching!";
      else if (score >= 80) feedback = "Great teaching!";
      else if (score >= 70) feedback = "Good teaching.";
      else if (score >= 60) feedback = "Fair teaching.";
      else if (score >= 50) feedback = "Okay teaching.";
      else feedback = "Keep teaching!";

      res.json({
        sessionId,
        teachingScore: score,
        feedback,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to evaluate" });
    }
  });

  app.post("/api/sessions/end", (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      session.status = "completed";

      res.json({
        sessionId,
        finalTeachingScore: session.teachingScore,
        status: "completed",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  return { app, sessions };
};

describe("API Routes", () => {
  let testApp: any;
  let sessions: Map<string, any>;

  beforeEach(() => {
    const { app, sessions: appSessions } = createTestApp();
    testApp = app;
    sessions = appSessions;
  });

  describe("POST /api/sessions/start", () => {
    it("should create a new session with valid topic", async () => {
      const response = await request(testApp)
        .post("/api/sessions/start")
        .send({ topic: "programming" })
        .expect(200);

      expect(response.body).to.have.property("sessionId");
      expect(response.body).to.have.property("duckQuestion");
      expect(response.body.duckQuestion).to.include("programming");
      expect(response.body.topic).to.equal("programming");

      // Verify session was stored
      expect(sessions.has(response.body.sessionId)).to.be.true;
    });

    it("should reject empty or invalid topics", async () => {
      await request(testApp).post("/api/sessions/start").send({}).expect(400);

      await request(testApp)
        .post("/api/sessions/start")
        .send({ topic: "" })
        .expect(400);

      await request(testApp)
        .post("/api/sessions/start")
        .send({ topic: "   " })
        .expect(400);
    });
  });

  describe("POST /api/ask", () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(testApp)
        .post("/api/sessions/start")
        .send({ topic: "science" });

      sessionId = response.body.sessionId;
    });

    it("should generate a follow-up question", async () => {
      const response = await request(testApp)
        .post("/api/ask")
        .send({
          sessionId,
          userResponse: "Science is the study of nature",
        })
        .expect(200);

      expect(response.body).to.have.property("duckQuestion");
      expect(response.body.duckQuestion).to.be.a("string");
      expect(response.body.sessionId).to.equal(sessionId);

      // Check conversation history was updated
      const session = sessions.get(sessionId);
      expect(session.conversationHistory).to.have.length(3); // Initial + user + AI
    });

    it("should reject missing sessionId or userResponse", async () => {
      await request(testApp).post("/api/ask").send({ sessionId }).expect(400);

      await request(testApp)
        .post("/api/ask")
        .send({ userResponse: "test" })
        .expect(400);
    });

    it("should reject invalid sessionId", async () => {
      await request(testApp)
        .post("/api/ask")
        .send({
          sessionId: "invalid-session",
          userResponse: "test response",
        })
        .expect(404);
    });
  });

  describe("POST /api/evaluate", () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(testApp)
        .post("/api/sessions/start")
        .send({ topic: "math" });

      sessionId = response.body.sessionId;

      // Add some conversation
      await request(testApp).post("/api/ask").send({
        sessionId,
        userResponse: "Math involves numbers and operations",
      });
    });

    it("should evaluate teaching and return score", async () => {
      const response = await request(testApp)
        .post("/api/evaluate")
        .send({ sessionId })
        .expect(200);

      expect(response.body).to.have.property("teachingScore", 75);
      expect(response.body).to.have.property("feedback");
      expect(response.body.feedback).to.include("Good teaching");

      // Verify session was updated
      const session = sessions.get(sessionId);
      expect(session.teachingScore).to.equal(75);
    });

    it("should reject invalid sessionId", async () => {
      await request(testApp)
        .post("/api/evaluate")
        .send({ sessionId: "invalid" })
        .expect(404);
    });
  });

  describe("POST /api/sessions/end", () => {
    it("should end a session and return final score", async () => {
      const startResponse = await request(testApp)
        .post("/api/sessions/start")
        .send({ topic: "history" });

      const sessionId = startResponse.body.sessionId;

      const response = await request(testApp)
        .post("/api/sessions/end")
        .send({ sessionId })
        .expect(200);

      expect(response.body).to.have.property("finalTeachingScore");
      expect(response.body).to.have.property("status", "completed");

      // Verify session status was updated
      const session = sessions.get(sessionId);
      expect(session.status).to.equal("completed");
    });
  });

  describe("Session Flow Integration", () => {
    it("should complete a full teaching session flow", async () => {
      // 1. Start session
      const startRes = await request(testApp)
        .post("/api/sessions/start")
        .send({ topic: "biology" });

      const sessionId = startRes.body.sessionId;
      expect(startRes.body.duckQuestion).to.include("biology");

      // 2. First exchange
      const askRes1 = await request(testApp).post("/api/ask").send({
        sessionId,
        userResponse: "Biology is the study of living organisms",
      });

      expect(askRes1.body.duckQuestion).to.be.a("string");

      // 3. Second exchange
      await request(testApp).post("/api/ask").send({
        sessionId,
        userResponse: "Cells are the basic unit of life",
      });

      // 4. Evaluate teaching
      const evalRes = await request(testApp)
        .post("/api/evaluate")
        .send({ sessionId });

      expect(evalRes.body.teachingScore).to.equal(75);

      // 5. End session
      const endRes = await request(testApp)
        .post("/api/sessions/end")
        .send({ sessionId });

      expect(endRes.body.status).to.equal("completed");
      expect(endRes.body.finalTeachingScore).to.equal(75);
    });
  });
});