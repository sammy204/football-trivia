import React, { useState, useEffect } from 'react'
import { ref, get, update, onValue } from 'firebase/database'
import { db, auth } from '../lib/firebase'
import { updateProfile } from 'firebase/auth'
import { loadProfile, saveProfile } from '../lib/profile'
import { getDefaultAvatar, isImageAvatar } from '../lib/avatars'
import AvatarGrid from './AvatarGrid'
import AvatarFrame from './AvatarFrame'
import { calculateWinStreak } from '../lib/streaks'
import { getRivalries, getFormBadge as buildFormBadge } from '../lib/userStats'
import { RivalrySection, FormBadge } from './RivalrySection'
import styles from './MainTabs.module.css'
import { getStreakShield, purchaseStreakShield } from '../lib/streaks'
import { spendCoins } from '../lib/coins'
import { getOwnedFrames, getEquippedFrame, purchaseFrame, equipFrame, unequipFrame } from '../lib/frames'
import { requestPushNotificationPermission, subscribeUserToPush, refreshPushSubscription } from '../lib/pushNotifications'


const MILESTONES = [
  { id: 'wins10',    icon: '🏆', title: '10 Wins',      check: s => s.wins >= 10 },
  { id: 'wins50',    icon: '👑', title: '50 Wins',      check: s => s.wins >= 50 },
  { id: 'streak3',   icon: '🔥', title: '3-Day Streak', check: s => (s.bestStreak || 0) >= 3 },
  { id: 'streak7',   icon: '⚡', title: '7-Day Streak', check: s => (s.bestStreak || 0) >= 7 },
  { id: 'points50',  icon: '🎯', title: '50 Points',    check: s => (s.totalPoints || 0) >= 50 },
  { id: 'points100', icon: '💯', title: '100 Points',   check: s => (s.totalPoints || 0) >= 100 },
]

function formatDate(dateKey) {
  if (!dateKey) return null
  try { return new Date(dateKey).toLocaleDateString() } catch { return dateKey }
}

function canUseAsAuthPhotoURL(value) {
  return typeof value === 'string' && /^https?:\/\//.test(value)
}

export default function Profile({
  user,
  onBack,
  onUsernameUpdated,
  onProfileUpdated,
  onLogout,
  coinBalance = 0,
  onAdmin,
  isAdmin = false,
  onWeeklyMissions,
}) {
  const [stats, setStats] = useState(null)
  const [matches, setMatches] = useState([])
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [tempAvatar, setTempAvatar] = useState(null)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(5)
  const [rivalries, setRivalries] = useState([])
  const [myForm, setMyForm] = useState([])
  const [streakShield, setStreakShield] = useState(null)
  const [buyingShield, setBuyingShield] = useState(false)
  const [shieldMsg, setShieldMsg] = useState(null)
  const [ownedFrames, setOwnedFrames] = useState([])
  const [equippedFrame, setEquippedFrame] = useState(null)
  const [frameMsg, setFrameMsg] = useState(null)
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [notifBusy, setNotifBusy] = useState(false)
  const [notifMsg, setNotifMsg] = useState(null)
  const shieldStatusText = streakShield?.active
    ? 'Shield active'
    : streak?.current > 0
      ? 'Shield consumed'
      : 'Buy another for 50C'

  useEffect(() => {
    if (!user?.uid) { setError('Not signed in'); setLoading(false); return }

    async function loadUserData() {
      try {
        const cached = loadProfile()
        if (cached?.playerId) {
          setPlayerId(cached.playerId)
        } else {
          const snap = await get(ref(db, `users/${user.uid}/playerId`))
          setPlayerId(snap.val() || null)
        }

        const streakSnap = await get(ref(db, `users/${user.uid}/dailyStreak`))
        setStreak(streakSnap.val() || null)

        const shield = await getStreakShield(user.uid)
        setStreakShield(shield)

        const statsSnap = await get(ref(db, `users/${user.uid}/stats`))
        const statsData = statsSnap.val() || { wins: 0, losses: 0, totalGames: 0, draws: 0 }

        const avatarSnap = await get(ref(db, `users/${user.uid}/profile/avatar`))
        const avatarData = avatarSnap.val()
        setAvatar(
          isImageAvatar(avatarData) ? avatarData
          : isImageAvatar(cached?.avatar) ? cached.avatar
          : isImageAvatar(user.photoURL) ? user.photoURL
          : getDefaultAvatar()
        )

        const owned = await getOwnedFrames(user.uid)
        const equipped = await getEquippedFrame(user.uid)
        setOwnedFrames(owned)
        setEquippedFrame(equipped)

        const matchesSnap = await get(ref(db, `users/${user.uid}/matches`))
        let allMatches = []
        if (matchesSnap.val()) {
          allMatches = Object.values(matchesSnap.val()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          setMatches(allMatches.slice(0, 50))
          setRivalries(getRivalries(allMatches))
          setMyForm(buildFormBadge(allMatches, 5))
        }

        const totalGames = allMatches.length
        const wins = allMatches.filter(m => m.result === 'win').length
        const losses = allMatches.filter(m => m.result === 'loss').length
        const draws = allMatches.filter(m => m.result === 'draw').length
        const totalPoints = allMatches.reduce((sum, m) => sum + (m.score || 0), 0)
        const winStreak = calculateWinStreak(allMatches)
        const bestStreak = streakSnap.val()?.best || 0

        setStats({ ...statsData, totalGames, wins, losses, draws, totalPoints, winStreak, bestStreak })
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Failed to load profile data')
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  useEffect(() => {
    if (!user?.uid) return

    const shieldRef = ref(db, `users/${user.uid}/streakShield`)
    const streakRef = ref(db, `users/${user.uid}/dailyStreak`)

    const unsubscribeShield = onValue(shieldRef, (snapshot) => {
      setStreakShield(snapshot.val() || null)
    })

    const unsubscribeStreak = onValue(streakRef, (snapshot) => {
      setStreak(snapshot.val() || null)
    })

    return () => {
      unsubscribeShield()
      unsubscribeStreak()
    }
  }, [user?.uid])

  function handleCopyId() {
    if (!playerId) return
    navigator.clipboard.writeText(playerId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSaveUsername() {
    if (!newUsername.trim() || !user) return
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: newUsername.trim() })
      await update(ref(db, `users/${user.uid}/profile`), { displayName: newUsername.trim(), updatedAt: new Date().toISOString() })
      const nextProfile = saveProfile({ displayName: newUsername.trim(), playerId, avatar })
      setEditingUsername(false)
      if (onUsernameUpdated) onUsernameUpdated(newUsername.trim())
      if (onProfileUpdated) onProfileUpdated(nextProfile)
    } catch (err) {
      console.error('Failed to update username:', err)
    }
    setSaving(false)
  }

  async function handleSaveAvatar() {
    if (!user || !tempAvatar) return
    setSavingAvatar(true)
    try {
      const displayName = user.displayName || loadProfile()?.displayName || 'Player'
     if (canUseAsAuthPhotoURL(tempAvatar)) await updateProfile(auth.currentUser, { photoURL: tempAvatar })
      await update(ref(db, `users/${user.uid}/profile`), { avatar: tempAvatar, updatedAt: new Date().toISOString() })
      const nextProfile = saveProfile({ displayName, playerId, avatar: tempAvatar })
      setAvatar(tempAvatar)
      setEditingAvatar(false)
      setTempAvatar(null)
      if (onProfileUpdated) onProfileUpdated(nextProfile)
    } catch (err) {
      console.error('Failed to update avatar:', err)
    }
    setSavingAvatar(false)
  }

  async function handleBuyShield() {
  if (!user || buyingShield) return
  setBuyingShield(true)
  setShieldMsg(null)
  const result = await spendCoins({
    userId: user.uid,
    amount: 50,
    reason: 'streak-shield',
    sourceId: `shield-${Date.now()}`,
  })
  if (result.ok) {
    await purchaseStreakShield(user.uid)
    setStreakShield({ active: true, purchasedAt: new Date().toISOString() })
    setShieldMsg('🛡️ Shield activated!')
  } else {
    setShieldMsg('Not enough coins.')
  }
  setBuyingShield(false)
  setTimeout(() => setShieldMsg(null), 3000)
}

  async function handleBuyFrame(frame) {
    if (!user) return
    setFrameMsg(null)

    if (ownedFrames.includes(frame.id)) {
      setFrameMsg('Frame already unlocked.')
      setTimeout(() => setFrameMsg(null), 3000)
      return
    }

    try {
      const result = await spendCoins({
        userId: user.uid,
        amount: frame.price,
        reason: 'avatar-frame',
        sourceId: `frame-${frame.id}-${user.uid}`,
        metadata: { frameId: frame.id, frameName: frame.name },
        preferLocal: true,
      })

      if (result.ok) {
        await purchaseFrame(user.uid, frame.id)
        await equipFrame(user.uid, frame.id)
        setOwnedFrames(prev => prev.includes(frame.id) ? prev : [...prev, frame.id])
        setEquippedFrame(frame.id)
        setFrameMsg(`${frame.name} unlocked and equipped!`)
      } else {
        const balanceText = Number.isFinite(Number(result.balance))
          ? ` Wallet balance: ${result.balance}C.`
          : ''
        setFrameMsg(`Not enough coins.${balanceText}`)
      }
    } catch (err) {
      console.error('Failed to buy frame:', err)
      setFrameMsg('Could not buy frame. Please try again.')
    }

    setTimeout(() => setFrameMsg(null), 3000)
  }

  async function handleEquipFrame(frameId) {
    if (!user) return
    if (frameId) {
      await equipFrame(user.uid, frameId)
    } else {
      await unequipFrame(user.uid)
    }
    setEquippedFrame(frameId)
  }

  async function handleUnequipFrame() {
    if (!user) return
    await unequipFrame(user.uid)
    setEquippedFrame(null)
  }

  async function handleEnableNotifications() {
    setNotifBusy(true)
    setNotifMsg(null)
    try {
      const permission = await requestPushNotificationPermission()
      setNotifPermission(permission ? 'granted' : 'denied')
      if (permission) {
        const sub = await subscribeUserToPush(user)
        setNotifMsg(sub ? '✅ Notifications enabled!' : '⚠️ Enabled but setup failed. Try refresh.')
      } else {
        setNotifMsg('❌ Permission denied. Enable in your browser/phone settings.')
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
      const sub = await refreshPushSubscription(user)
      setNotifMsg(sub ? '✅ Notifications refreshed!' : '⚠️ Refresh failed. Try again.')
    } catch {
      setNotifMsg('Something went wrong.')
    }
    setNotifBusy(false)
    setTimeout(() => setNotifMsg(null), 4000)
  }

if (!user) return null  // <-- this was already here

  if (!user) return null

  const unlockedMilestones = stats ? MILESTONES.filter(m => m.check(stats)) : []
  const name = user.displayName || 'Player'

  // Build month map for match history
  const monthMap = {}
  matches.forEach(match => {
    const d = match.date ? new Date(match.date) : new Date(match.timestamp)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!monthMap[key]) monthMap[key] = { key, label, matches: [] }
    monthMap[key].matches.push({ ...match, _date: d })
  })
  const monthKeys = Object.keys(monthMap).sort((a, b) => b.localeCompare(a))
  const activeMonth = selectedMonth || monthKeys[0] || ''
  const currentMatches = monthMap[activeMonth]?.matches || []
  const [year, month] = activeMonth ? activeMonth.split('-').map(Number) : [null, null]
  const firstDay = year ? new Date(year, month - 1, 1).getDay() : 0
  const daysInMonth = year ? new Date(year, month, 0).getDate() : 0
  const playedDays = new Set(currentMatches.map(m => m._date.getDate()))
  const filteredMatches = selectedDay ? currentMatches.filter(m => m._date.getDate() === selectedDay) : currentMatches
  const visibleMatches = filteredMatches.slice(0, visibleMatchesCount)

  return (
    <>
      {/* Header */}
      <div className={styles.sectionHeader} style={{ marginBottom: 20 }}>
        <h1 className={styles.heroTitle}>PROFILE</h1>
        <button
          className={styles.linkButton}
          type="button"
          onClick={() => { setNewUsername(user.displayName || ''); setEditingUsername(v => !v) }}
        >
          {editingUsername ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Avatar + Name */}
      <div className={styles.profileHeader}>
        <div
          onClick={() => { setEditingAvatar(true); setTempAvatar(avatar || getDefaultAvatar()) }}
          style={{ cursor: 'pointer' }}
        >
          <AvatarFrame frameId={equippedFrame} size={72}>
            <div className={styles.profileAvatar} style={{ width: '100%', height: '100%' }}>
              {isImageAvatar(editingAvatar ? tempAvatar || avatar : avatar)
                ? <img className={styles.avatarImg} src={editingAvatar ? tempAvatar || avatar : avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span className={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</span>
              }
            </div>
          </AvatarFrame>
        </div>
        <div style={{ minWidth: 0 }}>
          {editingUsername ? (
            <div className={styles.inlineEdit}>
              <input
                className={styles.profileInput}
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="Display name"
                autoFocus
              />
              <button className={styles.primaryButton} type="button" onClick={handleSaveUsername} disabled={saving || !newUsername.trim()}>
                {saving ? '...' : 'Save'}
              </button>
            </div>
          ) : (
            <div className={styles.profileName}>{name}</div>
          )}
          <button className={styles.profileIdButton} type="button" onClick={handleCopyId}>
            ID: {playerId || 'Loading...'} {copied ? '· Copied' : ''}
          </button>
          <div className={styles.badgeRow}>
           <span className={styles.badgePill}>🔥 {streak?.current || 0}-day streak{streakShield?.active ? ' 🛡️' : ''}</span>
            <span className={styles.badgePill}>🏅 {stats?.wins || 0} Wins</span>
          </div>
        </div>
      </div>

      {/* Avatar picker */}
      {editingAvatar && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Choose Avatar</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.ghostButton} type="button" onClick={() => { setEditingAvatar(false); setTempAvatar(null) }}>Cancel</button>
              <button className={styles.primaryButton} type="button" onClick={handleSaveAvatar} disabled={savingAvatar || !tempAvatar}>
                {savingAvatar ? '...' : 'Save'}
              </button>
            </div>
          </div>
          <AvatarGrid
            value={tempAvatar}
            onChange={setTempAvatar}
            ownedFrames={ownedFrames}
            equippedFrame={equippedFrame}
            coinBalance={coinBalance}
            onBuyFrame={handleBuyFrame}
            onEquipFrame={handleEquipFrame}
            onUnequipFrame={handleUnequipFrame}
          />
          {frameMsg && (
            <p style={{ marginTop: 8, fontSize: 13, color: frameMsg.includes('enough') ? '#FF5C5C' : '#00FF87', fontWeight: 700 }}>
              {frameMsg}
            </p>
          )}
        </div>
      )}

      {/* Coins */}
      <div className={styles.section}>
        <div className={styles.dailyCard}>
          <div className={styles.dailyBadge}>Virtual Coins</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p className={styles.muted}>Wallet balance for rewards and event entry.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', background: '#FFD27A',
                color: '#201400', fontWeight: 900, fontSize: 13,
                display: 'grid', placeItems: 'center'
              }}>C</span>
              <span style={{ color: '#FFD27A', fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{coinBalance}</span>
            </div>
          </div>
        </div>
      </div>

      {loading && <p className={styles.emptyState}>Loading your stats...</p>}
      {error && <p className={styles.emptyState} style={{ color: '#ff5c5c' }}>{error}</p>}

      {!loading && !error && (
        <>
          {typeof window !== 'undefined' && 'Notification' in window && (
            <div className={styles.section}>
              <div className={styles.dailyCard}>
                <div className={styles.dailyBadge}>Notifications</div>
                <p className={styles.muted} style={{ marginTop: 6, marginBottom: 14, fontSize: 13 }}>
                  {notifPermission === 'granted'
                    ? 'Notifications are enabled on this device.'
                    : notifPermission === 'denied'
                    ? 'Notifications are blocked. Enable them in your device settings, then tap refresh.'
                    : 'Enable notifications for daily challenges, streaks, and match invites.'}
                </p>
                {notifPermission !== 'denied' && (
                  <button
                    className={styles.primaryButton}
                    type="button"
                    style={{ width: '100%' }}
                    onClick={notifPermission === 'granted' ? handleRefreshNotifications : handleEnableNotifications}
                    disabled={notifBusy}
                  >
                    {notifBusy ? '...' : notifPermission === 'granted' ? 'Refresh notifications' : 'Enable notifications'}
                  </button>
                )}
                {notifPermission === 'denied' && (
                  <p style={{ fontSize: 12, color: '#FF5C5C', fontWeight: 700 }}>
                    Go to your phone Settings → Safari/Chrome → Notifications → allow Trivela
                  </p>
                )}
                {notifMsg && (
                  <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: notifMsg.includes('✅') ? '#00FF87' : '#FF5C5C' }}>
                    {notifMsg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Streak */}
      {streak && (
  <div className={styles.section}>
    <div className={styles.dailyCard}>
      <div className={styles.dailyBadge}>Daily Streak</div>
      <div style={{ marginTop: 8, marginBottom: 2, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', color: streakShield?.active ? '#00FF87' : 'var(--muted)' }}>
        {shieldStatusText}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
        <div>
          <div className={styles.dailyTitle}>
            {streak.current || 0} Days
            {streakShield?.active && (
              <span style={{ marginLeft: 10, fontSize: 18 }} title="Streak Shield active">🛡️</span>
            )}
          </div>
          
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p className={styles.muted} style={{ fontSize: 12 }}>Best: {streak.best || 0}</p>
          {streak.lastPlayedDateKey && (
            <p className={styles.muted} style={{ fontSize: 12 }}>Last played {formatDate(streak.lastPlayedDateKey)}</p>
          )}
        </div>
      </div>

      {/* Shield purchase */}
      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>
        {streakShield?.active ? (
          <p style={{ fontSize: 13, color: '#00FF87', fontWeight: 700 }}>
            🛡️ Streak Shield active — one missed day is covered
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p className={styles.muted} style={{ fontSize: 13 }}>
              🛡️ Streak Shield — {shieldStatusText}
            </p>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={handleBuyShield}
              disabled={buyingShield || coinBalance < 50}
              style={{ flexShrink: 0, fontSize: 13, padding: '8px 14px' }}
            >
              {buyingShield ? '...' : '50C'}
            </button>
          </div>
        )}
        {shieldMsg && (
          <p style={{ marginTop: 8, fontSize: 13, color: shieldMsg.includes('enough') ? '#FF5C5C' : '#00FF87', fontWeight: 700 }}>
            {shieldMsg}
          </p>
        )}
      </div>
    </div>
  </div>
)}

          {/* Stats */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Stats</h2>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}><div className={styles.statValue}>{stats?.totalGames || 0}</div><div className={styles.statLabel}>Games Played</div></div>
              <div className={styles.statBox}><div className={styles.statValue} style={{ color: '#00FF87' }}>{stats?.wins || 0}</div><div className={styles.statLabel}>Wins</div></div>
              <div className={styles.statBox}><div className={styles.statValue} style={{ color: '#FF5C5C' }}>{stats?.losses || 0}</div><div className={styles.statLabel}>Losses</div></div>
              <div className={styles.statBox}><div className={styles.statValue} style={{ color: '#FFD700' }}>{stats?.winStreak || 0}</div><div className={styles.statLabel}>Win Streak</div></div>
              {(stats?.teamGames || 0) > 0 && (
                <>
                  <div className={styles.statBox}><div className={styles.statValue}>{stats.teamGames}</div><div className={styles.statLabel}>Team Games</div></div>
                  <div className={styles.statBox}><div className={styles.statValue} style={{ color: '#00FF87' }}>{stats.teamWins || 0}</div><div className={styles.statLabel}>Team Wins</div></div>
                </>
              )}
            </div>
            {myForm.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p className={styles.muted} style={{ marginBottom: 8 }}>Recent Form</p>
                <FormBadge results={[...myForm].reverse()} />
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Badges</h2>
            </div>
            {unlockedMilestones.length === 0
              ? <p className={styles.emptyState}>No badges yet. First ones arrive at 10 wins, 50 points, and a 3-day streak.</p>
              : <div className={styles.badgeRow}>
                  {unlockedMilestones.map(m => (
                    <span key={m.id} className={styles.badgePill}>{m.icon} {m.title}</span>
                  ))}
                </div>
            }
          </div>

          {/* Rivalries */}
         <div className={styles.section}>
  <RivalrySection rivalries={rivalries} accent="#00FF87" />
        </div>
          {/* Match History */}
          {matches.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Matches</h2>
              </div>

              {/* Month select */}
              <select
                style={{
                  width: '100%', minHeight: 42, marginBottom: 10, padding: '0 12px',
                  borderRadius: 10, border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.045)', color: 'var(--white)',
                  fontSize: 13, fontWeight: 700, outline: 'none'
                }}
                value={activeMonth}
                onChange={e => { setSelectedMonth(e.target.value); setSelectedDay(null); setVisibleMatchesCount(5) }}
              >
                {monthKeys.map(k => <option key={k} value={k} style={{ background: 'var(--pitch-mid)' }}>{monthMap[k].label}</option>)}
              </select>

              {/* Calendar toggle */}
              <button
                className={styles.ghostButton}
                style={{ width: '100%', marginBottom: 10 }}
                onClick={() => { setShowCalendar(v => !v); setSelectedDay(null); setVisibleMatchesCount(5) }}
              >
                {showCalendar ? '▲ Hide Calendar' : '▼ Filter by Day'}
              </button>

              {/* Calendar */}
              {showCalendar && year && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 5, marginBottom: 6 }}>
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--muted)', padding: '4px 0' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 5 }}>
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const hasMatch = playedDays.has(day)
                      const isSelected = selectedDay === day
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={!hasMatch}
                          onClick={() => hasMatch && setSelectedDay(isSelected ? null : day)}
                          style={{
                            minHeight: 30, borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center',
                            border: isSelected ? '1px solid var(--green)' : hasMatch ? '1px solid color-mix(in srgb, var(--green) 28%, transparent)' : '1px solid transparent',
                            background: isSelected ? 'var(--green)' : hasMatch ? 'color-mix(in srgb, var(--green) 11%, transparent)' : 'transparent',
                            color: isSelected ? 'var(--pitch)' : hasMatch ? 'var(--green)' : 'rgba(245,245,240,0.3)',
                            cursor: hasMatch ? 'pointer' : 'default',
                          }}
                        >{day}</button>
                      )
                    })}
                  </div>
                  {selectedDay && (
                    <button type="button" onClick={() => setSelectedDay(null)} style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}>
                      ✕ Clear day filter
                    </button>
                  )}
                </div>
              )}

              {/* Match list */}
              <div className={styles.profilePanel}>
                {filteredMatches.length === 0
                  ? <p className={styles.muted} style={{ textAlign: 'center', padding: '14px 0' }}>No matches on this day.</p>
                  : visibleMatches.map((match, idx) => (
                    <div key={idx} className={styles.matchRow}>
                      <span className={styles.resultBadge} style={{ color: match.result === 'win' ? '#00FF87' : '#FF5C5C' }}>
                        {match.result === 'win' ? 'W' : match.result === 'draw' ? 'D' : 'L'}
                      </span>
                      <div>
                        <div className={styles.rowTitle}>vs {match.opponentName || 'Unknown'}</div>
                        <div className={styles.rowCopy}>
                          {match.sport === 'basketball' ? '🏀' : '⚽'} {match.sport} · {match._date.toLocaleDateString()}
                          {match.coinsEarned > 0 && <span style={{ color: '#FFD700', marginLeft: 8 }}>+{match.coinsEarned}C</span>}
                          {match.coinsLost > 0 && <span style={{ color: '#FF5C5C', marginLeft: 8 }}>-{match.coinsLost}C</span>}
                        </div>
                      </div>
                      <div className={styles.score} style={{ color: match.result === 'win' ? '#00FF87' : match.result === 'draw' ? '#FFD700' : '#FF5C5C' }}>
                      {match.result === 'win' ? 'WON' : match.result === 'draw' ? 'DRAW' : 'LOST'}
                    </div>
                      </div>
                  ))
                }
              </div>

              {filteredMatches.length > 5 && (
                <button
                  className={styles.ghostButton}
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={() => {
                    if (visibleMatchesCount >= filteredMatches.length) { setVisibleMatchesCount(5); return }
                    setVisibleMatchesCount(c => Math.min(c + 10, filteredMatches.length))
                  }}
                >
                  {visibleMatchesCount >= filteredMatches.length ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {matches.length === 0 && (
            <p className={styles.emptyState}>No matches yet. Start playing online to see your game history.</p>
          )}
        </>
      )}

      {/* Actions */}
      <div className={styles.section} style={{ paddingBottom: 16 }}>
        {isAdmin && onAdmin && (
          <button className={styles.primaryButton} type="button" onClick={onAdmin} style={{ width: '100%', marginBottom: 10 }}>
            Admin Dashboard
          </button>
        )}
        <button className={styles.ghostButton} type="button" onClick={onLogout} style={{ width: '100%' }}>
          Log out
        </button>
      </div>
    </>
  )
}
