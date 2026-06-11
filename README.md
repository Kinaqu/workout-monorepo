# Workout Monorepo

This repository contains three independently deployable applications for the Workout Manager project:

- `frontend/`: the client application, deployed with Vercel
- `backend/`: the API, deployed with Cloudflare Workers
- `landing/`: the marketing site, deployed with Vercel

The repository is intentionally maintained as a loose monorepo. The applications live in one Git repository for convenience, but they keep separate dependencies, build steps, and deployment pipelines.

## Overview

- No shared workspace is required at the repository root
- Each application can evolve independently
- Infrastructure choices are isolated per app
- Repository-level files only cover documentation, ownership, and contribution workflow

## Repository Layout

```text
.
|-- .github/
|-- backend/
|-- frontend/
`-- landing/
```

### Frontend

- Path: `frontend/`
- Runtime/build tool: Vite
- Deployment target: Vercel
- Project docs: [`frontend/README.md`](frontend/README.md)

### Backend

- Path: `backend/`
- Runtime/build tool: Cloudflare Workers with Wrangler
- Deployment target: Cloudflare Workers
- Project docs: [`backend/README.md`](backend/README.md)

### Landing

- Path: `landing/`
- Runtime/build tool: Next.js
- Deployment target: Vercel

## Local Development

There is no root-level install step. Work inside the application you want to run.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server runs on port `3000` according to the local Vite configuration.

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs locally through Wrangler.

### Landing

```bash
cd landing
npm install
npm run dev
```

## Build and Deployment

### Frontend

```bash
cd frontend
npm run build
```

Recommended Vercel project setting:

- Root Directory: `frontend`

### Backend

```bash
cd backend
npm run deploy
```

Deploy the backend from the `backend/` directory with the Cloudflare Worker configuration defined in `backend/wrangler.toml`.

## Working in This Monorepo

When contributing:

- keep frontend changes scoped to `frontend/` unless repo-level docs/config must also change
- keep backend changes scoped to `backend/` unless repo-level docs/config must also change
- keep landing changes scoped to `landing/` unless repo-level docs/config must also change
- avoid introducing a root package manager workspace unless there is a clear architectural reason
- update the relevant subproject README when behavior or setup changes

## GitHub Conventions

The repository includes:

- `CODEOWNERS` for default review ownership
- issue templates for bug reports and feature requests
- a pull request template for scoped changes
- community health files for contributing, security, and support guidance

## Notes

This structure is intentional. The goal is to keep the applications close together operationally while avoiding unnecessary coupling in code, tooling, and deployment.

- Brand design tokens (colors, fonts) are deliberately duplicated between `frontend/public/style.css` and `landing/app/globals.css`; update both together.
- The API contract is shared through a generated artifact instead of a workspace: `backend/openapi.json` is committed (refreshed by `npm run openapi:export` in `backend/`), and the frontend generates its API types from it (`npm run generate:api` in `frontend/`). Both `npm run check` scripts fail when either side is stale.
