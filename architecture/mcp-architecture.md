# mcp architecture

## overview

The LLM engine is structured as an MCP package to decouple UX from LLM operations.

All model interactions go through well-defined tools with typed inputs, validated outputs, and structured logging.

---

## mcp tools

Each LLM operation is exposed as an MCP tool:

- `landmark_identify` — accepts image (base64) + optional GPS coordinates, returns landmark identification with confidence scores
- `guide_generate` — accepts landmark name + locale + optional admin prompt, returns guide content (facts, narration script)
- `content_safety_check` — accepts text content, returns safety assessment
- `tts_generate` — accepts narration script + voice config, returns audio file path
- `social_share_generate` — accepts landmark name + summary + locale, returns share text + hashtags

---

## contracts

Each MCP tool has:
- defined input schema (TypeScript types in packages/shared)
- defined output schema (validated against spec/prompt-schemas.md via Zod)
- error handling contract (returns error.v1 or clarification_required.v1 on failure)
- versioning strategy (prompt files versioned, tool interface stable)

---

## prompt management

All prompts stored as MD files in packages/mcp/prompts:
- each prompt has its own directory (matching tool name)
- versions are files (v1.0.0.md, v1.1.0.md)
- prompts seeded into database via seed-prompts script
- services use renderPromptFromRegistry to load and render prompts
- no hardcoded prompts in service code

Shared fragments in packages/mcp/prompts/_fragments/:
- fragment dependency system via fragments.json per prompt
- fragments automatically injected using {{fragment:name}} placeholders

### prompt directories

```
packages/mcp/prompts/
├── README.md
├── _fragments/
│   ├── README.md
│   ├── safety_rules.md
│   └── style_and_language_rules.md
├── landmark_identify/
│   ├── README.md
│   ├── fragments.json
│   └── v1.0.0.md
├── guide_generate/
│   ├── README.md
│   ├── fragments.json
│   └── v1.0.0.md
├── content_safety_check/
│   ├── README.md
│   ├── fragments.json
│   └── v1.0.0.md
└── social_share_generate/
    ├── README.md
    ├── fragments.json
    └── v1.0.0.md
```

---

## integration testing

Comprehensive test suite with:
- human-readable test cases using manual fixtures
- covers all tools, scenarios, and edge cases
- can run independently via CLI
- validates against expected outputs using Zod schemas
- catches regressions and hallucinations

---

## deployment

Current: MCP runs embedded in backend process (imported as a package)
Future: MCP can be deployed as standalone server
- Designed for independent deployment
- Health check endpoint
- Monitoring and observability hooks
- Configuration via environment variables

