import { ref, get, set, onValue } from 'firebase/database'
import { db } from './firebase'

function getDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getCommonLinkQuestions({ sport, count = 10 }) {
  const snap = await get(ref(db, `commonLinkQuestions/${sport}/bank`))
  const data = snap.val()
  if (!data) return []
  const all = Object.entries(data).map(([id, val]) => ({ id, ...val }))
  const shuffled = all.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export async function saveCommonLinkLeaderboard({ sport, playerId, displayName, score, totalQuestions }) {
  const dateKey = getDateKey()
  const entry = {
    playerId,
    displayName,
    score,
    totalQuestions,
    accuracyPct: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
    completedAt: Date.now(),
    dateKey,
  }
  await set(ref(db, `commonLinkLeaderboard/${dateKey}/${sport}/entries/${playerId}`), entry)
  return entry
}

export function listenToCommonLinkLeaderboard({ sport, dateKey }, onData, onError) {
  const path = `commonLinkLeaderboard/${dateKey}/${sport}/entries`
  const r = ref(db, path)
  const unsub = onValue(r, snap => {
    const data = snap.val()
    if (!data) { onData([]); return }
    const entries = Object.values(data)
      .sort((a, b) => b.score - a.score || a.completedAt - b.completedAt)
      .map((e, i) => ({ ...e, rank: i + 1 }))
    onData(entries)
  }, onError)
  return unsub
}
export { getDateKey }