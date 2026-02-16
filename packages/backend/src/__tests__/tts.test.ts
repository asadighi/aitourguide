import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import request from "supertest";
import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PromptRegistry, type LLMProvider } from "@aitourguide/mcp";
import type { LLMResponse, TTSResponse } from "@aitourguide/mcp";
import { createApp } from "../app.js";
import { setSnapDependencies } from "../routes/snap.js";
import { generateTokens } from "../lib/jwt.js";

const prisma = new PrismaClient();
const app = createApp();

const TEST_AUDIO_DIR = "./audio-cache-test";

let ttsCallCount = 0;

function createMockProvider(): LLMProvider {
  return {
    vision: async () => ({
      content: JSON.stringify({
        schema: "landmark_identification.v1",
        landmarks: [
          {
            name: "Big Ben",
            confidence: 0.95,
            location: {
              city: "London",
              country: "UK",
              coordinates: { lat: 51.5007, lng: -0.1246 },
            },
            category: "monument",
            brief_description: "Famous clock tower in London",
          },
        ],
        needs_clarification: false,
        clarification_message: null,
      }),
      model: "gpt-4o-mock",
      latencyMs: 100,
      usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
    }),
    complete: async () => ({
      content: JSON.stringify({
        schema: "guide_content.v1",
        landmark_name: "Big Ben",
        locale: "en",
        title: "Big Ben: The Great Bell",
        summary:
          "Big Ben is the nickname for the Great Bell of the striking clock.",
        facts: [
          {
            heading: "Not the tower",
            body: "Big Ben is actually the name of the bell, not the tower.",
          },
        ],
        narration_script:
          "Welcome to Big Ben! Standing tall over the Houses of Parliament, this iconic clock tower has been keeping time since 1859.",
        fun_fact: "The tower was renamed Elizabeth Tower in 2012!",
        confidence_note: null,
      }),
      model: "gpt-4o-mock",
      latencyMs: 200,
      usage: { promptTokens: 400, completionTokens: 500, totalTokens: 900 },
    }),
    tts: async (params): Promise<TTSResponse> => {
      ttsCallCount++;
      // Return a small valid-looking audio buffer
      const content = `mock-audio-for-${params.text?.slice(0, 20)}`;
      return {
        audioBuffer: Buffer.from(content),
        model: params.model || "tts-1",
        latencyMs: 300,
      };
    },
  };
}

describe("[milestone-b] TTS caching integration", () => {
  let authToken: string;
  const registry = new PromptRegistry();

  beforeAll(async () => {
    // Set TTS audio dir for tests
    process.env.TTS_AUDIO_DIR = TEST_AUDIO_DIR;
    process.env.TTS_VOICE = "nova";

    registry.loadFromFilesystem();

    // Get a test user token
    const user = await prisma.user.findFirst({ where: { role: "end_user" } });
    authToken = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: "end_user",
    }).accessToken;
  });

  beforeEach(async () => {
    ttsCallCount = 0;

    // Clean up test data
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Big Ben" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Big Ben" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Big Ben" },
    });

    // Clean up test audio files
    if (fs.existsSync(TEST_AUDIO_DIR)) {
      for (const file of fs.readdirSync(TEST_AUDIO_DIR)) {
        fs.unlinkSync(path.join(TEST_AUDIO_DIR, file));
      }
    }
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Big Ben" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Big Ben" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Big Ben" },
    });

    // Remove test audio directory
    if (fs.existsSync(TEST_AUDIO_DIR)) {
      fs.rmSync(TEST_AUDIO_DIR, { recursive: true, force: true });
    }

    await prisma.$disconnect();
  });

  it("generates TTS audio on first snap and returns audio info", async () => {
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
    expect(res.body.audio).toBeDefined();
    expect(res.body.audio).not.toBeNull();
    expect(res.body.audio.audioId).toBeDefined();
    expect(res.body.audio.url).toMatch(/^\/audio\/.+/);
    expect(res.body.audio.cached).toBe(false);
    expect(res.body.audio.voice).toBe("nova");
    expect(ttsCallCount).toBe(1);
  });

  it("caches TTS audio on second snap (does not regenerate)", async () => {
    const mockProvider = createMockProvider();
    setSnapDependencies({ provider: mockProvider, registry });

    // First snap — generates TTS
    const res1 = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdC1pbWFnZQ==",
        locale: "en",
      });

    expect(res1.status).toBe(200);
    expect(res1.body.audio.cached).toBe(false);
    expect(ttsCallCount).toBe(1);

    // Reset TTS call count
    ttsCallCount = 0;

    // Second snap — should use cached TTS
    const res2 = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdC1pbWFnZQ==",
        locale: "en",
      });

    expect(res2.status).toBe(200);
    expect(res2.body.audio).toBeDefined();
    expect(res2.body.audio.cached).toBe(true);
    expect(ttsCallCount).toBe(0); // TTS not called again
  });

  it("saves audio file to disk", async () => {
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

    // Verify audio file exists on disk
    const audioId = res.body.audio.audioId;
    const audioRecord = await prisma.audioNarration.findUnique({
      where: { id: audioId },
    });

    expect(audioRecord).not.toBeNull();
    expect(fs.existsSync(audioRecord!.file_path)).toBe(true);

    // Verify file has content
    const fileContent = fs.readFileSync(audioRecord!.file_path);
    expect(fileContent.length).toBeGreaterThan(0);
  });

  it("creates AudioNarration DB record", async () => {
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

    const audioRecord = await prisma.audioNarration.findUnique({
      where: { id: res.body.audio.audioId },
    });

    expect(audioRecord).not.toBeNull();
    expect(audioRecord!.voice_id).toBe("nova");
    expect(audioRecord!.file_path).toContain(".mp3");
    expect(audioRecord!.guide_content_id).toBeDefined();
  });
});

describe("[milestone-b] GET /audio/:id", () => {
  let authToken: string;
  let testAudioId: string;
  const registry = new PromptRegistry();

  beforeAll(async () => {
    process.env.TTS_AUDIO_DIR = TEST_AUDIO_DIR;
    process.env.TTS_VOICE = "nova";

    registry.loadFromFilesystem();

    const user = await prisma.user.findFirst({ where: { role: "end_user" } });
    authToken = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: "end_user",
    }).accessToken;

    // Clean up and create test data via snap
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Big Ben" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Big Ben" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Big Ben" },
    });

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

    testAudioId = res.body.audio.audioId;
  });

  afterAll(async () => {
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Big Ben" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Big Ben" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Big Ben" },
    });

    if (fs.existsSync(TEST_AUDIO_DIR)) {
      fs.rmSync(TEST_AUDIO_DIR, { recursive: true, force: true });
    }

    await prisma.$disconnect();
  });

  it("requires authentication", async () => {
    const res = await request(app).get(`/audio/${testAudioId}`);
    expect(res.status).toBe(401);
  });

  it("serves audio file with correct content-type", async () => {
    const res = await request(app)
      .get(`/audio/${testAudioId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("audio/mpeg");
    expect(res.headers["content-length"]).toBeDefined();
    expect(parseInt(res.headers["content-length"])).toBeGreaterThan(0);
  });

  it("sets cache-control header for 24h", async () => {
    const res = await request(app)
      .get(`/audio/${testAudioId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("public, max-age=86400");
  });

  it("returns 404 for non-existent audio", async () => {
    const res = await request(app)
      .get("/audio/non-existent-id")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error_type).toBe("not_found");
  });

  it("returns audio body content", async () => {
    const res = await request(app)
      .get(`/audio/${testAudioId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .buffer(true);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    // The mock audio content should be non-empty
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("[milestone-b] GET /audio/guide/:guideContentId", () => {
  let authToken: string;
  let testGuideContentId: string;
  const registry = new PromptRegistry();

  beforeAll(async () => {
    process.env.TTS_AUDIO_DIR = TEST_AUDIO_DIR;
    process.env.TTS_VOICE = "nova";

    registry.loadFromFilesystem();

    const user = await prisma.user.findFirst({ where: { role: "end_user" } });
    authToken = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: "end_user",
    }).accessToken;

    // Clean up
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Big Ben" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Big Ben" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Big Ben" },
    });

    setSnapDependencies({
      provider: createMockProvider(),
      registry,
    });

    // Create test data
    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdC1pbWFnZQ==",
        locale: "en",
      });

    // Get the guide content ID from the database
    const guide = await prisma.guideContent.findFirst({
      where: { landmark: { name: "Big Ben" } },
    });
    testGuideContentId = guide!.id;
  });

  afterAll(async () => {
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Big Ben" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Big Ben" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Big Ben" },
    });

    if (fs.existsSync(TEST_AUDIO_DIR)) {
      fs.rmSync(TEST_AUDIO_DIR, { recursive: true, force: true });
    }

    await prisma.$disconnect();
  });

  it("serves audio by guide content ID", async () => {
    const res = await request(app)
      .get(`/audio/guide/${testGuideContentId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("audio/mpeg");
  });

  it("returns 404 for non-existent guide content", async () => {
    const res = await request(app)
      .get("/audio/guide/non-existent-id")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});

