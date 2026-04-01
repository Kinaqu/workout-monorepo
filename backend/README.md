# Workout Manager Backend

Cloudflare Worker API for Clerk-authenticated onboarding, backend-owned workout-program generation, workout delivery, session logging, and progression tracking.

## What This Backend Owns

- Clerk authentication and canonical `user_id` via Clerk `sub`
- onboarding draft and completion state
- normalized user profiles in D1
- global exercise catalog in D1
- deterministic program generation on the backend
- active program versioning and progression state
- workout sessions, log compatibility, and progression events
- legacy KV import only as a migration path

The frontend collects answers and renders state. Product rules and program generation stay here.

## Architecture

The backend is layered and should stay that way:

```text
routes -> services -> repositories -> D1/KV
```

Responsibilities:

- `routes/`
  Parse HTTP input, read auth context, return JSON, declare OpenAPI.
- `services/`
  Own business flow such as onboarding completion, generation, workout lookup, session writes, and progression runs.
- `repositories/`
  Own D1/KV reads and writes only.
- `domain/`
  Own validation, normalization, catalog filtering, deterministic generation, session parsing, and progression logic.

## Current Product Lifecycle

### New user

1. Frontend authenticates with Clerk.
2. First protected request upserts the user in `users`.
3. `GET /me` returns product state with no onboarding and no active program.
4. Frontend saves onboarding draft through `POST /onboarding`.
5. Frontend completes onboarding through `POST /onboarding/complete`.
6. Backend validates answers, stores draft answers, normalizes `user_profiles`, filters `exercise_catalog`, generates a program, persists it through existing `programs/workouts/exercises/program_schedule`, seeds progression state, and marks onboarding completed.
7. Existing training routes continue from the active program:
   - `GET /program`
   - `GET /workout/today`
   - `POST /log`
   - `GET /sessions`
   - `GET /sessions/:id`
   - `POST /progression/run`

### Legacy user

1. First protected request upserts the user in D1.
2. If `legacy_kv_migrated_at` is missing, the backend checks KV once.
3. If KV contains legacy program/state/log data, it imports that into D1 and marks the user as legacy-migrated.
4. New onboarding flow does not depend on KV. KV remains only for backward migration.

## Data Model

Existing execution tables still drive active training behavior:

- `users`
- `programs`
- `workouts`
- `exercises`
- `workout_exercises`
- `program_schedule`
- `exercise_progression_state`
- `workout_sessions`
- `workout_session_exercises`
- `workout_session_sets`
- `progression_events`

New onboarding and generation tables:

- `onboarding_answers`
- `user_profiles`
- `user_profile_goal_tags`
- `user_profile_equipment`
- `user_profile_focus_areas`
- `user_profile_limitation_tags`
- `user_profile_preferred_styles`
- `exercise_catalog`
- `exercise_catalog_equipment`
- `exercise_catalog_workout_tags`
- `exercise_catalog_goal_tags`
- `exercise_catalog_focus_areas`
- `exercise_catalog_contraindication_tags`
- `exercise_catalog_experience_levels`
- `generated_program_metadata`
- `workout_session_imports`

Notes:

- `exercise_catalog` is the global source of truth for exercise selection.
- `programs` are versioned, not mutable-in-place. Each new save/reset/generation creates a new program version with lineage in `program_family_id`, `version_number`, and `previous_program_id`.
- `programs/workouts/exercises/...` remain the per-user snapshot used by workout, logging, and progression flows, but `exercises.catalog_exercise_id` links snapshots back to the canonical catalog definition when possible.
- `workout_session_exercises` is an immutable execution snapshot and can store both `program_exercise_id` / `catalog_exercise_id` links plus rendered `exercise_key` / `exercise_name` / `exercise_type`.
- `workout_session_imports` holds raw parser/import payload such as `raw_text` and `unmatched_text`, so `workout_sessions` stays the canonical session header.
- Snapshot fields are immutable history. FK fields are linkage only. Do not “sync names everywhere” after catalog edits.
- `users.onboarding_completed_at` is the user-level completion marker.
- `generated_program_metadata` links a created program version to generator version, catalog seed version, and source profile context.
- `users.username` is treated as a display identifier from Clerk context, not as a product-wide unique handle.

## Key Services

- `UserLifecycleService`
  Ensures user existence, handles one-time KV migration, and guards active-program requirements.
- `OnboardingService`
  Saves onboarding drafts and completes onboarding.
- `ProgramGeneratorService`
  Filters catalog, generates a deterministic program, persists a new active version, seeds progression, and stores generation metadata.
- `ProgramService`
  Preserves manual save/reset/get behavior for active programs.
- `WorkoutService`, `SessionService`, `ProgressionService`
  Continue to operate on the active program snapshot.

## Project Structure

```text
backend/
├── migrations/
├── src/
│   ├── auth/
│   ├── db/
│   ├── domain/
│   │   ├── onboarding.ts
│   │   ├── profile.ts
│   │   ├── catalog.ts
│   │   ├── generator.ts
│   │   ├── program.ts
│   │   ├── progression.ts
│   │   └── session.ts
│   ├── middleware/
│   ├── openapi/
│   ├── repositories/
│   │   ├── onboarding-repository.ts
│   │   ├── profile-repository.ts
│   │   ├── catalog-repository.ts
│   │   ├── generated-program-metadata-repository.ts
│   │   ├── program-repository.ts
│   │   ├── progression-repository.ts
│   │   ├── session-repository.ts
│   │   ├── user-repository.ts
│   │   └── legacy-kv-repository.ts
│   ├── routes/
│   │   ├── me.ts
│   │   ├── onboarding.ts
│   │   ├── program.ts
│   │   ├── workout.ts
│   │   ├── log.ts
│   │   ├── sessions.ts
│   │   └── progression.ts
│   ├── services/
│   │   ├── user-lifecycle-service.ts
│   │   ├── onboarding-service.ts
│   │   ├── program-generator-service.ts
│   │   ├── program-service.ts
│   │   ├── workout-service.ts
│   │   ├── session-service.ts
│   │   └── progression-service.ts
│   ├── app.ts
│   └── env.ts
├── wrangler.toml
└── package.json
```

## API Surface

Protected endpoints require `Authorization: Bearer <clerk-jwt>`.

### Product state and onboarding

- `GET /me`
- `GET /onboarding`
- `POST /onboarding`
- `POST /onboarding/complete`
- `POST /program/regenerate`

### Existing execution endpoints

- `GET /program`
- `POST /program`
- `POST /program/reset`
- `GET /workout/today`
- `POST /log`
- `GET /log/{date}`
- `GET /sessions`
- `GET /sessions/{id}`
- `POST /progression/run`

Guard semantics:

- If a route needs an active program and the user has none:
  - `409 { "error": "Onboarding not completed" }` when onboarding is still incomplete.
  - `409 { "error": "Active program not found" }` when onboarding is completed but no active program exists.
- Session-read routes only require an authenticated D1 user record.

## Exercise Catalog Source Of Truth

Initial catalog data is seeded by D1 migration `0003_onboarding_catalog_generation.sql`.
Schema hardening and normalized tag tables are added by `0004_schema_hardening.sql`.
Date validation guards for legacy non-rewritten tables are added by `0005_date_validation_guards.sql`.

This is the current seed path because it is:

- deploy-friendly for Workers/D1
- deterministic across local and remote environments
- explicit in version control
- independent from KV

Future catalog changes should be additive:

1. add a new migration
2. insert/update catalog rows explicitly
3. bump `seed_version` when the catalog meaningfully changes

For filter-heavy attributes, keep the JSON payload for convenience but also maintain the normalized tag tables. The database migration now does this for catalog and profile traits so ad hoc analytics and indexed filtering do not depend on JSON extraction.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.dev.vars`:

```bash
RESET_TOKEN=local-reset-token
CLERK_ISSUER=https://your-clerk-domain.clerk.accounts.dev
CLERK_AUDIENCE=
CLERK_JWKS_URL=
```

Apply local migrations:

```bash
npx wrangler d1 migrations apply DB --local
```

Run the Worker:

```bash
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run d1:preflight-0004:local
npm run d1:postflight-0004:local
npm run cf-typegen
npm run deploy
```

For `0004_schema_hardening.sql`, run preflight before applying to populated databases and postflight immediately after. The migration now uses deferred foreign-key enforcement plus in-migration assertions for orphaned progression rows, duplicate orderings, row-count preservation, normalized-tag parity, and final `foreign_key_check`. `wrangler d1 migrations apply` rolls back a failed migration file, but these checks are still important because they fail early with data-shape errors instead of leaving the root cause implicit.

Docs:

- `GET /openapi.json`
- `GET /docs`

## Development Rules

- Keep routes thin.
- Keep business rules in services and domain modules.
- Do not move generation logic into the frontend.
- Do not use KV for new product features.
- Do not treat `exercise_catalog` and user program snapshots as the same thing.
- Keep `exercise_catalog` canonical, `exercises` as per-program snapshots with optional catalog links, and sessions as immutable execution snapshots.
- Treat rendered snapshot fields as immutable history and FK fields as linkage. They intentionally duplicate some catalog/program data.
- Add new migrations; do not rewrite applied migrations.
- Prefer additive, backward-safe schema changes.
- Preserve existing training/session/progression behavior unless a product rule explicitly requires a change.

## Verification Performed

- `npm run typecheck`
- `npx wrangler d1 migrations apply DB --local`
- `npx wrangler d1 execute DB --local --command "SELECT COUNT(*) AS catalog_count FROM exercise_catalog; ..."`

Current local catalog seed count: `19`.
