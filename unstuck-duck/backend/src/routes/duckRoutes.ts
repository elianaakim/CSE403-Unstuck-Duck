import { Router } from "express";
import { generateFirstQuestion, generateFollowUpQuestion } from "../core/conversation/dialogue";
import { evaluateConversation } from "../core/conversation/evaluation";

const router = Router();

// In-memory session storage (replace with Supabase later)
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
      teachingScore: 0,
      lastEvaluatedAt: null,
      evaluationCount: 0,
    };

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      duckQuestion: firstQuestion,
      topic: session.topic,
      startTime: session.startTime,
      teachingScore: 0,
      message: `Started teaching session on "${topic}"`,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// Generate duck's next question
router.post("/ask", async (req, res) => {
  console.log("Received /ask request with body:", req.body);
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
    const conversationHistoryWithoutLastUser = session.conversationHistory.slice(0, -1);
    const followUpQuestion = await generateFollowUpQuestion(
      session.topic,
      conversationHistoryWithoutLastUser,
      userResponse
    );

    // Add duck's question to conversation history
    session.conversationHistory.push({
      role: "assistant",
      content: followUpQuestion,
    });

    res.json({
      sessionId,
      duckQuestion: followUpQuestion,
      currentTeachingScore: session.teachingScore,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error generating question:", error);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

// Get teaching evaluation (duck evaluates how well it's being taught)
router.post("/evaluate", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required",
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

    // Get the last question and answer from conversation history
    const conversation = session.conversationHistory;
    let lastQuestion = "";
    let lastUserAnswer = "";

    // Find the last user response and take the immediately preceding assistant message as the question
    if (!Array.isArray(conversation) || conversation.length < 2) {
      return res.status(400).json({
        error: "Need at least one question and answer to evaluate teaching",
      });
    }

    let lastUserIndex = -1;
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex <= 0) {
      return res.status(400).json({
        error: "Need at least one question and answer to evaluate teaching",
      });
    }

    const userMessage = conversation[lastUserIndex];
    const questionMessage = conversation[lastUserIndex - 1];

    if (!userMessage || !questionMessage || questionMessage.role !== "assistant") {
      return res.status(400).json({
        error: "Need at least one question and answer to evaluate teaching",
      });
    }

    lastUserAnswer = userMessage.content;
    lastQuestion = questionMessage.content;
    // Create a mock request object for evaluateConversation
    const mockRequest = {
      json: async () => ({
        question: lastQuestion,
        userAnswer: lastUserAnswer,
        subject: session.topic,
      }),
    };

    // Get AI evaluation
    const evaluationResponse = await evaluateConversation(mockRequest as any);
    const evaluationData = (await evaluationResponse.json()) as {
      error?: string;
      score?: number;
    };

    if (evaluationData.error) {
      throw new Error(evaluationData.error);
    }

    // Update the teaching score
    // Use the latest evaluation as the current teaching score
    session.teachingScore = evaluationData.score;
    session.lastEvaluatedAt = new Date();
    session.evaluationCount = (session.evaluationCount || 0) + 1;

    // Determine feedback based on the teaching score
    // Make these more verbose later
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

    res.json({
      sessionId,
      teachingScore: session.teachingScore, 
      feedback,
      lastQuestion,
      evaluationCount: session.evaluationCount,
      timestamp: session.lastEvaluatedAt,
      message: `Based on your teaching, I think I'd score around a ${session.teachingScore}/100 on an exam. ${feedback}`,
    });
  } catch (error) {
    console.error("Error evaluating teaching:", error);
    res.status(500).json({ error: "Failed to evaluate teaching" });
  }
});

// End session and get final teaching assessment
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

    // Final teaching assessment based on the last teaching score
    let finalAssessment = "";
    if (session.teachingScore >= 90) {
      finalAssessment = "Master teacher! Your explanations are exceptional.";
    } else if (session.teachingScore >= 80) {
      finalAssessment = "Excellent teacher! You explain concepts very clearly.";
    } else if (session.teachingScore >= 70) {
      finalAssessment = "Good teacher! You cover the material well.";
    } else if (session.teachingScore >= 60) {
      finalAssessment = "Capable teacher. You get the main points across.";
    } else if (session.teachingScore >= 50) {
      finalAssessment = "Developing teacher. With practice, you'll improve.";
    } else {
      finalAssessment = "Keep practicing your teaching skills!";
    }

    res.json({
      sessionId,
      finalTeachingScore: session.teachingScore, // final score
      duration: session.duration,
      conversationTurns: Math.floor(session.conversationHistory.length / 2),
      finalAssessment,
      topic: session.topic,
      startTime: session.startTime,
      endTime: session.endTime,
      evaluationCount: session.evaluationCount || 0,
      message: `Teaching session complete! Final teaching score: ${session.teachingScore}/100. ${finalAssessment}`,
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
      teachingScore: session.teachingScore, 
      evaluationCount: session.evaluationCount || 0,
      conversationLength: session.conversationHistory.length,
      lastEvaluatedAt: session.lastEvaluatedAt,
      ...(session.endTime && { endTime: session.endTime }),
      ...(session.duration && { duration: session.duration }),
    });
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

export default router;
