import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import proxyquire from "proxyquire";
import sinon from "sinon";
import { NextRequest } from "next/server";

describe("POST /api/zoom/room", () => {
  let roomPOST: any;
  let axiosPostStub: sinon.SinonStub;
  let mockSupabaseClient: any;
  let createClientStub: sinon.SinonStub;
  let originalEnv: NodeJS.ProcessEnv;

  const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_KEY = "test-service-key";
    process.env.ZOOM_ACCOUNT_ID = "test-account-id";
    process.env.ZOOM_CLIENT_ID = "test-client-id";
    process.env.ZOOM_CLIENT_SECRET = "test-client-secret";

    // Mock Supabase client
    mockSupabaseClient = {
      from: sinon.stub().returnsThis(),
      select: sinon.stub().returnsThis(),
      eq: sinon.stub().returnsThis(),
      maybeSingle: sinon.stub().resolves({ data: null, error: null }),
      upsert: sinon.stub().resolves({ data: null, error: null }),
    };

    createClientStub = sinon.stub().returns(mockSupabaseClient);

    // Mock axios.post
    axiosPostStub = sinon.stub();

    // Default OAuth token response
    axiosPostStub.onFirstCall().resolves({
      data: {
        access_token: "mock-access-token-12345",
        token_type: "bearer",
        expires_in: 3600,
      },
    });

    // Default meeting creation response
    axiosPostStub.onSecondCall().resolves({
      data: {
        id: 987654321,
        join_url: "https://zoom.us/j/987654321?pwd=xyz789",
        password: "xyz789",
        topic: "Test Topic",
      },
    });

    // Import the REAL route with mocked dependencies
    const module = proxyquire.noCallThru()("../app/api/zoom/room/route", {
      axios: {
        post: axiosPostStub,
        default: { post: axiosPostStub },
      },
      "@supabase/supabase-js": {
        createClient: createClientStub,
      },
    });

    roomPOST = module.POST;
  });

  afterEach(() => {
    process.env = originalEnv;
    sinon.restore();
  });

  it("should create new room when none exists", async () => {
    // No existing room
    mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

    const req = new NextRequest("http://localhost:3000/api/zoom/room", {
      method: "POST",
      body: JSON.stringify({ topic: "Math Study Group" }),
    });

    const response = await roomPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("join_url");
    expect(data).to.have.property("meeting_id", "987654321");
    expect(data).to.have.property("password", "xyz789");
    expect(data).to.have.property("reused", false);
  });

  it("should reuse existing fresh room", async () => {
    // Existing room created 10 minutes ago (fresh)
    const freshCreatedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    mockSupabaseClient.maybeSingle.resolves({
      data: {
        topic: "Math Study Group",
        meeting_id: "111222333",
        join_url: "https://zoom.us/j/111222333?pwd=abc123",
        password: "abc123",
        created_at: freshCreatedAt,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/zoom/room", {
      method: "POST",
      body: JSON.stringify({ topic: "Math Study Group" }),
    });

    const response = await roomPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data.join_url).to.equal("https://zoom.us/j/111222333?pwd=abc123");
    expect(data.meeting_id).to.equal("111222333");
    expect(data.password).to.equal("abc123");
    expect(data.reused).to.be.true;

    // Should NOT create new Zoom meeting
    expect(axiosPostStub.callCount).to.equal(0);
  });

  it("should create new room when existing room is stale", async () => {
    // Existing room created 35 minutes ago (stale - past 30 min TTL)
    const staleCreatedAt = new Date(Date.now() - 35 * 60 * 1000).toISOString();

    mockSupabaseClient.maybeSingle.resolves({
      data: {
        topic: "Math Study Group",
        meeting_id: "old-meeting-id",
        join_url: "https://zoom.us/j/old",
        password: "old-pass",
        created_at: staleCreatedAt,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/zoom/room", {
      method: "POST",
      body: JSON.stringify({ topic: "Math Study Group" }),
    });

    const response = await roomPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data.meeting_id).to.equal("987654321"); // New meeting
    expect(data.reused).to.be.false;

    // Should create new Zoom meeting
    expect(axiosPostStub.callCount).to.equal(2); // Token + Meeting
  });

  it("should upsert room to database", async () => {
    mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

    const req = new NextRequest("http://localhost:3000/api/zoom/room", {
      method: "POST",
      body: JSON.stringify({ topic: "Science Class" }),
    });

    await roomPOST(req);

    expect(mockSupabaseClient.from.calledWith("zoom_rooms")).to.be.true;
    expect(mockSupabaseClient.upsert.calledOnce).to.be.true;

    const upsertArgs = mockSupabaseClient.upsert.firstCall.args;
    expect(upsertArgs[0]).to.have.property("topic", "Science Class");
    expect(upsertArgs[0]).to.have.property("meeting_id", "987654321");
    expect(upsertArgs[0]).to.have.property(
      "join_url",
      "https://zoom.us/j/987654321?pwd=xyz789"
    );
    expect(upsertArgs[0]).to.have.property("password", "xyz789");
    expect(upsertArgs[1]).to.deep.equal({ onConflict: "topic" });
  });

  it("should trim topic whitespace", async () => {
    mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

    const req = new NextRequest("http://localhost:3000/api/zoom/room", {
      method: "POST",
      body: JSON.stringify({ topic: "  Math Class  " }),
    });

    await roomPOST(req);

    // Should query with trimmed topic
    expect(mockSupabaseClient.eq.calledWith("topic", "Math Class")).to.be.true;
  });

  describe("Validation", () => {
    it("should reject missing topic", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data).to.have.property("error", "A topic is required.");
    });

    it("should reject empty topic", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "" }),
      });

      const response = await roomPOST(req);

      expect(response.status).to.equal(400);
    });

    it("should reject whitespace-only topic", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "   " }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data.error).to.equal("A topic is required.");
    });
  });

  describe("TTL Logic", () => {
    it("should reuse room at 29 minutes (just before TTL)", async () => {
      const almostStaleCreatedAt = new Date(
        Date.now() - 29 * 60 * 1000
      ).toISOString();

      mockSupabaseClient.maybeSingle.resolves({
        data: {
          topic: "Test",
          meeting_id: "fresh-id",
          join_url: "https://zoom.us/j/fresh",
          password: "fresh-pass",
          created_at: almostStaleCreatedAt,
        },
        error: null,
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(data.reused).to.be.true;
    });

    it("should create new room at 31 minutes (just past TTL)", async () => {
      const staleCreatedAt = new Date(
        Date.now() - 31 * 60 * 1000
      ).toISOString();

      mockSupabaseClient.maybeSingle.resolves({
        data: {
          topic: "Test",
          meeting_id: "stale-id",
          join_url: "https://zoom.us/j/stale",
          password: "stale-pass",
          created_at: staleCreatedAt,
        },
        error: null,
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(data.reused).to.be.false;
    });
  });

  describe("Error Handling", () => {
    it("should handle database select error", async () => {
      mockSupabaseClient.maybeSingle.resolves({
        data: null,
        error: { message: "Database connection failed" },
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data).to.have.property("error", "Database error");
    });

    it("should handle OAuth token error", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      axiosPostStub.onFirstCall().rejects({
        response: { data: { error: "invalid_client" } },
        message: "OAuth failed",
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data.error).to.equal("Failed to get/create Zoom room");
    });

    it("should handle Zoom meeting creation error", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      axiosPostStub.onSecondCall().rejects({
        response: { data: { message: "Invalid request" } },
        message: "Meeting creation failed",
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);

      expect(response.status).to.equal(500);
    });

    it("should succeed even if upsert fails", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });
      mockSupabaseClient.upsert.resolves({
        data: null,
        error: { message: "Upsert failed" },
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);

      // Should still return success (upsert error is logged but not fatal)
      expect(response.status).to.equal(200);
    });
  });

  describe("Zoom API Integration", () => {
    it("should create meeting with correct topic", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      const customTopic = "Biology Study Session";

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: customTopic }),
      });

      await roomPOST(req);

      const meetingPayload = axiosPostStub.secondCall.args[1];
      expect(meetingPayload.topic).to.equal(customTopic);
    });

    it("should use Pacific timezone", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      await roomPOST(req);

      const meetingPayload = axiosPostStub.secondCall.args[1];
      expect(meetingPayload.timezone).to.equal("America/Los_Angeles");
    });

    it("should handle meeting without password", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      axiosPostStub.onSecondCall().resolves({
        data: {
          id: 123456789,
          join_url: "https://zoom.us/j/123456789",
          password: undefined, // No password
          topic: "Test",
        },
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(data.password).to.be.null;
    });
  });

  describe("Response Format", () => {
    it("should return all required fields for new room", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(data).to.have.all.keys(
        "join_url",
        "meeting_id",
        "password",
        "reused"
      );
    });

    it("should return all required fields for reused room", async () => {
      mockSupabaseClient.maybeSingle.resolves({
        data: {
          topic: "Test",
          meeting_id: "123",
          join_url: "https://zoom.us/j/123",
          password: "pass",
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await roomPOST(req);
      const data = await response.json();

      expect(data).to.have.all.keys(
        "join_url",
        "meeting_id",
        "password",
        "reused"
      );
    });
  });

  describe("Database Operations", () => {
    it("should query zoom_rooms table", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      await roomPOST(req);

      expect(mockSupabaseClient.from.calledWith("zoom_rooms")).to.be.true;
    });

    it("should select all required columns", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      await roomPOST(req);

      expect(
        mockSupabaseClient.select.calledWith(
          "topic, meeting_id, join_url, password, created_at"
        )
      ).to.be.true;
    });

    it("should filter by topic", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Physics 101" }),
      });

      await roomPOST(req);

      expect(mockSupabaseClient.eq.calledWith("topic", "Physics 101")).to.be
        .true;
    });
  });

  describe("Environment Variables", () => {
    it("should use Supabase URL and service key", async () => {
      mockSupabaseClient.maybeSingle.resolves({ data: null, error: null });

      const req = new NextRequest("http://localhost:3000/api/zoom/room", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      await roomPOST(req);

      expect(createClientStub.calledOnce).to.be.true;
      expect(createClientStub.firstCall.args[0]).to.equal(
        "https://test.supabase.co"
      );
      expect(createClientStub.firstCall.args[1]).to.equal("test-service-key");
    });
  });
});
