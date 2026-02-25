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

const globalStore = global as typeof global & {
  sessions?: Map<string, Session>;
};

if (!globalStore.sessions) {
  globalStore.sessions = new Map<string, Session>();
}

export function getSessionsStore() {
  return globalStore.sessions!;
}
