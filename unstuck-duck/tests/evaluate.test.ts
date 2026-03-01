import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import proxyquire from "proxyquire";
import { NextRequest } from "next/server";
import { getSessionsStore } from "../app/lib/sessionsStore";

// Mock the evaluateConversation function
const mockEvaluateConversation = async ({
  question,
  userAnswer,
  subject,
}: {
  question: string;
  userAnswer: string;
  subject: string;
}) => {
  // Mock different scores based on answer length for testing
  if (userAnswer.length > 100) return { score: 95 };
  if (userAnswer.length > 50) return { score: 85 };
  if (userAnswer.length > 30) return { score: 75 };
  if (userAnswer.length > 15) return { score: 65 };
  if (userAnswer.length > 5) return { score: 55 };
  return { score: 45 };
};

// Import the REAL route with mocked dependencies
const { POST: evaluatePOST } = proxyquire.noCallThru()(
  "../app/api/evaluate/route",
  {
    "../../../core/conversation/evaluation": {
      evaluateConversation: mockEvaluateConversation,
    },
  }
);

describe("POST /api/evaluate", () => {
  let sessions: Map<string, any>;

  beforeEach(() => {
    sessions = getSessionsStore();
    sessions.clear();
  });

  afterEach(() => {
    sessions.clear();
  });

  it("should evaluate teaching and return score with feedback", async () => {
    const sessionId = "eval-session";

    sessions.set(sessionId, {
      sessionId,
      topic: "programming",
      status: "active",
      conversationHistory: [
        { role: "system", content: "Learning about programming" },
        { role: "assistant", content: "What is a function?" },
        {
          role: "user",
          content:
            "A function is a reusable block of code that performs a specific task and can accept inputs and return outputs.",
        },
      ],
      teachingScore: 0,
      evaluationCount: 0,
      lastEvaluatedAt: null,
    });

    const req = new NextRequest("http://localhost:3000/api/evaluate", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });

    const response = await evaluatePOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("sessionId", sessionId);
    expect(data).to.have.property("teachingScore");
    expect(data.teachingScore).to.be.a("number");
    expect(data).to.have.property("feedback");
    expect(data).to.have.property("message");
    expect(data).to.have.property("evaluationCount", 1);
    expect(data).to.have.property("lastQuestion", "What is a function?");

    // Verify session was updated
    const session = sessions.get(sessionId);
    expect(session.teachingScore).to.equal(data.teachingScore);
    expect(session.evaluationCount).to.equal(1);
    expect(session.lastEvaluatedAt).to.be.instanceOf(Date);
  });

  it("should provide 'Outstanding' feedback for score >= 90", async () => {
    const sessionId = "outstanding-session";

    sessions.set(sessionId, {
      sessionId,
      topic: "biology",
      status: "active",
      conversationHistory: [
        { role: "assistant", content: "What is photosynthesis?" },
        {
          role: "user",
          content:
            "Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose, using carbon dioxide and water, and releasing oxygen as a byproduct. This process occurs in the chloroplasts.",
        },
      ],
      teachingScore: 0,
      evaluationCount: 0,
    });

    const req = new NextRequest("http://localhost:3000/api/evaluate", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });

    const response = await evaluatePOST(req);
    const data = await response.json();

    expect(data.teachingScore).to.be.at.least(90);
    expect(data.feedback).to.include("Outstanding");
  });

  it("should provide 'Great' feedback for score 80-89", async () => {
    const sessionId = "great-session";

    sessions.set(sessionId, {
      sessionId,
      topic: "math",
      status: "active",
      conversationHistory: [
        { role: "assistant", content: "What is algebra?" },
        {
          role: "user",
          content:
            "Algebra is mathematics dealing with symbols and the rules for manipulating those symbols.",
        },
      ],
      teachingScore: 0,
      evaluationCount: 0,
    });

    const req = new NextRequest("http://localhost:3000/api/evaluate", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });

    const response = await evaluatePOST(req);
    const data = await response.json();

    expect(data.teachingScore).to.be.at.least(80).and.below(90);
    expect(data.feedback).to.include("Great");
  });

  it("should increment evaluation count on multiple evaluations", async () => {
    const sessionId = "increment-session";

    sessions.set(sessionId, {
      sessionId,
      topic: "history",
      status: "active",
      conversationHistory: [
        { role: "assistant", content: "Question 1?" },
        { role: "user", content: "Answer 1 with moderate detail here." },
      ],
      teachingScore: 70,
      evaluationCount: 2,
      lastEvaluatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/evaluate", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });

    const response = await evaluatePOST(req);
    const data = await response.json();

    expect(data.evaluationCount).to.equal(3);

    const session = sessions.get(sessionId);
    expect(session.evaluationCount).to.equal(3);
  });

  describe("Validation", () => {
    it("should reject missing sessionId", async () => {
      const req = new NextRequest("http://localhost:3000/api/evaluate", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await evaluatePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data).to.have.property("error", "sessionId is required");
    });

    it("should reject non-existent session", async () => {
      const req = new NextRequest("http://localhost:3000/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ sessionId: "non-existent" }),
      });

      const response = await evaluatePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(404);
      expect(data).to.have.property("error", "Session not found");
    });

    it("should reject inactive session", async () => {
      const sessionId = "inactive-session";

      sessions.set(sessionId, {
        sessionId,
        topic: "test",
        status: "completed",
        conversationHistory: [],
        teachingScore: 0,
        evaluationCount: 0,
      });

      const req = new NextRequest("http://localhost:3000/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const response = await evaluatePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data).to.have.property("error", "Session is not active");
    });

    it("should reject session without user answers", async () => {
      const sessionId = "no-answer-session";

      sessions.set(sessionId, {
        sessionId,
        topic: "test",
        status: "active",
        conversationHistory: [
          { role: "system", content: "System message" },
          { role: "assistant", content: "Question?" },
        ],
        teachingScore: 0,
        evaluationCount: 0,
      });

      const req = new NextRequest("http://localhost:3000/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const response = await evaluatePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data.error).to.include(
        "Need at least one question and answer to evaluate"
      );
    });

    it("should reject session with only system messages", async () => {
      const sessionId = "only-system-session";

      sessions.set(sessionId, {
        sessionId,
        topic: "test",
        status: "active",
        conversationHistory: [{ role: "system", content: "System message" }],
        teachingScore: 0,
        evaluationCount: 0,
      });

      const req = new NextRequest("http://localhost:3000/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const response = await evaluatePOST(req);

      expect(response.status).to.equal(400);
    });
  });

  describe("Conversation Evaluation", () => {
    it("should find the last user answer correctly", async () => {
      const sessionId = "multiple-answers-session";

      sessions.set(sessionId, {
        sessionId,
        topic: "science",
        status: "active",
        conversationHistory: [
          { role: "assistant", content: "Question 1?" },
          { role: "user", content: "First answer" },
          { role: "assistant", content: "Question 2?" },
          { role: "user", content: "Second answer with more detail here" },
        ],
        teachingScore: 0,
        evaluationCount: 0,
      });

      const req = new NextRequest("http://localhost:3000/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const response = await evaluatePOST(req);
      const data = await response.json();

      expect(data.lastQuestion).to.equal("Question 2?");
      expect(response.status).to.equal(200);
    });
  });

  describe("Feedback Messages", () => {
    const feedbackTests = [
      { score: 95, expected: "Outstanding" },
      { score: 85, expected: "Great" },
      { score: 75, expected: "Good" },
      { score: 65, expected: "Fair" },
      { score: 55, expected: "Okay" },
      { score: 45, expected: "Keep teaching" },
    ];

    feedbackTests.forEach(({ score, expected }) => {
      it(`should provide correct feedback for score ${score}`, async () => {
        const sessionId = `feedback-${score}`;
        const answerLength =
          score >= 90
            ? 120
            : score >= 80
              ? 60
              : score >= 70
                ? 35
                : score >= 60
                  ? 20
                  : score >= 50
                    ? 10
                    : 2;

        sessions.set(sessionId, {
          sessionId,
          topic: "test",
          status: "active",
          conversationHistory: [
            { role: "assistant", content: "Question?" },
            { role: "user", content: "A".repeat(answerLength) },
          ],
          teachingScore: 0,
          evaluationCount: 0,
        });

        const req = new NextRequest("http://localhost:3000/api/evaluate", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });

        const response = await evaluatePOST(req);
        const data = await response.json();

        expect(data.feedback).to.include(expected);
        expect(data.message).to.include(data.teachingScore.toString());
      });
    });
  });

  describe("Response Format", () => {
    it("should return all required fields", async () => {
      const sessionId = "format-test";

      sessions.set(sessionId, {
        sessionId,
        topic: "chemistry",
        status: "active",
        conversationHistory: [
          { role: "assistant", content: "What is an atom?" },
          { role: "user", content: "An atom is the smallest unit of matter." },
        ],
        teachingScore: 0,
        evaluationCount: 0,
      });

      const req = new NextRequest("http://localhost:3000/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      const response = await evaluatePOST(req);
      const data = await response.json();

      expect(data).to.have.all.keys(
        "sessionId",
        "teachingScore",
        "lastQuestion",
        "feedback",
        "message",
        "evaluationCount",
        "timestamp"
      );
    });
  });
});
