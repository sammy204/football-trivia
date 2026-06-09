import { db } from './firebase'
import { ref, set, get, update, onValue, off, runTransaction } from 'firebase/database'

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ─── Create a Best of 3 series room ───────────────────────────────────────────
export async function createSeriesRoom({
  playerName,
  questionsRound1,
  questionsRound2,
  questionsRound3,
  rounds,
  sport,
  hostUid,
  wager = 0,
  hostPhotoURL = null,
}) {
  const code = generateRoomCode()
  const roomRef = ref(db, `bestOfThree/${code}`)
  await set(roomRef, {
    code,
    sport,
    rounds,
    status: 'waiting',
    currentQuestion: 0,
    questions: questionsRound1,
    questionState: {
      answerCount: 0,
      resolved: false,
      winner: null,
    },
    players: {
      host: { name: playerName, uid: hostUid || null, score: 0, answered: false, photoURL: hostPhotoURL },
    },
    wager: {
      amount: wager,
      pot: wager,
      paid: hostUid ? { [hostUid]: wager } : {},
      settled: false,
    },
    answers: {},
    // Store all 3 rounds' questions upfront
    roundQuestions: {
      1: questionsRound1,
      2: questionsRound2,
      3: questionsRound3,
    },
    series: {
      currentRound: 1,
      hostRoundWins: 0,
      guestRoundWins: 0,
      roundSummaries: {},
      intermissionEndsAt: null,
      winnerRole: null,
    },
  })
  return code
}

// ─── Join an existing series room ─────────────────────────────────────────────
export async function joinSeriesRoom({ code, playerName, guestUid, guestPhotoURL = null }) {
  const roomRef = ref(db, `bestOfThree/${code}`)
  const snapshot = await get(roomRef)
  if (!snapshot.exists()) throw new Error('Room not found.')
  const room = snapshot.val()
  if (room.status !== 'waiting') throw new Error('Series already started.')

  await update(ref(db, `bestOfThree/${code}/players`), {
    guest: { name: playerName, uid: guestUid || null, score: 0, answered: false, photoURL: guestPhotoURL },
  })

  if (guestUid && room.wager?.amount) {
    await update(ref(db, `bestOfThree/${code}/wager`), {
      pot: (room.wager?.pot || 0) + (room.wager?.amount || 0),
      [`paid/${guestUid}`]: room.wager.amount,
    })
  }

  return room
}

// ─── Start a round (host calls this) ──────────────────────────────────────────
export async function startSeriesRound(code) {
  const roomSnap = await get(ref(db, `bestOfThree/${code}`))
  if (!roomSnap.exists()) throw new Error('Room not found.')
  const room = roomSnap.val()
  const currentRound = room?.series?.currentRound || 1
  const questions = room?.roundQuestions?.[currentRound] || room?.questions || []

  await update(ref(db, `bestOfThree/${code}`), {
    status: 'playing',
    currentQuestion: 0,
    questions,
    answers: {},
    questionState: {
      answerCount: 0,
      resolved: false,
      winner: null,
    },
    'players/host/score': 0,
    'players/host/answered': false,
    'players/guest/score': 0,
    'players/guest/answered': false,
    'series/intermissionEndsAt': null,
  })
}

// ─── Submit an answer (mirrors multiplayer.js exactly) ────────────────────────
export async function submitAnswer({ code, role, qIndex, answer, correct }) {
  await update(ref(db, `bestOfThree/${code}/answers/${qIndex}`), {
    [role]: { answer, correct },
  })
  await update(ref(db, `bestOfThree/${code}/players/${role}`), { answered: true })

  const stateRef = ref(db, `bestOfThree/${code}/questionState`)
  const { snapshot } = await runTransaction(stateRef, (state) => {
    const nextState = state || { answerCount: 0, resolved: false, winner: null }
    if (nextState.resolved) return nextState

    const answerCount = (nextState.answerCount || 0) + 1
    const winner = correct && !nextState.winner ? role : nextState.winner || null
    const resolved = Boolean(winner) || answerCount >= 2

    return { answerCount, resolved, winner }
  })

  const nextState = snapshot.val()
  if (correct && nextState?.winner === role) {
    await runTransaction(ref(db, `bestOfThree/${code}/players/${role}/score`), (score) => (score || 0) + 1)
  }
}

// ─── Advance to next question or end the round ────────────────────────────────
export async function nextQuestion({ code, qIndex, total }) {
  if (qIndex + 1 >= total) {
    // Round is over — record result and go to intermission or finish
    await endRound(code)
  } else {
    await update(ref(db, `bestOfThree/${code}`), {
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

// ─── End a round, update series wins, go to intermission or finish ─────────────
async function endRound(code) {
  const roomSnap = await get(ref(db, `bestOfThree/${code}`))
  if (!roomSnap.exists()) return
  const room = roomSnap.val()

  const hostScore = room?.players?.host?.score || 0
  const guestScore = room?.players?.guest?.score || 0
  // First correct answer logic means no draws — but just in case, host wins ties
  const roundWinner = hostScore >= guestScore ? 'host' : 'guest'

  const currentRound = room?.series?.currentRound || 1
  const hostRoundWins = (room?.series?.hostRoundWins || 0) + (roundWinner === 'host' ? 1 : 0)
  const guestRoundWins = (room?.series?.guestRoundWins || 0) + (roundWinner === 'guest' ? 1 : 0)

  const roundSummary = {
    roundWinner,
    hostScore,
    guestScore,
  }

  // Someone won 2 rounds — series over
  const seriesOver = hostRoundWins >= 2 || guestRoundWins >= 2

  if (seriesOver) {
    await update(ref(db, `bestOfThree/${code}`), {
      status: 'finished',
      'series/hostRoundWins': hostRoundWins,
      'series/guestRoundWins': guestRoundWins,
      'series/winnerRole': hostRoundWins > guestRoundWins ? 'host' : 'guest',
      [`series/roundSummaries/${currentRound}`]: roundSummary,
    })
  } else {
    // Go to intermission, set 10 second countdown
    const intermissionEndsAt = Date.now() + 10_000
    await update(ref(db, `bestOfThree/${code}`), {
      status: 'intermission',
      'series/currentRound': currentRound + 1,
      'series/hostRoundWins': hostRoundWins,
      'series/guestRoundWins': guestRoundWins,
      'series/intermissionEndsAt': intermissionEndsAt,
      [`series/roundSummaries/${currentRound}`]: roundSummary,
    })
  }
}

// ─── Forfeit — loser calls this on back/leave ──────────────────────────────────
export async function forfeitSeries(code, losingRole) {
  const winnerRole = losingRole === 'host' ? 'guest' : 'host'
  await update(ref(db, `bestOfThree/${code}`), {
    status: 'finished',
    'series/winnerRole': winnerRole,
    'series/finishedReason': 'forfeit',
  })
}

// ─── Listen to room ────────────────────────────────────────────────────────────
export function listenToRoom(code, callback) {
  const roomRef = ref(db, `bestOfThree/${code}`)
  onValue(roomRef, (snap) => callback(snap.val()))
  return () => off(roomRef)
}