import { ref, get, set } from 'firebase/database'
import { db } from '../lib/firebase'
import { useEffect, useRef, useState } from 'react'
import { generateQuestions } from '../lib/question'
import {
  createRoom, joinRoom, startGame, listenToRoom,
  submitAnswer, nextQuestion, sendOnlineInvite,
  listenToOnlineInvite, clearOnlineInvite, getPlayerByPlayerId,
} from '../lib/multiplayer'
import { saveMatchResult } from '../lib/userStats'
import { recordGameplayActivity } from '../lib/streaks'
import { explosionConfetti } from '../lib/confetti'
import { recordMatchWinner } from '../lib/tournament'
import { sendInvitePushNotification } from '../lib/inviteNotifications'
import { awardCoins, ONLINE_1V1_WAGER, spendCoins } from '../lib/coins'
import { getDefaultAvatar, getPlayerAvatar } from '../lib/avatars'
import { getEquippedFrame } from '../lib/frames'
import { loadProfile } from '../lib/profile'
import styles from './OnlineMulti.module.css'
import { getFormBadge as buildFormBadge, getOpponentForm } from '../lib/userStats'
import { LobbyFormRow } from './RivalrySection'
import AvatarFrame from './AvatarFrame'

export default function OnlineMulti({
  sport,
  rounds,
  onBack,
  user,
  initialOpponentPlayerId = '',
  pendingInvite,
  onInviteHandled,
  tournamentMatchMeta,
  onTournamentMatchComplete,
  onMatchResult,
  coinBalance = 0,
}) {
  const [screen, setScreen] = useState('intro')
  const [name, setName] = useState(user?.displayName || '')
  const [opponentPlayerId, setOpponentPlayerId] = useState(String(initialOpponentPlayerId || '').trim().toUpperCase())
  const [roomCode, setRoomCode] = useState('')
  const [role, setRole] = useState(null)
  const [room, setRoom] = useState(null)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [error, setError] = useState('')
  const [matchSaved, setMatchSaved] = useState(false)
  const [inviteStatus, setInviteStatus] = useState(null)
  const [incomingInvite, setIncomingInvite] = useState(null)
  const playerAvatar = getPlayerAvatar(user, loadProfile())
  const [coinMessage, setCoinMessage] = useState('')
  const advancedQuestionRef = useRef(-1)
  const advanceTimerRef = useRef(null)
  const acceptHandledRef = useRef(false)
  const [hostFrame, setHostFrame] = useState(null)
  const [guestFrame, setGuestFrame] = useState(null)

  useEffect(() => {
    if (!error) return
    const timeout = window.setTimeout(() => setError(''), 5000)
    return () => window.clearTimeout(timeout)
  }, [error])

  const accent = sport === 'basketball' ? '#FF6B35' : '#00FF87'
  const accentText = sport === 'basketball' ? '#fff' : '#0a1f0f'
  const sportLabel = sport === 'basketball' ? 'Basketball' : 'Football'

  const hostScore = room?.players?.host?.score || 0
  const guestScore = room?.players?.guest?.score || 0
  const hostName = room?.players?.host?.name || 'Host'
  const guestName = room?.players?.guest?.name || 'Guest'
  const hostPhotoURL = room?.players?.host?.photoURL || null
  const guestPhotoURL = room?.players?.guest?.photoURL || null
  const q = room?.questions?.[room?.currentQuestion]
  const myScore = role === 'host' ? hostScore : guestScore
  const opponentScore = role === 'host' ? guestScore : hostScore
  const result = myScore > opponentScore ? 'win' : myScore < opponentScore ? 'loss' : 'draw'
  const [myForm, setMyForm] = useState([])
  const [opponentForm, setOpponentForm] = useState([])

  useEffect(() => {
    setOpponentPlayerId(String(initialOpponentPlayerId || '').trim().toUpperCase())
  }, [initialOpponentPlayerId])

  // Tournament match — auto join/create room using the pre-set room code
  useEffect(() => {
    if (!tournamentMatchMeta) return
    const { roomCode: tCode } = tournamentMatchMeta
    if (!tCode) return

    const playerName = user?.displayName || name || 'Player'
    setRoomCode(tCode)
    setScreen('waiting')

    get(ref(db, `rooms/${tCode}`)).then(async (snap) => {
      if (!snap.exists()) {
        const questions = await generateQuestions({ rounds, sport })
        await createRoom({ playerName, questions, rounds, sport, code: tCode, hostUid: user?.uid, hostPhotoURL: playerAvatar })
        setRole('host')
      } else {
        await joinRoom({ code: tCode, playerName, guestUid: user?.uid, guestPhotoURL: playerAvatar })
        setRole('guest')
      }

      listenToRoom(tCode, (data) => {
        setRoom(data)
        if (data?.status === 'playing') setScreen('quiz')
        if (data?.status === 'finished') setScreen('results')
      })
    }).catch(() => setError('Failed to connect to tournament room.'))
  }, [])

  // Auto-start game when guest joins (tournament matches only)
  useEffect(() => {
    if (!tournamentMatchMeta) return
    if (role !== 'host') return
    if (room?.players?.guest && room?.status === 'waiting') {
      startGame(roomCode)
    }
  }, [room?.players?.guest, room?.status])

  // Listen for incoming invite for this user
    // Listen for incoming invite for this user
  useEffect(() => {
  if (!user?.uid) return
  const profile = JSON.parse(localStorage.getItem('trivela-profile') || '{}')
  const myPlayerId = profile?.playerId
  if (!myPlayerId) return

  const unsub = listenToOnlineInvite(myPlayerId, (invite) => {
    if (invite && !pendingInvite) {
      setIncomingInvite(invite)
    }
  })
  return unsub
}, [user?.uid, pendingInvite])  // ← ADD pendingInvite to dependency 
  useEffect(() => {
    if (!pendingInvite) return
    if (acceptHandledRef.current) return  
  acceptHandledRef.current = true  
    setIncomingInvite(null)
    const acceptInvite = async () => {
      await handleAcceptInvite(pendingInvite)
    }
    acceptInvite()
    if (onInviteHandled) onInviteHandled()
  }, [pendingInvite])
    useEffect(() => {
      if (!user?.uid) return
      async function loadMyForm() {
        try {
          const snap = await get(ref(db, `users/${user.uid}/matches`))
          if (snap.val()) {
            const allMatches = Object.values(snap.val())
            setMyForm(buildFormBadge(allMatches, 5))
          }
        } catch { /* silent */ }
      }
      loadMyForm()
    }, [user?.uid])

      useEffect(() => {
    if (screen !== 'waiting') return
    if (!room?.players) return
    async function loadOpponentForm() {
      try {
        const opponentUid = role === 'host'
          ? room?.players?.guest?.uid
          : room?.players?.host?.uid
        if (!opponentUid) return
        const form = await getOpponentForm(opponentUid, 5)
        setOpponentForm(form)
      } catch { /* silent */ }
    }
    loadOpponentForm()
  }, [room?.players?.guest?.uid, room?.players?.host?.uid, screen])

  async function handleCreate() {
    if (!name.trim()) return setError('No username found.')
    if (!opponentPlayerId.trim()) return setError('Enter your opponent\'s Player ID.')
    const myPlayerId = String(loadProfile()?.playerId || '').trim().toUpperCase()
    const targetPlayerId = opponentPlayerId.trim().toUpperCase()

    if (targetPlayerId && myPlayerId && targetPlayerId === myPlayerId) {
      setError('You cannot invite yourself.')
      return
    }

    setError('')
    setInviteStatus('sending')

    try {
      const stake = await spendCoins({
        userId: user.uid,
        amount: ONLINE_1V1_WAGER,
        reason: 'online_1v1_stake',
        sourceId: `online-stake-host:${user.uid}:${sport}:${rounds}`,
        metadata: { sport, rounds },
      })
      if (!stake.ok) {
        setError(`You need ${ONLINE_1V1_WAGER} coins to enter multiplayer.`)
        setInviteStatus(null)
        return
      }

      const questions = await generateQuestions({ rounds, sport })
      const c = await createRoom({
        playerName: name.trim(),
        questions,
         rounds,
         sport,
        hostUid: user.uid,
        wager: ONLINE_1V1_WAGER,
        hostPhotoURL: playerAvatar
      })
      setRoomCode(c)
      setRole('host')

      const opponent = await getPlayerByPlayerId(targetPlayerId)
      if (!opponent) {
        setError('Player ID not found. Check and try again.')
        setInviteStatus(null)
        return
      }

      await sendOnlineInvite({
        fromName: name.trim(),
        fromUserId: user?.uid,
        toPlayerId: targetPlayerId,
        roomCode: c,
        sport,
        rounds,
      })

      try {
        await sendInvitePushNotification({
          toUserId: opponent.uid,
          fromName: name.trim(),
          roomCode: c,
          sport,
          type: 'online1v1',
        })
      } catch (e) {
        console.warn('Push notification failed, invite still sent:', e)
      }

      setInviteStatus('waiting')
      setScreen('waiting')

      listenToRoom(c, data => {
        setRoom(data)
        if (data?.status === 'playing') setScreen('quiz')
        if (data?.status === 'finished') setScreen('results')
      })
    } catch (e) {
      setError(e.message)
      setInviteStatus(null)
    }
  }

  async function handleAcceptInvite(invite = incomingInvite) {
    if (!invite) return
    try {
      const stake = await spendCoins({
        userId: user.uid,
        amount: ONLINE_1V1_WAGER,
        reason: 'online_1v1_stake',
        sourceId: `online-stake-guest:${invite.roomCode}:${user.uid}`,
        metadata: { sport: invite.sport, rounds: invite.rounds },
      })
      if (!stake.ok) {
        setError(`You need ${ONLINE_1V1_WAGER} coins to accept this match.`)
        return
      }

       const r = await joinRoom({ code: invite.roomCode, playerName: name.trim(), guestUid: user.uid, guestPhotoURL: playerAvatar })
      setRoomCode(invite.roomCode)
      setRole('guest')
      setRoom(r)

      const profile = JSON.parse(localStorage.getItem('trivela-profile') || '{}')
      await clearOnlineInvite(profile?.playerId)
      setIncomingInvite(null)
      setScreen('waiting')

      listenToRoom(invite.roomCode, data => {
        setRoom(data)
        if (data?.status === 'playing') setScreen('quiz')
        if (data?.status === 'finished') setScreen('results')
      })
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDeclineInvite() {
    const profile = JSON.parse(localStorage.getItem('trivela-profile') || '{}')
    await clearOnlineInvite(profile?.playerId)
    setIncomingInvite(null)
  }


  async function handleRematch() {
  try {
    const opponentUid = role === 'host'
      ? room?.players?.guest?.uid
      : room?.players?.host?.uid
    const opponentName = role === 'host' ? guestName : hostName

    if (!opponentUid) return setError('Cannot find opponent for rematch.')

    const snap = await get(ref(db, `users/${opponentUid}/playerId`))
    const opponentPId = snap.val()
    if (!opponentPId) return setError('Opponent Player ID not found.')

    const stake = await spendCoins({
      userId: user.uid,
      amount: ONLINE_1V1_WAGER,
      reason: 'online_1v1_stake',
      sourceId: `online-stake-host:${user.uid}:${sport}:${rounds}:rematch`,
      metadata: { sport, rounds },
    })
    if (!stake.ok) {
      setError(`You need ${ONLINE_1V1_WAGER} coins for a rematch.`)
      return
    }
await set(ref(db, `rooms/${roomCode}`), null)
    // FIX: Use actual question count from completed match
    const rematchRounds = room?.questions?.length || rounds
    const questions = await generateQuestions({ rounds: rematchRounds, sport })

       const c = await createRoom({
      playerName: name.trim(),
      questions,
      rounds: rematchRounds,
      sport,
      hostUid: user.uid,
      wager: ONLINE_1V1_WAGER,
      hostPhotoURL: playerAvatar,
    })

    setRoomCode(c)
    setRole('host')
    setMatchSaved(false)
    setCoinMessage('')
    setRoom(null)
    setSelected(null)
    SetAnswered(false)

    await sendOnlineInvite({
      fromName: name.trim(),
      fromUserId: user?.uid,
      toPlayerId: opponentPId,
      roomCode: c,
      sport,
      rounds: rematchRounds,
      isRematch: true,
    })

    try {
      await sendInvitePushNotification({
        toUserId: opponentUid,
        fromName: name.trim(),
        roomCode: c,
        sport,
        type: 'online1v1',
      })
    } catch (e) {
      console.warn('Push notification failed:', e)
    }

    setInviteStatus('waiting')
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
    if (screen !== 'results') return

    async function save() {
  if (matchSaved || !user) return
      if (matchSaved || !user) return
      try {
        const myScore = role === 'host' ? hostScore : guestScore
        const oppScore = role === 'host' ? guestScore : hostScore
        const opponentName = role === 'host' ? guestName : hostName

     const roomPot = room?.wager?.pot || ONLINE_1V1_WAGER * 2
     const earnedCoins = result === 'win' ? roomPot : result === 'draw' ? ONLINE_1V1_WAGER : 0
     const lostCoins = result === 'loss' ? ONLINE_1V1_WAGER : 0
        await saveMatchResult({
          userId: user.uid,
          username: user.displayName || name,
         opponent: role === 'host' 
        ? room?.players?.guest?.uid 
        : room?.players?.host?.uid,
          opponentName,
          myScore,
          opponentScore: oppScore,
          sport,
          rounds,
          coinsEarned: earnedCoins,
          coinsLost: lostCoins,
        })
        
        await recordGameplayActivity({ userId: user.uid, source: 'online' })
        setMatchSaved(true)
        if (!tournamentMatchMeta && onMatchResult) {
        onMatchResult({ result })
        }

        if (!tournamentMatchMeta) {
          const roomPot = room?.wager?.pot || ONLINE_1V1_WAGER * 2
          if (result === 'win') {
            const paid = await awardCoins({
              userId: user.uid,
              amount: roomPot,
              reason: 'online_1v1_payout',
              sourceId: `online-payout:${roomCode}:${user.uid}`,
              metadata: { roomCode, sport, rounds, result },
            })
            if (paid.ok) setCoinMessage(`Winner payout: +${paid.amount} coins`)
          } else if (result === 'draw') {
            const refund = await awardCoins({
              userId: user.uid,
              amount: ONLINE_1V1_WAGER,
              reason: 'online_1v1_draw_refund',
              sourceId: `online-draw-refund:${roomCode}:${user.uid}`,
              metadata: { roomCode, sport, rounds },
            })
            if (refund.ok) setCoinMessage(`Draw refund: +${refund.amount} coins`)
          } else {
            setCoinMessage(`${ONLINE_1V1_WAGER} coins staked`)
          }
        }

        if (tournamentMatchMeta && role === 'host') {
  const { tournamentCode, roundIndex, matchIndex } = tournamentMatchMeta
  const snap = await get(ref(db, `tournaments/${tournamentCode}/bracket/${roundIndex}/${matchIndex}`))
  const matchData = snap.val()
  const winnerUid = hostScore >= guestScore ? matchData.p1 : matchData.p2
  if (winnerUid) {
    await recordMatchWinner(tournamentCode, roundIndex, matchIndex, winnerUid)
  }
}
      } catch (e) {
        console.error('Failed to save match:', e)
      }
    }

    save()
  }, [screen])

  useEffect(() => {
    if (screen !== 'results') return

    const hostUid = room?.players?.host?.uid
    const guestUid = room?.players?.guest?.uid

    if (hostUid) getEquippedFrame(hostUid).then(setHostFrame)
    else setHostFrame(null)

    if (guestUid) getEquippedFrame(guestUid).then(setGuestFrame)
    else setGuestFrame(null)
  }, [screen, room?.players?.host?.uid, room?.players?.guest?.uid])

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

  useEffect(() => {
    if (screen === 'results' && result === 'win') explosionConfetti()
  }, [screen, result])

  return (
    <div className={styles.wrap}>
      {screen === 'intro' && (
        <>
          <button className={styles.backBtn} onClick={onBack}>Back</button>
          <h2 className={styles.title}>{sportLabel} Multiplayer Rules</h2>
          {!tournamentMatchMeta && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 10, padding: '10px 16px', marginBottom: 12,
      }}>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Your balance</span>
        <span style={{ color: accent, fontWeight: 800, fontSize: 15 }}>
          C {coinBalance}
        </span>
      </div>
    )}
          <div className={styles.rulesCard}>
            <p className={styles.rulesLead}>Read this first so both players know exactly how the match works.</p>
            <ul className={styles.rulesList}>
              {!tournamentMatchMeta && (
                <>
                  <li>Entry stake is {ONLINE_1V1_WAGER} coins per player.</li>
                  <li>Winner takes the full {ONLINE_1V1_WAGER * 2}-coin pot.</li>
                </>
              )}
              <li>First correct answer wins the point.</li>
              <li>If both players answer wrong, no point is awarded.</li>
              <li>Scores stay hidden until the match ends.</li>
              <li>This match is set to {rounds} questions before any tiebreaker.</li>
              <li>If the match is tied, it goes to sudden-death tiebreaker questions.</li>
              <li>Invite your opponent using their Player ID.</li>
              <li>The game starts after your opponent accepts.</li>
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
          <button className={styles.backBtn} onClick={onBack}>Back</button>
          <h2 className={styles.title}>
            {tournamentMatchMeta ? '🏆 Tournament Match' : 'Multiplayer'}
          </h2>
          {tournamentMatchMeta && (
            <div style={{
              background: 'rgba(245,200,66,0.08)',
              border: '1px solid rgba(245,200,66,0.25)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 13,
              color: '#f5c842',
              fontWeight: 600,
            }}>
              🏆 This is a tournament match. Enter your opponent's Player ID to send them an invite.
            </div>
          )}
          {error && <p className={styles.error}>{error}</p>}

          {incomingInvite && (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: 12, padding: '16px', marginBottom: 16,
            }}>
           <p style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>
             {incomingInvite.isRematch ? '🔁' : '📨'} {incomingInvite.fromName} {incomingInvite.isRematch ? 'wants a rematch!' : `invited you to a ${incomingInvite.sport} match!`}
            </p>
                      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
                {incomingInvite.rounds} questions · {incomingInvite.sport}
              </p>
               <div style={{
      display: 'flex', justifyContent: 'space-between',
      marginBottom: 12, fontSize: 13,
    }}>
      <span style={{ color: 'var(--muted)' }}>Entry cost</span>
      <span style={{ color: accent, fontWeight: 700 }}>C {ONLINE_1V1_WAGER}</span>
    </div>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      marginBottom: 12, fontSize: 13,
    }}>
      <span style={{ color: 'var(--muted)' }}>Your balance</span>
      <span style={{ color: coinBalance >= ONLINE_1V1_WAGER ? accent : '#FF5C5C', fontWeight: 700 }}>
        C {coinBalance}
      </span>
    </div>

    <div style={{ display: 'flex', gap: 8 }}></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={styles.btn}
                  style={{ background: accent, color: accentText, flex: 1, padding: '10px' }}
                  onClick={handleAcceptInvite}
                >
                  Accept
                </button>
                <button
                  className={styles.btnOutline}
                  style={{ border: `1px solid #FF5C5C`, color: '#FF5C5C', flex: 1, padding: '10px' }}
                  onClick={handleDeclineInvite}
                >
                  Decline
                </button>
              </div>
            </div>
          )}
          
          
          <p className={styles.label} style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
            Player ID
          </p>
          <input
            className={styles.input}
            placeholder="e.g. FTB-2S7779"
            value={opponentPlayerId}
            onChange={e => setOpponentPlayerId(e.target.value)}
          />
          <button
            className={styles.btn}
            style={{ background: accent, color: accentText }}
            onClick={handleCreate}
            disabled={inviteStatus === 'sending'}
          >
            {inviteStatus === 'sending' ? 'Sending invite…' : 'Send Invite & Create Room'}
          </button>
        </>
        
      )}

      {screen === 'waiting' && (
        <>
          <button className={styles.backBtn} onClick={onBack}>Back</button>
          <h2 className={styles.title}>
            {role === 'host' ? 'Waiting for opponent…' : 'Waiting for host…'}
          </h2>
              {(myForm.length > 0 || opponentForm.length > 0) && (
      <LobbyFormRow
        myForm={myForm}
        opponentForm={opponentForm}
        myName={name || user?.displayName || 'You'}
        opponentName={role === 'host' ? guestName : hostName}
        accent={accent}
      />
    )}
          {role === 'host' && !tournamentMatchMeta && (
            <div className={styles.codeBox}>
              <p className={styles.codeLabel}>Invite sent to</p>
              <p className={styles.code} style={{ color: accent }}>{opponentPlayerId}</p>
              <p className={styles.codeSub}>Waiting for them to accept…</p>
            </div>
          )}
          {tournamentMatchMeta && (
            <p style={{ color: accent, textAlign: 'center', fontSize: 14 }}>
              Connecting to tournament room…
            </p>
          )}
          {room?.players?.guest && role === 'host' && !tournamentMatchMeta && (
            <>
              <p className={styles.joined}>✅ {guestName} has joined!</p>
              <button className={styles.btn} style={{ background: accent, color: accentText }} onClick={handleStart}>
                Start Game
              </button>
            </>
          )}
          {role === 'guest' && (
            <p className={styles.waiting}>Waiting for host to start the game…</p>
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
             <AvatarFrame frameId={hostFrame} size={56}>
               <img
                 src={hostPhotoURL || getDefaultAvatar()}
                 alt={`${hostName}'s avatar`}
                 className={styles.avatarImg}
                 style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
               />
             </AvatarFrame>
             <p className={styles.scoreNum} style={{ color: accent }}>{hostScore}</p>
           </div>
            <p className={styles.vs}>VS</p>
             <div className={styles.scoreBox}>
               <p className={styles.scoreName}>{guestName}</p>
               <AvatarFrame frameId={guestFrame} size={56}>
                 <img
                   src={guestPhotoURL || getDefaultAvatar()}
                   alt={`${guestName}'s avatar`}
                   className={styles.avatarImg}
                   style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                 />
               </AvatarFrame>
               <p className={styles.scoreNum}>{guestScore}</p>
             </div>
          </div>
          <p className={styles.winner} style={{ color: accent }}>
            {result === 'win' ? '🏆 You win!' : result === 'loss' ? '😔 You lost!' : "🤝 It's a draw!"}
          </p>
          {matchSaved && (
            <p style={{ color: accent, fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
              ✓ Match saved to your profile
            </p>
          )}
          {coinMessage && (
            <p style={{ color: accent, fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
              {coinMessage}
            </p>
          )}

          {incomingInvite && screen === 'results' && (
  <div style={{
    background: 'var(--card-bg)',
    border: `1px solid ${accent}`,
    borderRadius: 12,
    padding: '16px',
    marginBottom: 16,
    marginTop: 8,
  }}>
    <p style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>
      🔁 {incomingInvite.fromName} wants a rematch!
    </p>
    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
      {incomingInvite.rounds} questions · {incomingInvite.sport}
    </p>
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className={styles.btn}
        style={{ background: accent, color: accentText, flex: 1, padding: '10px' }}
        onClick={() => handleAcceptInvite(incomingInvite)}
      >
        Accept Rematch
      </button>
      <button
        className={styles.btnOutline}
        style={{ border: '1px solid #FF5C5C', color: '#FF5C5C', flex: 1, padding: '10px' }}
        onClick={handleDeclineInvite}
      >
        Decline
      </button>
    </div>
  </div>
)}
                {tournamentMatchMeta ? (
          <button className={styles.backBtn} onClick={onTournamentMatchComplete}>
            Back to Bracket
          </button>
        ) : (
        <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'center' }}>
  <button
    onClick={onBack}
    style={{
      background: accent,
      color: accentText,
      border: 'none',
      borderRadius: 10,
      padding: '10px 20px',
      fontWeight: 700,
      fontSize: 14,
      cursor: 'pointer',
      minWidth: 130,
    }}
  >
    Back to Home
  </button>
  <button
    onClick={handleRematch}
    style={{
      background: accent,
      color: accentText,
      border: 'none',
      borderRadius: 10,
      padding: '10px 20px',
      fontWeight: 700,
      fontSize: 14,
      cursor: 'pointer',
      minWidth: 130,
    }}
  >
    🔁 Rematch
  </button>
</div>
        )}
        </>
      )}
    </div>
  )
}
