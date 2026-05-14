import { useState, useEffect, useRef } from 'react'
import styles from './LightningRoundH2H.module.css'

const TIMER_SECS = 10

export default function LightningRoundH2H({ questions, onFinish, sport }) {
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS)
  const [history, setHistory] = useState([])
  const [totalTimeMs, setTotalTimeMs] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)

  const timerRef = useRef(null)
  const startedAtRef = useRef(Date.now())
  const answeredRef = useRef(false)
  const historyRef = useRef([])
  const totalTimeMsRef = useRef(0)
  const playerScoreRef = useRef(0)
  const qIndexRef = useRef(0)

  const q = questions[qIndex]
  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'
  const accentText = isBasketball ? '#fff' : '#0a1f0f'

  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    answeredRef.current = false
    setTimeLeft(TIMER_SECS)
    startedAtRef.current = Date.now()
  }, [qIndex])

  useEffect(() => {
    if (answered) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleNoAnswer()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [answered, qIndex])

  function buildEntry(choice, isCorrect) {
    const elapsedMs = Date.now() - startedAtRef.current
    const currentQ = questions[qIndexRef.current]
    return {
      question: currentQ.question,
      selected: choice,
      correctAnswer: currentQ.answer,
      isCorrect,
      explanation: currentQ.explanation,
      elapsedMs,
    }
  }

  function next(latestHistory, latestScore, latestTotalTimeMs) {
    const currentIndex = qIndexRef.current
    if (currentIndex + 1 >= questions.length) {
      onFinish({ scores: [latestScore], history: latestHistory, totalTimeMs: latestTotalTimeMs })
    } else {
      const nextIndex = currentIndex + 1
      qIndexRef.current = nextIndex
      setQIndex(nextIndex)
    }
  }

  function handleNoAnswer() {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    setSelected(null)
    const entry = buildEntry(null, false)
    const newHistory = [...historyRef.current, entry]
    historyRef.current = newHistory
    setHistory(newHistory)
    const nextTotalTimeMs = totalTimeMsRef.current + entry.elapsedMs
    totalTimeMsRef.current = nextTotalTimeMs
    setTotalTimeMs(nextTotalTimeMs)
    setTimeout(() => next(newHistory, playerScoreRef.current, nextTotalTimeMs), 250)
  }

  function answerQuestion(choice) {
    if (answeredRef.current) return
    answeredRef.current = true
    clearInterval(timerRef.current)
    setAnswered(true)
    setSelected(choice)

    const currentQ = questions[qIndexRef.current]
    const correct = choice === currentQ.answer
    const entry = buildEntry(choice, correct)
    const newHistory = [...historyRef.current, entry]
    historyRef.current = newHistory
    setHistory(newHistory)
    const nextTotalTimeMs = totalTimeMsRef.current + entry.elapsedMs
    totalTimeMsRef.current = nextTotalTimeMs
    setTotalTimeMs(nextTotalTimeMs)

    let newScores = playerScoreRef.current
    if (correct) {
      // Lightning scoring: base 100 + time bonus (max 100)
      const timeBonus = Math.max(0, Math.round((TIMER_SECS - entry.elapsedMs / 1000) * 10))
      newScores += 100 + timeBonus
      playerScoreRef.current = newScores
      setPlayerScore(newScores)
    } else {
      // Penalty for wrong answer
      newScores -= 50
      playerScoreRef.current = newScores
      setPlayerScore(newScores)
    }

    setTimeout(() => next(newHistory, newScores, nextTotalTimeMs), 400)
  }

  if (!q) return null

  const timerPct = (timeLeft / TIMER_SECS) * 100

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.pill}>⚡ Lightning Round</div>
      </div>

      <div className={styles.progress}>
        <span className={styles.qNum}>Q{qIndex + 1} / {questions.length}</span>
        <div className={styles.timerWrap}>
          <div className={styles.timerBar} style={{ width: timerPct + '%', background: timeLeft <= 3 ? '#FF5C5C' : accent }} />
        </div>
        <span className={styles.timerNum} style={{ color: timeLeft <= 3 ? '#FF5C5C' : accent }}>{timeLeft}s</span>
      </div>

      <div className={styles.scoreBar}>
        <span className={styles.scoreLabel}>Score</span>
        <span className={styles.scoreValue}>{playerScore.toLocaleString()}</span>
      </div>

      <div className={styles.questionCard}>
        <p className={styles.question}>{q.question}</p>
      </div>

      <div className={styles.options}>
        {q.options.map((opt, i) => {
          let cls = styles.option
          if (answered) {
            if (selected === opt) cls += ' ' + (opt === q.answer ? styles.correct : styles.wrong)
            else if (opt === q.answer) cls += ' ' + styles.correct
            else cls += ' ' + styles.dim
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => answerQuestion(opt)}
              disabled={answered}
              style={answered && selected === opt ? { borderColor: opt === q.answer ? accent : '#FF5C5C', background: opt === q.answer ? `${accent}22` : 'rgba(255, 92, 92, 0.1)' } : {}}
            >
              <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
