# fixtures + evals standard

## goal

Make model behavior and critical flows **testable, reproducible, and regression-safe**.

---

## fixture types

- **manual fixtures**: curated JSON inputs/outputs checked into the repo
- **goldens**: "expected outputs" used to detect regressions
- **recordings** (optional, future): captured external API responses for offline tests

---

## repo layout

```
manual-fixtures/
├── README.md
├── landmark_identify_simple_input.json
├── landmark_identify_simple_expected.json
├── landmark_identify_uncertain_input.json
├── landmark_identify_uncertain_expected.json
├── guide_generate_english_input.json
├── guide_generate_english_expected.json
├── guide_generate_french_input.json
├── guide_generate_french_expected.json
├── content_safety_check_safe_input.json
├── content_safety_check_safe_expected.json
├── content_safety_check_unsafe_input.json
└── content_safety_check_unsafe_expected.json
```

---

## naming convention

Include domain + function + scenario:
- `landmark_identify_simple_input.json`
- `landmark_identify_simple_expected.json`
- `guide_generate_english_input.json`
- `guide_generate_english_expected.json`

---

## fixture rules

- fixtures must be **minimal** (only fields that matter)
- fixtures must be **schema-validated** in tests
- avoid real PII (use synthetic values)
- include at least:
  - happy path (clear landmark, high confidence)
  - ambiguity requiring clarification (low confidence, 2 candidates)
  - invalid input (no landmark visible, blurry image description)
  - edge case boundaries (very long landmark name, uncommon locale)

---

## eval harness (minimum viable)

Provide a test that:
- loads each fixture input from `manual-fixtures/`
- runs the target function/prompt (with mocked LLM for determinism)
- validates output against JSON schema (Zod from packages/shared)
- compares to expected output (exact match or "stable subset" match)

"Stable subset" match means:
- all keys in expected must exist in actual
- values must match for primitive fields
- arrays may be checked for subset containment (not strict order)

---

## determinism guidelines

For model-based outputs:
- enforce schemas (all outputs validate against Zod)
- keep temperatures low for "contract" outputs (landmark identification: 0.3)
- prefer extraction/classification schemas with bounded vocab
- allow free-text only where strictly needed (narration_script) and test it with looser assertions
- guide content generation uses moderate temperature (0.7) — test schema only, not exact text

---

## fixture maintenance

- review fixtures when prompts change (version bump)
- add new fixtures for new edge cases discovered in production
- never delete a passing fixture without justification
- fixtures are checked into git and versioned with the codebase

