import { ref, set, get, update, onValue } from 'firebase/database'
import { db } from './firebase'

export function getWeekKey() {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

export const CLUB_OPTIONS = {
  football: [
    { id: 'manchester_united', name: 'Man United' },
    { id: 'arsenal', name: 'Arsenal' },
    { id: 'chelsea', name: 'Chelsea' },
    { id: 'liverpool', name: 'Liverpool' },
    { id: 'manchester_city', name: 'Man City' },
    { id: 'tottenham', name: 'Spurs' },
    { id: 'real_madrid', name: 'Real Madrid' },
    { id: 'barcelona', name: 'Barcelona' },
    { id: 'psg', name: 'PSG' },
    { id: 'bayern', name: 'Bayern Munich' },
    { id: 'juventus', name: 'Juventus' },
    { id: 'ac_milan', name: 'AC Milan' },
    { id: 'inter_milan', name: 'Inter Milan' },
    { id: 'dortmund', name: 'Dortmund' },
    { id: 'ajax', name: 'Ajax' },
    { id: 'atletico', name: 'Atlético Madrid' },
    { id: 'napoli', name: 'Napoli' },
    { id: 'porto', name: 'Porto' },
  ],
  basketball: [
    { id: 'lakers', name: 'Lakers' },
    { id: 'warriors', name: 'Warriors' },
    { id: 'bulls', name: 'Bulls' },
    { id: 'celtics', name: 'Celtics' },
    { id: 'heat', name: 'Heat' },
    { id: 'nets', name: 'Nets' },
    { id: 'knicks', name: 'Knicks' },
    { id: 'bucks', name: 'Bucks' },
    { id: 'suns', name: 'Suns' },
    { id: 'clippers', name: 'Clippers' },
    { id: 'spurs', name: 'Spurs' },
    { id: 'nuggets', name: 'Nuggets' },
    { id: 'thunder', name: 'Thunder' },
    { id: 'mavs', name: 'Mavs' },
    { id: 'raptors', name: 'Raptors' },
    { id: 'sixers', name: '76ers' },
  ],
}

export function getClubOptions(sport) {
  return CLUB_OPTIONS[sport] || CLUB_OPTIONS.football
}

export function getClubBankPath(sport, clubId) {
  if (!sport || !clubId) return null
  return `clubQuestions/${sport}/${clubId.toLowerCase()}`
}

export async function updateUserClubs(uid, footballClub, basketballTeam) {
  await update(ref(db, `users/${uid}/profile`), {
    favoriteFootballClub: footballClub,
    favoriteBasketballTeam: basketballTeam,
    clubsSelected: true,
    favoriteClubUpdatedAt: Date.now(),
    updatedAt: new Date().toISOString(),
  })
}

export async function getUserClubs(uid) {
  const snap = await get(ref(db, `users/${uid}/profile`))
  return snap.val()
}

export async function getClubQuestions(sport, clubId, count = 10) {
  if (!sport || !clubId) return []

  const bankPath = getClubBankPath(sport, clubId)
  const bankSnap = await get(ref(db, bankPath))
  const bankData = bankSnap.val()

  let clubQuestions = []

  if (bankData) {
    clubQuestions = Object.entries(bankData).map(([id, q]) => ({ id, ...q }))
  } else {
    const legacySnap = await get(ref(db, `questions/${sport}`))
    const allQuestions = legacySnap.val()
    if (allQuestions) {
      clubQuestions = Object.entries(allQuestions)
        .map(([id, q]) => ({ id, ...q }))
        .filter((q) => q.clubId && q.clubId.toLowerCase() === clubId.toLowerCase())
    }
  }

  return clubQuestions.sort(() => Math.random() - 0.5).slice(0, count)
}

export async function hasCompletedClubQuiz(weekKey, clubId, playerId) {
  const snap = await get(
    ref(db, `clubLeaderboards/${weekKey}/${clubId.toLowerCase()}/entries/${playerId}`)
  )
  return snap.exists()
}

export async function saveClubScore(weekKey, clubId, playerId, displayName, score, totalQuestions) {
  const accuracyPct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  await set(
    ref(db, `clubLeaderboards/${weekKey}/${clubId.toLowerCase()}/entries/${playerId}`),
    {
      playerId,
      displayName,
      score,
      totalQuestions,
      accuracyPct,
      completedAt: Date.now(),
    }
  )
}

export function listenToClubLeaderboard(weekKey, clubId, onData, onError) {
  const path = `clubLeaderboards/${weekKey}/${clubId.toLowerCase()}/entries`
  const unsub = onValue(
    ref(db, path),
    (snap) => {
      const data = snap.val()
      if (!data) {
        onData([])
        return
      }
      const entries = Object.values(data)
        .sort((a, b) => b.score - a.score || a.completedAt - b.completedAt)
        .map((e, i) => ({ ...e, rank: i + 1 }))
      onData(entries)
    },
    onError
  )
  return unsub
}
