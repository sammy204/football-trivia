import {db} from './firebase'
import {ref, set, get, update, onValue, off, push, serverTimestamp} from 'firebase/database'

function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
 
/** Shuffle an array in place (Fisher-Yates) */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
 
/**
 * Build an empty single-elimination bracket from a seeded player list.
 * Players list must be a power of 2 (pad with "BYE" if needed externally).
 *
 * Returns: rounds[]  — each round is an array of match objects:
 *   { p1, p2, winner: null, roomCode: null, status: "pending" }
 */
function buildBracket(seededPlayers) {
  const rounds = [];
  let current = seededPlayers;
 
  while (current.length > 1) {
    const round = [];
    for (let i = 0; i < current.length; i += 2) {
     const match = {
  p1: current[i],
  winner: null,
  roomCode: null,
  status: "pending",
};
if (current[i + 1] !== undefined && current[i + 1] !== null) {
  match.p2 = current[i + 1];
}
round.push(match);
    }
    rounds.push(round);
    // Placeholder slots for the next round (filled as matches complete)
    current = round.map(() => null);
  }
 
  return rounds;
}
 
/**
 * Nearest power of 2 >= n (for bracket sizing).
 */
function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
 
// ─── Tournament CRUD ─────────────────────────────────────────────────────────
 
/**
 * Create a new tournament.
 *
 * @param {object} opts
 * @param {string} opts.hostUid
 * @param {string} opts.hostName
 * @param {string} opts.name         Tournament display name
 * @param {"football"|"basketball"} opts.sport
 * @param {"public"|"private"} opts.visibility
 * @param {number} opts.maxPlayers   Must be 4, 8, 16, or 32
 * @param {number} opts.startTime    Unix ms timestamp
 *
 * @returns {Promise<string>} tournamentCode
 */
export async function createTournament({
  hostUid,
  hostName,
  name,
  sport,
  visibility,
  maxPlayers,
  startTime,
}) {
  const code = generateCode();
  const tournamentRef = ref(db, `tournaments/${code}`);
 
  await set(tournamentRef, {
    code,
    host: hostUid,
    hostName,
    name,
    sport,
    visibility,
    maxPlayers,
    startTime,
    status: "waiting", // waiting | active | complete
    createdAt: serverTimestamp(),
    players: {
      [hostUid]: { name: hostName, seed: null, joinedAt: Date.now() },
    },
    bracket: null,
    winner: null,
  });
 
  return code;
}
 
/**
 * Join a tournament by code.
 *
 * @param {string} code
 * @param {string} uid
 * @param {string} displayName
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function joinTournament(code, uid, displayName) {
  const tournamentRef = ref(db, `tournaments/${code}`);
  const snap = await get(tournamentRef);
 
  if (!snap.exists()) return { success: false, error: "Tournament not found." };
 
  const t = snap.val();
 
  if (t.status !== "waiting")
    return { success: false, error: "Tournament has already started." };
 
  const currentPlayers = t.players ? Object.keys(t.players) : [];
 
  if (currentPlayers.includes(uid))
    return { success: true }; // already joined — idempotent
 
  if (currentPlayers.length >= t.maxPlayers)
    return { success: false, error: "Tournament is full." };
 
  await update(ref(db, `tournaments/${code}/players`), {
    [uid]: { name: displayName, seed: null, joinedAt: Date.now() },
  });
 
  return { success: true };
}
 
/**
 * Fetch a tournament snapshot once.
 * @param {string} code
 * @returns {Promise<object|null>}
 */
export async function getTournament(code) {
  const snap = await get(ref(db, `tournaments/${code}`));
  return snap.exists() ? snap.val() : null;
}
 
/**
 * Subscribe to live tournament updates.
 * @param {string} code
 * @param {function} callback  Called with tournament data object (or null)
 * @returns {function} unsubscribe
 */
export function subscribeTournament(code, callback) {
  const tournamentRef = ref(db, `tournaments/${code}`);
  const handler = (snap) => callback(snap.exists() ? snap.val() : null);
  onValue(tournamentRef, handler);
  return () => off(tournamentRef, "value", handler);
}
 
/**
 * Fetch all public tournaments that are still in "waiting" status.
 * @returns {Promise<object[]>}
 */
export async function getPublicTournaments() {
  const snap = await get(ref(db, "tournaments"));
  if (!snap.exists()) return [];
 
  const all = snap.val();
  return Object.values(all).filter(
    (t) => t.visibility === "public" && t.status === "waiting"
  );
}
 
// ─── Tournament Start ─────────────────────────────────────────────────────────
 
/**
 * Start a tournament: seed players, build the bracket, set status to "active".
 * Only the host should call this.
 *
 * @param {string} code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function startTournament(code) {
  const t = await getTournament(code);
  if (!t) return { success: false, error: "Tournament not found." };
  if (t.status !== "waiting")
    return { success: false, error: "Tournament already started." };
 
  const playerEntries = Object.entries(t.players || {});
  if (playerEntries.length < 2)
    return { success: false, error: "Need at least 2 players to start." };
 
  // Pad to nearest power of 2 with BYE slots
  const bracketSize = nextPow2(playerEntries.length);
  const seeded = shuffle(playerEntries.map(([uid]) => uid));
  while (seeded.length < bracketSize) seeded.push("BYE");
 
  // Assign seeds back to players
  const seedUpdates = {};
  seeded.forEach((uid, idx) => {
    if (uid !== "BYE") {
      seedUpdates[`tournaments/${code}/players/${uid}/seed`] = idx + 1;
    }
  });
 
  const bracket = buildBracket(seeded);
 
  // Generate a room code for every non-BYE first-round match
  const roundZeroUpdates = {};
  bracket[0].forEach((match, idx) => {
    if (match.p2 !== "BYE") {
      const roomCode = generateCode(6);
      bracket[0][idx].roomCode = roomCode;
    } else {
      // Auto-advance BYE matches
      bracket[0][idx].winner = match.p1;
      bracket[0][idx].status = "complete";
    }
  });
 
  await update(ref(db, "/"), {
    ...seedUpdates,
    [`tournaments/${code}/status`]: "active",
    [`tournaments/${code}/bracket`]: bracket,
  });
 
  // If any first-round matches had BYEs, advance the bracket immediately
  const updatedT = { ...t, bracket, status: "active" };
  await _resolveByesInRound(code, null, 0);
 
  return { success: true };
}
 
// ─── Match Management ────────────────────────────────────────────────────────
 
/**
 * Record the winner of a match and advance the bracket.
 * Called after a 1v1 room finishes.
 *
 * @param {string} tournamentCode
 * @param {number} roundIndex
 * @param {number} matchIndex
 * @param {string} winnerUid
 */
export async function recordMatchWinner(
  tournamentCode,
  roundIndex,
  matchIndex,
  winnerUid
) {
  const t = await getTournament(tournamentCode);
  if (!t || !t.bracket) return;
 
  const bracket = t.bracket;
 
  // Update the match
  bracket[roundIndex][matchIndex].winner = winnerUid;
  bracket[roundIndex][matchIndex].status = "complete";
 
  // Check if this round is fully complete
  const roundComplete = bracket[roundIndex].every((m) => m.winner !== null);
 
  if (roundComplete) {
    const nextRoundIndex = roundIndex + 1;
 
    if (nextRoundIndex >= bracket.length) {
      // Tournament is over
      await update(ref(db, `tournaments/${tournamentCode}`), {
        bracket,
        status: "complete",
        winner: winnerUid,
      });
      await _saveTournamentToProfiles(tournamentCode, t, winnerUid);
      return;
    }
 
    // Advance winners into the next round
    const winners = bracket[roundIndex].map((m) => m.winner);
    for (let i = 0; i < winners.length; i += 2) {
      const matchI = Math.floor(i / 2);
      bracket[nextRoundIndex][matchI].p1 = winners[i];
      bracket[nextRoundIndex][matchI].p2 = winners[i + 1] ?? null;
 
      if (bracket[nextRoundIndex][matchI].p2 !== "BYE") {
        bracket[nextRoundIndex][matchI].roomCode = generateCode(6);
      } else {
        bracket[nextRoundIndex][matchI].winner = winners[i];
        bracket[nextRoundIndex][matchI].status = "complete";
      }
    }
  }
 
  await update(ref(db, `tournaments/${tournamentCode}`), { bracket });
 
  // Recurse if new BYEs were introduced
  if (roundComplete && roundIndex + 1 < bracket.length) {
    const updatedT = { ...t, bracket };
    await _resolveByesInRound(tournamentCode, null, roundIndex + 1);
  }
}
 
/**
 * Get the room code for a specific match.
 * @param {string} tournamentCode
 * @param {number} roundIndex
 * @param {number} matchIndex
 * @returns {Promise<string|null>}
 */
export async function getMatchRoomCode(
  tournamentCode,
  roundIndex,
  matchIndex
) {
  const snap = await get(
    ref(
      db,
      `tournaments/${tournamentCode}/bracket/${roundIndex}/${matchIndex}/roomCode`
    )
  );
  return snap.exists() ? snap.val() : null;
}
 
/**
 * Mark a match as active (players are in the room).
 */
export async function setMatchActive(tournamentCode, roundIndex, matchIndex) {
  await update(
    ref(
      db,
      `tournaments/${tournamentCode}/bracket/${roundIndex}/${matchIndex}`
    ),
    { status: "active" }
  );
}
 
// ─── Internal Helpers ────────────────────────────────────────────────────────
 
/**
 * Auto-resolve any BYE matches in a given round.
 * @private
 */
async function _resolveByesInRound(code, _, roundIndex) {
  // Always fetch fresh from Firebase — never trust the local copy
  const fresh = await getTournament(code);
  if (!fresh || !fresh.bracket || !fresh.bracket[roundIndex]) return;

  const bracket = fresh.bracket;
  let changed = false;

  bracket[roundIndex].forEach((match, idx) => {
    if (match.p2 === "BYE" && match.winner === null && match.p1 !== null) {
      bracket[roundIndex][idx].winner = match.p1;
      bracket[roundIndex][idx].status = "complete";
      changed = true;
    }
  });

  if (!changed) return;

  await update(ref(db, `tournaments/${code}`), { bracket });

  // Check if this round is now complete after BYE resolution,
  // and if so, advance winners into the next round
  const roundComplete = bracket[roundIndex].every((m) => m.winner !== null);
  if (roundComplete && roundIndex + 1 < bracket.length) {
    const winners = bracket[roundIndex].map((m) => m.winner);
    for (let i = 0; i < winners.length; i += 2) {
      const matchI = Math.floor(i / 2);
      bracket[roundIndex + 1][matchI].p1 = winners[i];
      bracket[roundIndex + 1][matchI].p2 = winners[i + 1] || "BYE";

      if (bracket[roundIndex + 1][matchI].p2 !== "BYE") {
        bracket[roundIndex + 1][matchI].roomCode = generateCode(6);
      } else {
        bracket[roundIndex + 1][matchI].winner = winners[i];
        bracket[roundIndex + 1][matchI].status = "complete";
      }
    }
    await update(ref(db, `tournaments/${code}`), { bracket });
    await _resolveByesInRound(code, null, roundIndex + 1);
  }
}
/**
 * Save tournament result to both finalists' profiles and award winner badge.
 * Mirrors the pattern from userStats.js.
 * @private
 */
async function _saveTournamentToProfiles(code, tournament, winnerUid) {
  const players = tournament.players || {};
  const timestamp = Date.now();
 
  const updates = {};
 
  Object.keys(players).forEach((uid) => {
    const isWinner = uid === winnerUid;
 
    // Save to match history
    updates[`userStats/${uid}/tournamentHistory/${code}`] = {
      tournamentCode: code,
      tournamentName: tournament.name,
      sport: tournament.sport,
      result: isWinner ? "winner" : "eliminated",
      playedAt: timestamp,
    };
 
    // Award winner badge
    if (isWinner) {
      updates[`userStats/${uid}/badges/tournamentWinner`] = {
        awardedAt: timestamp,
        tournamentCode: code,
        tournamentName: tournament.name,
      };
    }
  });
 
  await update(ref(db, "/"), updates);
}
 
// ─── Utility Exports ─────────────────────────────────────────────────────────
 
/**
 * Find the match a given player needs to play in the current active round.
 * Returns { roundIndex, matchIndex, match } or null.
 */
export function findPlayerMatch(bracket, uid) {
  if (!bracket) return null;
 
  for (let r = 0; r < bracket.length; r++) {
    for (let m = 0; m < bracket[r].length; m++) {
      const match = bracket[r][m];
      if (
        match.status !== "complete" &&
        (match.p1 === uid || match.p2 === uid)
      ) {
        return { roundIndex: r, matchIndex: m, match };
      }
    }
  }
  return null;
}
 
/**
 * Return the display name for a player uid from the players map.
 * Falls back to a shortened uid.
 */
export function getPlayerName(players, uid) {
  if (!uid || uid === "null") return "TBD";
  if (uid === "BYE") return "BYE";
  return players?.[uid]?.name || uid?.slice(0, 8) || "Unknown";
}
 
/**
 * Return round label: "Round of 16", "Quarterfinal", "Semifinal", "Final"
 */
export function getRoundLabel(totalRounds, roundIndex) {
  const roundsLeft = totalRounds - roundIndex;
  if (roundsLeft === 1) return "Final";
  if (roundsLeft === 2) return "Semifinal";
  if (roundsLeft === 3) return "Quarterfinal";
  return `Round of ${Math.pow(2, roundsLeft)}`;
}