import { ref, push, update, get, runTransaction } from 'firebase/database'
import { db } from './firebase'
import { calculateWinStreak } from './streaks'

export async function saveMatchResult({ userId, username, opponent, opponentName, myScore, opponentScore, sport, rounds, coinsEarned = 0 }) {
  const result = myScore > opponentScore ? 'win' : myScore < opponentScore ? 'loss' : 'draw'

  const matchData = {
    opponent,
    opponentName,
    myScore,
    opponentScore,
    result,
    sport,
    rounds,
    coinsEarned,          // ← add this
    date: new Date().toISOString(),
    timestamp: Date.now(),
    isTeamGame: false,
  }

  const matchRef = ref(db, `users/${userId}/matches`)
  await push(matchRef, matchData)

  const statsRef = ref(db, `users/${userId}/stats`)
  await runTransaction(statsRef, (current) => {
    const stats = current || { totalGames: 0, wins: 0, losses: 0, draws: 0, totalPoints: 0 }
    return {
      totalGames: stats.totalGames + 1,
      wins: stats.wins + (result === 'win' ? 1 : 0),
      losses: stats.losses + (result === 'loss' ? 1 : 0),
      draws: stats.draws + (result === 'draw' ? 1 : 0),
      totalPoints: (stats.totalPoints || 0) + (myScore || 0),
    }
  })
  const allMatchesSnap = await get(ref(db, `users/${userId}/matches`))
const allMatches = allMatchesSnap.val() ? Object.values(allMatchesSnap.val()) : []
const winStreak = calculateWinStreak(allMatches)
await update(ref(db, `users/${userId}/stats`), { winStreak })

  await update(ref(db, `users/${userId}/profile`), {
    username,
    updatedAt: new Date().toISOString(),
  })

  return result
}

// Save team game result — called when a team match finishes
export async function saveTeamMatchResult({ userId, username, sport, teamName, teamScore, teamRank, teamsCount, memberScore, questionsCount }) {
  // Determines win/loss from team rank
  const result = teamRank === 1 ? 'win' : 'loss'

  const matchData = {
    opponent: `Team${teamsCount > 2 ? 's' : ''}`,
    opponentName: teamName,
    myScore: memberScore,
    opponentScore: null,
    result,
    sport,
    rounds: questionsCount,
    coinsEarned,
    date: new Date().toISOString(),
    timestamp: Date.now(),
    isTeamGame: true,
    teamRank,
    teamsCount,
    teamScore,
  }

  const matchRef = ref(db, `users/${userId}/matches`)
  await push(matchRef, matchData)

  const statsRef = ref(db, `users/${userId}/stats`)
  await runTransaction(statsRef, (current) => {
    const stats = current || { totalGames: 0, wins: 0, losses: 0, draws: 0, totalPoints: 0, teamGames: 0, teamWins: 0 }
    return {
      totalGames: stats.totalGames + 1,
      wins: stats.wins + (result === 'win' ? 1 : 0),
      losses: stats.losses + (result === 'loss' ? 1 : 0),
      draws: stats.draws,
      totalPoints: (stats.totalPoints || 0) + (memberScore || 0),
      teamGames: (stats.teamGames || 0) + 1,
      teamWins: (stats.teamWins || 0) + (result === 'win' ? 1 : 0),
    }
  })

  await update(ref(db, `users/${userId}/profile`), {
    username,
    updatedAt: new Date().toISOString(),
  })

  return result
}

export async function getUserStats(userId) {
  const snapshot = await get(ref(db, `users/${userId}`))
  return snapshot.val() || { stats: { totalGames: 0, wins: 0, losses: 0, draws: 0, totalPoints: 0, teamGames: 0, teamWins: 0 }, matches: {} }
}

export const test = 'working'
