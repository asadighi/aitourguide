# Milestone E – Social Sharing + Polish

## milestone metadata

```json
{
  "milestone_id": "e",
  "milestone_name": "Social Sharing + Polish",
  "status": "planned",
  "current_focus_task_id": null,
  "started_at": null,
  "completed_at": null,
  "definition_of_done": [
    "User can share to at least 3 social media platforms from results screen",
    "Shared content includes photo, landmark name, and guide summary",
    "Share flow is smooth (< 3 taps from results to shared)",
    "Platform-specific formatting is correct"
  ],
  "test_gate": {
    "required": true,
    "suite_name": "milestone-e",
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

### E-1: Share Content Generation

```json
{
  "task_id": "E-1",
  "title": "Generate shareable content (text + hashtags)",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "Create social_share_generate prompt v1.0.0 in MCP",
    "Generate share text and hashtags from landmark + summary",
    "Validate output against social_share_content.v1 schema",
    "Support locale parameter for multi-lingual share text"
  ],
  "acceptance_criteria": [
    "social_share_generate prompt exists and produces valid output",
    "Share text is concise and engaging (under 280 chars for X)",
    "Hashtags are relevant to the landmark",
    "Output validates against social_share_content.v1 schema"
  ],
  "tests_required": [
    "Contract test: mocked LLM returns valid social_share_content.v1",
    "Unit test: share text length is within platform limits"
  ],
  "progress_log": [],
  "error": null
}
```

---

### E-2: Shareable Card Generation

```json
{
  "task_id": "E-2",
  "title": "Design and implement shareable card layout",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["E-1"],
  "subtasks": [
    "Design card layout (photo + landmark name + summary + app branding)",
    "Implement card rendering (React Native view-to-image or template)",
    "Include captured photo in card",
    "Add landmark name and summary text overlay",
    "Add app branding/watermark"
  ],
  "acceptance_criteria": [
    "Share card is visually appealing with photo, text, and branding",
    "Card renders at appropriate resolution for social media",
    "Card generation completes within 2 seconds"
  ],
  "tests_required": [
    "Unit test: card component renders with all required elements"
  ],
  "progress_log": [],
  "error": null
}
```

---

### E-3: Platform Sharing Integration

```json
{
  "task_id": "E-3",
  "title": "Integrate deep sharing with Instagram, X, and Facebook",
  "status": "todo",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["E-2"],
  "subtasks": [
    "Implement Instagram sharing (image + caption via share intent)",
    "Implement X/Twitter sharing (image + text + hashtags)",
    "Implement Facebook sharing (image + link + caption)",
    "Build platform picker UI (modal with platform icons)",
    "Handle platform-specific formatting (text length, hashtag format)",
    "Handle cases where platform app is not installed"
  ],
  "acceptance_criteria": [
    "User can share to Instagram with photo and caption",
    "User can share to X with photo, text, and hashtags",
    "User can share to Facebook with photo and caption",
    "Platform picker shows available platforms",
    "Graceful handling when platform app is not installed"
  ],
  "tests_required": [
    "Unit test: platform-specific payload formatting is correct",
    "Integration test: share intent launches correctly per platform"
  ],
  "progress_log": [],
  "error": null
}
```

---

### E-4: Share Button + Flow on Results Screen

```json
{
  "task_id": "E-4",
  "title": "Add share button and flow to results screen",
  "status": "todo",
  "priority": "medium",
  "estimated_sessions": 1,
  "depends_on": ["E-3"],
  "subtasks": [
    "Add share button to results screen",
    "On tap: generate share content + card",
    "Show platform picker",
    "Execute sharing to selected platform",
    "Show success/error feedback"
  ],
  "acceptance_criteria": [
    "Share button is visible on results screen",
    "Tapping share opens platform picker",
    "Selecting platform executes share flow",
    "Flow completes in < 3 taps from results screen",
    "Success/error feedback is shown"
  ],
  "tests_required": [
    "Unit test: share button triggers correct flow",
    "Unit test: platform picker renders with 3 platforms"
  ],
  "progress_log": [],
  "error": null
}
```

