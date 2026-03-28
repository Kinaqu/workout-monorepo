<div align="center">
  <h1>⚙️ Workout Manager Backend</h1>
  
  <p>
    <strong>Cloudflare Worker API for workout programs, progression tracking, workout history, and Clerk-based authentication.</strong>
  </p>
  
  <p>
    <a href="https://github.com/Kinaqu/workout-monorepo/stargazers">
      <img src="https://img.shields.io/github/stars/Kinaqu/workout-monorepo?style=for-the-badge&color=yellow" alt="Stars" />
    </a>
    <a href="https://github.com/Kinaqu/workout-monorepo/issues">
      <img src="https://img.shields.io/github/issues/Kinaqu/workout-monorepo?style=for-the-badge&color=blue" alt="Issues" />
    </a>
  </p>
</div>

<br />

The backend powers the Workout Manager application with a serverless API running on Cloudflare Workers. It verifies Clerk JWTs, stores normalized workout data in Cloudflare D1, preserves a temporary migration path from legacy KV storage, and exposes endpoints for workout generation, logging, sessions, programs, and progression updates.

## 📝 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Development Notes](#-development-notes)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

---

## ✨ Features

- **🔐 Authentication**
  - Clerk is the only authentication provider.
  - The Worker verifies Bearer JWTs and uses the Clerk `sub` as the canonical `user_id`.
- **🏋️ Workout Generation**
  - Returns a deterministic workout plan for the current day.
  - Builds today's workout from the active program and stored progression state.
- **📝 Workout Logging**
  - Accepts structured JSON logs and plain-text compatibility logs.
  - Stores append-only workout session history with exercises and sets in D1.
- **📅 Training History**
  - Returns workout history by date.
  - Supports multi-session days and detailed session lookup.
- **📈 Program & Progression**
  - Stores normalized program templates, workouts, exercises, and schedule data.
  - Recomputes progression state from workout history without mutating templates.
- **☁️ Cloudflare-Native Deployment**
  - Runs on Cloudflare Workers.
  - Uses D1 as the primary datastore and KV only for staged legacy migration.

---

## 🛠 Tech Stack

### Backend Runtime & Storage
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-%23F38020.svg?style=for-the-badge&logo=Cloudflare&logoColor=white)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Cloudflare KV](https://img.shields.io/badge/Cloudflare_KV-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

### Tooling & Auth
![Wrangler](https://img.shields.io/badge/Wrangler-%23F38020.svg?style=for-the-badge&logo=Cloudflare&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-%236B4EFF.svg?style=for-the-badge)

---

## 🏗 Architecture

The backend is a layered serverless API designed to keep HTTP routing, business logic, and persistence separate.

**Data Flow:**  
`Frontend UI` ➔ `Cloudflare Worker API` ➔ `Services` ➔ `Repositories` ➔ `D1 / KV`

**The backend automatically handles:**
- Clerk token verification and request authentication
- Program storage and normalization into relational D1 tables
- Workout generation from active program and progression state
- Session logging, structured set storage, and history retrieval
- Legacy KV import on first authenticated access when D1 data is missing

> **Security Note:** The backend does not manage passwords or local sessions. Auth is delegated to Clerk, and protected endpoints require `Authorization: Bearer <clerk-jwt>`.

### Live Infrastructure
- **API Runtime:** Cloudflare Workers
- **Primary Database:** Cloudflare D1
- **Legacy Migration Store:** Cloudflare KV

*This setup keeps the backend lightweight, scalable, and operationally simple while preserving a migration path from older data.*

---

## 📂 Project Structure

```text
backend/
├── migrations/           # D1 schema migrations
├── src/
│   ├── auth/             # Clerk JWT verification
│   ├── db/               # Database helpers
│   ├── domain/           # Program, progression, and session domain logic
│   ├── http/             # Request/response helpers
│   ├── lib/              # Shared utilities
│   ├── repositories/     # D1 and legacy KV persistence layer
│   ├── routes/           # HTTP route handlers
│   ├── services/         # Application services
│   ├── env.ts            # Worker environment contract
│   └── index.ts          # Worker entrypoint
├── package.json
├── tsconfig.json
└── wrangler.toml
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and `npm` installed on your machine.

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kinaqu/workout-monorepo.git
   cd workout-monorepo/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create local development variables**
   Create a `.dev.vars` file in `backend/`:
   ```bash
   RESET_TOKEN=local-reset-token
   CLERK_ISSUER=https://your-clerk-domain.clerk.accounts.dev
   CLERK_AUDIENCE=
   CLERK_JWKS_URL=
   ```
   > `RESET_TOKEN` and `CLERK_ISSUER` are required. `CLERK_AUDIENCE` and `CLERK_JWKS_URL` are optional.

4. **Apply local D1 migrations**
   ```bash
   npx wrangler d1 migrations apply DB --local
   ```

5. **Start the local Worker**
   ```bash
   npm run dev
   ```
   > The local API is typically available at `http://127.0.0.1:8787`.

### Development Workflow

For end-to-end local development with the frontend:

1. Start the backend from `backend/`.
2. Update `frontend/api.js` to point `BASE_URL` to `http://127.0.0.1:8787`.
3. Start the frontend separately from `frontend/` with `npm run dev`.

Useful backend commands:

```bash
# Run the Worker locally
npm run dev

# Type-check the project
npm run typecheck

# Regenerate Wrangler types
npm run cf-typegen

# Deploy the Worker
npm run deploy
```

### Build & Deployment

The backend is designed to be deployed through **Wrangler** using the configuration in `wrangler.toml`.

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

Before deploying:
- Ensure Wrangler is authenticated with Cloudflare.
- Confirm `wrangler.toml` points to the correct D1 and KV resources.
- Apply pending migrations to the target database if required.

---

## 🔌 API Endpoints

The backend exposes a protected REST API for the Workout Manager application.

> **Note:** All protected endpoints require the `Authorization: Bearer <clerk-jwt>` header.

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Legacy auth endpoint, intentionally disabled with `410` |
| `POST` | `/auth/login` | Legacy auth endpoint, intentionally disabled with `410` |
| `GET` | `/workout/today` | Fetch today's generated workout plan |
| `GET` | `/program` | Retrieve the active program and progression metadata |
| `POST` | `/program` | Save a new active program version |
| `POST` | `/program/reset` | Reset to the built-in default program using `X-Reset-Token` |
| `POST` | `/log` | Create a workout session from JSON or plain text |
| `GET` | `/log/{date}` | Retrieve the latest workout log for a specific date |
| `GET` | `/sessions` | List stored workout sessions with optional filters |
| `GET` | `/sessions/{id}` | Retrieve a full session by ID |
| `POST` | `/progression/run` | Recalculate progression state from recent session history |

---

## 🧪 Development Notes

### Environment Variables

The Worker uses the following runtime variables:

- `RESET_TOKEN`
- `CLERK_ISSUER`
- `CLERK_AUDIENCE` optional
- `CLERK_JWKS_URL` optional

### Database Model

Primary storage is D1 with the following key tables:

- `users`
- `programs`
- `program_schedule`
- `workouts`
- `exercises`
- `workout_exercises`
- `exercise_progression_state`
- `workout_sessions`
- `workout_session_exercises`
- `workout_session_sets`
- `progression_events`

### Migration Notes

- D1 is the source of truth for active backend data.
- KV is retained temporarily to import legacy programs, progression state, and logs.
- On first authenticated access, the backend can bootstrap a user from KV when D1 is empty.
- Current migrations live in `backend/migrations/`.

---

## 🔮 Future Improvements

- [ ] Add automated backend tests for routes, services, and repositories.
- [ ] Improve observability with structured logging and request tracing.
- [ ] Remove KV migration support after the migration window closes.
- [ ] Add rate limiting and stricter operational safeguards for admin-style endpoints.

---

## 👨‍💻 Author

**Kinaqu**  
*Full-stack web developer focused on building simple and functional web applications.*

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kinaqu)

<br />

<div align="center">
  <sub>Built for the Workout Manager monorepo by <a href="https://github.com/Kinaqu">Kinaqu</a></sub>
</div>
