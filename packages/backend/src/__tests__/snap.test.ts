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

  it("defaults locale to 'en' when not specified", async () => {
    setSnapDependencies({
      provider: createMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        image_base64: "dGVzdC1pbWFnZQ==",
      });

    expect(res.status).toBe(200);
    // Should hit the existing "en" cache from earlier test
    expect(res.body.cached).toBe(true);
    expect(res.body.guide.locale).toBe("en");
  });
});

/**
 * B-3 integration tests: multi-lingual content generation with locale caching.
 *
 * Verifies that different locales produce separate cached guide content entries
 * and separate TTS audio, all from the same landmark.
 */

function createLocaleAwareMockProvider(): LLMProvider {
  return {
    vision: async () => ({
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
    }),
    complete: async (params) => {
      // Detect locale from the prompt text to return locale-appropriate content
      // Match "Language/Locale: XX" pattern from the guide_generate prompt
      const localeMatch = params.userPrompt.match(/Language\/Locale:\s*(\w+)/);
      const detectedLocale = localeMatch?.[1] || "en";
      const isFrench = detectedLocale === "fr";
      const isSpanish = detectedLocale === "es";

      if (isFrench) {
        return {
          content: JSON.stringify({
            schema: "guide_content.v1",
            landmark_name: "Statue de la Liberté",
            locale: "fr",
            title: "La Statue de la Liberté: Symbole de Liberté",
            summary:
              "La Statue de la Liberté est une sculpture néoclassique colossale sur Liberty Island.",
            facts: [
              {
                heading: "Cadeau de la France",
                body: "La France a offert la statue aux États-Unis en 1886.",
              },
            ],
            narration_script:
              "Bienvenue à la magnifique Statue de la Liberté!",
            fun_fact:
              "Le nom complet est La Liberté éclairant le monde!",
            confidence_note: null,
          }),
          model: "gpt-4o-mock",
          latencyMs: 200,
          usage: { promptTokens: 400, completionTokens: 500, totalTokens: 900 },
        };
      }

      if (isSpanish) {
        return {
          content: JSON.stringify({
            schema: "guide_content.v1",
            landmark_name: "Estatua de la Libertad",
            locale: "es",
            title: "La Estatua de la Libertad: Símbolo de Libertad",
            summary:
              "La Estatua de la Libertad es una escultura neoclásica colosal en Liberty Island.",
            facts: [
              {
                heading: "Regalo de Francia",
                body: "Francia regaló la estatua a los Estados Unidos en 1886.",
              },
            ],
            narration_script:
              "¡Bienvenidos a la magnífica Estatua de la Libertad!",
            fun_fact:
              "¡El nombre completo es La Libertad iluminando el mundo!",
            confidence_note: null,
          }),
          model: "gpt-4o-mock",
          latencyMs: 200,
          usage: { promptTokens: 400, completionTokens: 500, totalTokens: 900 },
        };
      }

      // Default English
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
              body: "France gave the statue to the United States in 1886.",
            },
          ],
          narration_script:
            "Welcome to the magnificent Statue of Liberty!",
          fun_fact:
            "The statue's full name is Liberty Enlightening the World!",
          confidence_note: null,
        }),
        model: "gpt-4o-mock",
        latencyMs: 200,
        usage: { promptTokens: 400, completionTokens: 500, totalTokens: 900 },
      };
    },
    tts: async (params): Promise<TTSResponse> => ({
      audioBuffer: Buffer.from(`mock-audio-${params.text.slice(0, 20)}`),
      model: "tts-1",
      latencyMs: 50,
    }),
  };
}

const LOCALE_TEST_AUDIO_DIR = "./audio-cache-locale-test";

describe("[milestone-b] Multi-lingual locale caching", () => {
  let authToken: string;
  const registry = new PromptRegistry();

  beforeAll(async () => {
    process.env.TTS_AUDIO_DIR = LOCALE_TEST_AUDIO_DIR;
    process.env.TTS_VOICE = "nova";
    registry.loadFromFilesystem();

    const user = await prisma.user.findFirst({ where: { role: "end_user" } });
    authToken = generateTokens({
      userId: user!.id,
      email: user!.email,
      role: "end_user",
    }).accessToken;

    // Clean up test data from previous runs
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
    await prisma.audioNarration.deleteMany({
      where: { guide_content: { landmark: { name: "Statue of Liberty" } } },
    });
    await prisma.guideContent.deleteMany({
      where: { landmark: { name: "Statue of Liberty" } },
    });
    await prisma.landmark.deleteMany({
      where: { name: "Statue of Liberty" },
    });
    if (fs.existsSync(LOCALE_TEST_AUDIO_DIR)) {
      fs.rmSync(LOCALE_TEST_AUDIO_DIR, { recursive: true, force: true });
    }
    await prisma.$disconnect();
  });

  it("generates English content on first request", async () => {
    setSnapDependencies({
      provider: createLocaleAwareMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ image_base64: "dGVzdC1pbWFnZQ==", locale: "en" });

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(res.body.guide.locale).toBe("en");
    expect(res.body.guide.title).toContain("Liberty");
    expect(res.body.audio).toBeDefined();
    expect(res.body.audio.cached).toBe(false);
  });

  it("generates separate French content for same landmark (cache miss)", async () => {
    setSnapDependencies({
      provider: createLocaleAwareMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ image_base64: "dGVzdC1pbWFnZQ==", locale: "fr" });

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false); // Different locale = cache miss
    expect(res.body.guide.locale).toBe("fr");
    expect(res.body.guide.title).toContain("Liberté");
    expect(res.body.guide.narration_script).toContain("Bienvenue");
    expect(res.body.audio).toBeDefined();
    expect(res.body.audio.cached).toBe(false); // New TTS for French
  });

  it("generates separate Spanish content for same landmark (cache miss)", async () => {
    setSnapDependencies({
      provider: createLocaleAwareMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ image_base64: "dGVzdC1pbWFnZQ==", locale: "es" });

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false); // Different locale = cache miss
    expect(res.body.guide.locale).toBe("es");
    expect(res.body.guide.title).toContain("Libertad");
    expect(res.body.guide.narration_script).toContain("Bienvenidos");
    expect(res.body.audio).toBeDefined();
    expect(res.body.audio.cached).toBe(false); // New TTS for Spanish
  });

  it("returns cached English content on second English request (cache hit)", async () => {
    setSnapDependencies({
      provider: createLocaleAwareMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ image_base64: "dGVzdC1pbWFnZQ==", locale: "en" });

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true); // English was already cached
    expect(res.body.guide.locale).toBe("en");
    expect(res.body.audio).toBeDefined();
    expect(res.body.audio.cached).toBe(true); // TTS also cached
  });

  it("returns cached French content on second French request (cache hit)", async () => {
    setSnapDependencies({
      provider: createLocaleAwareMockProvider(),
      registry,
    });

    const res = await request(app)
      .post("/snap")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ image_base64: "dGVzdC1pbWFnZQ==", locale: "fr" });

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true); // French was already cached
    expect(res.body.guide.locale).toBe("fr");
    expect(res.body.audio.cached).toBe(true);
  });

  it("created separate DB records per locale for the same landmark", async () => {
    const landmark = await prisma.landmark.findFirst({
      where: { name: "Statue of Liberty" },
    });
    expect(landmark).toBeDefined();

    const guides = await prisma.guideContent.findMany({
      where: { landmark_id: landmark!.id, is_active: true },
      orderBy: { locale: "asc" },
    });

    // Should have 3 separate guide records: en, es, fr
    expect(guides).toHaveLength(3);
    const locales = guides.map((g) => g.locale).sort();
    expect(locales).toEqual(["en", "es", "fr"]);

    // Each guide should have a separate AudioNarration
    const audioRecords = await prisma.audioNarration.findMany({
      where: {
        guide_content_id: { in: guides.map((g) => g.id) },
      },
    });
    expect(audioRecords).toHaveLength(3);
  });
});

