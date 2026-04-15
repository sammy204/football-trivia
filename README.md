# Football Trivia

Sports trivia app built with React + Vite. Supports solo, local multiplayer, and online multiplayer modes with timed rounds and built-in football and basketball question banks.

## Stack

- **Frontend**: React + Vite
- **Realtime Multiplayer**: Firebase Realtime Database
- **Questions**: Built-in football and basketball question banks
- **Deployment**: Vercel

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd football-trivia
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

This app does not require an API key for question generation. The current `.env.example` is only a placeholder and can stay empty unless you add new environment-based features later.

### 3. Run locally

```bash
npm run dev
```

---

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Deploy — Vercel auto-detects Vite

---

## Features

- **Solo mode** — play alone, score saved to leaderboard
- **Multiplayer** — 2–4 players take turns on the same device
- **2 sports** — Football and Basketball
- **5 / 10 / 15 rounds**
- **20-second timer** per question with visual countdown
- **Online multiplayer rooms** — create and join with a code
- **Shuffled question bank** — each game draws a different mix of questions

---

## Project Structure

```
src/
├── App.jsx                  # Root — manages screen/game state
├── main.jsx                 # React entry point
├── index.css                # Global styles + CSS variables
├── lib/
│   ├── question.js          # Built-in question bank + shuffle logic
│   ├── firebase.js          # Firebase app/database setup
│   └── multiplayer.js       # Online room creation and syncing
└── components/
    ├── Home.jsx              # Setup screen (solo / local / online)
    ├── Quiz.jsx              # Question screen with timer
    ├── Results.jsx           # End-of-game scoreboard
    ├── OnlineMulti.jsx       # Online multiplayer flow
    └── Loading.jsx           # Loading spinner
```
