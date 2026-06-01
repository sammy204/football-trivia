import { useEffect, useMemo, useState } from 'react'
import { ref, get, update, onValue } from 'firebase/database'
import { updateProfile } from 'firebase/auth'
import { db } from '../lib/firebase'
import { getDailyChallengeInfo, getDateKey, getWeekKey, listenToDailyLeaderboard, listenToWeeklyLeaderboard } from '../lib/dailyChallenge'
import { listenToLightningLeaderboard } from '../lib/lightningDaily'
import { getActiveSeasonalEvents, listenToAllSeasonalEvents } from '../lib/seasonalEvents'
import { getPlayerAvatar } from '../lib/avatars'
import { loadProfile, saveProfile } from '../lib/profile'
import { listenToModeCounts, getHomeModeIds } from '../lib/modeStats'
import { getUnlockedMilestones } from '../lib/streaks'
import { respondToInvite } from '../lib/teamMultiplayer'
import { spendCoins, TEAM_PLAYER_WAGER } from '../lib/coins'
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
}

const NAV_ITEMS = [
   { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'board', label: 'Board', icon: '🏆' },
  { id: 'play', label: 'Play', icon: '🎮' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
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
  return (
    <div className={styles.sportGrid}>
      {[
        { id: 'football', label: 'Football', icon: '⚽' },
        { id: 'basketball', label: 'Basketball', icon: '🏀' },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.sportButton} ${sport === item.id ? styles.active : ''}`}
          onClick={() => onSportChange(item.id)}
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

function HomeTab({ sport, onSportChange, user, profile, dailyPlayed, onStartDaily, onStartSeasonalEvent, onSelectMode, onOpenBoard, onOpenProfile }) {
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
        <div className={styles.brandMark}>
          <img src="/logo-mark.svg" alt="Trivela" />
        </div>
        <div className={styles.actions}>
          <button className={styles.avatarPill} type="button" onClick={onOpenProfile} aria-label="Open profile">
            {avatar ? <img className={styles.avatarImg} src={avatar} alt="" /> : <span className={styles.avatarInitial}>{avatarInitial(name)}</span>}
          </button>
        </div>
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

 const modes = ['solo', 'online', 'team', 'lightning', 'lightning_h2h', 'tournament', 'commonLink']

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

function ProfileTab({ user, profile, coinBalance, onAdmin, onEditProfile, onProfileUpdated, isAdmin, onLogout }) {
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
  onAcceptOnlineInvite,
  onDeclineOnlineInvite,
  onAcceptTeamInvite,
  onDeclineTeamInvite,
  onAcceptLightningInvite,
  onDeclineLightningInvite,
  onAdmin,
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

  return (
    <div className={styles.shell}>
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
          onClick={() => setActiveTab('alerts')}
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
      {activeTab === 'alerts' && (
        <AlertsTab
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
    </div>
  )
}

