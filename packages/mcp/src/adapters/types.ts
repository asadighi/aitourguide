/**
 * Provider-agnostic LLM interface.
 * All model providers implement this interface.
 */
export interface LLMProvider {
  /**
   * Send a vision request (image + text prompt).
   */
  vision(params: VisionRequest): Promise<LLMResponse>;

  /**
   * Send a text completion request.
   */
  complete(params: CompletionRequest): Promise<LLMResponse>;

  /**
   * Generate text-to-speech audio.
   */
  tts(params: TTSRequest): Promise<TTSResponse>;
}

export interface VisionRequest {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  model?: string;
  speed?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface TTSResponse {
  audioBuffer: Buffer;
  model: string;
  latencyMs: number;
}

