import { useEffect, useRef, useState } from 'react'
import { ref, onValue, off, update } from 'firebase/database'
import { db } from '../lib/firebase'
import styles from './LightningH2H.module.css'

const TIMER_SECS = 60

export default function LightningH2H({ questionsHost, questionsGuest, roomCode, role, onFinish, sport }) {
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS)
  const [opponentTimeLeft, setOpponentTimeLeft] = useState(null)
  const [opponentScore, setOpponentScore] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentName, setOpponentName] = useState('Opponent')
  const [myStarted, setMyStarted] = useState(false)
  const [opponentStarted, setOpponentStarted] = useState(false)
  const [myFinished, setMyFinished] = useState(false)
  const [opponentFinished, setOpponentFinished] = useState(false)

  const timerRef = useRef(null)
  const startedAtRef = useRef(null)
  const answeredRef = useRef(false)
  const historyRef = useRef([])
  const playerScoreRef = useRef(0)
  const hasCalledFinishRef = useRef(false)

  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'
  const questions = role === 'host' ? questionsHost : questionsGuest
  const q = questions[qIndex]

  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    answeredRef.current = false
    startedAtRef.current = Date.now()
  }, [qIndex])

  useEffect(() => {
    const roomRef = ref(db, `lightningRooms/${roomCode}`)
    onValue(roomRef, (snap) => {
      const data = snap.val()
      if (!data) return

      const me = data[role]
      const opponentRole = role === 'host' ? 'guest' : 'host'
      const opp = data[opponentRole]

      if (opp?.name) setOpponentName(opp.name)
      setOpponentScore(opp?.score || 0)
      if (opp?.timeLeft !== undefined) setOpponentTimeLeft(opp.timeLeft)
      setOpponentStarted(Boolean(opp?.started))
      setOpponentFinished(Boolean(opp?.finished))

      setMyStarted(Boolean(me?.started))
      if (!myStarted && me?.timeLeft !== undefined) setTimeLeft(me.timeLeft)
      if (!myStarted && me?.score !== undefined) {
        setPlayerScore(me.score)
        playerScoreRef.current = me.score
      }
      setMyFinished(Boolean(me?.finished))
    })

    return () => off(roomRef)
  }, [roomCode, role, myStarted])

  useEffect(() => {
    if (!myStarted || myFinished) return

    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        const next = current - 1
        if (next <= 0) {
          clearInterval(timerRef.current)
          update(ref(db, `lightningRooms/${roomCode}/${role}`), {
            score: playerScoreRef.current,
            timeLeft: 0,
            finished: true,
            started: true,
          })
          setMyFinished(true)
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [myStarted, myFinished, roomCode, role])

  useEffect(() => {
    if (!myFinished || !opponentFinished || hasCalledFinishRef.current) return
    hasCalledFinishRef.current = true

    const myFinalScore = playerScoreRef.current
    const oppFinalScore = opponentScore
    const isWin = myFinalScore > oppFinalScore
    const isDraw = myFinalScore === oppFinalScore

    onFinish({
      scores: [myFinalScore, oppFinalScore],
      history: historyRef.current,
      totalTimeMs: 0,
      totalQuestions: questions.length,
      isWin,
      isDraw,
      opponentName,
    })
  }, [myFinished, opponentFinished, opponentScore, opponentName, questions.length, onFinish])

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

  function handleStartMyRound() {
    setMyStarted(true)
    setMyFinished(false)
    setQIndex(0)
    setTimeLeft(TIMER_SECS)
    setSelected(null)
    setAnswered(false)
    answeredRef.current = false
    historyRef.current = []
    playerScoreRef.current = 0
    setPlayerScore(0)
    startedAtRef.current = Date.now()

    update(ref(db, `lightningRooms/${roomCode}/${role}`), {
      score: 0,
      timeLeft: TIMER_SECS,
      finished: false,
      started: true,
    })
  }

  function answerQuestion(choice) {
    if (!myStarted || myFinished || answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    setSelected(choice)

    const currentQ = questions[qIndex]
    const correct = choice === currentQ.answer
    const elapsedMs = Date.now() - (startedAtRef.current || Date.now())

    const entry = buildEntry(choice, correct, elapsedMs)
    historyRef.current = [...historyRef.current, entry]

    if (correct) {
      playerScoreRef.current += 1
      setPlayerScore(playerScoreRef.current)
      update(ref(db, `lightningRooms/${roomCode}/${role}`), {
        score: playerScoreRef.current,
        timeLeft,
        finished: false,
        started: true,
      })
    } else {
      update(ref(db, `lightningRooms/${roomCode}/${role}`), {
        score: playerScoreRef.current,
        timeLeft,
        finished: false,
        started: true,
      })
    }

    setTimeout(() => {
      if (qIndex + 1 >= questions.length || timeLeft <= 0) {
        update(ref(db, `lightningRooms/${roomCode}/${role}`), {
          score: playerScoreRef.current,
          timeLeft,
          finished: true,
          started: true,
        })
        setMyFinished(true)
      } else {
        setQIndex((prev) => prev + 1)
      }
    }, correct ? 150 : 300)
  }

  const guestJoined = role === 'host'
    ? opponentName !== 'Opponent' && opponentName !== 'Guest' && opponentName !== ''
    : true

  if (!myStarted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.topBar}>
          <div className={styles.pill}>Lightning H2H</div>
        </div>
        <div className={styles.waiting}>
          {role === 'host' && !guestJoined ? (
            <>
              <h2>Waiting for opponent...</h2>
              <p>Room code:</p>
              <div className={styles.codeBox}>
                <span className={styles.code}>{roomCode}</span>
              </div>
            </>
          ) : (
            <>
              <h2>{opponentStarted ? `${opponentName} already started` : 'Ready to play?'}</h2>
              <p>Your timer starts only when you press Start.</p>
              <button
                className={styles.startBtn}
                style={{ marginTop: '1rem', background: accent, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                onClick={handleStartMyRound}
              >
                Start My 60s Round
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!q) return null

  if (myFinished && !opponentFinished) {
    return (
      <div className={styles.wrap}>
        <div className={styles.topBar}>
          <div className={styles.pill}>Lightning H2H</div>
        </div>
        <div className={styles.waiting}>
          <h2>You finished your round.</h2>
          <p>Waiting for {opponentName} to finish...</p>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Results will appear automatically.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.pill}>Lightning H2H</div>
        {opponentTimeLeft !== null && (
          <div className={styles.timerDisplay}>
            <span className={styles.timeLeft}>{timeLeft}s</span>
            <span className={styles.oppTime}>Opp: {opponentTimeLeft}s</span>
          </div>
        )}
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((TIMER_SECS - timeLeft) / TIMER_SECS) * 100}%` }} />
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{playerScore}</span>
          <span className={styles.statLabel}>You</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{myFinished && opponentFinished ? opponentScore : '--'}</span>
          <span className={styles.statLabel}>{opponentName}</span>
        </div>
      </div>

      <div className={styles.questionCard}>
        <p className={styles.question}>{q.question}</p>
      </div>

      <div className={styles.options}>
        {q.options.map((opt, index) => (
          <button
            key={index}
            className={styles.option}
            onClick={() => answerQuestion(opt)}
            disabled={answered}
          >
            <span className={styles.optLetter}>{String.fromCharCode(65 + index)}</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
