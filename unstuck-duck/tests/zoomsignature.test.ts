import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import proxyquire from "proxyquire";
import sinon from "sinon";
import { NextRequest } from "next/server";

describe("POST /api/zoom/signature", () => {
  let signaturePOST: any;
  let jwtSignStub: sinon.SinonStub;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set mock environment variables
    process.env.ZOOM_SDK_CLIENT_ID = "test-sdk-client-id";
    process.env.ZOOM_SDK_CLIENT_SECRET = "test-sdk-client-secret";

    // Mock jwt.sign
    jwtSignStub = sinon.stub().returns("mock-jwt-signature-token");

    // Import the REAL route with mocked dependencies
    const module = proxyquire.noCallThru()("../app/api/zoom/signature/route", {
      jsonwebtoken: {
        sign: jwtSignStub,
      },
    });

    signaturePOST = module.POST;
  });

  afterEach(() => {
    process.env = originalEnv;
    sinon.restore();
  });

  it("should generate signature for valid meeting number", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "123456789",
        role: 0,
      }),
    });

    const response = await signaturePOST(req);
    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.have.property("signature", "mock-jwt-signature-token");
    expect(data).to.have.property("sdkKey", "test-sdk-client-id");
  });

  it("should default role to 0 when not provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "123456789",
      }),
    });

    await signaturePOST(req);

    const payload = jwtSignStub.firstCall.args[0];
    expect(payload.role).to.equal(0);
  });

  it("should use provided role", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "123456789",
        role: 1, // Host role
      }),
    });

    await signaturePOST(req);

    const payload = jwtSignStub.firstCall.args[0];
    expect(payload.role).to.equal(1);
  });

  it("should create JWT payload with correct structure", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "987654321",
        role: 0,
      }),
    });

    await signaturePOST(req);

    const payload = jwtSignStub.firstCall.args[0];

    expect(payload).to.have.property("sdkKey", "test-sdk-client-id");
    expect(payload).to.have.property("mn", "987654321");
    expect(payload).to.have.property("role", 0);
    expect(payload).to.have.property("iat");
    expect(payload).to.have.property("exp");
    expect(payload).to.have.property("tokenExp");
  });

  it("should set iat to 30 seconds in the past", async () => {
    const beforeRequest = Math.round(Date.now() / 1000);

    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "123456789",
      }),
    });

    await signaturePOST(req);

    const afterRequest = Math.round(Date.now() / 1000);
    const payload = jwtSignStub.firstCall.args[0];

    // iat should be approximately 30 seconds before now
    expect(payload.iat).to.be.closeTo(beforeRequest - 30, 2);
    expect(payload.iat).to.be.at.most(afterRequest - 30);
  });

  it("should set exp to 2 hours after iat", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "123456789",
      }),
    });

    await signaturePOST(req);

    const payload = jwtSignStub.firstCall.args[0];

    const expectedExp = payload.iat + 60 * 60 * 2; // 2 hours
    expect(payload.exp).to.equal(expectedExp);
  });

  it("should set tokenExp equal to exp", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "123456789",
      }),
    });

    await signaturePOST(req);

    const payload = jwtSignStub.firstCall.args[0];

    expect(payload.tokenExp).to.equal(payload.exp);
  });

  it("should sign JWT with SDK secret", async () => {
    const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
      method: "POST",
      body: JSON.stringify({
        meetingNumber: "123456789",
      }),
    });

    await signaturePOST(req);

    const secret = jwtSignStub.firstCall.args[1];
    expect(secret).to.equal("test-sdk-client-secret");
  });

  describe("Validation", () => {
    it("should reject missing meetingNumber", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          role: 0,
        }),
      });

      const response = await signaturePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(400);
      expect(data).to.have.property("error", "meetingNumber is required.");
    });

    it("should reject empty meetingNumber", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "",
        }),
      });

      const response = await signaturePOST(req);

      expect(response.status).to.equal(400);
    });

    it("should reject request without body", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await signaturePOST(req);

      expect(response.status).to.equal(400);
    });
  });

  describe("Environment Variables", () => {
    it("should reject when SDK client ID is missing", async () => {
      delete process.env.ZOOM_SDK_CLIENT_ID;

      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data.error).to.equal(
        "Zoom SDK credentials are not configured on the server."
      );
    });

    it("should reject when SDK client secret is missing", async () => {
      delete process.env.ZOOM_SDK_CLIENT_SECRET;

      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data.error).to.equal(
        "Zoom SDK credentials are not configured on the server."
      );
    });

    it("should reject when both credentials are missing", async () => {
      delete process.env.ZOOM_SDK_CLIENT_ID;
      delete process.env.ZOOM_SDK_CLIENT_SECRET;

      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);

      expect(response.status).to.equal(500);
    });

    it("should reject when credentials are empty strings", async () => {
      process.env.ZOOM_SDK_CLIENT_ID = "";
      process.env.ZOOM_SDK_CLIENT_SECRET = "";

      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);

      expect(response.status).to.equal(500);
    });
  });

  describe("Error Handling", () => {
    it("should handle JWT signing errors", async () => {
      jwtSignStub.throws(new Error("JWT signing failed"));

      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);
      const data = await response.json();

      expect(response.status).to.equal(500);
      expect(data.error).to.equal("Failed to generate Zoom signature");
      expect(data.details).to.equal("JWT signing failed");
    });

    it("should handle invalid JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      const response = await signaturePOST(req);

      expect(response.status).to.equal(500);
    });
  });

  describe("Role Values", () => {
    it("should handle attendee role (0)", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
          role: 0,
        }),
      });

      await signaturePOST(req);

      const payload = jwtSignStub.firstCall.args[0];
      expect(payload.role).to.equal(0);
    });

    it("should handle host role (1)", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
          role: 1,
        }),
      });

      await signaturePOST(req);

      const payload = jwtSignStub.firstCall.args[0];
      expect(payload.role).to.equal(1);
    });
  });

  describe("Meeting Number Formats", () => {
    it("should handle numeric string meeting number", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);

      expect(response.status).to.equal(200);

      const payload = jwtSignStub.firstCall.args[0];
      expect(payload.mn).to.equal("123456789");
    });

    it("should handle meeting number with spaces", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123 456 789",
        }),
      });

      const response = await signaturePOST(req);

      expect(response.status).to.equal(200);

      const payload = jwtSignStub.firstCall.args[0];
      expect(payload.mn).to.equal("123 456 789");
    });
  });

  describe("Response Format", () => {
    it("should return signature and sdkKey", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);
      const data = await response.json();

      expect(data).to.have.all.keys("signature", "sdkKey");
    });

    it("should return string signature", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      const response = await signaturePOST(req);
      const data = await response.json();

      expect(data.signature).to.be.a("string");
    });
  });

  describe("Token Expiration", () => {
    it("should create token valid for 2 hours", async () => {
      const req = new NextRequest("http://localhost:3000/api/zoom/signature", {
        method: "POST",
        body: JSON.stringify({
          meetingNumber: "123456789",
        }),
      });

      await signaturePOST(req);

      const payload = jwtSignStub.firstCall.args[0];

      const twoHoursInSeconds = 2 * 60 * 60;
      const actualDuration = payload.exp - payload.iat;

      expect(actualDuration).to.equal(twoHoursInSeconds);
    });
  });
});
