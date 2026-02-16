# @aitourguide/mcp

Model behavior isolation package for AI Tour Guide.

## Overview

This package isolates all LLM interactions from the rest of the application. It contains prompt management, provider adapters, schema validation, and evaluation infrastructure.

## Tools

- `landmark_identify` — identifies landmarks from photos using vision model
- `guide_generate` — generates engaging guide content for landmarks
- `content_safety_check` — validates content for safety violations
- `tts_generate` — generates text-to-speech audio narration
- `social_share_generate` — generates social media sharing content

## Prompts

All prompts are stored in `prompts/` as versioned markdown files:

| Prompt | Schema | Description |
|--------|--------|-------------|
| `landmark_identify` | `landmark_identification.v1` | Vision-based landmark identification |
| `guide_generate` | `guide_content.v1` | Guide content generation with facts and narration |
| `content_safety_check` | `content_safety_check.v1` | Content safety validation |
| `social_share_generate` | `social_share_content.v1` | Social sharing text and hashtags |

## Fragments

Shared fragments in `prompts/_fragments/`:

| Fragment | Purpose |
|----------|---------|
| `safety_rules` | Content safety constraints and refusal rules |
| `style_and_language_rules` | Output style, tone, locale handling |

## Testing

```bash
# Run all MCP tests
npm test --workspace=packages/mcp

# Run fixture-based eval tests
npm run test:fixtures --workspace=packages/mcp

# Seed prompts (dry run)
npm run seed:prompts
```

## Configuration

Required environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | (required) |
| `LLM_MODEL` | Model for text/vision | `gpt-4o` |
| `LLM_TEMPERATURE` | Default temperature for text gen | `0.7` |
| `LLM_VISION_TEMPERATURE` | Temperature for vision tasks | `0.3` |
| `TTS_MODEL` | OpenAI TTS model | `tts-1` |
| `TTS_VOICE` | TTS voice | `alloy` |

