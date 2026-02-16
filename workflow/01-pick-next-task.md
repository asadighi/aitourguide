# pick next task

## purpose

Select the next task to work on from the current milestone.

---

## inputs to read

- tasks/tasks-index.md
- the active milestone task file (e.g., tasks/tasks-milestone-a.md)
- spec/master-project-plan.md (for context on milestone goals)

---

## procedure

1. identify all tasks with status `todo` in the active milestone
2. filter out tasks whose `depends_on` includes incomplete tasks
3. sort by priority (high > medium > low), then by task ID
4. propose the top 1–3 candidate tasks with a brief rationale for each
5. ask the user to confirm which task to focus on
6. once confirmed:
   - set `current_focus_task_id` in the milestone metadata
   - set task status to `in-progress`
   - update `tasks/tasks-index.md` with the new `current_focus_task_id`

---

## output

- list of proposed tasks (1–3) with rationale
- after confirmation: updated milestone file and tasks-index.md

---

## stop conditions

- stop and wait for user confirmation before marking anything in-progress
- if no tasks are available (all completed or blocked), route to milestone check

