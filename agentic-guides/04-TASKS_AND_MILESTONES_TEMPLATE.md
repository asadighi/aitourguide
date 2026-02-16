# tasks + milestones template (what to generate into `/tasks`)

Goal: keep execution grounded in **milestones** (outcomes) and **tasks** (work units).

The format below mirrors a "milestone file" pattern:
- milestone metadata JSON
- current focus
- tasks (each task has a JSON block)

---

## required files

---

### `tasks/readme.md`

This is the full structural template. Generate it **verbatim** (adapted only for project name).

```markdown
# execution tasks

This folder contains execution-level technical tasks used to implement the project.

Task files track:
- implementation progress
- task state
- daily work focus
- errors and recovery notes

These files are meant to be read and updated iteratively by humans and llms.

---

## authority and scope

Task files are **not authoritative**.

They do not define:
- product scope
- architectural decisions
- safety rules
- milestone definitions

All authority lives in `/spec`.

If there is a conflict:
- `/spec` overrides `/tasks`

---

## structure

- `tasks-index.md`  
  Entry point linking all milestone task files.

- `tasks-milestone-*.md`  
  One file per milestone, completed linearly.

Milestones must be completed in order.

---

## task granularity

- top level tasks are sized for one coding session
- subtasks are logical implementation units
- tasks may be split or reordered within a milestone if needed

---

## task states

Each task may be in one of the following states:

- todo  
- in-progress  
- blocked  
- needs-review  
- completed  
- error  

Multiple tasks may be in-progress, but only one task may be the **current focus**.

---

## daily workflow

Typical daily flow:

1. open `tasks-index.md`
2. open the current milestone task file
3. ask the llm to propose the next focus task
4. confirm the focus task
5. llm sets `current_focus_task_id` and marks task in-progress
6. implement iteratively
7. llm appends progress_log entries
8. if blocked or error, record error summary and recommended next actions
9. on completion, mark task completed and select the next task

---

## llm interaction rules

When working with tasks, the llm may:
- propose the next focus task
- split or reorder tasks within the active milestone
- mark tasks completed automatically
- mark tasks as error or blocked with explanation

The llm must:
- update only the active milestone task file
- keep all embedded json valid
- append progress instead of overwriting history
- respect milestone ordering

---

## error handling

If a task enters the `error` state, it must include:
- a short error summary
- what was attempted
- recommended next actions

Errors are not failures. They are checkpoints.

---

## completion rules

A milestone is complete only when:
- all required tasks are completed
- the milestone test gate passes
- milestone metadata status is set to completed

Only then may work proceed to the next milestone.

---

## editing rules

- do not delete tasks; deprecate or mark completed
- do not change milestone ids
- do not change task ids once created
- record significant changes in task notes

---

## purpose reminder

These files exist to:
- reduce decision fatigue
- make progress visible
- enable safe llm assistance
- support daily execution

They are tools, not contracts.
```

---

### `tasks/tasks-index.md`

Must include checkbox-style milestone links, a JSON state block, and a daily workflow section.

**Required structure:**

```markdown
# tasks index

This file links milestone task trackers. Milestones are completed linearly.

## milestones

- [ ] [tasks-milestone-a.md](tasks-milestone-a.md) {{milestone a name}}
- [ ] [tasks-milestone-b.md](tasks-milestone-b.md) {{milestone b name}}
- [ ] [tasks-milestone-c.md](tasks-milestone-c.md) {{milestone c name}}
(etc.)

## current state

\```json
{
  "current_milestone_id": "a",
  "current_focus_task_id": null
}
\```

## daily workflow

- open the current milestone file
- ask the llm to propose the next focus task
- confirm the focus task
- llm sets current_focus_task_id and updates task status
- iterate and append progress_log entries
- if blocked or error, record error summary and recommended next actions
- on completion, mark completed and select next task
```

Mark milestones with `[x]` as they are completed.

---

### `tasks/tasks-milestone-<id>.md`

Structure:
1. milestone metadata json
2. current focus line
3. task sections

---

## milestone metadata (template)

Use the schema from `agentic-guides/01-OUTPUT_SCHEMAS.md`:

```json
{
  "milestone_id": "a",
  "milestone_name": "{{NAME}}",
  "status": "planned",
  "current_focus_task_id": null,
  "started_at": null,
  "completed_at": null,
  "definition_of_done": [
    "{{OBSERVABLE OUTCOME}}",
    "{{OBSERVABLE OUTCOME}}"
  ],
  "test_gate": {
    "required": true,
    "suite_name": "milestone-a",
    "last_run_at": null,
    "last_result": null
  },
  "notes": []
}
```

- `milestone_id`: "a", "b", "c", ...
- `definition_of_done`: outcome checklist (observable, testable)
- `test_gate`: required suite name matching `npm run test:milestone-<id>`

---

## task JSON block (template)

Use the schema from `agentic-guides/01-OUTPUT_SCHEMAS.md`.

```json
{
  "task_id": "A-1",
  "title": "{{TITLE}}",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "{{SUBTASK}}"
  ],
  "acceptance_criteria": [
    "{{OBSERVABLE CRITERION}}"
  ],
  "tests_required": [
    "{{TEST DESCRIPTION}}"
  ],
  "progress_log": [],
  "error": null
}
```

Guidance:
- keep acceptance criteria **observable** (can be verified by running code or reading output)
- list tests in "tests_required" even if you'll implement them later
- write progress logs as short dated bullets
- task IDs use format `{{MILESTONE_ID}}-{{NUMBER}}` (e.g., `A-1`, `B-3`)

---

## conventions

- milestone files are append-only for progress logs (do not rewrite history)
- if a task is blocked, set `status: "blocked"` and populate `error`
- only one task should be the **current focus** at a time
- tasks are sized for one coding session
- subtasks are logical implementation units within a task
