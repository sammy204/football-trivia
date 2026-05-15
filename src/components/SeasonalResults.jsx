import { useMemo, useState, useEffect } from 'react'
import styles from './Results.module.css'
import { perfectScoreConfetti } from '../lib/confetti'
import {
  saveSeasonalLeaderboardEntry,
  listenToSeasonalLeaderboard,
} from '../lib/seasonalEvents'

function formatTime(totalTimeMs) {
  if (!totalTimeMs && totalTimeMs !== 0) return '--'
  return `${(totalTimeMs / 1000).toFixed(1)}s`
}

export default function SeasonalResults({
  scores,
  history,
  eventId,
  eventName,
  profile,
  onHome,
  onPlayAgain,
  user,
}) {
  const totalQuestions = history?.length || 0
  const [displayName, setDisplayName] = useState(
    user?.displayName || profile?.displayName || ''
  )
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [userRank, setUserRank] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])
  const [showReview, setShowReview] = useState(false)
  const [totalTimeMs, setTotalTimeMs] = useState(
    history?.reduce((sum, h) => sum + (h.elapsedMs || 0), 0) || 0
  )

  const pct = totalQuestions > 0 ? Math.round((scores[0] / totalQuestions) * 100) : 0
  const averageTime = useMemo(() => {
    if (!totalTimeMs || !totalQuestions) return '--'
    return `${(totalTimeMs / totalQuestions / 1000).toFixed(1)}s`
  }, [totalTimeMs, totalQuestions])

  // Listen to seasonal leaderboard in real-time
  useEffect(() => {
    if (!eventId) return
    const unsubscribe = listenToSeasonalLeaderboard(eventId, (entries) => {
      setLeaderboardData(entries)
    })
    return () => unsubscribe()
  }, [eventId])

  // Auto-save if user is logged in
  useEffect(() => {
    if (user?.uid && user?.displayName && saveState === 'idle') {
      handleSave()
    }
  }, [user?.uid, user?.displayName])

  // Trigger confetti on perfect score
  useEffect(() => {
    if (scores[0] === totalQuestions && totalQuestions > 0) {
      perfectScoreConfetti()
    }
  }, [scores, totalQuestions])

  async function handleSave() {
    if (!displayName.trim() || !user?.uid) {
      setSaveState('error')
      return
    }

    setSaveState('saving')
    try {
      const saved = await saveSeasonalLeaderboardEntry({
        eventId,
        playerId: user.uid,
        displayName: displayName.trim(),
        score: scores[0],
        totalQuestions,
        totalTimeMs,
      })

      setUserRank(saved.rank || null)
      setSaveState('saved')
    } catch (err) {
      console.error('Failed to save seasonal score:', err)
      setSaveState('error')
    }
  }

  function getMessage() {
    if (pct === 100) return 'Perfect score!'
    if (pct >= 80) return 'Outstanding!'
    if (pct >= 60) return 'Solid performance!'
    if (pct >= 40) return 'Room to improve.'
    return 'Back to training!'
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topLabel}>{eventName || 'Seasonal event'}</div>
      <h1 className={styles.message}>{getMessage()}</h1>

      <div className={styles.scoreBig}>
        <span className={styles.scoreNum}>{scores[0]}</span>
        <span className={styles.scoreOf}>/ {totalQuestions}</span>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <p className={styles.statVal}>{pct}%</p>
          <p className={styles.statLabel}>Accuracy</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statVal}>{formatTime(totalTimeMs)}</p>
          <p className={styles.statLabel}>Total time</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statVal}>{averageTime}</p>
          <p className={styles.statLabel}>Avg answer</p>
        </div>
      </div>

      {/* Seasonal leaderboard panel */}
      <div className={styles.dailyPanel}>
        <div className={styles.dailyHeader}>
          <div>
            <p className={styles.dailyKicker}>Leaderboard</p>
            <h2 className={styles.dailyTitle}>
              {saveState === 'saved'
                ? 'Score saved ✓'
                : saveState === 'saving'
                ? 'Saving...'
                : 'Save to leaderboard'}
            </h2>
          </div>
        </div>

        {/* Manual save for guests */}
        {!user?.uid && (
          <>
            <p className={styles.dailyCopy}>
              Enter a display name to appear on the {eventName} leaderboard.
            </p>
            <div className={styles.saveRow}>
              <input
                className={styles.nameInput}
                placeholder="Choose a display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saveState === 'saving' || !displayName.trim()}
              >
                {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save score'}
              </button>
            </div>
          </>
        )}

        {saveState === 'saved' && userRank && (
          <p className={styles.saveMessage}>
            You're currently #{userRank} on the {eventName} leaderboard.
          </p>
        )}

        {saveState === 'saved' && !userRank && (
          <p className={styles.saveMessage}>
            Your score has been saved to the leaderboard!
          </p>
        )}

        {saveState === 'error' && (
          <p className={styles.saveError}>Saving failed. Try again in a moment.</p>
        )}

        {/* Leaderboard preview */}
        {leaderboardData.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Top scores</p>
            {leaderboardData.slice(0, 3).map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  fontSize: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ color: '#ccc' }}>
                  #{idx + 1} {entry.displayName}
                </span>
                <span style={{ color: '#00ff87', fontWeight: 600 }}>{entry.totalScore} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <button className={styles.ghostBtn} onClick={() => setShowReview((prev) => !prev)}>
          {showReview ? 'Hide review' : 'Review answers'}
        </button>
      </div>

      {showReview && (
        <div className={styles.review} style={{ marginTop: 14 }}>
          <h2 className={styles.subheading}>Answer review</h2>
          {history?.length ? (
            history.map((item, index) => (
              <div key={`${item.question}-${index}`} className={styles.reviewRow}>
                <div>
                  <strong>Q{index + 1}</strong>: {item.question}
                </div>
                <div>Given: {item.selected || 'No answer'}</div>
                <div>Correct: {item.correctAnswer}</div>
                <div>Result: {item.isCorrect ? 'Correct' : 'Wrong'}</div>
                <div className={styles.reviewExplanation}>
                  Explanation: {item.explanation}
                </div>
              </div>
            ))
          ) : (
            <p>No answer history available.</p>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.ghostBtn} onClick={onHome}>
          Home
        </button>
        <button className={styles.mainBtn} onClick={onPlayAgain}>
          Play again →
        </button>
      </div>
    </div>
  )
}
