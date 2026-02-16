# monorepo scaffold prompt (frontend + backend + shared + mcp)

Use this prompt to generate a complete repo skeleton. It is intentionally opinionated, but must be adapted to user answers in the bootstrap interview.

---

## responsibilities by package

### `/packages/shared`

- shared types, schemas, validators, and utilities
- must be usable by both frontend and backend
- **no** environment-specific code (no DOM, no Node APIs unless explicitly allowed)

### `/packages/backend`

- API server, persistence layer, business logic
- integrates with external systems
- owns database migrations and data access

### `/packages/frontend`

- UI app (web)
- talks to backend via typed client
- minimal business logic; mostly presentation + orchestration

### `/packages/mcp` (or multiple MCP packages)

Purpose: isolate "model behavior" and tool definitions.

- prompt registry + versioning
- adapters to providers (OpenAI/Anthropic/etc.) behind an interface
- evaluation harness (golden fixtures, schema validation)
- optional: MCP server exposing tools to other agents/clients

If you anticipate multiple MCPs, prefer one of these layouts:
- `packages/mcp-core` + `packages/mcp-<domain>`
- multiple: `packages/mcp-<domain>` with a shared foundation in `packages/shared` (or a dedicated `mcp-core`)

---

## default stack (override if user chooses differently)

- **language**: TypeScript
- **monorepo**: npm workspaces (or pnpm if requested)
- **backend**: Node + Express (or Fastify/Nest if requested)
- **frontend**: Next.js + Tailwind (or Vite + React if requested)
- **shared**: Zod for schemas
- **testing**: Vitest (unit/integration), Playwright (e2e) optional
- **lint/format**: ESLint + Prettier
- **logging**: structured JSON logs + correlation id
- **ORM**: Prisma (or Drizzle/Kysely if requested)

---

## root package.json pattern

The root `package.json` must wire all packages together with scripts:

```json
{
  "name": "{{project-name}}",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently -n \"backend,frontend\" -c \"green,blue\" \"npm run dev --workspace=packages/backend\" \"npm run dev --workspace=packages/frontend\"",
    "dev:backend": "npm run dev --workspace=packages/backend",
    "dev:frontend": "npm run dev --workspace=packages/frontend",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces --if-present",
    "test:milestone-a": "npm run test:milestone-a --workspace=packages/backend",
    "typecheck": "tsc --build",
    "lint": "eslint ."
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "typescript": "^5.0.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

Key points:
- `"workspaces": ["packages/*"]` enables npm workspaces
- `dev` runs frontend + backend concurrently
- `test` runs across all workspaces
- milestone-specific test scripts delegate to the backend workspace
- add `test:milestone-X` scripts for each milestone

---

## prompt and fragment system (critical pattern)

This is the system for managing LLM prompts as versioned, testable infrastructure. **All LLM interactions must go through this system — no hardcoded prompts.**

### directory structure

```
packages/mcp/
  prompts/
    README.md
    _fragments/
      README.md
      style_and_language_rules.md
      safety_rules.md
      {{domain_fragment}}.md
    {{tool_name}}/
      README.md
      fragments.json
      v1.0.0.md
      v1.1.0.md
```

### prompt file format

```markdown
# {{Tool Name}} Prompt v1.0.0

## Description
Brief description of what this prompt does and when it's used.

## Schema Type
The expected output schema (must match a schema from spec/prompt-schemas.md)

## System Prompt
{{SYSTEM PROMPT TEXT}}

## Prompt Content
{{PROMPT TEXT WITH VARIABLES AND FRAGMENTS}}

You can use {{variable_name}} syntax for variable injection.
You can use {{fragment:fragment_name}} for fragment injection.
```

### fragment dependency system

Each prompt directory can include a `fragments.json` declaring which shared fragments it needs:

```json
{
  "fragments": [
    "safety_rules",
    "style_and_language_rules"
  ]
}
```

Fragments are stored in `prompts/_fragments/{{name}}.md` and injected at render time by replacing `{{fragment:name}}` placeholders in the prompt content.

### fragment file format

```markdown
## {{Fragment Name}}

{{RULES AND INSTRUCTIONS}}

Variables available: {{variable_name}}
```

### prompt versioning

- **Folder name** = `promptId` (e.g., `scenario_generate`)
- **File name** = `v{version}.md` (e.g., `v1.0.0.md`)
- **Version format**: Semantic versioning (major.minor.patch)
  - Patch (1.0.1): Minor fixes, typos
  - Minor (1.1.0): Small improvements, clarifications
  - Major (2.0.0): Significant changes, new structure

### seed script

Prompts are seeded into the database via a `seed-prompts` script:

```bash
# Seed all prompts
npm run seed:prompts

# Seed and activate latest versions
npm run seed:prompts -- --activate

# Seed specific prompt only
npm run seed:prompts -- --prompt={{tool_name}}
```

The seed script:
- Scans the `prompts/` directory for all prompt folders
- Reads each version file
- Upserts into the database (prompt_id, version, content, schema_type)
- Optionally activates the latest version

### prompt rendering at runtime

Services use a `renderPromptFromRegistry(promptId, vars)` function that:
1. Loads the active version of the prompt from DB (or file fallback)
2. Resolves `{{fragment:name}}` placeholders by loading fragment files
3. Replaces `{{variable}}` placeholders with provided values
4. Returns the rendered prompt string

---

## production / deployment readiness

When the project targets Fly.io (or Docker), the scaffold must account for production from the start. See `agentic-guides/11-DEPLOYMENT_GUIDE.md` for the full deployment playbook.

**Critical patterns to wire during scaffold:**

1. **Backend `tsx` as production dependency:** Prisma v7 generates extensionless ESM imports that break under plain `node` in ESM mode. `tsx` must be a production `dependency` (not `devDependency`), and the `start` script should use `tsx dist/index.js`.

2. **Backend start scripts:** Provide both `start` (production, no .env file) and `start:dev` (local, loads .env):
   ```json
   {
     "start": "tsx dist/index.js",
     "start:dev": "node --env-file=../../.env dist/index.js"
   }
   ```

3. **Next.js standalone output:** Add `output: "standalone"` to `next.config.ts` from the start. This is required for Docker deployment and creates a self-contained server.

4. **`NEXT_PUBLIC_*` env vars are build-time:** These are baked into the client bundle during `next build`. In Docker, they must be passed as `--build-arg` values, not runtime env vars.

5. **`dotenv` in config files is safe:** Both `next.config.ts` and `prisma.config.ts` use `dotenv` to load from `../../.env`. This silently no-ops in production where the file doesn't exist, and platform-injected env vars take precedence.

---

## scaffold requirements (must generate)

### repo root

- `package.json` with workspaces (see pattern above)
- `tsconfig.base.json`
- `.editorconfig`
- `.gitignore`
- `.dockerignore` (see `11-DEPLOYMENT_GUIDE.md`)
- `env.example`
- `README.md`
- `eslint.config.mjs`
- `docs/` folder with:
  - `docs/logging-observability.md`
  - `docs/fixtures-and-evals.md`

### packages

Each package must have:
- `package.json` (with workspace dependency references like `"@{{project}}/shared": "*"`)
- `tsconfig.json` (extending `../../tsconfig.base.json`)
- `src/` with an obvious entrypoint (`src/index.ts`)
- minimal tests folder (or `*.test.ts`)

### wiring

- shared package consumed by frontend+backend+mcp via workspace deps
- consistent path aliases (optional)
- scripts at root:
  - `dev` (runs frontend+backend)
  - `typecheck`
  - `test`
  - `lint`

### hello world requirements

The scaffold must be runnable out of the box:

1. Backend serves `/health` returning `{ status: "ok" }`
2. Frontend shows a page and calls `/health`
3. Shared exports at least one typed schema (e.g., `HealthResponse`) used by both
4. MCP exports a minimal prompt registry + schema validation function

### logging

Include a minimal logging implementation:
- request id middleware (Express or framework equivalent)
- structured JSON logs (see `agentic-guides/06-LOGGING_OBSERVABILITY_STANDARD.md`)

### fixtures

Include a minimal fixtures system:
- `manual-fixtures/` at root with a README and a sample JSON fixture pair (`*_input.json` + `*_expected.json`)
- a test that loads and validates the fixture against the shared schema

---

## generation instructions (what the LLM should output)

1. Print a file tree of the scaffold.
2. Generate full contents for all files required for a "hello world" (see above).
3. Include the prompt/fragment system skeleton in `packages/mcp`.
4. Include the logging and fixtures systems.
5. Ensure `npm install && npm run dev` works from root.
6. Ensure `npm test` runs at least one passing test per package.

Stop after generating the scaffold and ask which milestone/task to execute first.
