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

    const response = await this.client.audio.speech.create({
      model: params.model || this.defaultTTSModel,
      voice: (params.voice || this.defaultVoice) as "alloy",
      input: params.text,
      speed: params.speed ?? this.defaultSpeed,
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    return {
      audioBuffer,
      model: params.model || this.defaultTTSModel,
      latencyMs: Date.now() - start,
    };
  }
}

