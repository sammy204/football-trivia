# Football Trivia - Technology Stack and Architecture

## Overview

Football Trivia is a browser-based sports quiz app built with React and Vite. It currently supports:

- solo play
- online 1v1 rooms
- team multiplayer with invites
- daily challenges and leaderboard saving
- Firebase-authenticated user profiles
- daily streak tracking
- service worker and optional push notifications

---

## Frontend

The frontend is a React single-page application.

### Core technologies

- `react` - UI library
- `react-dom` - React DOM renderer
- `vite` - build tool and dev server
- `@vitejs/plugin-react` - React support for Vite
- `@vercel/analytics` - analytics event tracking
- `canvas-confetti` - result celebration effects

### App entry and global layout

- `src/main.jsx` - app bootstrap and production service worker registration
- `src/App.jsx` - top-level navigation, auth state, invite handling, streak notices, and screen switching
- `src/index.css` - global tokens, theme variables, and base layout styles

### Main UI components

- `src/components/Landing.jsx` - entry screen before auth / home
- `src/components/Home.jsx` - sport selection, mode selection, and daily challenge entry point
- `src/components/Quiz.jsx` - solo and daily challenge question flow
- `src/components/Results.jsx` - solo and daily challenge result screen
- `src/components/OnlineMulti.jsx` - online 1v1 rules, lobby, room sync, and results
- `src/components/TeamMulti.jsx` - team rules, lobby, invites, balanced-room start flow, per-player team quiz, and team results
- `src/components/InviteScreen.jsx` - incoming team invite overlay
- `src/components/DailyLeaderboard.jsx` - leaderboard view for the current daily challenge
- `src/components/Profile.jsx` - user stats, streak view, badges, and match history
- `src/components/Auth.jsx` - Firebase email/password and Google auth flow
- `src/components/VerifyEmail.jsx` - email verification prompt
- `src/components/Loading.jsx` - loading screen

---

## Game Data and Logic

### Question system

- `src/lib/question.js`
  - stores built-in football and basketball question banks
  - generates shuffled question lists for solo and online modes
  - generates per-player question sets for team multiplayer
  - generates tiebreaker questions for online 1v1

### Daily challenge

- `src/lib/dailyChallenge.js`
  - calculates the active daily challenge window
  - derives the daily question set
  - tracks whether the player already played
  - saves leaderboard entries

### Profiles and stats

- `src/lib/profile.js` - local profile persistence and player ID handling
- `src/lib/userStats.js` - saved match history and stats
- `src/lib/streaks.js`
  - daily streak tracking
  - daily challenge activity recording
  - generic gameplay activity recording
  - streak reset handling after missed days

### Presentation helpers

- `src/lib/confetti.js` - confetti trigger helpers

---

## Firebase Integration

The app uses Firebase for authentication, realtime room sync, leaderboard storage, and player data.

### Firebase services

- `firebase/auth` - sign-in and user session management
- `firebase/database` - realtime storage for rooms, invites, leaderboard data, user stats, and streak data

### Firebase setup

- `src/lib/firebase.js`
  - initializes the Firebase app
  - exports `auth`
  - exports `db`
  - exports provider config for Google sign-in

---

## Multiplayer Architecture

### Online 1v1

- `src/lib/multiplayer.js`
  - creates rooms under `rooms/{code}`
  - handles room joins
  - syncs current question and answer state
  - advances questions and handles tiebreak flow

### Team multiplayer

- `src/lib/teamMultiplayer.js`
  - creates team rooms under `teamRooms/{code}`
  - stores captains, teams, and members
  - manages invite records under `invites/{playerId}`
  - enforces balanced-room start rules
  - assigns 10-question individual quiz sets per player
  - sums player scores into team totals
  - finalizes matches when all players complete their question sets

### Current team-mode premise

- captains create or claim team slots
- teammates join through Player ID invites
- every player gets 10 questions
- teammates do not share the same question list
- team score is the sum of all member scores

---

## PWA and Push Notifications

The app includes optional push notification support and production service worker registration.

### Frontend notification flow

- `src/lib/pushNotifications.js`
  - registers the service worker
  - requests notification permission
  - saves push subscriptions to Firebase Realtime Database
  - forwards subscriptions to the optional backend

### Service worker

- `public/service-worker.js` - caching and client-side service worker logic

---

## Optional Backend

The backend is only needed for push notifications and test notification routes.

### Backend stack

- `node` - runtime
- `express` - REST server
- `cors` - CORS support
- `dotenv` - environment loading
- `firebase-admin` - admin access to Firebase
- `web-push` - browser push delivery
- `node-cron` - scheduled reminder jobs
- `nodemon` - dev reload for backend work

### Backend files

- `backend/backend-push-server.cjs` - push subscription endpoints, reminder routes, and scheduled jobs
- `backend/package.json` - backend scripts and dependency definitions

---

## Configuration Files

- `package.json` - frontend scripts and dependencies
- `package-lock.json` - frontend lockfile
- `backend/package.json` - backend scripts and dependencies
- `vite.config.js` - Vite config
- `firebase.json` - Firebase project config
- `database.rules.json` - Realtime Database security rules
- `.env.example` - frontend env template
- `.env.local.example` - local frontend test env template
- `backend/.env.backend.example` - backend env template

---

## Deployment Notes

### Frontend

- designed for Vercel or other static hosts
- built with `npm run build`
- verified production build currently succeeds

### Backend

- optional separate deployment for push notifications
- frontend should point to it through `VITE_PUSH_BACKEND_URL`

---

## Summary

This repository currently consists of:

- a React + Vite frontend
- Firebase-backed authentication and realtime room sync
- built-in football and basketball question banks
- online 1v1 and team multiplayer modes
- daily challenge and streak systems
- optional push notification backend support
