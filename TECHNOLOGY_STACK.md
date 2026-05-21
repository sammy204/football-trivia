# Trivela - Technology Stack and Architecture

## Overview

Trivela is a browser-based sports trivia application built with React and Vite. It supports football and basketball quizzes across solo play, daily challenges, online multiplayer, team rooms, lightning rounds, seasonal events, tournaments, profiles, coins, streaks, leaderboards, push notifications, and an admin dashboard.

## Frontend

The frontend is a React single-page application.

### Core Technologies

- `react` - UI library
- `react-dom` - DOM renderer
- `vite` - frontend build tool and dev server
- `@vitejs/plugin-react` - React support for Vite
- `firebase` - client authentication and Realtime Database access
- `@vercel/analytics` - production analytics events
- `canvas-confetti` - result celebration effects

### App Shell

- `src/main.jsx` - app bootstrap, production analytics injection, and production service worker registration
- `src/App.jsx` - top-level state, screen routing, auth state, invite listeners, streak notices, coin balance, and mode orchestration
- `src/index.css` - global theme variables, base layout, and shared app styling

### Main Components

- `src/components/Landing.jsx` - pre-auth landing screen
- `src/components/Home.jsx` - sport selection, game mode selection, daily challenge card, seasonal event carousel, notification prompts, and coin balance display
- `src/components/Auth.jsx` - email/password auth and Google auth
- `src/components/AuthCallback.jsx` - email verification and password reset callback handling
- `src/components/VerifyEmail.jsx` - email verification prompt and resend/check controls
- `src/components/InstallPrompt.jsx` - install prompt UI for the PWA experience
- `src/components/Loading.jsx` - loading state screen

### Quiz And Results Components

- `src/components/Quiz.jsx` - solo and daily challenge quiz flow
- `src/components/Results.jsx` - solo and daily results, rewards, save actions, and result review
- `src/components/DailyLeaderboard.jsx` - daily leaderboard by sport

### Multiplayer Components

- `src/components/OnlineMulti.jsx` - online 1v1 lobby, room sync, invite handling, match flow, and results
- `src/components/TeamMulti.jsx` - team room creation, captain flow, invite flow, team quiz, rankings, and coin payouts
- `src/components/InviteScreen.jsx` - incoming team invite overlay

### Lightning Components

- `src/components/LightningModes.jsx` - lightning mode selection and 1v1 invite entry
- `src/components/LightningRound.jsx` - lightning solo gameplay
- `src/components/LightningH2H.jsx` - lightning head-to-head gameplay
- `src/components/LightningRoundH2H.jsx` - supporting lightning H2H round UI
- `src/components/LightningResults.jsx` - lightning solo and H2H result screen
- `src/components/LightningLeaderboard.jsx` - lightning leaderboard by sport

### Seasonal And Tournament Components

- `src/components/SeasonalQuiz.jsx` - seasonal event quiz flow
- `src/components/SeasonalResults.jsx` - seasonal results and event leaderboard saving
- `src/components/Tournament.jsx` - tournament hub, create/join/browse views, lobby, and match entry
- `src/components/TournamentBracket.jsx` - bracket visualization and match status UI

### Profile And Admin Components

- `src/components/Profile.jsx` - player profile, avatar, stats, streaks, badges, match history, and coin data
- `src/components/AvatarGrid.jsx` - avatar selection grid
- `src/components/Admin.jsx` - admin dashboard shell, overview, question manager, user manager, seasonal access, notification access, and analytics access
- `src/components/SeasonalEvents.jsx` - admin seasonal event management
- `src/components/Notifications.jsx` - admin site-wide push notification sender and notification log
- `src/components/Analytics.jsx` - aggregated app analytics dashboard

## Game Logic And Data Modules

### Question System

- `src/lib/question.js`
  - built-in football and basketball question banks
  - shuffled question generation for solo and online play
  - team player question generation
  - tiebreaker question generation for online 1v1

- `src/data/questions/daily/`
  - date-based daily challenge question sets
  - sport-specific daily question indexes

### Daily Challenge

- `src/lib/dailyChallenge.js`
  - daily challenge availability window
  - sport-specific daily question lookup
  - local and Firebase played-state checks
  - daily leaderboard entry saving
  - date key helpers

### Seasonal Events

- `src/lib/seasonalEvents.js`
  - seasonal event create/read/update/delete helpers
  - active and scheduled event listeners
  - event question loading
  - seasonal played-state tracking
  - seasonal leaderboard saving and listening

### Profiles, Stats, And Streaks

- `src/lib/profile.js` - local profile persistence, Player ID generation/cache, and profile loading/saving
- `src/lib/userStats.js` - saved solo, online, and team match history
- `src/lib/streaks.js` - play activity, daily streak state, streak danger detection, and streak reset behavior
- `src/lib/avatars.js` - avatar metadata and profile avatar selection helpers

### Coin Economy

- `src/lib/coins.js`
  - wallet creation and balance listening
  - coin awards and spends
  - duplicate ledger protection
  - solo/daily reward calculation
  - lightning reward calculation
  - seasonal reward calculation
  - online, lightning, team, and tournament stake constants

### Presentation Helpers

- `src/lib/confetti.js` - confetti trigger helpers

## Firebase Integration

The frontend uses Firebase for authentication and realtime application data.

### Firebase Services

- `firebase/auth` - email/password sign-in, Google sign-in, session state, email verification, and password reset flows
- `firebase/database` - realtime rooms, invites, user profiles, wallets, streaks, leaderboards, seasonal events, tournaments, and admin data

### Firebase Setup

- `src/lib/firebase.js`
  - initializes the Firebase app
  - exports `auth`
  - exports Realtime Database instance `db`
  - exports Google auth provider configuration

## Multiplayer Architecture

### Online 1v1

- `src/lib/multiplayer.js`
  - creates rooms under `rooms/{code}`
  - joins rooms by code
  - listens to room state
  - sends and listens to online invites
  - clears accepted/declined invites
  - coordinates current question, answers, scoring, and tiebreaks

### Team Multiplayer

- `src/lib/teamMultiplayer.js`
  - creates team rooms under `teamRooms/{code}`
  - stores team captains, members, team names, and scores
  - sends team invites under `invites/{playerId}`
  - listens to incoming team invites
  - enforces balanced-room start rules
  - assigns individual question sets per player
  - aggregates team scores and rankings

### Lightning Multiplayer

- `src/lib/lightningMultiplayer.js`
  - creates lightning H2H rooms
  - joins lightning rooms from invites
  - sends and listens to lightning invites
  - clears lightning invite records
  - starts synchronized lightning H2H games

- `src/lib/lightningQuestions.js`
  - lightning-specific question generation

- `src/lib/lightningDaily.js`
  - lightning score saving and leaderboard support

- `src/lib/lightningLeaderboard.js`
  - lightning leaderboard listening and ranking helpers

### Tournament System

- `src/lib/tournament.js`
  - creates public and private tournaments
  - joins tournaments by code
  - lists public tournaments
  - starts tournaments
  - subscribes to tournament state
  - generates and advances single-elimination brackets
  - handles BYE resolution and match status

## PWA And Push Notifications

### Frontend Notification Flow

- `src/lib/pushNotifications.js`
  - registers the production service worker
  - requests browser notification permission
  - reads existing push subscriptions without unnecessarily replacing them
  - creates push subscriptions when needed
  - syncs subscriptions to the backend
  - refreshes stale subscriptions through an explicit repair flow
  - applies timeouts so service worker readiness or backend saves cannot hang indefinitely

- `src/lib/inviteNotifications.js`
  - calls backend invite notification routes for online, lightning, and team invites

### Service Worker

- `public/service-worker.js`
  - caches selected static assets
  - uses network-first behavior for app shell assets in production
  - bypasses localhost requests during development
  - handles incoming push events
  - displays browser notifications
  - focuses or opens the app when a notification is clicked

### PWA Metadata

- `public/manifest.json` - installable app metadata
- `public/logo-mark.svg` - app icon asset
- `public/_redirects` - static host routing support

## Backend

The backend supports browser push delivery, coin mutations, scheduled reminders, welcome email sending, and backend-only Firebase Admin work.

### Backend Stack

- `node` - runtime
- `express` - REST server
- `cors` - CORS middleware
- `dotenv` - environment loading
- `firebase-admin` - privileged Firebase Auth, Firestore, and Realtime Database access
- `web-push` - browser push notification delivery
- `node-cron` - scheduled notification jobs
- `resend` - welcome email delivery
- `crypto` - stable push subscription document IDs
- `nodemon` - backend development reload

### Backend Files

- `backend/backend-push-server.cjs`
  - Express app
  - Firebase Admin initialization
  - Firestore push subscription storage
  - VAPID configuration
  - push subscription registration endpoint
  - manual site-wide notification endpoint
  - invite notification endpoint
  - scheduled daily challenge notifications
  - scheduled streak reminder and streak lost notifications
  - expired subscription cleanup
  - authenticated coin wallet endpoints
  - welcome email endpoint

- `backend/package.json` - backend package metadata and scripts
- `backend/package-lock.json` - backend dependency lockfile

### Backend Data Stores

- Firestore `push_subscriptions` collection stores browser push subscriptions keyed by a SHA-256 hash of the endpoint.
- Realtime Database stores users, wallets, coin ledgers, streaks, gameplay activity, rooms, invites, leaderboards, tournaments, and seasonal events.

## Admin Architecture

The admin dashboard is restricted to the configured admin UID.

### Admin Sections

- Overview - user counts, daily activity, games played, banned users, and Player ID migration utility
- Questions - question creation, editing, deletion, sport filtering, difficulty filtering, and daily question support
- Users - searchable player records and detailed user stats
- Seasonal - active, scheduled, ended event management
- Notifications - site-wide push sending and sent-notification log
- Analytics - aggregate app activity, seasonal data, notification logs, and gameplay summaries

## Configuration Files

- `package.json` - frontend dependencies and scripts
- `package-lock.json` - frontend dependency lockfile
- `backend/package.json` - backend dependencies and scripts
- `backend/package-lock.json` - backend dependency lockfile
- `vite.config.js` - Vite configuration
- `firebase.json` - Firebase project configuration
- `database.rules.json` - Realtime Database rules
- `vercel.json` - frontend hosting behavior
- `public/manifest.json` - PWA manifest

## Summary

The repository contains:

- a React and Vite frontend
- Firebase Authentication and Realtime Database integration
- Firebase Admin powered backend services
- Firestore-backed push subscription storage
- browser push notifications with service worker support
- football and basketball trivia modes
- solo, daily, online, team, lightning, seasonal, and tournament gameplay
- coin wallet and ledger systems
- leaderboards, profiles, streaks, badges, and admin tooling
