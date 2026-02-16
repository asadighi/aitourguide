# tasks index

This file links milestone task trackers. Milestones are completed linearly.

## milestones

- [x] [tasks-milestone-a.md](tasks-milestone-a.md) Foundation + Core Discovery ✅
- [ ] [tasks-milestone-b.md](tasks-milestone-b.md) TTS Narration + Multi-Lingual
- [ ] [tasks-milestone-c.md](tasks-milestone-c.md) Ad Marketplace
- [ ] [tasks-milestone-d.md](tasks-milestone-d.md) Content Quality Loop
- [ ] [tasks-milestone-e.md](tasks-milestone-e.md) Social Sharing + Polish

## current state

```json
{
  "current_milestone_id": "b",
  "current_focus_task_id": "B-2"
}
```

## daily workflow

- open the current milestone file
- ask the llm to propose the next focus task
- confirm the focus task
- llm sets current_focus_task_id and updates task status
- iterate and append progress_log entries
- if blocked or error, record error summary and recommended next actions
- on completion, mark completed and select next task

