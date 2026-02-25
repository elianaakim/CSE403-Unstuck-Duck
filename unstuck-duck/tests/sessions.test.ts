import { expect } from "chai";
import { describe, it } from "mocha";

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
  describe("POST /api/sessions/end", () => {
    let startPOST: any;
    let endPOST: any;

    before(async () => {
      ({ POST: endPOST } = await import("../app/api/sessions/end/route.js"));
      ({ POST: startPOST } =
        await import("../app/api/sessions/start/route.js"));
    });
    it("should end a session and return final score", async function () {
      this.timeout(15000);
      const request1 = new MockNextRequest(
        "http://localhost:3000/api/sessions/start",
        {
          method: "POST",
          body: JSON.stringify({ topic: "binary search trees" }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;

      const response1 = await startPOST(request1);
      expect(response1.status).to.equal(200);

      const text1 = await response1.text();
      const body1 = JSON.parse(text1);
      const sessionId = body1.sessionId;

      const request2 = new MockNextRequest(
        "http://localhost:3000/api/sessions/end",
        {
          method: "POST",
          body: JSON.stringify({ sessionId }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;

      const response2 = await endPOST(request2);
      expect(response2.status).to.equal(200);

      const text2 = await response2.text();
      const body2 = JSON.parse(text2);

      // Check for properties that are actually returned
      expect(body2).to.have.property("sessionId", sessionId);
      expect(body2).to.have.property("finalTeachingScore");
      expect(body2).to.have.property("duration");
      expect(body2).to.have.property("topic", "binary search trees");
      expect(body2).to.have.property("startTime");
      expect(body2).to.have.property("endTime");
      expect(body2).to.have.property("evaluationCount");

      const requestNoID = new MockNextRequest(
        "http://localhost:3000/api/sessions/end",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;

      const responseNoID = await endPOST(requestNoID);

      expect(responseNoID.status).to.equal(400);

      const bodyNoID = await responseNoID.json();
      expect(bodyNoID).to.have.property("error");
      expect(bodyNoID.error).to.equal("sessionId is required");

      const requestBadID = new MockNextRequest(
        "http://localhost:3000/api/sessions/end",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "not_a_valid_session_id" }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ) as any;

      const responseBadID = await endPOST(requestBadID);

      expect(responseBadID.status).to.equal(404);

      const bodyBadID = await responseBadID.json();
      expect(bodyBadID).to.have.property("error");
      expect(bodyBadID.error).to.equal("Session not found");
    });
  });
});
