import type { LLMProvider, TTSResponse } from "../adapters/types.js";

export interface GenerateTTSInput {
  /** The narration text to convert to speech */
  text: string;
  /** TTS voice override (default from env TTS_VOICE or "alloy") */
  voice?: string;
  /** TTS model override (default from env TTS_MODEL or "tts-1") */
  model?: string;
  /** Playback speed multiplier, 0.25–4.0 (default 1.0) */
  speed?: number;
}

export interface GenerateTTSResult {
  /** Raw audio buffer (mp3) */
  audioBuffer: Buffer;
  /** Model used for generation */
  model: string;
  /** Generation latency in milliseconds */
  latencyMs: number;
  /** Size of the audio in bytes */
  audioSizeBytes: number;
  /** The voice used for generation */
  voice: string;
}

/**
 * Validates TTS input before sending to provider.
 * Throws descriptive errors for invalid inputs.
 */
export function validateTTSInput(input: GenerateTTSInput): void {
  if (!input.text || input.text.trim().length === 0) {
    throw new Error("TTS input text must not be empty");
  }

  // OpenAI TTS has a 4096 character limit per request
  if (input.text.length > 4096) {
    throw new Error(
      `TTS input text exceeds 4096 character limit (got ${input.text.length})`
    );
  }

  if (input.speed !== undefined && (input.speed < 0.25 || input.speed > 4.0)) {
    throw new Error(
      `TTS speed must be between 0.25 and 4.0 (got ${input.speed})`
    );
  }

  const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  if (input.voice && !validVoices.includes(input.voice)) {
    throw new Error(
      `Invalid TTS voice "${input.voice}". Valid voices: ${validVoices.join(", ")}`
    );
  }

  const validModels = ["tts-1", "tts-1-hd"];
  if (input.model && !validModels.includes(input.model)) {
    throw new Error(
      `Invalid TTS model "${input.model}". Valid models: ${validModels.join(", ")}`
    );
  }
}

/**
 * Builds the TTS request payload from input and defaults.
 * Useful for testing that the correct payload is sent to the provider.
 */
export function buildTTSRequest(input: GenerateTTSInput): {
  text: string;
  voice?: string;
  model?: string;
  speed?: number;
} {
  return {
    text: input.text,
    voice: input.voice, // provider fills defaults from env/constructor
    model: input.model,
    speed: input.speed,
  };
}

/**
 * MCP tool: generate text-to-speech audio from narration text.
 *
 * Uses the LLM provider's TTS capability (OpenAI TTS API).
 * Returns the raw audio buffer along with metadata.
 *
 * Recommended voice for tour guide tone: "nova" (warm, engaging)
 * Alternative: "alloy" (neutral), "echo" (deeper), "shimmer" (soft)
 */
export async function generateTTS(
  provider: LLMProvider,
  input: GenerateTTSInput
): Promise<GenerateTTSResult> {
  // Validate input
  validateTTSInput(input);

  // Build request
  const request = buildTTSRequest(input);

  // Call TTS provider
  const response: TTSResponse = await provider.tts(request);

  return {
    audioBuffer: response.audioBuffer,
    model: response.model,
    latencyMs: response.latencyMs,
    audioSizeBytes: response.audioBuffer.length,
    voice: input.voice || process.env.TTS_VOICE || "alloy",
  };
}

