import { useState } from 'react'
import { generateQuestions } from '../lib/question'
import { createRoom, joinRoom, startGame, listenToRoom, submitAnswer, nextQuestion } from '../lib/multiplayer'
import styles from './OnlineMulti.module.css'

export default function OnlineMulti({ sport, onBack }) {
  const [screen, setScreen] = useState('lobby')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [role, setRole] = useState(null)
  const [room, setRoom] = useState(null)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [error, setError] = useState('')

  const accent = sport === 'basketball' ? '#FF6B35' : '#00FF87'
  const accentText = sport === 'basketball' ? '#fff' : '#0a1f0f'

  async function handleCreate() {
    if (!name.trim()) return setError('Enter your name.')
    setError('')
    try {
      const questions = await generateQuestions({ rounds: 5, sport })
      const c = await createRoom({ playerName: name.trim(), questions, rounds: 5, sport })
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
    if (answered) return
    setAnswered(true)
    setSelected(choice)
    const q = room.questions[room.currentQuestion]
    const correct = choice === q.answer

    await submitAnswer({ code: roomCode, role, qIndex: room.currentQuestion, answer: choice, correct })

    setTimeout(() => {
      nextQuestion({ code: roomCode, qIndex: room.currentQuestion, total: room.questions.length })
      setSelected(null)
      setAnswered(false)
    }, 1500)
  }

  const q = room?.questions?.[room?.currentQuestion]
  const hostScore = room?.players?.host?.score || 0
  const guestScore = room?.players?.guest?.score || 0
  const hostName = room?.players?.host?.name || 'Host'
  const guestName = room?.players?.guest?.name || 'Guest'
  const myScore = role === 'host' ? hostScore : guestScore
  const theirScore = role === 'host' ? guestScore : hostScore
  const theirName = role === 'host' ? guestName : hostName

  return (
    <div className={styles.wrap}>
      {screen === 'lobby' && (
        <>
          <button className={styles.back} onClick={onBack}>← Back</button>
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
          <div className={styles.scores}>
            <div className={styles.scoreBox}>
              <p className={styles.scoreName}>You</p>
              <p className={styles.scoreNum} style={{ color: accent }}>{myScore}</p>
            </div>
            <p className={styles.vs}>VS</p>
            <div className={styles.scoreBox}>
              <p className={styles.scoreName}>{theirName}</p>
              <p className={styles.scoreNum}>{theirScore}</p>
            </div>
          </div>

          <p className={styles.qNum}>Q{room.currentQuestion + 1} / {room.questions.length}</p>

          <div className={styles.questionCard}>
            <p className={styles.question}>{q.question}</p>
          </div>

          <div className={styles.options}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`${styles.option} ${answered && selected === opt ? styles.selected : ''} ${answered && selected !== opt ? styles.dim : ''}`}
                onClick={() => handleAnswer(opt)}
                disabled={answered}
                style={answered && selected === opt ? { borderColor: accent, background: `${accent}15` } : {}}
              >
                <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
          {answered && <p className={styles.waiting}>Waiting for opponent...</p>}
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