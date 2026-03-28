# Workout Frontend

Frontend application for the Workout Manager project. It is a Vite app deployed to Vercel and connected to the Cloudflare Workers API in `../backend`.

## Overview

The frontend mixes a lightweight main app with Clerk-powered auth screens:

- `index.html` + `app.js` render the main workout experience
- `login.html` + `login.jsx` render the Clerk sign-in page
- `register.html` + `register.jsx` render the Clerk sign-up page
- `api.js` handles authenticated requests to the backend API

The current API base URL is defined directly in `api.js`.

## Features

- Clerk authentication with dedicated login and registration entrypoints
- Daily workout view
- Workout logging with optional custom workout date
- Training history lookup by date
- Program overview and progression trigger
- Vite multi-page build for app and auth pages

## Tech Stack

- Vite
- React 19 for auth pages
- Vanilla JavaScript for the main app flow
- Clerk for authentication
- Tailwind CSS v4 tooling
- Vercel for deployment

## Project Structure

```text
frontend/
├── api.js
├── app.js
├── clerkAppearance.js
├── index.html
├── login.html
├── login.jsx
├── public/
├── register.html
├── register.jsx
├── package.json
├── vercel.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
cd frontend
npm install
```

### Environment Variables

Create `frontend/.env.local` for local development:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

Optional:

```bash
GEMINI_API_KEY=your_key
```

Only `VITE_CLERK_PUBLISHABLE_KEY` is read by the auth entrypoints. `GEMINI_API_KEY` is exposed through the Vite config only if you actually use the related dependency.

### Run Locally

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:3000`.

### Local Backend Integration

By default, the frontend calls the deployed Worker from `api.js`:

```js
export const BASE_URL = 'https://workout-api.dimer133745.workers.dev';
```

If you want to develop against the local backend, change `BASE_URL` to your local Wrangler URL, usually:

```js
export const BASE_URL = 'http://127.0.0.1:8787';
```

The repository does not currently use a frontend environment variable for the API base URL.

## Development Workflow

Useful commands:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Notes:

- `npm run lint` currently runs TypeScript checking with `tsc --noEmit`
- the production build emits separate entrypoints for `index.html`, `login.html`, and `register.html`
- auth pages will show a diagnostic message if `VITE_CLERK_PUBLISHABLE_KEY` is missing

## API Integration

Authenticated requests use a Clerk session token from the `__session` cookie when available. A legacy token from `localStorage` is still supported by `api.js`, but the current auth flow is Clerk-first.

Primary API calls used by the UI:

- `GET /workout/today`
- `POST /log`
- `GET /log/:date`
- `GET /program`
- `POST /progression/run`

Legacy auth endpoints still exist in the backend for compatibility, but they intentionally return `410 Gone`:

- `POST /auth/register`
- `POST /auth/login`

## Deployment

The frontend is intended to be deployed from the `frontend/` directory on Vercel.

Recommended Vercel settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Required production variable:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_or_pk_test
```
