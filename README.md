# Football Trivia

Sports trivia app built with React + Vite. The current app supports solo play, online 1v1 rooms, team multiplayer, daily challenges, player profiles, streak tracking, and built-in football and basketball question banks.

## Stack

- **Frontend**: React + Vite
- **Authentication**: Firebase Authentication
- **Realtime data**: Firebase Realtime Database
- **Modes**: Solo, online 1v1, team multiplayer, daily challenge
- **Notifications**: Service worker + optional web push backend
- **Deployment**: Vercel for frontend, optional Node backend for push

---

## Detailed documentation

See [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md) for the full architecture, libraries, data flow, and backend notes.

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd football-trivia
npm install
```

### 2. Configure frontend environment variables

Copy the example file:

```bash
cp .env.example .env
```

Required Firebase variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Optional frontend variables:

- `VITE_VAPID_PUBLIC_KEY`
- `VITE_PUSH_BACKEND_URL`
- `VITE_DEV_TOOLS`

### 3. Run the frontend locally

```bash
npm run dev
```

### 4. Optional push backend

```bash
cd backend
npm install
npm run dev
```

---

## Local Test Mode

Use a separate local test setup so you can try reminders, ranked fees, and future payout logic without touching production.

Frontend:

- copy `.env.local.example` to `.env.local`
- set `VITE_PUSH_BACKEND_URL=http://localhost:3001`
- keep `VITE_DEV_TOOLS=true` only for local testing

Backend:

- copy `backend/.env.backend.example` to `backend/.env.backend`
- set `ENABLE_TEST_ROUTES=true` only in local/dev
- point `FIREBASE_DATABASE_URL` to a separate Firebase development project when possible

With that setup:

- frontend runs on `http://localhost:5173`
- backend runs on `http://localhost:3001`
- `/api/test/*` routes stay disabled unless `ENABLE_TEST_ROUTES=true`

---

## Deploy to Vercel

1. Push your code to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Add the frontend Firebase env vars in the Vercel project settings.
4. Deploy. Vercel will auto-detect Vite.
5. If you use push notifications, deploy the backend separately and set `VITE_PUSH_BACKEND_URL`.

### Pre-deploy verification

The frontend production build was verified successfully with:

```bash
npm run build
```

---

## Features

- **Solo mode**: play alone with 5 / 10 / 15 question runs
- **Online 1v1**: create a room, share a code, and play against a friend
- **Team multiplayer**: captains create teams, invite by Player ID, and start balanced matches
- **Per-player team quizzes**: each team member gets 10 questions and team score is the sum of player scores
- **Daily challenge**: one shared challenge per sport per day with leaderboard saving
- **Profiles and stats**: user profile, match history, streak tracking, and badges
- **Push reminders**: optional reminder flow for daily challenge and streak notifications
- **Two sports**: Football and Basketball
- **Built-in question banks**: no external trivia API required

---

## Project Structure

```text
src/
|-- App.jsx
|-- main.jsx
|-- index.css
|-- components/
|   |-- Home.jsx
|   |-- Quiz.jsx
|   |-- Results.jsx
|   |-- OnlineMulti.jsx
|   |-- TeamMulti.jsx
|   |-- InviteScreen.jsx
|   |-- DailyLeaderboard.jsx
|   |-- Profile.jsx
|   |-- Auth.jsx
|   |-- VerifyEmail.jsx
|   `-- Loading.jsx
|-- lib/
|   |-- question.js
|   |-- multiplayer.js
|   |-- teamMultiplayer.js
|   |-- dailyChallenge.js
|   |-- streaks.js
|   |-- pushNotifications.js
|   |-- profile.js
|   |-- userStats.js
|   `-- firebase.js
backend/
|-- backend-push-server.cjs
`-- package.json
```

---

## Recent Changes

- Added team multiplayer with captain-created rooms and Player ID invites
- Switched team scoring to 10 questions per player with summed team totals
- Added captain-visible teammate score breakdowns
- Added team invite notifications and join flow
- Added daily streak tracking and related notification plumbing
- Refreshed home-page layout and mobile title handling
