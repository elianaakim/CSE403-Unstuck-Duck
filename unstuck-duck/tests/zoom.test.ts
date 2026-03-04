import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import proxyquire from "proxyquire";
import sinon from "sinon";
import { NextRequest } from "next/server";

describe("POST /api/zoom", () => {
  let zoomPOST: any;
  let axiosPostStub: sinon.SinonStub;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set mock environment variables
    process.env.ZOOM_ACCOUNT_ID = "test-account-id";
    process.env.ZOOM_CLIENT_ID = "test-client-id";
    process.env.ZOOM_CLIENT_SECRET = "test-client-secret";

    // Mock axios.post
    axiosPostStub = sinon.stub();

    // Default successful responses
    // Token response
    axiosPostStub.onFirstCall().resolves({
      data: {
        access_token: "mock-access-token-12345",
        token_type: "bearer",
        expires_in: 3600,
      },
    });

    // Meeting creation response
    axiosPostStub.onSecondCall().resolves({
      data: {
        id: 123456789,
        join_url: "https://zoom.us/j/123456789?pwd=abc123",
        password: "abc123",
        start_url: "https://zoom.us/s/123456789",
        topic: "Scheduled Meeting",
      },
    });

    // Import the REAL route with mocked dependencies
    const module = proxyquire.noCallThru()("../app/api/zoom/route", {
      axios: {
        post: axiosPostStub,
        default: { post: axiosPostStub },
      },
    });

    zoomPOST = module.POST;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    sinon.restore();
  });

  it("should create Zoom meeting with default topic", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await zoomPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("join_url");
    expect(data).to.have.property("meeting_id", 123456789);
    expect(data).to.have.property("password", "abc123");
    expect(data.join_url).to.include("zoom.us");
  });

  it("should create Zoom meeting with custom topic", async () => {
    const customTopic = "Team Standup Meeting";

    const req = new NextRequest("http://localhost:3000/api/zoom", {
      method: "POST",
      body: JSON.stringify({ topic: customTopic }),
    });

    const response = await zoomPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("join_url");

    // Verify the meeting was created with custom topic
    const meetingCallArgs = axiosPostStub.secondCall.args;
    expect(meetingCallArgs[1]).to.have.property("topic", customTopic);
  });

  it("should request OAuth token with correct credentials", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await zoomPOST(req);

    // Verify token request
    expect(axiosPostStub.firstCall.args[0]).to.equal(
      "https://zoom.us/oauth/token"
    );

    const tokenRequestParams = axiosPostStub.firstCall.args[1];
    expect(tokenRequestParams.get("grant_type")).to.equal(
      "account_credentials"
    );
    expect(tokenRequestParams.get("account_id")).to.equal("test-account-id");

    const authHeader = axiosPostStub.firstCall.args[2].headers.Authorization;
    expect(authHeader).to.match(/^Basic /);
  });

  it("should create meeting with correct settings", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom", {
      method: "POST",
      body: JSON.stringify({ topic: "Test Meeting" }),
    });

    await zoomPOST(req);

    const meetingPayload = axiosPostStub.secondCall.args[1];

    expect(meetingPayload.type).to.equal(2); // Scheduled meeting
    expect(meetingPayload.duration).to.equal(30);
    expect(meetingPayload.settings.host_video).to.be.true;
    expect(meetingPayload.settings.participant_video).to.be.true;
    expect(meetingPayload.settings.join_before_host).to.be.true;
    expect(meetingPayload.settings.waiting_room).to.be.false;
  });

  it("should use access token for meeting creation", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await zoomPOST(req);

    const meetingRequestHeaders = axiosPostStub.secondCall.args[2].headers;
    expect(meetingRequestHeaders.Authorization).to.equal(
      "Bearer mock-access-token-12345"
    );
  });

  it("should handle request without body", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom", {
      method: "POST",
    });

    const response = await zoomPOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("join_url");

    // Should use default topic
    const meetingPayload = axiosPostStub.secondCall.args[1];
    expect(meetingPayload.topic).to.equal("Scheduled Meeting");
  });

  it("should handle invalid JSON body gracefully", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json{",
    });

    const response = await zoomPOST(req);
    const data = await response.json();

    // Should still succeed with default topic
    expect(response.status).to.equal(200);
    expect(data).to.have.property("join_url");
  });

  describe("Error Handling", () => {
    it("should handle OAuth token request failure", async () => {
      axiosPostStub.onFirstCall().rejects({
        response: {
          data: { error: "invalid_client" },
        },
        message: "Request failed with status code 401",
      });

      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await zoomPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data).to.have.property("error", "Failed to create Zoom meeting");
      expect(data).to.have.property("details");
    });

    it("should handle meeting creation failure", async () => {
      axiosPostStub.onSecondCall().rejects({
        response: {
          data: {
            code: 3001,
            message: "Meeting does not exist",
          },
        },
        message: "Meeting creation failed",
      });

      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({ topic: "Test" }),
      });

      const response = await zoomPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data.error).to.equal("Failed to create Zoom meeting");
    });

    it("should handle network errors", async () => {
      axiosPostStub.onFirstCall().rejects({
        message: "Network Error",
      });

      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await zoomPOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data.details).to.include("Network Error");
    });

    it("should handle missing environment variables", async () => {
      delete process.env.ZOOM_CLIENT_ID;
      delete process.env.ZOOM_CLIENT_SECRET;
      delete process.env.ZOOM_ACCOUNT_ID;

      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // Should attempt the request with empty values
      await zoomPOST(req);

      // Verify it still tries to encode credentials (though empty)
      const authHeader = axiosPostStub.firstCall.args[2].headers.Authorization;
      expect(authHeader).to.exist;
    });
  });

  describe("Meeting Configuration", () => {
    it("should set start_time to current time", async () => {
      const beforeRequest = new Date();

      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      await zoomPOST(req);

      const afterRequest = new Date();
      const meetingPayload = axiosPostStub.secondCall.args[1];
      const startTime = new Date(meetingPayload.start_time);

      expect(startTime.getTime()).to.be.at.least(beforeRequest.getTime());
      expect(startTime.getTime()).to.be.at.most(afterRequest.getTime());
    });

    it("should set timezone from system", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      await zoomPOST(req);

      const meetingPayload = axiosPostStub.secondCall.args[1];
      const expectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      expect(meetingPayload.timezone).to.equal(expectedTimezone);
    });

    it("should create meeting as type 2 (scheduled)", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      await zoomPOST(req);

      const meetingPayload = axiosPostStub.secondCall.args[1];
      expect(meetingPayload.type).to.equal(2);
    });

    it("should set 30-minute duration", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      await zoomPOST(req);

      const meetingPayload = axiosPostStub.secondCall.args[1];
      expect(meetingPayload.duration).to.equal(30);
    });
  });

  describe("Response Format", () => {
    it("should return all required fields", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await zoomPOST(req);
      const data = await response.json();

      expect(data).to.have.all.keys("join_url", "meeting_id", "password");
    });

    it("should return correct meeting_id format", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await zoomPOST(req);
      const data = await response.json();

      expect(data.meeting_id).to.be.a("number");
    });

    it("should return valid join_url", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await zoomPOST(req);
      const data = await response.json();

      expect(data.join_url).to.be.a("string");
      expect(data.join_url).to.match(/^https:\/\/zoom\.us\//);
    });
  });

  describe("API Endpoints", () => {
    it("should call correct Zoom OAuth endpoint", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      await zoomPOST(req);

      expect(axiosPostStub.firstCall.args[0]).to.equal(
        "https://zoom.us/oauth/token"
      );
    });

    it("should call correct Zoom meetings endpoint", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom", {
        method: "POST",
        body: JSON.stringify({}),
      });

      await zoomPOST(req);

      expect(axiosPostStub.secondCall.args[0]).to.equal(
        "https://api.zoom.us/v2/users/me/meetings"
      );
    });
  });
});
