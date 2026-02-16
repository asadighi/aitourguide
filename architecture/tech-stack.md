# tech stack

## chosen stack

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Language | TypeScript | 5.x | Type safety across all packages |
| Frontend | React Native (Expo) | SDK 52+ | Mobile-first with native camera, audio, sharing |
| Backend | Node.js + Express | Express 4.x | Boring, proven, huge ecosystem |
| Database | PostgreSQL | 16.x | Relational model fits versioned content, ads, users |
| ORM | Prisma | 6.x | Great DX, typed queries, migration management |
| Auth | OAuth (Google + Apple) | - | Mobile-native login, no password management |
| Model Provider | OpenAI (GPT-4o + TTS) | - | Best-in-class vision + TTS, provider-agnostic adapter |
| Test Runner | Vitest | 2.x | Fast, ESM-native, TypeScript-first |
| Monorepo | npm workspaces | - | Simplest option, zero extra tooling |

---

## operational constraints

- hosting: Fly.io for backend + Postgres; Expo EAS for mobile builds
- build: TypeScript compilation via tsc; Expo build for mobile
- CI: none for MVP; tests run locally

---

## key dependencies

List of major npm packages that are architectural choices:

- `express`: HTTP server framework
- `@prisma/client` + `prisma`: ORM and migration tool
- `zod`: schema validation for all shared types and LLM outputs
- `openai`: OpenAI SDK for GPT-4o vision, text, and TTS
- `expo-camera`: camera access in React Native
- `expo-av`: audio playback for TTS narration
- `expo-sharing`: social sharing APIs
- `expo-auth-session`: OAuth flow in Expo
- `vitest`: test runner across all packages
- `concurrently`: run multiple dev scripts in parallel
- `uuid`: correlation IDs for request logging
- `pino`: structured JSON logging

---

## alternatives considered

| Choice | Alternative | Why Not |
|--------|-------------|---------|
| Express | Fastify | Express is more widely known; performance difference negligible at MVP scale |
| Express | NestJS | Too opinionated for 4-package monorepo; adds complexity |
| Prisma | Drizzle | Prisma has better migration tooling and DX for rapid development |
| npm workspaces | pnpm | npm is sufficient; avoid additional tooling |
| npm workspaces | Turborepo | Not needed until build caching matters |
| React Native (Expo) | Flutter | Dart breaks shared TypeScript story |
| React Native (Expo) | PWA | Camera, device shortcuts, and social sharing are limited on web |
| PostgreSQL | SQLite | Need concurrent access, JSON support, and production-ready hosting |
| Vitest | Jest | Vitest is faster, ESM-native, better TS support |

