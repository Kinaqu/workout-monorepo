# Workout Monorepo

This repository contains two independent applications:

- `frontend/` — the client application, deployed with Vercel
- `backend/` — the API, deployed with Cloudflare Workers

## Architecture

This repository is intentionally structured as a **loose monorepo**.

The frontend and backend are kept independent:

- separate dependencies
- separate build processes
- separate deployments
- separate technology decisions
- separate long-term evolution

This means either side can be replaced or rewritten without forcing changes in the other one.

Examples:

- the backend can later be rewritten from Cloudflare Workers to FastAPI
- the frontend can later be rewritten from the current stack to another framework
- one app can continue evolving even if the other is temporarily paused or replaced

## Repository structure

```text
.
├── backend
└── frontend
Deployment
Frontend

The frontend is deployed with Vercel.

Recommended Vercel project settings:

Root Directory: frontend
Backend

The backend is deployed with Cloudflare Workers.

Deploy from:

backend
Development

Each application is developed independently.

Frontend
cd frontend
npm install
npm run dev
Backend
cd backend
npm install
npm run dev
Notes

This repository does not use a shared workspace, shared build pipeline, or forced cross-project coupling.

That is intentional.

The goal is to keep both applications in one repository for convenience, while preserving independence between them.
