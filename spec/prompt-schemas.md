# prompt output schemas

All structured LLM outputs must conform to one of these schemas. Runtime validation is via Zod in `packages/shared`.

---

## error.v1

Returned when the LLM encounters an unrecoverable error.

```json
{
  "schema": "error.v1",
  "error_type": "identification_failed | generation_failed | safety_violation | unknown",
  "message": "string",
  "recoverable": true,
  "suggested_action": "string | null"
}
```

---

## clarification_required.v1

Returned when the LLM needs more information to proceed.

```json
{
  "schema": "clarification_required.v1",
  "reason": "string",
  "options": [
    {
      "label": "string",
      "description": "string"
    }
  ],
  "original_input_summary": "string"
}
```

---

## landmark_identification.v1

Returned when the LLM identifies landmarks from an image.

```json
{
  "schema": "landmark_identification.v1",
  "landmarks": [
    {
      "name": "string",
      "confidence": 0.95,
      "location": {
        "city": "string | null",
        "country": "string | null",
        "coordinates": {
          "lat": 0.0,
          "lng": 0.0
        }
      },
      "category": "monument | building | natural | religious | historical | cultural | other",
      "brief_description": "string"
    }
  ],
  "needs_clarification": false,
  "clarification_message": "string | null"
}
```

Fields:
- `landmarks`: array of identified landmarks, ordered by confidence (max 2)
- `confidence`: 0.0–1.0 score
- `needs_clarification`: true if confidence is below threshold
- `clarification_message`: shown to user if needs_clarification is true

---

## guide_content.v1

Returned when the LLM generates guide content for a landmark.

```json
{
  "schema": "guide_content.v1",
  "landmark_name": "string",
  "locale": "string",
  "title": "string",
  "summary": "string",
  "facts": [
    {
      "heading": "string",
      "body": "string"
    }
  ],
  "narration_script": "string",
  "fun_fact": "string | null",
  "confidence_note": "string | null"
}
```

Fields:
- `summary`: 2-3 sentence overview
- `facts`: array of fact sections (3-6 items)
- `narration_script`: full text optimized for TTS reading in tour guide tone
- `fun_fact`: optional interesting tidbit
- `confidence_note`: included when content confidence is uncertain

---

## content_safety_check.v1

Returned when checking content for safety violations.

```json
{
  "schema": "content_safety_check.v1",
  "is_safe": true,
  "violations": [
    {
      "type": "political_bias | cultural_insensitivity | fabrication | offensive | other",
      "description": "string",
      "severity": "low | medium | high | critical"
    }
  ],
  "recommendation": "approve | flag_for_review | reject"
}
```

---

## social_share_content.v1

Generated content optimized for social media sharing.

```json
{
  "schema": "social_share_content.v1",
  "landmark_name": "string",
  "share_text": "string",
  "hashtags": ["string"],
  "locale": "string"
}
```

---

## schema versioning rules

- all schemas use `schema_name.v{major}` format
- breaking changes require a new major version
- all active schemas must have Zod validators in `packages/shared`
- prompt files in `packages/mcp/prompts/` reference schema names
- contract tests validate LLM outputs against these schemas

