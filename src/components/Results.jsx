import { useState } from 'react'
import styles from './Results.module.css'

export default function Results({ scores, history, config, onHome, onPlayAgain }) {
  const { players, mode, totalQuestions } = config
  const [showReview, setShowReview] = useState(false)

  const winner = mode === 'multi'
    ? players[scores.indexOf(Math.max(...scores))]
    : null

  const pct = Math.round((scores[0] / totalQuestions) * 100)

  function getMessage() {
    if (mode === 'multi') return `${winner} wins!`
    if (pct === 100) return 'Perfect score!'
    if (pct >= 80) return 'Outstanding!'
    if (pct >= 60) return 'Solid performance!'
    if (pct >= 40) return 'Room to improve.'
    return 'Back to training!'
  }

  function renderPlayerStats(idx) {
    const correct = scores[idx]
    const wrong = totalQuestions - correct
    return `${correct} right · ${wrong} wrong`
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topLabel}>Full time</div>
      <h1 className={styles.message}>{getMessage()}</h1>

      {mode === 'solo' ? (
        <div className={styles.scoreBig}>
          <span className={styles.scoreNum}>{scores[0]}</span>
          <span className={styles.scoreOf}>/ {totalQuestions}</span>
        </div>
      ) : (
        <div className={styles.multiScores}>
          {players.map((p, i) => (
            <div key={i} className={`${styles.scoreRow} ${i === scores.indexOf(Math.max(...scores)) ? styles.winner : ''}`}>
              <div className={styles.playerName}>
                {i === scores.indexOf(Math.max(...scores)) && <span className={styles.crown}>★</span>}
                {p}
              </div>
              <div className={styles.playerScore}>{scores[i]}/{totalQuestions}</div>
              <div className={styles.playerPct}>{Math.round((scores[i] / totalQuestions) * 100)}%</div>
              <div className={styles.playerSub}>{renderPlayerStats(i)}</div>
            </div>
          ))}
        </div>
      )}

      {mode === 'solo' && (
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <p className={styles.statVal}>{pct}%</p>
            <p className={styles.statLabel}>Accuracy</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statVal}>{scores[0]}</p>
            <p className={styles.statLabel}>Correct</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statVal}>{totalQuestions - scores[0]}</p>
            <p className={styles.statLabel}>Wrong</p>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button className={styles.ghostBtn} onClick={() => setShowReview(prev => !prev)}>
          {showReview ? 'Hide review' : 'Review answers'}
        </button>
      </div>

      {showReview && (
        <div className={styles.review} style={{ marginTop: 14 }}>
          <h2 className={styles.subheading}>Answer review</h2>
          {(history && history.length) ? history.map((item, idx) => (
            <div key={idx} className={styles.reviewRow} style={{ marginBottom: 10, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
              <div><strong>Q{idx + 1} ({item.player})</strong>: {item.question}</div>
              <div>Given: {item.selected || 'No answer'}</div>
              <div>Correct: {item.correctAnswer}</div>
              <div>Result: {item.isCorrect ? 'Correct' : 'Wrong'}</div>
              <div style={{ color: '#555' }}>Explanation: {item.explanation}</div>
            </div>
          )) : <p>No answer history available.</p>}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.ghostBtn} onClick={onHome}>Home</button>
        <button className={styles.mainBtn} onClick={onPlayAgain}>Play again →</button>
      </div>
    </div>
  )
}
