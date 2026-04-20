import { get, off, onValue, ref, runTransaction } from 'firebase/database'
import { db } from './firebase'
import { getQuestionBank } from './question'

const DEFAULT_ROUNDS = 10
export const DAILY_RELEASE_HOUR_UTC = 12
export const DAILY_DURATION_MINUTES = 30

function hashSeed(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededOrder(items, seed) {
  return [...items]
    .map((item, index) => ({
      item,
      key: hashSeed(`${seed}:${item.question}:${index}`),
    }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => ({ ...item }))
}

export function getDateKey(date = new Date()) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getReleaseTimeUTC(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    DAILY_RELEASE_HOUR_UTC,
    0,
    0,
    0
  ))
}

function getCutoffTimeUTC(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    DAILY_RELEASE_HOUR_UTC,
    DAILY_DURATION_MINUTES,
    0,
    0
  ))
}

export function getNextDailyRelease(now = new Date()) {
  const todayRelease = getReleaseTimeUTC(now)
  if (now < todayRelease) return todayRelease
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  ))
  return getReleaseTimeUTC(tomorrow)
}

export function isDailyChallengeOpen(now = new Date()) {
  const release = getReleaseTimeUTC(now)
  const cutoff = getCutoffTimeUTC(now)
  return now >= release && now < cutoff
}

export function isDailyChallengeAvailable(now = new Date()) {
  return isDailyChallengeOpen(now)
}

export function getDailyChallengeInfo({ sport, now = new Date(), rounds = DEFAULT_ROUNDS }) {
  const releaseTime = getReleaseTimeUTC(now)
  const cutoffTime = getCutoffTimeUTC(now)
  const available = isDailyChallengeOpen(now)
  const nextRelease = available ? cutoffTime : getNextDailyRelease(now)

  return {
    ...getDailyChallenge({ sport, date: releaseTime, rounds }),
    available,
    releaseTime,
    cutoffTime,
    nextRelease,
  }
}

export function getDailyChallenge({ sport, date = new Date(), rounds = DEFAULT_ROUNDS }) {
  const dateKey = getDateKey(date)
  const bank = getQuestionBank(sport)
  const questions = seededOrder(bank, `${sport}:${dateKey}`).slice(0, rounds)

  return {
    dateKey,
    rounds,
    sport,
    questions,
    title: `${sport === 'basketball' ? 'Basketball' : 'Football'} Daily Challenge`,
  }
}

function getLeaderboardPath({ dateKey, sport }) {
  return `dailyLeaderboards/${dateKey}/${sport}/entries`
}

function sortEntries(entriesMap) {
  return Object.values(entriesMap || {})
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
      if ((a.totalTimeMs || 0) !== (b.totalTimeMs || 0)) return (a.totalTimeMs || 0) - (b.totalTimeMs || 0)
      return (a.displayName || '').localeCompare(b.displayName || '')
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
}

export async function saveDailyLeaderboardEntry({
  dateKey,
  sport,
  playerId,
  displayName,
  score,
  totalQuestions,
  totalTimeMs,
}) {
  const entryRef = ref(db, `${getLeaderboardPath({ dateKey, sport })}/${playerId}`)

  await runTransaction(entryRef, (current) => {
    const nextEntry = {
      playerId,
      displayName,
      score,
      totalQuestions,
      totalTimeMs,
      accuracyPct: Math.round((score / totalQuestions) * 100),
      updatedAt: Date.now(),
    }

    if (!current) return nextEntry

    const currentScore = current.score || 0
    const currentTime = current.totalTimeMs || Number.MAX_SAFE_INTEGER
    const isBetterScore = score > currentScore
    const isBetterTime = score === currentScore && totalTimeMs < currentTime

    return isBetterScore || isBetterTime
      ? { ...current, ...nextEntry }
      : { ...current, displayName, updatedAt: Date.now() }
  })

  const snapshot = await get(ref(db, getLeaderboardPath({ dateKey, sport })))
  const leaderboard = sortEntries(snapshot.val() || {})
  return {
    leaderboard,
    rank: leaderboard.findIndex((entry) => entry.playerId === playerId) + 1,
  }
}

export function listenToDailyLeaderboard({ dateKey, sport }, callback, onError) {
  const leaderboardRef = ref(db, getLeaderboardPath({ dateKey, sport }))
  const handler = (snapshot) => {
    callback(sortEntries(snapshot.val() || {}))
  }

  onValue(leaderboardRef, handler, onError)
  return () => off(leaderboardRef, 'value', handler)
}
