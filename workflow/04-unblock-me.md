# unblock me

## purpose

Diagnose why progress is stalled and propose the smallest path to unblock.

---

## inputs to read

- the active milestone task file (blocked/error tasks)
- spec/decisions.md
- relevant architecture files
- spec/tests.md (if test failures are the blocker)

---

## procedure

1. identify the blocked or errored task(s)
2. read the `error` field and progress_log for context
3. diagnose the root cause:
   - missing decision? → present options and ask user to choose
   - technical bug? → propose a fix
   - dependency not ready? → identify what's needed
   - unclear acceptance criteria? → propose clarification
4. propose the smallest unblocking action
5. if a decision is needed, present 2–3 options with tradeoffs
6. once the user chooses:
   - record decision in `spec/decisions.md` if architectural
   - update the task error field to reflect resolution
   - set task status back to `in-progress`

---

## output

- diagnosis of the blocker
- proposed unblocking action(s)
- if a decision: options with tradeoffs
- after resolution: updated task and (optionally) decisions.md

---

## stop conditions

- stop and ask user when a decision is required
- stop after proposing an unblock path if it requires user action

