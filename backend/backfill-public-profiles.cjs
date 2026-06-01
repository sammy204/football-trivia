const path = require('path')
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, '.env.backend'),
})
const admin = require('firebase-admin')

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || (process.platform === 'win32'
    ? path.join(__dirname, 'serviceAccountKey.json')
    : '/etc/secrets/serviceAccountKey.json')

const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://sports-trivia-85170-default-rtdb.firebaseio.com',
  })
}

const rtdb = admin.database()

function buildRecentForm(matches = [], count = 5) {
  return [...matches]
    .filter((match) => !match?.isTeamGame)
    .sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0))
    .slice(-count)
    .map((match) => match?.result || 'draw')
    .map((result) => (result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D'))
    .join('')
}

function calculateWinStreak(matches = []) {
  const sortedMatches = [...matches].sort((a, b) => {
    const aTime = new Date(a?.date || a?.timestamp || 0).getTime()
    const bTime = new Date(b?.date || b?.timestamp || 0).getTime()
    return bTime - aTime
  })

  let streak = 0
  for (const match of sortedMatches) {
    if (match?.result === 'win') {
      streak += 1
      continue
    }
    break
  }

  return streak
}

async function backfillPublicProfiles() {
  const usersSnap = await rtdb.ref('users').get()
  const users = usersSnap.val() || {}
  const updates = {}
  let processed = 0

  for (const [uid, user] of Object.entries(users)) {
    const playerId = String(user?.playerId || '').trim().toUpperCase()
    if (!playerId) continue

    const matches = user?.matches ? Object.values(user.matches) : []
    const stats = user?.stats || {}
    const profile = user?.profile || {}
    const displayName = String(profile?.displayName || profile?.username || user?.displayName || user?.username || 'Player').trim() || 'Player'
    const winStreak = Number(stats?.winStreak) || calculateWinStreak(matches)
    const recentForm = buildRecentForm(matches, 5)

    updates[`publicProfiles/${playerId}`] = {
      playerId,
      displayName,
      winStreak,
      recentForm: recentForm || '',
      updatedAt: new Date().toISOString(),
      backfilledAt: new Date().toISOString(),
      sourceUid: uid,
    }

    processed += 1
  }

  if (!processed) {
    console.log('No users with player IDs were found to backfill.')
    return
  }

  await rtdb.ref().update(updates)
  console.log(`Backfilled ${processed} public profile(s).`)
}

backfillPublicProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
