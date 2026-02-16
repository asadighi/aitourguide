# Project Goals

## Primary Goal

AI Tour Guide enables anyone to point their phone at a landmark, snap a photo, and instantly receive engaging historical facts and narration — like having a knowledgeable, enthusiastic tour guide in your pocket.

If users cannot reliably snap a photo and receive accurate, engaging landmark information within seconds, the project has failed.

---

## Supporting Goals

### 1. Accurate Landmark Identification
- Vision model correctly identifies landmarks from user photos
- Optional GPS data improves identification confidence
- Top 2 candidates shown with confidence scores when uncertain
- User can clarify or select the correct match

### 2. Engaging Multi-Lingual Guide Content
- Facts and history are interesting, concise, and culturally respectful
- Content is generated in the user's requested locale/language
- Text-to-speech narration uses an exciting tour guide tone
- Content is versioned and improvable over time

### 3. Fast Cached Experience
- First-time landmark identification completes within 10 seconds
- Subsequent lookups for cached landmarks are near-instant
- TTS audio is cached per content version — no re-generation
- Cache strategy minimizes LLM API costs

### 4. Functional Ad Marketplace
- Ad Providers can submit ads tied to specific landmarks
- Admins review and approve/reject ads with clear workflow
- Approved ads display alongside landmark content
- Ads are strictly separated from editorial guide content

### 5. Content Quality Feedback Loop
- End users can rate and review guide content per version
- Admins can regenerate content with additional prompt guidance
- Regeneration bumps content version and regenerates TTS
- Quality improves over time through user feedback

### 6. Social Sharing
- Users can share landmark photo + guide summary to social media
- Deep integration with platform APIs (Instagram, X, Facebook)
- Shareable content is visually appealing and informative

---

## Success Metrics

The MVP is successful if:

- Users can:
  - Snap a photo and receive accurate landmark identification within 10 seconds
  - Hear TTS narration of guide content reliably
  - Share landmark discoveries to social media
  - Rate and review guide content

- System:
  - Landmark identification accuracy is high for well-known landmarks
  - Guide content is factual and culturally appropriate
  - Cached responses serve near-instantly
  - Ad submission and moderation workflow completes end-to-end

- Development:
  - All milestone test suites pass consistently
  - Prompt changes do not silently alter behavior

---

## Non-Metrics

This project explicitly does NOT optimize for:
- Number of landmarks in a pre-built database (we discover on-demand)
- Sub-second response times on first identification
- Ad revenue or click-through rates
- User retention or engagement metrics

---

## Goal Review Policy

Goals are considered stable for the duration of the MVP.

Goals may only be changed if:
- Landmark identification accuracy is fundamentally unreliable
- Core usability is blocked
- Project scope formally expands beyond MVP

