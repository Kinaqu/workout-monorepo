# Frontend Vercel Test Plan

## Goal

Ensure frontend changes are validated before merge into `main`, tested on Vercel Preview, and only promoted to Production after all required checks are green.

## Current State

### Facts

- The frontend is deployed to Vercel as a separate project: `workout-frontend`.
- Preview deployments for PR branches are already created automatically.
- Production deployments are created from `main`.
- The repository previously had no dedicated frontend workflow in GitHub Actions.
- `frontend/package.json` previously had no shared CI-level `check` script.
- Locally, `npm run build` and the TypeScript check pass.
- The Vercel project is configured with `nodeVersion: 24.x`.
- The local `frontend/.vercel/project.json` contains an old `projectId` that no longer exists in Vercel.
- There are no runtime logs for the frontend project in the last 7 days.

### Conclusions

- PRs were not previously blocked by a proper frontend quality gate.
- The main risk is not the Vercel build itself, but the lack of required CI checks and preview smoke/e2e coverage.
- There is still an environment mismatch risk: local Node is `20`, backend CI uses `22`, and the frontend is built on Vercel with `24`.

## What Must Be Required Before Merge

### 1. GitHub branch protection for `main`

This should be enabled in GitHub:

- `Require a pull request before merging`
- `Require status checks to pass before merging`
- `Require branches to be up to date before merging`

Required checks:

- `frontend-check`
- `backend-check`
- `Vercel`
- `frontend-deployment-smoke`

### 2. Base PR gate

These fast checks must run on every PR:

- `npm ci`
- `npm run typecheck`
- `npm run build`

They are already implemented in the `Frontend CI` workflow.

### 3. Preview gate

Once the Vercel Preview deployment is `READY`, checks should run against the real preview URL.

Minimum coverage:

- open `/`
- verify unauthenticated redirect to `/login`
- open `/login`
- open `/register`
- verify static assets are served: `/manifest.json`, `/sw.js`, `/favicon.svg`
- verify no `404` or `500` on core routes

Recommended execution:

- a dedicated GitHub Actions workflow triggered by a successful Vercel deployment status
- a Playwright smoke suite against the preview URL
- for protected Vercel deployments, a GitHub secret `VERCEL_AUTOMATION_BYPASS_SECRET` is required

### 4. Production gate

Production should only receive changes merged into `main` after all required checks are green.

After merge, run a short post-deploy verification:

- `GET /` returns `200`
- `GET /login` returns `200`
- `GET /register` returns `200`
- core assets load without `404`
- Vercel build logs show no errors

## Full Test Matrix

## A. Build and configuration

What to verify:

- the project builds with `vite build`
- all entrypoints are built: `index.html`, `login.html`, `register.html`
- the output contains `manifest.json`, `sw.js`, and `favicon.svg`
- the build does not depend on local files or uncommitted artifacts
- environment variables are configured correctly

Where to run:

- PR CI
- Vercel Preview
- Production

Status:

- required

## B. Routing and static asset delivery

What to verify:

- `/` opens
- `/login` opens
- `/register` opens
- fallback routing resolves to `index.html`
- `/assets/*` is served correctly
- `/icons/*` is served correctly
- `manifest.json`, `sw.js`, and `favicon.svg` are available

Where to run:

- Preview smoke
- Production smoke

Status:

- required

## C. Auth and Clerk

What to verify:

- without a session, the user hitting `/` is redirected to `/login`
- `/login` and `/register` render correctly when `VITE_CLERK_PUBLISHABLE_KEY` is present
- when the key is missing, the UI shows a clear diagnostic message instead of a blank screen
- with an active session, `/login` and `/register` redirect to `/`
- logout returns the user to the expected destination

Where to run:

- Preview e2e
- manual verification before release for auth-related changes

Status:

- required for auth-related PRs

## D. API integration

What to verify:

- `GET /workout/today`
- `GET /program`
- `GET /log/{date}`
- `POST /log`
- `POST /progression/run`

Scenarios:

- successful response
- `401` and redirect/reauth flow
- `404` for history when no log exists
- `500` with proper error handling and no broken UI
- empty or partially filled payloads

Where to run:

- Preview e2e
- locally when changing `api.js` or `app.js`

Status:

- required

## E. Critical user flows

What to verify:

- loading the main `Today` tab
- switching between `Today`, `History`, and `Program`
- saving a workout
- repeated save clicks do not create duplicates
- today's history updates after saving
- an empty history day shows the correct empty state
- the program loads and renders without errors

Where to run:

- Preview e2e

Status:

- required

## F. Negative scenarios

What to verify:

- backend unavailable
- API returns non-JSON
- expired token
- invalid token in `localStorage`
- missing `__session` cookie
- missing fields in exercise data
- workout with an empty exercise list

Where to run:

- local unit/integration tests after they are added
- Preview e2e for selected scenarios via mock/stub

Status:

- required as test coverage expands

## G. Mobile, accessibility, UX

What to verify:

- 360px viewport does not break the layout
- no horizontal scrolling
- buttons are keyboard accessible
- focus is visible
- headings and buttons remain readable
- loader, empty, and error states do not break layout structure

Where to run:

- Preview smoke on a mobile viewport
- manual QA for visually sensitive PRs

Status:

- required

## H. PWA and caching

What to verify:

- `sw.js` registers without errors
- `manifest.json` is valid and available
- icons are available
- asset updates do not break caching behavior

Where to run:

- Preview smoke
- Production smoke

Status:

- recommended, required when changing `public/`

## What Runs at Each Stage

## PR fast checks

- `frontend-check`
- goal: quickly catch type and build regressions
- expected duration: 2-4 minutes

## Preview smoke

- `frontend-deployment-smoke`
- goal: validate the already deployed preview
- expected duration: 3-8 minutes

## Preview full e2e

- run for large PRs, auth changes, routing changes, and changes to `app.js` or `api.js`
- goal: validate the most important user flows

## Post-merge production smoke

- a short smoke after production deploy
- goal: confirm the production URL is live and not broken by configuration

## Minimum rollout plan

### P0

- add a frontend CI workflow
- enable branch protection with required checks
- align Node version across local development, GitHub Actions, and Vercel
- fix the local `.vercel/project.json` binding

### P1

- add Playwright
- add a preview smoke workflow triggered by successful Vercel Preview deployments
- run smoke checks for `/`, `/login`, `/register`, static assets, and core redirects

### P2

- add e2e scenarios for auth, today workout, history, and program
- add API error mocking and negative scenario coverage

### P3

- add visual regression coverage for key screens
- add Lighthouse/accessibility budgets for preview

## What Has Already Been Done in This PR

- GitHub Actions workflows were added for the frontend:
  - `.github/workflows/frontend-ci.yml`
  - `.github/workflows/frontend-deployment-smoke.yml`
- `typecheck` and `check` scripts were added to `frontend/package.json`

## What Still Needs To Be Done Manually in Vercel and GitHub

### GitHub

- enable branch protection on `main`
- mark `frontend-check`, `backend-check`, and `Vercel` as required checks

### Vercel

- verify production deploys only from `main`
- verify Preview and Production environment variables separately
- if deployments are protected by Vercel Authentication, generate a Protection Bypass for Automation secret
- add that secret to GitHub Secrets as `VERCEL_AUTOMATION_BYPASS_SECRET`

## Critical Notes

- The current frontend CI now catches types and build failures. This is a strong first gate, but it does not replace preview smoke/e2e.
- Until Node versions are aligned, there is still a risk that a PR is green under one Node version but behaves differently in Vercel.
- The old `.vercel/project.json` should be relinked so local Vercel commands do not target a deleted project.
