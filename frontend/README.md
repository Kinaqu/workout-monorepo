<div align="center">
  <h1>🏋️ Workout Manager Frontend</h1>
  
  <p>
    <strong>Frontend application for tracking daily workouts and interacting with the Workout Manager API.</strong>
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

The application allows users to view today's workout, log completed sets, inspect workout history, and review the active training program. It is a lightweight multi-page frontend built with Vite and connected to the Cloudflare Workers backend in the same monorepo.

## 📝 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

---

## ✨ Features

- **🔐 Authentication**
  - Clerk-powered sign-in and sign-up pages live at `/login` and `/register`.
  - The app uses the Clerk `__session` cookie as the primary auth source, with legacy local token fallback still supported in `api.js`.
- **🧭 Onboarding**
  - On app boot, the frontend checks `GET /me` before rendering the main workout tabs.
  - Users with incomplete onboarding stay inside a lightweight in-app setup flow until the backend confirms completion.
  - Draft answers are restored through `GET /onboarding` and saved progressively through `POST /onboarding`.
- **🏋️ Workout Tracking**
  - View today's generated workout directly on the dashboard.
  - Log completed sets exercise-by-exercise from the main app flow.
- **📅 Workout History**
  - Load saved workouts by date.
  - Review previous exercise sets and logged training output.
- **📈 Training Program**
  - Load the active backend program and progression-driven workout data.
  - Trigger progression recalculation from the UI flow.
- **📱 Mobile-First UI**
  - The main experience is optimized for compact screens.
  - Navigation and workout cards are designed around a phone-first interaction model.
- **📶 Basic Offline Support**
  - Includes a service worker and web manifest.
  - Static app assets can be cached for limited offline availability.

---

## 🛠 Tech Stack

### Frontend & Build Tools
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![React](https://img.shields.io/badge/react-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2306B6D4.svg?style=for-the-badge&logo=tailwindcss&logoColor=white)

### Auth & Deployment
![Clerk](https://img.shields.io/badge/Clerk-%236B4EFF.svg?style=for-the-badge)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-%23F38020.svg?style=for-the-badge&logo=Cloudflare&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🏗 Architecture

The frontend is a lightweight client application configured to interact with a serverless REST API and Clerk-hosted authentication.

**Data Flow:**  
`Frontend UI` ➔ `Clerk Session / API Client` ➔ `GET /me` gate ➔ `Onboarding or Main App` ➔ `Cloudflare Worker API`

**The frontend currently includes:**
- a vanilla JavaScript main app in `app.js`
- React-based auth entrypoints in `login.jsx` and `register.jsx`
- a shared API client in `api.js`
- Vite multi-page builds for the main app and auth pages

> **Security Note:** The primary auth flow is Clerk-first. The frontend sends the Clerk session token as a Bearer token when available. A legacy `localStorage` token path still exists for compatibility, but it is no longer the main authentication model.

### Live Infrastructure
- **Frontend Deployment:** Vercel
- **Backend API:** Cloudflare Workers
- **Authentication:** Clerk

*This setup keeps the frontend simple to deploy while separating authentication and backend state management cleanly.*

---

## 📂 Project Structure

```text
frontend/
├── api.js                # API client for backend communication
├── app.js                # Main application logic and UI rendering
├── clerkAppearance.js    # Shared Clerk UI appearance config
├── index.html            # Main application entry page
├── login.html            # Sign-in page shell
├── login.jsx             # Clerk sign-in entrypoint
├── public/
│   ├── favicon.svg
│   ├── icons/
│   ├── manifest.json     # Web app manifest
│   ├── style.css         # Main frontend styles
│   └── sw.js             # Service worker
├── register.html         # Sign-up page shell
├── register.jsx          # Clerk sign-up entrypoint
├── vite.config.ts        # Vite multi-page build configuration
└── vercel.json           # Vercel deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and `npm` installed on your machine.

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kinaqu/workout-monorepo.git
   cd workout-monorepo/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create local environment variables**
   Create `frontend/.env.local`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```
   Optional:
   ```bash
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   > Navigate to `http://localhost:3000` in your web browser.

### Clerk Setup for React (Vite)

For current Clerk React + Vite integration guidance, use the official quickstart:  
https://clerk.com/docs/react/getting-started/quickstart

The auth flow in this project currently works as follows:

1. `login.jsx` renders Clerk `SignIn`.
2. `register.jsx` renders Clerk `SignUp`.
3. Missing `VITE_CLERK_PUBLISHABLE_KEY` shows a diagnostic notice on the auth pages.
4. Unauthenticated users are redirected to `/login` from `app.js` unless a Clerk session or legacy token is available.
5. Authenticated users hit `GET /me` on app load.
6. If onboarding is incomplete, the app renders the onboarding form, restores any saved draft via `GET /onboarding`, and saves updates through `POST /onboarding`.
7. Final onboarding submission calls `POST /onboarding/complete`, then the app reloads state and shows the generated program/workout flow.

### Local Backend Integration

The frontend currently uses a hardcoded API base URL in `api.js`:

```js
export const BASE_URL = 'https://workout-api.dimer133745.workers.dev';
```

For local end-to-end development, switch it to your local Worker:

```js
export const BASE_URL = 'http://127.0.0.1:8787';
```

The project does not currently use a dedicated frontend env variable for the API base URL.

### Build & Deployment

The frontend is designed to be deployed on **Vercel** from the `frontend/` directory.

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

Useful project commands:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

> `npm run lint` currently runs `tsc --noEmit`.

---

## 🔌 API Endpoints

The frontend application communicates with the Workout Manager backend through `api.js`.

> **Note:** All protected endpoints require `Authorization: Bearer <token>`. In the current app flow, that token usually comes from the Clerk session cookie.

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/me` | Load authenticated product state, onboarding status, and active-program availability |
| `GET` | `/onboarding` | Restore saved onboarding draft and completion state |
| `POST` | `/onboarding` | Save onboarding draft answers |
| `POST` | `/onboarding/complete` | Complete onboarding and trigger backend-owned program generation |
| `GET` | `/workout/today` | Fetch today's generated workout plan |
| `POST` | `/log` | Save a completed workout session |
| `GET` | `/log/{date}` | Retrieve workout history for a specific date |
| `GET` | `/program` | Load the active training program |
| `POST` | `/program/regenerate` | Regenerate the active program from stored onboarding/profile preferences |
| `POST` | `/progression/run` | Trigger progression recalculation |

### Legacy Auth Endpoints

`api.js` still contains compatibility helpers for:

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Legacy helper, backend currently returns `410` |
| `POST` | `/auth/login` | Legacy helper, backend currently returns `410` |

These are no longer the primary frontend authentication path because the application now relies on Clerk.

---

## 🔮 Future Improvements

- [ ] Move the API base URL to a dedicated frontend environment variable.
- [ ] Reduce legacy auth compatibility code once Clerk-only auth is fully enforced.
- [ ] Expand offline support beyond static asset caching.
- [ ] Migrate more of the main application UI from vanilla JavaScript to a consistent component model.

---

## 👨‍💻 Author

**Kinaqu**  
*Full-stack web developer focused on building simple and functional web applications.*

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kinaqu)

<br />

<div align="center">
  <sub>Built for the Workout Manager monorepo by <a href="https://github.com/Kinaqu">Kinaqu</a></sub>
</div>
