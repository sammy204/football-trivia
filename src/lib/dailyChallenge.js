import { get, off, onValue, ref, set } from 'firebase/database'
import { db } from './firebase'

const DEFAULT_ROUNDS = 10
export const DAILY_RELEASE_HOUR_NIGERIA = 12
export const DAILY_DURATION_MINUTES = 32
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

function dateFromDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return new Date()
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
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
    0, 0, 0, 0
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

// ─── Converts Firebase keyed options { a, b, c, d } back to array format ────
// so the rest of the game (Quiz.jsx etc.) keeps working without any changes
function normalizeQuestion(q) {
  if (!q) return null

  // Already in array format (shouldn't happen from Firebase but just in case)
  if (Array.isArray(q.options)) return q

  const keys = ['a', 'b', 'c', 'd']
  const optionsArray = keys.map(k => q.options?.[k] ?? '')

  // Convert answer key (e.g. 'b') back to the answer string (e.g. 'France')
  const answerString = q.options?.[q.answer] ?? q.answer

  return {
    question: q.question,
    options: optionsArray,
    answer: answerString,
    explanation: q.explanation ?? '',
  }
}

// ─── Fetch daily questions from Firebase ─────────────────────────────────────
export async function getDailyChallengeSet({ sport, date = new Date() }) {
  const dateKey = getDateKey(date)

  try {
    const snap = await get(ref(db, `adminQuestions/${sport}/daily`))
    const data = snap.val()

    if (!data) {
      return { dateKey, sport, questions: null }
    }

    // Filter questions assigned to today's dateKey
    // Admin sets a scheduledDate field when assigning daily questions
    // If no scheduledDate, fall back to all daily questions (for backwards compat)
    const allQuestions = Object.values(data).map(normalizeQuestion).filter(Boolean)

    const todayQuestions = allQuestions.filter(q => q.scheduledDate === dateKey)
    const questions = todayQuestions.length > 0 ? todayQuestions : allQuestions

    return {
      dateKey,
      sport,
      questions: questions.length > 0 ? questions : null,
    }
  } catch (e) {
    console.error('Failed to fetch daily challenge questions from Firebase:', e)
    return { dateKey, sport, questions: null }
  }
}

// ─── Async versions of getDailyChallenge ─────────────────────────────────────
export async function getDailyChallengeInfo({ sport, now = new Date(), rounds = DEFAULT_ROUNDS }) {
  const releaseTime = getReleaseTimeUTC(now)
  const cutoffTime = getCutoffTimeUTC(now)
  const challenge = await getDailyChallenge({ sport, date: now, rounds })
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

export async function getDailyChallenge({ sport, date = new Date(), rounds = DEFAULT_ROUNDS }) {
  const { dateKey, questions: challengeQuestions } = await getDailyChallengeSet({ sport, date })
  const questions = (challengeQuestions || []).slice(0, rounds)

  return {
    dateKey,
    rounds: questions.length || rounds,
    sport,
    questions,
    title: `${sport === 'basketball' ? 'Basketball' : 'Football'} Daily Challenge`,
  }
}

// ─── Played tracking (unchanged) ─────────────────────────────────────────────
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

export async function hasPlayedDailyChallengeOnline({ userId, dateKey, sport }) {
  if (!userId) return false
  try {
    const snap = await get(ref(db, `users/${userId}/dailyPlayed/${dateKey}/${sport}`))
    return snap.exists()
  } catch {
    return false
  }
}

export async function markDailyChallengePlayedOnline({ userId, dateKey, sport, playedAt = Date.now() }) {
  if (!userId) return
  try {
    await set(ref(db, `users/${userId}/dailyPlayed/${dateKey}/${sport}`), playedAt)
  } catch (e) {
    console.error('Failed to mark daily played in Firebase:', e)
  }
}

// ─── Leaderboard (unchanged) ──────────────────────────────────────────────────
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
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function sortWeeklyEntries(entriesMap) {
  return Object.values(entriesMap || {})
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
      if ((b.daysPlayed || 0) !== (a.daysPlayed || 0)) return (b.daysPlayed || 0) - (a.daysPlayed || 0)
      return (a.displayName || '').localeCompare(b.displayName || '')
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
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
  const snapshot = await get(entryRef)
  const current = snapshot.val()

  const nextEntry = {
    playerId,
    displayName,
    score,
    totalQuestions,
    totalTimeMs,
    accuracyPct: Math.round((score / totalQuestions) * 100),
    updatedAt: Date.now(),
  }

  let finalEntry = nextEntry

  if (current) {
    const currentScore = current.score || 0
    const currentTime = current.totalTimeMs || Number.MAX_SAFE_INTEGER
    const isBetterScore = score > currentScore
    const isBetterTime = score === currentScore && totalTimeMs < currentTime

    finalEntry = isBetterScore || isBetterTime
      ? { ...current, ...nextEntry }
      : { ...current, displayName, updatedAt: Date.now() }
  }

  await set(entryRef, finalEntry)

  const leaderboardSnapshot = await get(ref(db, getLeaderboardPath({ dateKey, sport })))
  const leaderboard = sortEntries(leaderboardSnapshot.val() || {})

  await saveWeeklyLeaderboardEntry({
    dateKey,
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
  dateKey,
  sport,
  playerId,
  displayName,
  score,
  totalQuestions,
  totalTimeMs,
}) {
  const safeScore = Number(score) || 0
  const safeTotalQuestions = Number(totalQuestions) || 0
  const safeTotalTimeMs = Number(totalTimeMs) || 0
  const playedDateKey = dateKey || getDateKey()
  const weekKey = getWeekKey(dateFromDateKey(playedDateKey))
  const entryRef = ref(db, `${getWeeklyLeaderboardPath({ weekKey, sport })}/${playerId}`)
  const snapshot = await get(entryRef)
  const current = snapshot.val()

  if (!current) {
    await set(entryRef, {
      playerId,
      displayName,
      score: safeScore,
      totalQuestions: safeTotalQuestions,
      totalTimeMs: safeTotalTimeMs,
      daysPlayed: 1,
      lastPlayedDateKey: playedDateKey,
      accuracyPct: safeTotalQuestions > 0 ? Math.round((safeScore / safeTotalQuestions) * 100) : 0,
      updatedAt: Date.now(),
    })
  } else {
    const alreadyCountedToday = current.lastPlayedDateKey === playedDateKey
    const newScore = (current.score || 0) + safeScore
    const newTotalQuestions = (current.totalQuestions || 0) + safeTotalQuestions
    const newTotalTimeMs = (current.totalTimeMs || 0) + safeTotalTimeMs
    const newDaysPlayed = alreadyCountedToday ? (current.daysPlayed || 1) : (current.daysPlayed || 0) + 1

    await set(entryRef, {
      ...current,
      displayName,
      score: newScore,
      totalQuestions: newTotalQuestions,
      totalTimeMs: newTotalTimeMs,
      daysPlayed: newDaysPlayed,
      lastPlayedDateKey: playedDateKey,
      accuracyPct: newTotalQuestions > 0 ? Math.round((newScore / newTotalQuestions) * 100) : 0,
      updatedAt: Date.now(),
    })
  }
}

export function listenToWeeklyLeaderboard({ weekKey, sport }, callback, onError) {
  const leaderboardRef = ref(db, getWeeklyLeaderboardPath({ weekKey, sport }))
  const handler = (snapshot) => {
    callback(sortWeeklyEntries(snapshot.val() || {}))
  }
  onValue(leaderboardRef, handler, onError)
  return () => off(leaderboardRef, 'value', handler)
}
