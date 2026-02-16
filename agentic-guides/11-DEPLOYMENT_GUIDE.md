# deployment guide (Fly.io + Docker for TypeScript monorepos)

This guide captures **production deployment patterns** for a TypeScript monorepo with separate frontend (Next.js) and backend (Express/Prisma) packages deployed to Fly.io.

**Read this guide before generating any Dockerfiles, fly.toml configs, or deployment scripts.** It encodes hard-won lessons that avoid common multi-hour debugging sessions.

---

## critical gotchas (read first)

### 1. Prisma v7 generates extensionless ESM imports

**Problem:** Prisma v7's `prisma-client` generator emits `.ts` files with extensionless relative imports (e.g., `from "./internal/class"`). When compiled by `tsc`, these become `.js` files that still have extensionless imports. Node.js ESM mode **requires** `.js` extensions on relative imports, so `node dist/index.js` crashes with `ERR_MODULE_NOT_FOUND`.

**Symptom:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/packages/backend/dist/generated/prisma/internal/class'`

**Why it works locally:** Dev scripts use `tsx` (which has a built-in ESM loader that resolves extensionless imports).

**Solution:** Use `tsx` as the production runtime — move it from `devDependencies` to `dependencies` in the backend `package.json` and use it in the Docker CMD:

```json
{
  "dependencies": {
    "tsx": "^4.19.0"
  },
  "scripts": {
    "start": "tsx dist/index.js"
  }
}
```

```dockerfile
CMD ["npx", "tsx", "packages/backend/dist/index.js"]
```

**DO NOT** attempt `sed`-based import patching — it's fragile and hard to get right across Docker's build cache layers.

### 2. Next.js `NEXT_PUBLIC_*` vars are build-time, not runtime

**Problem:** `NEXT_PUBLIC_*` environment variables are **baked into the client bundle** during `next build`. Setting them at container runtime has no effect.

**Solution:** Pass them as Docker `--build-arg` values:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

```bash
fly deploy --build-arg NEXT_PUBLIC_API_URL=https://your-api.fly.dev
```

### 3. Next.js standalone output monorepo path

**Problem:** Next.js `output: "standalone"` preserves the monorepo directory structure. If your app is at `packages/frontend/`, the server entry point is at `packages/frontend/server.js` inside the standalone output, **not** at the root.

**Solution:**

```dockerfile
COPY --from=build /app/packages/frontend/.next/standalone ./
COPY --from=build /app/packages/frontend/.next/static ./packages/frontend/.next/static
CMD ["node", "packages/frontend/server.js"]
```

Also set `HOSTNAME=0.0.0.0` so the Next.js server binds correctly inside Docker:

```dockerfile
ENV HOSTNAME=0.0.0.0
```

### 4. `node --env-file` fails if file doesn't exist

**Problem:** `node --env-file=../../.env dist/index.js` crashes with an error if the `.env` file doesn't exist (which it won't in production containers).

**Solution:** Have separate scripts:

```json
{
  "start": "tsx dist/index.js",
  "start:dev": "node --env-file=../../.env dist/index.js"
}
```

In Docker, env vars are injected by the platform (Fly secrets), so no `.env` file is needed.

### 5. `dotenv` config is safe — it no-ops on missing files

The monorepo pattern uses `dotenv` in `next.config.ts` and `prisma.config.ts` to load from `../../.env`. This is **safe in production** — `dotenv`'s `config()` silently does nothing if the file doesn't exist, and `process.env` values set by the platform take precedence anyway (dotenv doesn't override existing env vars).

### 6. Prisma `db push` requires running from the package directory

**Problem:** Running `npx prisma db push --schema packages/backend/prisma/schema.prisma` from the monorepo root may fail to find `prisma.config.ts`.

**Solution:** Always `cd` into the backend package first:

```bash
cd packages/backend && DATABASE_URL="..." npx prisma db push
```

### 7. Fly Postgres proxy for local admin commands

**Problem:** Fly Postgres internal addresses (e.g., `polispect-db.flycast:5432`) are only reachable from other Fly machines.

**Solution:** Use `fly proxy` to tunnel from your local machine:

```bash
fly proxy 15432:5432 --app YOUR-DB-APP &
cd packages/backend && DATABASE_URL="postgres://postgres:PASSWORD@localhost:15432/DB_NAME" npx prisma db push
```

### 8. Docker build layer caching can hide fixes

**Problem:** Fly's remote builder (Depot) aggressively caches Docker layers. If you change a `sed` command or script but the `COPY` layers above it are unchanged, the fix may not execute.

**Solution:** If you suspect stale cache, add `--no-cache` or modify a file that invalidates the relevant layer.

---

## files to generate for deployment

### `.dockerignore` (repo root)

```
node_modules
.git
.gitignore
.env
.env.*
*.md
!packages/mcp/prompts/**/*.md

# Build artifacts (rebuilt in Docker)
packages/shared/dist
packages/mcp/dist
packages/backend/dist
packages/frontend/.next
packages/frontend/out

# Dev / test files
manual-fixtures
workflow
tasks
spec
agentic-guides
.cursor
.vscode
*.test.ts
*.test.tsx
__tests__
coverage
.turbo
```

### `Dockerfile.backend`

Multi-stage build: deps → build → production.

Key requirements:
- Stage 1 (deps): `npm ci` with all deps (including devDependencies for build tooling)
- Stage 2 (build): Build `shared` → `mcp` → `prisma generate` → `backend` (dependency order matters)
- Stage 3 (production): `npm ci --omit=dev`, copy built artifacts + MCP prompt templates
- **`tsx` must be a production dependency** (see gotcha #1)
- Copy `packages/mcp/prompts/` to production stage (runtime prompt loading reads from filesystem)
- Copy `packages/backend/prisma/` to production stage (Prisma client needs the schema at runtime)

```dockerfile
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/mcp/package.json packages/mcp/
COPY packages/backend/package.json packages/backend/
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/mcp/ packages/mcp/
COPY packages/backend/ packages/backend/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/mcp
RUN cd packages/backend && npx prisma generate
RUN npm run build --workspace=packages/backend

FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/mcp/package.json packages/mcp/
COPY packages/backend/package.json packages/backend/
RUN npm ci --omit=dev
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/mcp/dist packages/mcp/dist
COPY --from=build /app/packages/mcp/prompts packages/mcp/prompts
COPY --from=build /app/packages/backend/dist packages/backend/dist
COPY --from=build /app/packages/backend/prisma packages/backend/prisma
EXPOSE 3001
CMD ["npx", "tsx", "packages/backend/dist/index.js"]
```

### `Dockerfile.frontend`

Key requirements:
- `NEXT_PUBLIC_*` vars passed as `ARG` + `ENV` in the build stage
- Next.js config must have `output: "standalone"`
- Static assets copied separately from standalone output
- `HOSTNAME=0.0.0.0` set in production stage

```dockerfile
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci

FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GA4_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/frontend/ packages/frontend/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/frontend

FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build /app/packages/frontend/.next/standalone ./
COPY --from=build /app/packages/frontend/.next/static ./packages/frontend/.next/static
EXPOSE 3000
CMD ["node", "packages/frontend/server.js"]
```

### `fly.backend.toml`

```toml
app = "{{PROJECT}}-api"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile.backend"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

### `fly.frontend.toml`

```toml
app = "{{PROJECT}}-web"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile.frontend"
  [build.args]
    NEXT_PUBLIC_API_URL = "https://{{PROJECT}}-api.fly.dev"
    NEXT_PUBLIC_FRONTEND_URL = "https://{{PROJECT}}-web.fly.dev"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

---

## next.config.ts changes for production

Add `output: "standalone"` for Docker:

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",  // Required for Docker deployment
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] ?? "",
    NEXT_PUBLIC_API_URL:
      process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001",
  },
};
```

---

## backend package.json changes for production

1. Move `tsx` from `devDependencies` to `dependencies`
2. Split start scripts:

```json
{
  "scripts": {
    "start": "tsx dist/index.js",
    "start:dev": "node --env-file=../../.env dist/index.js"
  },
  "dependencies": {
    "tsx": "^4.19.0"
  }
}
```

---

## deployment sequence

### 1. Prerequisites

```bash
brew install flyctl
fly auth login
```

### 2. Create Fly Postgres

```bash
fly postgres create --name {{PROJECT}}-db --region sjc
```

### 3. Create and configure backend app

```bash
fly apps create {{PROJECT}}-api --machines
fly postgres attach {{PROJECT}}-db --app {{PROJECT}}-api

fly secrets set \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  GOOGLE_CLIENT_ID="your-google-client-id" \
  OPENAI_API_KEY="your-openai-api-key" \
  FRONTEND_ORIGIN="https://{{PROJECT}}-web.fly.dev" \
  --app {{PROJECT}}-api
```

### 4. Push database schema

```bash
fly proxy 15432:5432 --app {{PROJECT}}-db &
cd packages/backend && \
  DATABASE_URL="postgres://postgres:PASSWORD@localhost:15432/{{PROJECT}}_api" \
  npx prisma db push
kill %1
```

### 5. Deploy backend

```bash
fly deploy --config fly.backend.toml
curl https://{{PROJECT}}-api.fly.dev/health
```

### 6. Create and deploy frontend app

```bash
fly apps create {{PROJECT}}-web --machines

fly deploy --config fly.frontend.toml \
  --build-arg NEXT_PUBLIC_API_URL=https://{{PROJECT}}-api.fly.dev \
  --build-arg NEXT_PUBLIC_FRONTEND_URL=https://{{PROJECT}}-web.fly.dev \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id \
  --build-arg NEXT_PUBLIC_GA4_ID=G-XXXXXXX
```

### 7. Update OAuth provider

Add the production URLs to your OAuth provider's allowed origins:
- **Authorized JavaScript origins:** `https://{{PROJECT}}-web.fly.dev`
- **Authorized redirect URIs:** `https://{{PROJECT}}-api.fly.dev/auth/google/callback`

### 8. Verify

```bash
curl https://{{PROJECT}}-api.fly.dev/health
open https://{{PROJECT}}-web.fly.dev
```

---

## environment variables reference

### Backend (set via `fly secrets set`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✓ (auto-set by `fly postgres attach`) | Postgres connection string |
| `SESSION_SECRET` | ✓ | JWT signing secret |
| `GOOGLE_CLIENT_ID` | ✓ (if using Google OAuth) | OAuth client ID |
| `OPENAI_API_KEY` | ✓ (if using LLM) | OpenAI API key |
| `OPENAI_MODEL` | ○ | Override default model (default: `gpt-4o-mini`) |
| `FRONTEND_ORIGIN` | ✓ | CORS allowed origin |
| `PORT` | ○ | Server port (default: `3001`, set in fly.toml) |
| `NODE_ENV` | ○ | Set to `production` in fly.toml |

### Frontend (set via `--build-arg` at deploy time)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✓ | Backend API base URL |
| `NEXT_PUBLIC_FRONTEND_URL` | ✓ | Frontend public URL (for share links, OG tags) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✓ (if using Google OAuth) | OAuth client ID |
| `NEXT_PUBLIC_GA4_ID` | ○ | Google Analytics measurement ID |

---

## useful fly commands

| Command | Description |
|---------|-------------|
| `fly logs --app APP` | Stream logs |
| `fly status --app APP` | Machine status |
| `fly scale count 1 --app APP` | Keep 1 machine always running (avoid cold starts) |
| `fly secrets list --app APP` | List configured secrets |
| `fly secrets set KEY=VAL --app APP` | Set a secret |
| `fly proxy 15432:5432 --app DB-APP` | Tunnel to Postgres for local admin |
| `fly deploy --config fly.FILE.toml --no-cache` | Force fresh build (bypass layer cache) |

---

## CORS and cookies in production

When frontend and backend are on separate Fly apps (different subdomains):
- CORS must be configured with the exact frontend origin (not `*`)
- Session cookies need `sameSite: "lax"` (not `"strict"`) and `secure: true`
- The `FRONTEND_ORIGIN` env var controls the CORS allowed origin
- Express `app.listen(PORT)` binds to `0.0.0.0` by default — no changes needed for Docker

---

## cold start behavior

Fly's `auto_stop_machines = "stop"` means machines stop after idle periods. First request after idle triggers a cold start (~1-3s). To avoid this:

```bash
fly scale count 1 --app YOUR-APP  # keep 1 machine always running
```

Or set `min_machines_running = 1` in the `fly.toml`.

