// AI prompting & response logic
import { QuestionType } from "./evaluation";

// Load API key from environment variables
// const OpenAI_API_KEY = process.env.OPENAI_API_KEY || "";

/**
 * Generates a duck response based on the curious student behavior
 *
 * Duck characteristics:
 * - Genuinely curious student who wants to understand
 * - Slightly confused, inquisitive, and honest
 * - Never lectures or gives correct answers
 * - Frames challenges as confusion, not correction
 */
export interface DuckResponse {
  message: string;
  questionType: QuestionType;
  tone: "curious" | "confused" | "encouraging";
}

export function generateDuckResponse(
  questionType: QuestionType,
  context: {
    topic: string;
    lastUserResponse: string;
    conversationHistory: Array<{ role: string; content: string }>;
  }
): DuckResponse {
  let message = "";
  let tone: "curious" | "confused" | "encouraging" = "curious";

  switch (questionType) {
    case QuestionType.CLARIFYING:
      message = generateClarifyingQuestion(context);
      tone = "confused";
      break;
    case QuestionType.EXAMPLE_BASED:
      message = generateExampleRequest(context);
      tone = "curious";
      break;
    case QuestionType.CONSISTENCY_CHECK:
      message = generateConsistencyCheck(context);
      tone = "confused";
      break;
    case QuestionType.APPLICATION:
      message = generateApplicationQuestion(context);
      tone = "curious";
      break;
    case QuestionType.CHALLENGE:
      message = generateChallenge(context);
      tone = "confused";
      break;
  }

  return {
    message,
    questionType,
    tone,
  };
}

function generateClarifyingQuestion(context: {
  topic: string;
  lastUserResponse: string;
}): string {
  // Extract key terms from the user's last response to reference
  const words = context.lastUserResponse.split(/\s+/);
  const hasTechnicalTerms = words.some((word) => word.length > 8);

  const templates = [
    "I'm not sure if I fully understand. Can you explain that part again in simpler terms?",
    "Wait, what do you mean by that? Can you break it down for me?",
    "I'm a bit lost. Can you walk me through that step by step?",
    "Hmm, I don't quite get it. Can you explain it another way?",
    hasTechnicalTerms
      ? "That's interesting, but some of those terms are confusing me. Can you explain in simpler words?"
      : "That's interesting, but I need help understanding. Can you clarify?",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateExampleRequest(context: { topic: string }): string {
  const templates = [
    `That's interesting! Can you give me a concrete example of ${context.topic} to help me understand better?`,
    "I think I'm starting to get it! Can you show me an example?",
    `Can you give me a real example of when ${context.topic} would be used?`,
    "I'd love to see an example! Can you think of one?",
    "This is making more sense! Could you give me an example to make it clearer?",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateConsistencyCheck(context: {
  conversationHistory: Array<{ role: string; content: string }>;
}): string {
  const userMessages = context.conversationHistory
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content);

  const hasEarlierContext = userMessages.length > 1;

  const templates = [
    "Wait, I'm a bit confused. Earlier you mentioned something different. How do these ideas fit together?",
    hasEarlierContext
      ? "Hmm, I'm not sure I understand. Earlier in our conversation you said something else. Can you help me connect these?"
      : "Hmm, I'm not sure I understand. Earlier you said something else. Can you help me connect these?",
    "I'm confused now. What you just said seems different from before. Can you explain?",
    "Hold on, I thought you said something else earlier. How does this match up with that?",
    "I'm trying to follow, but this seems different from what you explained before. Can you clarify?",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateApplicationQuestion(context: { topic: string }): string {
  const templates = [
    `I think I'm starting to get it! How would ${context.topic} work in a real-world situation?`,
    "Okay, that makes sense! But how would you actually use this?",
    `Can you help me understand when someone would need to use ${context.topic}?`,
    "This is interesting! How does this apply to real situations?",
    "I see! But what would happen if you tried to use this in practice?",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateChallenge(context: { lastUserResponse: string }): string {
  // Check if the response is very short, which might indicate surface-level understanding
  const isShortResponse = context.lastUserResponse.split(/\s+/).length < 15;

  const templates = [
    "Hmm, I'm not sure that would work. Can you walk me through why that's correct?",
    "Wait, I'm confused about something. If that's true, then what about...? Can you help me understand?",
    isShortResponse
      ? "I don't think I fully get it yet. Can you explain why that makes sense with more detail?"
      : "I don't think I get it. Can you explain why that makes sense?",
    "I'm having trouble following. How do you know that's right?",
    "That's confusing me a bit. Can you explain the reasoning behind that?",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
