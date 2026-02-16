import OpenAI from "openai";
import type {
  LLMProvider,
  VisionRequest,
  CompletionRequest,
  TTSRequest,
  LLMResponse,
  TTSResponse,
} from "./types.js";

/**
 * OpenAI adapter implementing the provider-agnostic LLMProvider interface.
 */
export class OpenAIAdapter implements LLMProvider {
  private client: OpenAI;
  private defaultModel: string;
  private defaultTTSModel: string;
  private defaultVoice: string;
  private defaultSpeed: number;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    ttsModel?: string;
    voice?: string;
    speed?: number;
  }) {
    this.client = new OpenAI({
      apiKey: options?.apiKey || process.env.OPENAI_API_KEY,
    });
    this.defaultModel = options?.model || process.env.LLM_MODEL || "gpt-4o";
    this.defaultTTSModel =
      options?.ttsModel || process.env.TTS_MODEL || "tts-1";
    this.defaultVoice = options?.voice || process.env.TTS_VOICE || "nova";
    this.defaultSpeed =
      options?.speed ?? parseFloat(process.env.TTS_SPEED || "1.0");
  }

  async vision(params: VisionRequest): Promise<LLMResponse> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: "system", content: params.systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: params.userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${params.imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 1000,
      response_format: { type: "json_object" },
    });

    return {
      content: response.choices[0]?.message?.content || "",
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      latencyMs: Date.now() - start,
    };
  }

  async complete(params: CompletionRequest): Promise<LLMResponse> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1000,
      response_format: { type: "json_object" },
    });

    return {
      content: response.choices[0]?.message?.content || "",
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      latencyMs: Date.now() - start,
    };
  }

  async tts(params: TTSRequest): Promise<TTSResponse> {
    const start = Date.now();
    const model = params.model || this.defaultTTSModel;

    // Build base request
    const request: Record<string, unknown> = {
      model,
      voice: params.voice || this.defaultVoice,
      input: params.text,
      speed: params.speed ?? this.defaultSpeed,
    };

    // gpt-4o-mini-tts supports an `instructions` field for accent/style control.
    // tts-1 and tts-1-hd ignore it, so we only include it for supported models.
    if (params.instructions && model.includes("gpt-4o")) {
      request.instructions = params.instructions;
    }

    const response = await this.client.audio.speech.create(
      request as unknown as Parameters<typeof this.client.audio.speech.create>[0]
    );

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    return {
      audioBuffer,
      model,
      latencyMs: Date.now() - start,
    };
  }
}

