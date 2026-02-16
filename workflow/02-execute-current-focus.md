# execute current focus

## purpose

Implement the current focus task, satisfying its acceptance criteria.

---

## inputs to read

- tasks/tasks-index.md (to identify current focus task)
- the active milestone task file (for task details, acceptance criteria, subtasks)
- spec/decisions.md (for architectural constraints)
- relevant architecture files (for implementation guidance)
- spec/prompt-schemas.md (if task involves LLM outputs)

---

## procedure

1. read the current focus task JSON in the milestone file
2. review acceptance criteria and subtasks
3. implement only what is necessary to satisfy acceptance criteria
4. keep changes minimal and reversible
5. follow the architecture and decisions docs
6. update the task progress_log as you go (append dated entries)
7. if you encounter a major decision not covered by spec/decisions.md, **stop and ask**
8. if a subtask is completed, note it in the progress log
9. if the task becomes blocked, set status to `blocked` and populate the `error` field

---

## output

- code changes implementing the task
- updated progress_log entries in the milestone file

---

## stop conditions

- stop if a major architectural decision is needed (decision gate)
- stop if the task becomes blocked on an external dependency
- stop if all acceptance criteria are met (route to wrap-up)
- stop after a reasonable amount of work if the task is larger than expected (note progress, continue next session)

