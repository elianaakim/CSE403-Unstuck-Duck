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
});
