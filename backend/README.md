# Workout API Backend

Cloudflare Worker backend for the workout application. Authentication stays fully on Clerk. The backend verifies Clerk JWTs, treats the Clerk `sub` as the canonical `user_id`, and stores program templates, progression state, and workout session history in Cloudflare D1.

## Architecture

The backend now has explicit domain boundaries:

- `program templates`: immutable program versions with normalized workouts, exercises, and weekly schedule
- `progression state`: per-user, per-program exercise state used to derive today's prescription
- `workout sessions`: append-only history with multiple sessions per day, structured sets, and text-log ingestion

HTTP routes call services. Services call repositories. Route handlers no longer touch KV or D1 directly.

## Storage Model

Primary storage is D1 with the following tables:

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

Legacy KV is retained only for staged migration. On first authenticated access for a user, the backend:

1. checks for an active D1 program
2. imports the user's legacy KV program, state, and logs if D1 is empty
3. seeds normalized D1 rows
4. continues using D1 as the source of truth

KV is no longer the primary datastore.

## Auth Model

- Clerk remains the only auth provider.
- The Worker verifies Clerk Bearer JWTs against Clerk JWKS.
- `user_id` in D1 always means the Clerk JWT `sub`.
- No local auth, password, session, or login tables are introduced.

## API

Protected routes require `Authorization: Bearer <clerk-jwt>`.

### Auth

- `POST /auth/register`
- `POST /auth/login`

Both are intentionally disabled with `410`.

### Workouts

- `GET /workout/today`
  Returns the deterministic workout for the current day.
  Optional query: `?date=YYYY-MM-DD`

### Programs

- `GET /program`
  Returns the active program template plus progression metadata.
- `POST /program`
  Saves a new active program version.
- `POST /program/reset`
  Resets to the built-in default program. Requires `X-Reset-Token`.

### Sessions and Logs

- `POST /log`
  Compatibility endpoint. Accepts JSON or plain text and creates a workout session.
- `GET /log/:date`
  Compatibility endpoint. Returns the latest session for the date plus `sessions` when multiple sessions exist.
- `GET /sessions`
  Lists session history. Supports `?limit=` and `?date=YYYY-MM-DD`.
- `GET /sessions/:id`
  Returns a full stored session.

### Progression

- `POST /progression/run`
  Reads recent session history from D1 and updates `exercise_progression_state` without mutating the program template.

## Program Payload

`POST /program` still accepts the legacy program shape:

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

Internally that payload is normalized into D1 rows.

## Development

Install dependencies:

```bash
npm install
```

Run the Worker locally:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

Required environment variables:

- `CLERK_ISSUER`
- `CLERK_AUDIENCE` optional
- `CLERK_JWKS_URL` optional
- `RESET_TOKEN`

## Cloudflare Configuration

`wrangler.toml` now binds:

- `DB`: D1 production database `workout-api-prod`
- `preview_database_id`: D1 preview database `workout-api-preview`
- `KV`: retained temporarily for legacy import only

Migrations live in [migrations/0001_initial.sql](/home/dev/repos/workout-monorepo/backend/migrations/0001_initial.sql).

## Migration Notes

### What changed

- KV blobs are replaced by normalized D1 storage.
- Program templates are immutable versions.
- Progression state is isolated in `exercise_progression_state`.
- Workout logging is append-only session history with multiple sessions per day.
- Progression reads session history and updates state only.

### Compatibility

- Clerk auth behavior is preserved.
- `GET /program`, `GET /workout/today`, `POST /log`, `GET /log/:date`, and `POST /progression/run` still exist.
- `GET /log/:date` now exposes `sessions` because a date can contain multiple sessions.

### Deployment steps

1. Ensure Worker secrets/vars are set for Clerk and `RESET_TOKEN`.
2. Confirm `wrangler.toml` points at the correct D1 and KV resources.
3. Apply migrations to both D1 databases if they are recreated.
4. Deploy with `npm run deploy`.
5. Allow users to lazily migrate on first authenticated access, or remove KV after the migration window if all users are imported.

### Important migration caveat

Legacy KV programs may already contain progression-mutated targets because the old model mixed template and user state. During import, the backend treats the stored KV program as the current template snapshot and seeds independent progression state from it. After import, progression no longer mutates templates.
