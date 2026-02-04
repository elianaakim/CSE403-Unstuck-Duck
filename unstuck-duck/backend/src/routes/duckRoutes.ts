import { Router } from "express";
import {
  determineNextQuestionType,
  evaluateExplanation,
  analyzeResponse,
  getScoreCategory,
  calculatePercentageScore,
  getFinalAssessment,
  QuestionType,
} from "../core/conversation/evaluation";
import { generateDuckResponse } from "../core/conversation/dialogue";
import { generateAIDuckQuestion, evaluateWithAI } from "../routes/openai";

const router = Router();

// In-memory session store (replace with DB later)
const sessions = new Map();

// 1. Start a teaching session
router.post("/sessions/start", (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = {
      sessionId,
      topic,
      startTime: new Date(),
      totalScore: 0,
      conversation: [],
      status: "active",
      useAI: false, // Start with rule-based
    };

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      message: `Started teaching session on "${topic}"`,
      topic,
      startTime: session.startTime,
      totalScore: 0,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// 2. Get duck's next question (hybrid: rule-based + AI)
router.post("/ask", async (req, res) => {
  try {
    const { sessionId, lastUserResponse, conversationHistory } = req.body;

    if (!sessionId || !lastUserResponse) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const analysis = analyzeResponse(lastUserResponse);

    // Determine question type using rule-based logic
    const nextQuestionType = determineNextQuestionType(
      lastUserResponse,
      conversationHistory || [],
      session.totalScore
    );

    let duckQuestion: string;
    let useAI = session.useAI;

    // Use AI if: score > 400 OR response is complex OR rule-based seems inadequate
    const shouldUseAI =
      session.totalScore > 400 ||
      analysis.completeness > 80 ||
      lastUserResponse.length > 200;

    if (shouldUseAI) {
      const aiQuestion = await generateAIDuckQuestion(
        session.topic,
        lastUserResponse,
        conversationHistory || []
      );

      if (aiQuestion && aiQuestion.length > 10) {
        duckQuestion = aiQuestion;
        useAI = true;
      } else {
        // Fallback to rule-based
        const duckResponse = generateDuckResponse(nextQuestionType, {
          topic: session.topic,
          lastUserResponse,
          conversationHistory: conversationHistory || [],
        });
        duckQuestion = duckResponse.message;
        useAI = false;
      }
    } else {
      // Use rule-based
      const duckResponse = generateDuckResponse(nextQuestionType, {
        topic: session.topic,
        lastUserResponse,
        conversationHistory: conversationHistory || [],
      });
      duckQuestion = duckResponse.message;
      useAI = false;
    }

    // Update session
    session.useAI = useAI;
    session.conversation.push({
      timestamp: new Date(),
      userMessage: lastUserResponse,
      duckQuestion,
    });

    res.json({
      duckQuestion,
      questionType: nextQuestionType,
      usesAI: useAI,
      analysis: {
        clarity: analysis.clarity,
        completeness: analysis.completeness,
        hasExamples: analysis.hasExamples,
      },
    });
  } catch (error) {
    console.error("Error generating question:", error);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

// 3. Get teaching feedback (hybrid scoring)
router.post("/feedback", async (req, res) => {
  try {
    const { sessionId, userResponse } = req.body;

    if (!sessionId || !userResponse) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    let deltaPoints: number;
    let feedback: string;
    let breakdown: any;
    let usesAI = false;

    // Use AI scoring for complex responses or higher scores
    const analysis = analyzeResponse(userResponse);
    const shouldUseAI =
      session.totalScore > 300 ||
      analysis.completeness > 70 ||
      userResponse.length > 150;

    if (shouldUseAI) {
      try {
        const context = session.conversation
          .slice(-3)
          .map((c) => `User: ${c.userMessage?.substring(0, 100)}...`)
          .join(" | ");

        const aiResult = await evaluateWithAI(
          session.topic,
          userResponse,
          context
        );

        deltaPoints = aiResult.score;
        feedback = aiResult.feedback;
        breakdown = aiResult.breakdown;
        usesAI = true;
      } catch (aiError) {
        // Fallback to rule-based
        console.warn("AI scoring failed, using rule-based:", aiError);
        const ruleResult = evaluateExplanation(userResponse);
        deltaPoints = ruleResult.deltaPoints;
        feedback = ruleResult.feedback;
        breakdown = ruleResult.breakdown;
        usesAI = false;
      }
    } else {
      // Use rule-based scoring
      const ruleResult = evaluateExplanation(userResponse);
      deltaPoints = ruleResult.deltaPoints;
      feedback = ruleResult.feedback;
      breakdown = ruleResult.breakdown;
      usesAI = false;
    }

    // Update session score
    session.totalScore += deltaPoints;

    // Update conversation
    session.conversation.push({
      timestamp: new Date(),
      userMessage: userResponse,
      feedback,
    });

    const percentage = calculatePercentageScore(session.totalScore);
    const category = getScoreCategory(session.totalScore);

    res.json({
      deltaPoints,
      totalScore: session.totalScore,
      percentageScore: percentage,
      scoreCategory: category,
      feedback,
      breakdown,
      usesAI,
      message: `Score: ${session.totalScore}/${800} (${percentage}%) - ${category}`,
    });
  } catch (error) {
    console.error("Error evaluating feedback:", error);
    res.status(500).json({ error: "Failed to evaluate explanation" });
  }
});

// 4. End session
router.post("/sessions/end", (req, res) => {
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

    const finalAssessment = getFinalAssessment(session.totalScore);
    const percentage = calculatePercentageScore(session.totalScore);

    res.json({
      sessionId,
      finalScore: session.totalScore,
      percentageScore: percentage,
      duration: session.endTime.getTime() - session.startTime.getTime(),
      conversationTurns: session.conversation.length,
      finalAssessment,
      usedAI: session.useAI,
      message: `Session completed! Final score: ${session.totalScore}/${800}`,
    });

    // Clean up after 5 minutes
    setTimeout(() => sessions.delete(sessionId), 300000);
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// 5. Get session status
router.get("/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

export default router;
