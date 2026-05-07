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
import styles from './TeamMulti.module.css'

const MEDALS = ['🥇', '🥈', '🥉', '🏅']

function getOrdinal(value) {
  if (value % 100 >= 11 && value % 100 <= 13) return `${value}th`
  if (value % 10 === 1) return `${value}st`
  if (value % 10 === 2) return `${value}nd`
  if (value % 10 === 3) return `${value}rd`
  return `${value}th`
}

export default function TeamMulti({ sport, onBack, user, initialJoinCode, initialJoinTeamId }) {
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
  const [invitePlayerId, setInvitePlayerId] = useState('')
  const [inviteSent, setInviteSent] = useState(null)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const accent = sport === 'basketball' ? '#FF6B35' : '#00FF87'
  const accentText = sport === 'basketball' ? '#fff' : '#0a1f0f'
  const profile = loadProfile()
  const playerId = profile?.playerId
  const roomUnsubRef = useRef(null)

  function attachToRoom(code, teamId, captain) {
    roomUnsubRef.current?.()
    setRoomCode(code)
    setMyTeamId(teamId)
    setIsCaptain(captain)
    roomUnsubRef.current = listenToTeamRoom(code, data => {
      setRoom(data)
      if (!data) return
      if (data.status === 'finished') {
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
  }, [currentQuestionIndex, room?.status])

  async function handleCreate() {
    if (!playerId || !user?.uid) return setError('You need a Player ID. Please sign in.')
    if (!myTeamName.trim()) return setError('Enter your team name.')
    setError('')
    setLoading(true)
    try {
      const code = await createTeamRoom({
        hostUid: user.uid,
        hostDisplayName: user.displayName || 'Captain',
        hostPlayerId: playerId,
        sport,
        rounds: TEAM_PLAYER_ROUNDS,
        teamSize: TEAM_MAX_PLAYERS,
        numTeams,
        myTeamName: myTeamName.trim(),
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
      await joinTeamAsCaptain({
        roomCode: code,
        teamId: joinTeamId,
        uid: user.uid,
        displayName: user.displayName || 'Captain',
        playerId,
        teamName: joinTeamName.trim(),
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
      await sendInvite({
        targetPlayerId: invitePlayerId.trim().toUpperCase(),
        roomCode,
        teamId: myTeamId,
        teamName: room?.teams?.[myTeamId]?.name || myTeamId,
        hostDisplayName: user?.displayName || 'Captain',
        sport,
      })
      setInviteSent(invitePlayerId.trim().toUpperCase())
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
          <button className={styles.back} onClick={onBack}>← Back</button>
          <h2 className={styles.title}>{sport === 'basketball' ? 'Basketball' : 'Football'} Team Rules</h2>
          <div className={styles.summaryCard}>
            <p className={styles.summaryTitle}>Read this first</p>
            <ul className={styles.rulesList}>
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
          <button className={styles.back} onClick={onBack}>← Back</button>
          <h2 className={styles.title}>Team Multiplayer</h2>
          <p className={styles.sub}>
            Every player gets their own {TEAM_PLAYER_ROUNDS} questions. Team score is the sum of all correct answers.
          </p>
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
          <button className={styles.back} onClick={() => setStep('mode')}>← Back</button>
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
          <button className={styles.back} onClick={() => setStep('mode')}>← Back</button>
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

      {screen === 'waiting' && room && (
        <>
          <button className={styles.back} onClick={onBack}>← Back</button>
          <h2 className={styles.title}>Lobby</h2>

          <div className={styles.codeBox}>
            <p className={styles.codeLabel}>Room Code</p>
            <p className={styles.code} style={{ color: accent }}>{roomCode}</p>
            <p className={styles.codeSub}>Share this with the other captains</p>
          </div>

          <div className={styles.summaryCard}>
            <p className={styles.summaryTitle}>Match format</p>
            <p className={styles.summaryText}>
              Each player answers {TEAM_PLAYER_ROUNDS} different questions. Team score is the sum of every player&apos;s correct answers.
            </p>
            <p className={styles.summaryText}>
              Example: in a 2v2, the maximum team score is 20. In a 3v3, it is 30.
            </p>
          </div>

          <div className={styles.teamsGrid}>
            {Object.entries(teams).map(([teamId, team]) => {
              const members = Object.values(team.members || {})
              const isMyTeam = myTeamId === teamId
              return (
                <div key={teamId} className={`${styles.teamCard} ${isMyTeam ? styles.myTeam : ''}`}>
                  <p className={styles.teamCardName} style={{ color: isMyTeam ? accent : 'var(--muted)' }}>
                    {team.name}
                    {isMyTeam && <span className={styles.youBadge}>You</span>}
                  </p>
                  <p className={styles.teamCardCount}>{members.length}/{teamSize} players</p>
                  <div className={styles.memberList}>
                    {members.map(member => (
                      <span key={member.playerId} className={`${styles.memberChip} ${isMyTeam ? styles.myMemberChip : ''}`}>
                        {member.displayName}
                      </span>
                    ))}
                  </div>
                  {!members.length && <p className={styles.noCaptain}>Waiting for players...</p>}
                  {!team.captainUid && <p className={styles.noCaptain}>Waiting for captain...</p>}
                </div>
              )
            })}
          </div>

          {isCaptain && (
            <div className={styles.inviteBox}>
              <p className={styles.label}>Invite teammates to {room?.teams?.[myTeamId]?.name}</p>
              <p className={styles.inviteHint}>Enter their Player ID to add them to your team</p>
              <div className={styles.inviteRow}>
                <input
                  className={styles.input}
                  placeholder="FTB-XX1234"
                  value={invitePlayerId}
                  onChange={event => setInvitePlayerId(event.target.value.toUpperCase())}
                />
                <button
                  className={styles.inviteBtn}
                  style={{ background: accent, color: accentText }}
                  onClick={handleSendInvite}
                >
                  Invite
                </button>
              </div>
              {inviteSent && <p className={styles.inviteSent}>Invite sent to {inviteSent}</p>}
            </div>
          )}

          {myTeam && (
            <div className={styles.summaryCard}>
              <p className={styles.summaryTitle}>{myTeam.name} score target</p>
              <p className={styles.summaryText}>
                With {myTeamMembers.length} player{myTeamMembers.length === 1 ? '' : 's'}, your team can score up to {myTeamMembers.length * TEAM_PLAYER_ROUNDS} points.
              </p>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          {room.hostUid === user?.uid && (
            <button
              className={styles.btn}
              style={roomReady ? { background: accent, color: accentText } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', cursor: 'not-allowed' }}
              onClick={roomReady ? handleStart : undefined}
              disabled={!roomReady}
            >
              {roomReady
                ? `Start ${actualPlayersPerTeam}v${actualPlayersPerTeam} Match`
                : 'Need balanced teams to start'}
            </button>
          )}

          {room.hostUid !== user?.uid && (
            <p className={styles.waitingText}>
              Waiting for the host to start after all teams are balanced.
            </p>
          )}
        </>
      )}

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
                    <p className={styles.rankMembers}>
                      {members.map(member => `${member.displayName} got ${member.score || 0}/${member.questions?.length || TEAM_PLAYER_ROUNDS}`).join(' · ')}
                    </p>
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

          <button className={styles.btn} style={{ background: accent, color: accentText }} onClick={onBack}>
            Back to Home
          </button>
        </>
      )}
    </div>
  )
}
