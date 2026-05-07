import { useMemo, useState, useEffect } from 'react'
import styles from './Results.module.css'
import { perfectScoreConfetti } from '../lib/confetti'

function formatTime(totalTimeMs) {
  if (!totalTimeMs && totalTimeMs !== 0) return '--'
  return `${(totalTimeMs / 1000).toFixed(1)}s`
}

export default function Results({
  scores,
  history,
  config,
  resultMeta,
  profile,
  saveState,
  onSaveDailyScore,
  onViewDailyLeaderboard,
  onHome,
  onPlayAgain,
  user,
}) {
  const { mode, totalQuestions } = config
  const [showReview, setShowReview] = useState(false)
  const [displayName, setDisplayName] = useState(
    user?.displayName || profile?.displayName || ''
  )
  const isDaily = mode === 'daily'

  const pct = Math.round((scores[0] / totalQuestions) * 100)
  const averageTime = useMemo(() => {
    if (!resultMeta?.totalTimeMs || !totalQuestions) return '--'
    return `${(resultMeta.totalTimeMs / totalQuestions / 1000).toFixed(1)}s`
  }, [resultMeta, totalQuestions])

  // Auto-save if user is logged in
  useEffect(() => {
    if (isDaily && user?.displayName && saveState.status === 'idle') {
      onSaveDailyScore(user.displayName)
    }
  }, [isDaily, user])

  // Trigger confetti on any perfect score (5/5, 10/10, 15/15, etc)
  useEffect(() => {
    if (scores[0] === totalQuestions && totalQuestions > 0) {
      perfectScoreConfetti()
    }
  }, [scores, totalQuestions])

  function getMessage() {
    if (isDaily && pct === 100) return 'Daily domination!'
    if (pct === 100) return 'Perfect score!'
    if (pct >= 80) return 'Outstanding!'
    if (pct >= 60) return 'Solid performance!'
    if (pct >= 40) return 'Room to improve.'
    return 'Back to training!'
  }

  function handleSave() {
    onSaveDailyScore(displayName)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topLabel}>{isDaily ? 'Daily challenge' : 'Full time'}</div>
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
          <p className={styles.statVal}>{formatTime(resultMeta?.totalTimeMs)}</p>
          <p className={styles.statLabel}>Total time</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statVal}>{averageTime}</p>
          <p className={styles.statLabel}>Avg answer</p>
        </div>
      </div>

      {isDaily && (
        <div className={styles.dailyPanel}>
          <div className={styles.dailyHeader}>
            <div>
              <p className={styles.dailyKicker}>Leaderboard</p>
              <h2 className={styles.dailyTitle}>
                {saveState.status === 'saved' ? 'Score saved ✓' : saveState.status === 'saving' ? 'Saving...' : "Save today's run"}
              </h2>
            </div>
            <button className={styles.dailyGhost} onClick={onViewDailyLeaderboard}>
              View board
            </button>
          </div>

          {/* Only show manual save if not logged in */}
          {!user?.displayName && (
            <>
              <p className={styles.dailyCopy}>
                Enter a display name to appear on today's {config.sport} leaderboard.
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
                  disabled={saveState.status === 'saving' || !displayName.trim()}
                >
                  {saveState.status === 'saving' ? 'Saving...' : saveState.status === 'saved' ? 'Saved' : 'Save score'}
                </button>
              </div>
            </>
          )}

          {saveState.status === 'saved' && (
            <p className={styles.saveMessage}>
              You're currently #{saveState.rank} on today's board.
            </p>
          )}

          {saveState.status === 'error' && (
            <p className={styles.saveError}>Saving failed. Try again in a moment.</p>
          )}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button className={styles.ghostBtn} onClick={() => setShowReview((prev) => !prev)}>
          {showReview ? 'Hide review' : 'Review answers'}
        </button>
      </div>

      {showReview && (
        <div className={styles.review} style={{ marginTop: 14 }}>
          <h2 className={styles.subheading}>Answer review</h2>
          {history?.length ? history.map((item, index) => (
            <div key={`${item.question}-${index}`} className={styles.reviewRow}>
              <div><strong>Q{index + 1} ({item.player})</strong>: {item.question}</div>
              <div>Given: {item.selected || 'No answer'}</div>
              <div>Correct: {item.correctAnswer}</div>
              <div>Result: {item.isCorrect ? 'Correct' : 'Wrong'}</div>
              <div className={styles.reviewExplanation}>Explanation: {item.explanation}</div>
            </div>
          )) : <p>No answer history available.</p>}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.ghostBtn} onClick={onHome}>Home</button>
        {!isDaily && (
          <button className={styles.mainBtn} onClick={onPlayAgain}>
            Play again →
          </button>
        )}
      </div>
    </div>
  )
}