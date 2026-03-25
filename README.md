# Football Trivia

AI-powered football trivia app built with React + Vite and the Claude API. Supports solo and multiplayer modes, timed rounds, difficulty levels, categories, and a local leaderboard (stored in your browser).

## Stack

- **Frontend**: React + Vite
- **AI**: Claude API (claude-sonnet) — generates questions dynamically
- **Storage**: Browser localStorage — stores leaderboard scores locally
- **Deployment**: Vercel

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd football-trivia
npm install
```

### 2. Configure environment variables (optional)

This project uses the Anthropic API to generate trivia questions. If you want the AI-generated questions to work, add your key to `.env` (see below). If you don't provide a key, the app will still run, but it won't be able to fetch new questions.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### 4. Run locally

```bash
npm run dev
```

---

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard (if you want AI-generated questions):
   - `VITE_ANTHROPIC_API_KEY`
4. Deploy — Vercel auto-detects Vite

> The Claude API key must be kept secret. For production deployments, configure your environment variables in Vercel (or your hosting provider) rather than checking them into source control.

---

## Features

- **Solo mode** — play alone, score saved to leaderboard
- **Multiplayer** — 2–4 players take turns on the same device
- **6 categories** — History, Players, Clubs, Transfers, Trophies, Rules
- **3 difficulty levels** — Easy, Medium, Hard
- **5 / 10 / 15 rounds**
- **20-second timer** per question with visual countdown
- **AI-generated questions** — every game is unique
- **Local leaderboard** — stored in your browser

---

## Project Structure

```
src/
├── App.jsx                  # Root — manages screen/game state
├── main.jsx                 # React entry point
├── index.css                # Global styles + CSS variables
├── lib/
│   ├── ai.js                # Claude API question generator
│   └── leaderboard.js       # Leaderboard storage (localStorage)
└── components/
    ├── Home.jsx              # Setup screen (solo / multi / leaderboard)
    ├── Quiz.jsx              # Question screen with timer
    ├── Results.jsx           # End-of-game scoreboard
    ├── Leaderboard.jsx       # Global leaderboard
    └── Loading.jsx           # Loading spinner
```
