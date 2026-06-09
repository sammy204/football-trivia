import { get, off, onValue, ref, runTransaction } from 'firebase/database'
import { db } from './firebase'

export const DEFAULT_HOME_MODES = ['solo', 'online', 'bestOfThree', 'lightning_h2h', 'tournament']

export async function recordModePlayed(userId, mode) {
  if (!userId || !mode) return

  const modeRef = ref(db, `users/${userId}/modeCounts/${mode}`)
  await runTransaction(modeRef, (current) => {
    const count = typeof current === 'number' ? current : current?.count || 0
    return {
      count: count + 1,
      lastPlayedAt: Date.now(),
    }
  })
}

export function listenToModeCounts(userId, callback, onError) {
  if (!userId) {
    callback({})
    return () => {}
  }

  const modeRef = ref(db, `users/${userId}/modeCounts`)
  const handler = (snapshot) => {
    callback(snapshot.val() || {})
  }

  onValue(modeRef, handler, onError)
  return () => off(modeRef, 'value', handler)
}

export async function getModeCounts(userId) {
  if (!userId) return {}
  const snapshot = await get(ref(db, `users/${userId}/modeCounts`))
  return snapshot.val() || {}
}

export function getHomeModeIds(modeCounts, limit = 5) {
  const ranked = Object.entries(modeCounts || {})
    .map(([id, value]) => ({
      id,
      count: typeof value === 'number' ? value : value?.count || 0,
      lastPlayedAt: typeof value === 'number' ? 0 : value?.lastPlayedAt || 0,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || b.lastPlayedAt - a.lastPlayedAt)
    .map((entry) => entry.id)

  const merged = [...ranked]
  for (const fallback of DEFAULT_HOME_MODES) {
    if (!merged.includes(fallback)) merged.push(fallback)
  }

  return merged.slice(0, limit)
}
