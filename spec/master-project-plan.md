# AI Tour Guide – Master Project Plan

## Project Goal

Build a mobile app that lets users snap photos of landmarks and instantly receive engaging historical facts with narrated audio, while supporting an ad marketplace for landmark-relevant services.

The system allows a user to:
- Point camera at a landmark, snap a photo, and receive facts + narration within seconds
- Share discoveries to social media
- Rate guide content to drive quality improvements

This MVP prioritizes **core landmark discovery accuracy and engagement** over scale, polish, and ad revenue.

---

## Core Principles

- UI exists from day one, but only as a validation surface
- Landmark identification accuracy is the highest priority feature
- Guide content must be factual, engaging, and culturally respectful
- LLM is used for reasoning and generation, not storage
- All content is versioned, cached, and ratable
- Ads and editorial content are strictly separated
- Every milestone introduces automated regression tests

---

## Milestone Overview

| Milestone | Name | Outcome |
|---------|------|--------|
| A | Foundation + Core Discovery | User can snap a photo and see landmark facts on screen |
| B | TTS Narration + Multi-Lingual | Guide content is narrated via TTS in multiple languages |
| C | Ad Marketplace | Ad providers submit ads, admins moderate, ads display with landmarks |
| D | Content Quality Loop | Users rate content, admins regenerate with prompts, versions are tracked |
| E | Social Sharing + Polish | Users share discoveries to social media with deep platform integration |

---

## Milestone A – Foundation + Core Discovery

### Outcome
A user can open the app, snap a photo of a landmark, and see accurate identification with interesting facts displayed on screen. Backend caches results for fast subsequent lookups.

### Tasks
- [ ] Set up monorepo scaffold (shared, backend, frontend, mcp packages)
- [ ] Set up Postgres database with Prisma schema (Landmark, GuideContent entities)
- [ ] Implement OAuth authentication (Google + Apple Sign-In)
- [ ] Build camera capture screen in React Native (live view + snap button)
- [ ] Implement landmark identification prompt + LLM vision integration
- [ ] Implement guide content generation prompt
- [ ] Build backend API: POST /snap (accept image + optional GPS, return landmark + content)
- [ ] Implement guide content caching (per landmark + locale)
- [ ] Build results display screen (landmark name, confidence, facts)
- [ ] Implement uncertainty flow (top 2 guesses with confidence, user clarification)
- [ ] Set up prompt registry and fragment system in MCP package
- [ ] Seed initial prompts (landmark_identify, guide_generate)

### UI (Milestone-Scoped)
- Live camera view with snap button
- Results screen showing landmark name, confidence score, facts list
- Uncertainty screen with 2 options + "clarify" input
- Basic login screen (OAuth)

### Success Criteria
- User can snap a photo and see landmark identification + facts
- Cached landmarks return near-instantly on second lookup
- Uncertainty flow shows top 2 guesses when confidence is low
- All API responses validate against prompt schemas
- Auth flow works for all three roles

### Critical Automated Tests
- Unit: Zod schema validation for landmark_identification.v1 and guide_content.v1
- Contract: Mocked LLM returns valid schema outputs
- Integration: POST /snap returns correct response structure
- Integration: Cache hit returns same content without LLM call
- Fixture: landmark_identify prompt with sample image fixture

---

## Milestone B – TTS Narration + Multi-Lingual

### Outcome
Guide content is narrated aloud via OpenAI TTS in an exciting tour guide tone. Users can select their preferred language, and content is generated + cached per locale.

### Tasks
- [ ] Integrate OpenAI TTS API in MCP package
- [ ] Generate TTS audio from narration_script field of guide content
- [ ] Implement TTS audio caching (per content version + locale)
- [ ] Build audio playback controls in React Native
- [ ] Add language/locale selector to the app
- [ ] Update guide content generation prompt to accept locale parameter
- [ ] Cache guide content per landmark + locale combination
- [ ] Update results screen to include play/pause narration button

### UI (Milestone-Scoped)
- Play/pause button on results screen
- Audio progress indicator
- Language selector (dropdown or picker)

### Success Criteria
- TTS plays reliably after landmark identification
- Same content version serves cached audio (no re-generation)
- Locale parameter produces content in requested language
- Audio quality is acceptable (exciting tour guide tone)

### Critical Automated Tests
- Unit: TTS request builder produces correct API payload
- Contract: TTS cache lookup returns audio for known content version
- Integration: Full snap → content → TTS flow produces audio file
- Unit: Locale parameter correctly injected into prompts

---

## Milestone C – Ad Marketplace

### Outcome
Ad Providers can submit ads tied to specific landmarks. Admins review and approve/reject ads. Approved ads display alongside landmark content to end users.

### Tasks
- [ ] Add Ad, AdProvider entities to Prisma schema
- [ ] Build Ad Provider dashboard (submit ad, select target landmarks, view status)
- [ ] Build Admin moderation dashboard (pending queue, approve/reject with feedback)
- [ ] Implement backend API: CRUD for ads, moderation endpoints
- [ ] Implement ad matching logic (exact landmark match, return approved ads)
- [ ] Display approved ads on landmark results screen
- [ ] Add role-based access control (End User, Ad Provider, Admin)
- [ ] Implement ad status notifications for providers

### UI (Milestone-Scoped)
- Ad Provider: ad creation form (content, target landmarks), submission list with statuses
- Admin: moderation queue with approve/reject buttons and feedback field
- End User: ad card displayed below guide content on results screen

### Success Criteria
- Ad Provider can create, submit, and track ad status
- Admin can review, approve, and reject ads with feedback
- Approved ads appear on the correct landmark results
- Unapproved ads never display to end users
- Role-based access prevents unauthorized actions

### Critical Automated Tests
- Integration: Ad submission → moderation → approval → display flow
- Unit: Ad matching returns only approved ads for correct landmarks
- Integration: Role-based access control blocks unauthorized routes
- Unit: Ad status transitions are valid (pending → approved/rejected)

---

## Milestone D – Content Quality Loop

### Outcome
Users can rate and review guide content. Admins can regenerate content with custom prompts, bumping the version. TTS regenerates with new content. Quality improves via feedback.

### Tasks
- [ ] Add Review entity to Prisma schema (rating, text, linked to content version)
- [ ] Build user review/rating UI on results screen
- [ ] Implement backend API for submitting and retrieving reviews
- [ ] Build admin content management screen (view ratings, trigger regeneration)
- [ ] Implement admin regeneration flow (additional prompt → LLM → new version)
- [ ] Implement content version bumping and TTS regeneration
- [ ] Update cache to serve latest approved content version
- [ ] Display aggregate ratings on results screen

### UI (Milestone-Scoped)
- End User: star rating + optional text review on results screen
- End User: aggregate rating display
- Admin: content management screen with ratings summary and "regenerate" button
- Admin: regeneration prompt input field

### Success Criteria
- Users can submit ratings and reviews per content version
- Admin can trigger regeneration with additional prompt
- Regeneration creates new content version + new TTS audio
- Old versions are preserved (not deleted)
- Latest version is served to users by default

### Critical Automated Tests
- Integration: Review submission persists and retrieves correctly
- Integration: Admin regeneration creates new version
- Unit: Content version bumping logic is correct
- Integration: TTS regeneration triggers on version bump
- Contract: Regenerated content validates against guide_content.v1 schema

---

## Milestone E – Social Sharing + Polish

### Outcome
Users can share landmark discoveries to social media platforms (Instagram, X, Facebook) with an attractive shareable card including photo and guide summary.

### Tasks
- [ ] Design shareable card layout (photo + landmark name + summary + app branding)
- [ ] Implement card generation (image compositing or template rendering)
- [ ] Integrate Instagram sharing API (deep link + share intent)
- [ ] Integrate X/Twitter sharing API
- [ ] Integrate Facebook sharing API
- [ ] Build share button and platform picker on results screen
- [ ] Generate share text and hashtags (use social_share_content.v1 schema)
- [ ] Test sharing flow on iOS and Android

### UI (Milestone-Scoped)
- Share button on results screen
- Platform picker (Instagram, X, Facebook)
- Share preview card

### Success Criteria
- User can share to at least 3 platforms from results screen
- Shared content includes photo, landmark name, and guide summary
- Share flow is smooth (< 3 taps from results to shared)
- Platform-specific formatting is correct

### Critical Automated Tests
- Unit: Share card generation produces correct layout
- Unit: social_share_content.v1 schema validation
- Integration: Share intent launches correctly per platform
- Contract: Share text generation matches expected format

---

## Notes

This document is the master plan.
All feature work must map to a milestone.
No milestone advances without passing its automated test suite.

