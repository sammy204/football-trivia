import { useState, useEffect } from 'react'
import { listenToCommonLinkLeaderboard, getDateKey } from '../lib/commonLink'
import { perfectScoreConfetti } from '../lib/confetti'
import styles from './Results.module.css'

function formatTime(totalTimeMs) {
  if (!totalTimeMs && totalTimeMs !== 0) return '--'
  return `${(totalTimeMs / 1000).toFixed(1)}s`
}

export default function CommonLinkResults({ answers, sport, user, profile, onPlay, onExit, coinReward, coinBalance }) {
  const [showReview, setShowReview] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const correct = answers.filter(a => a.correct).length
  const total = answers.length
  const pct = Math.round((correct / total) * 100)
  const dateKey = getDateKey()
  const myId = profile?.playerId || user?.uid

  useEffect(() => {
    if (correct === total && total > 0) perfectScoreConfetti()
  }, [])

  useEffect(() => {
    const unsub = listenToCommonLinkLeaderboard({ sport, dateKey }, setLeaderboard, console.error)
    return unsub
  }, [sport, dateKey])

  function getMessage() {
    if (pct === 100) return 'Perfect score!'
    if (pct >= 80) return 'Outstanding!'
    if (pct >= 60) return 'Solid performance!'
    if (pct >= 40) return 'Room to improve.'
    return 'Back to training!'
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topLabel}>Common Link</div>
      <h1 className={styles.message}>{getMessage()}</h1>

      <div className={styles.scoreBig}>
        <span className={styles.scoreNum}>{correct}</span>
        <span className={styles.scoreOf}>/ {total}</span>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <p className={styles.statVal}>{pct}%</p>
          <p className={styles.statLabel}>Accuracy</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statVal}>{correct}</p>
          <p className={styles.statLabel}>Correct</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statVal}>{total - correct}</p>
          <p className={styles.statLabel}>Wrong</p>
        </div>
      </div>

      {coinReward && (
        <div className={styles.coinPanel}>
          <div>
            <p className={styles.coinKicker}>{coinReward.label || 'Coins earned'}</p>
            <p className={styles.coinAmount}>{coinReward.amount > 0 ? `+${coinReward.amount}` : '0'}</p>
          </div>
          <div className={styles.coinBalance}>
            <span>Balance</span>
            <strong>{coinBalance}</strong>
          </div>
          {coinReward.detail && <p className={styles.coinDetail}>{coinReward.detail}</p>}
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2 className={styles.subheading}>Today's Board</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {leaderboard.slice(0, 10).map(entry => (
              <div
                key={entry.playerId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--card-border)',
                  background: entry.playerId === myId
                    ? 'color-mix(in srgb, var(--green) 10%, transparent)'
                    : 'rgba(255,255,255,0.03)',
                }}
              >
                <span style={{ color: 'var(--muted)', fontWeight: 900, textAlign: 'center', fontSize: 13 }}>{entry.rank}</span>
                <div>
                  <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: 14 }}>{entry.displayName || 'Player'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{entry.score}/{entry.totalQuestions} correct · {entry.accuracyPct}%</div>
                </div>
                <span style={{ color: 'var(--green)', fontWeight: 900, fontSize: 13 }}>{entry.score}pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button className={styles.ghostBtn} onClick={() => setShowReview(v => !v)}>
          {showReview ? 'Hide review' : 'Review answers'}
        </button>
      </div>

      {showReview && (
        <div className={styles.review} style={{ marginTop: 14 }}>
          <h2 className={styles.subheading}>Answer review</h2>
          {answers.map((a, i) => (
            <div key={i} className={styles.reviewRow}>
              <div><strong>Q{i + 1}</strong>: {a.question.players?.join(' · ')}</div>
              <div>Given: {a.selected ? a.question.options?.[a.selected] : 'No answer'}</div>
              <div>Correct: {a.question.options?.[a.question.answer]}</div>
              <div>Result: {a.correct ? '✓ Correct' : '✗ Wrong'}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.ghostBtn} onClick={onExit}>Home</button>
        <button className={styles.mainBtn} onClick={onPlay}>Play again →</button>
      </div>
    </div>
  )
}