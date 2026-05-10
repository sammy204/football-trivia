import { useState, useEffect, useRef, useCallback } from 'react'
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
  const answeredRef = useRef(false)
  const historyRef = useRef([])
  const totalTimeMsRef = useRef(0)
  const playerScoresRef = useRef((players || ['Player']).map(() => 0))
  const qIndexRef = useRef(0)

  const q = questions[qIndex]
  const currentPlayer = (players || ['Player'])[0]

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
      player: currentPlayer,
      question: currentQ.question,
      selected: choice,
      correctAnswer: currentQ.answer,
      isCorrect,
      explanation: currentQ.explanation,
      elapsedMs,
    }
  }

  function next(latestHistory, latestScores, latestTotalTimeMs) {
    const currentIndex = qIndexRef.current
    if (currentIndex + 1 >= questions.length) {
      onFinish({ scores: latestScores, history: latestHistory, totalTimeMs: latestTotalTimeMs })
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
    setTimeout(() => next(newHistory, playerScoresRef.current, nextTotalTimeMs), 250)
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

    let newScores = [...playerScoresRef.current]
    if (correct) {
      newScores[0]++
      playerScoresRef.current = newScores
      setPlayerScores(newScores)
    }

    setTimeout(() => next(newHistory, newScores, nextTotalTimeMs), 250)
  }

  if (!q) return null

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