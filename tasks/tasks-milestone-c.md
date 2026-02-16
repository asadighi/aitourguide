# Milestone C – Ad Marketplace

## milestone metadata

```json
{
  "milestone_id": "c",
  "milestone_name": "Ad Marketplace",
  "status": "planned",
  "current_focus_task_id": null,
  "started_at": null,
  "completed_at": null,
  "definition_of_done": [
    "Ad Provider can create, submit, and track ad status",
    "Admin can review, approve, and reject ads with feedback",
    "Approved ads appear on the correct landmark results",
    "Unapproved ads never display to end users",
    "Role-based access prevents unauthorized actions"
  ],
  "test_gate": {
    "required": true,
    "suite_name": "milestone-c",
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

### C-1: Ad Database Schema

```json
{
  "task_id": "C-1",
  "title": "Add Ad and AdLandmark entities to Prisma schema",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "Add Ad entity with status enum (pending, approved, rejected)",
    "Add AdLandmark join table for many-to-many relationship",
    "Create migration",
    "Update seed script with sample ads"
  ],
  "acceptance_criteria": [
    "Ad and AdLandmark tables exist in database",
    "Ad status enum includes pending, approved, rejected",
    "Migration applies cleanly",
    "Seed data includes sample ads in various statuses"
  ],
  "tests_required": [
    "Integration test: Ad CRUD operations work via Prisma"
  ],
  "progress_log": [],
  "error": null
}
```

---

### C-2: Ad API Endpoints

```json
{
  "task_id": "C-2",
  "title": "Implement backend API for ad CRUD and moderation",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["C-1"],
  "subtasks": [
    "POST /ads — create ad (ad_provider role only)",
    "GET /ads — list own ads (ad_provider role only)",
    "GET /admin/ads/pending — list pending ads (admin role only)",
    "PUT /admin/ads/:id/approve — approve ad (admin role only)",
    "PUT /admin/ads/:id/reject — reject ad with feedback (admin role only)",
    "GET /landmarks/:id/ads — get approved ads for a landmark (public)",
    "Apply role-based middleware to all ad routes"
  ],
  "acceptance_criteria": [
    "Ad Provider can create ads tied to landmarks",
    "Ad Provider can view their own ads and statuses",
    "Admin can view pending queue and approve/reject",
    "Rejection includes feedback text",
    "Public endpoint returns only approved ads for a landmark",
    "Unauthorized roles are blocked"
  ],
  "tests_required": [
    "Integration test: full ad lifecycle (create → pending → approve → visible)",
    "Integration test: rejected ads not returned in public query",
    "Integration test: role-based access blocks unauthorized requests"
  ],
  "progress_log": [],
  "error": null
}
```

---

### C-3: Ad Provider Dashboard

```json
{
  "task_id": "C-3",
  "title": "Build Ad Provider dashboard in React Native",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["C-2"],
  "subtasks": [
    "Create ad submission form (title, body, image, link, target landmarks)",
    "Implement landmark selector (search/pick from known landmarks)",
    "Create ad list view showing submission status",
    "Show approval/rejection status with admin feedback",
    "Add navigation for ad provider role"
  ],
  "acceptance_criteria": [
    "Provider can fill out and submit ad form",
    "Provider can select target landmarks",
    "Provider sees list of their ads with statuses",
    "Rejected ads show admin feedback"
  ],
  "tests_required": [
    "Unit test: ad submission form validates required fields",
    "Unit test: ad list renders with various status states"
  ],
  "progress_log": [],
  "error": null
}
```

---

### C-4: Admin Moderation Dashboard

```json
{
  "task_id": "C-4",
  "title": "Build Admin moderation dashboard in React Native",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["C-2"],
  "subtasks": [
    "Create pending ad queue screen",
    "Show ad details (content, target landmarks, provider info)",
    "Add approve and reject buttons",
    "Add feedback text input for rejections",
    "Show moderation history (approved/rejected ads)",
    "Add navigation for admin role"
  ],
  "acceptance_criteria": [
    "Admin sees queue of pending ads",
    "Admin can view full ad details",
    "Admin can approve with one tap",
    "Admin can reject with feedback text",
    "Moderation history shows past decisions"
  ],
  "tests_required": [
    "Unit test: moderation queue renders pending ads",
    "Unit test: approve/reject actions call correct API endpoints"
  ],
  "progress_log": [],
  "error": null
}
```

---

### C-5: Ad Display on Results Screen

```json
{
  "task_id": "C-5",
  "title": "Display approved ads on landmark results screen",
  "status": "todo",
  "priority": "medium",
  "estimated_sessions": 1,
  "depends_on": ["C-2"],
  "subtasks": [
    "Fetch approved ads for identified landmark from API",
    "Display ad card below guide content",
    "Ad card shows title, body, optional image",
    "Tapping ad opens link in browser",
    "Clearly label ads as 'Sponsored' to separate from editorial"
  ],
  "acceptance_criteria": [
    "Approved ads appear on results screen for correct landmarks",
    "Ads are clearly labeled as sponsored content",
    "Tapping ad opens the link URL",
    "No ads shown if none are approved for the landmark"
  ],
  "tests_required": [
    "Unit test: ad card renders with correct content",
    "Unit test: no ad section rendered when no ads available",
    "Integration test: ad matching returns only approved ads for landmark"
  ],
  "progress_log": [],
  "error": null
}
```

