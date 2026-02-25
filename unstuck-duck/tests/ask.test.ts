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

describe("API Routes", () => {
  describe("POST /api/sessions/start", () => {
    let POST: any;

    before(async () => {
      const routeModule = await import("../app/api/sessions/start/route.js");
      POST = routeModule.POST;
    });

    it("should create a new session with valid topic", async function () {
      this.timeout(15000);

      const request = new MockNextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({
            topic:
              "say QUACK as your first word, then talk binary search trees",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;

      const response = await POST(request);
      expect(response.status).to.equal(200);

      const body = await response.json();
      expect(body).to.have.property("sessionId");
      expect(body).to.have.property("duckQuestion");
      expect(body.duckQuestion).to.include("QUACK");
      expect(body.topic).to.equal(
        "say QUACK as your first word, then talk binary search trees"
      );
    });

    it("should reject empty or invalid topics", async function () {
      this.timeout(15000);

      const request1 = new MockNextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;
      const response1 = await POST(request1);
      expect(response1.status).to.equal(400);

      const request2 = new MockNextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({ topic: "" }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;
      const response2 = await POST(request2);
      expect(response2.status).to.equal(400);

      const request3 = new MockNextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({ topic: "   " }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;
      const response3 = await POST(request3);
      expect(response3.status).to.equal(400);
    });
  });
});
