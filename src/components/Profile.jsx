import { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { db } from '../lib/firebase'
import { loadProfile } from '../lib/profile'
import styles from './Profile.module.css'

const MILESTONES = [
  { id: 'wins10',    icon: '🏆', title: '10 Wins',        copy: 'Win 10 multiplayer matches.',         check: s => s.wins >= 10 },
  { id: 'wins50',    icon: '👑', title: '50 Wins',        copy: 'Win 50 multiplayer matches.',         check: s => s.wins >= 50 },
  { id: 'streak3',   icon: '🔥', title: '3-Day Streak',   copy: 'Play 3 days in a row.',               check: s => (s.bestStreak || 0) >= 3 },
  { id: 'streak7',   icon: '⚡', title: '7-Day Streak',   copy: 'Play 7 days in a row.',               check: s => (s.bestStreak || 0) >= 7 },
  { id: 'points50',  icon: '🎯', title: '50 Points',      copy: 'Accumulate 50 total points.',         check: s => (s.totalPoints || 0) >= 50 },
  { id: 'points100', icon: '💯', title: '100 Points',     copy: 'Accumulate 100 total points.',        check: s => (s.totalPoints || 0) >= 100 },
]

function formatStreakDate(dateKey) {
  if (!dateKey) return null
  try {
    return new Date(dateKey).toLocaleDateString()
  } catch {
    return dateKey
  }
}

export default function Profile({ user, onBack }) {
  const [stats, setStats] = useState(null)
  const [matches, setMatches] = useState([])
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user?.uid) {
      setError('Not signed in')
      setLoading(false)
      return
    }

    async function loadUserData() {
      try {
        // Load player ID — try localStorage first, then Firebase
        const cached = loadProfile()
        if (cached?.playerId) {
          setPlayerId(cached.playerId)
        } else {
          const playerIdSnap = await get(ref(db, `users/${user.uid}/playerId`))
          setPlayerId(playerIdSnap.val() || null)
        }

        // Load daily streak
        const streakSnap = await get(ref(db, `users/${user.uid}/dailyStreak`))
        setStreak(streakSnap.val() || null)

        // Load stats
        const statsSnap = await get(ref(db, `users/${user.uid}/stats`))
        const statsData = statsSnap.val() || { wins: 0, losses: 0, totalGames: 0, draws: 0 }

        // Load recent matches
        const matchesSnap = await get(ref(db, `users/${user.uid}/matches`))
        let allMatches = []
        if (matchesSnap.val()) {
          allMatches = Object.values(matchesSnap.val())
          const matchesData = allMatches.sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          )
          setMatches(matchesData.slice(0, 10))
        }

        // Calculate totals from match history (source of truth)
        const totalGames = allMatches.length
        const wins = allMatches.filter(m => m.result === 'win').length
        const losses = allMatches.filter(m => m.result === 'loss').length
        const draws = allMatches.filter(m => m.result === 'draw').length
        const totalPoints = allMatches.reduce((sum, m) => sum + (m.score || 0), 0)
        const winStreak = statsData.winStreak || 0
        const bestStreak = streakSnap.val()?.best || 0

        setStats({
          ...statsData,
          totalGames,
          wins,
          losses,
          draws,
          totalPoints,
          winStreak,
          bestStreak,
        })

        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Failed to load profile data')
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  function handleCopyId() {
    if (!playerId) return
    navigator.clipboard.writeText(playerId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!user) return null

  const unlockedMilestones = stats ? MILESTONES.filter(m => m.check(stats)) : []

  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Back
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.username}>{user.displayName || 'Player'}</p>
        <p className={styles.email}>{user.email}</p>

        {/* Player ID badge */}
        {playerId && (
          <div className={styles.playerIdRow}>
  <span className={styles.playerIdLabel}>Player ID</span>
  <span className={styles.playerIdValue}>{playerId}</span>
  <button className={styles.copyBtn} onClick={handleCopyId}>
    {copied ? '✅ Copied!' : 'Copy'}
  </button>
</div>
        )}
      </div>

      {loading ? (
        <p className={styles.loading}>Loading your stats...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          {/* Daily Streak Hero Card */}
          {streak && (
            <section className={styles.heroCard}>
              <div className={styles.heroTop}>
                <div>
                  <p className={styles.heroLabel}>Daily Streak</p>
                  <p className={styles.heroValue}>{streak.current || 0} Day{(streak.current || 0) !== 1 ? 's' : ''}</p>
                </div>
                <div className={styles.heroMeta}>
                  <span>Best: {streak.best || 0}</span>
                  {streak.lastPlayedDateKey && (
                    <span>Last played {formatStreakDate(streak.lastPlayedDateKey)}</span>
                  )}
                </div>
              </div>
              <p className={styles.heroCopy}>
                {streak.current > 0
                  ? 'Keep your streak alive by playing the daily challenge again tomorrow.'
                  : 'Play the daily challenge to start your streak!'}
              </p>
            </section>
          )}

          {/* Stats */}
          <section className={styles.statsCard}>
            <h2 className={styles.sectionTitle}>Stats</h2>
            <div className={styles.statGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Games Played</span>
                <span className={styles.statValue}>{stats?.totalGames || 0}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Wins</span>
                <span className={styles.statValue} style={{ color: '#00FF87' }}>
                  {stats?.wins || 0}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Losses</span>
                <span className={styles.statValue} style={{ color: '#FF5C5C' }}>
                  {stats?.losses || 0}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Win Streak</span>
                <span className={styles.statValue} style={{ color: '#FFD700' }}>
                  {stats?.winStreak || 0}
                </span>
              </div>
            </div>
          </section>

          {/* Milestones */}
          <section className={styles.statsCard}>
            <h2 className={styles.sectionTitle}>Milestones</h2>
            {unlockedMilestones.length > 0 ? (
              <div className={styles.badgeGrid}>
                {unlockedMilestones.map(m => (
                  <div key={m.id} className={styles.badgeCard}>
                    <div className={styles.badgeIcon}>{m.icon}</div>
                    <div>
                      <p className={styles.badgeTitle}>{m.title}</p>
                      <p className={styles.badgeCopy}>{m.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noMilestones}>
                No badges unlocked yet. Your first ones arrive at 10 wins, 50 total points, and a 3-day daily streak.
              </p>
            )}
          </section>

          {/* Recent Matches */}
          {matches.length > 0 && (
            <section className={styles.matchesCard}>
              <h2 className={styles.sectionTitle}>Recent Matches</h2>
              <div className={styles.matchesList}>
                {matches.map((match, idx) => (
                  <div key={idx} className={styles.matchItem}>
                    <div className={styles.matchHeader}>
                      <span className={styles.opponent}>
                        vs {match.opponentName || 'Unknown'}
                      </span>
                      <span
                        className={styles.result}
                        style={{
                          color: match.result === 'win' ? '#00FF87' : '#FF5C5C',
                        }}
                      >
                        {match.result === 'win' ? 'WON' : 'LOST'}
                      </span>
                    </div>
                    <div className={styles.matchDetails}>
                      <span>{match.sport === 'basketball' ? '🏀' : '⚽'} {match.sport}</span>
                      <span>
                        {match.date ? new Date(match.date).toLocaleDateString() : 'Unknown date'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {matches.length === 0 && (
            <p className={styles.noMatches}>
              No matches yet. Start playing online to see your game history!
            </p>
          )}
        </>
      )}
    </div>
  )
}