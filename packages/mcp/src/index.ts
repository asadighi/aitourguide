// @aitourguide/mcp — model behavior isolation package

export { PromptRegistry, type PromptEntry } from "./registry.js";
export { renderPromptFromRegistry } from "./renderer.js";
export { validateOutput } from "./validator.js";
export type { LLMProvider, LLMResponse, TTSResponse } from "./adapters/types.js";
export { OpenAIAdapter } from "./adapters/openai.js";

// MCP tools
export {
  identifyLandmark,
  type IdentifyLandmarkInput,
  type IdentifyLandmarkResult,
} from "./tools/identify-landmark.js";
export {
  generateGuide,
  type GenerateGuideInput,
  type GenerateGuideResult,
} from "./tools/generate-guide.js";
export {
  generateTTS,
  validateTTSInput,
  buildTTSRequest,
  type GenerateTTSInput,
  type GenerateTTSResult,
} from "./tools/generate-tts.js";

