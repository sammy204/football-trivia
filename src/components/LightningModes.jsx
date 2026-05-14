import { useState } from 'react'
import styles from './LightningModes.module.css'

export default function LightningModes({ sport, onBack, onStartSolo, onStartH2H, onViewLeaderboard }) {
  const [opponentPlayerId, setOpponentPlayerId] = useState('')
  const [inviteError, setInviteError] = useState('')
  const isBasketball = sport === 'basketball'

  function handleInvite() {
    const playerId = opponentPlayerId.trim()
    if (!playerId) {
      setInviteError('Enter Player ID')
      return
    }
    setInviteError('')
    onStartH2H({ sport, opponentPlayerId: playerId })
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.backBtn} onClick={onBack}>Back</button>
      <p className={styles.kicker}>Lightning</p>
      <h1 className={styles.title}>
        {isBasketball ? 'Basketball' : 'Football'} lightning
      </h1>
      <p className={styles.sub}>Pick a mode to start your 60-second challenge.</p>

      <div className={styles.grid}>
        <button className={styles.card} onClick={() => onStartSolo({ sport })}>
          <span className={styles.icon}>⚡</span>
          <span className={styles.cardTitle}>Solo</span>
          <span className={styles.cardCopy}>Play immediately and save your score to the lightning leaderboard.</span>
        </button>

        <div className={styles.cardStatic}>
          <span className={styles.icon}>🥊</span>
          <span className={styles.cardTitle}>1v1</span>
          <span className={styles.cardCopy}>Invite a friend using their Player ID.</span>
          <div className={styles.inviteRow}>
            <input
              className={styles.input}
              placeholder="Opponent Player ID"
              value={opponentPlayerId}
              onChange={(event) => {
                setOpponentPlayerId(event.target.value)
                if (inviteError) setInviteError('')
              }}
            />
            <button
              className={styles.inviteBtn}
              onClick={handleInvite}
              disabled={!opponentPlayerId.trim()}
            >
              Invite
            </button>
          </div>
          {inviteError && <p className={styles.error}>{inviteError}</p>}
        </div>
      </div>

      <button className={styles.ghostBtn} onClick={() => onViewLeaderboard(sport)}>
        View Lightning Leaderboard
      </button>
    </div>
  )
}
