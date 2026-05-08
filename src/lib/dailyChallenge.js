import { get, off, onValue, ref, runTransaction } from 'firebase/database'
import { db } from './firebase'
import dailyChallenges from '../data/questions/daily'

const DEFAULT_ROUNDS = 10
export const DAILY_RELEASE_HOUR_NIGERIA = 12
export const DAILY_DURATION_MINUTES = 30
const NIGERIA_UTC_OFFSET_HOURS = 1
const DAILY_PLAYED_KEY = 'trivela-daily-played'

export function getDateKey(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const year = nigeriaDate.getUTCFullYear()
  const month = String(nigeriaDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(nigeriaDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekKey(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const thursday = new Date(Date.UTC(
    nigeriaDate.getUTCFullYear(),
    nigeriaDate.getUTCMonth(),
    nigeriaDate.getUTCDate() + (4 - nigeriaDate.getUTCDay())
  ))
  const year = thursday.getUTCFullYear()
  const firstDayOfYear = new Date(Date.UTC(year, 0, 1))
  const weekNumber = Math.ceil((((thursday - firstDayOfYear) / 86400000) + 1) / 7)
  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}

function getReleaseTimeUTC(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  return new Date(Date.UTC(
    nigeriaDate.getUTCFullYear(),
    nigeriaDate.getUTCMonth(),
    nigeriaDate.getUTCDate(),
    DAILY_RELEASE_HOUR_NIGERIA - NIGERIA_UTC_OFFSET_HOURS,
    0,
    0,
    0
  ))
}

function getCutoffTimeUTC(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  return new Date(Date.UTC(
    nigeriaDate.getUTCFullYear(),
    nigeriaDate.getUTCMonth(),
    nigeriaDate.getUTCDate(),
    DAILY_RELEASE_HOUR_NIGERIA - NIGERIA_UTC_OFFSET_HOURS,
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

export function getDailyChallengeSet({ sport, date = new Date() }) {
  const dateKey = getDateKey(date)
  const sportChallenges = dailyChallenges[sport] || {}
  const questions = sportChallenges[dateKey] || null

  return {
    dateKey,
    sport,
    questions: questions ? questions.map((question) => ({ ...question })) : null,
  }
}

export function getDailyChallengeInfo({ sport, now = new Date(), rounds = DEFAULT_ROUNDS }) {
  const releaseTime = getReleaseTimeUTC(now)
  const cutoffTime = getCutoffTimeUTC(now)
  const challenge = getDailyChallenge({ sport, date: releaseTime, rounds })
  const available = isDailyChallengeOpen(now) && challenge.questions.length > 0
  const nextRelease = available ? cutoffTime : getNextDailyRelease(now)

  return {
    ...challenge,
    available,
    releaseTime,
    cutoffTime,
    nextRelease,
  }
}

export function getDailyChallenge({ sport, date = new Date(), rounds = DEFAULT_ROUNDS }) {
  const { dateKey, questions: challengeQuestions } = getDailyChallengeSet({ sport, date })
  const questions = (challengeQuestions || []).slice(0, rounds)

  return {
    dateKey,
    rounds: questions.length || rounds,
    sport,
    questions,
    title: `${sport === 'basketball' ? 'Basketball' : 'Football'} Daily Challenge`,
  }
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function getPlayedMap() {
  if (!canUseStorage()) return {}
  try {
    const raw = window.localStorage.getItem(DAILY_PLAYED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setPlayedMap(nextMap) {
  if (!canUseStorage()) return
  window.localStorage.setItem(DAILY_PLAYED_KEY, JSON.stringify(nextMap))
}

function getPlayedEntryKey({ dateKey, sport }) {
  return `${sport}:${dateKey}`
}

export function hasPlayedDailyChallenge({ dateKey, sport }) {
  return Boolean(getPlayedMap()[getPlayedEntryKey({ dateKey, sport })])
}

export function markDailyChallengePlayed({ dateKey, sport, playedAt = Date.now() }) {
  const playedMap = getPlayedMap()
  playedMap[getPlayedEntryKey({ dateKey, sport })] = playedAt
  setPlayedMap(playedMap)
}

function getLeaderboardPath({ dateKey, sport }) {
  return `dailyLeaderboards/${dateKey}/${sport}/entries`
}

function getWeeklyLeaderboardPath({ weekKey, sport }) {
  return `weeklyLeaderboards/${weekKey}/${sport}/entries`
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

function sortWeeklyEntries(entriesMap) {
  return Object.values(entriesMap || {})
    .sort((a, b) => {
      // Sort by total score descending, then by days played descending as tiebreaker
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
      if ((b.daysPlayed || 0) !== (a.daysPlayed || 0)) return (b.daysPlayed || 0) - (a.daysPlayed || 0)
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

  await saveWeeklyLeaderboardEntry({
    sport,
    playerId,
    displayName,
    score,
    totalQuestions,
    totalTimeMs,
  })

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

export async function saveWeeklyLeaderboardEntry({
  sport,
  playerId,
  displayName,
  score,
  totalQuestions,
  totalTimeMs,
}) {
  const weekKey = getWeekKey()
  const entryRef = ref(db, `${getWeeklyLeaderboardPath({ weekKey, sport })}/${playerId}`)

  await runTransaction(entryRef, (current) => {
    if (!current) {
      return {
        playerId,
        displayName,
        score,
        totalQuestions,
        totalTimeMs,
        daysPlayed: 1,
        accuracyPct: Math.round((score / totalQuestions) * 100),
        updatedAt: Date.now(),
      }
    }

    // FIX: use explicit variables to avoid operator precedence bug
    const newScore = (current.score || 0) + score
    const newTotalQuestions = (current.totalQuestions || 0) + totalQuestions
    const newTotalTimeMs = (current.totalTimeMs || 0) + totalTimeMs
    const newDaysPlayed = (current.daysPlayed || 0) + 1

    return {
      ...current,
      displayName,
      score: newScore,
      totalQuestions: newTotalQuestions,
      totalTimeMs: newTotalTimeMs,
      daysPlayed: newDaysPlayed,
      accuracyPct: Math.round((newScore / newTotalQuestions) * 100),
      updatedAt: Date.now(),
    }
  })
}

export function listenToWeeklyLeaderboard({ weekKey, sport }, callback, onError) {
  const leaderboardRef = ref(db, getWeeklyLeaderboardPath({ weekKey, sport }))
  const handler = (snapshot) => {
    callback(sortWeeklyEntries(snapshot.val() || {}))
  }
  onValue(leaderboardRef, handler, onError)
  return () => off(leaderboardRef, 'value', handler)
}