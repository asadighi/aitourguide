# logging + observability standard (reusable)

Goal: make LLM-driven systems debuggable, auditable, and safe.

## principles

- **structured logs** only (JSON), no ad-hoc strings for important events
- **correlation ids** everywhere (request_id, trace_id, session_id, task_id)
- **redaction** by default for secrets + PII
- **prompt IO is logged** (inputs/outputs) with strict redaction rules
- logs must be easy to diff and archive

## required log fields (baseline)

For every log event:
- `ts` (iso-8601)
- `level` (`debug|info|warn|error`)
- `service` (backend|frontend|mcp|worker)
- `event` (string identifier)
- `message` (short human string)
- `request_id` (string|null)
- `session_id` (string|null)
- `user_id` (string|null)
- `meta` (object; must be JSON-serializable)

## redaction rules

Must never be logged:
- auth tokens, API keys, passwords
- raw OAuth codes
- full request/response bodies unless explicitly allowed and scrubbed

Recommended:
- log **hashes** or **last 4** for identifiers when possible
- keep “safe summaries” for prompt inputs when containing PII

## prompt logging (LLM observability)

When a model call happens, log two events:

- `llm.request`
  - prompt_id, prompt_version
  - model name/provider
  - temperature/top_p
  - input variables (redacted)
  - schema name expected

- `llm.response`
  - latency_ms
  - output (redacted if needed)
  - schema_validation_result (pass/fail + error)
  - token usage if available

## file layout (suggested for local dev)

- `logs/services/<service>/<yyyy-mm-dd>.jsonl`
- `logs/mcp/<tool_or_prompt>/<yyyy-mm-dd>.jsonl`

JSONL (one JSON object per line) is preferred for append-only logs.

## error handling

Errors should be:
- categorized (user_error vs system_error vs dependency_error)
- include `recoverable: true|false`
- include an actionable `next_step` in meta


