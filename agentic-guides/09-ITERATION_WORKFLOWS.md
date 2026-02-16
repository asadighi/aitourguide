# iteration workflows (copy/paste prompts)

These are **reusable prompts** you can paste into an LLM session after bootstrapping.

They assume the repo has:
- `/spec/*`
- `/workflow/*`
- `/tasks/*`

---

## workflow router (session start)

Paste:

“Run the router described in `workflow/00-start.md` and tell me which workflow file to run next. Do not modify any files.”

---

## pick next task

Paste:

“Follow `workflow/01-pick-next-task.md`. Propose the next best task to execute from `tasks/tasks-index.md` and the current milestone file. Ask for confirmation before marking anything in-progress.”

---

## execute current focus task

Paste:

“Follow `workflow/02-execute-current-focus.md`. Implement only what’s needed to satisfy acceptance criteria for the current focus task. Update progress logs as you go. If a major decision is needed, stop and ask me.”

---

## wrap up current focus

Paste:

“Follow `workflow/03-wrap-up-current-focus.md`. Verify acceptance criteria, update task status, and list the exact tests to run. If any `/spec` file changed, add a changelog entry.”

---

## unblock me

Paste:

“Follow `workflow/04-unblock-me.md`. Diagnose why the current task is blocked and propose the smallest unblocking plan. If a decision is needed, present options and ask me to choose.”

---

## run tests

Paste:

“Follow `workflow/05-run-tests.md`. Run the required tests for recently completed tasks. If failures occur, convert them into tasks with clear acceptance criteria.”

---

## milestone check

Paste:

“Follow `workflow/06-milestone-check.md`. Evaluate definition-of-done and test gate. If not ready, identify missing tasks.”

---

## progress report

Paste:

“Follow `workflow/07-progress-report.md`. Give a concise project status update and the next 3 recommended actions.”


