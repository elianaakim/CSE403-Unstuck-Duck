import { Router, Request, Response } from "express";
import {
  generateFirstQuestion,
  generateFollowUpQuestion,
} from "../../../core/conversation/dialogue";
import { evaluateConversation } from "../../../core/conversation/evaluation";
import { getSessionsStore } from "../../../app/lib/sessionsStore";

const router = Router();

router.post("/sessions/start", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body as { topic?: string };

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res.status(400).json({ error: "Valid topic is required" });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const normalizedTopic = topic.trim();
    const firstQuestion = await generateFirstQuestion(normalizedTopic);

    const session = {
      sessionId,
      topic: normalizedTopic,
      startTime: new Date(),
      conversationHistory: [
        {
          role: "system" as const,
          content: `Learning about ${normalizedTopic}`,
        },
        { role: "assistant" as const, content: firstQuestion },
      ],
      status: "active" as const,
      teachingScore: 0,
      lastEvaluatedAt: null,
      evaluationCount: 0,
    };

    const sessions = getSessionsStore();
    sessions.set(sessionId, session);

    return res.json({
      sessionId,
      duckQuestion: firstQuestion,
      topic: normalizedTopic,
      startTime: session.startTime,
      teachingScore: 0,
      message: `Started teaching session on "${normalizedTopic}"`,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    return res.status(500).json({ error: "Failed to start session" });
  }
});

router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { sessionId, userResponse } = req.body as {
      sessionId?: string;
      userResponse?: string;
    };

    if (!sessionId || typeof userResponse !== "string") {
      return res
        .status(400)
        .json({ error: "sessionId and userResponse (string) are required" });
    }

    const sessions = getSessionsStore();
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

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

router.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body as { sessionId?: string };

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const sessions = getSessionsStore();
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

    const conversation = session.conversationHistory;

    const lastUserIndex = [...conversation]
      .map((m, index) => ({ m, index }))
      .reverse()
      .find((x) => x.m.role === "user")?.index;

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
    session.evaluationCount += 1;

    let feedback = "";
    if (session.teachingScore >= 90) {
      feedback = "Outstanding teaching! I feel very prepared for the exam.";
    } else if (session.teachingScore >= 80) {
      feedback = "Great teaching! I have a strong understanding.";
    } else if (session.teachingScore >= 70) {
      feedback = "Good teaching. I'm getting the main concepts.";
    } else if (session.teachingScore >= 60) {
      feedback = "Fair teaching. I understand the basics.";
    } else if (session.teachingScore >= 50) {
      feedback = "Okay teaching. I need more clarity on some points.";
    } else {
      feedback = "Keep teaching! I need more explanation to understand.";
    }

    return res.json({
      sessionId,
      teachingScore: session.teachingScore,
      lastQuestion,
      feedback,
      message: `Based on your teaching, I think I'd score around a ${session.teachingScore}/100 on an exam. ${feedback}`,
      evaluationCount: session.evaluationCount,
      timestamp: session.lastEvaluatedAt,
    });
  } catch (error) {
    console.error("Error evaluating teaching:", error);
    return res.status(500).json({ error: "Failed to evaluate teaching" });
  }
});

router.post("/sessions/end", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body as { sessionId?: string };

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const sessions = getSessionsStore();
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

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

router.get("/sessions/:sessionId", (req: Request, res: Response) => {
  try {
    const rawSessionId = req.params.sessionId;
    const sessionId = Array.isArray(rawSessionId)
      ? rawSessionId[0]
      : rawSessionId;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const sessions = getSessionsStore();
    const session = sessions.get(sessionId);

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
