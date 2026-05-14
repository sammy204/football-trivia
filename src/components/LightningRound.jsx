import { useState, useEffect, useRef } from 'react'
import styles from './LightningRound.module.css'

const TIMER_SECS = 60

export default function LightningRound({ questions, onFinish, sport }) {
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS)
  const [history, setHistory] = useState([])
  const [totalTimeMs, setTotalTimeMs] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  const timerRef = useRef(null)
  const startedAtRef = useRef(Date.now())
  const answeredRef = useRef(false)
  const historyRef = useRef([])
  const totalTimeMsRef = useRef(0)
  const correctCountRef = useRef(0)
  const finishedRef = useRef(false)

  const q = questions[qIndex]

  if (!q) return null

  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'

  // Reset per-question state
  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    answeredRef.current = false
    startedAtRef.current = Date.now()
  }, [qIndex])

  // Timer countdown (runs continuously; not tied to question changes)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current)
          if (!finishedRef.current) {
            finishedRef.current = true
            onFinish({
              scores: [correctCountRef.current],
              history: historyRef.current,
              totalTimeMs: totalTimeMsRef.current,
              totalQuestions: historyRef.current.length,
            })
          }
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [onFinish])

  function buildEntry(choice, isCorrect, elapsedMs) {
    const currentQ = questions[qIndex]
    return {
      question: currentQ.question,
      selected: choice,
      correctAnswer: currentQ.answer,
      isCorrect,
      explanation: currentQ.explanation,
      elapsedMs,
    }
  }

  function answerQuestion(choice) {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    setSelected(choice)

    const currentQ = questions[qIndex]
    const correct = choice === currentQ.answer
    const elapsedMs = Date.now() - startedAtRef.current

    const entry = buildEntry(choice, correct, elapsedMs)
    const newHistory = [...historyRef.current, entry]
    historyRef.current = newHistory
    setHistory(newHistory)

    totalTimeMsRef.current += elapsedMs
    setTotalTimeMs(totalTimeMsRef.current)

    if (correct) {
      correctCountRef.current++
      setCorrectCount(correctCountRef.current)
    }

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        // Exhausted all questions — finish now
        if (!finishedRef.current) {
          finishedRef.current = true
          onFinish({
            scores: [correctCountRef.current],
            history: historyRef.current,
            totalTimeMs: totalTimeMsRef.current,
            totalQuestions: historyRef.current.length,
          })
        }
      } else {
        setQIndex(qIndex + 1)
      }
    }, 120)
  }

  const progressPct = ((TIMER_SECS - timeLeft) / TIMER_SECS) * 100

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.pill}>⚡ Lightning Round</div>
        <div className={styles.timerDisplay}>
          <span className={styles.timeLeft}>{timeLeft}s</span>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{correctCountRef.current}</span>
          <span className={styles.statLabel}>Correct</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{qIndex}</span>
          <span className={styles.statLabel}>Attempted</span>
        </div>
      </div>

      <div className={styles.questionCard}>
        <p className={styles.question}>{q.question}</p>
      </div>

      <div className={styles.options}>
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={styles.option}
            onClick={() => answerQuestion(opt)}
            disabled={answered}
          >
            <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
