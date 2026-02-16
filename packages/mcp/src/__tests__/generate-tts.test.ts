import { describe, it, expect } from "vitest";
import {
  generateTTS,
  validateTTSInput,
  buildTTSRequest,
} from "../tools/generate-tts.js";
import type {
  LLMProvider,
  LLMResponse,
  TTSResponse,
} from "../adapters/types.js";

// ─── Mock Provider ──────────────────────────────────

function createMockProvider(
  audioContent = "fake-mp3-audio-data",
  model = "tts-1"
): LLMProvider {
  return {
    vision: async (): Promise<LLMResponse> => ({
      content: "",
      model: "gpt-4o-mock",
      latencyMs: 0,
    }),
    complete: async (): Promise<LLMResponse> => ({
      content: "",
      model: "gpt-4o-mock",
      latencyMs: 0,
    }),
    tts: async (params): Promise<TTSResponse> => ({
      audioBuffer: Buffer.from(audioContent),
      model: params.model || model,
      latencyMs: 250,
    }),
  };
}

// ─── Unit Tests: Input Validation ───────────────────

describe("[milestone-b] validateTTSInput", () => {
  it("accepts valid input with just text", () => {
    expect(() =>
      validateTTSInput({ text: "Welcome to the Eiffel Tower!" })
    ).not.toThrow();
  });

  it("accepts valid input with all options", () => {
    expect(() =>
      validateTTSInput({
        text: "Welcome to the Eiffel Tower!",
        voice: "nova",
        model: "tts-1-hd",
        speed: 1.2,
      })
    ).not.toThrow();
  });

  it("rejects empty text", () => {
    expect(() => validateTTSInput({ text: "" })).toThrow(
      "must not be empty"
    );
  });

  it("rejects whitespace-only text", () => {
    expect(() => validateTTSInput({ text: "   " })).toThrow(
      "must not be empty"
    );
  });

  it("rejects text exceeding 4096 characters", () => {
    const longText = "a".repeat(4097);
    expect(() => validateTTSInput({ text: longText })).toThrow(
      "exceeds 4096 character limit"
    );
  });

  it("accepts text exactly at 4096 characters", () => {
    const maxText = "a".repeat(4096);
    expect(() => validateTTSInput({ text: maxText })).not.toThrow();
  });

  it("rejects invalid speed (too low)", () => {
    expect(() =>
      validateTTSInput({ text: "test", speed: 0.1 })
    ).toThrow("speed must be between 0.25 and 4.0");
  });

  it("rejects invalid speed (too high)", () => {
    expect(() =>
      validateTTSInput({ text: "test", speed: 5.0 })
    ).toThrow("speed must be between 0.25 and 4.0");
  });

  it("accepts boundary speed values", () => {
    expect(() =>
      validateTTSInput({ text: "test", speed: 0.25 })
    ).not.toThrow();
    expect(() =>
      validateTTSInput({ text: "test", speed: 4.0 })
    ).not.toThrow();
  });

  it("rejects invalid voice", () => {
    expect(() =>
      validateTTSInput({ text: "test", voice: "invalid-voice" })
    ).toThrow('Invalid TTS voice "invalid-voice"');
  });

  it("accepts all valid voices (classic + new)", () => {
    for (const voice of [
      "alloy", "ash", "ballad", "coral", "echo",
      "fable", "nova", "onyx", "sage", "shimmer",
    ]) {
      expect(() =>
        validateTTSInput({ text: "test", voice })
      ).not.toThrow();
    }
  });

  it("rejects invalid model", () => {
    expect(() =>
      validateTTSInput({ text: "test", model: "gpt-4o" })
    ).toThrow('Invalid TTS model "gpt-4o"');
  });

  it("accepts valid TTS models", () => {
    expect(() =>
      validateTTSInput({ text: "test", model: "tts-1" })
    ).not.toThrow();
    expect(() =>
      validateTTSInput({ text: "test", model: "tts-1-hd" })
    ).not.toThrow();
    expect(() =>
      validateTTSInput({ text: "test", model: "gpt-4o-mini-tts" })
    ).not.toThrow();
  });
});

// ─── Unit Tests: Request Builder ────────────────────

describe("[milestone-b] buildTTSRequest", () => {
  it("builds request with text only", () => {
    const request = buildTTSRequest({ text: "Hello world" });
    expect(request).toEqual({
      text: "Hello world",
      voice: undefined,
      model: undefined,
      speed: undefined,
      instructions: undefined,
    });
  });

  it("builds request with all options", () => {
    const request = buildTTSRequest({
      text: "Welcome to Paris!",
      voice: "nova",
      model: "tts-1-hd",
      speed: 1.1,
    });
    expect(request).toEqual({
      text: "Welcome to Paris!",
      voice: "nova",
      model: "tts-1-hd",
      speed: 1.1,
      instructions: undefined,
    });
  });

  it("builds request with instructions for gpt-4o-mini-tts", () => {
    const request = buildTTSRequest({
      text: "به برج ایفل خوش آمدید!",
      voice: "nova",
      model: "gpt-4o-mini-tts",
      speed: 1.0,
      instructions: "Speak in Iranian Persian with a Tehran accent.",
    });
    expect(request).toEqual({
      text: "به برج ایفل خوش آمدید!",
      voice: "nova",
      model: "gpt-4o-mini-tts",
      speed: 1.0,
      instructions: "Speak in Iranian Persian with a Tehran accent.",
    });
  });

  it("preserves the exact narration text", () => {
    const narration =
      "Welcome to the magnificent Eiffel Tower! Standing proudly at 330 meters tall, this iron lattice masterpiece has captivated millions since 1889.";
    const request = buildTTSRequest({ text: narration });
    expect(request.text).toBe(narration);
  });
});

// ─── Contract Tests: Mocked TTS API ────────────────

describe("[milestone-b] generateTTS (contract)", () => {
  it("returns audio buffer from mocked provider", async () => {
    const provider = createMockProvider("mock-audio-content");
    const result = await generateTTS(provider, {
      text: "Welcome to the Eiffel Tower!",
    });

    expect(result.audioBuffer).toBeInstanceOf(Buffer);
    expect(result.audioBuffer.toString()).toBe("mock-audio-content");
    expect(result.model).toBe("tts-1");
    expect(result.latencyMs).toBe(250);
    expect(result.audioSizeBytes).toBe(
      Buffer.from("mock-audio-content").length
    );
  });

  it("passes voice override to provider", async () => {
    let capturedVoice: string | undefined;
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      complete: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      tts: async (params): Promise<TTSResponse> => {
        capturedVoice = params.voice;
        return {
          audioBuffer: Buffer.from("audio"),
          model: params.model || "tts-1",
          latencyMs: 100,
        };
      },
    };

    await generateTTS(provider, {
      text: "Test narration",
      voice: "shimmer",
    });

    expect(capturedVoice).toBe("shimmer");
  });

  it("passes model override to provider", async () => {
    let capturedModel: string | undefined;
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      complete: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      tts: async (params): Promise<TTSResponse> => {
        capturedModel = params.model;
        return {
          audioBuffer: Buffer.from("audio"),
          model: params.model || "tts-1",
          latencyMs: 100,
        };
      },
    };

    const result = await generateTTS(provider, {
      text: "Test narration",
      model: "tts-1-hd",
    });

    expect(capturedModel).toBe("tts-1-hd");
    expect(result.model).toBe("tts-1-hd");
  });

  it("passes speed override to provider", async () => {
    let capturedSpeed: number | undefined;
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      complete: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      tts: async (params): Promise<TTSResponse> => {
        capturedSpeed = params.speed;
        return {
          audioBuffer: Buffer.from("audio"),
          model: "tts-1",
          latencyMs: 100,
        };
      },
    };

    await generateTTS(provider, {
      text: "Test narration",
      speed: 1.5,
    });

    expect(capturedSpeed).toBe(1.5);
  });

  it("reports correct voice in result", async () => {
    const provider = createMockProvider();
    const result = await generateTTS(provider, {
      text: "Test narration",
      voice: "echo",
    });

    expect(result.voice).toBe("echo");
  });

  it("passes instructions to provider when provided", async () => {
    let capturedInstructions: string | undefined;
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      complete: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      tts: async (params): Promise<TTSResponse> => {
        capturedInstructions = params.instructions;
        return {
          audioBuffer: Buffer.from("audio"),
          model: params.model || "gpt-4o-mini-tts",
          latencyMs: 100,
        };
      },
    };

    await generateTTS(provider, {
      text: "Test narration in Farsi",
      model: "gpt-4o-mini-tts",
      voice: "nova",
      instructions: "Speak with a Tehran Iranian accent.",
    });

    expect(capturedInstructions).toBe("Speak with a Tehran Iranian accent.");
  });

  it("rejects empty text before calling provider", async () => {
    let providerCalled = false;
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      complete: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      tts: async (): Promise<TTSResponse> => {
        providerCalled = true;
        return {
          audioBuffer: Buffer.from(""),
          model: "tts-1",
          latencyMs: 0,
        };
      },
    };

    await expect(
      generateTTS(provider, { text: "" })
    ).rejects.toThrow("must not be empty");
    expect(providerCalled).toBe(false);
  });

  it("handles provider errors gracefully", async () => {
    const provider: LLMProvider = {
      vision: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      complete: async (): Promise<LLMResponse> => ({
        content: "",
        model: "mock",
        latencyMs: 0,
      }),
      tts: async (): Promise<TTSResponse> => {
        throw new Error("OpenAI API rate limit exceeded");
      },
    };

    await expect(
      generateTTS(provider, { text: "Test narration" })
    ).rejects.toThrow("rate limit exceeded");
  });
});

