import { useState, useEffect, useRef } from 'react'
import { getDailyChallengeInfo } from '../lib/dailyChallenge'
import { getActiveSeasonalEvents, getDateKey } from '../lib/seasonalEvents'
import { refreshPushSubscription, subscribeUserToPush } from '../lib/pushNotifications'
import { getPlayerAvatar } from '../lib/avatars'
import styles from './Home.module.css'

const ROUNDS = [5, 10, 15]
const ADMIN_UID = 'K4qCnBhAVDMTkvK70SMVfbbsw463'
const NOTIFICATION_REPAIR_KEY = 'trivela-notification-repair-needed'
const NOTIFICATION_REPAIR_DISMISSED_KEY = 'trivela-notification-repair-dismissed'
const NOTIFICATION_MODAL_DISMISSED_KEY = 'trivela-notification-modal-dismissed'


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
  onStartTeam,
  onStartDaily,
  onStartSeasonalEvent,
  onStartTournament,
  onStartLightning,
  onViewDailyLeaderboard,
  profile,
  user,
  onViewProfile,
  onAdmin,
  dailyPlayed,
  coinBalance = 0,
}) {
  const [tab, setTab] = useState('solo')
  const [rounds, setRounds] = useState(5)
  const [soloName, setSoloName] = useState('')
  const [soloError, setSoloError] = useState('')
  const [countdown, setCountdown] = useState('00:00:00')

  // ── Carousel state ──────────────────────────────────────────────────────────
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [seasonalEvents, setSeasonalEvents] = useState([])
  const [loadingSeasonalEvents, setLoadingSeasonalEvents] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const carouselRef = useRef(null)

  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'
  const accentBg = isBasketball ? 'rgba(255,107,53,0.08)' : 'rgba(0,255,135,0.08)'
  const accentText = isBasketball ? '#fff' : '#0a1f0f'
  const sportLabel = isBasketball ? 'Basketball' : 'Football'

  const [now, setNow] = useState(Date.now())
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [notificationStatus, setNotificationStatus] = useState('')
  const [notificationBusy, setNotificationBusy] = useState(false)
  const [showNotificationRepair, setShowNotificationRepair] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem(NOTIFICATION_REPAIR_KEY) === 'true'
  ))
  const [notificationRepairDismissed, setNotificationRepairDismissed] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem(NOTIFICATION_REPAIR_DISMISSED_KEY) === 'true'
  ))
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState(null)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    getDailyChallengeInfo({ sport, now: new Date(now) }).then(setDailyChallenge)
  }, [sport, now])

  // ── Fetch seasonal events ────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingSeasonalEvents(true)
    getActiveSeasonalEvents()
      .then((events) => {
        setSeasonalEvents(events)
        setCarouselIndex(0)
        setLoadingSeasonalEvents(false)
      })
      .catch((err) => {
        console.error('Failed to fetch seasonal events:', err)
        setSeasonalEvents([])
        setLoadingSeasonalEvents(false)
      })
  }, [])

  const currentPlayerName = user?.displayName || profile?.displayName || 'Player'
  const currentAvatar = getPlayerAvatar(user, profile)
  const isSignedInPlayer = Boolean(user)

  const dailyAvailable = dailyChallenge?.available
  const beforeRelease = dailyChallenge ? now < dailyChallenge.releaseTime.getTime() : false

  const dailyButtonLabel = dailyPlayed
    ? 'Already played today'
    : dailyAvailable
    ? isBasketball ? 'Start daily tip-off' : 'Start daily kickoff'
    : beforeRelease
    ? 'Opens at 12 PM'
    : 'Back tomorrow at 12 PM'

  const dailyStatusMessage = dailyPlayed
    ? "You have played today's daily challenge. A new one drops tomorrow."
    : dailyAvailable
    ? "Today's daily challenge is live now."
    : beforeRelease
    ? "Today's daily challenge opens at 12 PM."
    : "Today's challenge has ended. A new one drops tomorrow."

  const countdownLabel = dailyPlayed
    ? 'Back in'
    : dailyAvailable
    ? 'Ends in'
    : beforeRelease
    ? 'Opens in'
    : 'Back in'

  const countdownTarget = dailyChallenge
    ? dailyPlayed
      ? dailyChallenge.nextRelease.getTime()
      : dailyAvailable
      ? dailyChallenge.cutoffTime.getTime()
      : beforeRelease
      ? dailyChallenge.releaseTime.getTime()
      : dailyChallenge.nextRelease.getTime()
    : Date.now()

  useEffect(() => {
    setCountdown(formatCountdown(countdownTarget - Date.now()))
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(countdownTarget - Date.now()))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [countdownTarget])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setNotificationPermission(Notification.permission)
    if (Notification.permission === 'granted' && user?.uid) {
      subscribeUserToPush(user)
        .then((subscription) => {
          const needsRepair = !subscription
          setShowNotificationRepair(needsRepair)
          if (needsRepair) {
            window.localStorage.setItem(NOTIFICATION_REPAIR_KEY, 'true')
            setNotificationRepairDismissed(false)
            window.localStorage.removeItem(NOTIFICATION_REPAIR_DISMISSED_KEY)
          } else {
            window.localStorage.removeItem(NOTIFICATION_REPAIR_KEY)
            setNotificationRepairDismissed(true)
            window.localStorage.setItem(NOTIFICATION_REPAIR_DISMISSED_KEY, 'true')
          }
        })
        .catch((error) => {
          console.error(error)
          setShowNotificationRepair(true)
          window.localStorage.setItem(NOTIFICATION_REPAIR_KEY, 'true')
          setNotificationRepairDismissed(false)
          window.localStorage.removeItem(NOTIFICATION_REPAIR_DISMISSED_KEY)
        })
    }
  }, [user?.uid])

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      notificationPermission !== 'granted' ||
      dailyAvailable ||
      !dailyChallenge?.nextRelease
    ) return

    const reminderTime = dailyChallenge.nextRelease.getTime() - 5 * 60 * 1000
    const now = Date.now()
    if (reminderTime <= now) return

    const timeout = window.setTimeout(() => {
      new Notification('Daily challenge unlocks soon', {
        body: `${sportLabel} daily challenge starts at 12 PM. Get ready!`,
      })
    }, reminderTime - now)

    return () => window.clearTimeout(timeout)
  }, [dailyAvailable, dailyChallenge?.nextRelease, notificationPermission, sportLabel])

  useEffect(() => {
    if (!user?.uid) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    const dismissed = window.localStorage.getItem(NOTIFICATION_MODAL_DISMISSED_KEY)
    if (dismissed) return

    const timer = window.setTimeout(() => {
      setShowNotificationModal(true)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [user?.uid])

  function handleSolo() {
    if (!isSignedInPlayer && !soloName.trim()) {
      setSoloError('Input name to proceed.')
      return
    }
    setSoloError('')
    onStartSolo({ name: isSignedInPlayer ? currentPlayerName : soloName.trim(), rounds, sport })
  }

  async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setNotificationBusy(true)
    setNotificationStatus('')
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        const subscription = await subscribeUserToPush(user)
        setNotificationStatus(subscription ? 'Notifications enabled on this device.' : 'Notification setup failed.')
        setShowNotificationRepair(!subscription)
        if (subscription) {
          window.localStorage.removeItem(NOTIFICATION_REPAIR_KEY)
          setNotificationRepairDismissed(true)
          window.localStorage.setItem(NOTIFICATION_REPAIR_DISMISSED_KEY, 'true')
        } else {
          window.localStorage.setItem(NOTIFICATION_REPAIR_KEY, 'true')
          setNotificationRepairDismissed(false)
          window.localStorage.removeItem(NOTIFICATION_REPAIR_DISMISSED_KEY)
        }
      } else {
        setNotificationStatus('Notification permission was not granted.')
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      setNotificationStatus('Notification setup failed.')
    } finally {
      setNotificationBusy(false)
    }
  }

  async function repairNotificationSubscription() {
    setNotificationBusy(true)
    setNotificationStatus('Refreshing notifications...')
    try {
      const subscription = await refreshPushSubscription(user)
      setNotificationStatus(subscription ? 'Notifications refreshed on this device.' : 'Notification refresh failed.')
      setShowNotificationRepair(!subscription)
      if (subscription) {
        window.localStorage.removeItem(NOTIFICATION_REPAIR_KEY)
        setNotificationRepairDismissed(true)
        window.localStorage.setItem(NOTIFICATION_REPAIR_DISMISSED_KEY, 'true')
      } else {
        window.localStorage.setItem(NOTIFICATION_REPAIR_KEY, 'true')
        setNotificationRepairDismissed(false)
        window.localStorage.removeItem(NOTIFICATION_REPAIR_DISMISSED_KEY)
      }
    } catch (error) {
      console.error('Failed to refresh push notifications:', error)
      setNotificationStatus('Notification refresh failed.')
      setShowNotificationRepair(true)
      window.localStorage.setItem(NOTIFICATION_REPAIR_KEY, 'true')
      setNotificationRepairDismissed(false)
      window.localStorage.removeItem(NOTIFICATION_REPAIR_DISMISSED_KEY)
    } finally {
      setNotificationBusy(false)
    }
  }

  async function handleModalNotificationRequest() {
    setShowNotificationModal(false)
    window.localStorage.setItem(NOTIFICATION_MODAL_DISMISSED_KEY, 'true')
    await requestNotificationPermission()
  }

  function handleModalDismiss() {
    setShowNotificationModal(false)
    window.localStorage.setItem(NOTIFICATION_MODAL_DISMISSED_KEY, 'true')
  }

  const chipActiveStyle = { borderColor: accent, color: accent, background: accentBg }
  const startBtnStyle = { background: accent, color: accentText }
  const tabActiveStyle = { background: accent, color: accentText, borderColor: accent }
  const shouldShowNotificationRepair =
    notificationPermission === 'granted' &&
    (showNotificationRepair || (user?.uid === ADMIN_UID && !notificationRepairDismissed))
  const sportActiveStyle = (nextSport) =>
    nextSport === sport
      ? { borderColor: accent, color: accent, background: accentBg, fontWeight: 700 }
      : {}
  const showRoundPicker = tab !== 'teams' && tab !== 'tournament' && tab !== 'lightning'

  // ── Carousel ─────────────────────────────────────────────────────────────────
  const totalCards = 1 + seasonalEvents.length
  const todayKey = getDateKey()

  function handleCarouselMouseDown(e) {
    setIsDragging(true)
    setDragStart(e.clientX)
  }

  function handleCarouselTouchStart(e) {
    setIsDragging(true)
    setDragStart(e.touches[0].clientX)
  }

  function handleCarouselMouseUp(e) {
    if (!isDragging) return
    setIsDragging(false)
    const diff = dragStart - e.clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && carouselIndex < totalCards - 1) setCarouselIndex(carouselIndex + 1)
      else if (diff < 0 && carouselIndex > 0) setCarouselIndex(carouselIndex - 1)
    }
  }

  function handleCarouselTouchEnd(e) {
    if (!isDragging) return
    setIsDragging(false)
    const diff = dragStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && carouselIndex < totalCards - 1) setCarouselIndex(carouselIndex + 1)
      else if (diff < 0 && carouselIndex > 0) setCarouselIndex(carouselIndex - 1)
    }
  }

  function goToCard(index) {
    setCarouselIndex(Math.max(0, Math.min(index, totalCards - 1)))
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.logoWrap}>
            <img className={styles.logo} src="/logo-mark.svg" alt="Sports trivia logo" />
          </div>
           {user && (
             <div className={styles.headerActions}>
               <button className={styles.profileBtn} onClick={onViewProfile} title="View profile">
                 <img
                   src={currentAvatar}
                   alt="Avatar"
                   className={styles.avatarImg}
                 />
                 <span className={styles.profileName}>{currentPlayerName}</span>
               </button>
               {user.uid === 'K4qCnBhAVDMTkvK70SMVfbbsw463' && (
                 <button className={styles.adminBtn} onClick={onAdmin} title="Admin Dashboard">
                   Admin
                 </button>
               )}
             </div>
           )}
        </div>
        <h1 className={styles.title}>
          {isBasketball ? 'Basketball Trivia' : 'Football Trivia'}
        </h1>
        <p className={styles.sub}>
          Pick your lane, then jump into solo play, online rooms, team battles, or today&apos;s shared challenge.
        </p>
      </header>

      {/* ── CAROUSEL ── */}
      {/* Outer wrapper: clips overflow so only 1 card shows at a time */}
      <div className={styles.carouselWrap}>

        {/* Inner track: the only element that moves — slides all cards as one unit */}
        <div
          className={styles.carouselContainer}
          ref={carouselRef}
          onMouseDown={handleCarouselMouseDown}
          onMouseUp={handleCarouselMouseUp}
          onTouchStart={handleCarouselTouchStart}
          onTouchEnd={handleCarouselTouchEnd}
          style={{
            transform: `translateX(-${carouselIndex * 100}%)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {/* Card 0: Daily Challenge */}
          <section className={styles.carouselCard}>
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
              <span>{currentPlayerName ? `Playing as ${currentPlayerName}` : 'Play first, save score after'}</span>
            </div>

            <div className={styles.countdownRow}>
              <div className={styles.countdownText}>
                <span className={styles.countdownLabel}>Daily status</span>
                <span className={styles.countdownMessage}>{dailyStatusMessage}</span>
              </div>
              <div className={styles.countdownTimer}>
                <span className={styles.countdownLabel}>{countdownLabel}</span>
                <span className={styles.countdownValue}>{countdown}</span>
              </div>
            </div>

            {!dailyAvailable &&
              typeof window !== 'undefined' &&
              'Notification' in window && (
                <>
                  {shouldShowNotificationRepair ? (
                    <button
                      className={styles.reminderBtn}
                      onClick={repairNotificationSubscription}
                      disabled={notificationBusy}
                    >
                      {notificationBusy ? 'Refreshing...' : 'Refresh notifications'}
                    </button>
                  ) : notificationPermission !== 'granted' ? (
                    <button
                      className={styles.reminderBtn}
                      onClick={requestNotificationPermission}
                      disabled={notificationBusy}
                    >
                      {notificationBusy ? 'Enabling...' : 'Enable reminder'}
                    </button>
                  ) : null}
                  {notificationStatus && (
                    <p className={styles.notificationStatus}>{notificationStatus}</p>
                  )}
                </>
              )}

            <button
              className={styles.dailyBtn}
              style={startBtnStyle}
              onClick={() => onStartDaily({ sport })}
              disabled={!dailyAvailable || dailyPlayed}
            >
              {dailyButtonLabel}
            </button>
          </section>

          {/* Cards 1+: Seasonal Events */}
          {seasonalEvents.map((event) => {
            const isScheduled = event.startDate && event.startDate > todayKey
            const eventSportLabel = event.sport === 'basketball' ? 'Basketball' : 'Football'
            const entryFee = Math.max(0, Math.round(Number(event.entryFee) || 0))
            const canAffordEntry = coinBalance >= entryFee
            const isLocked = isScheduled || !canAffordEntry
            return (
              <section key={event.id} className={styles.carouselCard}>
                <div className={styles.dailyTop}>
                  <div>
                    <p className={styles.badge}>{isScheduled ? 'Upcoming seasonal event' : 'Seasonal event'}</p>
                    <h2 className={styles.dailyTitle}>{event.name}</h2>
                  </div>
                </div>

                <p className={styles.dailyCopy}>
                  {event.description || `Join the ${event.name} challenge and compete for the crown.`}
                </p>

                <div className={styles.dailyMeta}>
                  <span>{eventSportLabel}</span>
                  <span>{event.dailyQuestions || 10} questions</span>
                  <span>{event.startDate} → {event.endDate}</span>
                  {event.coinMultiplier > 1 && <span>🪙 {event.coinMultiplier}x coins</span>}
                  {entryFee > 0 && <span>Entry: {entryFee} coins</span>}
                </div>

                <div className={styles.countdownRow}>
                  <div className={styles.countdownText}>
                    <span className={styles.countdownLabel}>Event info</span>
                    <span className={styles.countdownMessage}>
                      {isScheduled
                        ? `Starts ${event.startDate}`
                        : entryFee > 0
                        ? canAffordEntry
                          ? `Entry: ${entryFee} coins`
                          : `Need ${entryFee - coinBalance} more coins`
                        : 'Free to play'}
                    </span>
                  </div>
                </div>

                <button
                  className={styles.dailyBtn}
                  style={startBtnStyle}
                  onClick={() => onStartSeasonalEvent({
                    eventId: event.id,
                    eventName: event.name,
                    sport: event.sport || sport,
                    dailyQuestions: event.dailyQuestions || 10,
                    coinMultiplier: event.coinMultiplier || 1,
                    entryFee,
                  })}
                  disabled={isLocked}
                >
                  {isScheduled ? 'Coming soon' : canAffordEntry ? 'Play now →' : 'Not enough coins'}
                </button>
              </section>
            )
          })}
        </div>
      </div>

      {/* ── Carousel Navigation ── */}
      {totalCards > 1 && (
        <div className={styles.carouselNav}>
          <button
            className={styles.carouselArrow}
            onClick={() => goToCard(carouselIndex - 1)}
            disabled={carouselIndex === 0}
          >
            ←
          </button>

          <div className={styles.carouselDots}>
            {Array.from({ length: totalCards }).map((_, i) => (
              <button
                key={i}
                className={`${styles.carouselDot} ${i === carouselIndex ? styles.carouselDotActive : ''}`}
                onClick={() => goToCard(i)}
                style={i === carouselIndex ? { background: accent, borderColor: accent } : {}}
              />
            ))}
          </div>

          <button
            className={styles.carouselArrow}
            onClick={() => goToCard(carouselIndex + 1)}
            disabled={carouselIndex === totalCards - 1}
          >
            →
          </button>
        </div>
      )}

      {/* ── Sport picker ── */}
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

      {/* ── Mode Tabs ── */}
      <div className={styles.tabs}>
        {['solo', 'online', 'teams', 'lightning', 'tournament'].map((nextTab) => (
          <button
            key={nextTab}
            className={`${styles.tab} ${tab === nextTab ? styles.tabActive : ''}`}
            style={tab === nextTab ? tabActiveStyle : {}}
            onClick={() => setTab(nextTab)}
          >
            {nextTab === 'solo'
              ? 'Solo'
              : nextTab === 'online'
              ? 'Multiplayer'
              : nextTab === 'teams'
              ? 'Teams'
              : nextTab === 'lightning'
              ? 'Lightning'
              : 'Tournament'}
          </button>
        ))}
      </div>

      {showRoundPicker && (
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
      )}

      {/* ── Solo ── */}
      {tab === 'solo' && (
        <div className={styles.section}>
          {!isSignedInPlayer && (
            <>
              <p className={styles.label}>Your name</p>
              <input
                className={styles.input}
                placeholder="Enter your name"
                value={soloName}
                onChange={(event) => {
                  setSoloName(event.target.value)
                  if (soloError) setSoloError('')
                }}
              />
              {soloError && <p className={styles.inlineError}>{soloError}</p>}
            </>
          )}
          <button className={styles.startBtn} style={startBtnStyle} onClick={handleSolo}>
            {isBasketball ? 'Tip off ->' : 'Kick off ->'}
          </button>
        </div>
      )}

      {/* ── Online 1v1 ── */}
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

      {/* ── Teams ── */}
      {tab === 'teams' && (
        <div className={styles.section}>
          <p className={styles.onlineDesc}>
            Compete in teams of 2–5 players. Up to 4 teams per match. Invite players by their Player ID or share a room code. Highest team score wins.
          </p>
          <button
            className={styles.startBtn}
            style={startBtnStyle}
            onClick={() => onStartTeam({ sport })}
          >
            Enter team lobby {'>'}
          </button>
        </div>
      )}

      {/* ── Lightning ── */}
      {tab === 'lightning' && (
        <div className={styles.section}>
          <p className={styles.onlineDesc}>
            Fast-paced 60-second rush. Answer as many questions correctly as possible. Speed matters — wrong answers penalize -3 seconds. Climb the lightning leaderboard!
          </p>
          <button
            className={styles.startBtn}
            style={startBtnStyle}
            onClick={() => onStartLightning({ sport })}
          >
            ⚡ Open lightning modes →
          </button>
        </div>
      )}

      {/* ── Tournament ── */}
      {tab === 'tournament' && (
        <div className={styles.section}>
          <p className={styles.onlineDesc}>
            Single-elimination brackets. Create a tournament, invite players with a code or make it public, set a start time, and compete round by round until one champion remains.
          </p>
          <button
            className={styles.startBtn}
            style={startBtnStyle}
            onClick={onStartTournament}
          >
            Enter tournament lobby {'>'}
          </button>
        </div>
      )}

      {showNotificationModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 32px',
        }}>
          <div style={{
            background: '#0f2d18', border: '1px solid rgba(0,255,135,0.2)',
            borderRadius: 20, padding: '28px 24px', maxWidth: 400, width: '100%',
            margin: '0 16px', boxShadow: '0 -4px 40px rgba(0,255,135,0.1)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>🔔</div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
              Stay in the game
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>
              Get notified for daily challenges, streaks, match invites, and lightning duels so you never miss a play.
            </p>
            <button
              onClick={handleModalNotificationRequest}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: '#00FF87', color: '#0a1f0f',
                fontWeight: 800, fontSize: 15, border: 'none',
                cursor: 'pointer', marginBottom: 10,
              }}
            >
              Enable notifications
            </button>
            <button
              onClick={handleModalDismiss}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: 'transparent', color: 'rgba(255,255,255,0.4)',
                fontWeight: 700, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
