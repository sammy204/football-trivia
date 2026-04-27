import { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { db } from '../lib/firebase'
import styles from './Profile.module.css'

export default function Profile({ user, onBack }) {
  const [stats, setStats] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.uid) {
      setError('Not signed in')
      setLoading(false)
      return
    }

    async function loadUserData() {
      try {
        // Load stats
        const statsRef = ref(db, `users/${user.uid}/stats`)
        const statsSnap = await get(statsRef)
        setStats(statsSnap.val() || { wins: 0, losses: 0, gamesPlayed: 0 })

        // Load recent matches
        const matchesRef = ref(db, `users/${user.uid}/matches`)
        const matchesSnap = await get(matchesRef)
        if (matchesSnap.val()) {
          const matchesData = Object.values(matchesSnap.val()).sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          )
          setMatches(matchesData.slice(0, 10))
        }

        setLoading(false)
      } catch (err) {
        setError('Failed to load profile data')
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  if (!user) return null

  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Back
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.username}>{user.displayName || 'Player'}</p>
        <p className={styles.email}>{user.email}</p>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading your stats...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <section className={styles.statsCard}>
            <h2 className={styles.sectionTitle}>Stats</h2>
            <div className={styles.statGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Games Played</span>
                <span className={styles.statValue}>{stats?.gamesPlayed || 0}</span>
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
            </div>
          </section>

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
                        {new Date(match.timestamp || 0).toLocaleDateString()}
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
