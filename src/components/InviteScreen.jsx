import { useState } from 'react'
import { respondToInvite } from '../lib/teamMultiplayer'
import { loadProfile } from '../lib/profile'
import { spendCoins, TEAM_PLAYER_WAGER } from '../lib/coins'
import { getPlayerAvatar } from '../lib/avatars'
import styles from './InviteScreen.module.css'

export default function InviteScreen({ invites, user, onAccepted, onClose }) {
  const [loading, setLoading] = useState(null) // inviteId being processed
  const [error, setError] = useState(null)

  if (!invites || invites.length === 0) return null

  const profile = loadProfile()
  const playerId = profile?.playerId
  const playerAvatar = getPlayerAvatar(user, profile)

  async function handle(invite, accept) {
    if (!playerId || !user?.uid) return
    const inviteWager = Math.max(TEAM_PLAYER_WAGER, Math.round(Number(invite.wager) || 0))
    setLoading(invite.id)
    setError(null)
    try {
      if (accept) {
        const stake = await spendCoins({
          userId: user.uid,
          amount: inviteWager,
          reason: 'team_stake',
          sourceId: `team-stake-invite:${invite.roomCode}:${user.uid}`,
          metadata: { roomCode: invite.roomCode, teamId: invite.teamId, sport: invite.sport },
        })
        if (!stake.ok) {
          setError(`You need ${inviteWager} coins to accept this team invite.`)
          setLoading(null)
          return
        }
      }

      await respondToInvite({
        playerId,
        inviteId: invite.id,
        accept,
        uid: user.uid,
        displayName: user.displayName || 'Player',
        roomCode: invite.roomCode,
        teamId: invite.teamId,
        wager: inviteWager,
        photoURL: playerAvatar,
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
                <p className={styles.inviteMeta}>
                  Entry stake: {Math.max(TEAM_PLAYER_WAGER, Math.round(Number(invite.wager) || 0))} coins
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
