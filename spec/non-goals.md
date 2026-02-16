# Non-Goals and Explicit Exclusions

## Purpose

This document defines what this MVP is **not** trying to do.

These non-goals exist to:
- Prevent scope creep
- Protect development velocity
- Avoid premature optimization
- Maintain focus on core functionality

Anything listed here is explicitly out of scope unless this document is updated.

---

## Product Scope Non-Goals

The MVP is NOT:
- A travel planning app (no itineraries, bookings, hotel search, maps, or route planning)
- A social network (no user profiles, followers, feeds, or user-to-user messaging)
- An offline landmark database (network is required for all identification)
- A real-time AR overlay (snapshot-based identification only)
- A landmark encyclopedia or browsing directory

The MVP is a **snap-and-discover landmark guide with ad marketplace**, nothing more.

---

## Content and Safety Non-Goals

Explicitly excluded:
- User-generated guide content (only LLM-generated, admin-regenerated)
- Crowdsourced landmark corrections (admin controls regeneration)
- Political or editorial commentary on landmarks
- Controversial historical interpretations

---

## UX and Design Non-Goals

Explicitly excluded:
- Visual polish beyond functional clarity
- Animations beyond basic transitions
- Design systems
- Theming
- Accessibility optimization beyond basic semantic components
- Landscape mode support (portrait-first for camera use)

UI exists to validate functionality.

---

## Platform and Integration Non-Goals

Not included in MVP:
- Web version (mobile-only via React Native)
- Android-specific features beyond cross-platform React Native
- Wearable or tablet-optimized layouts
- Integration with travel APIs (Google Maps, TripAdvisor, Booking.com)
- Payment processing for ads (free submission with admin approval only)

---

## AI and Intelligence Non-Goals

Explicitly excluded:
- Emotional intelligence or personality beyond tour guide tone
- Long-term user modeling or personalization
- Recommendation systems (e.g., "you might also like this landmark")
- Proactive suggestions without user input
- Real-time conversation with the AI about landmarks
- Image generation or manipulation

LLM is reactive and user-driven.

---

## Data and Sync Non-Goals

Not included:
- Offline mode or data sync
- User history or trip log persistence
- Bookmarking or favoriting landmarks
- Cross-device sync
- Data export

---

## Security and Compliance Non-Goals

Deferred intentionally:
- SOC2
- HIPAA
- GDPR tooling beyond basic PII avoidance
- Enterprise SSO
- Ad billing and payment security (no payments in MVP)

Basic security hygiene is sufficient for MVP.

---

## Performance and Scale Non-Goals

Out of scope:
- High concurrency support
- Horizontal scaling
- Multi-region deployments
- Sub-second latency guarantees on first identification
- CDN for TTS audio (local file storage acceptable for MVP)

---

## Testing Non-Goals

Explicitly excluded:
- Full browser matrix testing
- Load testing
- Chaos engineering
- Penetration testing
- Device-specific testing beyond primary iOS/Android emulators

Testing is correctness-focused, not scale-focused.

---

## What Triggers a Scope Review

Only the following justify revisiting non-goals:
- Repeated user pain in core flow
- System instability caused by exclusion
- Clear blocker to MVP usability
- Decision to move beyond MVP
- Landmark identification accuracy requires additional data sources

Anything else is deferred by default.

