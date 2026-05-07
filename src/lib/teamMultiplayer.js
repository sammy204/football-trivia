import { db } from './firebase'
import { ref, set, get, update, onValue, off, push } from 'firebase/database'
import { generateQuestionSets } from './question'

export const TEAM_PLAYER_ROUNDS = 10
export const TEAM_MAX_PLAYERS = 5
export const TEAM_MIN_PLAYERS = 2

function createPlayerRecord({ uid, displayName, playerId }) {
  return {
    uid,
    displayName,
    playerId,
    score: 0,
    currentQuestion: 0,
    completed: false,
    questions: [],
    lastAnswer: null,
    lastCorrect: null,
    ready: true,
  }
}

function getTeamMemberCount(team) {
  return Object.keys(team?.members || {}).length
}

function calculateTeamScore(team) {
  return Object.values(team?.members || {}).reduce((sum, member) => sum + (member.score || 0), 0)
}

function areAllPlayersFinished(teams, override = {}) {
  return Object.entries(teams || {}).every(([teamId, team]) => (
    Object.entries(team.members || {}).every(([memberId, member]) => {
      if (teamId === override.teamId && memberId === override.playerId) {
        return override.completed
      }
      return Boolean(member.completed)
    })
  ))
}

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function getTeamRankings(teams) {
  return Object.entries(teams || {})
    .map(([teamId, team]) => ({
      teamId,
      ...team,
      score: calculateTeamScore(team),
    }))
    .sort((a, b) => b.score - a.score)
}

export function isRoomFull(teams, teamSize = TEAM_MAX_PLAYERS) {
  const teamList = Object.values(teams || {})
  if (!teamList.length) return false
  if (teamList.some(team => !team.captainUid)) return false

  const counts = teamList.map(getTeamMemberCount)
  const targetCount = counts[0] || 0

  if (targetCount < TEAM_MIN_PLAYERS || targetCount > teamSize) return false
  return counts.every(count => count === targetCount)
}

export async function createTeamRoom({
  hostUid,
  hostDisplayName,
  hostPlayerId,
  sport,
  rounds,
  teamSize,
  numTeams,
  myTeamName,
}) {
  const code = generateRoomCode()
  const teams = {
    team1: {
      name: myTeamName,
      score: 0,
      captainUid: hostUid,
      members: {
        [hostPlayerId]: createPlayerRecord({
          uid: hostUid,
          displayName: hostDisplayName,
          playerId: hostPlayerId,
        }),
      },
    },
  }

  for (let i = 2; i <= numTeams; i += 1) {
    teams[`team${i}`] = {
      name: `Team ${i}`,
      score: 0,
      captainUid: null,
      members: {},
    }
  }

  await set(ref(db, `teamRooms/${code}`), {
    code,
    sport,
    rounds,
    status: 'waiting',
    hostUid,
    settings: { teamSize, numTeams, playerRounds: rounds },
    teams,
    createdAt: Date.now(),
  })

  return code
}

export async function joinTeamAsCaptain({
  roomCode,
  teamId,
  uid,
  displayName,
  playerId,
  teamName,
}) {
  const roomSnap = await get(ref(db, `teamRooms/${roomCode}`))
  if (!roomSnap.exists()) throw new Error('Room not found.')
  const room = roomSnap.val()
  if (room.status !== 'waiting') throw new Error('Game already started.')

  const team = room.teams?.[teamId]
  if (!team) throw new Error('Team not found.')
  if (team.captainUid) throw new Error('This team already has a captain.')

  await update(ref(db, `teamRooms/${roomCode}/teams/${teamId}`), {
    name: teamName,
    captainUid: uid,
    score: 0,
  })

  await update(ref(db, `teamRooms/${roomCode}/teams/${teamId}/members/${playerId}`), createPlayerRecord({
    uid,
    displayName,
    playerId,
  }))

  return room
}

export async function joinTeamByCode({ roomCode, teamId, uid, displayName, playerId }) {
  const roomSnap = await get(ref(db, `teamRooms/${roomCode}`))
  if (!roomSnap.exists()) throw new Error('Room not found.')
  const room = roomSnap.val()
  if (room.status !== 'waiting') throw new Error('Game already started.')

  const team = room.teams?.[teamId]
  if (!team) throw new Error('Team not found.')
  const memberCount = getTeamMemberCount(team)
  if (memberCount >= (room.settings?.teamSize || TEAM_MAX_PLAYERS)) throw new Error('Team is full.')

  await update(ref(db, `teamRooms/${roomCode}/teams/${teamId}/members/${playerId}`), createPlayerRecord({
    uid,
    displayName,
    playerId,
  }))

  return room
}

export async function sendInvite({ targetPlayerId, roomCode, teamId, teamName, hostDisplayName, sport }) {
  const inviteRef = push(ref(db, `invites/${targetPlayerId}`))
  await set(inviteRef, {
    roomCode,
    teamId,
    teamName,
    hostDisplayName,
    sport,
    status: 'pending',
    createdAt: Date.now(),
  })
  return inviteRef.key
}

export async function respondToInvite({ playerId, inviteId, accept, uid, displayName, roomCode, teamId }) {
  await update(ref(db, `invites/${playerId}/${inviteId}`), {
    status: accept ? 'accepted' : 'declined',
  })
  if (!accept) return
  await joinTeamByCode({ roomCode, teamId, uid, displayName, playerId })
}

export async function startTeamGame(roomCode) {
  const roomSnap = await get(ref(db, `teamRooms/${roomCode}`))
  if (!roomSnap.exists()) throw new Error('Room not found.')
  const room = roomSnap.val()
  if (room.status !== 'waiting') throw new Error('Game already started.')
  if (!isRoomFull(room.teams, room.settings?.teamSize)) {
    throw new Error('Each team must have the same number of players before the game can start.')
  }

  const updates = {
    [`teamRooms/${roomCode}/status`]: 'playing',
    [`teamRooms/${roomCode}/startedAt`]: Date.now(),
    [`teamRooms/${roomCode}/finishedAt`]: null,
  }
  const rounds = room.settings?.playerRounds || TEAM_PLAYER_ROUNDS

  for (const [teamId, team] of Object.entries(room.teams || {})) {
    const members = Object.entries(team.members || {})
    const questionSets = generateQuestionSets({
      sport: room.sport,
      setCount: members.length,
      roundsPerSet: rounds,
    })

    updates[`teamRooms/${roomCode}/teams/${teamId}/score`] = 0

    members.forEach(([memberId, member], index) => {
      updates[`teamRooms/${roomCode}/teams/${teamId}/members/${memberId}`] = {
        ...member,
        score: 0,
        currentQuestion: 0,
        completed: false,
        questions: questionSets[index] || [],
        lastAnswer: null,
        lastCorrect: null,
        ready: true,
      }
    })
  }

  await update(ref(db), updates)
}

export async function submitTeamAnswer({ roomCode, teamId, playerId, answer }) {
  const roomSnap = await get(ref(db, `teamRooms/${roomCode}`))
  if (!roomSnap.exists()) throw new Error('Room not found.')
  const room = roomSnap.val()
  if (room.status !== 'playing') throw new Error('Game is not active.')

  const team = room.teams?.[teamId]
  const member = team?.members?.[playerId]
  if (!team || !member) throw new Error('Player not found in this team.')
  if (member.completed) return

  const questions = member.questions || []
  const currentQuestion = member.currentQuestion || 0
  const currentPrompt = questions[currentQuestion]
  if (!currentPrompt) return

  const correct = answer === currentPrompt.answer
  const nextScore = (member.score || 0) + (correct ? 1 : 0)
  const nextQuestion = currentQuestion + 1
  const completed = nextQuestion >= questions.length
  const nextTeamScore = Object.entries(team.members || {}).reduce((sum, [memberId, teamMember]) => (
    sum + (memberId === playerId ? nextScore : (teamMember.score || 0))
  ), 0)

  const updates = {
    [`teamRooms/${roomCode}/teams/${teamId}/members/${playerId}/score`]: nextScore,
    [`teamRooms/${roomCode}/teams/${teamId}/members/${playerId}/currentQuestion`]: nextQuestion,
    [`teamRooms/${roomCode}/teams/${teamId}/members/${playerId}/completed`]: completed,
    [`teamRooms/${roomCode}/teams/${teamId}/members/${playerId}/lastAnswer`]: answer,
    [`teamRooms/${roomCode}/teams/${teamId}/members/${playerId}/lastCorrect`]: correct,
    [`teamRooms/${roomCode}/teams/${teamId}/score`]: nextTeamScore,
  }

  if (areAllPlayersFinished(room.teams, { teamId, playerId, completed })) {
    updates[`teamRooms/${roomCode}/status`] = 'finished'
    updates[`teamRooms/${roomCode}/finishedAt`] = Date.now()
  }

  await update(ref(db), updates)
}

export function listenToTeamRoom(roomCode, callback) {
  const roomRef = ref(db, `teamRooms/${roomCode}`)
  onValue(roomRef, snap => callback(snap.val()))
  return () => off(roomRef)
}

export function listenToInvites(playerId, callback) {
  const invRef = ref(db, `invites/${playerId}`)
  onValue(invRef, snap => {
    const data = snap.val()
    if (!data) return callback([])
    const invites = Object.entries(data)
      .map(([id, inv]) => ({ id, ...inv }))
      .filter(inv => inv.status === 'pending')
    callback(invites)
  })
  return () => off(invRef)
}
