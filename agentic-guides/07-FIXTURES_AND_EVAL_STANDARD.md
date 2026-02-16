# fixtures + evals standard (reusable)

Goal: make model behavior and critical flows **testable, reproducible, and regression-safe**.

## fixture types

- **manual fixtures**: curated JSON inputs/outputs checked into the repo
- **goldens**: “expected outputs” used to detect regressions
- **recordings** (optional): captured external API responses for offline tests

## required repo layout (recommended)

- `manual-fixtures/`
  - `README.md` (how fixtures are named and used)
  - `*_input.json`
  - `*_expected.json`

## naming convention

- include domain + function + scenario:
  - `intent_classification_simple_input.json`
  - `intent_classification_simple_expected.json`

## fixture rules

- fixtures must be **minimal** (only fields that matter)
- fixtures must be **schema-validated** in tests
- avoid real PII (use synthetic values)
- include at least:
  - happy path
  - ambiguity requiring clarification
  - invalid input
  - edge case boundaries

## eval harness (minimum viable)

Provide a test that:
- loads each fixture input
- runs the target function/prompt
- validates output against JSON schema
- compares to expected output (exact match or “stable subset” match)

## determinism guidelines

For model-based outputs:
- enforce schemas
- keep temperatures low for “contract” outputs
- prefer extraction/classification schemas with bounded vocab
- allow free-text only where strictly needed and test it with looser assertions


