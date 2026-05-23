import { db } from './firebase'
import { ref, set, get, update, onValue, off, runTransaction } from 'firebase/database'
import { generateTieBreakerQuestion } from './question'

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createRoom({ playerName, questions, rounds, sport, code: presetCode, hostUid, wager = 0, hostPhotoURL = null }) {
  const code = presetCode || generateRoomCode()  // ← use preset if given
  const roomRef = ref(db, `rooms/${code}`)
  await set(roomRef, {
    code,
    sport,
    rounds,
    status: 'waiting',
    currentQuestion: 0,
    questions,
    questionState: {
      answerCount: 0,
      resolved: false,
      winner: null,
    },
    players: {
      host: { name: playerName, uid: hostUid || null, score: 0, answered: false, photoURL: hostPhotoURL }
    },
    wager: {
      amount: wager,
      pot: wager,
      paid: hostUid ? { [hostUid]: wager } : {},
      settled: false,
    },
    answers: {}
  })
  return code
}

export async function joinRoom({ code, playerName, guestUid, guestPhotoURL = null }) {
  const roomRef = ref(db, `rooms/${code}`)
  const snapshot = await get(roomRef)
  if (!snapshot.exists()) throw new Error('Room not found.')
  const room = snapshot.val()
  if (room.status !== 'waiting') throw new Error('Game already started.')
  await update(ref(db, `rooms/${code}/players`), {
    guest: { name: playerName, uid: guestUid || null, score: 0, answered: false, photoURL: guestPhotoURL }
  })
  if (guestUid && room.wager?.amount) {
    await update(ref(db, `rooms/${code}/wager`), {
      pot: (room.wager?.pot || 0) + (room.wager?.amount || 0),
      [`paid/${guestUid}`]: room.wager.amount,
    })
  }
  return room
}

export async function startGame(code) {
  await update(ref(db, `rooms/${code}`), {
status: 'playing',
    questionState: {
      answerCount: 0,
      resolved: false,
      winner: null,
    },
})
}

export async function submitAnswer({ code, role, qIndex, answer, correct }) {
  await update(ref(db, `rooms/${code}/answers/${qIndex}`), {
    [role]: { answer, correct }
  })
    await update(ref(db, `rooms/${code}/players/${role}`), { answered: true })

  const stateRef = ref(db, `rooms/${code}/questionState`)
  const { snapshot } = await runTransaction(stateRef, (state) => {
    const nextState = state || { answerCount: 0, resolved: false, winner: null }
    if (nextState.resolved) return nextState

    const answerCount = (nextState.answerCount || 0) + 1
    const winner = correct && !nextState.winner ? role : nextState.winner || null
    const resolved = Boolean(winner) || answerCount >= 2

    return {
      answerCount,
      resolved,
      winner,
    }
  })

  const nextState = snapshot.val()
  if (correct && nextState?.winner === role) {
    await runTransaction(ref(db, `rooms/${code}/players/${role}/score`), (score) => (score || 0) + 1)
  }
}

export async function nextQuestion({ code, qIndex, total }) {
  if (qIndex + 1 >= total) {
    const roomSnap = await get(ref(db, `rooms/${code}`))
    const room = roomSnap.val()
    const hostScore = room?.players?.host?.score || 0
    const guestScore = room?.players?.guest?.score || 0

    if (hostScore === guestScore) {
      const tieBreakerQuestion = generateTieBreakerQuestion({
        sport: room?.sport,
        excludeQuestions: room?.questions || [],
      })

      if (!tieBreakerQuestion) {
        await update(ref(db, `rooms/${code}`), { status: 'finished' })
        return
      }

      await update(ref(db, `rooms/${code}`), {
        [`questions/${total}`]: tieBreakerQuestion,
        currentQuestion: total,
        questionState: {
          answerCount: 0,
          resolved: false,
          winner: null,
        },
        'players/host/answered': false,
        'players/guest/answered': false,
      })
      return
    }

    await update(ref(db, `rooms/${code}`), { status: 'finished' })
  } else {
    await update(ref(db, `rooms/${code}`), {
      currentQuestion: qIndex + 1,
      questionState: {
        answerCount: 0,
        resolved: false,
        winner: null,
      },
      'players/host/answered': false,
      'players/guest/answered': false,
    })
  }
}

export function listenToRoom(code, callback) {
  const roomRef = ref(db, `rooms/${code}`)
  onValue(roomRef, snap => callback(snap.val()))
  return () => off(roomRef)
}

export async function sendOnlineInvite({ fromName, fromUserId, toPlayerId, roomCode, sport, rounds }) {
  const inviteRef = ref(db, `onlineInvites/${toPlayerId}`)
  await set(inviteRef, {
    fromName,
    fromUserId,
    roomCode,
    sport,
    rounds,
    sentAt: Date.now(),
  })
}

export function listenToOnlineInvite(playerId, callback) {
  const inviteRef = ref(db, `onlineInvites/${playerId}`)
  onValue(inviteRef, snap => callback(snap.val()))
  return () => off(inviteRef)
}

export async function clearOnlineInvite(playerId) {
  await set(ref(db, `onlineInvites/${playerId}`), null)
}

export async function getPlayerByPlayerId(playerId) {
  console.log('Looking up Player ID:', JSON.stringify(playerId))
  const snap = await get(ref(db, `playerIds/${playerId}`))
  console.log('Snap exists:', snap.exists(), 'Value:', snap.val())
  if (!snap.exists()) return null
  const uid = snap.val()
  return { uid }
}