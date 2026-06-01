import { get, ref, set } from 'firebase/database'
import { db } from './firebase'

export async function getOwnedFrames(userId) {
  if (!userId) return []
  const snap = await get(ref(db, `users/${userId}/ownedFrames`))
  return snap.val() ? Object.keys(snap.val()) : []
}

export async function getEquippedFrame(userId) {
  if (!userId) return null
  const snap = await get(ref(db, `users/${userId}/equippedFrame`))
  return snap.val() || null
}

export async function purchaseFrame(userId, frameId) {
  await set(ref(db, `users/${userId}/ownedFrames/${frameId}`), {
    purchasedAt: new Date().toISOString(),
  })
}

export async function equipFrame(userId, frameId) {
  await set(ref(db, `users/${userId}/equippedFrame`), frameId)
}

export async function unequipFrame(userId) {
  await set(ref(db, `users/${userId}/equippedFrame`), null)
}
