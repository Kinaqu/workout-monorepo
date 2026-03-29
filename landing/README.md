# Landing App

This app is a standalone Next.js surface for the monorepo's marketing landing page, Clerk auth entrypoint, and future onboarding flow.

It is intentionally separate from:

- `frontend/`, which remains the existing React app
- `backend/`, which remains the existing Cloudflare Workers API

This foundation step includes:

- App Router + TypeScript setup
- Tailwind CSS styling
- landing page redesigned to match the existing frontend's dark card-based visual language
- Clerk integration for `/sign-in` and `/sign-up`
- protected next-step routes at `/onboarding` and `/app` when Clerk env is configured

This step does not yet include:

- backend API integration
- onboarding persistence
- workout generation or business logic

## Local Development

From the monorepo root:

```bash
cd landing
npm install
npm run dev
```

The app runs on [http://localhost:3001](http://localhost:3001) so it does not collide with the existing `frontend/` app on port `3000`.

## Clerk Environment Variables

To make auth work locally and on Vercel, set:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

Notes:

- without these variables, the landing app still renders, but the auth routes show a diagnostic notice instead of the Clerk UI
- `/onboarding` and `/app` are only protected when both Clerk keys are present
- there are currently no Clerk env vars configured in the Vercel `landing` project, so production auth will remain disabled until you add them

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Deployment

This app is intended to be deployed independently on Vercel.

Recommended deployment target:

- Root Directory: `landing`
- Framework Preset: `Next.js`

## Notes for Later Tasks

- Add onboarding form state and persistence in `app/onboarding/page.tsx`
- Add the real post-onboarding handoff in `app/app/page.tsx`
- Keep backend contract changes out of this app unless a later task explicitly requires them
