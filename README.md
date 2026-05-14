# Trivela

A competitive sports trivia app for football and basketball fans.

---

## What is Trivela?

Trivela is a sports quiz app where you can test your football and basketball knowledge solo, against friends, or compete globally on daily challenges.

---

## Features

### Game Modes
- **Solo** — play alone with 5, 10, or 15 question runs
- **Online 1v1** — create a room, share a code, and go head to head with a friend in real time
- **Team Multiplayer** — captains create teams, invite players by Player ID, and compete in balanced matches where every player answers 10 questions and scores are combined
- **Daily Challenge** — one shared challenge per sport per day, open for 32 minutes at 12 PM Nigeria time
- **Tournament** — single-elimination bracket tournaments with real-time 1v1 matches; create, join, or browse public tournaments, compete through rounds, and become the champion

### Leaderboards
- Daily leaderboard per sport showing rankings by score and completion time
- Weekly leaderboard tracking cumulative performance across the week

### Profiles & Stats
- Personal profile with match history, win/loss record, and team game stats
- Daily streak tracking with danger alerts at 10 PM and loss notifications after midnight
- Badges for milestones and achievements (10 Wins, 50 Wins, 3-Day Streak, 7-Day Streak, 50 Points, 100 Points)

### Notifications
- Push reminders for daily challenges and streak warnings
- In-app streak notices when your streak is at risk
- Online 1v1 invite notifications with accept/decline
- Team match invite notifications

### Admin Dashboard
- **Overview** — total users, games played, daily challenges completed, and banned users
- **Question Manager** — add, edit, and delete questions for both the question bank and daily challenges; search and filter by difficulty
- **User Manager** — browse and search all users, view detailed player stats including streaks and join dates
- **Notifications** — view all site-wide notifications and dismiss individually
- **Analytics** — view aggregated app analytics data
- Restricted to authorized admin accounts only

### Tournament Mode
- Create private or public tournaments with configurable name, sport, max players (4/8/16/32), and scheduled start time
- Join tournaments via a 6-character code
- Browse and discover public tournaments
- Lobby view with player list and host controls
- Automatic single-elimination bracket generation with BYE handling
- Live bracket visualization with match status (pending, active, complete)
- Real-time 1v1 match play within tournament rounds
- Automatic advancement of winners and BYE resolution
- Champion display and tournament winner badge

### Sports
- Football
- Basketball

---

## Tech

Built with React, Firebase Authentication, Firebase Realtime Database, and deployed on Vercel.