# reusable output schemas (project-agnostic)

These schemas are intended for **bootstrap + planning outputs** (not your domain runtime outputs).

Principles:
- prefer **boring JSON** over prose when decisions/tasks are involved
- keep schemas stable; extend carefully
- outputs must be valid JSON (no trailing comments)

---

## project brief schema

```json
{
  "project_name": "string",
  "one_liner": "string",
  "users": ["string"],
  "top_workflows": [
    {
      "name": "string",
      "steps": ["string"]
    }
  ],
  "mvp_success_criteria": ["string"],
  "goals": ["string"],
  "non_goals": ["string"],
  "constraints": {
    "security_privacy": ["string"],
    "latency_cost": ["string"],
    "compliance": ["string"]
  },
  "integrations": [
    {
      "name": "string",
      "direction": "inbound | outbound | bidirectional",
      "criticality": "p0 | p1 | p2",
      "notes": "string"
    }
  ],
  "core_entities": ["string"],
  "source_of_truth": [
    {
      "domain": "string",
      "system": "string",
      "notes": "string"
    }
  ],
  "open_decisions": [
    {
      "id": "string",
      "decision": "string",
      "options": ["string"],
      "recommendation": "string",
      "why": "string"
    }
  ],
  "chosen_stack": {
    "language": "string",
    "frontend": "string",
    "backend": "string",
    "database": "string",
    "auth": "string",
    "hosting": "string",
    "monorepo_tooling": "string",
    "package_manager": "npm | pnpm | yarn",
    "test_stack": "string"
  },
  "repo_conventions": {
    "workspaces": true,
    "typescript": true,
    "strict_typing": true,
    "logging_standard": "string",
    "fixture_standard": "string"
  }
}
```

---

## milestone metadata schema

```json
{
  "milestone_id": "string",
  "milestone_name": "string",
  "status": "planned | in-progress | completed | blocked",
  "current_focus_task_id": "string | null",
  "started_at": "yyyy-mm-dd | null",
  "completed_at": "yyyy-mm-dd | null",
  "definition_of_done": ["string"],
  "test_gate": {
    "required": true,
    "suite_name": "string",
    "last_run_at": "iso-8601 string | null",
    "last_result": "pass | fail | null"
  },
  "notes": ["string"]
}
```

---

## task schema (for tasks/milestone files)

```json
{
  "task_id": "string",
  "title": "string",
  "status": "planned | in-progress | blocked | completed",
  "priority": "low | medium | high",
  "estimated_sessions": 1,
  "depends_on": ["string"],
  "subtasks": ["string"],
  "acceptance_criteria": ["string"],
  "tests_required": ["string"],
  "progress_log": [
    {
      "timestamp": "yyyy-mm-dd",
      "entry": "string"
    }
  ],
  "error": "string | null"
}
```

---

## scaffold plan schema (optional but recommended)

```json
{
  "repo_root_files": ["string"],
  "packages": [
    {
      "name": "shared | backend | frontend | mcp",
      "path": "string",
      "responsibilities": ["string"],
      "public_api": ["string"],
      "depends_on": ["string"]
    }
  ],
  "tooling": {
    "linting": "string",
    "formatting": "string",
    "typecheck": "string",
    "test": "string",
    "ci": "string"
  },
  "first_milestone": {
    "id": "string",
    "why_first": "string"
  }
}
```


