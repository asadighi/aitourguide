# agentic-guides

This folder is a **copy-pasteable, domain-agnostic "agentic workflow kit"**.

It is **fully self-contained** — no external project references needed. Every template includes the full structural depth so the LLM generates complete, production-quality files without needing examples from other projects.

Goal: drop `agentic-guides/` into any new repo, start a fresh LLM session, run the bootstrap interview prompt, and have the LLM generate:

- a `/spec` pack (authority, scope, decisions, system prompt, schemas)
- a `/workflow` pack (routing + execution prompts)
- a `/tasks` pack (milestones + task tracking)
- a monorepo scaffold (separate `frontend`, `backend`, `shared`, and **one or more MCP packages**)
- an `/architecture` pack (system overview, tech stack, data, auth, deployment, LLM, MCP)
- standards for logging/observability and fixtures/evals

## Quick start (new project)

1. Copy this `agentic-guides/` folder into the root of a new workspace.
2. Start a new LLM session in that workspace.
3. Paste the contents of:
   - `agentic-guides/00-BOOTSTRAP_INTERVIEW_PROMPT.md`
4. Answer the interview questions.
5. When you say "generate the scaffold now", the LLM generates:
   - `/spec/*` (from `02-SPEC_PACK_TEMPLATE.md`)
   - `/workflow/*` (from `03-WORKFLOW_PROMPTS_TEMPLATE.md`)
   - `/tasks/*` (from `04-TASKS_AND_MILESTONES_TEMPLATE.md`)
   - `/architecture/*` (from `10-ARCHITECTURE_TEMPLATE.md`)
   - `/packages/{frontend,backend,shared,mcp...}/*` (from `05-MONOREPO_SCAFFOLD_PROMPT.md`)
   - `/docs/*` (from `06-LOGGING_OBSERVABILITY_STANDARD.md` + `07-FIXTURES_AND_EVAL_STANDARD.md`)
   - `/manual-fixtures/*` (from `07-FIXTURES_AND_EVAL_STANDARD.md`)
   - top-level repo files (README, tooling configs, etc.)

## File index

| File | Purpose |
|------|---------|
| `00-BOOTSTRAP_INTERVIEW_PROMPT.md` | Interview questions + generation protocol |
| `01-OUTPUT_SCHEMAS.md` | JSON schemas for project brief, milestones, tasks, scaffold plan |
| `02-SPEC_PACK_TEMPLATE.md` | **Full structural templates** for every `/spec` file (goals, non-goals, decisions, changelog, system prompt, tests, context loading, master plan) |
| `03-WORKFLOW_PROMPTS_TEMPLATE.md` | Templates for `/workflow` routing + execution prompts |
| `04-TASKS_AND_MILESTONES_TEMPLATE.md` | **Full structural templates** for `tasks/readme.md`, `tasks-index.md`, and milestone files (includes LLM interaction rules, error handling, completion rules, editing rules) |
| `05-MONOREPO_SCAFFOLD_PROMPT.md` | Monorepo structure, root package.json pattern, **prompt/fragment system**, wiring requirements |
| `06-LOGGING_OBSERVABILITY_STANDARD.md` | Structured logging, correlation IDs, redaction, prompt IO logging |
| `07-FIXTURES_AND_EVAL_STANDARD.md` | Fixture types, naming, rules, eval harness |
| `08-MCP_PACKAGE_GUIDE.md` | MCP package design, **prompt management system** (directory structure, versioning, fragments, seed script, CLI testing, rendering) |
| `09-ITERATION_WORKFLOWS.md` | Copy-paste prompts for daily LLM sessions |
| `10-ARCHITECTURE_TEMPLATE.md` | **Full structural templates** for every `/architecture` file (overview, tech stack, data, auth, deployment, LLM integration, MCP architecture) |
| `11-DEPLOYMENT_GUIDE.md` | **Production deployment playbook** for Fly.io + Docker: Dockerfiles, fly.toml, critical gotchas (Prisma ESM, Next.js standalone, build-time env vars), deployment sequence, env var reference |

## What's self-contained (no external references needed)

These templates encode the full patterns that were previously only learned by examining working projects:

- **Spec files**: Every spec file has a complete structural template showing required sections, depth, and formatting (not just a bullet list of "must include")
- **Tasks system**: Full `tasks/readme.md` content with authority/scope, task states, daily workflow, LLM interaction rules, error handling, completion rules, editing rules — ready to generate verbatim
- **Prompt/fragment system**: Complete directory structure, file format, fragment dependency (`fragments.json` + `{{fragment:name}}`), versioning (`v1.0.0.md`), seed script pattern, runtime rendering, and CLI testing
- **Architecture docs**: Full structural templates with required sections and expected depth
- **Decision format**: Consistent Context/Decision/Rationale/Consequences structure with guidance on which bootstrap decisions to record

## What to customize

- **Schemas**: `01-OUTPUT_SCHEMAS.md` (add domain-specific JSON schemas)
- **Monorepo defaults**: `05-MONOREPO_SCAFFOLD_PROMPT.md` (override stack choices)
- **Model isolation**: `08-MCP_PACKAGE_GUIDE.md` (adjust MCP boundaries)

## Design principles

- **Authority order**: goals → non-goals → decisions → architecture → tests → tasks → workflows.
- **No hidden state**: decisions live in `/spec/decisions.md`, changes logged in `/spec/changelog.md`.
- **Taskification**: milestones define outcomes + test gates; tasks define acceptance criteria + required tests.
- **Observability-first**: prompt inputs/outputs and tool calls are logged (with redaction rules).
- **Prompt-as-infrastructure**: all prompts versioned as MD files, rendered via fragment system, seeded to DB, tested via fixtures.
