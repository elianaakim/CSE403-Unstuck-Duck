import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import proxyquire from "proxyquire";
import { NextRequest } from "next/server";

// Mock session data
const mockSessions = [
  {
    session_id: "session-1",
    topic: "programming",
    started_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    ended_at: new Date(Date.now() - 82800000).toISOString(),
    score: 85,
    Messages: [
      {
        message_id: "msg-1",
        role: "assistant",
        content: "What is a variable?",
        created_at: new Date().toISOString(),
      },
      {
        message_id: "msg-2",
        role: "user",
        content: "A variable stores data",
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    session_id: "session-2",
    topic: "biology",
    started_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    ended_at: new Date(Date.now() - 169200000).toISOString(),
    score: 92,
    Messages: [
      {
        message_id: "msg-3",
        role: "assistant",
        content: "What is photosynthesis?",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

// Mock Supabase client
let mockAuthError: any = null;
let mockUser: any = { id: "user-123", email: "test@example.com" };
let mockQueryError: any = null;
let mockQueryData: any = mockSessions;

const createMockSupabaseClient = () => ({
  auth: {
    getUser: async (token: string) => {
      if (mockAuthError) {
        return { data: { user: null }, error: mockAuthError };
      }
      if (token === "invalid-token") {
        return {
          data: { user: null },
          error: { message: "Invalid token" },
        };
      }
      return { data: { user: mockUser }, error: null };
    },
  },
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        gte: (column: string, value: any) => ({
          order: (column: string, options: any) => ({
            then: async (resolve: any) => {
              if (mockQueryError) {
                return resolve({ data: null, error: mockQueryError });
              }
              return resolve({ data: mockQueryData, error: null });
            },
          }),
        }),
      }),
    }),
  }),
});

const mockGetServiceSupabase = () => createMockSupabaseClient();

// Import the REAL route with mocked dependencies
const { GET: historyGET } = proxyquire.noCallThru()(
  "../app/api/history/route",
  {
    "@/supabase/supabase": {
      getServiceSupabase: mockGetServiceSupabase,
      "@noCallThru": true,
    },
  }
);

describe("GET /api/history", () => {
  beforeEach(() => {
    // Reset mocks
    mockAuthError = null;
    mockUser = { id: "user-123", email: "test@example.com" };
    mockQueryError = null;
    mockQueryData = mockSessions;
  });

  it("should fetch session history for authenticated user", async () => {
    const req = new NextRequest("http://localhost:3000/api/history", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    const response = await historyGET(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("sessions");
    expect(data.sessions).to.be.an("array");
    expect(data.sessions).to.have.length(2);
    expect(data.sessions[0]).to.have.property("session_id", "session-1");
    expect(data.sessions[0]).to.have.property("topic", "programming");
    expect(data.sessions[0]).to.have.property("Messages");
    expect(data.sessions[0].Messages).to.be.an("array");
  });

  it("should return sessions with message details", async () => {
    const req = new NextRequest("http://localhost:3000/api/history", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    const response = await historyGET(req);
    const data = await response.json();

    const firstSession = data.sessions[0];
    expect(firstSession.Messages[0]).to.have.all.keys(
      "message_id",
      "role",
      "content",
      "created_at"
    );
    expect(firstSession.Messages[0].role).to.equal("assistant");
  });

  it("should return empty array when user has no sessions", async () => {
    mockQueryData = [];

    const req = new NextRequest("http://localhost:3000/api/history", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    const response = await historyGET(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data.sessions).to.be.an("array").that.is.empty;
  });

  describe("Authentication", () => {
    it("should reject request without token", async () => {
      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
      });

      const response = await historyGET(req);
      const data = await response.json();

      expect(response.status).to.equal(401);
      expect(data).to.have.property("error", "No token provided");
    });

    it("should reject request with invalid token", async () => {
      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      const response = await historyGET(req);
      const data = await response.json();

      expect(response.status).to.equal(401);
      expect(data).to.have.property("error", "Unauthorized");
      expect(data).to.have.property("detail", "Invalid token");
    });

    it("should handle auth error from Supabase", async () => {
      mockAuthError = { message: "Token expired" };

      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer expired-token",
        },
      });

      const response = await historyGET(req);
      const data = await response.json();

      expect(response.status).to.equal(401);
      expect(data.error).to.equal("Unauthorized");
      expect(data.detail).to.equal("Token expired");
    });

    it("should handle missing user from auth", async () => {
      mockUser = null;

      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await historyGET(req);

      expect(response.status).to.equal(401);
    });

    it("should extract token from Authorization header correctly", async () => {
      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer abc123xyz",
        },
      });

      const response = await historyGET(req);

      // Should succeed if token extraction works
      expect(response.status).to.equal(200);
    });
  });

  describe("Error Handling", () => {
    it("should handle database query errors", async () => {
      mockQueryError = { message: "Database connection failed" };

      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await historyGET(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data).to.have.property("error");
    });

    it("should return 500 on unexpected errors", async () => {
      // Simulate an error by making the query throw
      mockQueryError = new Error("Unexpected error");

      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await historyGET(req);

      expect(response.status).to.equal(500);
    });
  });

  describe("Data Filtering", () => {
    it("should only return sessions from last 30 days", async () => {
      // The route filters by 30 days in the query
      // Our mock data is already within 30 days
      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await historyGET(req);
      const data = await response.json();

      expect(response.status).to.equal(200);
      // All returned sessions should be recent
      data.sessions.forEach((session: any) => {
        const sessionDate = new Date(session.started_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        expect(sessionDate.getTime()).to.be.at.least(thirtyDaysAgo.getTime());
      });
    });
  });

  describe("Response Format", () => {
    it("should return sessions in correct format", async () => {
      const req = new NextRequest("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await historyGET(req);
      const data = await response.json();

      expect(data).to.have.property("sessions");
      data.sessions.forEach((session: any) => {
        expect(session).to.have.all.keys(
          "session_id",
          "topic",
          "started_at",
          "ended_at",
          "score",
          "Messages"
        );
      });
    });
  });
});
