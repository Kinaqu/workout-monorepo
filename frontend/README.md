<div align="center">
  <h1>🏋️ Workout Manager Frontend</h1>

  <p>
    <strong>React frontend for tracking daily workouts and interacting with the Workout Manager API.</strong>
  </p>
</div>

The application lets users complete onboarding, review and activate a recommended training plan, log daily workouts, inspect history, and review the active program. It is a Vite + React 19 multi-page app connected to the Cloudflare Workers backend in this monorepo.

## Tech stack

- **React 19** with a single root per HTML entry (`/`, `/login`, `/register`)
- **TanStack Query** for server state (caching, request dedup, invalidation)
- **TypeScript (strict)** everywhere; API types are generated from the backend OpenAPI document
- **Clerk** for authentication
- **boneyard-js** for pixel-accurate skeleton loading states
- **Vite** build, deployed on Vercel; PWA service worker for static assets

## Architecture

```
main.tsx                  Clerk gate (ensureClerkReady) -> React root
app/App.tsx               shell: /me lifecycle refresh, shell-mode routing
                          (onboarding | recommendation | app), tab switching,
                          [data-action] delegation, bootstrap error ladder
app/BottomNav.tsx         bottom tab bar
app/product-state.ts      imperative snapshot of the latest /me state
features/<name>/index.ts  feature controller: imperative surface for the shell
                          (load / renderRecoveryState / ...) + external view
                          state consumed by the component via useSyncExternalStore
features/<name>/*.tsx     the feature UI (TodayTab, HistoryTab, ProgramTab,
                          OnboardingShell, RecommendationShell)
lib/api/client.ts         typed fetch client (Clerk bearer token, 401 retry)
lib/api/types.gen.ts      GENERATED from backend/openapi.json - do not edit
lib/api/contracts.ts      stable aliases over generated schemas
lib/query/                QueryClient (retry/refocus-refetch off) + query keys
lib/auth/clerk.ts         shared Clerk bootstrap for all three entries
shared/                   components (EmptyState, ConfirmDialog, ShellSkeleton),
                          hooks (useRoutedApiError), utils (date/format/...)
```

### Decisions worth knowing

- **The main app has no ClerkProvider.** It only needs an is-signed-in gate
  and Bearer tokens, both served by the plain `window.Clerk` instance via
  `lib/auth/clerk.ts` and `@clerk/shared/getToken`. This keeps production
  and the local smoke tests (which stub `window.Clerk` with a plain object
  and run without a publishable key) on the same code path. The auth pages
  (`/login`, `/register`) do use `ClerkProvider` - they render Clerk UI
  components.
- **API types are generated.** `npm run generate:api` regenerates
  `lib/api/types.gen.ts` from `../backend/openapi.json`;
  `npm run check` fails if it is stale. Add new aliases in
  `lib/api/contracts.ts` as schemas get consumed.
- **Query defaults are conservative** (`retry: false`,
  `refetchOnWindowFocus: false`, 30s staleTime) so request behavior stays
  predictable under the smoke-test fetch mocks.
- **Skeletons**: `bones/*.bones.json` + `bones/registry.ts` are
  auto-generated. To re-capture them after a layout change, run the dev
  server and `npx boneyard-js build` against the routes configured in
  `vite.config.ts` (`/login.html`, `/register.html`, `/bones.html`;
  `bones.html` + `bones-fixtures.js` exist only for capture and are not
  part of the production build).

## Getting started

```bash
npm install
npm run dev          # dev server on port 3000
npm run check        # codegen freshness + eslint + tsc + build
npm run test:smoke:local  # build + Playwright smoke suite
```

`VITE_CLERK_PUBLISHABLE_KEY` must be set for real sign-in (see
`.env.example`); the smoke tests run without it.

## Testing

`tests/smoke/frontend-smoke.spec.ts` is the functional regression gate: it
stubs Clerk on `window`, mocks every API endpoint, and asserts on the
rendered DOM across the full product flow (onboarding -> recommendation ->
activation -> logging -> history -> plan). CI runs it headless on desktop
and mobile viewports; `frontend-deployment-smoke.yml` runs the same spec
against Vercel preview deployments with real Clerk.
