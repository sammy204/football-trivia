import { useState } from 'react'
import styles from './LightningResults.module.css'

export default function LightningResults({
  scores,
  history,
  config,
  onHome,
  onPlayAgain,
  onViewLeaderboard,
  opponentName,
  isWin,
  isDraw,
}) {
  const { sport, totalQuestions } = config
  const [showReview, setShowReview] = useState(false)

  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'

  const correctCount = history.filter(item => item.isCorrect).length
  const answeredCount = history.length
  const pct = Math.round((correctCount / totalQuestions) * 100)
  const isH2H = opponentName !== undefined

  function getMessage() {
    if (isH2H && isWin) return '⚡ Victory!'
    if (isH2H && isDraw) return "🤝 It's a draw!"
    if (isH2H) return '💔 Better luck next time'
    if (pct === 100) return '⚡ Perfect lightning!'
    if (pct >= 80) return 'Outstanding!'
    if (pct >= 60) return 'Solid performance!'
    if (pct >= 40) return 'Room to improve.'
    return 'Back to training!'
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topLabel}>{isH2H ? 'Lightning H2H' : 'Lightning Rush'}</div>
      <h1 className={styles.message}>{getMessage()}</h1>

      {isH2H ? (
        <div className={styles.scoreBig}>
          <span className={styles.scoreLabel}>Your score</span>
          <span className={styles.scoreNum}>{scores[0]}</span>
          <span className={styles.scoreVs}>vs</span>
          <span className={styles.scoreLabel}>{opponentName}</span>
          <span className={styles.scoreNum}>{scores[1]}</span>
        </div>
      ) : (
        <div className={styles.scoreBig}>
          <span className={styles.scoreNum}>{correctCount}</span>
          <span className={styles.scoreOf}>/ {totalQuestions} correct</span>
        </div>
      )}

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <p className={styles.statVal}>{pct}%</p>
          <p className={styles.statLabel}>Accuracy</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statVal}>{answeredCount}</p>
          <p className={styles.statLabel}>Questions answered</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statVal}>{correctCount}</p>
          <p className={styles.statLabel}>Correct answers</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.ghostBtn} onClick={onHome}>Home</button>
        <button
          className={styles.mainBtn}
          style={{ background: accent, color: isBasketball ? '#fff' : '#0a1f0f' }}
          onClick={onPlayAgain}
        >
          Play again →
        </button>
      </div>

      <div className={styles.leaderboardRow}>
        <button className={styles.leaderboardBtn} onClick={onViewLeaderboard}>
          🏆 View Lightning Leaderboard
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className={styles.ghostBtn} onClick={() => setShowReview(v => !v)}>
          {showReview ? 'Hide review' : 'Review answers'}
        </button>
      </div>

      {showReview && (
        <div className={styles.review} style={{ marginTop: 14 }}>
          <h2 className={styles.subheading}>Answer review</h2>
          {history?.length ? history.map((item, index) => (
            <div key={index} className={styles.reviewRow}>
              <div><strong>Q{index + 1}</strong>: {item.question}</div>
              <div>Given: {item.selected || 'No answer'}</div>
              <div>Correct: {item.correctAnswer}</div>
              <div style={{ color: item.isCorrect ? accent : '#FF5C5C' }}>
                Result: {item.isCorrect ? 'Correct' : 'Wrong'}
              </div>
              <div className={styles.reviewExplanation}>Explanation: {item.explanation}</div>
            </div>
          )) : <p>No answer history available.</p>}
        </div>
      )}
    </div>
  )
}
