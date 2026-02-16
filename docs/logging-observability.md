# logging + observability standard

## principles

- **structured logs** only (JSON via pino), no ad-hoc strings for important events
- **correlation ids** everywhere (request_id, session_id)
- **redaction** by default for secrets + PII
- **prompt IO is logged** (inputs/outputs) with strict redaction rules
- logs must be easy to diff and archive

---

## required log fields (baseline)

For every log event:
- `ts` (iso-8601)
- `level` (`debug|info|warn|error`)
- `service` (`backend|frontend|mcp`)
- `event` (string identifier, e.g., `snap.request`, `llm.request`, `ad.approved`)
- `message` (short human string)
- `request_id` (string|null)
- `session_id` (string|null)
- `user_id` (string|null)
- `meta` (object; must be JSON-serializable)

---

## redaction rules

Must never be logged:
- auth tokens, API keys, passwords
- raw OAuth codes or tokens
- full image data (base64)
- full request/response bodies unless explicitly allowed and scrubbed

Recommended:
- log **hashes** or **last 4** for identifiers when possible
- log image size/dimensions instead of image content
- keep "safe summaries" for prompt inputs (landmark name, locale, not raw image)

---

## prompt logging (LLM observability)

When a model call happens, log two events:

### `llm.request`
- prompt_id, prompt_version
- model name/provider
- temperature/top_p
- input variables (redacted — no raw images, no PII)
- schema name expected

### `llm.response`
- latency_ms
- output (redacted if needed — landmark name + confidence, not full content)
- schema_validation_result (pass/fail + error message)
- token usage if available

---

## TTS logging

### `tts.request`
- narration_script_length (chars)
- voice_id
- locale
- guide_content_id

### `tts.response`
- latency_ms
- audio_duration_ms
- file_path
- cache_hit (boolean)

---

## file layout (local dev)

- `logs/services/backend/<yyyy-mm-dd>.jsonl`
- `logs/mcp/<tool_name>/<yyyy-mm-dd>.jsonl`

JSONL (one JSON object per line) is preferred for append-only logs.

In production on Fly.io, logs go to stdout and are collected by Fly's log aggregation.

---

## error handling

Errors should be:
- categorized (`user_error` vs `system_error` vs `dependency_error`)
- include `recoverable: true|false`
- include an actionable `next_step` in meta

Example:
```json
{
  "ts": "2026-02-14T10:30:00Z",
  "level": "error",
  "service": "backend",
  "event": "llm.response.validation_failed",
  "message": "LLM output failed schema validation",
  "request_id": "req-abc123",
  "user_id": "usr-xyz",
  "meta": {
    "prompt_id": "landmark_identify",
    "prompt_version": "1.0.0",
    "schema": "landmark_identification.v1",
    "error_type": "system_error",
    "recoverable": true,
    "next_step": "retry with lower temperature or return clarification_required"
  }
}
```

---

## implementation

- Use `pino` for structured JSON logging in backend
- Use request-id middleware to inject `request_id` into all logs
- Create a shared logger factory in `packages/shared` or `packages/backend`
- Frontend logging is console-based for MVP (no structured log shipping)

