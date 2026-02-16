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

## landmark identification work

Load:
- llm-system-prompt.md
- prompt-schemas.md (landmark_identification.v1)
- architecture/llm-integration.md
- architecture/mcp-architecture.md

---

## guide content work

Load:
- llm-system-prompt.md
- prompt-schemas.md (guide_content.v1)
- architecture/llm-integration.md
- architecture/data-persistence.md (for caching/versioning)

---

## ad marketplace work

Load:
- decisions.md
- architecture/data-persistence.md
- architecture/auth-and-security.md
- tests.md

---

## tts integration work

Load:
- architecture/llm-integration.md
- architecture/mcp-architecture.md
- decisions.md

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

