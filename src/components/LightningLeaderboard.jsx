import { useEffect, useState } from 'react'
import { getDateKey } from '../lib/dailyChallenge'
import styles from './LightningLeaderboard.module.css'

function formatTime(totalTimeMs) {
  if (!totalTimeMs && totalTimeMs !== 0) return '--'
  const seconds = (totalTimeMs / 1000).toFixed(1)
  return `${seconds}s`
}

export default function LightningLeaderboard({ sport, onBack }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dateKey = getDateKey()
  const isBasketball = sport === 'basketball'

  useEffect(() => {
    setLoading(true)
    setError(null)
    setEntries([])

    import('../lib/lightningDaily').then(({ listenToLightningLeaderboard }) => {
      const unsubscribe = listenToLightningLeaderboard(
        { sport, dateKey },
        (nextEntries) => {
          setEntries(nextEntries)
          setLoading(false)
        },
        () => {
          setError('Leaderboard is unavailable right now.')
          setLoading(false)
        }
      )
      return () => unsubscribe()
    }).catch(() => {
      setError('Leaderboard unavailable')
      setLoading(false)
    })
  }, [sport, dateKey])

  useEffect(() => {
    if (!error) return
    const timeout = window.setTimeout(() => setError(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [error])

  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>Back</button>

      <p className={styles.kicker}>Lightning Round — Daily</p>
      <h1 className={styles.title}>
        {isBasketball ? 'Basketball' : 'Football'} Leaderboard
      </h1>
      <p className={styles.date}>{dateKey}</p>

      {loading && (
        <p className={styles.loading}>Loading today's board...</p>
      )}
      {error && <p className={styles.empty}>{error}</p>}
      {!loading && !error && !entries.length && (
        <p className={styles.empty}>
          No scores yet. Be the first to set the pace!
        </p>
      )}

      {!!entries.length && (
        <div className={styles.list}>
          {entries.map((entry) => (
            <div
              key={entry.playerId}
              className={`${styles.row} ${entry.rank <= 3 ? styles.topThree : ''}`}
            >
              <div className={styles.rank}>{entry.rank}</div>
              <div className={styles.info}>
                <div className={styles.name}>{entry.displayName}</div>
                <div className={styles.meta}>
                  {entry.correctAnswers} / {entry.totalQuestions} ({entry.accuracyPct}%)
                </div>
              </div>
              <div className={styles.scoreWrap}>
                <div className={styles.score}>{entry.score} pts</div>
                <div className={styles.pct}>{formatTime(entry.totalTimeMs)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
