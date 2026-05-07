import { useState } from 'react'
import { respondToInvite } from '../lib/teamMultiplayer'
import { loadProfile } from '../lib/profile'
import styles from './InviteScreen.module.css'

export default function InviteScreen({ invites, user, onAccepted, onClose }) {
  const [loading, setLoading] = useState(null) // inviteId being processed
  const [error, setError] = useState(null)

  if (!invites || invites.length === 0) return null

  const profile = loadProfile()
  const playerId = profile?.playerId

  async function handle(invite, accept) {
    if (!playerId || !user?.uid) return
    setLoading(invite.id)
    setError(null)
    try {
      await respondToInvite({
        playerId,
        inviteId: invite.id,
        accept,
        uid: user.uid,
        displayName: user.displayName || 'Player',
        roomCode: invite.roomCode,
        teamId: invite.teamId,
      })
      if (accept) {
        onAccepted({ roomCode: invite.roomCode, teamId: invite.teamId, sport: invite.sport })
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(null)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Team Invites</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p className={styles.sub}>You have {invites.length} pending invite{invites.length > 1 ? 's' : ''}</p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.list}>
          {invites.map(invite => (
            <div key={invite.id} className={styles.inviteCard}>
              <div className={styles.inviteInfo}>
                <p className={styles.inviteName}>
                  <span className={styles.teamBadge}>{invite.teamName}</span>
                </p>
                <p className={styles.inviteMeta}>
                  Invited by <strong>{invite.hostDisplayName}</strong> · {invite.sport === 'basketball' ? '🏀' : '⚽'} {invite.sport}
                </p>
              </div>
              <div className={styles.inviteActions}>
                <button
                  className={styles.declineBtn}
                  onClick={() => handle(invite, false)}
                  disabled={loading === invite.id}
                >
                  Decline
                </button>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handle(invite, true)}
                  disabled={loading === invite.id}
                >
                  {loading === invite.id ? '...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}