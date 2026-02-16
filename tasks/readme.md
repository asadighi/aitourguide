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

