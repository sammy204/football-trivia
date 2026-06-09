import { ref, get, set, update } from 'firebase/database'
import { db } from './firebase'

// ─── Week Key (resets Monday) ─────────────────────────────────────────────────
export function getMissionWeekKey() {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 1 = Monday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust to Monday
  const monday = new Date(now.setDate(diff))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

// ─── Mission Pool ─────────────────────────────────────────────────────────────
export const MISSION_POOL = [
  { id: 'play_tournament', label: 'Play a Tournament', description: 'Enter and play in any tournament.', target: 1, trackKey: 'tournament' },
  { id: 'win_streak_3', label: 'Win 3 in a Row', description: 'Win 3 consecutive online matches.', target: 3, trackKey: 'winStreak' },
  { id: 'play_online_3', label: 'Play Online 1v1 x3', description: 'Play 3 online 1v1 matches this week.', target: 3, trackKey: 'online' },
  { id: 'perfect_daily', label: 'Perfect Daily Challenge', description: 'Score 100% on a daily challenge.', target: 1, trackKey: 'perfectDaily' },
  { id: 'play_solo_5', label: 'Play 5 Solo Games', description: 'Complete 5 solo quiz games this week.', target: 5, trackKey: 'solo' },
  { id: 'win_lightning', label: 'Win a Lightning Duel', description: 'Beat an opponent in a Lightning 1v1.', target: 1, trackKey: 'lightningWin' },
  { id: 'play_team', label: 'Play a Team Match', description: 'Participate in a team multiplayer match.', target: 1, trackKey: 'team' },
]

// ─── Assign 4 random missions for the week ───────────────────────────────────
function assignMissions(uid, weekKey) {
  const seedStr = uid + weekKey
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  }
  const shuffled = [...MISSION_POOL]
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 4).map(m => ({
    ...m,
    progress: 0,
    completed: false,
    claimed: false,
  }))
}
// ─── Get or create this week's missions ──────────────────────────────────────
export async function getOrCreateWeeklyMissions(uid) {
  const weekKey = getMissionWeekKey()
  const path = `users/${uid}/weeklyMissions/${weekKey}`
  const snap = await get(ref(db, path))
 

  if (snap.exists()) {
    const data = snap.val()
    return {
      weekKey,
      missions: Object.values(data.missions || {}),
      claimed: data.claimed || false,
    }
  }

  // First time this week — assign missions
  const missions = assignMissions(uid, weekKey)
  const missionsObj = {}
  missions.forEach(m => { missionsObj[m.id] = m })

  await set(ref(db, path), {
    weekKey,
    missions: missionsObj,
    claimed: false,
    createdAt: Date.now(),
  })

  return { weekKey, missions, claimed: false }
}

// ─── Update mission progress ──────────────────────────────────────────────────
export async function updateMissionProgress(uid, trackKey, increment = 1, isAbsolute = false) {
  const weekKey = getMissionWeekKey()
  const path = `users/${uid}/weeklyMissions/${weekKey}/missions`
  const snap = await get(ref(db, path))
  if (!snap.exists()) return

  const missions = snap.val()
  const updates = {}

  Object.entries(missions).forEach(([id, mission]) => {
    if (mission.trackKey === trackKey && !mission.completed) {
      const newProgress = isAbsolute
        ? Math.max(mission.progress || 0, increment)
        : Math.min((mission.progress || 0) + increment, mission.target)
      const completed = newProgress >= mission.target
      updates[`${path}/${id}/progress`] = newProgress
      updates[`${path}/${id}/completed`] = completed
    }
  })

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates)
  }
}

// ─── Claim weekly reward ──────────────────────────────────────────────────────
export async function claimWeeklyReward(uid) {
  const weekKey = getMissionWeekKey()
  const { missions, claimed } = await getOrCreateWeeklyMissions(uid)

  if (claimed) return { ok: false, reason: 'already_claimed' }

  const allComplete = missions.every(m => m.completed)
  if (!allComplete) return { ok: false, reason: 'not_complete' }

  await update(ref(db, `users/${uid}/weeklyMissions/${weekKey}`), {
    claimed: true,
    claimedAt: Date.now(),
  })

  return { ok: true }
}