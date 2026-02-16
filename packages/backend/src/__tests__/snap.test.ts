import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import * as fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PromptRegistry, type LLMProvider } from "@aitourguide/mcp";
import type { LLMResponse, TTSResponse } from "@aitourguide/mcp";
import { createApp } from "../app.js";
import { setSnapDependencies } from "../routes/snap.js";
import { generateTokens } from "../lib/jwt.js";

const prisma = new PrismaClient();
const app = createApp();

// Track how many times vision was called (to test caching)
let visionCallCount = 0;
let completeCallCount = 0;

function createMockProvider(): LLMProvider {
  return {
    vision: async () => {
      visionCallCount++;
      return {
        content: JSON.stringify({
          schema: "landmark_identification.v1",
          landmarks: [
            {
              name: "Statue of Liberty",
              confidence: 0.92,
              location: {
                city: "New York",
                country: "USA",
                coordinates: { lat: 40.6892, lng: -74.0445 },
              },
              category: "monument",
              brief_description: "Iconic symbol of freedom in New York Harbor",
            },
          ],
          needs_clarification: false,
          clarification_message: null,
        }),
        model: "gpt-4o-mock",
        latencyMs: 100,
        usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
      };
    },
    complete: async () => {
      completeCallCount++;
      return {
        content: JSON.stringify({
          schema: "guide_content.v1",
          landmark_name: "Statue of Liberty",
          locale: "en",
          title: "Lady Liberty: Symbol of Freedom",
          summary:
            "The Statue of Liberty is a colossal neoclassical sculpture on Liberty Island.",
          facts: [
            {
              heading: "Gift from France",
              body: "France gave the statue to the United States in 1886 as a symbol of friendship.",
            },
            {
              heading: "Height",
              body: "The statue stands 93 meters (305 feet) tall from base to torch.",
            },
          ],
          narration_script:
            "Welcome to the magnificent Statue of Liberty! This colossal symbol of freedom...",
          fun_fact:
            "The statue's full name is Liberty Enlightening the World!",
          confidence_note: null,
        }),
        model: "gpt-4o-mock",
        latencyMs: 200,
        usage: {
          promptTokens: 400,
          completionTokens: 500,
          totalTokens: 900,
        },
      };
    },
    tts: async (): Promise<TTSResponse> => ({
      audioBuffer: Buffer.from("mock-audio"),
      model: "tts-1",
      latencyMs: 50,
    }),
  };
}

function createClarificationProvider(): LLMProvider {
  return {
    vision: async () => ({
      content: JSON.stringify({
        schema: "landmark_identification.v1",
        landmarks: [
          {
            name: "Tower Bridge",
            confidence: 0.45,
            location: { city: "London", country: "UK" },
            category: "building",
            brief_description: "Historic drawbridge",
          },
          {
            name: "London Bridge",
            confidence: 0.35,
            location: { city: "London", country: "UK" },
            category: "building",
            brief_description: "Bridge over the Thames",
          },
        ],
        needs_clarification: true,
        clarification_message: "Which bridge did you photograph?",
      }),
      model: "gpt-4o-mock",
      latencyMs: 80,
    }),
    complete: async (): Promise<LLMResponse> => ({
      content: "",
      model: "gpt-4o-mock",
      latencyMs: 0,
    }),
    tts: async (): Promise<TTSResponse> => ({
      audioBuffer: Buffer.from(""),
      model: "tts-1",
      latencyMs: 0,
    }),
  };
}

const SNAP_TEST_AUDIO_DIR = "./audio-cache-snap-test";

describe("[milestone-a] POST /snap", () => {
  let authToken: string;
  const registry = new PromptRegistry();

  beforeAll(async () => {
    process.env.TTS_AUDIO_DIR = SNAP_TEST_AUDIO_DIR;
    process.env.TTS_VOICE = "nova";
    registry.loadFromFilesystem();

    // Get a test user token
    const user = await prisma.user.findFirst({ where: { role: "end_user" } });
    authToken = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: "end_user",
    }).accessToken;

    // Clean up any test landmarks from previous runs
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Statue of Liberty" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Statue of Liberty" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Statue of Liberty" },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Statue of Liberty" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Statue of Liberty" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Statue of Liberty" },
    });
    if (fs.existsSync(SNAP_TEST_AUDIO_DIR)) {
      fs.rmSync(SNAP_TEST_AUDIO_DIR, { recursive: true, force: true });
    }
    await prisma.$disconnect();
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/snap").send({
      image_base64: "dGVzdA==",
    });
    expect(res.status).toBe(401);
  });

  it("validates request body", async () => {
    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns landmark + guide content on first request (cache miss)", async () => {
    visionCallCount = 0;
    completeCallCount = 0;

    setSnapDependencies({
      provider: createMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdC1pbWFnZQ==",
        locale: "en",
      });

    expect(res.status).toBe(200);
    expect(res.body.landmark).toBeDefined();
    expect(res.body.landmark.landmarks[0].name).toBe("Statue of Liberty");
    expect(res.body.guide).toBeDefined();
    expect(res.body.guide.title).toBe("Lady Liberty: Symbol of Freedom");
    expect(res.body.cached).toBe(false);
    expect(res.body.audio).toBeDefined();
    expect(res.body.audio.url).toMatch(/^\/audio\/.+/);
    expect(visionCallCount).toBe(1);
    expect(completeCallCount).toBe(1);
  });

  it("returns cached guide content on second request (cache hit)", async () => {
    visionCallCount = 0;
    completeCallCount = 0;

    setSnapDependencies({
      provider: createMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdC1pbWFnZQ==",
        locale: "en",
      });

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
    // Vision is still called (we always need to identify the landmark)
    expect(visionCallCount).toBe(1);
    // But text completion is NOT called (guide is cached)
    expect(completeCallCount).toBe(0);
  });

  it("returns clarification response when confidence is low", async () => {
    setSnapDependencies({
      provider: createClarificationProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdC1hbWJpZ3VvdXM=",
        locale: "en",
      });

    expect(res.status).toBe(200);
    expect(res.body.landmark.needs_clarification).toBe(true);
    expect(res.body.landmark.landmarks).toHaveLength(2);
    expect(res.body.guide).toBeNull();
    expect(res.body.audio).toBeNull();
  });

  it("includes GPS data when provided", async () => {
    setSnapDependencies({
      provider: createMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdA==",
        gps: { lat: 40.6892, lng: -74.0445 },
        locale: "en",
      });

    expect(res.status).toBe(200);
    expect(res.body.landmark).toBeDefined();
  });
});

