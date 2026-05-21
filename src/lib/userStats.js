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
    coinsEarned,
    coinsLost: 0,
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
    coinsEarned: 0,
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

export function getRivalries(matches, limit = 5) {
  if (!matches || matches.length === 0) return []
 
  const map = {}
 
  for (const m of matches) {
    // skip team games and matches with no opponent id
    if (m.isTeamGame) continue
    const id = m.opponent || 'unknown'
    if (id === 'unknown') continue
 
    if (!map[id]) {
      map[id] = {
        opponentId: id,
        opponentName: m.opponentName || 'Unknown',
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        lastResult: null,
        lastTimestamp: 0,
      }
    }
 
    const r = map[id]
    r.played++
    if (m.result === 'win') r.wins++
    else if (m.result === 'loss') r.losses++
    else r.draws++
 
    if ((m.timestamp || 0) > r.lastTimestamp) {
      r.lastTimestamp = m.timestamp || 0
      r.lastResult = m.result
      // update name in case it changed
      if (m.opponentName) r.opponentName = m.opponentName
    }
  }
 
  return Object.values(map)
    .sort((a, b) => b.played - a.played || b.wins - a.wins)
    .slice(0, limit)
    .map(r => ({
      ...r,
      iWinning: r.wins > r.losses,
      tied: r.wins === r.losses,
    }))
}
 
/**
 * getFormBadge
 * Returns the last N results as an array of 'win' | 'loss' | 'draw' strings,
 * most recent first, for rendering as colored dots.
 *
 * Usage:  getFormBadge(matches, 5)
 * Returns: ['win', 'loss', 'win', 'win', 'draw']
 */
export function getFormBadge(matches, count = 5) {
  if (!matches || matches.length === 0) return []

  return [...matches]
    .filter(m => !m.isTeamGame)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .slice(-count)
    .map(m => m.result || 'draw')
}

export async function getOpponentForm(opponentUid, count = 5) {
  if (!opponentUid) return []
  try {
    const snap = await get(ref(db, `users/${opponentUid}/matches`))
    if (!snap.val()) return []
    const matches = Object.values(snap.val())
    return getFormBadge(matches, count)
  } catch {
    return []
  }
}