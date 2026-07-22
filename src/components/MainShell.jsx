import { useEffect, useMemo, useRef, useState } from 'react'
import { ref, get, update, onValue } from 'firebase/database'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { getDailyChallengeInfo, getDateKey, getWeekKey, listenToDailyLeaderboard, listenToWeeklyLeaderboard } from '../lib/dailyChallenge'
import { listenToLightningLeaderboard } from '../lib/lightningDaily'
import { getActiveSeasonalEvents, listenToAllSeasonalEvents } from '../lib/seasonalEvents'
import { getPlayerAvatar } from '../lib/avatars'
import { loadProfile, saveProfile } from '../lib/profile'
import { listenToModeCounts, getHomeModeIds } from '../lib/modeStats'
import { getUnlockedMilestones } from '../lib/streaks'
import { respondToInvite } from '../lib/teamMultiplayer'
import { getOrCreateWeeklyMissions, claimWeeklyReward } from '../lib/missions'
import { awardCoins, spendCoins, TEAM_PLAYER_WAGER } from '../lib/coins'
import { getFormBadge as buildFormBadge, syncPublicProfile } from '../lib/userStats'
import { sendFriendRequestPushNotification } from '../lib/friendNotifications'
import {
  acceptFriendRequest,
  declineFriendRequest,
  listenToFriendRequests,
  listenToFriends,
  removeFriend,
  sendFriendRequest,
} from '../lib/friends'
import Profile from './Profile'
import styles from './MainTabs.module.css'
import NotifNudge, { shouldShowNudge } from './NotifNudge'
import Feedback from './Feedback'

const MODE_DEFS = {
  solo: { icon: '🎯', title: 'Solo', copy: '5, 10 or 15 questions' },
  online: { icon: '⚔️', title: 'Online 1v1', copy: 'Real-time head to head' },
  team: { icon: '👥', title: 'Team Battle', copy: 'Compete as a squad' },
  lightning: { icon: '⚡', title: 'Lightning', copy: '60 sec, answer fast' },
  lightning_h2h: { icon: '⚡', title: 'Lightning 1v1', copy: 'Fast duel for coins' },
  tournament: { icon: '🏆', title: 'Tournament', copy: 'Bracket competition' },
  daily: { icon: '📅', title: 'Daily Challenge', copy: 'Today only' },
  seasonal: { icon: '🎉', title: 'Seasonal Event', copy: 'Limited-time challenge' },
  commonLink: { icon: '🔗', title: 'Common Link', copy: 'Find the connecting player' },
  bestOfThree: { icon: '🥊', title: 'Best of 3', copy: 'First to win 2 rounds' },
}

const NAV_ITEMS = [
   { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'board', label: 'Board', icon: '🏆' },
  { id: 'play', label: 'Play', icon: '🎮' },
 { id: 'hub', label: 'Hub', icon: '⭐' },
  { id: 'friends', label: 'Friends', icon: '👥' },
]

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function sportLabel(sport) {
  return sport === 'basketball' ? 'Basketball' : 'Football'
}

function avatarInitial(name) {
  return (name || 'P').trim().charAt(0).toUpperCase() || 'P'
}

function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function filterVisibleSeasonalEvents(events) {
  const todayKey = getDateKey()
  return (events || []).filter((event) => {
    if (!event || event.name === 'placeholder') return false
    if (!event.active) return false
    if (event.endDate && event.endDate < todayKey) return false
    return true
  })
}

function SportPicker({ sport, onSportChange }) {
  const footballColor = '#00FF87'
  const basketballColor = '#FF8C42'

  return (
    <div className={styles.sportGrid}>
      {[
        { id: 'football', label: 'Football', icon: '⚽', color: footballColor },
        { id: 'basketball', label: 'Basketball', icon: '🏀', color: basketballColor },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.sportButton} ${sport === item.id ? styles.active : ''}`}
          onClick={() => onSportChange(item.id)}
          style={sport === item.id ? {
            borderColor: item.color,
            color: item.color,
            background: `${item.color}18`,
          } : {}}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  )
}

function ModeCard({ modeId, onSelect }) {
  const mode = MODE_DEFS[modeId] || MODE_DEFS.solo
  return (
    <button className={styles.modeCard} type="button" onClick={() => onSelect(modeId)}>
      <span className={styles.modeIcon}>{mode.icon}</span>
      <span className={styles.modeTitle}>{mode.title}</span>
      <span className={styles.modeCopy}>{mode.copy}</span>
    </button>
  )
}

function ModeRow({ modeId, onSelect }) {
  const mode = MODE_DEFS[modeId] || MODE_DEFS.solo
  return (
    <button className={styles.modeRow} type="button" onClick={() => onSelect(modeId)}>
      <span className={styles.rowIcon}>{mode.icon}</span>
      <span>
        <span className={styles.rowTitle}>{mode.title}</span>
        <span className={styles.rowCopy}>{mode.copy}</span>
      </span>
      <span className={styles.rowChevron}>›</span>
    </button>
  )
}

function DailyCard({ sport, user, profile, dailyPlayed, onStartDaily, onOpenBoard }) {
  const [now, setNow] = useState(Date.now())
  const [dailyChallenge, setDailyChallenge] = useState(null)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let active = true
    getDailyChallengeInfo({ sport, now: new Date(now) })
      .then((challenge) => {
        if (active) setDailyChallenge(challenge)
      })
      .catch(() => {
        if (active) setDailyChallenge(null)
      })
    return () => { active = false }
  }, [sport, now])

  const available = dailyChallenge?.available
  const beforeRelease = dailyChallenge ? now < dailyChallenge.releaseTime.getTime() : false
  const target = dailyChallenge
    ? dailyPlayed
      ? dailyChallenge.nextRelease.getTime()
      : available
      ? dailyChallenge.cutoffTime.getTime()
      : beforeRelease
      ? dailyChallenge.releaseTime.getTime()
      : dailyChallenge.nextRelease.getTime()
    : now

  const status = dailyPlayed
    ? "You've already played today."
    : available
    ? "Today's daily challenge is live now."
    : beforeRelease
    ? "Today's daily challenge opens at 12 PM."
    : 'A new daily challenge drops tomorrow.'

  const countdownLabel = dailyPlayed ? 'Back in' : available ? 'Ends in' : beforeRelease ? 'Opens in' : 'Back in'
  const playerName = user?.displayName || profile?.displayName || 'Player'
  const badgeText = dailyPlayed
    ? 'Played today'
    : available
    ? 'Live now'
    : beforeRelease
    ? 'Opens at 12 PM'
    : 'Closed today'

  return (
    <section className={styles.dailyCard}>
      <span className={styles.dailyBadge}>{badgeText}</span>
      <h2 className={styles.dailyTitle}>{sportLabel(sport)} daily challenge</h2>
      <p className={styles.dailyCopy}>Same questions for everyone. Score first, speed second.</p>
      <div className={styles.dailyMeta}>
        <span className={styles.metaPill}>{dailyChallenge?.rounds || 10} questions</span>
        <span className={styles.metaPill}>{dailyChallenge?.dateKey || getDateKey()}</span>
        <span className={styles.metaPill}>{playerName}</span>
      </div>
      <div className={styles.countdownRow}>
        <div className={styles.countdownText}>
          <p className={styles.countdownMessage}>{status}</p>
        </div>
        <div className={styles.countdownTimer}>
          <span className={styles.countdownLabel}>{countdownLabel}</span>
          <span className={styles.countdownValue}>{formatCountdown(target - now)}</span>
        </div>
      </div>
      <div className={styles.alertActions}>
        <button className={styles.dailyBtn} type="button" disabled={!available || dailyPlayed} onClick={() => onStartDaily({ sport })}>
          {dailyPlayed ? 'Played' : available ? 'Start daily' : 'Locked'}
        </button>
        <button className={styles.dailyGhost} type="button" onClick={onOpenBoard}>Board</button>
      </div>
    </section>
  )
}

function HomeTab({ sport, onSportChange, user, profile, dailyPlayed, onStartDaily, onStartSeasonalEvent, onSelectMode, onOpenBoard, onOpenProfile, onOpenSidebar }) {
  const [modeCounts, setModeCounts] = useState({})
  const [streak, setStreak] = useState(null)
  const [greeting, setGreeting] = useState(() => getGreeting())
  const [seasonalEvents, setSeasonalEvents] = useState([])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const name = user?.displayName || profile?.displayName || 'Player'
  const avatar = getPlayerAvatar(user, profile)

  useEffect(() => listenToModeCounts(user?.uid, setModeCounts, console.error), [user?.uid])

  useEffect(() => {
    const interval = window.setInterval(() => setGreeting(getGreeting()), 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user?.uid) return
    get(ref(db, `users/${user.uid}/dailyStreak`)).then((snap) => setStreak(snap.val() || null)).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    getActiveSeasonalEvents()
      .then((events) => setSeasonalEvents(filterVisibleSeasonalEvents(events)))
      .catch(() => setSeasonalEvents([]))

    const unsubscribe = listenToAllSeasonalEvents(
      (events) => setSeasonalEvents(filterVisibleSeasonalEvents(events)),
      () => {}
    )
    return unsubscribe
  }, [])

  const homeModes = useMemo(() => getHomeModeIds(modeCounts), [modeCounts])
  const streakText = `${streak?.current || 0}-day streak`
  const totalCards = 1 + seasonalEvents.length

  useEffect(() => {
    setCarouselIndex((index) => Math.min(index, totalCards - 1))
  }, [totalCards])

  function goToCard(nextIndex) {
    setCarouselIndex(Math.max(0, Math.min(nextIndex, totalCards - 1)))
  }

  function handleTouchStart(event) {
    setIsDragging(true)
    setDragStartX(event.touches[0].clientX)
  }

  function handleTouchEnd(event) {
    if (!isDragging) return
    setIsDragging(false)
    const diff = dragStartX - event.changedTouches[0].clientX
    if (Math.abs(diff) < 40) return
    if (diff > 0) goToCard(carouselIndex + 1)
    else goToCard(carouselIndex - 1)
  }

  return (
    <div className={styles.page}>
     <div className={styles.topBar}>
        <button className={styles.avatarPill} type="button" onClick={onOpenSidebar} aria-label="Open menu">
          {avatar ? <img className={styles.avatarImg} src={avatar} alt="" /> : <span className={styles.avatarInitial}>{avatarInitial(name)}</span>}
        </button>
        <div style={{ width: 44 }} />
      </div>

      <h1 className={styles.heroTitle}>
        <span className={styles.heroText}>{greeting}, {name}</span>
        <span className={styles.wave}>👋</span>
      </h1>
      <p className={styles.muted}>🔥 {streakText}</p>
      <SportPicker sport={sport} onSportChange={onSportChange} />
      <div className={styles.homeCarousel}>
        <div
          className={styles.homeCarouselTrack}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
        >
        <div className={styles.homeSlide}>
          <DailyCard
            sport={sport}
            user={user}
            profile={profile}
            dailyPlayed={dailyPlayed}
            onStartDaily={onStartDaily}
            onOpenBoard={onOpenBoard}
          />
        </div>
        {seasonalEvents.map((event) => {
          const isScheduled = event.startDate && event.startDate > getDateKey()
          const eventSport = event.sport || sport
          const entryFee = Math.max(0, Math.round(Number(event.entryFee) || 0))
          const eventInfo = isScheduled
            ? `Starts ${event.startDate}`
            : entryFee > 0
            ? `Entry: ${entryFee} coin${entryFee === 1 ? '' : 's'}`
            : 'Free to play'
          return (
            <div key={event.id} className={styles.homeSlide}>
              <section className={styles.dailyCard}>
                <span className={styles.dailyBadge}>{isScheduled ? 'Upcoming event' : 'Seasonal event'}</span>
                <h2 className={styles.dailyTitle}>{event.name}</h2>
                <p className={styles.dailyCopy}>
                  {event.description || 'Limited-time challenge. Join and compete for the top score.'}
                </p>
                <div className={styles.dailyMeta}>
                  <span className={styles.metaPill}>{sportLabel(eventSport)}</span>
                  <span className={styles.metaPill}>{event.dailyQuestions || 10} questions</span>
                  {event.startDate && event.endDate ? (
                    <span className={styles.metaPill}>{event.startDate} to {event.endDate}</span>
                  ) : null}
                  {(event.coinMultiplier || 1) > 1 ? (
                    <span className={styles.metaPill}>🪙 {event.coinMultiplier}x coins</span>
                  ) : null}
                </div>
                <div className={styles.countdownRow}>
                  <div className={styles.countdownText}>
                    <span className={styles.countdownLabel}>Event info</span>
                    <span className={styles.countdownMessage}>{eventInfo}</span>
                  </div>
                </div>
                <div className={styles.alertActions}>
                  <button
                    className={styles.dailyBtn}
                    type="button"
                    onClick={() => onStartSeasonalEvent({
                      eventId: event.id,
                      eventName: event.name,
                      sport: eventSport,
                      dailyQuestions: event.dailyQuestions || 10,
                      coinMultiplier: event.coinMultiplier || 1,
                      entryFee,
                      returnTab: 'home',
                    })}
                    disabled={isScheduled}
                  >
                    {isScheduled ? 'Coming soon' : 'Play event'}
                  </button>
                </div>
              </section>
            </div>
          )
        })}
      </div>
      </div>
      {totalCards > 1 && (
        <div className={styles.homeCarouselNav}>
          <button
            className={styles.homeCarouselArrow}
            type="button"
            onClick={() => goToCard(carouselIndex - 1)}
            disabled={carouselIndex === 0}
          >
            ‹
          </button>
          <div className={styles.homeCarouselDots}>
            {Array.from({ length: totalCards }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.homeCarouselDot} ${index === carouselIndex ? styles.homeCarouselDotActive : ''}`}
                onClick={() => goToCard(index)}
              />
            ))}
          </div>
          <button
            className={styles.homeCarouselArrow}
            type="button"
            onClick={() => goToCard(carouselIndex + 1)}
            disabled={carouselIndex === totalCards - 1}
          >
            ›
          </button>
        </div>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Game Modes</h2>
          <button className={styles.linkButton} type="button" onClick={() => onSelectMode('playTab')}>See all</button>
        </div>
        <div className={styles.modeGrid}>
          {homeModes.map((modeId) => (
            <ModeCard key={modeId} modeId={modeId} onSelect={onSelectMode} />
          ))}
        </div>
      </section>
    </div>
  )
}

function PlayTab({
  sport,
  onSportChange,
  rounds,
  onRoundsChange,
  onSelectMode,
  onStartSeasonalEvent,
}) {
  const [seasonalEvents, setSeasonalEvents] = useState([])

  useEffect(() => {
    getActiveSeasonalEvents()
      .then((events) => setSeasonalEvents(filterVisibleSeasonalEvents(events)))
      .catch(() => setSeasonalEvents([]))

    const unsubscribe = listenToAllSeasonalEvents(
      (events) => setSeasonalEvents(filterVisibleSeasonalEvents(events)),
      () => {}
    )
    return unsubscribe
  }, [])

 const modes = ['solo', 'online', 'bestOfThree', 'team', 'lightning', 'lightning_h2h', 'tournament', 'commonLink']

  return (
    <div className={styles.page}>
      <h1 className={styles.heroTitle}>PLAY</h1>
      <p className={styles.muted}>Pick a mode and jump in</p>
      <SportPicker sport={sport} onSportChange={onSportChange} />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rounds</h2>
        <div className={styles.roundGrid}>
          {[5, 10, 15].map((value) => (
            <button
              key={value}
              className={`${styles.roundButton} ${rounds === value ? styles.active : ''}`}
              type="button"
              onClick={() => onRoundsChange(value)}
            >
              {value} Q
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Choose Mode</h2>
        <div className={styles.modeList}>
          {modes.map((modeId) => (
            <ModeRow key={modeId} modeId={modeId} onSelect={onSelectMode} />
          ))}
          {seasonalEvents.map((event) => (
            <button
              key={event.id}
              className={styles.modeRow}
              type="button"
              onClick={() => onStartSeasonalEvent({
                eventId: event.id,
                eventName: event.name,
                sport: event.sport || sport,
                dailyQuestions: event.dailyQuestions || 10,
                coinMultiplier: event.coinMultiplier || 1,
                entryFee: Math.max(0, Math.round(Number(event.entryFee) || 0)),
                returnTab: 'play',
              })}
            >
              <span className={styles.rowIcon}>🎉</span>
              <span>
                <span className={styles.rowTitle}>{event.name}</span>
                <span className={styles.rowCopy}>{sportLabel(event.sport || sport)} · limited-time event</span>
              </span>
              <span className={styles.rowChevron}>›</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function normalizeBoardEntries(entries) {
  return entries.slice(0, 30)
}

function boardMeta(entry, boardTab) {
  if (boardTab === 'weekly') {
    return `${entry.score || 0} pts · ${entry.daysPlayed || 0} day${entry.daysPlayed === 1 ? '' : 's'} played`
  }
  if (boardTab === 'lightning') {
    return `${entry.correctAnswers || 0}/${entry.totalQuestions || 0} correct · ${entry.accuracyPct || 0}%`
  }
  return `${entry.score || 0}/${entry.totalQuestions || 0} correct · ${entry.accuracyPct || 0}%`
}

function boardScore(entry, boardTab) {
  if (boardTab === 'daily' && entry.totalTimeMs) return `${entry.score || 0}pts`
  return `${entry.score || 0}pts`
}

function entryAvatar(entry) {
  return entry?.avatar || entry?.photoURL || entry?.photoUrl || null
}

function BoardTab({ sport, onSportChange, profile }) {
  const [boardTab, setBoardTab] = useState('daily')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dateKey = useMemo(() => getDateKey(), [])
  const weekKey = useMemo(() => getWeekKey(), [])

  useEffect(() => {
    if (!error) return
    const timeout = window.setTimeout(() => setError(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [error])

  useEffect(() => {
    setLoading(true)
    setError(null)
    setEntries([])

    const listener = boardTab === 'daily'
      ? listenToDailyLeaderboard({ dateKey, sport }, setEntries, () => setError('Leaderboard unavailable.'))
      : boardTab === 'weekly'
      ? listenToWeeklyLeaderboard({ weekKey, sport }, setEntries, () => setError('Leaderboard unavailable.'))
      : listenToLightningLeaderboard({ dateKey, sport }, setEntries, () => setError('Leaderboard unavailable.'))

    const timeout = window.setTimeout(() => setLoading(false), 250)
    return () => {
      window.clearTimeout(timeout)
      listener()
    }
  }, [boardTab, dateKey, sport, weekKey])

  useEffect(() => {
    if (entries) setLoading(false)
  }, [entries])

  const rows = normalizeBoardEntries(entries)
  const podium = [rows[1], rows[0], rows[2]]

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.heroTitle}>LEADERBOARD</h1>
        <button className={styles.sportPill} type="button" onClick={() => onSportChange(sport === 'football' ? 'basketball' : 'football')}>
          {sport === 'football' ? '⚽' : '🏀'} {sportLabel(sport)}
        </button>
      </div>
      <div className={styles.tabGrid}>
        {[
          ['daily', 'Daily'],
          ['weekly', 'Weekly'],
          ['lightning', 'Lightning'],
        ].map(([id, label]) => (
          <button key={id} className={`${styles.tabButton} ${boardTab === id ? styles.active : ''}`} onClick={() => setBoardTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {loading && <p className={styles.emptyState}>Loading board...</p>}
      {error && <p className={styles.emptyState}>{error}</p>}
      {!loading && !error && rows.length === 0 && <p className={styles.emptyState}>No scores yet. First player on the board sets the pace.</p>}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className={styles.leaderHero}>
            {podium.map((entry, index) => (
              <div key={index} className={`${styles.podiumSpot} ${index === 1 ? styles.first : ''}`}>
                <div className={styles.podiumAvatar}>
                  {entry && entryAvatar(entry) ? (
                    <img className={styles.avatarImg} src={entryAvatar(entry)} alt="" />
                  ) : (
                    entry ? avatarInitial(entry.displayName) : '-'
                  )}
                </div>
                <div className={styles.podiumName}>{entry?.displayName || 'Open'}</div>
                <div>{entry ? `${entry.score || entry.correctAnswers || 0} pts` : '--'}</div>
              </div>
            ))}
          </div>
          <div className={styles.leaderList}>
            {rows.map((entry) => (
              <div key={entry.playerId} className={`${styles.leaderRow} ${entry.playerId === profile?.id || entry.playerId === profile?.playerId ? styles.highlight : ''}`}>
                <div className={styles.rank}>{entry.rank}</div>
                <div className={styles.podiumAvatar} style={{ width: 48, height: 48, fontSize: 17 }}>
                  {entryAvatar(entry) ? (
                    <img className={styles.avatarImg} src={entryAvatar(entry)} alt="" />
                  ) : (
                    avatarInitial(entry.displayName)
                  )}
                </div>
                <div>
                  <div className={styles.rowTitle}>{entry.displayName || 'Player'}</div>
                  <div className={styles.rowCopy}>{boardMeta(entry, boardTab)}</div>
                </div>
                <div className={styles.score}>{boardScore(entry, boardTab)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AlertsTab({
  pendingOnlineInvite,
  pendingInvites,
  pendingLightningInvite,
  streakNotice,
  teamInviteLoading,
  teamInviteError,
  onAcceptOnline,
  onDeclineOnline,
  onAcceptTeam,
  onDeclineTeam,
  onAcceptLightning,
  onDeclineLightning,
}) {
  const teamInvites = pendingInvites || []
  const hasNew = pendingOnlineInvite || pendingLightningInvite || teamInvites.length > 0 || streakNotice

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.heroTitle}>ALERTS</h1>
        <button className={styles.linkButton} type="button">Mark all read</button>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>New</h2>
        {!hasNew && <p className={styles.emptyState}>No new alerts right now.</p>}
        {pendingOnlineInvite && (
          <div className={styles.alertRow}>
            <span className={styles.alertIcon}>⚔️</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{pendingOnlineInvite.fromName} challenged you to 1v1!</div>
              <div className={styles.alertCopy}>{sportLabel(pendingOnlineInvite.sport)} · {pendingOnlineInvite.rounds} questions</div>
              <div className={styles.alertActions}>
                <button className={styles.primaryButton} onClick={onAcceptOnline}>Accept</button>
                <button className={styles.dangerButton} onClick={onDeclineOnline}>Decline</button>
              </div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        )}
        {pendingLightningInvite && (
          <div className={styles.alertRow}>
            <span className={styles.alertIcon}>⚡</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{pendingLightningInvite.fromName} challenged you to Lightning!</div>
              <div className={styles.alertCopy}>{sportLabel(pendingLightningInvite.sport)} · 60 seconds · coin stake</div>
              <div className={styles.alertActions}>
                <button className={styles.primaryButton} onClick={onAcceptLightning}>Accept</button>
                <button className={styles.dangerButton} onClick={onDeclineLightning}>Decline</button>
              </div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        )}
        {teamInvites.map((invite) => (
          <div key={invite.id || invite.roomCode} className={styles.alertRow}>
            <span className={styles.alertIcon}>👥</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{invite.fromName || 'A player'} invited you to Team Battle</div>
              <div className={styles.alertCopy}>{sportLabel(invite.sport)} · Room {invite.roomCode}</div>
              {teamInviteError && <div className={styles.alertCopy} style={{ color: '#ff5c5c' }}>{teamInviteError}</div>}
              <div className={styles.alertActions}>
                <button className={styles.primaryButton} disabled={teamInviteLoading === invite.id} onClick={() => onAcceptTeam(invite)}>
                  {teamInviteLoading === invite.id ? '...' : 'Accept'}
                </button>
                <button className={styles.dangerButton} disabled={teamInviteLoading === invite.id} onClick={() => onDeclineTeam(invite)}>Decline</button>
              </div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        ))}
        {streakNotice && (
          <div className={styles.alertRow}>
            <span className={styles.alertIcon}>🔥</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>Streak update</div>
              <div className={styles.alertCopy}>{streakNotice}</div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Earlier</h2>
        <div className={styles.alertRow}>
          <span className={styles.alertIcon}>🎯</span>
          <div className={styles.alertBody}>
            <div className={styles.alertTitle}>Daily Challenge is live</div>
            <div className={styles.alertCopy}>Open Home when the noon window starts.</div>
          </div>
        </div>
      </section>
    </div>
  )
}
function SettingsSidebarScreen({ user, profile, onBack, onProfileUpdated, onUsernameUpdated }) {
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [notifBusy, setNotifBusy] = useState(false)
  const [notifMsg, setNotifMsg] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(user?.displayName || profile?.displayName || '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState(null)

  async function handleEnableNotifications() {
    setNotifBusy(true)
    setNotifMsg(null)
    try {
      const { requestPushNotificationPermission, subscribeUserToPush } = await import('../lib/pushNotifications')
      const permission = await requestPushNotificationPermission()
      setNotifPermission(permission ? 'granted' : 'denied')
      if (permission) {
        const sub = await subscribeUserToPush(user)
        setNotifMsg(sub ? '✅ Notifications enabled!' : '⚠️ Enabled but setup failed.')
      } else {
        setNotifMsg('❌ Permission denied. Enable in your device settings.')
      }
    } catch {
      setNotifMsg('Something went wrong.')
    }
    setNotifBusy(false)
    setTimeout(() => setNotifMsg(null), 4000)
  }

  async function handleRefreshNotifications() {
    setNotifBusy(true)
    setNotifMsg(null)
    try {
      const { refreshPushSubscription } = await import('../lib/pushNotifications')
      const sub = await refreshPushSubscription(user)
      setNotifMsg(sub ? '✅ Notifications refreshed!' : '⚠️ Refresh failed.')
    } catch {
      setNotifMsg('Something went wrong.')
    }
    setNotifBusy(false)
    setTimeout(() => setNotifMsg(null), 4000)
  }

  async function handleSaveName() {
    const nextName = draftName.trim()
    if (!nextName || !user) return
    setSavingName(true)
    try {
      await updateProfile(auth.currentUser, { displayName: nextName })
      await update(ref(db, `users/${user.uid}/profile`), {
        displayName: nextName,
        updatedAt: new Date().toISOString(),
      })
      const { loadProfile, saveProfile } = await import('../lib/profile')
      const cached = loadProfile()
      const nextProfile = saveProfile({ ...cached, displayName: nextName })
      onUsernameUpdated?.(nextName)
      onProfileUpdated?.(nextProfile)
      setEditingName(false)
      setNameMsg('✅ Name updated!')
    } catch {
      setNameMsg('Failed to update name.')
    }
    setSavingName(false)
    setTimeout(() => setNameMsg(null), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: '1px solid var(--card-border)' }}>
        <button
          onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >
          ←
        </button>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#f5f5f0', margin: 0, letterSpacing: '0.05em' }}>SETTINGS</h2>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      
        {/* Display name */}
        <div>
          <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Display Name</p>
          {editingName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                placeholder="Display name"
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-border)',
                  borderRadius: 10, padding: '10px 14px', color: '#f5f5f0', fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !draftName.trim()}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    background: 'var(--accent)', color: 'var(--pitch)', fontWeight: 800,
                    fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingName(false); setDraftName(user?.displayName || '') }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: '1px solid var(--card-border)', background: 'transparent',
                    color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10 }}>
              <span style={{ color: '#f5f5f0', fontSize: 14, fontWeight: 600 }}>{user?.displayName || profile?.displayName || 'Player'}</span>
              <button
                onClick={() => { setEditingName(true); setDraftName(user?.displayName || profile?.displayName || '') }}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                Edit
              </button>
            </div>
          )}
          {nameMsg && <p style={{ color: nameMsg.includes('✅') ? 'var(--accent)' : '#FF5C5C', fontSize: 12, fontWeight: 700, margin: '6px 0 0' }}>{nameMsg}</p>}
        </div>

        {/* Notifications */}
        {typeof window !== 'undefined' && 'Notification' in window && (
          <div>
            <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Notifications</p>
            <div style={{ padding: '12px 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                {notifPermission === 'granted'
                  ? 'Notifications are enabled on this device.'
                  : notifPermission === 'denied'
                  ? 'Notifications are blocked. Enable in your device settings.'
                  : 'Enable notifications for daily challenges, streaks, and match invites.'}
              </p>
              {notifPermission !== 'denied' && (
                <button
                  onClick={notifPermission === 'granted' ? handleRefreshNotifications : handleEnableNotifications}
                  disabled={notifBusy}
                  style={{
                    padding: '10px', borderRadius: 10, border: 'none',
                    background: 'var(--accent)', color: 'var(--pitch)', fontWeight: 800,
                    fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {notifBusy ? '...' : notifPermission === 'granted' ? 'Refresh notifications' : 'Enable notifications'}
                </button>
              )}
              {notifMsg && <p style={{ color: notifMsg.includes('✅') ? 'var(--accent)' : '#FF5C5C', fontSize: 12, fontWeight: 700, margin: 0 }}>{notifMsg}</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
function HubTab({
  user,
  coinBalance,
  pendingOnlineInvite,
  pendingInvites,
  pendingLightningInvite,
  streakNotice,
  teamInviteLoading,
  teamInviteError,
  onAcceptOnline,
  onDeclineOnline,
  onAcceptTeam,
  onDeclineTeam,
  onAcceptLightning,
  onDeclineLightning,
  onCoinsUpdated,
}) {
  const [loginReward, setLoginReward] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [claimMsg, setClaimMsg] = useState(null)
  const [missions, setMissions] = useState([])
  const [missionsClaimed, setMissionsClaimed] = useState(false)
  const [missionsLoading, setMissionsLoading] = useState(true)
  const [missionClaiming, setMissionClaiming] = useState(false)
  const [missionClaimSuccess, setMissionClaimSuccess] = useState(false)

  const DAILY_REWARD_AMOUNT = 10
  const WEEKLY_REWARD = 100
  const todayKey = getDateKey()

  useEffect(() => {
    if (!user?.uid) return
    get(ref(db, `users/${user.uid}/dailyLoginReward`)).then(snap => {
      setLoginReward(snap.val() || null)
    }).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    getOrCreateWeeklyMissions(user.uid)
      .then(({ missions: m, claimed: c }) => {
        setMissions(m)
        setMissionsClaimed(c)
        setMissionsLoading(false)
      })
      .catch(() => setMissionsLoading(false))
  }, [user?.uid])

  const alreadyClaimedToday = loginReward?.lastClaimedDate === todayKey
  const loginStreak = loginReward?.streak || 0
  const dayIndex = alreadyClaimedToday ? ((loginStreak - 1) % 7) : (loginStreak % 7)

  async function handleClaimDaily() {
    if (!user?.uid || claiming || alreadyClaimedToday) return
    setClaiming(true)
    setClaimMsg(null)
    try {
      const newStreak = (loginReward?.streak || 0) + 1
      await update(ref(db, `users/${user.uid}/dailyLoginReward`), {
        lastClaimedDate: todayKey,
        streak: newStreak,
        totalClaimed: (loginReward?.totalClaimed || 0) + DAILY_REWARD_AMOUNT,
        updatedAt: Date.now(),
      })
      const result = await awardCoins({
        userId: user.uid,
        amount: DAILY_REWARD_AMOUNT,
        reason: 'daily_login_reward',
        sourceId: `daily-login:${user.uid}:${todayKey}`,
        metadata: { dateKey: todayKey },
      })
      if (result.ok) {
        setLoginReward(prev => ({ ...prev, lastClaimedDate: todayKey, streak: newStreak }))
        setClaimMsg(`+${DAILY_REWARD_AMOUNT} coins claimed!`)
        onCoinsUpdated?.()
      }
    } catch (e) {
      console.error('Daily login reward failed:', e)
      setClaimMsg('Something went wrong.')
    }
    setClaiming(false)
    setTimeout(() => setClaimMsg(null), 3000)
  }

  async function handleClaimWeekly() {
    const allComplete = missions.length > 0 && missions.every(m => m.completed)
    if (!allComplete || missionsClaimed || missionClaiming) return
    setMissionClaiming(true)
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
        setMissionsClaimed(true)
        setMissionClaimSuccess(true)
        onCoinsUpdated?.()
      }
    } catch (e) {
      console.error('Failed to claim weekly reward:', e)
    }
    setMissionClaiming(false)
  }

  const allMissionsComplete = missions.length > 0 && missions.every(m => m.completed)
  const completedCount = missions.filter(m => m.completed).length
  const teamInvites = pendingInvites || []
  const hasNew = pendingOnlineInvite || pendingLightningInvite || teamInvites.length > 0 || streakNotice

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.heroTitle}>HUB</h1>
      </div>

      {/* Daily Login Reward */}
      <section className={styles.section}>
        <div className={styles.dailyCard}>
          <span className={styles.dailyBadge}>Daily Reward</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 14 }}>
            <p className={styles.muted} style={{ fontSize: 13, margin: 0 }}>Log in every day to earn coins</p>
            <span style={{ color: '#00FF87', fontWeight: 800, fontSize: 14 }}>+{DAILY_REWARD_AMOUNT} coins</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const filled = alreadyClaimedToday ? i <= dayIndex : i < dayIndex
              const isToday = i === dayIndex
              return (
                <div
                  key={i}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    background: filled ? '#00FF87' : isToday && !alreadyClaimedToday ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.06)',
                    border: isToday && !alreadyClaimedToday ? '2px solid #00FF87' : filled ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: filled ? '#08180d' : isToday ? '#00FF87' : 'rgba(230,240,232,0.35)',
                  }}
                >
                  {i + 1}
                </div>
              )
            })}
          </div>
          {claimMsg && (
            <p style={{ color: claimMsg.includes('wrong') ? '#FF5C5C' : '#00FF87', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
              {claimMsg}
            </p>
          )}
          <button
            className={styles.dailyBtn}
            type="button"
            style={{ width: '100%' }}
            disabled={alreadyClaimedToday || claiming}
            onClick={handleClaimDaily}
          >
            {alreadyClaimedToday ? '✓ Claimed today' : claiming ? 'Claiming...' : 'Claim daily reward'}
          </button>
        </div>
      </section>

      {/* Weekly Missions */}
      <section className={styles.section}>
        <div className={styles.dailyCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className={styles.dailyBadge}>Weekly Missions</span>
            <span style={{ color: allMissionsComplete ? '#00FF87' : 'rgba(230,240,232,0.45)', fontSize: 12, fontWeight: 700 }}>
              {missionsLoading ? '...' : `${completedCount}/4 done`}
            </span>
          </div>
          {!missionsLoading && (
            <>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${(completedCount / 4) * 100}%`, background: '#00FF87', borderRadius: 999, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {missions.map(mission => (
                  <div
                    key={mission.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      padding: '12px 14px', borderRadius: 12,
                      background: mission.completed ? 'rgba(0,255,135,0.06)' : 'rgba(255,255,255,0.04)',
                      border: mission.completed ? '1px solid rgba(0,255,135,0.2)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{mission.completed ? '✅' : '🎯'}</span>
                      <div>
                        <p style={{ color: '#f5f5f0', fontSize: 13, fontWeight: 700, margin: 0 }}>{mission.label}</p>
                        <p style={{ color: 'rgba(230,240,232,0.45)', fontSize: 11, margin: '2px 0 0' }}>{mission.description}</p>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <p style={{ color: mission.completed ? '#00FF87' : 'rgba(230,240,232,0.45)', fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>
                        {mission.progress}/{mission.target}
                      </p>
                      <div style={{ width: 52, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min((mission.progress / mission.target) * 100, 100)}%`, background: '#00FF87', borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {missionClaimSuccess && (
                <div style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', borderRadius: 10, padding: '10px 14px', color: '#00FF87', fontWeight: 700, fontSize: 13, textAlign: 'center', marginBottom: 10 }}>
                  🎉 100 coins claimed!
                </div>
              )}
              <button
                className={styles.dailyBtn}
                type="button"
                style={{
                  width: '100%',
                  ...(!allMissionsComplete || missionsClaimed ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(230,240,232,0.4)', cursor: 'not-allowed' } : {})
                }}
                disabled={!allMissionsComplete || missionsClaimed || missionClaiming}
                onClick={handleClaimWeekly}
              >
                {missionClaiming ? 'Claiming...' : missionsClaimed ? '✅ Reward Claimed' : allMissionsComplete ? '🏆 Claim 100 Coins' : 'Complete all missions to claim'}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Alerts */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ALERTS</h2>
        {!hasNew && <p className={styles.emptyState}>No new alerts right now.</p>}
        {pendingOnlineInvite && (
          <div className={styles.alertRow}>
            <span className={styles.alertIcon}>⚔️</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{pendingOnlineInvite.fromName} challenged you to 1v1!</div>
              <div className={styles.alertCopy}>{sportLabel(pendingOnlineInvite.sport)} · {pendingOnlineInvite.rounds} questions</div>
              <div className={styles.alertActions}>
                <button className={styles.primaryButton} onClick={onAcceptOnline}>Accept</button>
                <button className={styles.dangerButton} onClick={onDeclineOnline}>Decline</button>
              </div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        )}
        {pendingLightningInvite && (
          <div className={styles.alertRow}>
            <span className={styles.alertIcon}>⚡</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{pendingLightningInvite.fromName} challenged you to Lightning!</div>
              <div className={styles.alertCopy}>{sportLabel(pendingLightningInvite.sport)} · 60 seconds · coin stake</div>
              <div className={styles.alertActions}>
                <button className={styles.primaryButton} onClick={onAcceptLightning}>Accept</button>
                <button className={styles.dangerButton} onClick={onDeclineLightning}>Decline</button>
              </div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        )}
        {teamInvites.map((invite) => (
          <div key={invite.id || invite.roomCode} className={styles.alertRow}>
            <span className={styles.alertIcon}>👥</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{invite.fromName || 'A player'} invited you to Team Battle</div>
              <div className={styles.alertCopy}>{sportLabel(invite.sport)} · Room {invite.roomCode}</div>
              {teamInviteError && <div className={styles.alertCopy} style={{ color: '#ff5c5c' }}>{teamInviteError}</div>}
              <div className={styles.alertActions}>
                <button className={styles.primaryButton} disabled={teamInviteLoading === invite.id} onClick={() => onAcceptTeam(invite)}>
                  {teamInviteLoading === invite.id ? '...' : 'Accept'}
                </button>
                <button className={styles.dangerButton} disabled={teamInviteLoading === invite.id} onClick={() => onDeclineTeam(invite)}>Decline</button>
              </div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        ))}
        {streakNotice && (
          <div className={styles.alertRow}>
            <span className={styles.alertIcon}>🔥</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>Streak update</div>
              <div className={styles.alertCopy}>{streakNotice}</div>
            </div>
            <span className={styles.unreadDot} />
          </div>
        )}
        <div className={styles.alertRow}>
          <span className={styles.alertIcon}>🎯</span>
          <div className={styles.alertBody}>
            <div className={styles.alertTitle}>Daily Challenge is live</div>
            <div className={styles.alertCopy}>Open Home when the noon window starts.</div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FriendsTab({ profile, user, sport, onStartOnline, onStartTeam, onStartLightningH2H, onFriendRequestHandled }) {
  const [myPlayerId, setMyPlayerId] = useState(profile?.playerId || '')
  const [targetPlayerId, setTargetPlayerId] = useState('')
  const [requests, setRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [publicFriendProfiles, setPublicFriendProfiles] = useState({})
  const [mySummary, setMySummary] = useState({ streak: 0, recentForm: '' })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [activeFriend, setActiveFriend] = useState(null)
  const [challengeSheetOpen, setChallengeSheetOpen] = useState(false)

  useEffect(() => {
    if (!error) return
    const timeout = window.setTimeout(() => setError(''), 5000)
    return () => window.clearTimeout(timeout)
  }, [error])

  useEffect(() => {
    const localProfile = loadProfile()
    setMyPlayerId(localProfile?.playerId || profile?.playerId || '')
  }, [profile?.playerId])

  useEffect(() => {
    if (!myPlayerId) return
    const unsubRequests = listenToFriendRequests(myPlayerId, setRequests)
    const unsubFriends = listenToFriends(myPlayerId, setFriends)
    return () => {
      unsubRequests()
      unsubFriends()
    }
  }, [myPlayerId])

  useEffect(() => {
    let active = true
    if (!friends.length) {
      setPublicFriendProfiles({})
      return () => {}
    }

    const publicRef = ref(db, 'publicProfiles')
    const unsubscribe = onValue(publicRef, (snap) => {
      if (!active) return
      const allPublicProfiles = snap.val() || {}
      const nextProfiles = {}
      friends.forEach((friend) => {
        nextProfiles[friend.friendPlayerId] = allPublicProfiles[friend.friendPlayerId] || null
      })
      setPublicFriendProfiles(nextProfiles)
    }, () => {
      if (active) setPublicFriendProfiles({})
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [friends])

  useEffect(() => {
    if (!user?.uid) return
    let active = true
    async function loadMySummary() {
      try {
        const [statsSnap, matchesSnap] = await Promise.all([
          get(ref(db, `users/${user.uid}/stats`)),
          get(ref(db, `users/${user.uid}/matches`)),
        ])
        if (!active) return
        const matches = matchesSnap.val() ? Object.values(matchesSnap.val()) : []
        const form = buildFormBadge(matches, 5).map(result => (result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D')).join('')
        setMySummary({
          streak: Number(statsSnap.val()?.winStreak) || 0,
          recentForm: form,
        })
        await syncPublicProfile(user.uid, profile?.displayName || user.displayName || 'Player')
      } catch {
        if (active) setMySummary({ streak: 0, recentForm: '' })
      }
    }
    loadMySummary()
    return () => { active = false }
  }, [user?.uid, profile?.displayName])

  async function handleSendRequest() {
    if (!myPlayerId) {
      setError('Your Player ID is still loading.')
      return
    }
    setSending(true)
    setError('')
    setStatus('')
    try {
      const requestResult = await sendFriendRequest({
        fromPlayerId: myPlayerId,
        toPlayerId: targetPlayerId,
        fromDisplayName: profile?.displayName || 'Player',
        fromStreak: mySummary.streak,
        fromRecentForm: mySummary.recentForm,
      })
      if (requestResult?.toUserId) {
        sendFriendRequestPushNotification({
          toUserId: requestResult.toUserId,
          fromName: profile?.displayName || 'Player',
        }).catch(() => {})
      }
      setStatus(requestResult?.mutual ? 'You are now friends.' : 'Friend request sent.')
      setTargetPlayerId('')
    } catch (requestError) {
      setError(requestError.message || 'Could not send friend request.')
    } finally {
      setSending(false)
    }
  }

  async function handleRequestAction(fromPlayerId, accept) {
    if (!myPlayerId) return
    setBusyId(fromPlayerId)
    setError('')
    setStatus('')
    try {
      if (accept) {
        await acceptFriendRequest({
          myPlayerId,
          fromPlayerId,
          myDisplayName: profile?.displayName || 'Player',
          myStreak: mySummary.streak,
          myRecentForm: mySummary.recentForm,
        })
        setStatus(`You are now friends with ${fromPlayerId}.`)
      } else {
        await declineFriendRequest({ myPlayerId, fromPlayerId })
      }
      setRequests((prev) => prev.filter((request) => request.fromPlayerId !== fromPlayerId))
      onFriendRequestHandled?.(fromPlayerId)
    } catch (requestError) {
      setError(requestError.message || 'Could not update friend request.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleUnfriend() {
    if (!myPlayerId || !activeFriend?.friendPlayerId) return
    const confirmed = window.confirm(`Remove ${activeFriend.displayName} from your friends list?`)
    if (!confirmed) return
    try {
      await removeFriend({ myPlayerId, friendPlayerId: activeFriend.friendPlayerId })
      setStatus('Friend removed.')
      setActiveFriend(null)
    } catch (requestError) {
      setError(requestError.message || 'Could not remove friend.')
    }
  }

  function openFriendProfile(friend) {
    setActiveFriend(friend)
    setChallengeSheetOpen(false)
  }

  function openChallengeSheet() {
    setChallengeSheetOpen(true)
  }

  function closeChallengeSheet() {
    setChallengeSheetOpen(false)
  }

  function launchChallenge(mode) {
    if (!activeFriend?.friendPlayerId) return
    const opponentPlayerId = activeFriend.friendPlayerId

    if (mode === 'online') {
      onStartOnline({ sport, rounds: 10, returnTab: 'friends', opponentPlayerId })
    } else if (mode === 'team') {
      onStartTeam({ sport, returnTab: 'friends', opponentPlayerId })
    } else {
      onStartLightningH2H({ sport, opponentPlayerId })
    }

    setActiveFriend(null)
    setChallengeSheetOpen(false)
  }

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>Friends</p>
      <h1 className={styles.heroTitle}>Friends</h1>
      <p className={styles.muted}>Add by Player ID, accept requests, and challenge your circle faster.</p>

      <div className={`${styles.section} ${styles.friendsSectionCard}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Add by Player ID</h2>
        </div>
        <div className={styles.friendsAddRow}>
          <input
            type="text"
            value={targetPlayerId}
            onChange={(event) => setTargetPlayerId(event.target.value.toUpperCase())}
            placeholder="FTB-XXXX"
            className={styles.friendsInput}
          />
          <button
            type="button"
            className={styles.dailyBtn}
            onClick={handleSendRequest}
            disabled={sending || !targetPlayerId.trim()}
            style={{ minWidth: 90 }}
          >
            {sending ? 'Sending' : 'Add'}
          </button>
        </div>
      </div>

      {error && <p className={styles.muted} style={{ color: '#FF5C5C', marginTop: 10 }}>{error}</p>}
      {status && <p className={styles.muted} style={{ color: 'var(--green)', marginTop: 10 }}>{status}</p>}

      <div className={`${styles.section} ${styles.friendsSectionCard}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Friend Requests</h2>
        </div>
        {!requests.length && <p className={styles.emptyState}>No pending requests.</p>}
        {!!requests.length && requests.map((request) => (
          <div key={request.fromPlayerId} className={`${styles.alertRow} ${styles.friendsRow}`}>
            <span className={styles.alertIcon}>👤</span>
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{request.fromDisplayName}</div>
              <div className={styles.alertCopy}>{request.fromPlayerId}</div>
              <div className={styles.alertActions}>
                <button
                  type="button"
                  className={styles.dailyBtn}
                  onClick={() => handleRequestAction(request.fromPlayerId, true)}
                  disabled={busyId === request.fromPlayerId}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => handleRequestAction(request.fromPlayerId, false)}
                  disabled={busyId === request.fromPlayerId}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${styles.section} ${styles.friendsSectionCard}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Friends</h2>
        </div>
        {!friends.length && <p className={styles.emptyState}>No friends yet. Add one by Player ID.</p>}
        {!!friends.length && friends.map((friend) => (
          <button
            key={friend.friendPlayerId}
            type="button"
            className={`${styles.alertRow} ${styles.friendsRow} ${styles.friendCardButton}`}
            onClick={() => openFriendProfile(friend)}
          >
            <span className={styles.alertIcon}>👥</span>
          <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{friend.displayName}</div>
              <div className={styles.alertCopy}>{friend.friendPlayerId} · Friend</div>
              <div className={styles.friendMetaLine}>
                <span className={styles.friendStreak}>{(publicFriendProfiles[friend.friendPlayerId]?.winStreak ?? friend.streak ?? 0)} win streak</span>
                <span className={styles.friendForm}>
                  {((publicFriendProfiles[friend.friendPlayerId]?.recentForm || friend.recentForm || '.....')).split('').slice(0, 5).map((item, index) => (
                    <span
                      key={`${friend.friendPlayerId}-${index}`}
                      className={`${styles.friendFormDot} ${item === 'W' ? styles.friendFormWin : item === 'L' ? styles.friendFormLoss : item === 'D' ? styles.friendFormDraw : styles.friendFormNeutral}`}
                    />
                  ))}
                </span>
              </div>
            </div>
            <span className={styles.rowChevron}>›</span>
          </button>
        ))}
      </div>

      {activeFriend && !challengeSheetOpen && (
        <div className={styles.friendModalBackdrop} onClick={() => setActiveFriend(null)}>
          <div className={styles.friendModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.friendModalHeader}>
              <div className={styles.friendAvatarBadge}>
                {(activeFriend.displayName || 'F').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className={styles.alertTitle}>{activeFriend.displayName}</div>
                <div className={styles.alertCopy}>{activeFriend.friendPlayerId}</div>
                <div className={styles.alertCopy}>Added {new Date(activeFriend.addedAt || Date.now()).toLocaleDateString()}</div>
                <div className={styles.friendMetaLine} style={{ marginTop: 8 }}>
                  <span className={styles.friendStreak}>{(publicFriendProfiles[activeFriend.friendPlayerId]?.winStreak ?? activeFriend.streak ?? 0)} win streak</span>
                  <span className={styles.friendForm}>
                    {((publicFriendProfiles[activeFriend.friendPlayerId]?.recentForm || activeFriend.recentForm || '.....')).split('').slice(0, 5).map((item, index) => (
                      <span
                        key={`${activeFriend.friendPlayerId}-modal-${index}`}
                        className={`${styles.friendFormDot} ${item === 'W' ? styles.friendFormWin : item === 'L' ? styles.friendFormLoss : item === 'D' ? styles.friendFormDraw : styles.friendFormNeutral}`}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.friendsActionRow}>
              <button
                type="button"
                className={styles.dailyBtn}
                onClick={openChallengeSheet}
              >
                Challenge
              </button>
              <button type="button" className={styles.ghostButton} onClick={handleUnfriend}>
                Unfriend
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFriend && challengeSheetOpen && (
        <div className={styles.friendModalBackdrop} onClick={closeChallengeSheet}>
          <div className={`${styles.friendModal} ${styles.challengeSheet}`} onClick={(event) => event.stopPropagation()}>
            <div className={styles.challengeSheetHeader}>
              <div>
                <div className={styles.alertTitle}>Challenge {activeFriend.displayName}</div>
                <div className={styles.alertCopy}>{activeFriend.friendPlayerId}</div>
              </div>
              <button type="button" className={styles.challengeCloseBtn} onClick={closeChallengeSheet}>
                Close
              </button>
            </div>
            <div className={styles.challengeSheetGrid}>
              <button type="button" className={styles.challengeModeBtn} onClick={() => launchChallenge('online')}>
                <span className={styles.challengeModeTitle}>Online 1v1</span>
                <span className={styles.challengeModeCopy}>Choose 5, 10, or 15 questions</span>
              </button>
              <button type="button" className={styles.challengeModeBtn} onClick={() => launchChallenge('team')}>
                <span className={styles.challengeModeTitle}>Team Battle</span>
                <span className={styles.challengeModeCopy}>Open team setup with this friend</span>
              </button>
              <button type="button" className={`${styles.challengeModeBtn} ${styles.challengeModePrimary}`} onClick={() => launchChallenge('lightning')}>
                <span className={styles.challengeModeTitle}>Lightning Duel</span>
                <span className={styles.challengeModeCopy}>Fast head-to-head duel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileTab({ user, profile, coinBalance, onAdmin, onEditProfile, onProfileUpdated, isAdmin, onLogout, onWeeklyMissions }) {
  const [playerId, setPlayerId] = useState(profile?.playerId || null)
  const [stats, setStats] = useState(null)
  const [matches, setMatches] = useState([])
  const [streak, setStreak] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(user?.displayName || profile?.displayName || '')
  const [savingName, setSavingName] = useState(false)
  const [copied, setCopied] = useState(false)
  const name = user?.displayName || profile?.displayName || 'Player'
  const avatar = getPlayerAvatar(user, profile)

  useEffect(() => {
    if (!user?.uid) return
    let active = true
    async function loadProfileData() {
      const [playerSnap, statsSnap, matchesSnap, streakSnap] = await Promise.all([
        get(ref(db, `users/${user.uid}/playerId`)),
        get(ref(db, `users/${user.uid}/stats`)),
        get(ref(db, `users/${user.uid}/matches`)),
        get(ref(db, `users/${user.uid}/dailyStreak`)),
      ])
      if (!active) return
      const allMatches = matchesSnap.val() ? Object.values(matchesSnap.val()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : []
      const wins = allMatches.filter((match) => match.result === 'win').length
      const totalGames = allMatches.length || statsSnap.val()?.totalGames || 0
      setPlayerId(playerSnap.val() || profile?.playerId || null)
      setMatches(allMatches.slice(0, 6))
      setStreak(streakSnap.val() || null)
      setStats({
        ...(statsSnap.val() || {}),
        totalGames,
        wins: wins || statsSnap.val()?.wins || 0,
      })
    }
    loadProfileData().catch(console.error)
    return () => { active = false }
  }, [profile?.playerId, user?.uid])

  const totalGames = stats?.totalGames || 0
  const wins = stats?.wins || 0
  const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0
  const milestones = getUnlockedMilestones({
    wins,
    totalPoints: stats?.totalPoints || 0,
    dailyStreakBest: streak?.best || 0,
  })

  async function handleSaveName() {
    const nextName = draftName.trim()
    if (!nextName || !user) return
    setSavingName(true)
    try {
      await updateProfile(user, { displayName: nextName })
      await update(ref(db, `users/${user.uid}/profile`), {
        displayName: nextName,
        updatedAt: new Date().toISOString(),
      })
      const nextProfile = saveProfile({ displayName: nextName, playerId, avatar: profile?.avatar })
      onProfileUpdated?.(nextProfile)
      setEditingName(false)
    } catch (error) {
      console.error('Failed to update profile name:', error)
    } finally {
      setSavingName(false)
    }
  }

  function handleCopyPlayerId() {
    if (!playerId) return
    navigator.clipboard?.writeText(playerId).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.heroTitle}>PROFILE</h1>
        <button className={styles.linkButton} type="button" onClick={() => setEditingName((value) => !value)}>
          {editingName ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>
          {avatar ? <img className={styles.avatarImg} src={avatar} alt="" /> : avatarInitial(name)}
        </div>
        <div>
          {editingName ? (
            <div className={styles.inlineEdit}>
              <input
                className={styles.profileInput}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Display name"
              />
              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleSaveName}
                disabled={savingName || !draftName.trim()}
              >
                {savingName ? 'Saving' : 'Save'}
              </button>
            </div>
          ) : (
            <div className={styles.profileName}>{name}</div>
          )}
          <button className={styles.profileIdButton} type="button" onClick={handleCopyPlayerId}>
            ID: {playerId || 'Loading...'} {copied ? 'Copied' : ''}
          </button>
          <div className={styles.badgeRow}>
            <span className={styles.badgePill}>🔥 {streak?.current || 0}-day streak</span>
            <span className={styles.badgePill}>🏅 {wins} Wins</span>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}><div><div className={styles.statValue}>{totalGames}</div><div className={styles.statLabel}>Matches Played</div></div></div>
          <div className={styles.statBox}><div><div className={styles.statValue}>{wins}</div><div className={styles.statLabel}>Wins</div></div></div>
          <div className={styles.statBox}><div><div className={styles.statValue}>{winRate}%</div><div className={styles.statLabel}>Win Rate</div></div></div>
          <div className={styles.statBox}><div><div className={styles.statValue}>{coinBalance}</div><div className={styles.statLabel}>Coins</div></div></div>
          <div className={styles.statBox}><div><div className={styles.statValue}>{streak?.current || 0}</div><div className={styles.statLabel}>Day Streak</div></div></div>
          <div className={styles.statBox}><div><div className={styles.statValue}>--</div><div className={styles.statLabel}>Daily Rank</div></div></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Badges</h2>
          <button className={styles.linkButton} type="button">See all</button>
        </div>
        <div className={styles.badgeRow}>
          {(milestones.length ? milestones : [{ id: 'starter', label: 'New Player' }]).map((badge) => (
            <span key={badge.id} className={styles.badgePill}>{badge.label}</span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Match History</h2>
          <button className={styles.linkButton} type="button">See all</button>
        </div>
        <div className={styles.profilePanel}>
          {matches.length === 0 && <p className={styles.muted}>No matches yet. Start a 1v1 or team game to build your history.</p>}
          {matches.map((match, index) => (
            <div key={`${match.timestamp || index}`} className={styles.matchRow}>
              <span className={styles.resultBadge}>{match.result === 'win' ? 'W' : match.result === 'draw' ? 'D' : 'L'}</span>
              <div>
                <div className={styles.rowTitle}>vs {match.opponentName || 'Opponent'}</div>
                <div className={styles.rowCopy}>{sportLabel(match.sport)} · {match.rounds || match.questionsCount || 0} questions</div>
              </div>
              <div className={styles.score}>{match.myScore ?? match.memberScore ?? ''}{match.opponentScore !== null && match.opponentScore !== undefined ? `-${match.opponentScore}` : ''}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        {isAdmin && <button className={styles.primaryButton} type="button" onClick={onAdmin} style={{ width: '100%', marginBottom: 12 }}>Admin Dashboard</button>}
        <button className={styles.ghostButton} type="button" onClick={onEditProfile} style={{ width: '100%', marginBottom: 12 }}>Change avatar and more</button>
        <button className={styles.ghostButton} type="button" onClick={onLogout} style={{ width: '100%' }}>Log out</button>
      </section>
    </div>
  )
}

export default function MainShell({
  initialTab = 'home',
  initialSidebarScreen = null,
  sport,
  onSportChange,
  user,
  profile,
  coinBalance,
  dailyPlayed,
  pendingOnlineInvite,
  pendingInvites,
  pendingLightningInvite,
  streakNotice,
  onStartSolo,
  onStartOnline,
  onStartTeam,
  onStartDaily,
  onStartTournament,
  onStartLightning,
  onStartLightningH2H,
  onStartSeasonalEvent,
  onStartCommonLink,
  onStartBestOfThree,
  onWeeklyMissions,
  onCoinsUpdated,
  onAcceptOnlineInvite,
  onDeclineOnlineInvite,
  onAcceptTeamInvite,
  onDeclineTeamInvite,
  onAcceptLightningInvite,
  onDeclineLightningInvite,
  onAdmin,
  onOpenBlog,
  onEditProfile,
  onUsernameUpdated,
  onProfileUpdated,
  onLogout,
  isAdmin,
  
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [rounds, setRounds] = useState(5)
  const [teamInviteLoading, setTeamInviteLoading] = useState(null)
  const [teamInviteError, setTeamInviteError] = useState('')
  const [friendRequests, setFriendRequests] = useState([])
  const hasIncomingChallenge = Boolean(pendingOnlineInvite || pendingLightningInvite)

  useEffect(() => {
    setActiveTab(initialTab || 'home')
  }, [initialTab])

  useEffect(() => {
    const localProfile = loadProfile()
    const myPlayerId = localProfile?.playerId || profile?.playerId
    if (!myPlayerId) {
      setFriendRequests([])
      return
    }
    return listenToFriendRequests(myPlayerId, setFriendRequests)
  }, [profile?.playerId])

  useEffect(() => {
  if (!user) return
  setShowNotifNudge(shouldShowNudge())
}, [user])

  function handleSelectMode(modeId) {
    if (modeId === 'playTab') {
      setActiveTab('play')
      return
    }
    if (modeId === 'solo') {
      onStartSolo({ name: user?.displayName || profile?.displayName || 'Player', rounds, sport, returnTab: activeTab })
      return
    }
    if (modeId === 'online') {
      onStartOnline({ sport, rounds, returnTab: activeTab })
      return
    }
    if (modeId === 'team') {
      onStartTeam({ sport, returnTab: activeTab })
      return
    }
    if (modeId === 'lightning') {
      onStartLightning({ sport, returnTab: activeTab })
      return
    }
    if (modeId === 'lightning_h2h') {
      onStartLightning({ sport, returnTab: activeTab })
      return
    }
    if (modeId === 'tournament') {
      onStartTournament({ returnTab: activeTab })
      return
    }
      if (modeId === 'commonLink') {
    onStartCommonLink({ sport, returnTab: activeTab })
    return
    }
    if (modeId === 'bestOfThree') {
    onStartBestOfThree({ sport, rounds, returnTab: activeTab })
    return
    }
    if (modeId === 'daily') {
      onStartDaily({ sport, returnTab: activeTab })
    }
  }

  async function handleTeamInvite(invite, accept) {
    const localProfile = loadProfile()
    const playerId = localProfile?.playerId || profile?.playerId
    if (!playerId || !user?.uid) return

    const inviteWager = Math.max(TEAM_PLAYER_WAGER, Math.round(Number(invite.wager) || 0))
    setTeamInviteLoading(invite.id)
    setTeamInviteError('')

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
          setTeamInviteError(`You need ${inviteWager} coins to accept this team invite.`)
          setTeamInviteLoading(null)
          return
        }
      }

      await respondToInvite({
        playerId,
        inviteId: invite.id,
        accept,
        uid: user.uid,
        displayName: user.displayName || profile?.displayName || 'Player',
        roomCode: invite.roomCode,
        teamId: invite.teamId,
        wager: inviteWager,
        photoURL: getPlayerAvatar(user, profile),
      })

      if (accept) onAcceptTeamInvite(invite)
    } catch (error) {
      setTeamInviteError(error.message || 'Could not update invite.')
    } finally {
      setTeamInviteLoading(null)
    }
  }

 const [sidebarOpen, setSidebarOpen] = useState(false)
 console.log('sport in MainShell:', sport)
  const [sidebarScreen, setSidebarScreen] = useState('main')


  useEffect(() => {
    if (initialSidebarScreen) {
      setSidebarScreen(initialSidebarScreen)
    }
  }, [initialSidebarScreen])
  const touchStartX = useRef(0)
  const [showNotifNudge, setShowNotifNudge] = useState(false)

  function handleTouchStartShell(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEndShell(e) {
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (touchStartX.current < 40 && diff > 50) setSidebarOpen(true)
    if (diff < -50) setSidebarOpen(false)
  }

  return (
    <div
      className={styles.shell}
      onTouchStart={handleTouchStartShell}
      onTouchEnd={handleTouchEndShell}
    >
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}
        {/* About modal */}
      {sidebarScreen === 'about' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            padding: 20,
          }}
          onClick={() => setSidebarScreen('main')}
        >
          <div
            style={{
              background: 'var(--pitch-mid)', border: '1px solid var(--card-border)',
              borderRadius: 16, width: '100%', maxWidth: 380,
              maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '20px 20px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#f5f5f0', margin: 0, letterSpacing: '0.05em' }}>ABOUT TRIVELA</h2>
              <button
                onClick={() => setSidebarScreen('main')}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src="/logo-mark.svg" alt="Trivela" style={{ width: 48, height: 48 }} />
                <div>
                  <p style={{ color: '#f5f5f0', fontSize: 18, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.08em', margin: 0 }}>TRIVELA</p>
                </div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Trivela is a competitive sports trivia app for football and basketball fans. Test your knowledge, build streaks, earn coins, and compete against players around the world.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Sports', value: 'Football & Basketball' },
                  { label: 'Game Modes', value: '10 ways to play' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>{item.label}</span>
                    <span style={{ color: '#f5f5f0', fontSize: 13, fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {sidebarScreen === 'feedback' && (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      padding: 20,
    }}
    onClick={() => setSidebarScreen('main')}
  >
    <div
      style={{
        background: 'var(--pitch-mid)', border: '1px solid var(--card-border)',
        borderRadius: 16, width: '100%', maxWidth: 380,
        maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Feedback user={user} onBack={() => setSidebarScreen('main')} />
    </div>
  </div>
)}
      {/* Settings modal */}
      {sidebarScreen === 'settings' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            padding: 20,
          }}
          onClick={() => setSidebarScreen('main')}
        >
            <div
            style={{
              background: 'var(--pitch-mid)', border: '1px solid var(--card-border)',
              borderRadius: 16, width: '100%', maxWidth: 380,
              maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SettingsSidebarScreen
              user={user}
              profile={profile}
              onBack={() => setSidebarScreen('main')}
              onProfileUpdated={onProfileUpdated}
              onUsernameUpdated={onUsernameUpdated}
            />
          </div>
        </div>
      )}
      {/* How to Play full-screen takeover */}
      {sidebarScreen === 'howToPlay' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'var(--pitch)', overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={() => setSidebarScreen('main')}
              style={{ background: 'transparent', border: 'none', color: 'rgba(230,240,232,0.45)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >
              ←
            </button>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#f5f5f0', margin: 0, letterSpacing: '0.05em' }}>HOW TO PLAY</h2>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '🎯', title: 'Solo Quiz', desc: 'Choose 5, 10, or 15 questions and play through them at your own pace. Each correct answer earns coins, with a small completion bonus and a perfect-score bonus if you get every question right.' },
              { icon: '📅', title: 'Daily Challenge', desc: 'A new shared quiz unlocks for everyone at the same time, separately for football and basketball. Everyone gets the same questions, so it comes down to score first and completion time second. You can only play it once per day, and it pays double coins compared to a solo run.' },
              { icon: '⚔️', title: 'Online 1v1', desc: 'Create or join a real-time head-to-head room against another player. You both answer the same set of questions — the first person to answer correctly wins that point. If the match ends in a tie, a tiebreaker question decides the winner.' },
              { icon: '👥', title: 'Team Battle', desc: 'Create a team room and invite other players using their Player ID. Each teammate gets their own set of questions to answer, and your individual scores combine into a total team score. Teams need a balanced roster before the match can start, and the winning team splits the coin payout.' },
              { icon: '⚡', title: 'Lightning Solo', desc: 'A fast-paced 60-second mode — answer as many questions as you can before time runs out. Your score is based on how many you get right, and your best runs appear on the Lightning leaderboard for your sport.' },
              { icon: '⚡', title: 'Lightning 1v1', desc: 'Invite a friend using their Player ID to a 60-second duel. Both players stake coins to enter, and whoever scores higher takes the entire pot. A draw refunds both players their stake.' },
              { icon: '🏆', title: 'Tournament', desc: 'Join or create a single-elimination bracket tournament — public tournaments anyone can browse and join, or private ones shared with a 6-character code. As players win matches they advance through the bracket automatically until a champion is crowned.' },
              { icon: '🥊', title: 'Best of 3', desc: 'A 3-round series against another player — first to win 2 rounds takes the match. Both players stake coins to enter, there\'s a short break between rounds, and the winner takes the full pot. Leaving mid-series counts as a forfeit.' },
              { icon: '🔗', title: 'Common Link', desc: 'You\'re given three players or clues that share a hidden connection — figure out what links them from the multiple-choice options. Correct answers earn coins just like a solo quiz.' },
              { icon: '🎉', title: 'Seasonal Events', desc: 'Limited-time quizzes that run for a set window with their own question sets. Some events have an entry fee in coins, but rewards are boosted by a coin multiplier — the better you score, the more that multiplier pays off.' },
            ].map(mode => (
              <div key={mode.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{mode.icon}</span>
                <div>
                  <p style={{ color: '#f5f5f0', fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{mode.title}</p>
                  <p style={{ color: 'rgba(230,240,232,0.5)', fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarClosed}`} style={{ '--sidebar-accent': sport === 'basketball' ? '#FF8C42' : '#00FF87', background: sport === 'basketball' ? 'darkred' : '#0f2518' }}></div>
     <div className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarClosed}`} style={{ '--sidebar-accent': sport === 'basketball' ? '#FF8C42' : '#00FF87' }}>
        {/* User card */}
        <div className={styles.sidebarUserCard}>
          <div className={styles.sidebarAvatar}>
            {getPlayerAvatar(user, profile)
              ? <img src={getPlayerAvatar(user, profile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : avatarInitial(user?.displayName || profile?.displayName || 'P')
            }
          </div>
          <div className={styles.sidebarUserInfo}>
            <div className={styles.sidebarUserName}>{user?.displayName || profile?.displayName || 'Player'}</div>
            <div className={styles.sidebarUserId}>{profile?.playerId || ''}</div>
          </div>
        </div>

        {/* Nav items */}
        {sidebarScreen === 'main' && (
        <nav className={styles.sidebarNav}>
          <button className={styles.sidebarNavItem} onClick={() => { setSidebarOpen(false); setActiveTab('profile') }}>
            <span className={styles.sidebarNavIcon}>👤</span> Profile
          </button>
         <button className={styles.sidebarNavItem} onClick={() => { setSidebarOpen(false); setSidebarScreen('settings') }}>
            <span className={styles.sidebarNavIcon}>⚙️</span> Settings
          </button>
         <button className={styles.sidebarNavItem} onClick={() => { setSidebarOpen(false); onOpenBlog() }}>
            <span className={styles.sidebarNavIcon}>📰</span> Blog
          </button>
         <button className={styles.sidebarNavItem} onClick={() => { setSidebarOpen(false); setSidebarScreen('howToPlay') }}>
            <span className={styles.sidebarNavIcon}>❓</span> How to Play
          </button>
          <button className={styles.sidebarNavItem} onClick={() => {
            setSidebarOpen(false)
            navigator.clipboard?.writeText(window.location.origin).then(() => alert('Link copied!'))
          }}>
            <span className={styles.sidebarNavIcon}>🔗</span> Invite a Friend
          </button>
         <button className={styles.sidebarNavItem} onClick={() => { setSidebarOpen(false); setSidebarScreen('about') }}>
            <span className={styles.sidebarNavIcon}>ℹ️</span> About Trivela
          </button>
          <button className={styles.sidebarNavItem} onClick={() => { setSidebarOpen(false); setSidebarScreen('feedback') }}>
          <span className={styles.sidebarNavIcon}>💬</span> Send Feedback
          </button>
        <div className={styles.sidebarDivider} />
          {isAdmin && (
            <button className={styles.sidebarNavItem} onClick={() => { setSidebarOpen(false); onAdmin() }}>
              <span className={styles.sidebarNavIcon}>🔧</span> Admin Dashboard
            </button>
          )}
          <button className={`${styles.sidebarNavItem} ${styles.sidebarLogout}`} onClick={() => { setSidebarOpen(false); onLogout() }}>
            <span className={styles.sidebarNavIcon}>🚪</span> Log out
          </button>
        </nav>
        )}
      </div>
      {friendRequests.length > 0 && activeTab !== 'friends' && (
        <button
          type="button"
          className={styles.friendRequestToast}
          onClick={() => setActiveTab('friends')}
        >
          <span>👥</span>
          <span>{friendRequests.length} friend request{friendRequests.length > 1 ? 's' : ''}</span>
          <span className={styles.friendRequestToastLink}>Open</span>
        </button>
      )}
      {hasIncomingChallenge && activeTab !== 'alerts' && (
        <button
          type="button"
          className={`${styles.friendRequestToast} ${styles.challengeToast}`}
          onClick={() => setActiveTab('hub')}
        >
          <span>⚔️</span>
          <span>{pendingLightningInvite ? 'Lightning challenge received' : 'Online challenge received'}</span>
          <span className={styles.friendRequestToastLink}>Open</span>
        </button>
      )}
      {activeTab === 'home' && (
       <HomeTab
          sport={sport}
          onSportChange={onSportChange}
          user={user}
          profile={profile}
          dailyPlayed={dailyPlayed}
          onStartDaily={onStartDaily}
          onStartSeasonalEvent={onStartSeasonalEvent}
          onSelectMode={handleSelectMode}
          onOpenBoard={() => setActiveTab('board')}
          onOpenProfile={() => setActiveTab('profile')}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      )}
      {activeTab === 'board' && <BoardTab sport={sport} onSportChange={onSportChange} profile={profile} />}
      {activeTab === 'play' && (
        <PlayTab
          sport={sport}
          onSportChange={onSportChange}
          rounds={rounds}
          onRoundsChange={setRounds}
          onSelectMode={handleSelectMode}
          onStartSeasonalEvent={onStartSeasonalEvent}
        />
      )}
      {activeTab === 'hub' && (
        <HubTab
          user={user}
          coinBalance={coinBalance}
          pendingOnlineInvite={pendingOnlineInvite}
          pendingInvites={pendingInvites}
          pendingLightningInvite={pendingLightningInvite}
          streakNotice={streakNotice}
          teamInviteLoading={teamInviteLoading}
          teamInviteError={teamInviteError}
          onAcceptOnline={onAcceptOnlineInvite}
          onDeclineOnline={onDeclineOnlineInvite}
          onAcceptTeam={(invite) => handleTeamInvite(invite, true)}
          onDeclineTeam={(invite) => handleTeamInvite(invite, false)}
          onAcceptLightning={onAcceptLightningInvite}
          onDeclineLightning={onDeclineLightningInvite}
          onCoinsUpdated={onCoinsUpdated}
        />
      )}
      {activeTab === 'friends' && (
        <FriendsTab
          profile={profile}
          sport={sport}
          onStartOnline={onStartOnline}
          onStartTeam={onStartTeam}
          onStartLightningH2H={onStartLightningH2H}
          onFriendRequestHandled={(fromPlayerId) => {
            setFriendRequests((prev) => prev.filter((request) => request.fromPlayerId !== fromPlayerId))
          }}
        />
      )}
  {activeTab === 'profile' && (
  <div className={styles.page}>
    <Profile
      user={user}
      onUsernameUpdated={onUsernameUpdated}
      onProfileUpdated={onProfileUpdated}
      onLogout={onLogout}
      coinBalance={coinBalance}
      onAdmin={onAdmin}
      isAdmin={isAdmin}
      onWeeklyMissions={onWeeklyMissions}
    />
  </div>
)}

      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {showNotifNudge && (
        <NotifNudge
          user={user}
          onDismiss={() => setShowNotifNudge(false)}
        />
      )}

    </div>
  )
}
