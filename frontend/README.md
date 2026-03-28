<div align="center">
  <h1>🏋️ Workout Manager Frontend</h1>
  
  <p>
    <strong>Frontend application for tracking daily workouts and interacting with the Workout Manager API.</strong>
  </p>
  
  <p>
    <a href="https://github.com/Kinaqu/workout-frontend/stargazers">
      <img src="https://img.shields.io/github/stars/Kinaqu/workout-frontend?style=for-the-badge&color=yellow" alt="Stars" />
    </a>
    <a href="https://github.com/Kinaqu/workout-frontend/issues">
      <img src="https://img.shields.io/github/issues/Kinaqu/workout-frontend?style=for-the-badge&color=blue" alt="Issues" />
    </a>
    <a href="https://github.com/Kinaqu/workout-frontend/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
    </a>
  </p>
</div>

<br />

The application allows users to log workouts, view their training history, and track progression in their workout program. This project is a lightweight single-page application that communicates with a backend API deployed on Cloudflare Workers.

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
  - User registration & login with secure token authentication.
- **🏋️ Workout Tracking**
  - View today's workout directly on the dashboard.
  - Log sets, reps, and add personalized workout notes.
- **📅 Workout History**
  - View previous workouts filtered by date.
  - See logged exercises and insights from past training sessions.
- **📈 Training Program**
  - View the complete weekly workout schedule.
  - Check targeted exercises and track your progression levels.
- **📱 Mobile-first UI**
  - Intuitive and simple interface optimized for mobile devices.
  - Convenient bottom navigation for quick access to core features.
- **📶 Offline Support**
  - Basic PWA support with service worker caching for offline availability.

---

## 🛠 Tech Stack

### Frontend & Build Tools
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

### Backend API & Deployment
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-%23F38020.svg?style=for-the-badge&logo=Cloudflare&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🏗 Architecture

The frontend is a lightweight client application configured to interact with a serverless REST API.

**Data Flow:**  
`Frontend UI` ➔ `REST API` ➔ `Workout Logic`

**The backend automatically handles:**
- Workout generation & programmatic training progression
- Workout logging and data persistence
- Token generation and user authentication

> **Security Note:** Authentication is handled securely using a JWT token stored locally in the browser's `localStorage`.

### Live Infrastructure
- **Frontend Deployment:** Vercel
- **Backend API:** Cloudflare Workers

*This setup ensures a highly responsive, lightweight, and easily scalable infrastructure.*

---

## 📂 Project Structure

```text
workout-frontend/
├── api.js                # API client for backend communication
├── app.js                # Main logic and UI rendering
├── index.html            # Main application entry page
├── login.html            # User authentication page
├── register.html         # User registration page
├── public/               
│   ├── styles/           # Application CSS stylesheets
│   ├── manifest.json     # Web app manifest for PWA
│   └── sw.js             # Service worker configuration
├── vite.config.ts        # Vite build configuration
└── vercel.json           # Vercel deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and `npm` installed on your machine.

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kinaqu/workout-frontend.git
   cd workout-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   > Navigate to `http://localhost:3000` in your web browser.


### Clerk setup for React (Vite)

For current Clerk React + Vite integration guidance, use the official quickstart:
https://clerk.com/docs/react/getting-started/quickstart

1. Install the SDK:
   ```bash
   npm install @clerk/react@latest
   ```
2. Add your publishable key to `.env.local` (preferred) or `.env`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```
3. Wrap the auth entrypoints in `ClerkProvider` (`login.jsx` and `register.jsx`) and render Clerk components (`SignIn` / `SignUp`) there.
4. Unauthenticated users are redirected to `/register` from `app.js` and `api.js` to keep the SSO-first flow.

### Build & Deployment

The frontend is natively designed to be deployed on **Vercel** with zero-config via `vercel.json`.

```bash
# Create an optimized production build (Outputs to /dist)
npm run build

# Preview the production build locally
npm run preview
```

---

## 🔌 API Endpoints

The frontend application directly communicates with the Workout Manager API. 

> **Note:** All authenticated endpoints require the `Authorization: Bearer <token>` header.

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Authenticate and obtain JWT |
| `GET` | `/workout/today` | Fetch today's generated workout plan |
| `POST` | `/log` | Log a completed exercise, sets, and reps |
| `GET` | `/log/{date}` | Retrieve workout history by specific date |
| `GET` | `/program` | Get weekly training schedule and exercises |
| `POST` | `/progression/run` | Process and update overall training progression |

---

## 🔮 Future Improvements

- [ ] Migrate component logic to **React** or **Next.js** for better scalability.
- [ ] Improve UI/UX with smoother page transitions and micro-animations.
- [ ] Enhance offline mode capabilities (full PWA integration with IndexedDB cache).
- [ ] Implement push notifications or external reminders for scheduled workouts.

---

## 👨‍💻 Author

**Kinaqu**  
*Full-stack web developer focused on building simple and functional web applications.*

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kinaqu)

<br />

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Kinaqu">Kinaqu</a></sub>
</div>
