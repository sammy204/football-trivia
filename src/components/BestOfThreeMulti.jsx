import { useEffect, useRef, useState } from 'react'
import { generateQuestions } from '../lib/question'
import {
  createSeriesRoom,
  joinSeriesRoom,
  startSeriesRound,
  listenToRoom,
  submitAnswer,
  nextQuestion,
  forfeitSeries,
} from '../lib/bestOfThreeMultiplayer'
import { saveMatchResult } from '../lib/userStats'
import { recordGameplayActivity } from '../lib/streaks'
import { explosionConfetti } from '../lib/confetti'
import { awardCoins, BEST_OF_THREE_WAGER, spendCoins } from '../lib/coins'
import { getPlayerAvatar } from '../lib/avatars'
import { loadProfile } from '../lib/profile'
import { getEquippedFrame } from '../lib/frames'
import { getPlayerByPlayerId, sendOnlineInvite } from '../lib/multiplayer'
import { sendInvitePushNotification } from '../lib/inviteNotifications'
import AvatarFrame from './AvatarFrame'
import styles from './onlineMulti.module.css'

const INTERMISSION_SECONDS = 10

// Add pendingInvite + onInviteHandled to props
export default function BestOfThreeMulti({
  sport, rounds, onBack, user, coinBalance = 0,
  pendingInvite = null, onInviteHandled = () => {},
}) {
  const [screen, setScreen] = useState('intro')
  const [name] = useState(user?.displayName || '')
  const [opponentPlayerId, setOpponentPlayerId] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [role, setRole] = useState(null)
  const [room, setRoom] = useState(null)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [error, setError] = useState('')
  const [matchSaved, setMatchSaved] = useState(false)
  const [inviteStatus, setInviteStatus] = useState(null)
  const [coinMessage, setCoinMessage] = useState('')
  const [countdown, setCountdown] = useState(INTERMISSION_SECONDS)
  const [hostFrame, setHostFrame] = useState(null)
  const [guestFrame, setGuestFrame] = useState(null)

  const advancedQuestionRef = useRef(-1)
  const advanceTimerRef = useRef(null)
  const intermissionTimerRef = useRef(null)
  const autoStartedRef = useRef(false)

  const playerAvatar = getPlayerAvatar(user, loadProfile())
  const accent = sport === 'basketball' ? '#FF6B35' : '#00FF87'
  const accentText = sport === 'basketball' ? '#fff' : '#0a1f0f'
  const sportLabel = sport === 'basketball' ? 'Basketball' : 'Football'

  const hostScore = room?.players?.host?.score || 0
  const guestScore = room?.players?.guest?.score || 0
  const hostName = room?.players?.host?.name || 'Host'
  const guestName = room?.players?.guest?.name || 'Guest'
  const currentPlayerName = role === 'host' ? hostName : guestName
  const opponentName = role === 'host' ? guestName : hostName
  const hostPhotoURL = room?.players?.host?.photoURL || null
  const guestPhotoURL = room?.players?.guest?.photoURL || null
  const currentRound = room?.series?.currentRound || 1
  const hostRoundWins = room?.series?.hostRoundWins || 0
  const guestRoundWins = room?.series?.guestRoundWins || 0
  const myRoundWins = role === 'host' ? hostRoundWins : guestRoundWins
  const oppRoundWins = role === 'host' ? guestRoundWins : hostRoundWins
  const winnerRole = room?.series?.winnerRole
  const seriesResult = winnerRole ? (winnerRole === role ? 'win' : 'loss') : null
  const roundSummaries = room?.series?.roundSummaries || {}
  const q = room?.questions?.[room?.currentQuestion]

  useEffect(() => {
    if (!pendingInvite?.roomCode || role) return
    setRoomCodeInput(pendingInvite.roomCode)
    onInviteHandled()

    async function autoJoin() {
      const code = pendingInvite.roomCode
      setError('')
      setInviteStatus('joining')
        try {
        const stake = await spendCoins({
          userId: user.uid,
          amount: BEST_OF_THREE_WAGER,
          reason: 'best_of_three_stake',
          sourceId: `bo3-stake-guest:${code}:${user.uid}`,
          metadata: { sport, rounds },
        })
        if (!stake.ok) {
          setError(`You need ${BEST_OF_THREE_WAGER} coins to join a Best of 3 series.`)
          setInviteStatus(null)
          return
        }
        const playerAvatar = getPlayerAvatar(user, loadProfile())
        await joinSeriesRoom({ code, playerName: user.displayName || '', guestUid: user.uid, guestPhotoURL: playerAvatar })
        setRoomCode(code)
        setRole('guest')
        autoStartedRef.current = false
        setInviteStatus(null)
        setScreen('waiting')
        listenToRoom(code, (data) => setRoom(data))
      } catch (e) {
        setError(e.message || 'Failed to join room.')
        setInviteStatus(null)
      }
    }

    autoJoin()
  }, [pendingInvite, role, sport, rounds, user, onInviteHandled])

  // ─── Sync screen to room status ─────────────────────────────────────────────
  useEffect(() => {
    if (!room?.status) return
    if (room.status === 'waiting') setScreen('waiting')
    if (room.status === 'playing') setScreen('quiz')
    if (room.status === 'intermission') setScreen('intermission')
    if (room.status === 'finished') setScreen('results')
  }, [room?.status])

  // ─── Reset answered state on new question ───────────────────────────────────
  useEffect(() => {
    setSelected(null)
    setAnswered(false)
  }, [room?.currentQuestion])

  // ─── Host auto-advances questions after 1.5s (mirrors OnlineMulti) ──────────
  useEffect(() => {
    if (role !== 'host' || !room?.questionState?.resolved) return
    if (advancedQuestionRef.current === room.currentQuestion) return
    advancedQuestionRef.current = room.currentQuestion

    advanceTimerRef.current = setTimeout(() => {
      nextQuestion({ code: roomCode, qIndex: room.currentQuestion, total: room.questions.length })
    }, 1500)

    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [role, room?.questionState?.resolved, room?.currentQuestion, room?.questions?.length, roomCode])

  // ─── Host auto-starts next round when intermission timer expires ─────────────
  useEffect(() => {
    if (room?.status !== 'intermission') return
    if (role !== 'host') return

    const endsAt = room?.series?.intermissionEndsAt
    if (!endsAt) return

    // Start countdown UI
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(intermissionTimerRef.current)
        startSeriesRound(roomCode).catch(() => {})
      }
    }
    tick()
    intermissionTimerRef.current = setInterval(tick, 500)

    return () => clearInterval(intermissionTimerRef.current)
  }, [room?.status, room?.series?.intermissionEndsAt, role, roomCode])

  // ─── Guest countdown UI (read-only) ─────────────────────────────────────────
  useEffect(() => {
    if (room?.status !== 'intermission') return
    if (role !== 'guest') return

    const endsAt = room?.series?.intermissionEndsAt
    if (!endsAt) return

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setCountdown(remaining)
    }
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [room?.status, room?.series?.intermissionEndsAt, role])

  // ─── Frames on results ───────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'results') return
    const hostUid = room?.players?.host?.uid
    const guestUid = room?.players?.guest?.uid
    if (hostUid) getEquippedFrame(hostUid).then(setHostFrame).catch(() => {})
    else setHostFrame(null)
    if (guestUid) getEquippedFrame(guestUid).then(setGuestFrame).catch(() => {})
    else setGuestFrame(null)
  }, [screen])

  async function handleStartSeries() {
    if (role !== 'host') return
    if (room?.status !== 'waiting') return
    if (!room?.players?.guest?.uid) {
      setError('Wait for your opponent to accept first.')
      return
    }

    setError('')
    try {
      await startSeriesRound(roomCode)
    } catch (e) {
      setError(e.message || 'Failed to start the series.')
    }
  }

  // ─── Save match + payout on results ─────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'results') return
    if (matchSaved || !user || !room) return

    async function save() {
      try {
        const opponentName = role === 'host' ? guestName : hostName
        const opponentUid = role === 'host' ? room.players?.guest?.uid : room.players?.host?.uid
        const roomPot = room?.wager?.pot || BEST_OF_THREE_WAGER * 2

        await saveMatchResult({
          userId: user.uid,
          username: user.displayName || name,
          opponent: opponentUid,
          opponentName,
          myScore: myRoundWins,
          opponentScore: oppRoundWins,
          sport,
          rounds,
          coinsEarned: seriesResult === 'win' ? roomPot : 0,
          coinsLost: seriesResult === 'loss' ? BEST_OF_THREE_WAGER : 0,
        })

        await recordGameplayActivity({ userId: user.uid, source: 'best_of_three' })
        setMatchSaved(true)

        if (seriesResult === 'win') {
          const paid = await awardCoins({
            userId: user.uid,
            amount: roomPot,
            reason: 'best_of_three_payout',
            sourceId: `bo3-payout:${roomCode}:${user.uid}`,
            metadata: { roomCode, sport, rounds },
          })
          if (paid.ok) setCoinMessage(`🏆 Winner payout: +${paid.amount} coins`)
        } else {
          setCoinMessage(`${BEST_OF_THREE_WAGER} coins staked`)
        }
      } catch (e) {
        console.warn('Failed to save best-of-three result', e)
      }
    }

    save()
  }, [screen])

  useEffect(() => {
    if (screen === 'results' && seriesResult === 'win') explosionConfetti()
  }, [screen, seriesResult])

  // ─── Create room ─────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!name.trim()) return setError('No username found.')
    if (!opponentPlayerId.trim()) return setError("Enter your opponent's Player ID.")
    setError('')
    setInviteStatus('sending')

    try {
      const stake = await spendCoins({
        userId: user.uid,
        amount: BEST_OF_THREE_WAGER,
        reason: 'best_of_three_stake',
        sourceId: `bo3-stake-host:${user.uid}:${sport}:${rounds}`,
        metadata: { sport, rounds },
      })
      if (!stake.ok) {
        setError(`You need ${BEST_OF_THREE_WAGER} coins to start a Best of 3 series.`)
        setInviteStatus(null)
        return
      }

      const opponent = await getPlayerByPlayerId(opponentPlayerId.trim())
      if (!opponent) {
        setError('Player ID not found. Check and try again.')
        setInviteStatus(null)
        return
      }

      const [q1, q2, q3] = await Promise.all([
        generateQuestions({ rounds, sport }),
        generateQuestions({ rounds, sport }),
        generateQuestions({ rounds, sport }),
      ])

      const code = await createSeriesRoom({
        playerName: name.trim(),
        questionsRound1: q1,
        questionsRound2: q2,
        questionsRound3: q3,
        rounds,
        sport,
        hostUid: user.uid,
        wager: BEST_OF_THREE_WAGER,
        hostPhotoURL: playerAvatar,
      })

      setRoomCode(code)
      setRole('host')
      autoStartedRef.current = false

      await sendOnlineInvite({
        fromName: name.trim(),
        fromUserId: user.uid,
        toPlayerId: opponentPlayerId.trim(),
        roomCode: code,
        sport,
        rounds,
        isBestOfThree: true,
      })

      try {
        await sendInvitePushNotification({
          toUserId: opponent.uid,
          fromName: name.trim(),
          roomCode: code,
          sport,
          type: 'bestOfThree',
        })
      } catch (e) {
        console.warn('Push notification failed, invite still sent:', e)
      }

      setInviteStatus('waiting')
      setScreen('waiting')

      listenToRoom(code, (data) => setRoom(data))
    } catch (e) {
      setError(e.message || 'Failed to create room.')
      setInviteStatus(null)
    }
  }

  // ─── Join room ───────────────────────────────────────────────────────────────
  async function handleJoin() {
    const code = roomCodeInput.trim().toUpperCase()
    if (!code) return setError('Enter a room code.')
    setError('')
    setInviteStatus('joining')

    try {
      const stake = await spendCoins({
        userId: user.uid,
        amount: BEST_OF_THREE_WAGER,
        reason: 'best_of_three_stake',
        sourceId: `bo3-stake-guest:${code}:${user.uid}`,
        metadata: { sport, rounds },
      })
      if (!stake.ok) {
        setError(`You need ${BEST_OF_THREE_WAGER} coins to join a Best of 3 series.`)
        setInviteStatus(null)
        return
      }

      await joinSeriesRoom({ code, playerName: name.trim(), guestUid: user.uid, guestPhotoURL: playerAvatar })
      setRoomCode(code)
      setRole('guest')
      autoStartedRef.current = false
      setInviteStatus(null)
      setScreen('waiting')

      listenToRoom(code, (data) => setRoom(data))
    } catch (e) {
      setError(e.message || 'Failed to join room.')
      setInviteStatus(null)
    }
  }

  // ─── Answer a question ───────────────────────────────────────────────────────
  async function handleAnswer(choice) {
    if (answered || room?.questionState?.resolved) return
    setAnswered(true)
    setSelected(choice)
    const correct = choice === q?.answer
    await submitAnswer({ code: roomCode, role, qIndex: room.currentQuestion, answer: choice, correct })
  }

  // ─── Forfeit + back ──────────────────────────────────────────────────────────
  async function handleForfeitAndBack() {
    if (roomCode && role && room?.status && room.status !== 'finished') {
      try { await forfeitSeries(roomCode, role) } catch { /* silent */ }
    }
    onBack()
  }

  // ─── SCREENS ─────────────────────────────────────────────────────────────────

  if (screen === 'intro') {
    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={onBack}>Back</button>
        <h2 className={styles.title}>Best of 3 Series</h2>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 12,
        }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Your balance</span>
          <span style={{ color: accent, fontWeight: 800, fontSize: 15 }}>C {coinBalance}</span>
        </div>

        <div className={styles.rulesCard}>
          <p className={styles.rulesLead}>A 3-round series. First to win 2 rounds wins the match.</p>
          <ul className={styles.rulesList}>
            <li>Entry stake is {BEST_OF_THREE_WAGER} coins per player.</li>
            <li>Winner takes the full {BEST_OF_THREE_WAGER * 2} coin pot.</li>
            <li>Each round uses the question count selected on the Play page.</li>
            <li>First correct answer wins the point</li>
            <li>10-second break between rounds.</li>
            <li>If you leave during the series, you forfeit the match.</li>
            <li>Invite your opponent using their Player ID.</li>
          </ul>
        </div>

        <button
          className={styles.btn}
          style={{ background: accent, color: accentText }}
          onClick={() => setScreen('lobby')}
        >
          Continue to Lobby
        </button>
      </div>
    )
  }

  if (screen === 'lobby') {
    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={onBack}>Back</button>
        <h2 className={styles.title}>Best of 3</h2>
        {error && <p className={styles.error}>{error}</p>}

        {/* Create — invite by Player ID */}
        <p className={styles.label} style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
          Opponent Player ID
        </p>
        <input
          className={styles.input}
          placeholder="e.g. FTB-2S7779"
          value={opponentPlayerId}
          onChange={(e) => setOpponentPlayerId(e.target.value.trim().toUpperCase())}
        />
        <button
          className={styles.btn}
          style={{ background: accent, color: accentText }}
          onClick={handleCreate}
          disabled={inviteStatus === 'sending' || !opponentPlayerId.trim()}
        >
          {inviteStatus === 'sending' ? 'Creating series…' : `Create Series · ${BEST_OF_THREE_WAGER} coins`}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>OR JOIN</span>
          <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
        </div>

        {/* Join by room code */}
        <p className={styles.label} style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
          Room code
        </p>
        <input
          className={styles.input}
          placeholder="Enter room code"
          value={roomCodeInput}
          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
        />
        <button
          className={styles.btn}
           style={{ background: accent, color: accentText }}
          onClick={handleJoin}
          disabled={inviteStatus === 'joining' || !roomCodeInput.trim()}
        >
          {inviteStatus === 'joining' ? 'Joining…' : `Join Series · ${BEST_OF_THREE_WAGER} coins`}
        </button>
      </div>
    )
  }

  if (screen === 'waiting') {
    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={handleForfeitAndBack}>Back</button>
        <h2 className={styles.title}>
          {role === 'host' ? 'Waiting for opponent…' : 'Waiting for host…'}
        </h2>

        {role === 'host' && (
          <div className={styles.codeBox}>
            <p className={styles.codeLabel}>Invite sent to</p>
            <p className={styles.code} style={{ color: accent }}>{opponentPlayerId}</p>
            <p className={styles.codeSub}>Waiting for them to accept…</p>
          </div>
        )}

        {room?.players?.guest && role === 'host' && (
          <p className={styles.joined}>✅ {guestName} has joined! Ready for the host to start.</p>
        )}

        {role === 'guest' && (
          <p className={styles.waiting}>Waiting for host to start the series…</p>
        )}

        {role === 'host' && (
          <button
            className={styles.btn}
            style={{ background: accent, color: accentText, width: '100%', marginTop: 12 }}
            onClick={handleStartSeries}
            disabled={!room?.players?.guest?.uid || room?.status !== 'waiting'}
          >
            {room?.players?.guest?.uid ? 'Start series' : 'Waiting for opponent'}
          </button>
        )}

        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 12, padding: '14px 16px', marginTop: 8,
        }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            Best of 3 · {sportLabel} · {rounds} questions per round
          </p>
        </div>
      </div>
    )
  }

  if (screen === 'intermission') {
    const prevRound = (room?.series?.currentRound || 2) - 1
    const lastSummary = roundSummaries[prevRound]
    const roundWinnerName = lastSummary?.roundWinner === 'host' ? hostName : guestName

    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={handleForfeitAndBack}>Forfeit</button>
        <h2 className={styles.title}>Round {prevRound} over</h2>

        {/* Series score */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 24, background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 14, padding: '20px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{hostName}</p>
            <p style={{ color: accent, fontSize: 40, fontWeight: 900, margin: 0, lineHeight: 1 }}>{hostRoundWins}</p>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 18, fontWeight: 700 }}>–</p>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{guestName}</p>
            <p style={{ color: 'var(--white, #fff)', fontSize: 40, fontWeight: 900, margin: 0, lineHeight: 1 }}>{guestRoundWins}</p>
          </div>
        </div>

        {lastSummary && (
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Round {prevRound} result</p>
            <p style={{ color: '#fff', fontWeight: 700, margin: 0 }}>
              {roundWinnerName} won · {lastSummary.hostScore} – {lastSummary.guestScore}
            </p>
          </div>
        )}

        <div style={{
          background: 'var(--card-bg)', border: `1px solid ${accent}30`,
          borderRadius: 12, padding: '20px', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
            Round {room?.series?.currentRound} starts in
          </p>
          <p style={{ color: accent, fontSize: 52, fontWeight: 900, margin: 0, lineHeight: 1 }}>
            {countdown}
          </p>
        </div>
      </div>
    )
  }

  if (screen === 'quiz') {
    if (!q) return null
    return (
      <div className={styles.wrap}>
        <button className={styles.backBtn} onClick={handleForfeitAndBack}>Forfeit</button>

        {/* Round + series progress */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 8, flexWrap: 'wrap',
        }}>
          <p style={{ color: accent, fontWeight: 800, fontSize: 13, margin: 0 }}>
            ROUND {currentRound} / 3
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            {myRoundWins} – {oppRoundWins} series
          </p>
        </div>

        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 12,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                Playing as
              </p>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '4px 0 0' }}>
                {currentPlayerName}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                Opponent
              </p>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '4px 0 0' }}>
                {opponentName}
              </p>
            </div>
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
              className={`${styles.option} ${(answered || room?.questionState?.resolved) && selected !== opt ? styles.dim : ''}`}
              onClick={() => handleAnswer(opt)}
              disabled={answered || room?.questionState?.resolved}
            >
              <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (screen === 'results') {
    return (
      <div className={styles.wrap}>
        <h2 className={styles.title}>
          {seriesResult === 'win' ? '🏆 Series Won!' : 'Series Over'}
        </h2>

        {/* Final series score */}
        <div className={styles.scores}>
          <div className={styles.scoreBox}>
            <p className={styles.scoreName}>{hostName}</p>
            <AvatarFrame frameId={hostFrame} size={56}>
              <img
                src={hostPhotoURL || '/default-avatar.png'}
                alt={hostName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </AvatarFrame>
            <p className={styles.scoreNum} style={{ color: accent }}>{hostRoundWins}</p>
          </div>
          <p className={styles.vs}>VS</p>
          <div className={styles.scoreBox}>
            <p className={styles.scoreName}>{guestName}</p>
            <AvatarFrame frameId={guestFrame} size={56}>
              <img
                src={guestPhotoURL || '/default-avatar.png'}
                alt={guestName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </AvatarFrame>
            <p className={styles.scoreNum}>{guestRoundWins}</p>
          </div>
        </div>

        <p className={styles.winner} style={{ color: accent }}>
          {seriesResult === 'win' ? '🏆 You won the series!' : '😔 You lost the series.'}
        </p>

        {/* Round by round breakdown */}
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 14, padding: '16px 20px', marginTop: 8,
        }}>
          <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Round Breakdown
          </p>
          {Object.entries(roundSummaries).map(([roundNum, summary]) => {
            const winnerName = summary.roundWinner === 'host' ? hostName : guestName
            return (
              <div key={roundNum} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--card-border)',
              }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>Round {roundNum}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{summary.hostScore} – {summary.guestScore}</span>
                <span style={{ color: accent, fontWeight: 700, fontSize: 13 }}>{winnerName} won</span>
              </div>
            )
          })}
        </div>

        {matchSaved && (
          <p style={{ color: accent, fontSize: 13, textAlign: 'center' }}>✓ Match saved to your profile</p>
        )}
        {coinMessage && (
          <p style={{ color: accent, fontSize: 13, textAlign: 'center' }}>{coinMessage}</p>
        )}

        <button
          className={styles.btn}
          style={{ background: accent, color: accentText, marginTop: 8 }}
          onClick={onBack}
        >
          Back to Home
        </button>
      </div>
    )
  }

  return null
}
