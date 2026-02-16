import { describe, it, expect, beforeAll } from "vitest";
import { PromptRegistry } from "../registry.js";
import { identifyLandmark } from "../tools/identify-landmark.js";
import type { LLMProvider, LLMResponse, TTSResponse } from "../adapters/types.js";

// Mock LLM provider that returns controlled responses
function createMockProvider(responseContent: string): LLMProvider {
  return {
    vision: async () => ({
      content: responseContent,
      model: "gpt-4o-mock",
      latencyMs: 100,
      usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
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

describe("[milestone-a] identifyLandmark tool", () => {
  let registry: PromptRegistry;

  beforeAll(() => {
    registry = new PromptRegistry();
    registry.loadFromFilesystem();
  });

  it("returns valid landmark identification for high-confidence match", async () => {
    const mockResponse = JSON.stringify({
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name: "Eiffel Tower",
          confidence: 0.95,
          location: {
            city: "Paris",
            country: "France",
            coordinates: { lat: 48.8584, lng: 2.2945 },
          },
          category: "monument",
          brief_description: "Iconic iron lattice tower in Paris",
        },
      ],
      needs_clarification: false,
      clarification_message: null,
    });

    const provider = createMockProvider(mockResponse);
    const result = await identifyLandmark(provider, registry, {
      imageBase64: "dGVzdC1pbWFnZQ==",
    });

    expect(result.data.landmarks).toHaveLength(1);
    expect(result.data.landmarks[0].name).toBe("Eiffel Tower");
    expect(result.data.landmarks[0].confidence).toBe(0.95);
    expect(result.data.needs_clarification).toBe(false);
    expect(result.model).toBe("gpt-4o-mock");
    expect(result.promptVersion).toBe("1.0.0");
  });

  it("returns clarification response for low-confidence match", async () => {
    const mockResponse = JSON.stringify({
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name: "Tower Bridge",
          confidence: 0.45,
          location: { city: "London", country: "UK" },
          category: "building",
          brief_description: "Historic drawbridge over the Thames",
        },
        {
          name: "London Bridge",
          confidence: 0.35,
          location: { city: "London", country: "UK" },
          category: "building",
          brief_description: "Bridge crossing the Thames",
        },
      ],
      needs_clarification: true,
      clarification_message:
        "I found two possible matches. Which landmark did you photograph?",
    });

    const provider = createMockProvider(mockResponse);
    const result = await identifyLandmark(provider, registry, {
      imageBase64: "dGVzdC1pbWFnZQ==",
    });

    expect(result.data.landmarks).toHaveLength(2);
    expect(result.data.needs_clarification).toBe(true);
    expect(result.data.clarification_message).toContain("two possible");
  });

  it("passes GPS context to the prompt when provided", async () => {
    let capturedPrompt = "";
    const provider: LLMProvider = {
      vision: async (params) => {
        capturedPrompt = params.userPrompt;
        return {
          content: JSON.stringify({
            schema: "landmark_identification.v1",
            landmarks: [
              {
                name: "Test",
                confidence: 0.9,
                location: { city: "Test", country: "Test" },
                category: "other",
                brief_description: "test",
              },
            ],
            needs_clarification: false,
            clarification_message: null,
          }),
          model: "gpt-4o-mock",
          latencyMs: 50,
        };
      },
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

    await identifyLandmark(provider, registry, {
      imageBase64: "dGVzdA==",
      gps: { lat: 48.8584, lng: 2.2945 },
    });

    expect(capturedPrompt).toContain("48.8584");
    expect(capturedPrompt).toContain("2.2945");
  });

  it("throws on invalid LLM response JSON", async () => {
    const provider = createMockProvider("not valid json");

    await expect(
      identifyLandmark(provider, registry, {
        imageBase64: "dGVzdA==",
      })
    ).rejects.toThrow("Failed to parse LLM response");
  });

  it("throws on schema validation failure", async () => {
    const provider = createMockProvider(
      JSON.stringify({ schema: "landmark_identification.v1", landmarks: "not an array" })
    );

    await expect(
      identifyLandmark(provider, registry, {
        imageBase64: "dGVzdA==",
      })
    ).rejects.toThrow("schema validation");
  });
});

