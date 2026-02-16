# changelog

This changelog tracks changes to the project specification and llm behavior contracts.

It is intentionally lightweight and review focused.

Do not log routine code refactors here unless they materially affect:
- scope
- milestone outcomes
- safety rules
- prompt schemas
- test gates
- decisions

---

## format

Each entry should include:
- date
- change type
- files touched
- summary
- rationale
- risk and impact
- follow-up tasks (if any)

---

## change types

- added
- changed
- deprecated
- removed
- fixed

---

## entries

### 2026-02-14
change type: added
files: spec/*, tasks/*, architecture/*, docs/*, packages/*, manual-fixtures/*
summary: initial project scaffold generated from bootstrap interview
rationale: establish project operating system for AI Tour Guide
risk and impact: low risk, establishes foundation
follow-up tasks: begin milestone A execution

### 2026-02-14 (Milestone A Complete)
change type: added
files: packages/backend/src/**, packages/mcp/src/**, packages/frontend/src/**, packages/shared/src/**
summary: Milestone A — Foundation + Core Discovery completed. All 10 tasks done.
rationale: Core discovery workflow operational — snap photo, identify landmark, generate guide content, display results with caching and clarification UI.
risk and impact: low risk, all 71 tests passing (10 shared + 30 mcp + 31 backend)
key deliverables:
  - Monorepo scaffold with 4 packages (shared, backend, frontend, mcp)
  - PostgreSQL schema with Prisma (User, Landmark, GuideContent, Ad, Prompt, etc.)
  - JWT auth with dev-login flow, middleware, and role-based access
  - Camera capture screen (expo-camera + expo-location)
  - Results display screen with facts, fun facts, ads, sharing
  - Clarification UI for uncertain landmark identification
  - POST /snap API with LLM orchestration and DB caching
  - Prompt seed script (--activate, --dry-run, --prompt filter)
  - LLM provider-agnostic adapter with OpenAI implementation
  - Prompt registry with fragment injection and version management
  - Manual fixtures with schema validation tests
follow-up tasks: begin milestone B (TTS Narration + Multi-Lingual)

