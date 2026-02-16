# Test Strategy and Regression Suite

## Purpose

This document defines the automated testing strategy for AI Tour Guide.

The goal of this test suite is to:
- Prevent regressions between milestones
- Ensure landmark identification and guide content remain accurate and safe
- Allow safe iteration on prompts and logic
- Enable confident refactoring

No milestone is considered complete unless all required tests pass.

---

## Test Pyramid

Tests are organized into four layers.

### 1. Unit Tests
Pure logic. No network. No LLM.

Examples:
- Zod schema validation (all prompt output schemas)
- Prompt rendering and fragment injection
- Cache key generation
- Ad matching logic (exact landmark match)
- Content version bumping logic
- Locale parameter injection
- Review aggregation calculations

Fast, deterministic, and required for all logic-heavy code.

---

### 2. Contract Tests
Ensure LLM outputs match strict schemas.

These tests:
- Mock the LLM
- Validate JSON outputs against Zod schemas
- Enforce prompt contracts
- Verify error and clarification schemas

No prompt change is allowed without passing contract tests.

---

### 3. Integration Tests
Verify correct interaction with external systems.

Includes:
- Backend API endpoints (POST /snap, ad CRUD, review endpoints)
- Database wiring (Prisma queries, migrations)
- MCP fixture validation against schemas
- Auth flows (mocked OAuth)
- Cache hit/miss behavior
- Role-based access control

---

### 4. End-to-End Tests
Minimal happy-path flows.

Purpose:
- Verify major user journeys
- Catch wiring issues between layers

These tests are intentionally few and stable:
- Snap → identify → guide content → display
- Ad submission → admin approval → ad display
- Review submission → admin regeneration → new version

---

## Fixture-Based Eval Tests

A fifth test layer specifically for LLM prompt quality:
- Load fixture inputs from `manual-fixtures/`
- Run through prompt rendering pipeline
- Validate output against JSON schema
- Compare to expected output (stable subset match)

These tests catch:
- Schema drift from prompt changes
- Regressions in output quality
- Safety rule violations

---

## Milestone Test Gates

Each milestone has mandatory test categories.

### Milestone A – Foundation + Core Discovery

Required tests:
- Unit: Zod schema validation for landmark_identification.v1, guide_content.v1
- Contract: Mocked LLM returns valid schema outputs for landmark_identify prompt
- Contract: Mocked LLM returns valid schema outputs for guide_generate prompt
- Integration: POST /snap returns correct response structure
- Integration: Cache hit returns same content without LLM call
- Integration: Auth flow creates user with correct role
- Fixture: landmark_identify prompt produces valid output from sample fixture

Failure of any test blocks progression.

---

### Milestone B – TTS Narration + Multi-Lingual

Required tests:
- Unit: TTS request builder produces correct API payload
- Unit: Locale parameter correctly injected into prompts
- Contract: TTS cache lookup returns audio for known content version
- Integration: Full snap → content → TTS flow produces audio file
- Integration: Different locales produce different cached content

Failure of any test blocks progression.

---

### Milestone C – Ad Marketplace

Required tests:
- Unit: Ad matching returns only approved ads for correct landmarks
- Unit: Ad status transitions are valid
- Integration: Ad submission → moderation → approval → display flow
- Integration: Role-based access control blocks unauthorized routes
- Integration: Rejected ads never appear in user-facing queries

Failure of any test blocks progression.

---

### Milestone D – Content Quality Loop

Required tests:
- Unit: Content version bumping logic
- Unit: Review aggregation calculations
- Contract: Regenerated content validates against guide_content.v1
- Integration: Review submission persists and retrieves correctly
- Integration: Admin regeneration creates new version + TTS
- Integration: Old versions preserved after regeneration

Failure of any test blocks progression.

---

### Milestone E – Social Sharing + Polish

Required tests:
- Unit: Share card generation produces correct layout
- Unit: social_share_content.v1 schema validation
- Contract: Share text generation matches expected format
- Integration: Share intent constructs correct platform-specific payload

Failure of any test blocks progression.

---

## Prompt Testing Rules

- All LLM outputs must be valid JSON
- All outputs must validate against schemas in spec/prompt-schemas.md
- Prompt changes require snapshot review
- Safety rules must be tested: no politically biased, culturally insensitive, or fabricated content

Violations are considered critical failures.

---

## How to Run

```bash
# Run all tests across all packages
npm test

# Run tests for a specific milestone
npm run test:milestone-a
npm run test:milestone-b
npm run test:milestone-c
npm run test:milestone-d
npm run test:milestone-e

# Run tests for a specific package
npm test --workspace=packages/shared
npm test --workspace=packages/backend
npm test --workspace=packages/mcp

# Run fixture eval tests
npm run test:fixtures --workspace=packages/mcp
```

---

## Test Philosophy

If a bug is found in production:
- A test is written first
- The test must fail before the fix
- The test must pass after the fix

No exceptions.

