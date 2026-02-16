# Milestone B – TTS Narration + Multi-Lingual

## milestone metadata

```json
{
  "milestone_id": "b",
  "milestone_name": "TTS Narration + Multi-Lingual",
  "status": "done",
  "current_focus_task_id": null,
  "started_at": "2026-02-16",
  "completed_at": "2026-02-16",
  "definition_of_done": [
    "TTS plays reliably after landmark identification",
    "Same content version serves cached audio without re-generation",
    "Locale parameter produces content in requested language",
    "Audio quality is acceptable with tour guide tone"
  ],
  "test_gate": {
    "required": true,
    "suite_name": "milestone-b",
    "last_run_at": "2026-02-16",
    "last_result": "pass (40 milestone-b tests: 17 backend + 23 mcp; 11 frontend locale tests)"
  },
  "notes": [
    "All 5 tasks (B-1 through B-5) completed in a single session",
    "11 supported locales including Farsi",
    "Locale preference persisted via expo-secure-store"
  ]
}
```

## current focus

Milestone complete ✅

---

## tasks

### B-1: OpenAI TTS Integration

```json
{
  "task_id": "B-1",
  "title": "Integrate OpenAI TTS API in MCP package",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "Add tts_generate tool to MCP package",
    "Implement OpenAI TTS API call via adapter",
    "Select appropriate voice for tour guide tone",
    "Return audio file (mp3) from TTS generation",
    "Add TTS configuration (voice, speed, model) to env config"
  ],
  "acceptance_criteria": [
    "tts_generate tool accepts narration text and returns audio file path",
    "Audio is generated via OpenAI TTS API",
    "Voice sounds natural and engaging (tour guide tone)",
    "TTS configuration is externalized via env vars"
  ],
  "tests_required": [
    "Unit test: TTS request builder produces correct API payload",
    "Contract test: mocked TTS API returns audio buffer"
  ],
  "progress_log": [],
  "error": null
}
```

---

### B-2: TTS Audio Caching

```json
{
  "task_id": "B-2",
  "title": "Implement TTS audio caching per content version",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["B-1"],
  "subtasks": [
    "Add AudioNarration entity to Prisma schema (if not done)",
    "Save generated audio to filesystem with predictable path",
    "Create AudioNarration record linking to GuideContent version",
    "On audio request: check cache first, generate only on miss",
    "Serve cached audio via API endpoint (GET /audio/:id)"
  ],
  "acceptance_criteria": [
    "First TTS request generates and caches audio file",
    "Second request for same content version serves cached file",
    "AudioNarration record tracks file path and guide content version",
    "GET /audio/:id returns audio file with correct content-type"
  ],
  "tests_required": [
    "Integration test: TTS cache hit returns audio without API call",
    "Integration test: GET /audio/:id returns correct audio file"
  ],
  "progress_log": [],
  "error": null
}
```

---

### B-3: Multi-Lingual Content Generation

```json
{
  "task_id": "B-3",
  "title": "Implement multi-lingual content generation with locale caching",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "Ensure guide_generate prompt accepts and uses locale parameter",
    "Cache guide content per landmark + locale combination",
    "Generate separate TTS audio per locale",
    "Update POST /snap to accept locale parameter from frontend"
  ],
  "acceptance_criteria": [
    "Guide content generated in requested locale",
    "Different locales produce separate cached entries",
    "Each locale has its own TTS audio cache",
    "Default locale is 'en' when not specified"
  ],
  "tests_required": [
    "Unit test: locale parameter correctly injected into guide_generate prompt",
    "Integration test: different locales produce different cached content"
  ],
  "progress_log": [],
  "error": null
}
```

---

### B-4: Audio Playback in React Native

```json
{
  "task_id": "B-4",
  "title": "Build audio playback controls in React Native",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["B-2"],
  "subtasks": [
    "Integrate expo-av for audio playback",
    "Add play/pause button to results screen",
    "Show audio progress indicator",
    "Handle loading state while audio downloads",
    "Auto-play narration after results load (optional, user can toggle)"
  ],
  "acceptance_criteria": [
    "Play/pause button works on results screen",
    "Audio progress indicator shows playback position",
    "Audio loads and plays without errors",
    "User can pause and resume narration"
  ],
  "tests_required": [
    "Unit test: audio player component renders with controls"
  ],
  "progress_log": [],
  "error": null
}
```

---

### B-5: Language Selector UI

```json
{
  "task_id": "B-5",
  "title": "Add language/locale selector to the app",
  "status": "done",
  "priority": "medium",
  "estimated_sessions": 1,
  "depends_on": ["B-3"],
  "subtasks": [
    "Add locale picker component (dropdown or modal)",
    "Store selected locale in app state",
    "Pass locale to POST /snap requests",
    "Persist locale preference locally (AsyncStorage)",
    "Update results screen to reflect selected locale"
  ],
  "acceptance_criteria": [
    "User can select language from available locales",
    "Selected locale persists across app sessions",
    "Content is generated in selected locale",
    "Locale picker is accessible from camera or results screen"
  ],
  "tests_required": [
    "Unit test: locale picker component renders with options",
    "Unit test: locale preference persists to storage"
  ],
  "progress_log": [],
  "error": null
}
```

