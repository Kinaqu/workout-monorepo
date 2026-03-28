# Workout Backend

Cloudflare Worker backend for the Workout Manager project. Clerk remains the only authentication provider, while the Worker verifies Clerk JWTs and stores program, progression, and workout-session data in Cloudflare D1.

## Overview

The backend is organized around clear application layers:

- route handlers parse HTTP requests and return responses
- services contain application logic
- repositories read and write D1 and legacy KV data
- domain modules define program, progression, and session behavior

The backend still keeps KV binding support for staged migration, but D1 is the primary datastore.

## Features

- Clerk JWT verification inside the Worker
- D1-backed normalized storage for programs, workouts, exercises, and sessions
- Append-only workout session history
- Deterministic daily workout generation from active program state
- Program reset and progression recalculation endpoints
- Lazy import path from legacy KV into D1 on first authenticated access

## Tech Stack

- Cloudflare Workers
- Wrangler
- Cloudflare D1
- Cloudflare KV for legacy import support
- TypeScript

## Project Structure

```text
backend/
├── migrations/
├── src/
│   ├── auth/
│   ├── domain/
│   ├── http/
│   ├── repositories/
│   ├── routes/
│   └── services/
├── package.json
├── tsconfig.json
└── wrangler.toml
```

## Storage Model

Primary storage is D1. Main tables:

- `users`
- `programs`
- `program_schedule`
- `workouts`
- `exercises`
- `workout_exercises`
- `exercise_progression_state`
- `workout_sessions`
- `workout_session_exercises`
- `workout_session_sets`
- `progression_events`

Legacy KV is retained only to import older user data into D1 when needed.

## API

Protected routes require:

```http
Authorization: Bearer <clerk-jwt>
```

Active endpoints:

- `GET /workout/today`
- `GET /program`
- `POST /program`
- `POST /program/reset`
- `POST /log`
- `GET /log/:date`
- `GET /sessions`
- `GET /sessions/:id`
- `POST /progression/run`

Legacy auth endpoints intentionally return `410 Gone`:

- `POST /auth/register`
- `POST /auth/login`

## Program Payload

`POST /program` accepts the legacy program shape and normalizes it into D1 rows:

```json
{
  "id": "default",
  "name": "Program name",
  "schedule": {
    "monday": "A",
    "tuesday": "B",
    "wednesday": "rest",
    "thursday": "A",
    "friday": "B",
    "saturday": "stretch",
    "sunday": "rest"
  },
  "workouts": {
    "A": {
      "name": "Workout A",
      "exercises": [
        {
          "id": "pushups",
          "name": "Push Ups",
          "type": "reps",
          "max_sets": 3,
          "reps": { "min": 8, "max": 12 }
        }
      ]
    }
  }
}
```

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm
- Cloudflare account for remote deploys

### Install

```bash
cd backend
npm install
```

### Environment Variables

For local development, create `backend/.dev.vars`:

```bash
RESET_TOKEN=local-reset-token
CLERK_ISSUER=https://your-clerk-domain.clerk.accounts.dev
CLERK_AUDIENCE=
CLERK_JWKS_URL=
```

Required:

- `RESET_TOKEN`
- `CLERK_ISSUER`

Optional:

- `CLERK_AUDIENCE`
- `CLERK_JWKS_URL`

Wrangler loads `.dev.vars` in local development. Do not commit that file.

### Apply Local Migrations

Before the first local run, apply D1 migrations to the local database used by Wrangler:

```bash
npx wrangler d1 migrations apply DB --local
```

If you add a new migration later, run the same command again.

### Run Locally

```bash
npm run dev
```

Wrangler serves the Worker locally, usually on `http://127.0.0.1:8787`.

## Development Workflow

Useful commands:

```bash
npm run dev
npm run typecheck
npm run cf-typegen
npm run deploy
```

Recommended local workflow:

1. Update or add SQL files in `migrations/` when the schema changes.
2. Apply migrations locally with `npx wrangler d1 migrations apply DB --local`.
3. Start the Worker with `npm run dev`.
4. Point the frontend `BASE_URL` in `../frontend/api.js` to `http://127.0.0.1:8787` if you want end-to-end local testing.
5. Run `npm run typecheck` before shipping changes.

## D1 and Migration Notes

Current migration files:

- `migrations/0001_initial.sql`
- `migrations/0002_users_legacy_marker.sql`

For preview or remote databases, use Wrangler explicitly:

```bash
npx wrangler d1 migrations apply DB --preview
npx wrangler d1 migrations apply DB --remote
```

Use `--preview` for the preview database configured in `wrangler.toml` and `--remote` for the remote database used by `wrangler dev --remote`.

## Cloudflare Configuration

`wrangler.toml` currently binds:

- `DB` to the D1 database
- `KV` to the legacy KV namespace

Production deployment uses the Worker defined by:

- `name = "workout-api"`
- `main = "src/index.ts"`

## Deployment

Deploy from the `backend/` directory:

```bash
npm run deploy
```

Before deploying:

1. Make sure Cloudflare auth is configured locally for Wrangler.
2. Confirm `wrangler.toml` points to the correct D1 and KV resources.
3. Apply pending migrations to the intended database.
4. Ensure production secrets and vars are configured for Clerk and `RESET_TOKEN`.

## Migration Caveat

Old KV data may already contain progression-mutated values because the previous model mixed program template data with user state. During import, the backend treats that KV snapshot as the current template baseline, seeds D1 progression state from it, and continues forward with D1 as the source of truth.
