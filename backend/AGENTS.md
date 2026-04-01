# AGENTS.md

## Purpose

This directory contains the backend for the Workout Manager Cloudflare Worker API.

The backend owns:

- Clerk-authenticated identity
- onboarding draft and completion state
- normalized user profiles
- global exercise catalog
- deterministic program generation
- active program versioning
- workout delivery
- session logging
- progression recalculation

The backend is the source of truth for product state. Clerk is identity only.

## Core Rules

- Use Clerk only for auth and canonical user identity via Clerk `sub`.
- Store active product state in D1.
- Keep KV as legacy migration support only.
- Keep route handlers thin.
- Keep business rules in services and domain modules.
- Keep persistence logic in repositories only.
- Do not move program generation into the frontend.
- Do not collapse global exercise catalog and generated user program snapshots into one concept.

## Layering

Use this flow:

```text
routes -> services -> repositories -> D1/KV
```

### Routes

Routes should:

- parse HTTP input
- read auth context
- call services
- return JSON and OpenAPI responses

Routes should not:

- implement onboarding rules
- normalize profiles
- filter catalog
- generate programs
- build SQL

### Services

Services should:

- own lifecycle orchestration
- coordinate repositories
- enforce state transitions
- decide when onboarding is complete
- decide when a program may be generated or regenerated

### Repositories

Repositories should:

- read and write D1/KV
- return domain-friendly records
- stay free of product rules

### Domain

Domain modules should:

- validate onboarding payloads
- normalize onboarding answers into profiles
- filter catalog entries
- build deterministic program definitions
- evaluate progression and session parsing

## Current Product Flow

### New users

1. user authenticates with Clerk
2. backend upserts `users`
3. frontend reads `GET /me`
4. frontend saves onboarding draft with `POST /onboarding`
5. frontend completes onboarding with `POST /onboarding/complete`
6. backend validates answers, stores `onboarding_answers`, normalizes `user_profiles`, filters `exercise_catalog`, generates a program, persists it as the active program, seeds progression, and marks onboarding completed
7. existing training flows continue through the active program snapshot

### Legacy users

1. backend upserts `users`
2. `UserLifecycleService` checks KV only when `legacy_kv_migrated_at` is still null
3. if legacy data exists, backend imports it into D1
4. backend marks `legacy_kv_migrated_at`
5. new features do not depend on KV after that

## Tables

Existing execution tables:

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

Onboarding-first additions:

- `onboarding_answers`
- `user_profiles`
- `exercise_catalog`
- `generated_program_metadata`

Important distinctions:

- `exercise_catalog` is global and reusable
- `programs/workouts/exercises/...` are per-user snapshots
- `users.onboarding_completed_at` is the user-level completion marker
- `generated_program_metadata` links a generated program to generator and profile context

## File Placement

Recommended locations for new work:

- onboarding validation/state: `src/domain/onboarding.ts`
- profile normalization: `src/domain/profile.ts`
- catalog filtering and catalog types: `src/domain/catalog.ts`
- program generation: `src/domain/generator.ts`
- onboarding persistence: `src/repositories/onboarding-repository.ts`
- profile persistence: `src/repositories/profile-repository.ts`
- catalog persistence: `src/repositories/catalog-repository.ts`
- generation metadata persistence: `src/repositories/generated-program-metadata-repository.ts`
- lifecycle orchestration: `src/services/user-lifecycle-service.ts`
- onboarding orchestration: `src/services/onboarding-service.ts`
- program generation orchestration: `src/services/program-generator-service.ts`

## API Expectations

Primary product-state endpoints:

- `GET /me`
- `GET /onboarding`
- `POST /onboarding`
- `POST /onboarding/complete`
- `POST /program/regenerate`

Existing training endpoints that should continue to work:

- `GET /program`
- `POST /program`
- `POST /program/reset`
- `GET /workout/today`
- `POST /log`
- `GET /sessions`
- `GET /sessions/:id`
- `POST /progression/run`

Guard rules:

- if a route requires an active program and the user has none:
  - return `409 { "error": "Onboarding not completed" }` when onboarding is incomplete
  - return `409 { "error": "Active program not found" }` when onboarding is complete but no active program exists
- do not silently create default programs for brand-new users on read paths
- session-read routes only need a valid authenticated D1 user

## Migration Rules

- add new migration files
- do not rewrite applied migrations
- prefer additive schema changes
- keep catalog seed changes explicit in migrations
- keep names sequential and descriptive

## Catalog Rules

- `exercise_catalog` is the generator source of truth
- generated programs must be stored through the existing program snapshot architecture
- do not query per-user program exercises as the master catalog
- keep catalog metadata explicit enough for filtering: equipment, tags, contraindications, experience, and targets

## Validation Rules

Validate all external input in domain/service layers before repositories:

- onboarding draft payloads
- onboarding completion payloads
- program payloads
- dates
- pagination parameters

Reject malformed input clearly. Repositories should not decide request validity.

## Observability

When adding logs, prefer structured information:

- route
- request id
- user id
- program id when relevant
- generator version when relevant

Never log:

- raw JWTs
- secrets
- full sensitive onboarding payloads without redaction

## Working Style

- inspect existing layers before changing them
- preserve unrelated user changes
- prefer small targeted edits
- reuse current program/session/progression architecture where possible
- do not add new dependencies unless justified
- keep code readable and easy to review

## Definition Of Done

Work is considered done when:

- the requested lifecycle works end to end
- onboarding/profile/catalog/generation logic lives outside routes
- D1 schema and migrations are coherent
- OpenAPI is updated
- existing execution routes still operate against the active program architecture
- legacy KV remains optional and non-blocking for new users
- README and this file reflect the real architecture
