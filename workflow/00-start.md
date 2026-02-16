# workflow router

## purpose

Route to the correct workflow step based on current project state.

Do **not** do implementation work in this step.

---

## inputs to read

- spec/readme.md
- tasks/tasks-index.md
- the current milestone task file (linked from tasks-index.md)

---

## decision priority

Evaluate in this order and route to the first applicable workflow:

1. **unblock** → if any task is in `blocked` or `error` state → `workflow/04-unblock-me.md`
2. **wrap up** → if a task is in-progress and acceptance criteria appear met → `workflow/03-wrap-up-current-focus.md`
3. **run tests** → if tasks were recently completed but tests not yet run → `workflow/05-run-tests.md`
4. **milestone check** → if all tasks in current milestone appear completed → `workflow/06-milestone-check.md`
5. **execute focus task** → if a current focus task is set and in-progress → `workflow/02-execute-current-focus.md`
6. **pick next task** → if no current focus task is set → `workflow/01-pick-next-task.md`

---

## output

- chosen workflow filename
- 1–2 sentence reason
- explicit next instruction (which workflow prompt to run)

---

## stop conditions

- return to user after routing decision
- do not execute the routed workflow in this step

