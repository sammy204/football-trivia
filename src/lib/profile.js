import { ref, update, get } from 'firebase/database'
import { db } from './firebase'

const PROFILE_KEY = 'trivela-profile'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

// Generates a unique FTB-XXXX player ID
export function generatePlayerId() {
  const digits = Math.floor(1000 + Math.random() * 9000) // always 4 digits
  const letters = Math.random().toString(36).slice(2, 4).toUpperCase() // 2 random letters
  return `FTB-${letters}${digits}`
}

export function loadProfile() {
  if (!canUseStorage()) return null

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.id || !parsed?.displayName) return null
    return parsed
  } catch {
    return null
  }
}

export function saveProfile({ displayName, playerId }) {
  const cleanedName = displayName.trim()
  if (!cleanedName) throw new Error('Display name is required.')

  const nextProfile = {
    id: loadProfile()?.id || `player-${Math.random().toString(36).slice(2, 10)}`,
    playerId: playerId || loadProfile()?.playerId || null,
    displayName: cleanedName,
  }

  if (canUseStorage()) {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
  }

  return nextProfile
}

// Called on signup — generates a player ID and saves it to Firebase + localStorage
export async function assignPlayerIdToUser(uid, displayName) {
   console.log('🔍 Checking player ID for:', uid)
  // Check if user already has a player ID (e.g. re-signup edge case)
  const existingRef = ref(db, `users/${uid}/playerId`)
  const existingSnap = await get(existingRef)
  console.log('📦 Existing player ID:', existingSnap.val())

  if (existingSnap.val()) {
    // Already has one, just return it
    return existingSnap.val()
  }

  // Generate a new one
  const playerId = generatePlayerId()

  // Save to Firebase under users/{uid}
// Save to Firebase under users/{uid}
  try {
    await update(ref(db, `users/${uid}`), {
      playerId,
      displayName: displayName.trim(),
      createdAt: Date.now(),
    })
    console.log('✅ Saved to Firebase successfully')
  } catch (err) {
    console.error('🔥 Firebase write failed:', err.code, err.message)
  }

  // Also save to localStorage
  const current = loadProfile()
  const updated = {
    id: current?.id || `player-${Math.random().toString(36).slice(2, 10)}`,
    displayName: displayName.trim(),
    playerId,
  }
  if (canUseStorage()) {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
  }

  return playerId
}

// Fetches player ID from Firebase and caches it locally
export async function fetchAndCachePlayerId(uid) {
  try {
    const snap = await get(ref(db, `users/${uid}`))
    const data = snap.val()
    if (!data?.playerId) return null

    // Update localStorage cache
    const current = loadProfile() || {}
    const updated = {
      ...current,
      playerId: data.playerId,
      displayName: data.displayName || current.displayName,
    }
    if (canUseStorage()) {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
    }

    return data.playerId
  } catch {
    return null
  }
}

export function clearProfile() {
  if (canUseStorage()) {
    window.localStorage.removeItem(PROFILE_KEY)
  }
  return null
}