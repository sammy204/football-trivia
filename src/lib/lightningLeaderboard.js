import { ref, onValue, off, set } from 'firebase/database'
import { db } from './firebase'

const LIGHTNING_LEADERBOARD_PATH = 'lightningLeaderboard'

export function listenToLightningLeaderboard(
  { sport },
  onData,
  onError
) {
  const path = `${LIGHTNING_LEADERBOARD_PATH}/${sport}`
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

export function saveLightningScore({ sport, playerId, displayName, score, totalQuestions, totalTimeMs, correctAnswers }) {
  const path = `${LIGHTNING_LEADERBOARD_PATH}/${sport}/${playerId}`
  return set(ref(db, path), {
    displayName,
    score,
    totalQuestions,
    totalTimeMs,
    correctAnswers: correctAnswers ?? Math.round((score / (totalQuestions * 100)) * totalQuestions),
    timestamp: Date.now(),
  })
}

