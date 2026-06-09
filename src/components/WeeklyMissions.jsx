import { useState, useEffect } from 'react'
import { getOrCreateWeeklyMissions, claimWeeklyReward } from '../lib/missions'
import { awardCoins } from '../lib/coins'

const WEEKLY_REWARD = 100

export default function WeeklyMissions({ user, coinBalance, onBack, onCoinsUpdated }) {
  const [missions, setMissions] = useState([])
  console.log('WeeklyMissions mounted, user:', user?.uid)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)

  const allComplete = missions.length > 0 && missions.every(m => m.completed)
  const canClaim = allComplete && !claimed

  useEffect(() => {
    if (!user?.uid) return
    getOrCreateWeeklyMissions(user.uid)
      .then(({ missions, claimed }) => {
        setMissions(missions)
        setClaimed(claimed)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user?.uid])

  async function handleClaim() {
    if (!canClaim || claiming) return
    setClaiming(true)
    try {
      const result = await claimWeeklyReward(user.uid)
      if (result.ok) {
        await awardCoins({
          userId: user.uid,
          amount: WEEKLY_REWARD,
          reason: 'weekly_missions_reward',
          sourceId: `weekly-missions:${user.uid}:${Date.now()}`,
          metadata: { weeklyReward: true },
        })
        setClaimed(true)
        setClaimSuccess(true)
        onCoinsUpdated?.()
      }
    } catch (e) {
      console.error('Failed to claim weekly reward:', e)
    }
    setClaiming(false)
  }

  if (loading) {
    return (
      <div style={styles.wrap}>
        <button style={styles.backBtn} onClick={onBack}>Back</button>
        <p style={styles.muted}>Loading missions...</p>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      <button style={styles.backBtn} onClick={onBack}>Back</button>

      <div style={styles.header}>
        <h1 style={styles.title}>WEEKLY MISSIONS</h1>
        <p style={styles.muted}>Complete all 4 to claim 100 coins</p>
      </div>

      {/* Progress bar */}
      <div style={styles.progressWrap}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${(missions.filter(m => m.completed).length / 4) * 100}%`,
            }}
          />
        </div>
        <p style={styles.progressLabel}>
          {missions.filter(m => m.completed).length} / 4 complete
        </p>
      </div>

      {/* Mission cards */}
      <div style={styles.missionList}>
        {missions.map((mission) => (
          <div
            key={mission.id}
            style={{
              ...styles.missionCard,
              ...(mission.completed ? styles.missionCardComplete : {}),
            }}
          >
            <div style={styles.missionLeft}>
              <span style={styles.missionIcon}>
                {mission.completed ? '✅' : '🎯'}
              </span>
              <div>
                <p style={styles.missionLabel}>{mission.label}</p>
                <p style={styles.missionDesc}>{mission.description}</p>
              </div>
            </div>
            <div style={styles.missionRight}>
              <p style={{
                ...styles.missionProgress,
                color: mission.completed ? '#00FF87' : 'rgba(230,240,232,0.45)',
              }}>
                {mission.progress}/{mission.target}
              </p>
              {/* Mini progress bar */}
              <div style={styles.miniTrack}>
                <div style={{
                  ...styles.miniFill,
                  width: `${Math.min((mission.progress / mission.target) * 100, 100)}%`,
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Claim button */}
      <div style={styles.claimWrap}>
        {claimSuccess && (
          <div style={styles.successBanner}>
            🎉 100 coins claimed! Well done.
          </div>
        )}
        <button
          style={{
            ...styles.claimBtn,
            ...(canClaim ? styles.claimBtnActive : styles.claimBtnDisabled),
          }}
          onClick={handleClaim}
          disabled={!canClaim || claiming}
        >
          {claiming
            ? 'Claiming...'
            : claimed
            ? '✅ Reward Claimed'
            : canClaim
            ? '🏆 Claim 100 Coins'
            : `Complete all missions to claim`}
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '2rem 1.25rem 4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minHeight: '100vh',
  },
  backBtn: {
    background: 'transparent',
    color: 'rgba(230,240,232,0.45)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    fontFamily: 'DM Sans, sans-serif',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 38,
    fontWeight: 900,
    color: '#f5f5f0',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  muted: {
    color: 'rgba(230,240,232,0.45)',
    fontSize: 14,
    margin: 0,
  },
  progressWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  progressTrack: {
    height: 8,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#00FF87',
    borderRadius: 999,
    transition: 'width 0.4s ease',
  },
  progressLabel: {
    color: 'rgba(230,240,232,0.45)',
    fontSize: 12,
    margin: 0,
    textAlign: 'right',
  },
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  missionCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  missionCardComplete: {
    border: '1px solid rgba(0,255,135,0.28)',
    background: 'rgba(0,255,135,0.06)',
  },
  missionLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  missionIcon: {
    fontSize: 22,
    flexShrink: 0,
  },
  missionLabel: {
    color: '#f5f5f0',
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
  },
  missionDesc: {
    color: 'rgba(230,240,232,0.45)',
    fontSize: 12,
    margin: '2px 0 0',
  },
  missionRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  missionProgress: {
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
  },
  miniTrack: {
    width: 60,
    height: 4,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    background: '#00FF87',
    borderRadius: 999,
    transition: 'width 0.3s ease',
  },
  claimWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
  },
  successBanner: {
    background: 'rgba(0,255,135,0.12)',
    border: '1px solid rgba(0,255,135,0.28)',
    borderRadius: 12,
    padding: '12px 16px',
    color: '#00FF87',
    fontWeight: 700,
    fontSize: 14,
    textAlign: 'center',
  },
  claimBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.2s',
  },
  claimBtnActive: {
    background: '#00FF87',
    color: '#08180d',
    boxShadow: '0 4px 20px rgba(0,255,135,0.25)',
  },
  claimBtnDisabled: {
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(230,240,232,0.45)',
    cursor: 'not-allowed',
  },
}