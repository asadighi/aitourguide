# architecture pack template (optional but recommended)

If the project has non-trivial complexity, generate an `/architecture` folder (or keep architecture docs under `/spec`).

Goal: make major decisions explicit so execution doesn't drift.

Every architecture file below includes a **full structural template** showing expected sections and depth. Adapt content to the domain; preserve the structure.

---

## authority rule

If architecture docs exist, `spec/readme.md` must state whether architecture overrides implementation details, and how conflicts are resolved.

Recommended: `/spec` always overrides `/architecture`. Architecture guides implementation but does not define scope.

---

## recommended files

---

### `architecture/architecture-overview.md`

**Required sections:**

```markdown
# architecture overview

## system diagram

(Text or mermaid diagram showing major components and their relationships)

\```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend    │────▶│  Backend    │────▶│  Database   │
│  (Next.js)   │     │  (Express)  │     │  (Postgres) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    MCP      │
                    │  (Prompts)  │
                    └─────────────┘
\```

---

## package boundaries

### packages/frontend
- {{WHAT IT OWNS}}
- {{WHAT IT DOES NOT OWN}}

### packages/backend
- {{WHAT IT OWNS}}
- {{WHAT IT DOES NOT OWN}}

### packages/shared
- {{WHAT IT OWNS}}
- {{WHAT IT DOES NOT OWN}}

### packages/mcp
- {{WHAT IT OWNS}}
- {{WHAT IT DOES NOT OWN}}

---

## main request flows

### {{FLOW NAME}} (e.g., "user explores spectrum")
1. Frontend: {{ACTION}}
2. Backend: {{ACTION}}
3. MCP: {{ACTION}}
4. Response: {{ACTION}}

### {{FLOW NAME}} (e.g., "scenario generation")
1. {{STEP}}
2. {{STEP}}

(Include 3-5 main flows)

---

## failure modes

| Failure | Impact | Mitigation |
|---------|--------|------------|
| {{FAILURE}} | {{IMPACT}} | {{MITIGATION}} |

---

## cross-cutting concerns

- logging: see docs/logging-observability.md
- auth: see architecture/auth-and-security.md
- caching: {{BRIEF DESCRIPTION}}
```

---

### `architecture/tech-stack.md`

**Required sections:**

```markdown
# tech stack

## chosen stack

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Language | TypeScript | 5.x | Type safety across all packages |
| Frontend | {{FRAMEWORK}} | {{VERSION}} | {{REASON}} |
| Backend | {{FRAMEWORK}} | {{VERSION}} | {{REASON}} |
| Database | {{DATABASE}} | {{VERSION}} | {{REASON}} |
| ORM | {{ORM}} | {{VERSION}} | {{REASON}} |
| Auth | {{STRATEGY}} | - | {{REASON}} |
| Model Provider | {{PROVIDER}} | - | {{REASON}} |
| Test Runner | {{RUNNER}} | {{VERSION}} | {{REASON}} |
| Monorepo | {{TOOL}} | - | {{REASON}} |

---

## operational constraints

- hosting: {{WHERE AND HOW}}
- build: {{BUILD TOOL AND STRATEGY}}
- CI: {{CI STATUS AND PLAN}}

---

## key dependencies

List major npm packages that are architectural choices (not just utilities):
- {{PACKAGE}}: {{WHY}}
- {{PACKAGE}}: {{WHY}}

---

## alternatives considered

| Choice | Alternative | Why Not |
|--------|-------------|---------|
| {{CHOSEN}} | {{ALTERNATIVE}} | {{REASON}} |
```

---

### `architecture/data-persistence.md`

**Required sections:**

```markdown
# data persistence

## entity model

List all core entities with their key fields and relationships:

### {{Entity Name}}
- {{field}}: {{type}} – {{purpose}}
- {{field}}: {{type}} – {{purpose}}
- relationships: {{DESCRIPTION}}

(Repeat for all entities from interview Q10)

---

## invariants

- {{RULE THAT MUST ALWAYS BE TRUE}}
- {{RULE THAT MUST ALWAYS BE TRUE}}

---

## migrations strategy

- tool: {{ORM/MIGRATION TOOL}}
- workflow: {{HOW MIGRATIONS ARE CREATED AND APPLIED}}
- environments: {{DEV/STAGING/PROD DIFFERENCES}}

---

## caching strategy (if applicable)

- what is cached: {{DESCRIPTION}}
- cache key format: {{FORMAT}}
- invalidation: {{STRATEGY}}
- storage: {{WHERE – Postgres, Redis, in-memory}}

---

## backup and restore

- {{BACKUP EXPECTATIONS FOR MVP}}
```

---

### `architecture/auth-and-security.md`

**Required sections:**

```markdown
# auth and security

## auth model

- {{AUTH STRATEGY FROM INTERVIEW – anonymous, OAuth, SSO, etc.}}
- user roles: {{LIST ROLES}}
- what each role can do: {{PERMISSIONS TABLE OR LIST}}

---

## session and token strategy

- session type: {{JWT, cookie, etc.}}
- token storage: {{WHERE}}
- refresh strategy: {{HOW}}
- anonymous session handling: {{HOW}}

---

## secret management

- API keys: {{WHERE STORED – env vars, vault, etc.}}
- OAuth credentials: {{WHERE STORED}}
- database credentials: {{WHERE STORED}}

---

## redaction policy

- see docs/logging-observability.md for redaction rules
- PII fields: {{LIST}}
- never log: {{LIST}}
```

---

### `architecture/deployment-hosting.md`

**Required sections:**

> **IMPORTANT:** If deploying to Fly.io with Docker, read `agentic-guides/11-DEPLOYMENT_GUIDE.md` first. It contains critical gotchas around Prisma ESM imports, Next.js standalone output, and build-time vs runtime env vars that cause multi-hour debugging sessions if not addressed upfront.

```markdown
# deployment and hosting

## environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| local | development | localhost |
| staging | {{IF APPLICABLE}} | {{URL}} |
| production | user-facing | {{URL}} |

---

## deployment method

- platform: {{HOSTING PLATFORM}}
- deployment: {{HOW – git push, CLI, CI/CD}}
- container: Docker (multi-stage builds, separate images for frontend and backend)
- see: agentic-guides/11-DEPLOYMENT_GUIDE.md for Dockerfiles and fly.toml templates

---

## config and env var strategy

- all config via environment variables
- env.example at repo root lists all required vars
- backend secrets set via `fly secrets set` (runtime injection)
- frontend `NEXT_PUBLIC_*` vars passed as `--build-arg` at deploy time (build-time baking)
- `dotenv` in config files (next.config.ts, prisma.config.ts) loads from `../../.env` for local dev; silently no-ops in production

---

## production runtime notes

- backend uses `tsx` (not plain `node`) to handle Prisma v7's extensionless ESM imports
- `tsx` must be a production dependency (not devDependency)
- Next.js must have `output: "standalone"` in next.config.ts for Docker
- Next.js standalone output preserves monorepo path structure (server.js is at packages/frontend/server.js)
- Express listens on 0.0.0.0 by default; Next.js needs `HOSTNAME=0.0.0.0` env var in Docker

---

## database operations

- Fly Postgres internal address (*.flycast:5432) only reachable from Fly machines
- Local admin commands (prisma db push, migrations) require `fly proxy`
- Always run Prisma commands from `packages/backend/` directory (not monorepo root)

---

## scaling expectations (MVP)

- {{WHAT LEVEL OF SCALE IS EXPECTED}}
- {{WHAT IS EXPLICITLY NOT NEEDED}}
- Fly machines auto-stop after idle; first request triggers cold start (~1-3s)
- Set `min_machines_running = 1` to avoid cold starts if needed
```

---

### `architecture/llm-integration.md`

**Required sections:**

```markdown
# llm integration

## architecture

- LLM operations provided via MCP (Model Context Protocol) server
- MCP server is a separate package in the monorepo
- MCP can run embedded in backend (current) or standalone (future)
- all LLM operations go through MCP with well-defined contracts
- backend services use MCP client instead of direct LLM calls

---

## provider

- {{MODEL PROVIDER}}
- model(s): {{SPECIFIC MODELS IF KNOWN}}

---

## output format

- structured JSON outputs
- validate against schemas from spec/prompt-schemas.md
- fail closed and ask clarifying question on validation failure

---

## prompt storage

- all prompts stored as md files in packages/mcp/prompts
- versioned via filenames (v1.0.0.md, v1.1.0.md, etc)
- prompt registry maps prompt id to file path and version
- prompts seeded into database via seed-prompts script
- no hardcoded prompts in service code

---

## fragment system

- common prompt sections extracted into reusable fragments
- fragments stored in packages/mcp/prompts/_fragments/
- each prompt declares fragment dependencies via fragments.json
- fragments automatically injected during prompt rendering using {{fragment:name}} placeholders

---

## what is model-driven vs deterministic

| Operation | Model-Driven | Deterministic |
|-----------|:---:|:---:|
| {{OPERATION}} | ✓ | |
| {{OPERATION}} | | ✓ |

---

## cost and latency controls

- {{CACHING STRATEGY}}
- {{TEMPERATURE SETTINGS}}
- {{TOKEN BUDGET IF ANY}}

---

## safety

- {{SAFETY RULES FOR LLM OPERATIONS}}
- all LLM operations go through MCP with validation
- test suite ensures no regressions
```

---

### `architecture/mcp-architecture.md`

**Required sections:**

```markdown
# mcp architecture

## overview

The LLM engine is structured as an MCP server to decouple UX from LLM operations.

---

## mcp tools

Each LLM operation is exposed as an MCP tool:

- `{{tool_name}}` - {{DESCRIPTION}}
- `{{tool_name}}` - {{DESCRIPTION}}

---

## contracts

Each MCP tool has:
- defined input schema (TypeScript types)
- defined output schema (validated against spec/prompt-schemas.md)
- error handling contract
- versioning strategy

---

## prompt management

All prompts stored as MD files in packages/mcp/prompts:
- each prompt has its own directory
- versions are files (v1.0.0.md, v1.1.0.md)
- prompts seeded into database via seed-prompts script
- services use renderPromptFromRegistry to load prompts
- no hardcoded prompts in service code

Shared fragments in packages/mcp/prompts/_fragments/:
- fragment dependency system via fragments.json per prompt
- fragments automatically injected using {{fragment:name}} placeholders

---

## integration testing

Comprehensive test suite with:
- human-readable test cases
- covers all tools, scenarios, and edge cases
- can run independently via CLI
- validates against expected outputs
- catches regressions and hallucinations

---

## deployment

Current: MCP runs embedded in backend process
Future: MCP can be deployed as standalone server
```

---

## architecture README (optional)

If generating an architecture folder, include an `architecture/README.md` that lists all architecture files and states the authority relationship with `/spec`.
