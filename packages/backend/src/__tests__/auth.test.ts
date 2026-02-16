import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../app.js";
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/jwt.js";

const prisma = new PrismaClient();
const app = createApp();

describe("[milestone-a] JWT Utilities", () => {
  it("generates valid access and refresh tokens", () => {
    const tokens = generateTokens({
      userId: "test-id",
      email: "test@example.com",
      role: "end_user",
    });

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(typeof tokens.accessToken).toBe("string");
    expect(typeof tokens.refreshToken).toBe("string");
  });

  it("verifies a valid access token", () => {
    const tokens = generateTokens({
      userId: "test-id",
      email: "test@example.com",
      role: "admin",
    });

    const payload = verifyAccessToken(tokens.accessToken);
    expect(payload.userId).toBe("test-id");
    expect(payload.email).toBe("test@example.com");
    expect(payload.role).toBe("admin");
  });

  it("rejects an invalid access token", () => {
    expect(() => verifyAccessToken("invalid.token.here")).toThrow();
  });

  it("verifies a valid refresh token", () => {
    const tokens = generateTokens({
      userId: "test-id",
      email: "test@example.com",
      role: "end_user",
    });

    const result = verifyRefreshToken(tokens.refreshToken);
    expect(result.userId).toBe("test-id");
  });

  it("rejects using access token as refresh token", () => {
    const tokens = generateTokens({
      userId: "test-id",
      email: "test@example.com",
      role: "end_user",
    });

    // Access token doesn't have type: "refresh"
    expect(() => verifyRefreshToken(tokens.accessToken)).toThrow();
  });
});

describe("[milestone-a] Auth Middleware", () => {
  it("rejects requests without authorization header", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Missing");
  });

  it("rejects requests with invalid token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid");
  });

  it("accepts requests with valid token", async () => {
    // Get a real user from DB
    const user = await prisma.user.findFirst({
      where: { role: "admin" },
    });
    expect(user).not.toBeNull();

    const tokens = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: user!.role as "admin",
    });

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${tokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user!.email);
    expect(res.body.role).toBe("admin");
  });
});

describe("[milestone-a] Role-Based Access Control", () => {
  let adminToken: string;
  let userToken: string;
  let providerToken: string;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    const user = await prisma.user.findFirst({ where: { role: "end_user" } });
    const provider = await prisma.user.findFirst({
      where: { role: "ad_provider" },
    });

    adminToken = generateTokens({
      userId: admin!.id,
      email: admin!.email,
      role: "admin",
    }).accessToken;

    userToken = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: "end_user",
    }).accessToken;

    providerToken = generateTokens({
      userId: provider!.id,
      email: provider!.email,
      role: "ad_provider",
    }).accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("admin can access /auth/me", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");
  });

  it("end_user can access /auth/me", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("end_user");
  });

  it("ad_provider can access /auth/me", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("ad_provider");
  });
});

describe("[milestone-a] Dev Login Endpoint", () => {
  afterAll(async () => {
    // Clean up dev test user
    await prisma.user
      .deleteMany({
        where: { email: "devtest@aitourguide.dev" },
      })
      .catch(() => {
        /* ignore if doesn't exist */
      });
    await prisma.$disconnect();
  });

  it("creates a new user and returns tokens", async () => {
    const res = await request(app).post("/auth/dev-login").send({
      email: "devtest@aitourguide.dev",
      name: "Dev Test User",
      role: "end_user",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("devtest@aitourguide.dev");
    expect(res.body.user.role).toBe("end_user");
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    // Verify the access token works
    const meRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${res.body.accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("devtest@aitourguide.dev");
  });

  it("rejects request without email", async () => {
    const res = await request(app).post("/auth/dev-login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("email");
  });
});

describe("[milestone-a] Token Refresh", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("exchanges refresh token for new token pair", async () => {
    const user = await prisma.user.findFirst({ where: { role: "end_user" } });
    expect(user).not.toBeNull();

    const tokens = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: "end_user",
    });

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: tokens.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    // New access token should work
    const payload = verifyAccessToken(res.body.accessToken);
    expect(payload.userId).toBe(user!.id);
  });

  it("rejects invalid refresh token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "invalid-token" });
    expect(res.status).toBe(401);
  });
});

