import { useState, useEffect, useMemo } from 'react'
import { getDailyChallengeInfo } from '../lib/dailyChallenge'
import { subscribeUserToPush } from '../lib/pushNotifications'
import styles from './Home.module.css'

const ROUNDS = [5, 10, 15]

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export default function Home({
  sport,
  onSportChange,
  onStartSolo,
  onStartOnline,
  onStartDaily,
  onViewDailyLeaderboard,
  profile,
}) {
  const [tab, setTab] = useState('solo')
  const [rounds, setRounds] = useState(5)
  const [soloName, setSoloName] = useState('')

  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'
  const accentBg = isBasketball ? 'rgba(255,107,53,0.08)' : 'rgba(0,255,135,0.08)'
  const accentText = isBasketball ? '#fff' : '#0a1f0f'
  const sportLabel = isBasketball ? 'Basketball' : 'Football'

  const [now, setNow] = useState(Date.now())
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const dailyChallenge = useMemo(
    () => getDailyChallengeInfo({ sport, now: new Date(now) }),
    [sport, now]
  )

  const dailyAvailable = dailyChallenge.available
  const dailyButtonLabel = dailyAvailable
    ? isBasketball ? 'Start daily tip-off' : 'Start daily kickoff'
    : 'Locked until 12:00 UTC'

  const countdown = formatCountdown(dailyChallenge.nextRelease.getTime() - now)
  const countdownLabel = dailyAvailable
    ? 'Ends in'
    : now < dailyChallenge.releaseTime.getTime()
    ? 'Unlocks in'
    : 'Next challenge in'

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setNotificationPermission(Notification.permission)
  }, [])

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      notificationPermission !== 'granted' ||
      dailyAvailable ||
      !dailyChallenge?.nextRelease
    ) {
      return
    }

    const reminderTime = dailyChallenge.nextRelease.getTime() - 5 * 60 * 1000
    const now = Date.now()
    if (reminderTime <= now) return

    const timeout = window.setTimeout(() => {
      new Notification('Daily challenge unlocks soon', {
        body: `${sportLabel} daily challenge starts at 12:00 UTC. Get ready!`,
      })
    }, reminderTime - now)

    return () => window.clearTimeout(timeout)
  }, [dailyAvailable, dailyChallenge?.nextRelease, notificationPermission, sportLabel])

  function handleSolo() {
    onStartSolo({ name: soloName.trim() || 'Player', rounds, sport })
  }

  async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)

    // If permission granted, subscribe to push notifications
    if (permission === 'granted') {
      try {
        await subscribeUserToPush()
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error)
      }
    }
  }

  const chipActiveStyle = { borderColor: accent, color: accent, background: accentBg }
  const startBtnStyle = { background: accent, color: accentText }
  const tabActiveStyle = { background: accent, color: accentText, borderColor: accent }
  const sportActiveStyle = (nextSport) =>
    nextSport === sport
      ? {
          borderColor: accent,
          color: accent,
          background: accentBg,
          fontWeight: 700,
        }
      : {}

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img className={styles.logo} src="/logo-mark.svg" alt="Sports trivia logo" />
        </div>
        <h1 className={styles.title}>
          {isBasketball ? <>Basketball<br />Trivia</> : <>Football<br />Trivia</>}
        </h1>
        <p className={styles.sub}>
          Pick your lane, then jump into solo, local multiplayer, online rooms, or today&apos;s shared challenge.
        </p>
      </header>

      <section className={styles.dailyCard}>
        <div className={styles.dailyTop}>
          <div>
            <p className={styles.badge}>Daily challenge</p>
            <h2 className={styles.dailyTitle}>{sportLabel} matchday</h2>
          </div>
          <button className={styles.dailyGhost} onClick={() => onViewDailyLeaderboard(sport)}>
            Leaderboard
          </button>
        </div>

        <p className={styles.dailyCopy}>
          Same {sportLabel.toLowerCase()} questions for everyone today. Score first, speed second.
        </p>

        <div className={styles.dailyMeta}>
          <span>{dailyChallenge?.rounds || 10} questions</span>
          <span>{dailyChallenge?.dateKey}</span>
          <span>{profile?.displayName ? `Playing as ${profile.displayName}` : 'Play first, save score after'}</span>
        </div>

        <div className={styles.countdownRow}>
          <span className={styles.countdownLabel}>{countdownLabel}</span>
          <span className={styles.countdownValue}>{countdown}</span>
        </div>

        {!dailyAvailable && typeof window !== 'undefined' && 'Notification' in window && notificationPermission !== 'granted' && (
          <button className={styles.reminderBtn} onClick={requestNotificationPermission}>
            Enable reminder
          </button>
        )}

        <button
          className={styles.dailyBtn}
          style={startBtnStyle}
          onClick={() => onStartDaily({ sport })}
          disabled={!dailyAvailable}
        >
          {dailyButtonLabel}
        </button>
      </section>

      <div className={styles.section}>
        <p className={styles.label}>Choose your sport</p>
        <div className={styles.sportGrid}>
          {[
            { key: 'football', icon: '⚽', label: 'Football' },
            { key: 'basketball', icon: '🏀', label: 'Basketball' },
          ].map((option) => (
            <button
              key={option.key}
              className={styles.sportBtn}
              style={sportActiveStyle(option.key)}
              onClick={() => onSportChange(option.key)}
            >
              <span className={styles.sportEmoji}>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tabs}>
        {['solo', 'online'].map((nextTab) => (
          <button
            key={nextTab}
            className={`${styles.tab} ${tab === nextTab ? styles.tabActive : ''}`}
            style={tab === nextTab ? tabActiveStyle : {}}
            onClick={() => setTab(nextTab)}
          >
            {nextTab === 'solo' ? 'Solo' : 'Online'}
          </button>
        ))}
      </div>

      <div className={styles.section}>
        <p className={styles.label}>Rounds</p>
        <div className={styles.roundGrid}>
          {ROUNDS.map((round) => (
            <button
              key={round}
              className={styles.chip}
              style={rounds === round ? chipActiveStyle : {}}
              onClick={() => setRounds(round)}
            >
              {round} rounds
            </button>
          ))}
        </div>
      </div>

      {tab === 'solo' && (
        <div className={styles.section}>
          <p className={styles.label}>Your name</p>
          <input
            className={styles.input}
            placeholder="Enter your name"
            value={soloName}
            onChange={(event) => setSoloName(event.target.value)}
          />
          <button className={styles.startBtn} style={startBtnStyle} onClick={handleSolo}>
            {isBasketball ? 'Tip off ->' : 'Kick off ->'}
          </button>
        </div>
      )}

      {tab === 'online' && (
        <div className={styles.section}>
          <p className={styles.onlineDesc}>
            Play against a friend anywhere in the world. Create a room and share the code, or join an existing room.
          </p>
          <button className={styles.startBtn} style={startBtnStyle} onClick={() => onStartOnline({ sport, rounds })}>
            Enter online lobby {'>'}
          </button>
        </div>
      )}
    </div>
  )
}
