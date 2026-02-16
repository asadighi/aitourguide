# Milestone A – Foundation + Core Discovery

## milestone metadata

```json
{
  "milestone_id": "a",
  "milestone_name": "Foundation + Core Discovery",
  "status": "done",
  "current_focus_task_id": null,
  "started_at": "2026-02-14",
  "completed_at": "2026-02-14",
  "definition_of_done": [
    "User can snap a photo and see landmark identification with facts on screen",
    "Cached landmarks return near-instantly on second lookup",
    "Uncertainty flow shows top 2 guesses when confidence is low",
    "All API responses validate against prompt schemas",
    "Auth flow works for all three roles"
  ],
  "test_gate": {
    "required": true,
    "suite_name": "milestone-a",
    "last_run_at": "2026-02-14",
    "last_result": "pass"
  },
  "notes": [
    "All 71 tests passing (10 shared + 30 mcp + 31 backend)",
    "Prompt seed script successfully seeds prompts into DB"
  ]
}
```

## current focus

✅ Milestone A complete — all tasks done.

---

## tasks

### A-1: Monorepo Scaffold Setup

```json
{
  "task_id": "A-1",
  "title": "Set up monorepo scaffold with all packages",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": [],
  "subtasks": [
    "Create root package.json with npm workspaces",
    "Create packages/shared with Zod schemas and types",
    "Create packages/backend with Express hello-world server",
    "Create packages/frontend with React Native (Expo) skeleton",
    "Create packages/mcp with prompt registry skeleton",
    "Set up tsconfig.base.json and per-package tsconfigs",
    "Set up ESLint config",
    "Create env.example with all required variables",
    "Verify npm install and npm run dev work from root"
  ],
  "acceptance_criteria": [
    "npm install succeeds from root",
    "npm run dev starts backend and frontend concurrently",
    "Backend serves GET /health returning { status: 'ok' }",
    "Frontend app renders a basic screen",
    "Shared package exports at least one Zod schema used by backend",
    "MCP package exports a minimal prompt registry function"
  ],
  "tests_required": [
    "Unit test: HealthResponse schema validation in shared",
    "Unit test: prompt registry returns registered prompt in mcp",
    "Integration test: GET /health returns 200 with correct body"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-2: Database Schema + Prisma Setup

```json
{
  "task_id": "A-2",
  "title": "Set up PostgreSQL database with Prisma schema",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["A-1"],
  "subtasks": [
    "Add Prisma to backend package",
    "Define Landmark entity",
    "Define GuideContent entity with versioning",
    "Define User entity with role enum",
    "Define Prompt entity for prompt registry",
    "Create initial migration",
    "Add seed script for development data"
  ],
  "acceptance_criteria": [
    "Prisma schema compiles and generates client",
    "Migration applies cleanly to fresh database",
    "Seed script populates sample data",
    "All entities match architecture/data-persistence.md"
  ],
  "tests_required": [
    "Integration test: migration applies and rollbacks cleanly",
    "Integration test: seed script creates expected records"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-3: OAuth Authentication

```json
{
  "task_id": "A-3",
  "title": "Implement OAuth authentication (Google + Apple Sign-In)",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["A-2"],
  "subtasks": [
    "Set up JWT generation and validation in backend",
    "Implement Google OAuth flow (backend callback + token exchange)",
    "Implement Apple Sign-In flow (backend callback + token exchange)",
    "Create auth middleware for protected routes",
    "Implement role-based access control middleware",
    "Build login screen in React Native with Expo AuthSession",
    "Store tokens in Expo SecureStore"
  ],
  "acceptance_criteria": [
    "User can log in via Google OAuth and receive JWT",
    "User can log in via Apple Sign-In and receive JWT",
    "JWT contains user ID and role",
    "Protected routes reject unauthenticated requests",
    "Role-based middleware blocks unauthorized access"
  ],
  "tests_required": [
    "Unit test: JWT generation and validation",
    "Integration test: auth middleware rejects invalid tokens",
    "Integration test: role-based access control blocks unauthorized roles"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-4: Camera Capture Screen

```json
{
  "task_id": "A-4",
  "title": "Build camera capture screen in React Native",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["A-1"],
  "subtasks": [
    "Set up expo-camera with live preview",
    "Add snap button overlay on camera view",
    "Capture photo as base64 on snap",
    "Optionally capture GPS coordinates via expo-location",
    "Send image + GPS to backend API",
    "Show loading state while waiting for response"
  ],
  "acceptance_criteria": [
    "Camera view shows live preview",
    "Snap button captures photo",
    "Photo is sent to backend as base64",
    "GPS coordinates are optionally included",
    "Loading indicator shows during API call"
  ],
  "tests_required": [
    "Unit test: image payload construction (base64 + optional GPS)"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-5: Landmark Identification Prompt + LLM Integration

```json
{
  "task_id": "A-5",
  "title": "Implement landmark identification prompt and LLM vision integration",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["A-1"],
  "subtasks": [
    "Create landmark_identify prompt v1.0.0 in packages/mcp/prompts/",
    "Create safety_rules fragment in _fragments/",
    "Implement OpenAI provider adapter with vision support",
    "Implement provider-agnostic LLMProvider interface",
    "Implement renderPromptFromRegistry function",
    "Validate LLM output against landmark_identification.v1 schema",
    "Handle uncertainty (top 2 guesses with confidence scores)"
  ],
  "acceptance_criteria": [
    "landmark_identify prompt exists as v1.0.0.md with fragments",
    "OpenAI adapter sends image to GPT-4o vision and returns structured response",
    "Response validates against landmark_identification.v1 Zod schema",
    "When confidence is low, needs_clarification is true with top 2 candidates",
    "Provider adapter is behind LLMProvider interface"
  ],
  "tests_required": [
    "Unit test: prompt rendering with fragment injection",
    "Contract test: mocked LLM returns valid landmark_identification.v1",
    "Contract test: mocked LLM returns clarification_required on low confidence",
    "Fixture test: landmark_identify with sample fixture validates against schema"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-6: Guide Content Generation Prompt

```json
{
  "task_id": "A-6",
  "title": "Implement guide content generation prompt",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["A-5"],
  "subtasks": [
    "Create guide_generate prompt v1.0.0 in packages/mcp/prompts/",
    "Create style_and_language_rules fragment",
    "Implement guide content generation via LLM adapter",
    "Validate output against guide_content.v1 schema",
    "Include locale parameter for multi-lingual support"
  ],
  "acceptance_criteria": [
    "guide_generate prompt exists as v1.0.0.md with fragments",
    "LLM generates guide content with facts, narration script, and fun fact",
    "Output validates against guide_content.v1 Zod schema",
    "Locale parameter is accepted and used in prompt"
  ],
  "tests_required": [
    "Contract test: mocked LLM returns valid guide_content.v1",
    "Unit test: locale parameter correctly injected into prompt",
    "Fixture test: guide_generate with sample fixture validates against schema"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-7: Snap API Endpoint + Caching

```json
{
  "task_id": "A-7",
  "title": "Build POST /snap API endpoint with caching",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 2,
  "depends_on": ["A-2", "A-5", "A-6"],
  "subtasks": [
    "Create POST /snap route accepting image (base64) + optional GPS + locale",
    "Call landmark_identify MCP tool with image + GPS",
    "Check DB cache for existing landmark match",
    "If cache miss: call guide_generate MCP tool",
    "Store landmark + guide content in DB",
    "If cache hit: return cached guide content",
    "Return structured response to frontend",
    "Add request ID middleware and structured logging"
  ],
  "acceptance_criteria": [
    "POST /snap accepts image and returns landmark + guide content",
    "First request for a landmark calls LLM and caches result",
    "Second request for same landmark returns cached result without LLM call",
    "Response structure matches API contract",
    "Request ID is logged with each request"
  ],
  "tests_required": [
    "Integration test: POST /snap returns correct response structure",
    "Integration test: cache hit returns same content without LLM call",
    "Integration test: request includes correlation ID in logs"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-8: Results Display Screen

```json
{
  "task_id": "A-8",
  "title": "Build results display screen",
  "status": "done",
  "priority": "high",
  "estimated_sessions": 1,
  "depends_on": ["A-4", "A-7"],
  "subtasks": [
    "Create results screen component",
    "Display landmark name and confidence score",
    "Display facts list (heading + body)",
    "Display fun fact if available",
    "Show confidence disclaimer when needed",
    "Add back button to return to camera view",
    "Add share button for social sharing",
    "Show cached badge when response was cached",
    "Display relevant ads section"
  ],
  "acceptance_criteria": [
    "Results screen displays landmark name and confidence",
    "Facts are shown in a readable list format",
    "Confidence disclaimer appears when identification is uncertain",
    "User can navigate back to camera view",
    "User can share results via Share API"
  ],
  "tests_required": [
    "Unit test: results screen renders with sample guide content data"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-9: Uncertainty Flow (Clarification UI)

```json
{
  "task_id": "A-9",
  "title": "Implement uncertainty flow with user clarification",
  "status": "done",
  "priority": "medium",
  "estimated_sessions": 1,
  "depends_on": ["A-8"],
  "subtasks": [
    "Detect needs_clarification in API response",
    "Show top 2 landmark candidates with confidence scores",
    "Allow user to select correct landmark",
    "Proceed to results screen with confirmed landmark",
    "Allow user to take another photo instead"
  ],
  "acceptance_criteria": [
    "When confidence is low, user sees 2 options to choose from",
    "User can tap to select one option",
    "After selection, guide content is shown for confirmed landmark",
    "User can retake photo instead of selecting"
  ],
  "tests_required": [
    "Unit test: clarification UI renders with 2 candidates",
    "Integration test: clarification selection triggers guide content for chosen landmark"
  ],
  "progress_log": [],
  "error": null
}
```

---

### A-10: Prompt Seed Script

```json
{
  "task_id": "A-10",
  "title": "Implement prompt seed script for database registry",
  "status": "done",
  "priority": "medium",
  "estimated_sessions": 1,
  "depends_on": ["A-2", "A-5", "A-6"],
  "subtasks": [
    "Create seed-prompts script in packages/backend (imports from mcp)",
    "Script scans prompts/ directory for all prompt folders",
    "Script reads each version file and extracts metadata",
    "Script upserts into Prompt table (prompt_id, version, content, schema_type, is_active)",
    "Support --activate flag to activate latest versions",
    "Support --prompt flag to seed specific prompt only",
    "Support --dry-run flag for preview without DB writes",
    "Auto-load .env from backend package root",
    "Add npm run seed:prompts script to root package.json"
  ],
  "acceptance_criteria": [
    "seed:prompts scans and seeds all prompts into DB",
    "--activate sets latest versions as active",
    "--prompt=landmark_identify seeds only that prompt",
    "--dry-run previews without DB writes",
    "Seeded prompts are queryable via Prisma"
  ],
  "tests_required": [
    "Integration test: seed script creates expected prompt records",
    "Integration test: --activate flag sets correct active versions"
  ],
  "progress_log": [],
  "error": null
}
```
