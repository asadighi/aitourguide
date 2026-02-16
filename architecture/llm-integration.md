# llm integration

## architecture

- LLM operations provided via MCP package in the monorepo
- MCP package isolates all prompt rendering, provider calls, and schema validation
- Backend services call MCP functions instead of making direct LLM calls
- Provider-agnostic adapter pattern allows swapping OpenAI for other providers

---

## provider

- Primary: OpenAI
- Models:
  - GPT-4o: landmark identification (vision) + guide content generation (text)
  - OpenAI TTS: text-to-speech narration (alloy, echo, or similar voice)
- Adapter interface: `LLMProvider` with methods for vision, text completion, and TTS

---

## output format

- structured JSON outputs for all text generation
- validate against schemas from spec/prompt-schemas.md using Zod
- fail closed and return clarification_required schema on validation failure
- TTS outputs are audio files (mp3), not JSON

---

## prompt storage

- all prompts stored as md files in packages/mcp/prompts
- versioned via filenames (v1.0.0.md, v1.1.0.md, etc)
- prompt registry maps prompt id to file path and version
- prompts seeded into database via seed-prompts script
- no hardcoded prompts in service code

---

## fragment system

- common prompt sections extracted into reusable fragments
- fragments stored in packages/mcp/prompts/_fragments/
- each prompt declares fragment dependencies via fragments.json
- fragments automatically injected during prompt rendering using {{fragment:name}} placeholders

---

## what is model-driven vs deterministic

| Operation | Model-Driven | Deterministic |
|-----------|:---:|:---:|
| Landmark identification (vision) | ✓ | |
| Guide content generation | ✓ | |
| Content regeneration (admin prompt) | ✓ | |
| Content safety filtering | ✓ | |
| TTS audio generation | ✓ | |
| Ad matching to landmarks | | ✓ |
| Ad approval/rejection | | ✓ (human) |
| User auth | | ✓ |
| Cache lookup/serving | | ✓ |
| Social share card composition | | ✓ |
| Review/rating storage | | ✓ |

---

## cost and latency controls

- caching: guide content cached per landmark + locale; TTS cached per content version; eliminates repeat LLM calls
- temperature: low (0.3-0.5) for landmark identification and safety checks; moderate (0.7) for guide content generation
- token budget: reasonable max_tokens limits per prompt; guide content capped at ~1000 tokens
- batching: no batching needed; requests are user-initiated and singular
- model selection: GPT-4o for all operations; can downgrade to GPT-4o-mini for cost savings later

---

## safety

- content safety rules enforced via prompt fragments (safety_rules fragment)
- no politically biased, culturally insensitive, or fabricated content
- low-confidence identifications flagged explicitly
- all LLM operations go through MCP with validation
- test suite ensures no regressions on safety rules

