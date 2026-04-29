# Football Trivia — Technology Stack and Architecture

## Overview
Football Trivia is a browser-based sports quiz app built with React and Vite. It supports:
- Solo play
- Local multiplayer on the same device
- Online multiplayer using Firebase Realtime Database
- Daily challenge questions
- Profile and score persistence
- Progressive Web App features and push notifications

## Frontend
The frontend is a React single-page application.

### Core technologies
- `react` — UI library
- `react-dom` — DOM renderer for React
- `vite` — modern frontend build tool and dev server
- `@vitejs/plugin-react` — Vite plugin for React support
- `@vercel/analytics` — analytics event tracking
- `dotenv` — environment variable support in development

### Entry point
- `src/main.jsx` — initializes the app, injects analytics, and registers the service worker in production
- `src/App.jsx` — root component that manages navigation, game state, auth state, and screen rendering
- `src/index.css` — global styling and theme variables

### Main screens / components
- `src/components/Landing.jsx` — app entry screen
- `src/components/Home.jsx` — game selection and mode picker
- `src/components/Quiz.jsx` — question screen with timer and answer selection
- `src/components/Results.jsx` — final score and review screen
- `src/components/OnlineMulti.jsx` — online multiplayer room flow
- `src/components/DailyLeaderboard.jsx` — daily leaderboard view
- `src/components/Profile.jsx` — profile and save state
- `src/components/Auth.jsx` — Firebase sign-in flow and account prompts
- `src/components/VerifyEmail.jsx` — email verification prompt
- `src/components/Loading.jsx` — loading indicator screen

## Built-in game data and logic
All question data and game logic are stored in the app source.

### Question data
- `src/lib/question.js` — contains built-in football and basketball question banks, shuffle logic, and question generation

### Profile and stats
- `src/lib/profile.js` — saves and loads local profile data
- `src/lib/userStats.js` — user statistics utilities

### Daily challenge
- `src/lib/dailyChallenge.js` — daily challenge availability, persistence, and leaderboard saving

## Firebase and online multiplayer
The app uses Firebase for several real-time and authentication features.

### Firebase services
- `firebase/auth` — user authentication with email/password and Google sign-in
- `firebase/database` — realtime data storage for multiplayer rooms and leaderboard entries

### Firebase setup
- `src/lib/firebase.js` — initializes Firebase app and exports:
  - `auth` for authentication
  - `db` for realtime database
  - `googleProvider` for Google sign-in

### Online multiplayer implementation
- `src/lib/multiplayer.js` — online room creation, room join, room state syncing, answer submission, score updates, next question flow, and room listener/unsubscribe logic.
- The multiplayer flow stores room data under `rooms/{roomCode}` in Firebase Realtime Database.
- No custom backend is required for multiplayer; Firebase handles synchronization.

## PWA and push notifications
The app includes Progressive Web App support and optional push notification wiring.

### Service worker
- `public/service-worker.js` — service worker script for caching and offline support
- `src/lib/pushNotifications.js` — registers the service worker and manages push subscription requests

### Push backend server
A separate server implementation is available under `backend/` for managing push notification subscriptions and sending notifications.

## Backend server
The push server is not required for the core gameplay, but it is present for PWA push notifications.

### Backend stack
- `node` — runtime for the backend server
- `express` — simple REST server
- `cors` — cross-origin support
- `dotenv` — environment variable parsing for the server
- `firebase-admin` — server-side Firebase admin SDK for push notification subscription storage or message sending
- `web-push` — VAPID-based push notification delivery
- `node-cron` — scheduled jobs if notifications are sent on a schedule
- `nodemon` — development hot reload for backend changes

### Backend package file
- `backend/package.json` — lists backend dependencies and startup scripts

## Project configuration
- `package.json` — frontend dependencies and Vite scripts
- `backend/package.json` — backend push notification server dependencies and scripts
- `vite.config.js` — Vite configuration with React plugin enabled
- `firebase.json` — Firebase hosting and database rules configuration
- `database.rules.json` — Realtime Database security rules

## Deployment
The project is designed for modern static hosting and can deploy on platforms like Vercel. The frontend is built using Vite and can be served as a static site with optional Firebase hosting.

### Local development commands
- `npm install` — install frontend dependencies
- `npm run dev` — start Vite dev server
- `npm run build` — build static production assets

### Backend server commands
From `backend/`:
- `npm install` — install backend dependencies
- `npm start` — run push notification server
- `npm run dev` — run push server with `nodemon`

## What this app does not have
- No external trivia API is used; questions are stored locally in source code
- Online multiplayer does not use a custom backend API; it uses Firebase Realtime Database directly
- No separate Node API is required for game state sync, only for optional push notification service

## Summary
This repository consists of:
- React + Vite frontend app in `src/`
- Built-in question bank and quiz flow
- Firebase auth + realtime multiplayer
- PWA features and service worker registration
- Optional push notification backend server in `backend/`
- Deployment-ready Vercel-friendly configuration
