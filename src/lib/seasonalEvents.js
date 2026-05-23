import { get, off, onValue, ref, set, remove } from 'firebase/database'
import { db } from './firebase'

const SEASONAL_PLAYED_KEY = 'trivela-seasonal-played'
const NIGERIA_UTC_OFFSET_HOURS = 1

// ─── Date helpers (same pattern as dailyChallenge.js) ────────────────────────

export function getDateKey(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const year = nigeriaDate.getUTCFullYear()
  const month = String(nigeriaDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(nigeriaDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeQuestion(q) {
  if (!q) return null
  if (Array.isArray(q.options)) return q

  const keys = ['a', 'b', 'c', 'd']
  const options = keys.map(key => q.options?.[key] ?? '').filter(Boolean)
  const answer = q.options?.[q.answer] ?? q.answer

  if (!q.question || options.length === 0 || !answer) return null

  return {
    question: q.question,
    options,
    answer,
    explanation: q.explanation ?? '',
  }
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5)
}

// ─── Read all active seasonal events ─────────────────────────────────────────
// Called by Home.jsx to populate the carousel cards

export async function getActiveSeasonalEvents() {
  try {
    const snap = await get(ref(db, 'seasonalEvents'))
    const data = snap.val()

    if (!data) return []

    const now = new Date()
    const todayKey = getDateKey(now)

    return Object.entries(data)
      .map(([id, event]) => ({ id, ...event }))
      .filter(event => {
        // Skip the placeholder we created in Firebase Console
        if (event.name === 'placeholder') return false
        if (!event.active) return false
        // Keep upcoming events visible on Home, but hide ended events.
        if (event.endDate && event.endDate < todayKey) return false
        return true
      })
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
  } catch (e) {
    console.error('Failed to fetch seasonal events:', e)
    return []
  }
}

// ─── Read a single seasonal event ────────────────────────────────────────────

export async function getSeasonalEventQuestions({ sport, rounds = 10 }) {
  try {
    const snap = await get(ref(db, `adminQuestions/${sport}/seasonal`))
    const data = snap.val()
    if (!data) return []

    return shuffle(Object.values(data).map(normalizeQuestion).filter(Boolean)).slice(0, rounds)
  } catch (e) {
    console.error('Failed to fetch seasonal event questions:', e)
    return []
  }
}

export async function getSeasonalEvent(eventId) {
  try {
    const snap = await get(ref(db, `seasonalEvents/${eventId}`))
    if (!snap.exists()) return null
    return { id: eventId, ...snap.val() }
  } catch (e) {
    console.error('Failed to fetch seasonal event:', e)
    return null
  }
}

// ─── Listen to all seasonal events (real-time, for Admin panel) ───────────────

export function listenToAllSeasonalEvents(callback, onError) {
  const eventsRef = ref(db, 'seasonalEvents')
  const handler = (snap) => {
    const data = snap.val() || {}
    const events = Object.entries(data)
      .map(([id, event]) => ({ id, ...event }))
      .filter(event => event.name !== 'placeholder')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    callback(events)
  }
  onValue(eventsRef, handler, onError)
  return () => off(eventsRef, 'value', handler)
}

// ─── Admin: create a new seasonal event ──────────────────────────────────────
// eventId is generated from the event name — slug style, e.g. "world-cup-2026"

export async function createSeasonalEvent({
  name,
  sport,
  type = 'countdown',
  startDate,
  endDate,
  description = '',
  coinMultiplier = 1,
  entryFee = 0,
  dailyQuestions = 10,
  notificationText = '',
}) {
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const eventData = {
    name,
    sport,
    type,
    startDate,
    endDate,
    description,
    coinMultiplier,
    entryFee,
    dailyQuestions,
    notificationText,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  try {
    await set(ref(db, `seasonalEvents/${id}`), eventData)
    return { id, ...eventData }
  } catch (e) {
    console.error('Failed to create seasonal event:', e)
    throw e
  }
}

// ─── Admin: update an existing seasonal event ─────────────────────────────────

export async function updateSeasonalEvent(eventId, updates) {
  try {
    const snap = await get(ref(db, `seasonalEvents/${eventId}`))
    if (!snap.exists()) throw new Error('Event not found')

    const current = snap.val()
    await set(ref(db, `seasonalEvents/${eventId}`), {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    })
  } catch (e) {
    console.error('Failed to update seasonal event:', e)
    throw e
  }
}

// ─── Admin: toggle active/inactive without deleting ───────────────────────────

export async function setSeasonalEventActive(eventId, active) {
  return updateSeasonalEvent(eventId, { active })
}

// ─── Admin: delete a seasonal event ───────────────────────────────────────────

export async function deleteSeasonalEvent(eventId) {
  try {
    await remove(ref(db, `seasonalEvents/${eventId}`))
  } catch (e) {
    console.error('Failed to delete seasonal event:', e)
    throw e
  }
}

// ─── Played tracking (localStorage, same pattern as dailyChallenge.js) ────────

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function getPlayedMap() {
  if (!canUseStorage()) return {}
  try {
    const raw = window.localStorage.getItem(SEASONAL_PLAYED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setPlayedMap(nextMap) {
  if (!canUseStorage()) return
  window.localStorage.setItem(SEASONAL_PLAYED_KEY, JSON.stringify(nextMap))
}

// Key: eventId:dateKey — one play allowed per event per day
function getPlayedEntryKey({ eventId, dateKey }) {
  return `${eventId}:${dateKey}`
}

export function hasPlayedSeasonalEvent({ eventId, dateKey }) {
  return Boolean(getPlayedMap()[getPlayedEntryKey({ eventId, dateKey })])
}

export function markSeasonalEventPlayed({ eventId, dateKey, playedAt = Date.now() }) {
  const playedMap = getPlayedMap()
  playedMap[getPlayedEntryKey({ eventId, dateKey })] = playedAt
  setPlayedMap(playedMap)
}

// ─── Firebase played tracking (for logged-in users) ───────────────────────────
// Path: seasonalPlays/{eventId}/{userId}/{dateKey}

export async function hasPlayedSeasonalEventOnline({ userId, eventId, dateKey }) {
  if (!userId) return false
  try {
    const snap = await get(ref(db, `seasonalPlays/${eventId}/${userId}/${dateKey}`))
    return snap.exists()
  } catch {
    return false
  }
}

export async function markSeasonalEventPlayedOnline({ userId, eventId, dateKey, playedAt = Date.now() }) {
  if (!userId) return
  try {
    await set(ref(db, `seasonalPlays/${eventId}/${userId}/${dateKey}`), playedAt)
  } catch (e) {
    console.error('Failed to mark seasonal event played in Firebase:', e)
  }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
// Path: seasonalLeaderboard/{eventId}/entries/{userId}

function getLeaderboardPath(eventId) {
  return `seasonalLeaderboard/${eventId}/entries`
}

function sortEntries(entriesMap) {
  return Object.values(entriesMap || {})
    .sort((a, b) => {
      // Sort by total score descending, then games played descending, then name
      if ((b.totalScore || 0) !== (a.totalScore || 0)) return (b.totalScore || 0) - (a.totalScore || 0)
      if ((b.gamesPlayed || 0) !== (a.gamesPlayed || 0)) return (b.gamesPlayed || 0) - (a.gamesPlayed || 0)
      return (a.displayName || '').localeCompare(b.displayName || '')
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export async function saveSeasonalLeaderboardEntry({
  eventId,
  playerId,
  displayName,
  avatar = null,
  photoURL = null,
  score,
  totalQuestions,
  totalTimeMs,
}) {
  const entryRef = ref(db, `${getLeaderboardPath(eventId)}/${playerId}`)
  const snapshot = await get(entryRef)
  const current = snapshot.val()

  if (!current) {
    // First time this user plays this event
    await set(entryRef, {
      playerId,
      displayName,
      avatar: avatar || photoURL || null,
      photoURL: photoURL || avatar || null,
      totalScore: score,
      bestScore: score,
      gamesPlayed: 1,
      totalQuestions,
      totalTimeMs,
      accuracyPct: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
      lastPlayedAt: Date.now(),
      updatedAt: Date.now(),
    })
  } else {
    // Returning player — accumulate score, track best single-game score
    const newTotalScore = (current.totalScore || 0) + score
    const newTotalQuestions = (current.totalQuestions || 0) + totalQuestions
    const newTotalTimeMs = (current.totalTimeMs || 0) + totalTimeMs
    const newGamesPlayed = (current.gamesPlayed || 0) + 1
    const newBestScore = Math.max(current.bestScore || 0, score)

    await set(entryRef, {
      ...current,
      displayName,
      avatar: avatar || photoURL || current.avatar || current.photoURL || null,
      photoURL: photoURL || avatar || current.photoURL || current.avatar || null,
      totalScore: newTotalScore,
      bestScore: newBestScore,
      gamesPlayed: newGamesPlayed,
      totalQuestions: newTotalQuestions,
      totalTimeMs: newTotalTimeMs,
      accuracyPct: newTotalQuestions > 0 ? Math.round((newTotalScore / newTotalQuestions) * 100) : 0,
      lastPlayedAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  // Return the sorted leaderboard + this user's rank
  const leaderboardSnapshot = await get(ref(db, getLeaderboardPath(eventId)))
  const leaderboard = sortEntries(leaderboardSnapshot.val() || {})

  return {
    leaderboard,
    rank: leaderboard.findIndex(entry => entry.playerId === playerId) + 1,
  }
}

// ─── Listen to seasonal leaderboard in real time ──────────────────────────────

export function listenToSeasonalLeaderboard(eventId, callback, onError) {
  const leaderboardRef = ref(db, getLeaderboardPath(eventId))
  const handler = (snapshot) => {
    callback(sortEntries(snapshot.val() || {}))
  }
  onValue(leaderboardRef, handler, onError)
  return () => off(leaderboardRef, 'value', handler)
}

// ─── Get a user's entry for a specific event ──────────────────────────────────

export async function getUserSeasonalEntry({ eventId, playerId }) {
  try {
    const snap = await get(ref(db, `${getLeaderboardPath(eventId)}/${playerId}`))
    return snap.exists() ? snap.val() : null
  } catch {
    return null
  }
}
