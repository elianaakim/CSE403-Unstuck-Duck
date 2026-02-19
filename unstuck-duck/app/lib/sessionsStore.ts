interface ConversationMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

export interface Session {
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

// In-memory store for sessions
const sessions = new Map<string, Session>();

export function getSessionsStore() {
  return sessions;
}
