# milestone check

## purpose

Evaluate whether the current milestone is complete and ready to close.

---

## inputs to read

- the active milestone task file (all tasks + milestone metadata)
- spec/master-project-plan.md (milestone success criteria)
- spec/tests.md (milestone test gate)

---

## procedure

1. verify all tasks in the milestone have status `completed`
2. verify the milestone test gate has `last_result: "pass"`
3. check each success criterion from master-project-plan.md
4. if all conditions are met:
   - set milestone status to `completed`
   - set `completed_at` date
   - mark milestone as `[x]` in tasks/tasks-index.md
   - advance `current_milestone_id` in tasks-index.md to the next milestone
   - clear `current_focus_task_id`
5. if conditions are not met:
   - list missing items
   - propose tasks to address gaps
   - do not mark milestone complete

---

## output

- checklist of completion criteria (met/not met)
- if complete: updated milestone metadata + tasks-index.md
- if not complete: list of missing items and proposed remediation

---

## stop conditions

- stop after reporting milestone status
- stop if new tasks are needed (user should confirm before creating)

