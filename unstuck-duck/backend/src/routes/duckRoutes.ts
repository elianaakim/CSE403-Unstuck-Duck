// routes/duckRoutes.ts
import { Router } from "express";
import {
  generateFirstQuestion,
  generateFollowUpQuestion,
} from "../core/conversation/dialogue";
import { evaluateConversation } from "../core/conversation/evaluation";

const router = Router();

// In-memory session store (replace with DB later)
const sessions = new Map<string, any>();

// Start a teaching session
router.post("/sessions/start", async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res.status(400).json({ error: "Valid topic is required" });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate first AI question
    const firstQuestion = await generateFirstQuestion(topic);

    const session = {
      sessionId,
      topic: topic.trim(),
      startTime: new Date(),
      conversationHistory: [
        { role: "system", content: `Learning about ${topic}` },
        { role: "assistant", content: firstQuestion },
      ],
      status: "active",
      userScore: 0,
      attempts: 0,
    };

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      duckQuestion: firstQuestion,
      topic: session.topic,
      startTime: session.startTime,
      message: `Started teaching session on "${topic}"`,
      conversationHistory: session.conversationHistory,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// Generate duck's next question
router.post("/ask", async (req, res) => {
  try {
    const { sessionId, userResponse } = req.body;

    if (!sessionId || !userResponse || typeof userResponse !== "string") {
      return res.status(400).json({
        error: "sessionId and userResponse (string) are required",
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

    // Add user response to conversation history
    session.conversationHistory.push({
      role: "user",
      content: userResponse,
    });

    // Generate AI follow-up question
    const followUpQuestion = await generateFollowUpQuestion(
      session.topic,
      session.conversationHistory,
      userResponse
    );

    // Add duck's question to conversation history
    session.conversationHistory.push({
      role: "assistant",
      content: followUpQuestion,
    });

    // Update session
    session.attempts = (session.attempts || 0) + 1;

    res.json({
      sessionId,
      duckQuestion: followUpQuestion,
      conversationHistory: session.conversationHistory,
      attempts: session.attempts,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error generating question:", error);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

// Get teaching feedback and score (AI evaluation)
router.post("/feedback", async (req, res) => {
  try {
    const { sessionId, question, userAnswer } = req.body;

    if (!sessionId || !question || !userAnswer) {
      return res.status(400).json({
        error: "sessionId, question, and userAnswer are required",
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Create a mock request object for evaluateConversation
    const mockRequest = {
      json: async () => ({
        question,
        userAnswer,
        subject: session.topic,
      }),
    };

    // Get AI evaluation
    const evaluationResponse = await evaluateConversation(mockRequest as any);
    const evaluationData = await evaluationResponse.json();

    if (evaluationData.error) {
      throw new Error(evaluationData.error);
    }

    // Update session score
    session.userScore = (session.userScore || 0) + evaluationData.score;

    // Calculate percentage (assuming max score per question is 100)
    const totalPossibleScore = (session.attempts || 1) * 100;
    const percentageScore = Math.round(
      (session.userScore / totalPossibleScore) * 100
    );

    // Determine feedback based on score
    let feedback = "";
    if (evaluationData.score >= 80) {
      feedback = "Excellent explanation! You clearly understand this concept.";
    } else if (evaluationData.score >= 60) {
      feedback = "Good job! Your explanation covers the main points.";
    } else if (evaluationData.score >= 40) {
      feedback =
        "You're on the right track, but could use more detail or clarity.";
    } else {
      feedback =
        "Try to focus more on the core concepts and provide specific examples.";
    }

    res.json({
      sessionId,
      score: evaluationData.score,
      totalScore: session.userScore,
      percentageScore,
      feedback,
      question,
      userAnswer,
      timestamp: new Date(),
      attempts: session.attempts,
    });
  } catch (error) {
    console.error("Error evaluating feedback:", error);
    res.status(500).json({ error: "Failed to evaluate explanation" });
  }
});

// End session and get final assessment
router.post("/sessions/end", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.endTime = new Date();
    session.status = "completed";
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    // Calculate final score metrics
    const totalPossibleScore = (session.attempts || 1) * 100;
    const finalPercentage =
      session.attempts > 0
        ? Math.round((session.userScore / totalPossibleScore) * 100)
        : 0;

    // Generate final assessment
    let finalAssessment = "";
    if (finalPercentage >= 80) {
      finalAssessment = "Outstanding! You've mastered this topic.";
    } else if (finalPercentage >= 60) {
      finalAssessment = "Good work! You have a solid understanding.";
    } else if (finalPercentage >= 40) {
      finalAssessment = "You're making progress. Keep practicing!";
    } else {
      finalAssessment = "Keep learning! Review the basics and try again.";
    }

    res.json({
      sessionId,
      finalScore: session.userScore || 0,
      percentageScore: finalPercentage,
      duration: session.duration,
      conversationTurns: session.attempts || 0,
      finalAssessment,
      topic: session.topic,
      startTime: session.startTime,
      endTime: session.endTime,
      conversationHistory: session.conversationHistory,
    });

    // Clean up after 10 minutes
    setTimeout(() => {
      sessions.delete(sessionId);
      console.log(`Cleaned up session ${sessionId}`);
    }, 600000);
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Get session status
router.get("/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      sessionId,
      topic: session.topic,
      status: session.status,
      startTime: session.startTime,
      userScore: session.userScore || 0,
      attempts: session.attempts || 0,
      conversationHistory: session.conversationHistory || [],
      ...(session.endTime && { endTime: session.endTime }),
      ...(session.duration && { duration: session.duration }),
    });
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

export default router;
