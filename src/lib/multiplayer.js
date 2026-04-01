import { db } from './firebase'
import { ref, set, get, update, onValue, off } from 'firebase/database'

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createRoom({ playerName, questions, rounds, sport }) {
  const code = generateRoomCode()
  const roomRef = ref(db, `rooms/${code}`)
  await set(roomRef, {
    code,
    sport,
    rounds,
    status: 'waiting',
    currentQuestion: 0,
    questions,
    players: {
      host: { name: playerName, score: 0, answered: false }
    },
    answers: {}
  })
  return code
}

export async function joinRoom({ code, playerName }) {
  const roomRef = ref(db, `rooms/${code}`)
  const snapshot = await get(roomRef)
  if (!snapshot.exists()) throw new Error('Room not found.')
  const room = snapshot.val()
  if (room.status !== 'waiting') throw new Error('Game already started.')
  await update(ref(db, `rooms/${code}/players`), {
    guest: { name: playerName, score: 0, answered: false }
  })
  return room
}

export async function startGame(code) {
  await update(ref(db, `rooms/${code}`), { status: 'playing' })
}

export async function submitAnswer({ code, role, qIndex, answer, correct }) {
  await update(ref(db, `rooms/${code}/answers/${qIndex}`), {
    [role]: { answer, correct }
  })
  if (correct) {
    const snap = await get(ref(db, `rooms/${code}/players/${role}/score`))
    await set(ref(db, `rooms/${code}/players/${role}/score`), (snap.val() || 0) + 1)
  }
  await update(ref(db, `rooms/${code}/players/${role}`), { answered: true })
}

export async function nextQuestion({ code, qIndex, total }) {
  if (qIndex + 1 >= total) {
    await update(ref(db, `rooms/${code}`), { status: 'finished' })
  } else {
    await update(ref(db, `rooms/${code}`), {
      currentQuestion: qIndex + 1,
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