import { ref, onValue, off, set, push, update, remove } from 'firebase/database'
import { db } from './firebase'

const LIGHTNING_DAILY_PATH = 'lightningDaily'

export function listenToLightningLeaderboard(
  { sport, dateKey },
  onData,
  onError
) {
  const path = `${LIGHTNING_DAILY_PATH}/${sport}/${dateKey}`
  const refs = ref(db, path)

  const handleValue = (snap) => {
    const data = snap.val()
    if (!data) {
      onData([])
      return
    }
    const entries = Object.entries(data)
      .map(([playerId, entry]) => ({
        playerId,
        ...entry,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
    onData(entries)
  }

  onValue(refs, handleValue, (err) => {
    console.error('Lightning leaderboard error:', err)
    onError(err)
  })

  return () => off(refs)
}

export function saveLightningScore({
  sport,
  playerId,
  displayName,
  score,
  totalQuestions,
  totalTimeMs,
  correctAnswers,
}) {
  const dateKey = new Date().toISOString().split('T')[0]
  const path = `${LIGHTNING_DAILY_PATH}/${sport}/${dateKey}/${playerId}`
  const accuracyPct = Math.round((correctAnswers / totalQuestions) * 100)

  return set(ref(db, path), {
    displayName,
    score,
    totalQuestions,
    totalTimeMs,
    correctAnswers,
    accuracyPct,
    timestamp: Date.now(),
  })
}
