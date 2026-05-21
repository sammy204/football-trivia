# Trivela

Trivela is a competitive sports trivia app for football and basketball fans.

## What Is Trivela?

Trivela lets players test their sports knowledge in solo quizzes, daily challenges, real-time multiplayer, team matches, lightning rounds, seasonal events, and tournaments. Players can build streaks, earn coins, climb leaderboards, invite friends, and compete across football and basketball.

## Features

### Sports

- Football trivia
- Basketball trivia
- Sport-specific daily challenges, leaderboards, multiplayer rooms, lightning rounds, seasonal events, and tournaments

### Accounts And Profiles

- Email/password sign up and login
- Google sign-in
- Email verification flow
- Password reset callback handling
- Player profiles with display name, avatar, Player ID, match history, stats, streaks, badges, and coin balance
- Player IDs used for direct invites in multiplayer modes

### Game Modes

- **Solo Quiz** - play 5, 10, or 15 question runs at your own pace
- **Daily Challenge** - one shared challenge per sport each day, open at 12 PM Nigeria time
- **Online 1v1** - create or join real-time head-to-head rooms
- **Team Multiplayer** - create team rooms, invite players by Player ID, and combine teammate scores
- **Lightning Solo** - a 60-second speed trivia mode with leaderboard scoring
- **Lightning 1v1** - invite another player to a timed duel using their Player ID
- **Seasonal Events** - limited-time event quizzes with custom dates, entry fees, and coin multipliers
- **Tournament Mode** - public or private single-elimination tournaments with live brackets and tournament matches

### Daily Challenge

- Separate daily challenge support for football and basketball
- Daily availability window and countdown
- One saved leaderboard entry per player per day
- Ranking by score and completion time
- Daily challenge rewards through the coin system

### Multiplayer

- Real-time online 1v1 rooms
- Room codes for joining matches
- Friend invites with accept/decline flows
- Rematch invite handling
- Team room creation with configurable team setup
- Team captain flow
- Team invites by Player ID
- Balanced team start rules
- Per-player team quizzes where teammates answer different questions
- Team results, rankings, and coin payouts

### Lightning

- 60-second solo lightning mode
- Lightning 1v1 duels
- Player ID invites for lightning duels
- Coin stake for lightning head-to-head matches
- Winner-takes-pot payout handling
- Lightning leaderboard by sport

### Seasonal Events

- Active and scheduled event cards on the home screen
- Event-specific quiz questions
- Configurable event name, description, sport, type, start date, end date, questions per play, entry fee, and coin multiplier
- Seasonal leaderboard saving
- Seasonal replay support
- Coin rewards based on event multiplier

### Tournaments

- Create public or private tournaments
- Join tournaments with a 6-character code
- Browse public tournaments
- Configurable tournament name, sport, max players, and start time
- Lobby with player list and host controls
- Single-elimination bracket generation
- BYE handling
- Live bracket visualization
- Tournament match play
- Automatic winner advancement
- Champion display

### Coins And Rewards

- Starting coin wallet for signed-in players
- Coin balance shown in the app
- Coins earned from quiz performance
- Daily challenge reward multiplier
- Perfect-score and completion bonuses
- Lightning solo rewards
- Lightning 1v1 stakes and payouts
- Team match stakes and payouts
- Seasonal event entry fees and reward multipliers
- Coin ledger protection against duplicate rewards

### Leaderboards

- Daily leaderboard per sport
- Lightning leaderboard per sport
- Seasonal event leaderboards
- Saved rankings with score and completion time
- Profile-linked leaderboard entries

### Streaks And Badges

- Daily play activity tracking
- Current daily streak tracking
- Streak danger alerts after 10 PM
- Streak loss detection after missed days
- In-app streak notices
- Achievement badges for wins, streaks, and score milestones

### Notifications

- Browser push notification support
- Daily challenge reminders
- Daily challenge closed notifications
- Streak reminder notifications
- Streak lost notifications
- Online 1v1 invite notifications
- Lightning duel invite notifications
- Team invite notifications
- Device subscription repair flow for stale or broken push subscriptions
- Automatic cleanup of expired push subscriptions

### PWA Support

- Service worker registration in production
- Install prompt support
- Cached app assets for a smoother app-like experience
- Localhost-safe service worker behavior during development

### Admin Dashboard

- Restricted admin-only access
- Overview stats for users, games, daily activity, and banned users
- Player ID migration utility
- Question manager for football and basketball
- Add, edit, delete, search, and filter questions
- Daily question management
- User manager with searchable users and player stats
- Seasonal event manager with active, scheduled, and ended event views
- Create, end, reactivate, and delete seasonal events
- Site-wide push notification sender
- Sent notification log with dismiss controls
- Analytics dashboard for app activity, game data, seasonal activity, and notification logs

## Tech

Trivela is built with React, Vite, Firebase Authentication, Firebase Realtime Database, Firebase Admin, Express, Web Push, and a production service worker.
