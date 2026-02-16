# workflow prompts template (what to generate into `/workflow`)

Goal: a small set of prompts that keeps the agent in a tight loop:

- route → pick task → execute → wrap up → test → milestone check → progress report

These workflow prompts should be **domain-agnostic** and operate using `/spec` + `/tasks`.

---

## required workflow files

### `workflow/00-start.md` (router)

Responsibilities:
- read `spec/readme.md`
- read `tasks/tasks-index.md`
- decide which workflow prompt should run next
- do **not** do implementation work

Decision priority (recommended):
1. unblock
2. wrap up
3. run tests
4. milestone check
5. execute focus task
6. pick next task

Output:
- chosen workflow filename
- 1–2 sentence reason
- explicit next instruction (which workflow prompt to run)

### `workflow/01-pick-next-task.md`

Responsibilities:
- inspect `tasks/tasks-index.md` and active milestone file
- propose next 1–3 tasks
- pick exactly one “current focus task” once user confirms
- update `tasks/tasks-index.md` accordingly

### `workflow/02-execute-current-focus.md`

Responsibilities:
- read the current focus task JSON in the milestone file
- implement only what is necessary to satisfy acceptance criteria
- keep changes minimal and reversible
- update the task progress log as you go

### `workflow/03-wrap-up-current-focus.md`

Responsibilities:
- verify acceptance criteria are met
- ensure required tests are listed + runnable
- update task status to completed
- if spec changes occurred, update changelog

### `workflow/04-unblock-me.md`

Responsibilities:
- identify why progress stalled
- propose smallest unblock path
- if a decision is needed, ask user explicitly
- record decision in `spec/decisions.md` when chosen

### `workflow/05-run-tests.md`

Responsibilities:
- run the required tests for recently completed tasks
- capture failures and convert them into new tasks if needed

### `workflow/06-milestone-check.md`

Responsibilities:
- evaluate milestone definition-of-done
- ensure test gate passed
- mark milestone complete or identify missing tasks

### `workflow/07-progress-report.md`

Responsibilities:
- produce a short status summary (what changed, what’s next, risks)

---

## writing style (recommended)

Each workflow file should:
- be short and procedural
- include “inputs to read” and “outputs to produce”
- include “stop conditions” (when to return to user)


