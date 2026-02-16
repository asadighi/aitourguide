# Milestone D – Content Quality Loop

## milestone metadata

```json
{
  "milestone_id": "d",
  "milestone_name": "Content Quality Loop",
  "status": "planned",
  "current_focus_task_id": null,
  "started_at": null,
  "completed_at": null,
  "definition_of_done": [
    "Users can submit ratings and reviews per content version",
    "Admin can trigger content regeneration with additional prompt",
    "Regeneration creates new content version and new TTS audio",
    "Old versions are preserved, latest version is served by default"
  ],
  "test_gate": {
    "required": true,
    "suite_name": "milestone-d",
    "last_run_at": null,
    "last_result": null
  },
  "notes": []
}
```

## current focus

None

---

## tasks

### D-1: Review Database Schema

```json
{
  "task_id": "D-1",
  "title": "Add Review entity to Prisma schema",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "Add Review entity (rating 1-5, text, user_id, guide_content_id)",
    "Add unique constraint: one review per user per guide content version",
    "Create migration",
    "Update seed script with sample reviews"
  ],
  "acceptance_criteria": [
    "Review table exists with correct fields",
    "Constraint prevents duplicate reviews per user per content version",
    "Migration applies cleanly"
  ],
  "tests_required": [
    "Integration test: Review CRUD operations work via Prisma",
    "Integration test: duplicate review constraint enforced"
  ],
  "progress_log": [],
  "error": null
}
```

---

### D-2: Review API Endpoints

```json
{
  "task_id": "D-2",
  "title": "Implement review submission and retrieval API",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["D-1"],
  "subtasks": [
    "POST /reviews — submit rating + optional text (end_user role)",
    "GET /landmarks/:id/reviews — get reviews for active content version",
    "GET /admin/landmarks/:id/reviews — get reviews with aggregates (admin role)",
    "Calculate aggregate rating (average, count)"
  ],
  "acceptance_criteria": [
    "End users can submit reviews with rating and text",
    "Reviews are tied to specific guide content versions",
    "Aggregate ratings are calculated correctly",
    "Admin can see detailed review data"
  ],
  "tests_required": [
    "Integration test: review submission persists correctly",
    "Integration test: aggregate rating calculation is accurate",
    "Integration test: reviews are scoped to content version"
  ],
  "progress_log": [],
  "error": null
}
```

---

### D-3: User Review UI

```json
{
  "task_id": "D-3",
  "title": "Build user review/rating UI on results screen",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["D-2"],
  "subtasks": [
    "Add star rating component to results screen",
    "Add optional text review input",
    "Submit review to API on confirmation",
    "Display aggregate rating on results screen",
    "Show user's own review if previously submitted"
  ],
  "acceptance_criteria": [
    "User can tap stars to rate (1-5)",
    "User can optionally add text review",
    "Aggregate rating displays on results screen",
    "User sees their own review if already submitted"
  ],
  "tests_required": [
    "Unit test: star rating component renders and captures input",
    "Unit test: aggregate rating displays correctly"
  ],
  "progress_log": [],
  "error": null
}
```

---

### D-4: Admin Content Regeneration

```json
{
  "task_id": "D-4",
  "title": "Implement admin content regeneration flow",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["D-2"],
  "subtasks": [
    "Build admin content management screen",
    "Show ratings summary per landmark + locale",
    "Add 'Regenerate' button with additional prompt input",
    "POST /admin/landmarks/:id/regenerate — trigger regeneration",
    "Backend calls guide_generate with admin's additional prompt context",
    "Create new GuideContent version (increment version, set is_active)",
    "Deactivate previous version (is_active = false)",
    "Trigger TTS regeneration for new content version",
    "Return new content to admin for review"
  ],
  "acceptance_criteria": [
    "Admin can view ratings and trigger regeneration",
    "Additional prompt is included in LLM generation",
    "New version is created with incremented version number",
    "Old version is preserved but deactivated",
    "New TTS audio is generated for new version",
    "New version is served to end users"
  ],
  "tests_required": [
    "Integration test: regeneration creates new version with correct data",
    "Integration test: old version preserved and deactivated",
    "Integration test: TTS regeneration triggered on version bump",
    "Contract test: regenerated content validates against guide_content.v1"
  ],
  "progress_log": [],
  "error": null
}
```

