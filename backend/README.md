<div align="center">
  <h1>⚙️ Workout Manager API</h1>
  
  <p>
    <strong>A lightweight, serverless backend service for generating and managing adaptive workout programs.</strong>
  </p>
  
  <p>
    <a href="https://github.com/Kinaqu/workout-manager/stargazers">
      <img src="https://img.shields.io/github/stars/Kinaqu/workout-manager?style=for-the-badge&color=yellow" alt="Stars" />
    </a>
    <a href="https://github.com/Kinaqu/workout-manager/issues">
      <img src="https://img.shields.io/github/issues/Kinaqu/workout-manager?style=for-the-badge&color=blue" alt="Issues" />
    </a>
    <a href="https://github.com/Kinaqu/workout-manager/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
    </a>
  </p>
</div>

<br />

The API provides endpoints for daily workout generation, workout logging, training program management, and automatic progression of exercises based on user performance. Authentication is handled by Clerk on the frontend, while this backend verifies Clerk Bearer JWTs. Designed to be used with the Workout Manager frontend application, this service is built for serverless deployment and runs on Cloudflare Workers using KV storage.

## 📝 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Design Goals](#-design-goals)
- [Future Improvements](#-future-improvements)

---

## ✨ Features

- **🔐 Clerk Authentication**
  - Verifies Clerk-issued Bearer JWTs on every protected API call.
  - Uses Clerk user ID (`sub`) as stable `userId` in KV keys.
- **🏋️ Workout Generation**
  - Generates daily workouts based on a weekly schedule.
  - Returns target exercises, sets, and automatically handles rest days.
- **📝 Workout Logging**
  - Store individual workout logs per user with sets and performance data.
  - Support for custom workout notes.
- **📅 Workout History**
  - Retrieve detailed workout logs by specific dates to track past training sessions.
- **📊 Training Program Management**
  - Retrieve, update, or seamlessly reset the current training program to default.
- **📈 Exercise Progression**
  - System analyzes recent workout logs to intelligently adjust sets, repetitions, or difficulty based on performance.
  - Automatically updates the program's progression state.
- **🤖 Flexible Log Parsing**
  - Supports both structured JSON logs and plain text workout logs with automatic exercise detection.

---

## 🛠 Tech Stack

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-%23F38020.svg?style=for-the-badge&logo=Cloudflare&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge)

**Core Infrastructure:** Stateless Serverless Architecture

---

## 🏗 Architecture

The API is designed as a stateless serverless service optimized for speed and low operational costs.

**Data Flow:**  
`Client` ➔ `API` ➔ `KV Storage` ➔ `Business Logic`

### Components:
- **Cloudflare Worker:** Handles HTTP requests and routing.
- **KV Storage:** Stores user data, programs, state progression, and workout logs using structured keys (`program:{userId}`, `state:{userId}`, `log:{userId}:{date}`).
- **Authentication Layer:** Verifies Clerk JWTs against Clerk JWKS for all protected routes.
- **Core Modules:** Authentication, Program Management, Workout Generation, Exercise Progression, and Log Parsing.

---

## 📂 Project Structure

```text
workout-manager/
├── src/
│   ├── index.ts              # Main entry point and HTTP router
│   ├── auth.ts               # Clerk JWT verification and auth middleware
│   ├── routes/               # API route handlers
│   │   ├── auth.ts           # Legacy auth endpoints (disabled)
│   │   ├── workout.ts        # Daily workout generation
│   │   ├── log.ts            # Log storage and retrieval
│   │   ├── program.ts        # Training program management
│   │   └── progression.ts    # Exercise progression logic
│   └── lib/                  # Core business logic and utilities
│       ├── defaults.ts       # Default workout configurations
│       ├── schedule.ts       # Workout scheduling logic
│       ├── parser.ts         # Workout log text parser
│       ├── progression.ts    # Exercise progression algorithm
│       └── types.ts          # Shared TypeScript interfaces
├── wrangler.toml             # Cloudflare Worker configuration
└── package.json
```

---

## 🔌 API Endpoints

> **Note:** All protected endpoints require a Clerk session JWT via the `Authorization: Bearer <token>` header.

### 🔐 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Disabled (`410`). Use Clerk sign-up on frontend |
| `POST` | `/auth/login` | Disabled (`410`). Use Clerk sign-in on frontend |

### 🏋️ Workout & Logging
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/workout/today` | Returns today's workout (or rest day) based on the schedule |
| `POST` | `/log` | Store workout results (Supports JSON or plain text body) |
| `GET` | `/log/{date}` | Returns the workout log for a specific date (e.g., `2026-03-15`) |

### 📊 Program & Progression
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/program` | Returns the current workout program and user progression state |
| `POST` | `/program` | Update the active training program |
| `POST` | `/program/reset` | Reset program to default configuration (Requires reset token header) |
| `POST` | `/progression/run` | Triggers the progression algorithm to analyze logs and adjust difficulty |

---

## 🚀 Getting Started

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the development server**
   ```bash
   npm run dev
   ```
   > The server will run locally using [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/).

3. **Configure Clerk env vars in Worker**
   - `CLERK_ISSUER` (required), example: `https://your-app.clerk.accounts.dev`
   - `CLERK_AUDIENCE` (optional, if you validate `aud`)
   - `CLERK_JWKS_URL` (optional override, otherwise derived from issuer)

   In the frontend, keep using `VITE_CLERK_PUBLISHABLE_KEY` as usual for Vite apps.


For the frontend Clerk + React (Vite) setup, use the official quickstart: https://clerk.com/docs/react/getting-started/quickstart

### Deployment

This project is tailored for deployment on Cloudflare Workers utilizing KV namespaces. Configuration is defined in `wrangler.toml`.

```bash
npm run deploy
```

---

## 🎯 Design Goals

Optimized for personal fitness tracking applications, this API was designed with the following principles:
- **Simple architecture**
- **Serverless deployment**
- **Low operational cost**
- **Fast response times**
- **Smart, adaptive workout progression**

---

## 🔮 Future Improvements

- [ ] Transition to relational database storage instead of KV for better querying capabilities.
- [ ] Implement multi-program support for users to switch routines easily.
- [ ] Add advanced exercise analytics and historical charting data.
- [ ] Refine progression models for more nuanced difficulty adjustments.
- [ ] Implement scheduled offline jobs for automatic progression checking.

---

## 👨‍💻 Author

**Kinaqu**  
*Full-stack developer focused on building lightweight web services and APIs.*

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kinaqu)

<br />

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Kinaqu">Kinaqu</a></sub>
</div>
