# project specification index

This folder contains the authoritative specification for AI Tour Guide.

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

- landmark identification accuracy is the highest priority
- guide content must be factual, engaging, and culturally respectful
- all llm outputs must be schema-validated and cached
- content is versioned and ratable by users
- ads are human-moderated and separate from editorial content
- multi-lingual support is a core feature, not an afterthought
- photos and gps data are ephemeral — never stored
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

