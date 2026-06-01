import { useState, useEffect, useRef } from 'react'
import { getCommonLinkQuestions, saveCommonLinkLeaderboard } from '../lib/commonLink'
import CommonLinkResults from './CommonLinkResults'
import styles from './MainTabs.module.css'

const QUESTION_TIME = 20

function SportPicker({ sport, onSportChange }) {
  return (
    <div className={styles.sportGrid}>
      {[
        { id: 'football', label: 'Football', icon: '⚽' },
        { id: 'basketball', label: 'Basketball', icon: '🏀' },
      ].map(item => (
        <button
          key={item.id}
          type="button"
          className={`${styles.sportButton} ${sport === item.id ? styles.active : ''}`}
          onClick={() => onSportChange(item.id)}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  )
}

// ─── Lobby ────────────────────────────────────────────────────────────────────
function Lobby({ sport, onSportChange, onStart, onBack }) {
  const [rounds, setRounds] = useState(10)

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} type="button" onClick={onBack}>Back</button>
      <h1 className={styles.heroTitle}>COMMON LINK</h1>
      <p className={styles.muted} style={{ marginBottom: 4 }}>
        Three players are shown. Guess who played with all of them.
      </p>

      <SportPicker sport={sport} onSportChange={onSportChange} />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Rounds</h2>
        </div>
        <div className={styles.roundGrid}>
          {[5, 10, 15].map(v => (
            <button
              key={v}
              type="button"
              className={`${styles.roundButton} ${rounds === v ? styles.active : ''}`}
              onClick={() => setRounds(v)}
            >
              {v} Q
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <button className={styles.dailyBtn} type="button" onClick={() => onStart({ rounds, sport })}>
          Start Game
        </button>
      </div>
    </div>
  )
}

// ─── Game ─────────────────────────────────────────────────────────────────────
function Game({ questions, onFinish, onBack }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [flash, setFlash] = useState(null)
  const timerRef = useRef(null)
  const advanceRef = useRef(null)

  const question = questions[index]
  const total = questions.length
  const timerPct = (timeLeft / QUESTION_TIME) * 100
  const timerColor = timeLeft <= 5 ? '#ff5c5c' : timeLeft <= 10 ? '#FFD700' : 'var(--green)'

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(advanceRef.current)
    }
  }, [])

  useEffect(() => {
    setTimeLeft(QUESTION_TIME)
    setSelected(null)
    setFlash(null)
    clearInterval(timerRef.current)
    clearTimeout(advanceRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleAutoAdvance(null)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(advanceRef.current)
    }
  }, [index])

  function handleAutoAdvance(chosenOpt) {
    clearInterval(timerRef.current)
    setFlash(true)

    advanceRef.current = setTimeout(() => {
      const correct = chosenOpt !== null && chosenOpt === question.answer
      const newAnswers = [...answers, { question, selected: chosenOpt, correct }]
      if (index + 1 >= total) {
        onFinish(newAnswers)
      } else {
        setAnswers(newAnswers)
        setIndex(i => i + 1)
      }
    }, 250)
  }

  function handleSelect(opt) {
    if (selected !== null || flash !== null) return
    setSelected(opt)
    handleAutoAdvance(opt)
  }

  if (!question) return null

  const players = question.players || []

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} type="button" onClick={onBack}>Back</button>
      <div style={{ marginBottom: 16 }}>
        <div className={styles.sectionHeader}>
          <span className={styles.muted}>Question {index + 1} of {total}</span>
          <span style={{ color: timerColor, fontWeight: 900, fontSize: 16 }}>{timeLeft}s</span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${timerPct}%`, borderRadius: 99,
            background: timerColor,
            transition: 'width 1s linear, background 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{
        padding: '1rem', borderRadius: 18, marginBottom: 4,
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
      }}>
        <div className={styles.dailyBadge}>Common Link</div>
        <p className={styles.muted} style={{ marginTop: 10, marginBottom: 14 }}>
          Who has played with all three of these players?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {players.map((player, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'color-mix(in srgb, var(--green) 14%, transparent)',
                display: 'grid', placeItems: 'center',
                color: 'var(--green)', fontWeight: 900, fontSize: 14,
              }}>
                {i + 1}
              </div>
              <span style={{ color: 'var(--white)', fontWeight: 700, fontSize: 15 }}>{player}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Who is the common link?</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['a', 'b', 'c', 'd'].map(opt => {
            let bg = 'rgba(255,255,255,0.04)'
            let border = 'var(--card-border)'
            let color = 'var(--white)'
            let opacity = 1

            if (flash) {
              if (opt === selected) {
                bg = 'rgba(255,255,255,0.10)'
                border = 'rgba(255,255,255,0.3)'
              } else {
                opacity = 0.35
              }
            }

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                disabled={!!flash}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: bg, color, fontWeight: 700, fontSize: 14,
                  textAlign: 'left', transition: 'all 160ms ease',
                  cursor: flash ? 'default' : 'pointer',
                  opacity,
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${border}`,
                  display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900,
                }}>
                  {opt.toUpperCase()}
                </span>
                {question.options?.[opt]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CommonLink({ user, profile, sport: initialSport = 'football', onSportChange, onExit, onGameFinish, coinReward, coinBalance }) {
  const [screen, setScreen] = useState('lobby')
  const [sport, setSport] = useState(initialSport)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setSport(initialSport)
  }, [initialSport])

  function handleSportChange(nextSport) {
    setSport(nextSport)
    onSportChange?.(nextSport)
  }

  async function handleStart({ rounds, sport: selectedSport }) {
    setSport(selectedSport)
    setLoading(true)
    setError(null)
    try {
      const qs = await getCommonLinkQuestions({ sport: selectedSport, count: rounds })
      if (!qs.length) {
        setError('No questions available for this sport yet. Add some in Admin → Common Link.')
        setLoading(false)
        return
      }
      setQuestions(qs)
      setScreen('game')
    } catch (e) {
      setError('Failed to load questions. Please try again.')
    }
    setLoading(false)
  }

  async function handleFinish(ans) {
    setAnswers(ans)
    const correct = ans.filter(a => a.correct).length
    const total = ans.length
    const playerId = profile?.playerId || user?.uid
    const displayName = profile?.displayName || user?.displayName || 'Player'

    if (playerId) {
      saveCommonLinkLeaderboard({
        sport,
        playerId,
        displayName,
        score: correct,
        totalQuestions: total,
      }).catch(() => {})
    }

    if (onGameFinish) {
      onGameFinish({ score: correct, totalQuestions: total, sport })
    }
    setScreen('results')
  }

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
        <p className={styles.muted}>Loading questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.muted} style={{ color: '#ff5c5c', marginBottom: 16 }}>{error}</p>
        <button className={styles.ghostButton} type="button" onClick={onExit}>Go Back</button>
      </div>
    )
  }

  if (screen === 'lobby') return <Lobby sport={sport} onSportChange={handleSportChange} onStart={handleStart} onBack={onExit} />
  if (screen === 'game') return <Game questions={questions} onFinish={handleFinish} onBack={onExit} />
  if (screen === 'results') return (
    <CommonLinkResults
      answers={answers}
      sport={sport}
      user={user}
      profile={profile}
      onPlay={() => setScreen('lobby')}
      onExit={onExit}
      coinReward={coinReward}
      coinBalance={coinBalance}
    />
  )
  return null
}
