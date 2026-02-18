import { Router, Request, Response } from "express";
import {
  generateFirstQuestion,
  generateFollowUpQuestion,
} from "../core/conversation/dialogue";
import { evaluateConversation } from "../core/conversation/evaluation";

interface ConversationMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

interface Session {
  sessionId: string;
  topic: string;
  startTime: Date;
  conversationHistory: ConversationMessage[];
  status: "active" | "completed";
  teachingScore: number;
  lastEvaluatedAt: Date | null;
  evaluationCount: number;
  endTime?: Date;
  duration?: number;
}

const router = Router();
const sessions = new Map<string, Session>();

// -------------------- START SESSION --------------------
router.post("/sessions/start", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res.status(400).json({ error: "Valid topic is required" });
    }

    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const firstQuestion = await generateFirstQuestion(topic);

    const session: Session = {
      sessionId,
      topic: topic.trim(),
      startTime: new Date(),
      conversationHistory: [
        { role: "system", content: `Learning about ${topic}` },
        { role: "assistant", content: firstQuestion },
      ],
      status: "active",
      teachingScore: 0,
      lastEvaluatedAt: null,
      evaluationCount: 0,
    };

    sessions.set(sessionId, session);

    return res.json({
      sessionId,
      duckQuestion: firstQuestion,
      topic: session.topic,
      startTime: session.startTime,
      teachingScore: 0,
      message: `Started teaching session on "${topic}"`,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    return res.status(500).json({ error: "Failed to start session" });
  }
});

// Generate duck's next question
router.post("/ask", async (req, res) => {
  console.log("Received /ask request with body:", req.body);
  try {
    const { sessionId, userResponse } = req.body;

    if (!sessionId || typeof userResponse !== "string") {
      return res.status(400).json({
        error: "sessionId and userResponse (string) are required",
      });
    }

    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== "active")
      return res.status(400).json({ error: "Session is not active" });

    session.conversationHistory.push({
      role: "user",
      content: userResponse,
    });

    const followUpQuestion = await generateFollowUpQuestion(
      session.topic,
      session.conversationHistory.slice(0, -1),
      userResponse
    );

    session.conversationHistory.push({
      role: "assistant",
      content: followUpQuestion,
    });

    return res.json({
      sessionId,
      duckQuestion: followUpQuestion,
      currentTeachingScore: session.teachingScore,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error generating question:", error);
    return res.status(500).json({ error: "Failed to generate question" });
  }
});

// -------------------- EVALUATE --------------------
router.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== "active")
      return res.status(400).json({ error: "Session is not active" });

    const conversation = session.conversationHistory;

    const lastUserIndex = [...conversation]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find((x) => x.m.role === "user")?.i;

    if (lastUserIndex === undefined || lastUserIndex <= 0) {
      return res.status(400).json({
        error: "Need at least one question and answer to evaluate teaching",
      });
    }

    const lastUserAnswer = conversation[lastUserIndex].content;
    const lastQuestion = conversation[lastUserIndex - 1].content;

    const evaluation = await evaluateConversation({
      question: lastQuestion,
      userAnswer: lastUserAnswer,
      subject: session.topic,
    });

    session.teachingScore = evaluation.score;
    session.lastEvaluatedAt = new Date();
    session.evaluationCount++;

    return res.json({
      sessionId,
      teachingScore: session.teachingScore,
      lastQuestion,
      evaluationCount: session.evaluationCount,
      timestamp: session.lastEvaluatedAt,
    });
  } catch (error) {
    console.error("Error evaluating teaching:", error);
    return res.status(500).json({ error: "Failed to evaluate teaching" });
  }
});

// -------------------- END SESSION --------------------
router.post("/sessions/end", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.endTime = new Date();
    session.status = "completed";
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    return res.json({
      sessionId,
      finalTeachingScore: session.teachingScore,
      duration: session.duration,
      topic: session.topic,
      startTime: session.startTime,
      endTime: session.endTime,
      evaluationCount: session.evaluationCount,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return res.status(500).json({ error: "Failed to end session" });
  }
});

// -------------------- GET SESSION --------------------
router.get("/sessions/:sessionId", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    const session = sessions.get(id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.json({
      sessionId,
      topic: session.topic,
      status: session.status,
      startTime: session.startTime,
      teachingScore: session.teachingScore,
      evaluationCount: session.evaluationCount,
      conversationLength: session.conversationHistory.length,
      lastEvaluatedAt: session.lastEvaluatedAt,
      endTime: session.endTime,
      duration: session.duration,
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return res.status(500).json({ error: "Failed to get session" });
  }
});

export default router;
