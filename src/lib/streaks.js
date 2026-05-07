import { get, ref, runTransaction } from 'firebase/database'
import { db } from './firebase'

const NIGERIA_UTC_OFFSET_HOURS = 1

function parseDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return null
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

export function getDayDifference(fromDateKey, toDateKey) {
  const fromDate = parseDateKey(fromDateKey)
  const toDate = parseDateKey(toDateKey)
  if (!fromDate || !toDate) return 0
  return Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000))
}

export function calculateWinStreak(matches = []) {
  const sortedMatches = [...matches].sort((a, b) => {
    const aTime = new Date(a?.date || a?.timestamp || 0).getTime()
    const bTime = new Date(b?.date || b?.timestamp || 0).getTime()
    return bTime - aTime
  })

  let streak = 0
  for (const match of sortedMatches) {
    if (match?.result === 'win') {
      streak += 1
      continue
    }
    break
  }

  return streak
}

export function getUnlockedMilestones({
  wins = 0,
  totalPoints = 0,
  dailyStreakBest = 0,
}) {
  const milestones = [
    {
      id: 'wins-10',
      label: '10 Wins',
      detail: 'Win 10 online matches',
      unlocked: wins >= 10,
    },
    {
      id: 'points-50',
      label: '50 Points',
      detail: 'Score 50 total points across saved games',
      unlocked: totalPoints >= 50,
    },
    {
      id: 'streak-3',
      label: '3-Day Streak',
      detail: 'Play the daily challenge 3 days in a row',
      unlocked: dailyStreakBest >= 3,
    },
    {
      id: 'streak-7',
      label: '7-Day Streak',
      detail: 'Keep a daily streak alive for a full week',
      unlocked: dailyStreakBest >= 7,
    },
  ]

  return milestones.filter((milestone) => milestone.unlocked)
}

function getTodayDateKey(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const year = nigeriaDate.getUTCFullYear()
  const month = String(nigeriaDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(nigeriaDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function updateDailyStreak({ userId, dateKey }) {
  const streakRef = ref(db, `users/${userId}/dailyStreak`)
  const result = await runTransaction(streakRef, (current) => {
    const streak = current || {
      current: 0,
      best: 0,
      lastPlayedDateKey: null,
      lastBrokenOnDateKey: null,
    }

    const dayDiff = getDayDifference(streak.lastPlayedDateKey, dateKey)
    let nextCurrent = streak.current || 0

    if (!streak.lastPlayedDateKey) {
      nextCurrent = 1
    } else if (dayDiff === 1) {
      nextCurrent = (streak.current || 0) + 1
    } else if (dayDiff > 1) {
      nextCurrent = 1
    }

    return {
      ...streak,
      current: nextCurrent,
      best: Math.max(streak.best || 0, nextCurrent),
      lastPlayedDateKey: dateKey,
      updatedAt: new Date().toISOString(),
    }
  })

  return result.snapshot.val()
}

export async function recordGameplayActivity({ userId, dateKey = getTodayDateKey(), source = 'game' }) {
  if (!userId || !dateKey) return null

  const activityRef = ref(db, `users/${userId}/playActivity/${dateKey}/${source}`)
  await runTransaction(activityRef, (current) => current || {
    dateKey,
    source,
    playedAt: new Date().toISOString(),
  })

  return updateDailyStreak({ userId, dateKey })
}

export async function recordDailyChallengeActivity({ userId, dateKey, sport, score }) {
  if (!userId || !dateKey || !sport) return null

  const historyRef = ref(db, `users/${userId}/dailyChallengeHistory/${dateKey}/${sport}`)
  const existingEntry = await get(historyRef)

  if (!existingEntry.exists()) {
    await runTransaction(historyRef, (current) => current || {
      dateKey,
      sport,
      score,
      playedAt: new Date().toISOString(),
    })

    const statsRef = ref(db, `users/${userId}/stats`)
    await runTransaction(statsRef, (current) => {
      const stats = current || { totalGames: 0, wins: 0, losses: 0, draws: 0, totalPoints: 0 }
      return {
        ...stats,
        totalPoints: (stats.totalPoints || 0) + (score || 0),
      }
    })
  }

  return recordGameplayActivity({
    userId,
    dateKey,
    source: `daily-${sport}`,
  })
}

export async function resetBrokenDailyStreak({ userId, todayDateKey }) {
  if (!userId || !todayDateKey) return { lost: false, streak: null }

  const streakRef = ref(db, `users/${userId}/dailyStreak`)
  const snapshot = await get(streakRef)
  const streak = snapshot.val()

  if (!streak?.lastPlayedDateKey || !streak?.current) {
    return { lost: false, streak }
  }

  const dayDiff = getDayDifference(streak.lastPlayedDateKey, todayDateKey)
  if (dayDiff <= 1) {
    return { lost: false, streak }
  }

  const previousCount = streak.current
  const updated = {
    ...streak,
    current: 0,
    lastBrokenOnDateKey: todayDateKey,
    updatedAt: new Date().toISOString(),
  }

  await runTransaction(streakRef, (current) => {
    if (!current?.lastPlayedDateKey || !current?.current) return current
    const latestDiff = getDayDifference(current.lastPlayedDateKey, todayDateKey)
    if (latestDiff <= 1) return current

    return {
      ...current,
      current: 0,
      lastBrokenOnDateKey: todayDateKey,
      updatedAt: new Date().toISOString(),
    }
  })

  return {
    lost: true,
    previousCount,
    streak: updated,
  }
}
