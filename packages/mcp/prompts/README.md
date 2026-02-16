# prompts

This directory contains all LLM prompt templates for AI Tour Guide.

## structure

- `_fragments/` — shared prompt fragments (safety rules, style rules, etc.)
- `landmark_identify/` — landmark identification from images
- `guide_generate/` — guide content generation for landmarks
- `content_safety_check/` — content safety validation
- `social_share_generate/` — social sharing text generation

## rules

- all prompts are version-controlled markdown files
- prompts use `{{variable_name}}` for variable injection
- prompts use `{{fragment:name}}` for shared fragment injection
- each prompt directory contains a `fragments.json` declaring dependencies
- no hardcoded prompts in service code — everything goes through the registry

