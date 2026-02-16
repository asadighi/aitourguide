# wrap up current focus

## purpose

Verify the current focus task is complete and close it out properly.

---

## inputs to read

- the active milestone task file (current focus task details)
- spec/tests.md (required tests for this milestone)
- spec/changelog.md (if spec changes were made)

---

## procedure

1. review each acceptance criterion for the current focus task
2. verify each criterion is met (check code, check tests exist)
3. ensure all `tests_required` for this task are listed and runnable
4. if any criterion is not met, note what's missing and continue execution or mark blocked
5. if all criteria are met:
   - set task status to `completed`
   - clear `current_focus_task_id` in milestone metadata
   - update `tasks/tasks-index.md`
6. if any `/spec` file was changed during this task, add a `spec/changelog.md` entry
7. list the exact test commands to run for verification

---

## output

- verification of each acceptance criterion (met/not met)
- updated task status in milestone file
- updated tasks-index.md
- changelog entry if spec files were modified
- list of test commands to run

---

## stop conditions

- stop if acceptance criteria are not met (return to execute or mark blocked)
- stop after marking task completed and listing test commands

