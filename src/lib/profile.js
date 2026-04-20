const PROFILE_KEY = 'trivela-profile'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function createId() {
  return `player-${Math.random().toString(36).slice(2, 10)}`
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

export function saveProfile({ displayName }) {
  const cleanedName = displayName.trim()
  if (!cleanedName) throw new Error('Display name is required.')

  const nextProfile = {
    id: loadProfile()?.id || createId(),
    displayName: cleanedName,
  }

  if (canUseStorage()) {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
  }

  return nextProfile
}

export function clearProfile() {
  if (canUseStorage()) {
    window.localStorage.removeItem(PROFILE_KEY)
  }
  return null
}
