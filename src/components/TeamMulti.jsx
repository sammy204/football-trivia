import { useEffect, useRef, useState } from 'react'
import { loadProfile } from '../lib/profile'
import {
  createTeamRoom,
  joinTeamAsCaptain,
  startTeamGame,
  listenToTeamRoom,
  submitTeamAnswer,
  sendInvite,
  getTeamRankings,
  isRoomFull,
  TEAM_MAX_PLAYERS,
  TEAM_MIN_PLAYERS,
  TEAM_PLAYER_ROUNDS,
} from '../lib/teamMultiplayer'
import { getPlayerByPlayerId } from '../lib/multiplayer'
import { sendInvitePushNotification } from '../lib/inviteNotifications'
import { saveTeamMatchResult } from '../lib/userStats'
import { awardCoins, spendCoins, TEAM_PLAYER_WAGER, TEAM_WAGER_OPTIONS } from '../lib/coins'
import { getDefaultAvatar, getPlayerAvatar } from '../lib/avatars'
import styles from './TeamMulti.module.css'
import { recordGameplayActivity } from '../lib/streaks'

const MEDALS = ['🥇', '🥈', '🥉', '🏅']

function getOrdinal(value) {
  if (value % 100 >= 11 && value % 100 <= 13) return `${value}th`
  if (value % 10 === 1) return `${value}st`
  if (value % 10 === 2) return `${value}nd`
  if (value % 10 === 3) return `${value}rd`
  return `${value}th`
}

export default function TeamMulti({ sport, onBack, user, initialJoinCode, initialJoinTeamId, initialInvitePlayerId = '', coinBalance = 0 }) {
  const [screen, setScreen] = useState(initialJoinCode && initialJoinTeamId ? 'waiting' : 'intro')
  const [step, setStep] = useState('mode')
  const [numTeams, setNumTeams] = useState(2)
  const [myTeamName, setMyTeamName] = useState('')
  const [joinCode, setJoinCode] = useState(initialJoinCode || '')
  const [joinTeamId, setJoinTeamId] = useState(initialJoinTeamId || 'team2')
  const [joinTeamName, setJoinTeamName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [room, setRoom] = useState(null)
  const [myTeamId, setMyTeamId] = useState(initialJoinTeamId || null)
  const [isCaptain, setIsCaptain] = useState(false)
  const [invitePlayerId, setInvitePlayerId] = useState(String(initialInvitePlayerId || '').trim().toUpperCase())
  const [inviteSent, setInviteSent] = useState(null)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [timedOut, setTimedOut] = useState(false)
  const [coinMessage, setCoinMessage] = useState('')
  const [wagerAmount, setWagerAmount] = useState(TEAM_PLAYER_WAGER)
  const timerRef = useRef(null)

  const accent = sport === 'basketball' ? '#FF6B35' : '#00FF87'
  const accentText = sport === 'basketball' ? '#fff' : '#0a1f0f'
  const profile = loadProfile()
  const playerId = profile?.playerId
  const playerAvatar = getPlayerAvatar(user, profile)
  const roomUnsubRef = useRef(null)
  const resultsSavedRef = useRef(false)
  

  function attachToRoom(code, teamId, captain) {
    roomUnsubRef.current?.()
    setRoomCode(code)
    setMyTeamId(teamId)
    setIsCaptain(captain)
    resultsSavedRef.current = false

    // Capture values for use in listener closure
    const capturedTeamId = teamId
    const capturedPlayerId = playerId

    roomUnsubRef.current = listenToTeamRoom(code, data => {
      setRoom(data)
      if (!data) return

      if (data.status === 'finished') {
        // Save current user's team match result (once)
        if (!resultsSavedRef.current && capturedPlayerId && capturedTeamId && data?.teams?.[capturedTeamId]) {
          resultsSavedRef.current = true
          const myTeam = data.teams[capturedTeamId]
          const myMember = myTeam.members?.[capturedPlayerId]


          if (myMember?.uid) {
            const rankings = getTeamRankings(data.teams)
            const teamRank = rankings.findIndex(t => t.teamId === capturedTeamId) + 1
            saveTeamMatchResult({
              userId: myMember.uid,
              username: myMember.displayName,
              sport: data.sport,
              teamName: myTeam.name,
              teamScore: myTeam.score,
              teamRank,
              teamsCount: Object.keys(data.teams || {}).length,
              memberScore: myMember.score || 0,
              questionsCount: myMember.questions?.length || TEAM_PLAYER_ROUNDS,
            }).catch(err => console.error('Failed to save team result:', err))

            recordGameplayActivity({ userId: myMember.uid, source: 'team-multi' }).catch(() => {})

            if (teamRank === 1) {
              const winningMembers = Object.values(myTeam.members || {})
              const share = Math.floor((data.wager?.pot || 0) / Math.max(1, winningMembers.length))
              if (share > 0) {
                awardCoins({
                  userId: myMember.uid,
                  amount: share,
                  reason: 'team_payout',
                  sourceId: `team-payout:${code}:${myMember.uid}`,
                  metadata: { roomCode: code, teamId: capturedTeamId, teamName: myTeam.name },
                })
                  .then((paid) => {
                    if (paid.ok) setCoinMessage(`Team payout: +${paid.amount} coins`)
                  })
                  .catch(err => console.error('Failed to pay team coins:', err))
              }
           } else {
            const roomFee = data.wager?.amount || TEAM_PLAYER_WAGER
            setCoinMessage(`${roomFee} coins staked`)
            }
          }
        }
        setScreen('results')
      } else if (data.status === 'playing') {
        setScreen('quiz')
      } else {
        setScreen('waiting')
      }
    })
  }

  useEffect(() => (
    () => {
      roomUnsubRef.current?.()
    }
  ), [])

  useEffect(() => {
    if (!initialJoinCode || !initialJoinTeamId) return
    attachToRoom(initialJoinCode.toUpperCase(), initialJoinTeamId, false)
  }, [initialJoinCode, initialJoinTeamId])

  useEffect(() => {
    setInvitePlayerId(String(initialInvitePlayerId || '').trim().toUpperCase())
  }, [initialInvitePlayerId])

  const teams = room?.teams || {}
  const myTeam = myTeamId ? teams[myTeamId] : null
  const myMember = myTeam?.members?.[playerId] || null
  const myQuestions = myMember?.questions || []
  const currentQuestionIndex = myMember?.currentQuestion || 0
  const currentQuestion = myQuestions[currentQuestionIndex] || null
  const rankings = getTeamRankings(teams)
  const roomReady = isRoomFull(teams, room?.settings?.teamSize)
  const teamSize = room?.settings?.teamSize || TEAM_MAX_PLAYERS
  const actualPlayersPerTeam = Object.values(teams)[0] ? Object.keys(Object.values(teams)[0].members || {}).length : 0
  const teamMaxPoints = actualPlayersPerTeam * TEAM_PLAYER_ROUNDS
  const myTeamMembers = Object.values(myTeam?.members || {})
  const myTeamScore = myTeam?.score || 0
  const myTeamPosition = rankings.findIndex(team => team.teamId === myTeamId) + 1

   useEffect(() => {
     setSelected(null)
     setSubmitting(false)
     setTimeLeft(20)
   }, [currentQuestionIndex, room?.status])

   // Timer effect — runs only during quiz screen with an active question
   useEffect(() => {
     if (screen !== 'quiz' || !currentQuestion || submitting || myMember?.completed) {
       setTimeLeft(20)
       setTimedOut(false)
       if (timerRef.current) {
         clearInterval(timerRef.current)
         timerRef.current = null
       }
       return
     }

     setTimeLeft(20)
     setTimedOut(false)
     if (timerRef.current) clearInterval(timerRef.current)

     timerRef.current = setInterval(() => {
       setTimeLeft((prev) => {
         if (prev <= 1) {
           clearInterval(timerRef.current)
           setTimedOut(true)
           // Time's up — auto-submit with no answer (skip)
           if (!submitting && !myMember?.completed) {
             handleTimeout()
           }
           return 0
         }
         return prev - 1
       })
     }, 1000)

     return () => {
       if (timerRef.current) clearInterval(timerRef.current)
     }
   }, [screen, currentQuestionIndex, submitting, myMember?.completed])

  async function handleCreate() {
    if (!playerId || !user?.uid) return setError('You need a Player ID. Please sign in.')
    if (!myTeamName.trim()) return setError('Enter your team name.')
    const roomFee = Math.max(TEAM_PLAYER_WAGER, Math.round(Number(wagerAmount) || 0))
    setError('')
    setLoading(true)
    try {
      const stake = await spendCoins({
        userId: user.uid,
        amount: roomFee,
        reason: 'team_stake',
        sourceId: `team-stake-create:${user.uid}:${sport}:${numTeams}:${wagerAmount}`,
        metadata: { sport },
      })
      if (!stake.ok) {
        setError(`You need ${roomFee} coins to create a team room.`)
        setLoading(false)
        return
      }

      const code = await createTeamRoom({
        hostUid: user.uid,
        hostDisplayName: user.displayName || 'Captain',
        hostPlayerId: playerId,
        sport,
        rounds: TEAM_PLAYER_ROUNDS,
        teamSize: TEAM_MAX_PLAYERS,
        numTeams,
        myTeamName: myTeamName.trim(),
        wager: roomFee,
        hostPhotoURL: playerAvatar,
      })
      attachToRoom(code, 'team1', true)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleJoinAsCaptain() {
    if (!playerId || !user?.uid) return setError('You need a Player ID. Please sign in.')
    if (!joinCode.trim()) return setError('Enter a room code.')
    if (!joinTeamName.trim()) return setError('Enter your team name.')
    setError('')
    setLoading(true)
    try {
      const code = joinCode.toUpperCase()
       const { get, ref } = await import('firebase/database')
    const { db } = await import('../lib/firebase')
    const roomSnap = await get(ref(db, `teamRooms/${code}`))
    if (!roomSnap.exists()) {
      setError('Room not found.')
      setLoading(false)
      return
    }
    const roomFee = roomSnap.val()?.wager?.amount || TEAM_PLAYER_WAGER
      const stake = await spendCoins({
        userId: user.uid,
        amount: roomFee,
        reason: 'team_stake',
        sourceId: `team-stake-captain:${code}:${user.uid}`,
        metadata: { sport, roomCode: code },
      })
      if (!stake.ok) {
        setError(`You need ${roomFee} coins to join this team match.`)
        setLoading(false)
        return
      }

      await joinTeamAsCaptain({
        roomCode: code,
        teamId: joinTeamId,
        uid: user.uid,
        displayName: user.displayName || 'Captain',
        playerId,
        teamName: joinTeamName.trim(),
        wager: roomFee,
        photoURL: playerAvatar,
      })
      attachToRoom(code, joinTeamId, true)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleSendInvite() {
    if (!invitePlayerId.trim()) return
    setError('')
    try {
      const targetPlayerId = invitePlayerId.trim().toUpperCase()
      const myPlayerId = String(playerId || loadProfile()?.playerId || '').trim().toUpperCase()

      if (targetPlayerId && myPlayerId && targetPlayerId === myPlayerId) {
        setError('You cannot invite yourself.')
        return
      }

      await sendInvite({
        targetPlayerId,
        roomCode,
        teamId: myTeamId,
        teamName: room?.teams?.[myTeamId]?.name || myTeamId,
        hostDisplayName: user?.displayName || 'Captain',
        sport,
        wager: room?.wager?.amount || TEAM_PLAYER_WAGER,
      })
      const opponent = await getPlayerByPlayerId(targetPlayerId)
      if (opponent?.uid) {
        await sendInvitePushNotification({
          toUserId: opponent.uid,
          fromName: user?.displayName || 'Captain',
          roomCode,
          sport,
          type: 'team',
        })
      }
      setInviteSent(targetPlayerId)
      setInvitePlayerId('')
      setTimeout(() => setInviteSent(null), 3000)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleAnswer(choice) {
    if (!roomCode || !myTeamId || !playerId || !currentQuestion || submitting || myMember?.completed) return
    setSubmitting(true)
    setSelected(choice)
    try {
      await submitTeamAnswer({ roomCode, teamId: myTeamId, playerId, answer: choice })
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  // Called when timer expires — submit with no answer (skipped)
  async function handleTimeout() {
    if (submitting || myMember?.completed) return
    setSubmitting(true)
    setSelected(null)
    try {
      await submitTeamAnswer({ roomCode, teamId: myTeamId, playerId, answer: null })
    } catch (e) {
      console.error('Timeout submit failed:', e)
      setSubmitting(false)
    }
  }

  async function handleStart() {
    setError('')
    try {
      await startTeamGame(roomCode)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className={styles.wrap}>
      {screen === 'intro' && (
        <>
          <button className={styles.backBtn} onClick={onBack}>Back</button>
          <h2 className={styles.title}>{sport === 'basketball' ? 'Basketball' : 'Football'} Team Rules</h2>
          <div className={styles.summaryCard}>
            <p className={styles.summaryTitle}>Read this first</p>
            <ul className={styles.rulesList}>
              <li>The host sets the entry fee — you'll see the amount before joining.</li>
              <li>The winning team splits the full pot equally.</li>
              <li>Each player gets 10 questions of their own.</li>
              <li>Teammates do not answer the same questions.</li>
              <li>Every correct answer is worth 1 point.</li>
              <li>Your team score is the sum of every player&apos;s score.</li>
              <li>The host can only start when all teams have the same number of players.</li>
            </ul>
          </div>
          <button
            className={styles.btn}
            style={{ background: accent, color: accentText }}
            onClick={() => setScreen('setup')}
          >
            Continue to Lobby
          </button>
        </>
      )}

      {screen === 'setup' && step === 'mode' && (
        <>
          <button className={styles.backBtn} onClick={onBack}>Back</button>
          <h2 className={styles.title}>Team Multiplayer</h2>
          <p className={styles.sub}>
            Every player gets their own {TEAM_PLAYER_ROUNDS} questions. Team score is the sum of all correct answers.
          </p>
          <p className={styles.sub}>
            Entry stake: {TEAM_PLAYER_WAGER} coins per player. Winners split the pot.
          </p>
          <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
      borderRadius: 10, padding: '10px 16px', marginBottom: 16,
    }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>Your balance</span>
      <span style={{
        color: coinBalance >= TEAM_PLAYER_WAGER ? accent : '#FF5C5C',
        fontWeight: 800, fontSize: 15,
      }}>
        C {coinBalance}
      </span>
    </div>

    {error && <p className={styles.error}>{error}</p>}

          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modeGrid}>
            <button className={styles.modeCard} onClick={() => setStep('create')}>
              <span className={styles.modeIcon}>🏟️</span>
              <span className={styles.modeLabel}>Create Room</span>
              <span className={styles.modeSub}>Set up the match and name your team</span>
            </button>
            <button className={styles.modeCard} onClick={() => setStep('join')}>
              <span className={styles.modeIcon}>🔗</span>
              <span className={styles.modeLabel}>Join Room</span>
              <span className={styles.modeSub}>Enter a code and claim your team slot</span>
            </button>
          </div>
        </>
      )}

      {screen === 'setup' && step === 'create' && (
        
        <>
          <button className={styles.backBtn} onClick={() => setStep('mode')}>Back</button>
          <h2 className={styles.title}>Create Room</h2>
          <p className={styles.sub}>
            Invite your teammates after creation. The match starts when every team has the same number of players, from {TEAM_MIN_PLAYERS} to {TEAM_MAX_PLAYERS}.
          </p>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.configSection}>
            <label className={styles.label}>Your team name</label>
            <input
              className={styles.input}
              placeholder="e.g. The Eagles"
              value={myTeamName}
              onChange={event => setMyTeamName(event.target.value)}
            />
          </div>
<div className={styles.configSection}>
  <label className={styles.label}>Entry fee per player</label>
  <div className={styles.btnGroup} style={{ marginBottom: 10 }}>
    {TEAM_WAGER_OPTIONS.map(value => (
      <button
        key={value}
        className={`${styles.pill} ${Number(wagerAmount) === value ? styles.pillActive : ''}`}
        onClick={() => setWagerAmount(value)}
        style={Number(wagerAmount) === value ? { background: accent, color: accentText, borderColor: accent } : {}}
      >
        C {value}
      </button>
    ))}
  </div>
  <input
    className={styles.input}
    type="number"
    min={TEAM_PLAYER_WAGER}
    placeholder="Enter amount (e.g. 25)"
    value={wagerAmount}
    onChange={e => setWagerAmount(Number(e.target.value) || TEAM_PLAYER_WAGER)}
  />
  <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
    Winning team splits the full pot equally.
  </p>
</div>

          <div className={styles.configSection}>
            <label className={styles.label}>Number of teams</label>
            <div className={styles.btnGroup}>
              {[2, 3, 4].map(value => (
                <button
                  key={value}
                  className={`${styles.pill} ${numTeams === value ? styles.pillActive : ''}`}
                  onClick={() => setNumTeams(value)}
                  style={numTeams === value ? { background: accent, color: accentText, borderColor: accent } : {}}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <button
            className={styles.btn}
            style={{ background: accent, color: accentText }}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </>
      )}

      {screen === 'setup' && step === 'join' && (
        <>
          <button className={styles.backBtn} onClick={() => setStep('mode')}>Back</button>
          <h2 className={styles.title}>Join Room</h2>
          <p className={styles.sub}>
            Join as a captain, name your team, then invite the rest of your lineup.
          </p>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.configSection}>
            <label className={styles.label}>Room code</label>
            <input
              className={styles.input}
              placeholder="e.g. AB12CD"
              value={joinCode}
              onChange={event => setJoinCode(event.target.value.toUpperCase())}
            />
          </div>
          {joinCode.length === 6 && (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
    borderRadius: 10, padding: '10px 16px', marginBottom: 8,
  }}>
    <span style={{ color: 'var(--muted)', fontSize: 13 }}>Entry fee for this room</span>
    <span style={{ color: accent, fontWeight: 800, fontSize: 14 }}>
      C {room?.wager?.amount || '—'}
    </span>
  </div>
)}

          <div className={styles.configSection}>
            <label className={styles.label}>Your team name</label>
            <input
              className={styles.input}
              placeholder="e.g. The Lions"
              value={joinTeamName}
              onChange={event => setJoinTeamName(event.target.value)}
            />
          </div>

          <div className={styles.configSection}>
            <label className={styles.label}>Which team slot?</label>
            <div className={styles.btnGroup}>
              {['team2', 'team3', 'team4'].map((teamId, index) => (
                <button
                  key={teamId}
                  className={`${styles.pill} ${joinTeamId === teamId ? styles.pillActive : ''}`}
                  onClick={() => setJoinTeamId(teamId)}
                  style={joinTeamId === teamId ? { background: accent, color: accentText, borderColor: accent } : {}}
                >
                  Slot {index + 2}
                </button>
              ))}
            </div>
          </div>

          <button
            className={styles.btn}
            style={{ background: accent, color: accentText }}
            onClick={handleJoinAsCaptain}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join as Captain'}
          </button>
        </>
      )}
{screen === 'waiting' && room && (() => {
  const hasAnyPlayers = Object.values(teams).some(
    t => Object.keys(t.members || {}).length > 0
  )
  const totalPlayers = Object.values(teams).reduce(
    (sum, t) => sum + Object.keys(t.members || {}).length, 0
  )
  const isWaiting = totalPlayers <= 1

  return isWaiting ? (
    // ── State 1: empty lobby ──────────────────────────────────
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: 24, padding: 0 }}
      >
        ← Back
      </button>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,255,135,0.6)', marginBottom: 8 }}>
        {sport === 'basketball' ? 'Basketball' : 'Football'} · Team match
      </p>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--white)', letterSpacing: 1 }}>
          Waiting for players
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 220, lineHeight: 1.6 }}>
          Share the room code with the other captains
        </p>

        <div style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.2)', borderRadius: 14, padding: '20px 32px', marginTop: 12, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: accent, letterSpacing: '0.25em', lineHeight: 1 }}>
            {roomCode}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Room code</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 280, marginTop: 16, padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Entry fee</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>C {room?.wager?.amount || 0}</span>
        </div>
      </div>

      {isCaptain && (
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
            Invite teammates to {room?.teams?.[myTeamId]?.name}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '11px 14px', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }}
              placeholder="Player ID e.g. FTB-XX1234"
              value={invitePlayerId}
              onChange={e => setInvitePlayerId(e.target.value.toUpperCase())}
            />
            <button
              onClick={handleSendInvite}
              style={{ background: accent, color: '#0a1f0f', border: 'none', borderRadius: 10, padding: '11px 18px', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Invite
            </button>
          </div>
          {inviteSent && <p style={{ fontSize: 12, color: accent, marginTop: 6 }}>Invite sent to {inviteSent}</p>}
          {error && <p style={{ fontSize: 12, color: '#FF5C5C', marginTop: 6 }}>{error}</p>}
        </div>
      )}
    </div>

  ) : (
    // ── State 2: players joining ──────────────────────────────
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Compact header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)', borderRadius: 99, padding: '4px 12px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: accent, letterSpacing: '0.2em' }}>{roomCode}</span>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 99, padding: '4px 12px', fontSize: 12, color: 'var(--muted)' }}>
            Pot <span style={{ color: accent, fontWeight: 700 }}>C {room?.wager?.pot || 0}</span>
          </div>
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: '#FF5C5C' }}>{error}</p>}

      {/* Teams */}
      {Object.entries(teams).map(([teamId, team]) => {
        const members = Object.values(team.members || {})
        const isMyTeam = myTeamId === teamId
        const emptySlots = Math.max(0, teamSize - members.length)
        return (
          <div key={teamId}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isMyTeam ? accent : 'var(--muted)', marginBottom: 6 }}>
              {team.name} — {members.length}/{teamSize}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {members.map(member => (
                <div key={member.playerId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: isMyTeam ? 'rgba(0,255,135,0.05)' : 'var(--card-bg)', border: `1px solid ${isMyTeam ? 'rgba(0,255,135,0.15)' : 'var(--card-border)'}`, borderRadius: 10 }}>
                  <img src={member.photoURL || getDefaultAvatar()} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: 14, color: 'var(--white)', flex: 1 }}>{member.displayName}</span>
                  {member.uid === room?.hostUid && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: accent, background: 'rgba(0,255,135,0.1)', borderRadius: 4, padding: '2px 6px' }}>Captain</span>
                  )}
                </div>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Waiting...</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Invite row — captains only */}
      {isCaptain && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            Invite teammates to {room?.teams?.[myTeamId]?.name}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '11px 14px', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }}
              placeholder="Player ID"
              value={invitePlayerId}
              onChange={e => setInvitePlayerId(e.target.value.toUpperCase())}
            />
            <button
              onClick={handleSendInvite}
              style={{ background: accent, color: '#0a1f0f', border: 'none', borderRadius: 10, padding: '11px 18px', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
            >
              Invite
            </button>
          </div>
          {inviteSent && <p style={{ fontSize: 12, color: accent, marginTop: 6 }}>Invite sent to {inviteSent}</p>}
        </div>
      )}

      {/* Start / waiting */}
      {room.hostUid === user?.uid ? (
        <button
          onClick={roomReady ? handleStart : undefined}
          disabled={!roomReady}
          style={{ width: '100%', background: roomReady ? accent : 'rgba(255,255,255,0.06)', color: roomReady ? '#0a1f0f' : 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, padding: 14, fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15, cursor: roomReady ? 'pointer' : 'not-allowed', marginTop: 4 }}
        >
          {roomReady ? `Start ${actualPlayersPerTeam}v${actualPlayersPerTeam} match` : 'Need balanced teams to start'}
        </button>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>
          Waiting for the host to start...
        </p>
      )}
    </div>
  )
})()}

      {screen === 'quiz' && room && (
        <>
          <div className={styles.quizHeader}>
            <p className={styles.qNum}>
              {myMember?.completed ? 'Quiz complete' : `Q${currentQuestionIndex + 1} / ${myQuestions.length || TEAM_PLAYER_ROUNDS}`}
            </p>
            <div className={styles.timerBadge} style={{ color: accent }}>
              Team total {myTeamScore}/{teamMaxPoints || (myTeamMembers.length * TEAM_PLAYER_ROUNDS)}
            </div>
          </div>

          <div className={styles.scoreBar}>
            {Object.entries(teams).map(([teamId, team]) => {
              const memberCount = Object.keys(team.members || {}).length
              const maxScore = memberCount * TEAM_PLAYER_ROUNDS
              return (
                <div
                  key={teamId}
                  className={`${styles.scoreChip} ${myTeamId === teamId ? styles.myScoreChip : ''}`}
                  style={myTeamId === teamId ? { borderColor: accent } : {}}
                >
                  <span className={styles.scoreTeamName}>{team.name}</span>
                  <span className={styles.scoreTeamVal} style={{ color: myTeamId === teamId ? accent : 'var(--white)' }}>
                    {team.score || 0}/{maxScore}
                  </span>
                </div>
              )
            })}
          </div>

          {myTeam && (
            <div className={styles.breakdownCard}>
              <div className={styles.breakdownHeader}>
                <p className={styles.summaryTitle}>{myTeam.name} breakdown</p>
                {isCaptain && <span className={styles.captainBadge}>Captain view</span>}
              </div>
              <div className={styles.memberStats}>
                {myTeamMembers.map(member => (
                  <div key={member.playerId} className={styles.memberStatRow}>
                    <img
                      src={member.photoURL || getDefaultAvatar()}
                      alt=""
                      className={styles.avatarImg}
                    />
                    <span className={styles.memberStatName}>
                      {member.displayName} got {member.score || 0}/{member.questions?.length || TEAM_PLAYER_ROUNDS}
                    </span>
                    <span className={styles.memberStatStatus}>
                      {member.completed
                        ? 'Done'
                        : `Q${Math.min((member.currentQuestion || 0) + 1, member.questions?.length || TEAM_PLAYER_ROUNDS)}/${member.questions?.length || TEAM_PLAYER_ROUNDS}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!myMember && (
            <div className={styles.summaryCard}>
              <p className={styles.summaryTitle}>Waiting for your player record</p>
              <p className={styles.summaryText}>Your team has not loaded yet. If this keeps happening, return home and reopen the invite.</p>
            </div>
          )}

          {myMember?.completed && (
            <div className={styles.summaryCard}>
              <p className={styles.summaryTitle}>You&apos;re done</p>
              <p className={styles.summaryText}>
                You finished with {myMember.score || 0}/{myQuestions.length || TEAM_PLAYER_ROUNDS}. Stay here while the rest of the teams complete their quizzes.
              </p>
            </div>
          )}

           {!myMember?.completed && currentQuestion && (
             <>
               {/* Timer bar */}
               <div className={styles.timerBar}>
                 <div
                   className={styles.timerFill}
                   style={{
                     width: `${(timeLeft / 20) * 100}%`,
                     background: timeLeft <= 5 ? '#FF5C5C' : accent,
                   }}
                 />
                 <span className={styles.timerText}>{timeLeft}s</span>
               </div>

               <div className={styles.questionCard}>
                 <p className={styles.question}>{currentQuestion.question}</p>
               </div>

               <div className={styles.options}>
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={option}
                    className={`${styles.option} ${selected === option ? styles.selected : ''}`}
                    onClick={() => handleAnswer(option)}
                    disabled={submitting}
                    style={selected === option ? { borderColor: accent, background: `${accent}18` } : {}}
                  >
                    <span className={styles.optLetter}>{String.fromCharCode(65 + index)}</span>
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}
        </>
      )}

      {screen === 'results' && room && (
        <>
          <h2 className={styles.title}>Final Results</h2>
          <p className={styles.sub}>
            {sport === 'basketball' ? '🏀' : '⚽'} {sport} · {TEAM_PLAYER_ROUNDS} questions each
          </p>

          <div className={styles.rankingList}>
            {rankings.map((team, index) => {
              const members = Object.values(team.members || {})
              return (
                <div
                  key={team.teamId}
                  className={`${styles.rankCard} ${team.teamId === myTeamId ? styles.myRankCard : ''}`}
                  style={team.teamId === myTeamId ? { borderColor: accent } : {}}
                >
                  <span className={styles.medal}>{MEDALS[index]}</span>
                  <div className={styles.rankInfo}>
                    <p className={styles.rankName}>{team.name}</p>
                    <div className={styles.rankMembers}>
                      {members.map(member => `${member.displayName} got ${member.score || 0}/${member.questions?.length || TEAM_PLAYER_ROUNDS}`).join(' · ')}
                    </div>
                  </div>
                  <span className={styles.rankScore} style={{ color: team.teamId === myTeamId ? accent : 'var(--white)' }}>
                    {team.score}/{members.length * TEAM_PLAYER_ROUNDS}
                  </span>
                </div>
              )
            })}
          </div>

          {myTeamId && (
            <p className={styles.myResult} style={{ color: accent }}>
              {rankings[0]?.teamId === myTeamId
                ? '🏆 Your team won!'
                : `Your team finished ${getOrdinal(myTeamPosition)}`}
            </p>
          )}

          {coinMessage && (
            <p className={styles.myResult} style={{ color: accent }}>
              {coinMessage}
            </p>
          )}

          <button className={styles.backBtn} onClick={onBack}>
            Back to Home
          </button>
        </>
      )}
    </div>
  )
}
