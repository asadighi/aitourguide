# progress report

## purpose

Produce a concise project status summary for the user.

---

## inputs to read

- tasks/tasks-index.md
- the active milestone task file
- spec/changelog.md (recent entries)

---

## procedure

1. identify current milestone and its status
2. count tasks by status (completed, in-progress, blocked, todo)
3. identify the current focus task (if any)
4. list what was accomplished since last report
5. list any blockers or risks
6. propose next 3 recommended actions

---

## output format

```
## progress report – {{date}}

### current milestone
{{milestone name}} ({{status}})

### task summary
- completed: {{N}}
- in-progress: {{N}}
- blocked: {{N}}
- todo: {{N}}

### recent progress
- {{what was done}}
- {{what was done}}

### blockers / risks
- {{blocker or "none"}}

### next 3 actions
1. {{action}}
2. {{action}}
3. {{action}}
```

---

## stop conditions

- stop after delivering the report
- do not take any action — report only

