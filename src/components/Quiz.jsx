import { useState, useEffect, useRef } from 'react'
import styles from './Quiz.module.css'

const TIMER_SECS = 20

export default function Quiz({ questions, config, onFinish }) {
  const { mode, players } = config
  const [qIndex, setQIndex] = useState(0)
  const [playerScores, setPlayerScores] = useState((players || ['Player']).map(() => 0))
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS)
  const [history, setHistory] = useState([])
  const [totalTimeMs, setTotalTimeMs] = useState(0)
  const timerRef = useRef(null)
  const startedAtRef = useRef(Date.now())

  const q = questions[qIndex]
  const currentPlayer = (players || ['Player'])[0]

  useEffect(() => {
    setSelected(null)
    setAnswered(false)
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
    return {
      player: currentPlayer,
      question: q.question,
      selected: choice,
      correctAnswer: q.answer,
      isCorrect,
      explanation: q.explanation,
      elapsedMs,
    }
  }

  function handleNoAnswer() {
    if (answered) return
    setAnswered(true)
    setSelected(null)
    const entry = buildEntry(null, false)
    const newHistory = [...history, entry]
    setHistory(newHistory)
    const nextTotalTimeMs = totalTimeMs + entry.elapsedMs
    setTotalTimeMs(nextTotalTimeMs)
    setTimeout(() => next(newHistory, playerScores, nextTotalTimeMs), 250)
  }

  function answerQuestion(choice) {
    if (answered) return
    clearInterval(timerRef.current)
    setAnswered(true)
    setSelected(choice)

    const correct = choice === q.answer
    const entry = buildEntry(choice, correct)
    const newHistory = [...history, entry]
    setHistory(newHistory)
    const nextTotalTimeMs = totalTimeMs + entry.elapsedMs
    setTotalTimeMs(nextTotalTimeMs)

    let newScores = playerScores
    if (correct) {
      newScores = [...playerScores]
      newScores[0]++
      setPlayerScores(newScores)
    }

    setTimeout(() => next(newHistory, newScores, nextTotalTimeMs), 250)
  }

  function next(latestHistory, latestScores, latestTotalTimeMs) {
    if (qIndex + 1 >= questions.length) {
      onFinish({ scores: latestScores, history: latestHistory, totalTimeMs: latestTotalTimeMs })
    } else {
      setQIndex(qIndex + 1)
    }
  }

  const timerPct = (timeLeft / TIMER_SECS) * 100
  const timerColor = timeLeft <= 5 ? '#FF5C5C' : timeLeft <= 10 ? '#FFB347' : 'var(--green)'

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        {mode === 'daily' && (
          <div className={styles.pill}>Daily challenge</div>
        )}
      </div>

      <div className={styles.progress}>
        <span className={styles.qNum}>Q{qIndex + 1} / {questions.length}</span>
        <div className={styles.timerWrap}>
          <div className={styles.timerBar} style={{ width: timerPct + '%', background: timerColor }} />
        </div>
        <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
      </div>

      <div className={styles.questionCard}>
        <p className={styles.question}>{q.question}</p>
      </div>

      <div className={styles.options}>
        {q.options.map((opt, i) => {
          let cls = styles.option
          if (answered) {
            if (selected === opt) cls += ' ' + styles.selected
            else cls += ' ' + styles.dim
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => answerQuestion(opt)}
              disabled={answered}
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
