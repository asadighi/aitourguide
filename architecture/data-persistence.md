# data persistence

## entity model

### User
- id: string (UUID) – primary key
- email: string – from OAuth provider
- name: string – display name from OAuth
- role: enum (end_user, ad_provider, admin) – assigned after OAuth
- oauth_provider: string – "google" or "apple"
- oauth_id: string – provider-specific user ID
- locale: string – preferred language (default "en")
- created_at: datetime
- updated_at: datetime
- relationships: has many Reviews, has many Ads (if ad_provider)

### Landmark
- id: string (UUID) – primary key
- name: string – canonical landmark name
- city: string | null
- country: string | null
- lat: float | null – approximate coordinates
- lng: float | null – approximate coordinates
- category: enum (monument, building, natural, religious, historical, cultural, other)
- first_identified_at: datetime
- created_at: datetime
- updated_at: datetime
- relationships: has many GuideContents, has many Ads

### GuideContent
- id: string (UUID) – primary key
- landmark_id: string (FK → Landmark)
- locale: string – language code (e.g., "en", "fr", "ja")
- version: integer – incremented on regeneration
- title: string
- summary: string
- facts: json – array of {heading, body} objects
- narration_script: string – full text for TTS
- fun_fact: string | null
- admin_prompt: string | null – additional prompt used for regeneration
- is_active: boolean – true for the current serving version
- created_at: datetime
- relationships: belongs to Landmark, has one AudioNarration, has many Reviews

### AudioNarration
- id: string (UUID) – primary key
- guide_content_id: string (FK → GuideContent)
- file_path: string – path to cached audio file
- duration_ms: integer | null
- voice_id: string – OpenAI voice identifier used
- created_at: datetime
- relationships: belongs to GuideContent

### Ad
- id: string (UUID) – primary key
- provider_id: string (FK → User where role = ad_provider)
- title: string – ad headline
- body: string – ad description
- image_url: string | null – optional ad image
- link_url: string – where the ad links to
- status: enum (pending, approved, rejected)
- admin_feedback: string | null – feedback on rejection
- reviewed_by: string | null (FK → User where role = admin)
- reviewed_at: datetime | null
- created_at: datetime
- updated_at: datetime
- relationships: belongs to User (provider), many-to-many with Landmarks (via AdLandmark)

### AdLandmark (join table)
- ad_id: string (FK → Ad)
- landmark_id: string (FK → Landmark)
- relationships: belongs to Ad, belongs to Landmark

### Review
- id: string (UUID) – primary key
- user_id: string (FK → User)
- guide_content_id: string (FK → GuideContent)
- rating: integer – 1-5 stars
- text: string | null – optional review text
- created_at: datetime
- relationships: belongs to User, belongs to GuideContent

### Prompt (for prompt registry)
- id: string (UUID) – primary key
- prompt_id: string – identifier (e.g., "landmark_identify")
- version: string – semantic version (e.g., "1.0.0")
- content: text – full prompt markdown content
- schema_type: string – expected output schema name
- is_active: boolean – true for the currently active version
- created_at: datetime
- relationships: none

---

## invariants

- Only one GuideContent per landmark + locale can have is_active = true
- Only one Prompt per prompt_id can have is_active = true
- Ad status can only transition: pending → approved, pending → rejected
- Review rating must be 1-5 inclusive
- GuideContent version must monotonically increase per landmark + locale
- AudioNarration must exist for every active GuideContent (eventually, after TTS generation)
- Users with role end_user cannot access ad provider or admin routes
- Rejected or pending ads must never appear in user-facing queries

---

## migrations strategy

- tool: Prisma Migrate
- workflow: create migration with `npx prisma migrate dev`, apply with `npx prisma migrate deploy`
- environments:
  - dev: SQLite or local Postgres; auto-migrate on start
  - production: Fly.io managed Postgres; migrate on deploy via release command

---

## caching strategy

### Guide Content Cache
- what is cached: GuideContent (text) per landmark + locale
- cache key format: `guide:{landmark_id}:{locale}`
- invalidation: on content regeneration (new version created, old deactivated)
- storage: PostgreSQL (the active GuideContent row IS the cache)

### TTS Audio Cache
- what is cached: generated audio files per GuideContent version
- cache key format: `audio:{guide_content_id}`
- invalidation: new GuideContent version triggers new TTS generation
- storage: local filesystem (Fly volume) for MVP; object storage later

### Landmark Cache
- what is cached: landmark identification results
- cache key format: not applicable — landmarks are persisted entities
- invalidation: landmarks are append-only, never invalidated
- storage: PostgreSQL

---

## backup and restore

- Fly.io managed Postgres includes daily backups
- No additional backup strategy for MVP
- Audio files on Fly volumes are not backed up (regenerable from content)

