import { useEffect, useMemo, useState } from 'react'
import styles from './Leaderboard.module.css'
import { getDateKey, getWeekKey, listenToDailyLeaderboard, listenToWeeklyLeaderboard } from '../lib/dailyChallenge'

function formatTime(totalTimeMs) {
  if (!totalTimeMs && totalTimeMs !== 0) return '--'
  const seconds = (totalTimeMs / 1000).toFixed(1)
  return `${seconds}s`
}

export default function DailyLeaderboard({ sport, onBack, highlightPlayerId }) {
  const [activeTab, setActiveTab] = useState('daily')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dateKey = useMemo(() => getDateKey(), [])
  const weekKey = useMemo(() => getWeekKey(), [])
  const isBasketball = sport === 'basketball'

  useEffect(() => {
    setLoading(true)
    setError(null)
    setEntries([])

    const unsubscribe = activeTab === 'daily'
      ? listenToDailyLeaderboard(
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
      : listenToWeeklyLeaderboard(
          { weekKey, sport },
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
  }, [dateKey, weekKey, sport, activeTab])

  const tabActiveStyle = { background: 'var(--green)', color: 'var(--pitch)' }
  const tabInactiveStyle = { background: 'rgba(255,255,255,0.03)', color: 'var(--muted)' }

  return (
    <div className={styles.wrap}>
<button className={styles.backBtn} onClick={onBack}>Back</button>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'daily' ? styles.tabActive : ''}`}
          style={activeTab === 'daily' ? tabActiveStyle : tabInactiveStyle}
          onClick={() => setActiveTab('daily')}
        >
          Daily
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'weekly' ? styles.tabActive : ''}`}
          style={activeTab === 'weekly' ? tabActiveStyle : tabInactiveStyle}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </button>
      </div>

      <p className={styles.kicker}>{activeTab === 'daily' ? 'Daily Challenge' : 'Weekly Challenge'}</p>
      <h1 className={styles.title}>
        {isBasketball ? 'Basketball' : 'Football'} leaderboard
      </h1>
      <p className={styles.date}>
        {activeTab === 'daily'
          ? dateKey
          : `Week ${weekKey.split('-W')[1]}, ${weekKey.split('-')[0]}`}
      </p>

      {loading && (
        <p className={styles.loading}>
          Loading {activeTab === 'daily' ? "today's" : "this week's"} board...
        </p>
      )}
      {error && <p className={styles.empty}>{error}</p>}
      {!loading && !error && !entries.length && (
        <p className={styles.empty}>
          No scores yet.{' '}
          {activeTab === 'daily'
            ? 'The first player on the board sets the pace.'
            : 'Be the first to set the pace this week!'}
        </p>
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
                  {activeTab === 'daily'
                    ? `${entry.score}/${entry.totalQuestions} correct`
                    : `${entry.score} pts · ${entry.daysPlayed} day${entry.daysPlayed === 1 ? '' : 's'} played`}
                </div>
              </div>
              <div className={styles.scoreWrap}>
                <div className={styles.score}>{entry.accuracyPct}%</div>
                {activeTab === 'daily' && (
                  <div className={styles.pct}>{formatTime(entry.totalTimeMs)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}