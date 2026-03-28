# Contributing

## Scope

This repository is a loose monorepo with two independent applications:

- `frontend/`
- `backend/`

Keep changes scoped to the smallest relevant area. Avoid mixing unrelated frontend, backend, and repository-level changes in one pull request.

## Development

Run commands from the application directory you are changing.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Pull Requests

Before opening a pull request:

- make sure the affected area works locally
- update documentation when setup or behavior changes
- keep repository-level files aligned with the actual monorepo structure
- avoid introducing root-level workspace tooling unless the change explicitly requires it

Use the pull request template and explain the scope clearly.
