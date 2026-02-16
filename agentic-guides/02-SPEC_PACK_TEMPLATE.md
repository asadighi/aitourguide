# spec pack template (what to generate into `/spec`)

This is a template + checklist for generating a `/spec` folder that governs an LLM-driven project.

Every spec file below includes a **full structural template** showing expected sections and depth. Adapt content to the domain; preserve the structure.

## authority order (recommended)

1. `spec/goals.md`
2. `spec/non-goals.md`
3. `spec/decisions.md`
4. `spec/changelog.md`
5. `spec/master-project-plan.md`
6. `spec/tests.md`
7. `spec/llm-system-prompt.md`
8. `spec/prompt-schemas.md`
9. `spec/llm-context-loading.md`

If you change this authority order, document it in `spec/readme.md`.

---

## required files (minimum viable spec pack)

---

### `spec/readme.md`

This is the entry point for all humans and LLMs consuming the spec. It must be comprehensive.

**Required sections:**

```markdown
# project specification index

This folder contains the authoritative specification for {{PROJECT_NAME}}.

All product intent, scope, architectural decisions, and validation rules live here.

This readme is the entry point for humans and llms consuming the project specification.

---

## how to use this folder as context

When using an llm to assist with this project:
- always include this readme first
- include additional files from this folder as needed
- follow the authority rules defined below

This specification is intentionally document-driven.

---

## specification files

### goals.md
Defines why this project exists and what success looks like.

---

### non-goals.md
Defines explicit exclusions and scope boundaries.

---

### decisions.md
Records binding architectural and product decisions.

New decisions must be appended, not rewritten.

---

### master-project-plan.md
Defines what to build and when.

Includes:
- milestones
- task breakdowns
- milestone-scoped ui descriptions
- success criteria
- required test gates

---

### tests.md
Defines what must never break.

Includes:
- test strategy
- required automated test cases per milestone
- regression gates

---

## llm control and execution artifacts

### llm-system-prompt.md
Defines the role, constraints, and behavior of the llm.

This file should be prepended to all llm interactions.

---

### changelog.md
Tracks changes to the project specification and llm behavior contracts.

Used to review scope evolution, detect hallucinations, and preserve historical intent.

---

### prompt-schemas.md
Defines strict json schemas for all llm outputs.

All structured llm output must conform to these schemas.

---

### llm-context-loading.md
Defines which spec files to load for different llm tasks.

Used to avoid under- or over-loading llm context.

---

## technical architecture context

Technical stack and architecture constraints live outside this folder.

See:
- /architecture

Architecture files guide implementation but do not override /spec.
If there is a conflict, /spec overrides /architecture.

---

## authority order

In case of conflict between documents, follow this order:

1. goals.md
2. non-goals.md
3. decisions.md
4. changelog.md
5. master-project-plan.md
6. tests.md
7. llm-system-prompt.md
8. prompt-schemas.md
9. llm-context-loading.md

Higher documents override lower ones.

---

## core principles summary

- {{LIST 5-10 DOMAIN-SPECIFIC PRINCIPLES FROM INTERVIEW}}
- llm is used for reasoning and generation, not storage
- automated tests gate milestone progression

---

## changing the specification

When making changes:
1. validate against goals.md and non-goals.md
2. record new decisions in decisions.md
3. update milestones or tasks in master-project-plan.md
4. add or update tests in tests.md
5. update llm control artifacts if behavior changes

Changes that violate the authority order are invalid.

---

## execution task tracking

Execution level technical tasks are tracked outside this folder.

See:
- /tasks/tasks-index.md

See /tasks/readme.md for task workflow and editing rules.

Task files under /tasks:
- are derived from master-project-plan.md
- track implementation progress and state
- are not authoritative for scope or decisions

If there is a conflict, spec files override task files.

---

## status

This specification defines the mvp phase of the project and is considered active and binding.
```

---

### `spec/goals.md`

Must include a primary goal with an explicit failure condition, supporting goals with detail, success metrics, non-metrics, and a goal review policy.

**Required sections:**

```markdown
# Project Goals

## Primary Goal

{{ONE PARAGRAPH DESCRIBING THE CORE PURPOSE}}

If {{FAILURE CONDITION}}, the project has failed.

---

## Supporting Goals

### 1. {{GOAL NAME}}
- {{SPECIFIC BULLET}}
- {{SPECIFIC BULLET}}

### 2. {{GOAL NAME}}
- {{SPECIFIC BULLET}}
- {{SPECIFIC BULLET}}

### 3. {{GOAL NAME}}
- {{SPECIFIC BULLET}}
- {{SPECIFIC BULLET}}

(Include 4-6 supporting goals. Each should be testable or falsifiable.)

---

## Success Metrics

The MVP is successful if:

- Users can:
  - {{CONCRETE USER ACTION}}
  - {{CONCRETE USER ACTION}}

- System:
  - {{SYSTEM CORRECTNESS CRITERION}}
  - {{SYSTEM CORRECTNESS CRITERION}}

- Development:
  - All milestone test suites pass consistently
  - Prompt changes do not silently alter behavior

---

## Non-Metrics

This project explicitly does NOT optimize for:
- {{THING NOT OPTIMIZED FOR}}
- {{THING NOT OPTIMIZED FOR}}

---

## Goal Review Policy

Goals are considered stable for the duration of the MVP.

Goals may only be changed if:
- {{CONDITION THAT JUSTIFIES REVISITING}}
- Core usability is blocked
- Project scope formally expands beyond MVP
```

---

### `spec/non-goals.md`

Must include categorized exclusions across multiple dimensions, plus a scope review trigger section.

**Required sections:**

```markdown
# Non-Goals and Explicit Exclusions

## Purpose

This document defines what this MVP is **not** trying to do.

These non-goals exist to:
- Prevent scope creep
- Protect development velocity
- Avoid premature optimization
- Maintain focus on core functionality

Anything listed here is explicitly out of scope unless this document is updated.

---

## Product Scope Non-Goals

The MVP is NOT:
- {{EXCLUSION}}
- {{EXCLUSION}}

The MVP is a **{{ONE LINE DESCRIPTION}}**, nothing more.

---

## Content and Safety Non-Goals

Explicitly excluded:
- {{SAFETY EXCLUSION}}
- {{SAFETY EXCLUSION}}

---

## UX and Design Non-Goals

Explicitly excluded:
- Visual polish beyond functional clarity
- Animations beyond basic transitions
- Design systems
- Theming
- Accessibility optimization beyond basic semantic HTML
- {{ADDITIONAL IF APPLICABLE}}

UI exists to validate functionality.

---

## Platform and Integration Non-Goals

Not included in MVP:
- {{PLATFORM EXCLUSION}}
- {{PLATFORM EXCLUSION}}

---

## AI and Intelligence Non-Goals

Explicitly excluded:
- Emotional intelligence or personality
- Long-term user modeling
- Recommendation systems
- Proactive suggestions without user input
- {{DOMAIN SPECIFIC EXCLUSION}}

LLM is reactive and user-driven.

---

## Data and Sync Non-Goals

Not included:
- {{DATA EXCLUSION}}
- {{DATA EXCLUSION}}

---

## Security and Compliance Non-Goals

Deferred intentionally:
- SOC2
- HIPAA
- GDPR tooling beyond basic PII avoidance
- Enterprise SSO
- {{ADDITIONAL IF APPLICABLE}}

Basic security hygiene is sufficient for MVP.

---

## Performance and Scale Non-Goals

Out of scope:
- High concurrency support
- Horizontal scaling
- Multi-region deployments
- Sub-second latency guarantees
- {{ADDITIONAL IF APPLICABLE}}

---

## Testing Non-Goals

Explicitly excluded:
- Full browser matrix testing
- Load testing
- Chaos engineering
- Penetration testing

Testing is correctness-focused, not scale-focused.

---

## What Triggers a Scope Review

Only the following justify revisiting non-goals:
- Repeated user pain in core flow
- System instability caused by exclusion
- Clear blocker to MVP usability
- Decision to move beyond MVP
- {{DOMAIN SPECIFIC TRIGGER}}

Anything else is deferred by default.
```

---

### `spec/decisions.md`

Must use a consistent decision format with Context/Decision/Rationale/Consequences. Include all bootstrap interview choices as decisions.

**Required sections:**

```markdown
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

## Decision 001 – {{TITLE}}

### Context
{{WHY THIS DECISION WAS NEEDED}}

### Decision
{{WHAT WAS DECIDED}}

### Rationale
- {{REASON}}
- {{REASON}}

### Consequences
- {{CONSEQUENCE}}
- {{CONSEQUENCE}}

---

(REPEAT FOR EVERY DECISION FROM THE BOOTSTRAP INTERVIEW.

At minimum, generate decisions for:
- Frontend framework
- Backend framework
- Database
- Auth model
- Hosting
- Analytics
- Monorepo tooling
- Model provider
- MCP layout (single vs split)
- Source of truth vs derived data
- Prompt versioning strategy
- Test strategy
- Major decision gate rule
- Automated tests gate milestones

Each decision must be numbered sequentially.)

---

## Decision Review Process

Decisions may be revisited only if:
- A non-goal becomes a blocker
- {{DOMAIN SAFETY CONDITION}} is compromised
- Core MVP usability is harmed
- MVP scope formally expands

All reversals must be documented as new decisions.
```

---

### `spec/changelog.md`

Must include format rules, change types, and an initial entry.

**Required sections:**

```markdown
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

### {{DATE}}
change type: added
files: spec/*, tasks/*, architecture/*, docs/*, packages/*, manual-fixtures/*
summary: initial project scaffold generated from bootstrap interview
rationale: establish project operating system
risk and impact: low risk, establishes foundation
follow-up tasks: begin milestone A execution
```

---

### `spec/llm-system-prompt.md`

Must include all sections: role, governing context, changelog rule, hard constraints, major decision gate, uncertainty behavior, usage rules, output rules, and safety rules.

**Required sections:**

```markdown
# llm system prompt

## role

You are an assistant helping build {{PROJECT_NAME}}: {{ONE LINE DESCRIPTION}}.

Your job is to:
- {{PRIMARY LLM RESPONSIBILITY}}
- {{PRIMARY LLM RESPONSIBILITY}}
- respect project scope and constraints
- never {{DOMAIN SAFETY RULE}}

You are not a general assistant. You are operating inside a constrained system.

---

## governing context

This project is defined by the specification files in the `/spec` folder.

You must follow the authority order defined in `spec/readme.md`.

If there is a conflict:
- goals override all other documents
- non-goals define hard exclusions
- decisions are binding unless explicitly reversed

---

## changelog rule

If you propose changes to any files in the `/spec` folder or to llm behavior contracts:
- you must also propose a corresponding entry for `spec/changelog.md`
- the entry must list affected files and the reason for the change
- do not assume changes are recorded automatically

Failure to include a changelog entry for spec changes is considered a violation of process.

---

## hard constraints (non-negotiable)

- {{CONSTRAINT FROM INTERVIEW}}
- {{CONSTRAINT FROM INTERVIEW}}
- never invent features not defined in the spec
- never assume user intent when ambiguous

---

## major decision gate

Consult /architecture context first for stack and implementation constraints.

If you encounter a major architectural decision not covered by /architecture, you must stop and ask the user to choose.

Examples include runtime and framework, database choice, auth session model, deployment architecture, background job strategy, and testing stack.

Do not proceed with implementation that depends on the decision until the user explicitly aligns.
After alignment, propose updates to spec/decisions.md and spec/changelog.md.

---

## uncertainty behavior

When uncertain:
- present multiple plausible interpretations or options
- include confidence bands where requested
- ask for clarification only when necessary for correctness
- never hallucinate data; if information is missing, say so

---

## llm usage rules

You are used for:
- {{TASK FROM INTERVIEW Q21}}
- {{TASK FROM INTERVIEW Q21}}

You are NOT used for:
- storage or state authority
- background execution
- guessing missing data
- {{DOMAIN SPECIFIC EXCLUSION}}

---

## output rules

- all structured outputs must be valid json
- outputs must conform to schemas defined in `spec/prompt-schemas.md`
- do not mix free text with structured output
- if output does not validate, return a `clarification_required` or `error` schema output

---

## safety rules

- {{SAFETY RULE FROM INTERVIEW Q7/Q22}}
- {{SAFETY RULE FROM INTERVIEW Q7/Q22}}
- when unsure, stop and ask

Failure to follow these rules is a critical error.
```

---

### `spec/prompt-schemas.md`

Must include at minimum: `error`, `clarification_required`, and at least one domain-specific output schema.

Format:
- document each schema as a JSON shape
- note that runtime validation is via Zod in `packages/shared`
- include version in the schema name (e.g., `error.v1`)

---

### `spec/master-project-plan.md`

Must include project goal, core principles, milestone overview table, then **detailed milestone sections** each with Outcome, Tasks, UI (Milestone-Scoped), Success Criteria, and Critical Automated Tests.

**Required sections:**

```markdown
# {{PROJECT_NAME}} – Master Project Plan

## Project Goal

{{PARAGRAPH DESCRIBING MVP PURPOSE}}

The system allows a user to:
- {{CAPABILITY}}
- {{CAPABILITY}}

This MVP prioritizes **{{PRIMARY VALUE}}** over {{DEFERRED VALUE}}.

---

## Core Principles

- UI exists from day one, but only as a validation surface
- {{PRINCIPLE FROM INTERVIEW}}
- {{PRINCIPLE FROM INTERVIEW}}
- LLM is used for reasoning and generation, not storage
- Every milestone introduces automated regression tests

---

## Milestone Overview

| Milestone | Name | Outcome |
|---------|------|--------|
| A | {{NAME}} | {{ONE LINE OUTCOME}} |
| B | {{NAME}} | {{ONE LINE OUTCOME}} |
| ... | ... | ... |

---

## Milestone A – {{NAME}}

### Outcome
{{WHAT IS TRUE WHEN THIS MILESTONE IS DONE}}

### Tasks
- [ ] {{TASK}}
- [ ] {{TASK}}

### UI (Milestone-Scoped)
- {{MINIMAL UI NEEDED TO VALIDATE}}

### Success Criteria
- {{OBSERVABLE CRITERION}}
- {{OBSERVABLE CRITERION}}

### Critical Automated Tests
- {{TEST NAME/DESCRIPTION}}
- {{TEST NAME/DESCRIPTION}}

---

(REPEAT FOR EACH MILESTONE)

---

## Notes

This document is the master plan.
All feature work must map to a milestone.
No milestone advances without passing its automated test suite.
```

---

### `spec/tests.md`

Must include a 4-layer test pyramid, per-milestone test gates, prompt testing rules, how-to-run section, and test philosophy.

**Required sections:**

```markdown
# Test Strategy and Regression Suite

## Purpose

This document defines the automated testing strategy for {{PROJECT_NAME}}.

The goal of this test suite is to:
- Prevent regressions between milestones
- {{DOMAIN SAFETY REASON}}
- Allow safe iteration on prompts and logic
- Enable confident refactoring

No milestone is considered complete unless all required tests pass.

---

## Test Pyramid

Tests are organized into four layers.

### 1. Unit Tests
Pure logic. No network. No LLM.

Examples:
- {{DOMAIN EXAMPLE}}
- Schema validation (Zod)
- Prompt rendering and fragment injection

Fast, deterministic, and required for all logic-heavy code.

---

### 2. Contract Tests
Ensure LLM outputs match strict schemas.

These tests:
- Mock the LLM
- Validate JSON outputs
- Enforce prompt contracts

No prompt change is allowed without passing contract tests.

---

### 3. Integration Tests
Verify correct interaction with external systems.

Includes:
- Backend API endpoints
- Database wiring
- MCP fixture validation against schemas
- Auth flows (mocked)

---

### 4. End-to-End Tests
Minimal happy-path flows.

Purpose:
- Verify major user journeys
- Catch wiring issues between layers

These tests are intentionally few and stable.

---

## Milestone Test Gates

Each milestone has mandatory test categories.

### Milestone A – {{NAME}}

Required tests:
- {{TEST}}
- {{TEST}}

Failure of any test blocks progression.

---

(REPEAT FOR EACH MILESTONE)

---

## Prompt Testing Rules

- All LLM outputs must be valid JSON
- All outputs must validate against schemas
- Prompt changes require snapshot review
- {{DOMAIN SAFETY TEST RULE}}

Violations are considered critical failures.

---

## How to Run

(Include actual commands: npm test, npm run test:milestone-a, etc.)

---

## Test Philosophy

If a bug is found in production:
- A test is written first
- The test must fail before the fix
- The test must pass after the fix

No exceptions.
```

---

### `spec/llm-context-loading.md`

Must include task-specific sections, each listing which files to load.

**Required sections:**

```markdown
# llm context loading guide

This document defines which spec files to load for different llm tasks.

---

## general rule

Always load:
- spec/readme.md

---

## implementation work

Load the relevant architecture context from /architecture, plus:
- spec/decisions.md
- spec/tests.md
- spec/prompt-schemas.md when llm output contracts are involved

Prefer loading only the needed architecture files, not the entire folder.

---

## feature design or changes

Load:
- goals.md
- non-goals.md
- decisions.md
- master-project-plan.md

---

## prompt editing or debugging

Load:
- llm-system-prompt.md
- prompt-schemas.md
- tests.md
- decisions.md

---

## bug fixing

Load:
- tests.md
- decisions.md
- the relevant architecture file

---

## test writing

Load:
- tests.md
- prompt-schemas.md
- decisions.md

---

## refactoring

Load:
- decisions.md
- tests.md
- the relevant architecture file

---

## rule

Do not overload context.
Only include files relevant to the task.

---

## execution and daily work

When selecting or executing implementation tasks, load:
- /tasks/tasks-index.md
- the active milestone task file under /tasks

Do not load task files for:
- scope definition
- architectural decisions
- non goal evaluation

Tasks do not override spec.
```

---

## recommended optional spec files

- `spec/scope-checklist.md`: quick scope sanity checks
- `spec/internal-data-model.md`: entity definitions + invariants
- `spec/observability.md`: log conventions, trace IDs, redaction
- `spec/ux.md`: milestone-scoped UX expectations

---

## template text you can reuse verbatim

### "spec change rule"

When proposing changes to any file in `/spec`, the agent must also propose:
- a `spec/changelog.md` entry listing affected files and rationale

### "major decision gate"

If a major architectural decision is not explicitly decided (runtime, framework, DB, auth, hosting, queues, testing), the agent must stop and ask the user to choose before proceeding.
