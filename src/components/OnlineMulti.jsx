import { useEffect, useRef, useState } from 'react'
import { generateQuestions } from '../lib/question'
import { createRoom, joinRoom, startGame, listenToRoom, submitAnswer, nextQuestion } from '../lib/multiplayer'
import styles from './OnlineMulti.module.css'

export default function OnlineMulti({ sport, rounds, onBack }) {
  const [screen, setScreen] = useState('intro')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [role, setRole] = useState(null)
  const [room, setRoom] = useState(null)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [error, setError] = useState('')
  const advancedQuestionRef = useRef(-1)
  const advanceTimerRef = useRef(null)

  const accent = sport === 'basketball' ? '#FF6B35' : '#00FF87'
  const accentText = sport === 'basketball' ? '#fff' : '#0a1f0f'
  const sportLabel = sport === 'basketball' ? 'Basketball' : 'Football'

  async function handleCreate() {
    if (!name.trim()) return setError('Enter your name.')
    setError('')
    try {
      const questions = await generateQuestions({ rounds, sport })
      const c = await createRoom({ playerName: name.trim(), questions, rounds, sport })
      setRoomCode(c)
      setRole('host')
      setScreen('waiting')
      listenToRoom(c, data => {
        setRoom(data)
        if (data?.status === 'playing') setScreen('quiz')
        if (data?.status === 'finished') setScreen('results')
      })
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError('Enter your name.')
    if (!code.trim()) return setError('Enter a room code.')
    setError('')
    try {
      const r = await joinRoom({ code: code.toUpperCase(), playerName: name.trim() })
      setRoomCode(code.toUpperCase())
      setRole('guest')
      setRoom(r)
      setScreen('waiting')
      listenToRoom(code.toUpperCase(), data => {
        setRoom(data)
        if (data?.status === 'playing') setScreen('quiz')
        if (data?.status === 'finished') setScreen('results')
      })
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleStart() {
    await startGame(roomCode)
  }

  async function handleAnswer(choice) {
    if (answered || room?.questionState?.resolved) return
    setAnswered(true)
    setSelected(choice)
    const q = room.questions[room.currentQuestion]
    const correct = choice === q.answer

    await submitAnswer({ code: roomCode, role, qIndex: room.currentQuestion, answer: choice, correct })
  }

  useEffect(() => {
    setSelected(null)
    setAnswered(false)
  }, [room?.currentQuestion])

  useEffect(() => {
    if (role !== 'host' || !room?.questionState?.resolved) return
    if (advancedQuestionRef.current === room.currentQuestion) return

    advancedQuestionRef.current = room.currentQuestion
    advanceTimerRef.current = setTimeout(() => {
      nextQuestion({ code: roomCode, qIndex: room.currentQuestion, total: room.questions.length })
    }, 1500)

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
    }
  }, [role, room?.questionState?.resolved, room?.currentQuestion, room?.questions?.length, roomCode])

  const q = room?.questions?.[room?.currentQuestion]
  const hostScore = room?.players?.host?.score || 0
  const guestScore = room?.players?.guest?.score || 0
  const hostName = room?.players?.host?.name || 'Host'
  const guestName = room?.players?.guest?.name || 'Guest'

  return (
    <div className={styles.wrap}>
      {screen === 'intro' && (
        <>
          <button className={styles.back} onClick={onBack}>← Back</button>
          <h2 className={styles.title}>{sportLabel} Online Rules</h2>
          <div className={styles.rulesCard}>
            <p className={styles.rulesLead}>
              Read this first so both players know exactly how the match works.
            </p>
            <ul className={styles.rulesList}>
              <li>First correct answer wins the point.</li>
              <li>If both players answer wrong, no point is awarded.</li>
              <li>Scores stay hidden until the match ends.</li>
              <li>This match is set to {rounds} questions before any tiebreaker.</li>
              <li>If the match is tied, it goes to sudden-death tiebreaker questions.</li>
              <li>One player creates a room and shares the code.</li>
              <li>The game starts after both players join.</li>
            </ul>
          </div>
          <button
            className={styles.btn}
            style={{ background: accent, color: accentText }}
            onClick={() => setScreen('lobby')}
          >
            Continue to Lobby
          </button>
        </>
      )}
      {screen === 'lobby' && (
        <>
          <button className={styles.back} onClick={() => setScreen('intro')}>← Back</button>
          <h2 className={styles.title}>Online Multiplayer</h2>
          {error && <p className={styles.error}>{error}</p>}
          <input className={styles.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <button className={styles.btn} style={{ background: accent, color: accentText }} onClick={handleCreate}>
            Create Room
          </button>
          <div className={styles.divider}>or join a room</div>
          <input className={styles.input} placeholder="Enter room code" value={code} onChange={e => setCode(e.target.value)} />
          <button className={styles.btnOutline} style={{ border: `1px solid ${accent}`, color: accent }} onClick={handleJoin}>
            Join Room
          </button>
        </>
      )}

      {screen === 'waiting' && (
        <>
          <button className={styles.back} onClick={onBack}>← Back</button>
          <h2 className={styles.title}>Waiting...</h2>
          <div className={styles.codeBox}>
            <p className={styles.codeLabel}>Room Code</p>
            <p className={styles.code} style={{ color: accent }}>{roomCode}</p>
            <p className={styles.codeSub}>Share this code with your opponent</p>
          </div>
          {room?.players?.guest && role === 'host' && (
            <>
              <p className={styles.joined}>✅ {guestName} has joined!</p>
              <button className={styles.btn} style={{ background: accent, color: accentText }} onClick={handleStart}>
                Start Game
              </button>
            </>
          )}
          {!room?.players?.guest && (
            <p className={styles.waiting}>Waiting for someone to join...</p>
          )}
        </>
      )}

      {screen === 'quiz' && q && (
        <>
          <p className={styles.qNum}>Q{room.currentQuestion + 1} / {room.questions.length}</p>

          <div className={styles.questionCard}>
            <p className={styles.question}>{q.question}</p>
          </div>

          <div className={styles.options}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`${styles.option} ${selected === opt ? styles.selected : ''} ${(answered || room?.questionState?.resolved) && selected !== opt ? styles.dim : ''}`}
                onClick={() => handleAnswer(opt)}
                disabled={answered || room?.questionState?.resolved}
                style={selected === opt ? { borderColor: accent, background: `${accent}15` } : {}}
              >
                <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}

      {screen === 'results' && (
        <>
          <h2 className={styles.title}>Game Over!</h2>
          <div className={styles.scores}>
            <div className={styles.scoreBox}>
              <p className={styles.scoreName}>{hostName}</p>
              <p className={styles.scoreNum} style={{ color: accent }}>{hostScore}</p>
            </div>
            <p className={styles.vs}>VS</p>
            <div className={styles.scoreBox}>
              <p className={styles.scoreName}>{guestName}</p>
              <p className={styles.scoreNum}>{guestScore}</p>
            </div>
          </div>
          <p className={styles.winner} style={{ color: accent }}>
            {hostScore > guestScore
              ? `🏆 ${hostName} wins!`
              : guestScore > hostScore
              ? `🏆 ${guestName} wins!`
              : "🤝 It's a draw!"}
          </p>
          <button className={styles.btn} style={{ background: accent, color: accentText }} onClick={onBack}>
            Back to Home
          </button>
        </>
      )}
    </div>
  )
}
