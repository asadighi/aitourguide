# Architectural and Product Decisions

## Purpose

This document records **explicit decisions** made during development.

The goal is to:
- Avoid revisiting settled debates
- Preserve original intent
- Provide context for future changes
- Enable fast onboarding of collaborators later

Decisions are binding unless explicitly reversed with a new entry.

---

## Decision Format

Each decision includes:
- Context
- Decision
- Rationale
- Consequences

---

## Decision 001 – Frontend Framework: React Native (Expo)

### Context
The app requires live camera view, instant photo capture, device shortcuts, TTS playback, and deep social media sharing — all mobile-native features.

### Decision
Use React Native with Expo for the mobile frontend.

### Rationale
- Mobile-first requirement demands native camera and device access
- React Native shares TypeScript with the rest of the monorepo
- Expo simplifies camera, audio, and sharing APIs
- Large ecosystem and community support

### Consequences
- No web version in MVP
- Must manage Expo build pipeline
- Platform-specific code may be needed for camera/sharing edge cases

---

## Decision 002 – Backend Framework: Node.js + Express

### Context
Need a proven, simple backend to serve API endpoints for the mobile app.

### Decision
Use Node.js with Express.

### Rationale
- Boring, proven, huge ecosystem
- TypeScript throughout the monorepo
- Simple middleware model for auth, logging, request IDs
- Team familiarity and hiring pool

### Consequences
- No built-in structure (must enforce conventions manually)
- Single-threaded; CPU-intensive work should be offloaded

---

## Decision 003 – Database: PostgreSQL + Prisma ORM

### Context
Need a relational database for versioned content, ads, users, ratings, and landmarks.

### Decision
Use PostgreSQL with Prisma ORM.

### Rationale
- Postgres handles JSON fields, full-text search, and complex queries
- Prisma provides great DX, typed queries, and migration management
- Well-supported on Fly.io
- Versioned content queries are natural in relational model

### Consequences
- Prisma codegen adds a build step
- Must run migrations on deploy
- Prisma client is Node.js only (acceptable for our backend)

---

## Decision 004 – Auth: OAuth (Google + Apple Sign-In)

### Context
Three user roles (End User, Ad Provider, Admin) need authentication. Mobile-first app needs smooth login.

### Decision
Use OAuth with Google and Apple Sign-In for all roles.

### Rationale
- Native mobile login experience (Google + Apple mandatory for iOS)
- No password management burden
- Role assignment handled in our DB after OAuth
- Minimal PII collected

### Consequences
- Must implement OAuth flow for both providers
- Role assignment is a separate step from authentication
- No email/password fallback in MVP

---

## Decision 005 – Hosting: Fly.io

### Context
Need to host backend + database for a mobile app backend.

### Decision
Deploy to Fly.io.

### Rationale
- Simple deployment for Node.js apps
- Managed Postgres available
- Good latency globally
- Developer-friendly CLI and config

### Consequences
- Vendor dependency on Fly.io
- Must learn Fly.io deployment model
- File storage for TTS audio needs a solution (Fly volumes or object storage)

---

## Decision 006 – Monorepo Tooling: npm Workspaces

### Context
Need to manage 4 packages (shared, backend, frontend, mcp) in a monorepo.

### Decision
Use npm workspaces with no additional build orchestration tooling.

### Rationale
- Simplest option with zero extra dependencies
- Sufficient for 4 packages
- No learning curve beyond npm

### Consequences
- No build caching (can add Turborepo later if needed)
- Must manage build order manually
- Script orchestration via concurrently

---

## Decision 007 – Model Provider: OpenAI (Provider-Agnostic Adapter)

### Context
Need vision model for landmark identification, text generation for guide content, and TTS for narration.

### Decision
Use OpenAI (GPT-4o vision + text, OpenAI TTS) with a provider-agnostic adapter layer.

### Rationale
- GPT-4o vision is state-of-the-art for image understanding
- OpenAI TTS provides natural voice output
- Adapter pattern allows swapping providers later
- Single vendor simplifies initial integration

### Consequences
- OpenAI API costs must be monitored
- Adapter interface must be designed upfront
- TTS voice options limited to OpenAI's offerings initially

---

## Decision 008 – MCP Layout: Single Package

### Context
Need to isolate model behavior (prompts, adapters, schemas, evals) from product runtime.

### Decision
Use a single `packages/mcp` package for MVP.

### Rationale
- All LLM operations share one domain and release cadence
- Fewer moving parts early on
- Can split into mcp-core + mcp-domain later

### Consequences
- All model behavior in one package
- Must maintain clean internal boundaries for future splitting

---

## Decision 009 – Source of Truth: DB for Content, LLM for Generation

### Context
Guide content is LLM-generated but must be serveable, cacheable, and versionable.

### Decision
LLM generates content. Database is the serving authority. Content is versioned. Admin can trigger regeneration.

### Rationale
- Decouples generation from serving
- Enables caching and versioning
- Admin regeneration provides quality control
- User ratings tracked per version

### Consequences
- Need version management for guide content
- TTS must regenerate on version bump
- Cache invalidation strategy needed

---

## Decision 010 – Prompt Versioning: Files + DB Registry

### Context
Prompts need to be version-controlled, testable, and serveable at runtime.

### Decision
Store prompts as markdown files in git. Seed into database via script. Runtime loads from DB.

### Rationale
- Git provides version history and PR review
- DB provides fast runtime lookup
- Seed script bridges the two
- Fragment system enables reuse

### Consequences
- Must run seed script after prompt changes
- Two sources that must stay in sync
- Dev can fallback to file loading

---

## Decision 011 – Test Strategy: Full Pyramid + Fixture Evals

### Context
LLM-driven app needs confidence that outputs are correct and regressions are caught.

### Decision
Implement all five test layers: unit, contract, integration, E2E, and fixture-based evals.

### Rationale
- Unit tests catch logic bugs
- Contract tests enforce LLM output schemas
- Integration tests verify API and DB wiring
- E2E tests verify full user flows
- Fixture evals detect prompt regressions

### Consequences
- Higher test maintenance burden
- Must maintain fixture files
- Milestone progression gated on test suites

---

## Decision 012 – Major Decision Gate Rule

### Context
LLM assistants may make architectural choices without explicit approval.

### Decision
If a major architectural decision is not explicitly decided, the agent must stop and ask before proceeding.

### Rationale
- Prevents accidental lock-in
- Maintains human oversight on irreversible choices
- Keeps spec as authority

### Consequences
- May slow down LLM-assisted development slightly
- Ensures all major choices are recorded here

---

## Decision 013 – Automated Tests Gate Milestones

### Context
Need a clear "definition of done" for milestones.

### Decision
No milestone is complete unless all required automated tests pass.

### Rationale
- Prevents regression between milestones
- Ensures quality bar is objective
- Enables safe iteration on prompts and logic

### Consequences
- Must write tests before or during milestone work
- Flaky tests can block progress (must be fixed, not skipped)

---

## Decision 014 – Ephemeral Photo and GPS Data

### Context
User privacy for photo and location data.

### Decision
Photos are discarded after LLM processing. GPS is optionally collected for accuracy and discarded after use. Neither is stored.

### Rationale
- Minimizes privacy risk
- No PII storage beyond basic auth
- Simplifies compliance posture

### Consequences
- Cannot build user history or trip logs (explicit non-goal)
- Each snap is a fresh request
- GPS accuracy improvements are session-only

---

## Decision 015 – Multi-Lingual via Locale Parameter

### Context
Guide content must be available in multiple languages.

### Decision
Multi-lingual support is achieved by passing a locale/language parameter to all LLM prompts. Content is cached per landmark + locale. Ads are not multi-lingual.

### Rationale
- LLM can generate in any language natively
- No translation pipeline needed
- Each locale is a separate cached version
- Ads are simpler without i18n

### Consequences
- Cache size grows with number of supported locales
- Quality may vary by language (acceptable risk)
- Must specify locale in all content-generating prompts

---

## Decision 016 – Ad Matching: Deterministic Exact Landmark Match

### Context
Ads need to be shown alongside landmark content.

### Decision
Ad targeting is deterministic — ads are configured to target specific landmarks. One ad can target multiple landmarks. No model-driven relevance matching.

### Rationale
- Simple and predictable
- Ad providers explicitly choose which landmarks to target
- No risk of irrelevant AI-matched ads

### Consequences
- No "smart" ad matching
- Ad providers must know which landmarks exist
- May need landmark discovery/search for providers later

---

## Decision Review Process

Decisions may be revisited only if:
- A non-goal becomes a blocker
- Content safety or accuracy is compromised
- Core MVP usability is harmed
- MVP scope formally expands

All reversals must be documented as new decisions.

