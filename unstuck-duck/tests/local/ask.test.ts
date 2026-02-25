import { expect } from "chai";
import { describe, it, before } from "mocha";

// Mock NextRequest for testing
class MockNextRequest {
  private bodyText: string;

  constructor(
    public url: string,
    options: {
      method: string;
      body: string;
      headers: Record<string, string>;
    }
  ) {
    this.bodyText = options.body;
  }

  async json() {
    return JSON.parse(this.bodyText);
  }
}

describe("Testing Ask Route", () => {
  describe("POST /api/ask", () => {
    let askPOST: any;
    let startPOST: any;

    before(async () => {
      const askRouteModule = await import("../../app/api/ask/route.js");
      const startRouteModule =
        await import("../../app/api/sessions/start/route.js");
      askPOST = askRouteModule.POST;
      startPOST = startRouteModule.POST;
    });

    it("should generate a follow-up question with valid sessionId and userResponse", async function () {
      this.timeout(30000);

      // First create a session
      const startRequest = new MockNextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({ topic: "binary search trees" }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;

      const startResponse = await startPOST(startRequest);
      expect(startResponse.status).to.equal(200);

      const startBody = await startResponse.json();
      const sessionId = startBody.sessionId;

      // Now test the ask route
      const askRequest = new MockNextRequest("http://localhost:3000/api/ask", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          userResponse:
            "A binary search tree is a data structure where each node has at most two children",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any;

      const askResponse = await askPOST(askRequest);
      expect(askResponse.status).to.equal(200);

      const askBody = await askResponse.json();
      expect(askBody).to.have.property("sessionId", sessionId);
      expect(askBody).to.have.property("duckQuestion");
      expect(askBody.duckQuestion).to.be.a("string");
      expect(askBody).to.have.property("currentTeachingScore");
      expect(askBody).to.have.property("timestamp");
    });

    it("should reject missing sessionId", async function () {
      this.timeout(30000);

      const request = new MockNextRequest("http://localhost:3000/api/ask", {
        method: "POST",
        body: JSON.stringify({
          userResponse: "Some response",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any;

      const response = await askPOST(request);
      expect(response.status).to.equal(400);

      const body = await response.json();
      expect(body.error).to.include("sessionId");
    });

    it("should reject missing userResponse", async function () {
      this.timeout(30000);

      const request = new MockNextRequest("http://localhost:3000/api/ask", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "some-session-id",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any;

      const response = await askPOST(request);
      expect(response.status).to.equal(400);

      const body = await response.json();
      expect(body.error).to.include("userResponse");
    });

    it("should reject non-string userResponse", async function () {
      this.timeout(30000);

      const request = new MockNextRequest("http://localhost:3000/api/ask", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "some-session-id",
          userResponse: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any;

      const response = await askPOST(request);
      expect(response.status).to.equal(400);

      const body = await response.json();
      expect(body.error).to.include("string");
    });

    it("should reject invalid sessionId", async function () {
      this.timeout(30000);

      const request = new MockNextRequest("http://localhost:3000/api/ask", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "invalid-session-id",
          userResponse: "Some response",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any;

      const response = await askPOST(request);
      expect(response.status).to.equal(404);

      const body = await response.json();
      expect(body.error).to.equal("Session not found");
    });

    it("should handle multiple exchanges in sequence", async function () {
      this.timeout(30000);

      // Create a session
      const startRequest = new MockNextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({ topic: "recursion" }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;

      const startResponse = await startPOST(startRequest);
      const startBody = await startResponse.json();
      const sessionId = startBody.sessionId;

      // First exchange
      const ask1Request = new MockNextRequest("http://localhost:3000/api/ask", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          userResponse: "Recursion is when a function calls itself",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any;

      const ask1Response = await askPOST(ask1Request);
      expect(ask1Response.status).to.equal(200);

      const ask1Body = await ask1Response.json();
      expect(ask1Body).to.have.property("duckQuestion");

      // Second exchange
      const ask2Request = new MockNextRequest("http://localhost:3000/api/ask", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          userResponse: "It needs a base case to stop the recursion",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as any;

      const ask2Response = await askPOST(ask2Request);
      expect(ask2Response.status).to.equal(200);

      const ask2Body = await ask2Response.json();
      expect(ask2Body).to.have.property("duckQuestion");
      expect(ask2Body.sessionId).to.equal(sessionId);
    });
  });
});
