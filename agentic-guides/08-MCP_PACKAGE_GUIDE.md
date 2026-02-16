# MCP packages guide (meta): isolate model behavior, support one or many MCPs

## purpose

An MCP package (or set of MCP packages) exists to:
- isolate model prompts/behaviors from product runtime code
- provide a stable interface for "AI capabilities"
- centralize schema validation, logging, redaction, and evals
- optionally expose an MCP server for tools

Think of MCP packages as **the "model OS"**:
- versioned
- tested
- observable
- safe-by-default

## one MCP vs multiple MCPs (design guidance)

You may end up with **multiple MCP packages**. This document is **meta-guidance** for each MCP package and for deciding when to split.

Good reasons to have multiple MCP packages:
- different **domains** or tool surfaces with different release cadence
- different **trust boundaries** (some tools are read-only vs side-effecting)
- different **providers/models** or runtime constraints
- different **consumers** (internal vs external) with different contracts

Reasons to keep a single MCP package (at first):
- fewer moving parts early on
- shared abstractions still changing
- low tool count, one cohesive surface area

Rule of thumb:
- start with one MCP package unless you already have clear boundaries
- split when teams/constraints diverge or when accidental coupling causes regressions

## recommended modular layout (works with one or many MCPs)

Option A (simple): one package
- `packages/mcp`

Option B (scales better): core + domain MCPs
- `packages/mcp-core` (shared runtime: logging, redaction, schema validation, provider adapters, eval runner)
- `packages/mcp-<domain>` (domain prompts/tools; depends on `mcp-core` + `shared`)

Dependency rule (recommended):
- `mcp-core` can depend on `shared`
- `mcp-<domain>` can depend on `mcp-core` and `shared`
- MCP packages should not depend on `backend` or `frontend` (keep boundaries clean)

Naming guidance:
- use `mcp-<domain>` or `mcp-<product-area>` (e.g. `mcp-support`, `mcp-billing`, `mcp-search`)

## recommended boundaries (per MCP package)

Each MCP package SHOULD contain (as applicable):
- prompt registry (IDs, versions, templates, expected schema)
- provider adapters (OpenAI/Anthropic/etc.) behind a common interface
- schema validation utilities (Zod/JSON schema)
- redaction utilities
- eval harness + fixture runner
- tool schemas and tool implementations (if using MCP)

Each MCP package SHOULD NOT contain:
- database access
- direct mutations of external systems
- UI code
- business logic that belongs to backend/domain

## prompt management system (critical infrastructure)

All LLM interactions must go through a structured prompt system. **No hardcoded prompts in service code.**

### prompt directory structure

```
packages/mcp/
  prompts/
    README.md
    _fragments/
      README.md
      {{fragment_name}}.md
    {{tool_name}}/
      README.md
      fragments.json
      v1.0.0.md
```

### prompt file format

Each prompt file follows this structure:

```markdown
# {{Tool Name}} Prompt v1.0.0

## Description
Brief description of what this prompt does and when it's used.

## Schema Type
The expected output schema type (must match a schema from spec/prompt-schemas.md):
- {{schema_name}}

## System Prompt

{{SYSTEM PROMPT TEXT}}

## Prompt Content

{{PROMPT TEXT}}

You can use {{variable_name}} syntax for variable injection.
You can use {{fragment:fragment_name}} for shared fragment injection.

Respond with a JSON object matching this schema:
\```json
{{SCHEMA SHAPE}}
\```
```

### fragment dependency system

Prompts can declare dependencies on shared fragments to maximize reuse and consistency.

**Creating fragments:**

1. Create a new file in `prompts/_fragments/{fragment_name}.md`
2. Include variable placeholders (e.g., `{{user_timezone}}`) as needed
3. Document the fragment in `_fragments/README.md`

**Using fragments in prompts:**

1. Create `fragments.json` in your prompt directory:

```json
{
  "fragments": [
    "safety_rules",
    "style_and_language_rules"
  ]
}
```

2. Use `{{fragment:name}}` placeholders in your prompt:

```markdown
## Prompt Content

Your prompt introduction here.

{{fragment:safety_rules}}

{{fragment:style_and_language_rules}}

Your specific instructions here.
```

3. Fragments are automatically injected during prompt rendering by the fragment loader utility.

**Common fragment examples:**
- `safety_rules` - content safety constraints and refusal rules
- `style_and_language_rules` - i18n/locale rules, output style, language selection
- `context_information` - user context, session data, current state
- `important_rules` - cross-cutting rules all prompts must follow

### prompt versioning

- **Folder name** = `promptId` (e.g., `scenario_generate`)
- **File name** = `v{version}.md` (e.g., `v1.0.0.md`, `v1.1.0.md`)
- **Version format**: Semantic versioning (major.minor.patch)
  - Patch (1.0.1): Minor fixes, typos
  - Minor (1.1.0): Small improvements, clarifications
  - Major (2.0.0): Significant changes, new structure
- All prompts are committed to git (version control everything)
- Prompt changes require snapshot review and passing contract tests

### seed script pattern

Prompts are stored as files and seeded into the database for runtime lookup:

```bash
# Seed all prompts from prompts/ directory into database
npm run seed:prompts

# Seed and activate latest versions
npm run seed:prompts -- --activate

# Seed specific prompt only
npm run seed:prompts -- --prompt=scenario_generate

# Seed specific version only
npm run seed:prompts -- --version=1.0.0

# Combine options
npm run seed:prompts -- --prompt=scenario_generate --version=1.0.0 --activate
```

The seed script:
- Scans `prompts/` directory for all prompt folders (skipping `_fragments/`)
- Reads each version file
- Extracts metadata (description, schema type)
- Upserts into database table (prompt_id, version, content, schema_type, is_active)
- Optionally activates the latest version

### prompt rendering at runtime

Services call `renderPromptFromRegistry(promptId, variables, options)`:

1. Load the active version of the prompt from DB (or file fallback for dev)
2. Load fragment dependencies from `fragments.json`
3. Resolve `{{fragment:name}}` placeholders by loading fragment files from `_fragments/`
4. Replace `{{variable}}` placeholders with provided values
5. Return the rendered prompt string + metadata (version, schema expected)

**Key rule:** No service code ever constructs prompts directly. Everything goes through the registry.

### CLI testing pattern

Each MCP tool can be tested independently via CLI without UI:

```bash
# Call a specific tool with a fixture input
cd packages/mcp && npm run cli -- call {{tool_name}} --input-file ../../manual-fixtures/{{tool_name}}_input.json --verbose
```

The CLI:
- Loads the tool definition
- Renders the prompt from registry
- Calls the LLM provider
- Validates the output against the expected schema
- Prints the result (with verbose flag showing full prompt + response)

This enables:
- Testing prompts without running the full backend/frontend
- Quick iteration on prompt changes
- Debugging schema validation failures
- Manual smoke testing before deploying

## interfaces (recommendation)

Expose a small public API, e.g.:
- `runPrompt(promptId, vars, options) -> { output, meta }`
- `validateOutput(schemaId, output) -> { ok, error }`
- `listPrompts() -> { id, version, schema }[]`
- `renderPromptFromRegistry(promptId, vars) -> string`

## logging requirements

Every model/tool call must emit:
- request log (prompt/tool id, vars summary, schema expected)
- response log (latency, schema validation result, safe output summary)

Apply redaction before writing logs.

See `agentic-guides/06-LOGGING_OBSERVABILITY_STANDARD.md` for the full logging standard.

## testing requirements

- unit: schema validation + redaction
- integration: fixture runner for each critical prompt/tool
- regression: golden outputs for "contract" prompts

### fixture-based eval harness

The eval harness (minimum viable):
- loads each `*_input.json` from `manual-fixtures/`
- runs the target prompt/tool
- validates output against JSON schema (from `spec/prompt-schemas.md`)
- compares to `*_expected.json` (exact match or "stable subset" match)

For model-based outputs:
- enforce schemas
- keep temperatures low for "contract" outputs
- prefer extraction/classification schemas with bounded vocab
- allow free-text only where strictly needed and test it with looser assertions

See `agentic-guides/07-FIXTURES_AND_EVAL_STANDARD.md` for the full fixture standard.

## optional MCP server (per MCP package)

If you choose to run a real MCP server:
- keep it inside the MCP package that owns the tool surface (e.g. `packages/mcp`)
- define tool contracts in code + docs
- keep tools pure (no direct side effects unless explicitly designed)
- require explicit confirmation flows for any mutations

### deployment

Current: MCP runs embedded in backend process
Future: MCP can be deployed as standalone server
- Designed for independent deployment
- Health check endpoint
- Monitoring and observability hooks
- Configuration via environment variables

## MCP package README template

Each MCP package should have a README with:

```markdown
# {{package-name}}

## Overview
What this MCP package does and what domain it covers.

## Tools
List of MCP tools with brief descriptions.

## Prompts
List of prompts in the registry with schema references.

## Fragments
List of shared fragments and what they provide.

## Testing
How to run tests (unit, integration, CLI manual testing).

## Configuration
Required environment variables (API keys, model selection, etc.)
```
