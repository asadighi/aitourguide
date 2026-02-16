# deployment and hosting

## environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| local | development | localhost:4000 (backend), Expo Dev Client (frontend) |
| production | user-facing | Fly.io (backend), App Store / Play Store (frontend) |

---

## deployment method

### Backend
- platform: Fly.io
- deployment: `fly deploy` from CLI or git-based deploy
- container: Dockerfile for Node.js backend
- database: Fly.io managed Postgres
- volumes: Fly volume for TTS audio file storage

### Frontend
- platform: Expo EAS (Expo Application Services)
- deployment: `eas build` + `eas submit` for app store distribution
- dev builds: Expo Dev Client for local development

---

## config and env var strategy

- all config via environment variables
- `env.example` at repo root lists all required vars
- Fly.io secrets for production values
- required variables:
  - `DATABASE_URL` — Postgres connection string
  - `OPENAI_API_KEY` — OpenAI API key
  - `GOOGLE_CLIENT_ID` — Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
  - `APPLE_CLIENT_ID` — Apple Sign-In service ID
  - `APPLE_TEAM_ID` — Apple developer team ID
  - `JWT_SECRET` — secret for signing JWTs
  - `PORT` — backend server port (default 4000)
  - `NODE_ENV` — environment (development, production)
  - `TTS_AUDIO_DIR` — directory for cached TTS audio files

---

## scaling expectations (MVP)

- expected load: low (personal project / early testing)
- single Fly.io machine is sufficient
- single Postgres instance
- no horizontal scaling needed
- no CDN needed for MVP (audio served from Fly volume)
- scaling strategy: add Fly machines and move audio to object storage when needed

