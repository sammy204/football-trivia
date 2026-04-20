import { useEffect, useMemo, useState } from 'react'
import styles from './Leaderboard.module.css'
import { getDateKey, listenToDailyLeaderboard } from '../lib/dailyChallenge'

function formatTime(totalTimeMs) {
  if (!totalTimeMs && totalTimeMs !== 0) return '--'
  const seconds = (totalTimeMs / 1000).toFixed(1)
  return `${seconds}s`
}

export default function DailyLeaderboard({ sport, onBack, highlightPlayerId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dateKey = useMemo(() => getDateKey(), [])
  const isBasketball = sport === 'basketball'

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = listenToDailyLeaderboard(
      { dateKey, sport },
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
  }, [dateKey, sport])

  return (
    <div className={styles.wrap}>
      <button className={styles.back} onClick={onBack}>
        Back
      </button>

      <p className={styles.kicker}>Daily Challenge</p>
      <h1 className={styles.title}>
        {isBasketball ? 'Basketball' : 'Football'} leaderboard
      </h1>
      <p className={styles.date}>{dateKey}</p>

      {loading && <p className={styles.loading}>Loading today&apos;s board...</p>}
      {error && <p className={styles.empty}>{error}</p>}
      {!loading && !entries.length && (
        <p className={styles.empty}>No scores yet. The first player on the board sets the pace.</p>
      )}

      {!!entries.length && (
        <div className={styles.list}>
          {entries.map((entry) => (
            <div
              key={entry.playerId}
              className={`${styles.row} ${entry.rank <= 3 ? styles.topThree : ''} ${entry.playerId === highlightPlayerId ? styles.highlight : ''}`}
            >
              <div className={styles.rank}>{entry.rank}</div>
              <div className={styles.info}>
                <div className={styles.name}>{entry.displayName}</div>
                <div className={styles.meta}>
                  {entry.score}/{entry.totalQuestions} correct
                </div>
              </div>
              <div className={styles.scoreWrap}>
                <div className={styles.score}>{entry.accuracyPct}%</div>
                <div className={styles.pct}>{formatTime(entry.totalTimeMs)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
