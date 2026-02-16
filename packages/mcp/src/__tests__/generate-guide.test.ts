import { describe, it, expect, beforeAll } from "vitest";
import { PromptRegistry } from "../registry.js";
import { generateGuide } from "../tools/generate-guide.js";
import type { LLMProvider, LLMResponse, TTSResponse } from "../adapters/types.js";

function createMockProvider(responseContent: string): LLMProvider {
  return {
    vision: async (): Promise<LLMResponse> => ({
      content: "",
      model: "gpt-4o-mock",
      latencyMs: 0,
    }),
    complete: async () => ({
      content: responseContent,
      model: "gpt-4o-mock",
      latencyMs: 150,
      usage: { promptTokens: 400, completionTokens: 600, totalTokens: 1000 },
    }),
    tts: async (): Promise<TTSResponse> => ({
      audioBuffer: Buffer.from(""),
      model: "tts-1",
      latencyMs: 0,
    }),
  };
}

describe("[milestone-a] generateGuide tool", () => {
  let registry: PromptRegistry;

  beforeAll(() => {
    registry = new PromptRegistry();
    registry.loadFromFilesystem();
  });

  it("returns valid guide content for a known landmark", async () => {
    const mockResponse = JSON.stringify({
      schema: "guide_content.v1",
      landmark_name: "Eiffel Tower",
      locale: "en",
      title: "The Eiffel Tower: Iron Lady of Paris",
      summary:
        "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris.",
      facts: [
        {
          heading: "Construction",
          body: "Built between 1887 and 1889 for the 1889 World's Fair.",
        },
        {
          heading: "Height",
          body: "Standing at 330 meters, it was the world's tallest structure for 41 years.",
        },
        {
          heading: "Annual Visitors",
          body: "Nearly 7 million visitors per year make it the most-visited paid monument.",
        },
      ],
      narration_script:
        "Welcome to the magnificent Eiffel Tower! Standing proudly at 330 meters tall...",
      fun_fact:
        "The tower was originally intended to be dismantled after 20 years!",
      confidence_note: null,
    });

    const provider = createMockProvider(mockResponse);
    const result = await generateGuide(provider, registry, {
      landmarkName: "Eiffel Tower",
      locale: "en",
    });

    expect(result.data.landmark_name).toBe("Eiffel Tower");
    expect(result.data.locale).toBe("en");
    expect(result.data.facts).toHaveLength(3);
    expect(result.data.narration_script).toContain("Eiffel Tower");
    expect(result.model).toBe("gpt-4o-mock");
    expect(result.promptVersion).toBe("1.0.0");
  });

  it("injects locale into the prompt", async () => {
    let capturedPrompt = "";
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "gpt-4o-mock",
        latencyMs: 0,
      }),
      complete: async (params) => {
        capturedPrompt = params.userPrompt;
        return {
          content: JSON.stringify({
            schema: "guide_content.v1",
            landmark_name: "Colosseum",
            locale: "fr",
            title: "Le Colisée",
            summary: "Le Colisée est un amphithéâtre ovale.",
            facts: [{ heading: "Construction", body: "Construit entre 70-80 après J.-C." }],
            narration_script: "Bienvenue au Colisée!",
            fun_fact: null,
            confidence_note: null,
          }),
          model: "gpt-4o-mock",
          latencyMs: 100,
        };
      },
      tts: async (): Promise<TTSResponse> => ({
        audioBuffer: Buffer.from(""),
        model: "tts-1",
        latencyMs: 0,
      }),
    };

    const result = await generateGuide(provider, registry, {
      landmarkName: "Colosseum",
      locale: "fr",
    });

    expect(capturedPrompt).toContain("fr");
    expect(capturedPrompt).toContain("Colosseum");
    expect(result.data.locale).toBe("fr");
  });

  it("includes admin prompt context when provided", async () => {
    let capturedPrompt = "";
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "gpt-4o-mock",
        latencyMs: 0,
      }),
      complete: async (params) => {
        capturedPrompt = params.userPrompt;
        return {
          content: JSON.stringify({
            schema: "guide_content.v1",
            landmark_name: "Taj Mahal",
            locale: "en",
            title: "The Taj Mahal",
            summary: "The Taj Mahal is a magnificent marble mausoleum.",
            facts: [{ heading: "Love Story", body: "Built by Shah Jahan for Mumtaz Mahal." }],
            narration_script: "Welcome to the breathtaking Taj Mahal!",
            fun_fact: "It took 22 years to build!",
            confidence_note: null,
          }),
          model: "gpt-4o-mock",
          latencyMs: 100,
        };
      },
      tts: async (): Promise<TTSResponse> => ({
        audioBuffer: Buffer.from(""),
        model: "tts-1",
        latencyMs: 0,
      }),
    };

    await generateGuide(provider, registry, {
      landmarkName: "Taj Mahal",
      locale: "en",
      adminPrompt: "Focus more on the architecture and craftsmanship",
    });

    expect(capturedPrompt).toContain("architecture and craftsmanship");
  });

  it("throws on invalid LLM response", async () => {
    const provider = createMockProvider("not valid json");

    await expect(
      generateGuide(provider, registry, {
        landmarkName: "Test",
        locale: "en",
      })
    ).rejects.toThrow("Failed to parse");
  });

  it("throws on schema validation failure", async () => {
    const provider = createMockProvider(
      JSON.stringify({ schema: "guide_content.v1", title: "Test" })
    );

    await expect(
      generateGuide(provider, registry, {
        landmarkName: "Test",
        locale: "en",
      })
    ).rejects.toThrow("schema validation");
  });
});

