import { ref, push, update, get, runTransaction } from 'firebase/database'
import { db } from './firebase'

export async function saveMatchResult({ userId, username, opponent, opponentName, myScore, opponentScore, sport, rounds }) {
  const result = myScore > opponentScore ? 'win' : myScore < opponentScore ? 'loss' : 'draw'

  const matchData = {
    opponent,
    opponentName,
    myScore,
    opponentScore,
    result,
    sport,
    rounds,
    date: new Date().toISOString(),
  }

  const matchRef = ref(db, `users/${userId}/matches`)
  await push(matchRef, matchData)

  // Use transaction to update stats atomically (prevent race conditions)
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

  await update(ref(db, `users/${userId}/profile`), {
    username,
    updatedAt: new Date().toISOString(),
  })

  return result
}

export async function getUserStats(userId) {
  const snapshot = await get(ref(db, `users/${userId}`))
  return snapshot.val() || { stats: { totalGames: 0, wins: 0, losses: 0, draws: 0, totalPoints: 0 }, matches: {} }
}
export const test = 'working'
