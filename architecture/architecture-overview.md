# architecture overview

## system diagram

```
┌──────────────────┐
│   React Native   │
│   (Expo) App     │
│                  │
│  Camera → Snap   │
│  Results Display │
│  TTS Playback    │
│  Social Share    │
└────────┬─────────┘
         │ HTTPS
         ▼
┌──────────────────┐     ┌──────────────────┐
│   Express API    │────▶│   PostgreSQL     │
│   (Node.js)      │     │   (Prisma ORM)   │
│                  │     │                  │
│  Auth / Routes   │     │  Landmarks       │
│  Caching Logic   │     │  GuideContent    │
│  Ad Matching     │     │  Ads / Reviews   │
└────────┬─────────┘     └──────────────────┘
         │
  ┌──────▼──────┐
  │    MCP      │
  │  Package    │
  │             │
  │  Prompts    │──────▶  OpenAI GPT-4o (Vision + Text)
  │  Adapters   │──────▶  OpenAI TTS
  │  Schemas    │
  │  Evals      │
  └─────────────┘
```

---

## package boundaries

### packages/frontend
- Owns: React Native UI, camera capture, TTS playback, social sharing, navigation
- Does not own: business logic, data persistence, LLM calls, prompt management

### packages/backend
- Owns: API server, authentication, route handlers, caching logic, ad moderation, database access
- Does not own: LLM prompt rendering, model provider calls, UI code

### packages/shared
- Owns: TypeScript types, Zod schemas, shared utilities, API contract types
- Does not own: runtime-specific code (no DOM, no Node APIs, no React Native)

### packages/mcp
- Owns: prompt registry, prompt rendering, fragment system, provider adapters, schema validation, eval harness
- Does not own: database access, HTTP routes, UI code, ad business logic

---

## main request flows

### Landmark Discovery (snap → facts)
1. Frontend: user snaps photo via camera, sends image (base64) + optional GPS to backend
2. Backend: receives image, checks cache for known landmark
3. Backend (cache miss): calls MCP landmark_identify tool with image + GPS
4. MCP: renders prompt, calls OpenAI GPT-4o vision, validates output against landmark_identification.v1
5. Backend: if landmark identified, checks cache for guide content (landmark + locale)
6. Backend (cache miss): calls MCP guide_generate tool
7. MCP: renders prompt with locale, calls OpenAI, validates against guide_content.v1
8. Backend: caches landmark + guide content, returns response to frontend
9. Frontend: displays results (landmark name, confidence, facts)

### TTS Narration
1. Frontend: requests audio for current guide content version
2. Backend: checks TTS cache for content version + locale
3. Backend (cache miss): calls MCP tts_generate tool with narration_script
4. MCP: calls OpenAI TTS API, returns audio file
5. Backend: caches audio file, returns audio URL
6. Frontend: plays audio via audio player

### Ad Submission + Moderation
1. Ad Provider: creates ad with content + target landmarks via provider dashboard
2. Backend: validates and stores ad with status "pending"
3. Admin: views pending queue, reviews ad
4. Admin: approves or rejects with feedback
5. Backend: updates ad status, notifies provider
6. End User (on snap): backend fetches approved ads matching landmark, returns with guide content

### Content Regeneration
1. Admin: views ratings/reviews for a landmark's guide content
2. Admin: enters additional prompt and triggers regeneration
3. Backend: calls MCP guide_generate with additional prompt context
4. MCP: generates new content, validates against schema
5. Backend: creates new content version, triggers TTS regeneration
6. Backend: new version becomes active, old version preserved

### Social Sharing
1. Frontend: user taps share button on results screen
2. Frontend: generates shareable card (photo + landmark name + summary)
3. Frontend: opens platform picker (Instagram, X, Facebook)
4. Frontend: invokes platform-specific sharing API with card + text
5. Platform: user completes share flow in platform app

---

## failure modes

| Failure | Impact | Mitigation |
|---------|--------|------------|
| OpenAI API down | No new landmark identification or content generation | Return cached content when available; show graceful error for unknown landmarks |
| OpenAI TTS down | No narration for new content | Text display still works; queue TTS generation for retry |
| Landmark not recognized | No guide content available | Show "couldn't identify" with retry option; GPS hint if not provided |
| LLM returns invalid schema | Content not usable | Validation catches it; return clarification_required schema; log for review |
| Database down | No cached content, no ads, no auth | Full outage; show maintenance screen |
| OAuth provider down | Users can't log in | Show error; existing sessions still valid |

---

## cross-cutting concerns

- logging: see docs/logging-observability.md
- auth: see architecture/auth-and-security.md
- caching: guide content + TTS audio cached per landmark + locale + version; cache-aside pattern with DB as backing store

