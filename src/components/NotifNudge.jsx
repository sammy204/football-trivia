import { useState } from 'react'

const STORAGE_KEY = 'trivela_notif_nudge_dismissed'
const SNOOZE_DAYS = 2

export function shouldShowNudge() {
  // Only for PWA
  //if (!window.matchMedia('(display-mode: standalone)').matches) return false
  // Don't show if already granted
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return false

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return true

  const { timestamp } = JSON.parse(stored)
  const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
  return daysSince >= SNOOZE_DAYS
}

export default function NotifNudge({ user, onDismiss }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function handleEnable() {
    setBusy(true)
    try {
      const { requestPushNotificationPermission, subscribeUserToPush } = await import('../lib/pushNotifications')
      const granted = await requestPushNotificationPermission()
      if (granted) {
        await subscribeUserToPush(user)
        localStorage.removeItem(STORAGE_KEY)
        setDone(true)
        setTimeout(() => onDismiss?.(), 1500)
      } else {
        handleLater()
      }
    } catch {
      handleLater()
    }
    setBusy(false)
  }

  function handleLater() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }))
    onDismiss?.()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: '0 0 32px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, margin: '0 16px',
        background: '#0f2518', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '24px 20px',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
      }}>
        {done ? (
          <p style={{ color: '#00FF87', fontWeight: 800, fontSize: 15, textAlign: 'center', margin: 0 }}>
            ✅ Notifications enabled!
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🔔</span>
              <div>
                <p style={{ color: '#f5f5f0', fontWeight: 800, fontSize: 15, margin: 0 }}>Stay in the game</p>
                <p style={{ color: 'rgba(230,240,232,0.5)', fontSize: 12, margin: '3px 0 0' }}>
                  Get notified about daily challenges, streaks, and match invites
                </p>
              </div>
            </div>
            <button
              onClick={handleEnable}
              disabled={busy}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: '#00FF87', color: '#08180d', fontWeight: 800,
                fontSize: 14, cursor: 'pointer', marginBottom: 10,
              }}
            >
              {busy ? 'Enabling...' : 'Enable notifications'}
            </button>
            <button
              onClick={handleLater}
              style={{
                width: '100%', padding: '13px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                color: 'rgba(230,240,232,0.5)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Later — I'll enable in Settings
            </button>
          </>
        )}
      </div>
    </div>
  )
}