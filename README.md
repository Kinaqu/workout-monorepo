# Workout Monorepo

This repository contains two independently deployable applications for the Workout Manager project:

- `frontend/`: the client application, deployed with Vercel
- `backend/`: the API, deployed with Cloudflare Workers

The repository is intentionally maintained as a loose monorepo. Both applications live in one Git repository for convenience, but they keep separate dependencies, build steps, and deployment pipelines.

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
`-- frontend/
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
