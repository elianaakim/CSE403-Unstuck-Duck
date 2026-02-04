/**
 * Teaching score evaluation system
 *
 * Score range and interpretation:
 * 0–200: Major gaps in understanding, explanations are unclear or incorrect
 * 200–400: Basic understanding, but missing depth or consistency
 * 400–600: Solid understanding with minor gaps
 * 600–800: Strong mastery, explanations are clear, accurate, and transferable
 * Maximum score: 800
 */

export interface EvaluationResult {
  deltaPoints: number; // Points earned for this specific response (0-65 max per turn)
  feedback: string;
  breakdown: {
    clarityPts: number;
    coherencePts: number; // Was "accuracy" - based on reasoning signals, not fact-checking
    examplePts: number;
    contradictionResolutionPts: number;
    depthPts: number;
  };
}

export interface ResponseAnalysis {
  clarity: number; // 0-100: Structure, step-by-step explanations, logical flow
  coherence: number; // 0-100: Reasoning quality based on signal words (because, therefore, etc.)
  completeness: number; // 0-100: Depth and comprehensiveness
  hasExamples: boolean;
}

export enum QuestionType {
  CLARIFYING = "clarifying",
  EXAMPLE_BASED = "example_based",
  CONSISTENCY_CHECK = "consistency_check",
  APPLICATION = "application",
  CHALLENGE = "challenge",
}

/**
 * Evaluates a user's explanation and returns points earned FOR THIS RESPONSE
 *
 * Point system per response (max ~65 points per turn):
 * - Clear structure: +20 points
 * - Strong reasoning shown: +15 points
 * - Concrete example provided: +10 points
 * - Resolves previous confusion: +15 points
 * - Demonstrates deeper application: +10 points
 *
 * The session accumulates these deltaPoints over multiple turns.
 * Session score grows from 0→800 over a typical 12-15 turn conversation.
 */
export function evaluateExplanation(
  userResponse: string
  // conversationHistory: Array<{ role: string; content: string }> might add later
): EvaluationResult {
  const analysis = analyzeResponse(userResponse);
  const breakdown = {
    clarityPts: 0,
    coherencePts: 0,
    examplePts: 0,
    contradictionResolutionPts: 0,
    depthPts: 0,
  };
  let feedback = "";

  // Clear, well-structured explanation: +20 points
  if (analysis.clarity >= 70 && analysis.completeness >= 60) {
    breakdown.clarityPts = 20;
    feedback += "Clear and well-structured explanation. ";
  }

  // Strong reasoning shown (not just length): +15 points
  if (analysis.coherence >= 75) {
    breakdown.coherencePts = 15;
    feedback += "Strong reasoning demonstrated. ";
  }

  // Concrete example provided: +10 points
  if (analysis.hasExamples) {
    breakdown.examplePts = 10;
    feedback += "Great use of examples. ";
  }

  // Resolves previous confusion: +15 points
  if (analysis.clarity >= 85 && analysis.completeness >= 80) {
    breakdown.contradictionResolutionPts = 15;
    feedback += "Excellent explanation that clears things up! ";
  }

  // Demonstrating deeper reasoning/application: +10 points
  if (
    analysis.clarity >= 85 &&
    analysis.completeness >= 85 &&
    analysis.hasExamples &&
    analysis.coherence >= 80
  ) {
    breakdown.depthPts = 10;
    feedback += "Outstanding depth of understanding! ";
  }

  const deltaPoints =
    breakdown.clarityPts +
    breakdown.coherencePts +
    breakdown.examplePts +
    breakdown.contradictionResolutionPts +
    breakdown.depthPts;

  return {
    deltaPoints,
    feedback: feedback.trim() || "Keep going!",
    breakdown,
  };
}

/**
 * Analyzes the quality of a user's response
 *
 * Evaluates:
 * - Clarity: Step-by-step structure, logical flow, explanations a beginner could follow
 * - Coherence: Reasoning signals (because, therefore, etc.) indicating thought quality
 * - Completeness: Depth and coverage of key concepts
 * - Examples: Whether concrete, relevant examples are provided
 *
 */
export function analyzeResponse(response: string): ResponseAnalysis {
  const wordCount = response.split(/\s+/).length;
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Check for examples
  const hasExamples =
    /for example|for instance|such as|like when|imagine|let'?s say|consider/i.test(
      response
    );

  // Check for reasoning indicators
  const hasBecause =
    /because|since|therefore|thus|so that|this means|as a result/i.test(
      response
    );
  const hasSteps = /first|second|then|next|finally|step|stage|phase/i.test(
    response
  );
  const hasComparison =
    /similar to|different from|compared to|unlike|whereas/i.test(response);

  let clarity = 0;
  clarity += hasSteps ? 35 : 0; // Steps are clearest signal
  clarity += sentences.length > 2 ? 25 : sentences.length * 10; // Multiple sentences show structure
  clarity += hasBecause ? 20 : 0; // Causal language helps clarity
  clarity += Math.min(20, Math.floor(wordCount / 3)); // ~3 words per clarity point, capped
  clarity = Math.min(100, clarity);

  // COHERENCE: reasoning quality based on signal words
  let coherence = 50; // Base level
  if (wordCount > 20 && hasBecause) coherence = 70;
  if (wordCount > 40 && hasBecause && (hasExamples || hasComparison))
    coherence = 85;
  if (hasSteps && hasBecause) coherence = Math.min(100, coherence + 15);

  let completeness = 0;
  completeness += Math.min(35, Math.floor(wordCount / 2)); // Coverage grows with depth
  completeness += hasExamples ? 30 : 0; // Examples = better coverage
  completeness += hasBecause ? 20 : 0; // Reasoning = more complete thought
  completeness += hasComparison ? 15 : 0; // Contrasts show nuance
  completeness = Math.min(100, completeness);

  return {
    clarity,
    coherence,
    completeness,
    hasExamples,
  };
}

/**
 * Returns the score category based on TOTAL ACCUMULATED session score
 * (not per-response points)
 *
 * Score ranges (0-800 scale):
 * 0–200:   Still learning – lots of growth ahead
 * 200–400: Basic understanding – getting clearer
 * 400–600: Solid understanding – teaching is working
 * 600–800: Strong mastery – could explain to others confidently
 */
export function getScoreCategory(totalScore: number): string {
  if (totalScore >= 600) return "Strong mastery";
  if (totalScore >= 400) return "Solid understanding";
  if (totalScore >= 200) return "Basic understanding";
  return "Still learning";
}

/**
 * Determines what type of question the duck should ask next
 *
 * Duck behavior:
 * - Acts as a curious student who wants to understand
 * - Never lectures or gives answers
 * - Asks questions when explanations are vague, incomplete, or skip steps
 * - Challenges inconsistencies with curiosity, not correction
 *
 * Note: Selection is deterministic based on response quality, not random.
 * This ensures consistent, reproducible grading.
 */
export function determineNextQuestionType(
  lastResponse: string,
  conversationHistory: Array<{ role: string; content: string }>,
  currentScore: number
): QuestionType {
  const analysis = analyzeResponse(lastResponse);

  // If explanation is vague or incomplete, ask for clarification
  if (analysis.clarity < 60 || analysis.completeness < 50) {
    return QuestionType.CLARIFYING;
  }

  // If no examples provided, ask for one
  if (!analysis.hasExamples) {
    return QuestionType.EXAMPLE_BASED;
  }

  // Check for potential contradictions in conversation history
  if (hasContradictions(conversationHistory)) {
    return QuestionType.CONSISTENCY_CHECK;
  }

  // If explanation is surface-level, prompt for deeper application
  if (analysis.completeness < 80 && currentScore < 400) {
    return QuestionType.APPLICATION;
  }

  // Challenge if explanation seems memorized rather than understood
  if (analysis.clarity < 75 && !analysis.hasExamples) {
    return QuestionType.CHALLENGE;
  }

  // Default to application to promote deeper thinking
  return QuestionType.APPLICATION;
}

/**
 * Checks if there are contradictions in the last 2 user messages
 * THIS ONE I NEED TO DOUBLE CHECK FOR ACCURACY
 */
function hasContradictions(
  history: Array<{ role: string; content: string }>
): boolean {
  const userMessages = history
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content.toLowerCase());

  // Need at least 2 user messages to compare
  if (userMessages.length < 2) return false;

  // Only compare the last 2 messages (not all pairs)
  const last = userMessages[userMessages.length - 1];
  const secondLast = userMessages[userMessages.length - 2];

  // Extract nouns/key terms (simple heuristic: words > 4 chars)
  const getKeywords = (text: string) =>
    new Set(text.split(/\s+/).filter((w) => w.length > 4));
  const lastKeywords = getKeywords(last);
  const secondLastKeywords = getKeywords(secondLast);

  // Check if they share keywords
  const overlap = Array.from(lastKeywords).filter((w) =>
    secondLastKeywords.has(w)
  );
  if (overlap.length === 0) return false; // Different topics, no contradiction possible

  // Now check for negation patterns on overlapping terms
  const contradictionPatterns = [
    { positive: /\bis\b/i, negative: /\bis not\b|\bisn't\b/i },
    { positive: /\bcan\b/i, negative: /\bcannot\b|\bcan't\b/i },
    { positive: /\bwill\b/i, negative: /\bwill not\b|\bwon't\b/i },
    { positive: /\balways\b/i, negative: /\bnever\b/i },
  ];

  for (const pattern of contradictionPatterns) {
    if (pattern.positive.test(secondLast) && pattern.negative.test(last)) {
      return true;
    }
    if (pattern.negative.test(secondLast) && pattern.positive.test(last)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates the percentage score for display (0-100%)
 */
export function calculatePercentageScore(totalScore: number): number {
  // Maximum score is 800, so convert to percentage
  return Math.min(100, Math.round((totalScore / 800) * 100));
}

/**
 * Gets a final assessment message based on the total accumulated session score
 * (0-800 scale)
 */
export function getFinalAssessment(sessionScore: number): string {
  const percentage = calculatePercentageScore(sessionScore);

  if (percentage >= 75) {
    return "Wow! You really know this topic well. Your explanations were clear, accurate, and full of great examples. I feel like I could teach this to someone else now!";
  } else if (percentage >= 50) {
    return "Great job! You have a solid understanding of this topic. With a bit more detail and examples, your explanations would be even stronger!";
  } else if (percentage >= 25) {
    return "Good start! You understand the basics, but there's room to go deeper. Try using more examples and explaining the 'why' behind concepts.";
  } else {
    return "Thanks for teaching me! I can tell you're learning this topic. Keep practicing explaining concepts in your own words and using examples!";
  }
}
