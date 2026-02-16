# manual fixtures

Curated JSON input/output pairs for testing LLM prompts and critical flows.

## naming convention

`{prompt_id}_{scenario}_input.json` + `{prompt_id}_{scenario}_expected.json`

## fixture pairs

| Fixture | Scenario | Description |
|---------|----------|-------------|
| `landmark_identify_simple` | Happy path | Clear photo of a well-known landmark |
| `landmark_identify_uncertain` | Low confidence | Ambiguous photo requiring clarification |
| `guide_generate_english` | Happy path (en) | Guide content in English |
| `guide_generate_french` | Happy path (fr) | Guide content in French |

## rules

- fixtures must be minimal (only fields that matter)
- fixtures must be schema-validated in tests
- avoid real PII (use synthetic values)
- review fixtures when prompts change (version bump)

