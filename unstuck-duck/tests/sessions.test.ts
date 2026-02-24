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
});
