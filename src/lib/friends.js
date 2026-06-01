import { get, onValue, ref, set, update } from 'firebase/database'
import { db } from './firebase'

function normalizePlayerId(playerId) {
  return String(playerId || '').trim().toUpperCase()
}

async function getUserSummaryByPlayerId(playerId) {
  const normalized = normalizePlayerId(playerId)
  if (!normalized) return null
  const uidSnap = await get(ref(db, `playerIds/${normalized}`))
  if (!uidSnap.exists()) return null
  return {
    uid: uidSnap.val(),
    playerId: normalized,
  }
}

export async function sendFriendRequest({
  fromPlayerId,
  toPlayerId,
  fromDisplayName = 'Player',
  fromStreak = 0,
  fromRecentForm = '',
}) {
  const fromId = normalizePlayerId(fromPlayerId)
  const toId = normalizePlayerId(toPlayerId)
  if (!fromId || !toId) throw new Error('Enter a valid Player ID.')
  if (fromId === toId) throw new Error('You cannot add yourself.')

  const [fromUser, toUser] = await Promise.all([
    getUserSummaryByPlayerId(fromId),
    getUserSummaryByPlayerId(toId),
  ])
  if (!fromUser) throw new Error('Your Player ID is not set yet.')
  if (!toUser) throw new Error('Player ID not found.')

  const [friendSnap, existingRequestSnap] = await Promise.all([
    get(ref(db, `friends/${fromId}/${toId}`)),
    get(ref(db, `friendRequests/${toId}/${fromId}`)),
  ])
  if (friendSnap.exists()) throw new Error('You are already friends.')
  if (existingRequestSnap.exists()) throw new Error('Request already sent.')

  const reciprocalRequestSnap = await get(ref(db, `friendRequests/${fromId}/${toId}`))
  if (reciprocalRequestSnap.exists()) {
    return acceptFriendRequest({
      myPlayerId: fromId,
      fromPlayerId: toId,
      myDisplayName: String(fromDisplayName || 'Player').trim() || 'Player',
      myStreak,
      myRecentForm,
    })
  }

  await set(ref(db, `friendRequests/${toId}/${fromId}`), {
    fromPlayerId: fromId,
    fromDisplayName: String(fromDisplayName || 'Player').trim() || 'Player',
    fromStreak: Number(fromStreak) || 0,
    fromRecentForm: String(fromRecentForm || ''),
    createdAt: Date.now(),
  })

  return { ok: true, toUserId: toUser.uid, toPlayerId: toId, fromUserId: fromUser.uid }
}

export function listenToFriendRequests(playerId, callback) {
  const normalized = normalizePlayerId(playerId)
  if (!normalized) {
    callback([])
    return () => {}
  }
  const requestsRef = ref(db, `friendRequests/${normalized}`)
  const unsubscribe = onValue(requestsRef, (snap) => {
    const data = snap.val() || {}
    const list = Object.entries(data).map(([fromPlayerId, value]) => ({
      fromPlayerId,
      fromDisplayName: value?.fromDisplayName || 'Player',
      createdAt: value?.createdAt || 0,
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    callback(list)
  })
  return unsubscribe
}

export function listenToFriends(playerId, callback) {
  const normalized = normalizePlayerId(playerId)
  if (!normalized) {
    callback([])
    return () => {}
  }
  const friendsRef = ref(db, `friends/${normalized}`)
  const unsubscribe = onValue(friendsRef, (snap) => {
    const data = snap.val() || {}
    const list = Object.entries(data).map(([friendPlayerId, value]) => ({
      friendPlayerId,
      displayName: value?.displayName || 'Player',
      streak: Number(value?.streak) || 0,
      recentForm: String(value?.recentForm || ''),
      addedAt: value?.addedAt || 0,
    })).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    callback(list)
  })
  return unsubscribe
}

export async function acceptFriendRequest({
  myPlayerId,
  fromPlayerId,
  myDisplayName = 'Player',
  myStreak = 0,
  myRecentForm = '',
}) {
  const meId = normalizePlayerId(myPlayerId)
  const otherId = normalizePlayerId(fromPlayerId)
  if (!meId || !otherId) throw new Error('Invalid request.')

  const requestSnap = await get(ref(db, `friendRequests/${meId}/${otherId}`))
  const requestData = requestSnap.val() || {}
  const otherDisplayName = requestData.fromDisplayName || otherId
  const otherStreak = Number(requestData.fromStreak) || 0
  const otherRecentForm = String(requestData.fromRecentForm || '')

  const now = Date.now()
  await update(ref(db), {
    [`friends/${meId}/${otherId}`]: {
      playerId: otherId,
      displayName: otherDisplayName,
      streak: otherStreak,
      recentForm: otherRecentForm,
      addedAt: now,
    },
    [`friends/${otherId}/${meId}`]: {
      playerId: meId,
      displayName: String(myDisplayName || 'Player').trim() || 'Player',
      streak: Number(myStreak) || 0,
      recentForm: String(myRecentForm || ''),
      addedAt: now,
    },
    [`friendRequests/${meId}/${otherId}`]: null,
    [`friendRequests/${otherId}/${meId}`]: null,
  })

  return { ok: true }
}

export async function declineFriendRequest({ myPlayerId, fromPlayerId }) {
  const meId = normalizePlayerId(myPlayerId)
  const otherId = normalizePlayerId(fromPlayerId)
  if (!meId || !otherId) throw new Error('Invalid request.')
  await update(ref(db), {
    [`friendRequests/${meId}/${otherId}`]: null,
    [`friendRequests/${otherId}/${meId}`]: null,
  })
  return { ok: true }
}

export async function removeFriend({ myPlayerId, friendPlayerId }) {
  const meId = normalizePlayerId(myPlayerId)
  const otherId = normalizePlayerId(friendPlayerId)
  if (!meId || !otherId) throw new Error('Invalid friend.')
  await update(ref(db), {
    [`friends/${meId}/${otherId}`]: null,
    [`friends/${otherId}/${meId}`]: null,
  })
  return { ok: true }
}
