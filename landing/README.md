# Landing App

This app is a standalone Next.js surface for the monorepo's marketing landing page and future onboarding flow.

It is intentionally separate from:

- `frontend/`, which remains the existing React app
- `backend/`, which remains the existing Cloudflare Workers API

This foundation step includes:

- App Router + TypeScript setup
- Tailwind CSS styling
- Landing page at `/`
- Placeholder routes at `/sign-in`, `/onboarding`, and `/app`

This step does not yet include:

- Clerk authentication wiring
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

- Add Clerk at the marked placeholder in `app/sign-in/page.tsx`
- Add onboarding form state and persistence in `app/onboarding/page.tsx`
- Add the real post-onboarding handoff in `app/app/page.tsx`
- Keep backend contract changes out of this app unless a later task explicitly requires them
