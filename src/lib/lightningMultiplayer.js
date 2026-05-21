import { ref, set, update, onValue, off, get, remove } from 'firebase/database'
import { db } from './firebase'

const LIGHTNING_ROOMS_PATH = 'lightningRooms'
const LIGHTNING_INVITES_PATH = 'lightningInvites'

// Room operations
export function createLightningRoom({ playerName, sport, rounds, code, hostUid, wager = 0 }) {
  const roomData = {
    host: {
      name: playerName,
      uid: hostUid || null,
      score: 0,
      timeLeft: 60,
      finished: false,
      started: false,
    },
    guest: null,
    sport,
    rounds,
    wager: {
      amount: wager,
      pot: wager,
      paid: hostUid ? { [hostUid]: wager } : {},
    },
    status: 'waiting',
    createdAt: Date.now(),
  }
  return set(ref(db, `${LIGHTNING_ROOMS_PATH}/${code}`), roomData)
}

export function joinLightningRoom({ code, playerName, guestUid }) {
  return get(ref(db, `${LIGHTNING_ROOMS_PATH}/${code}`)).then((snap) => {
    if (!snap.exists()) throw new Error('Room not found')
    const room = snap.val()
    if (room.guest) throw new Error('Room is full')
    if (room.host?.name === playerName) throw new Error('Cannot join your own room')

    return update(ref(db, `${LIGHTNING_ROOMS_PATH}/${code}`), {
      guest: {
        name: playerName,
        uid: guestUid || null,
        score: 0,
        timeLeft: 60,
        finished: false,
        started: false,
      },
      ...(guestUid && room.wager?.amount ? {
        'wager/pot': (room.wager?.pot || 0) + room.wager.amount,
        [`wager/paid/${guestUid}`]: room.wager.amount,
      } : {}),
      status: 'waiting',
    })
  })
}

export function listenToLightningRoom(code, callback) {
  const r = ref(db, `${LIGHTNING_ROOMS_PATH}/${code}`)
  onValue(r, (snap) => {
    const data = snap.val()
    callback(data || null)
  })
  return () => off(r)
}

export function startLightningGame(code) {
  return update(ref(db, `${LIGHTNING_ROOMS_PATH}/${code}`), {
    status: 'playing',
    startTime: Date.now(),
  })
}

export function submitLightningAnswer({
  code,
  role,
  isCorrect,
  timeLeft,
  score,
  finished,
}) {
  const updates = {}
  updates[`${LIGHTNING_ROOMS_PATH}/${code}/${role}`] = {
    score,
    timeLeft,
    finished,
  }
  return update(ref(db, ''), updates)
}

// Invite operations
export function sendLightningInvite({ fromName, fromUserId, toPlayerId, roomCode, sport }) {
  const targetPlayerId = String(toPlayerId || '').trim().toUpperCase()
  const invite = {
    fromName,
    fromUserId,
    roomCode,
    sport,
    timestamp: Date.now(),
  }
  return set(ref(db, `${LIGHTNING_INVITES_PATH}/${targetPlayerId}`), invite)
}

export function listenToLightningInvite(playerId, callback) {
  const targetPlayerId = String(playerId || '').trim().toUpperCase()
  const r = ref(db, `${LIGHTNING_INVITES_PATH}/${targetPlayerId}`)
  onValue(r, (snap) => {
    const data = snap.val()
    callback(data || null)
  })
  return () => off(r)
}

export function clearLightningInvite(playerId) {
  const targetPlayerId = String(playerId || '').trim().toUpperCase()
  return remove(ref(db, `${LIGHTNING_INVITES_PATH}/${targetPlayerId}`))
}
