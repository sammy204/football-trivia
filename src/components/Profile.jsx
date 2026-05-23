import React, { useState, useEffect } from 'react'
import { ref, get, update } from 'firebase/database'
import { db } from '../lib/firebase'
import { updateProfile } from 'firebase/auth'
import { loadProfile, saveProfile } from '../lib/profile'
import { getDefaultAvatar, isImageAvatar } from '../lib/avatars'
import AvatarGrid from './AvatarGrid'
import styles from './Profile.module.css'
import { calculateWinStreak } from '../lib/streaks'
import { getRivalries, getFormBadge } from '../lib/userStats'
import { RivalrySection, FormBadge } from './RivalrySection'

const MILESTONES = [
  { id: 'wins10',    icon: '🏆', title: '10 Wins',        copy: 'Win 10 multiplayer matches.',         check: s => s.wins >= 10 },
  { id: 'wins50',    icon: '👑', title: '50 Wins',        copy: 'Win 50 multiplayer matches.',         check: s => s.wins >= 50 },
  { id: 'streak3',   icon: '🔥', title: '3-Day Streak',   copy: 'Play 3 days in a row.',               check: s => (s.bestStreak || 0) >= 3 },
  { id: 'streak7',   icon: '⚡', title: '7-Day Streak',   copy: 'Play 7 days in a row.',               check: s => (s.bestStreak || 0) >= 7 },
  { id: 'points50',  icon: '🎯', title: '50 Points',      copy: 'Accumulate 50 total points.',         check: s => (s.totalPoints || 0) >= 50 },
  { id: 'points100', icon: '💯', title: '100 Points',     copy: 'Accumulate 100 total points.',        check: s => (s.totalPoints || 0) >= 100 },
]

function formatStreakDate(dateKey) {
  if (!dateKey) return null
  try {
    return new Date(dateKey).toLocaleDateString()
  } catch {
    return dateKey
  }
}

function AvatarPreview({ value, className, onClick }) {
  if (isImageAvatar(value)) {
    return (
      <img
        src={value}
        alt="Avatar"
        className={className}
        onClick={onClick}
      />
    )
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label="Change avatar"
    >
      P
    </button>
  )
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
  const [avatar, setAvatar] = useState(null) // Avatar state
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [tempAvatar, setTempAvatar] = useState(null)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(5)
  const [rivalries, setRivalries] = useState([])
  const [myForm, setMyForm] = useState([])

  useEffect(() => {
    if (!user?.uid) {
      setError('Not signed in')
      setLoading(false)
      return
    }

    async function loadUserData() {
      try {
        // Load player ID — try localStorage first, then Firebase
        const cached = loadProfile()
        if (cached?.playerId) {
          setPlayerId(cached.playerId)
        } else {
          const playerIdSnap = await get(ref(db, `users/${user.uid}/playerId`))
          setPlayerId(playerIdSnap.val() || null)
        }

     // Load daily streak
     const streakSnap = await get(ref(db, `users/${user.uid}/dailyStreak`))
     setStreak(streakSnap.val() || null)

     // Load stats
     const statsSnap = await get(ref(db, `users/${user.uid}/stats`))
     const statsData = statsSnap.val() || { wins: 0, losses: 0, totalGames: 0, draws: 0 }

     // Load avatar
     const avatarSnap = await get(ref(db, `users/${user.uid}/profile/avatar`))
     const avatarData = avatarSnap.val()
     setAvatar(
       isImageAvatar(avatarData)
         ? avatarData
         : isImageAvatar(cached?.avatar)
         ? cached.avatar
         : isImageAvatar(user.photoURL)
         ? user.photoURL
         : getDefaultAvatar()
     )

     // Load recent matches
        const matchesSnap = await get(ref(db, `users/${user.uid}/matches`))
        let allMatches = []
        if (matchesSnap.val()) {
          allMatches = Object.values(matchesSnap.val())
          const matchesData = allMatches.sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          )
          setMatches(matchesData.slice(0, 50))
          setRivalries(getRivalries(allMatches))
          setMyForm(getFormBadge(allMatches, 5))
        }

        // Calculate totals from match history (source of truth)
        const totalGames = allMatches.length
        const wins = allMatches.filter(m => m.result === 'win').length
        const losses = allMatches.filter(m => m.result === 'loss').length
        const draws = allMatches.filter(m => m.result === 'draw').length
        const totalPoints = allMatches.reduce((sum, m) => sum + (m.score || 0), 0)
        const winStreak = calculateWinStreak(allMatches)
        const bestStreak = streakSnap.val()?.best || 0

        setStats({
          ...statsData,
          totalGames,
          wins,
          losses,
          draws,
          totalPoints,
          winStreak,
          bestStreak,
        })

        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Failed to load profile data')
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

   function handleCopyId() {
     if (!playerId) return
     navigator.clipboard.writeText(playerId).then(() => {
       setCopied(true)
       setTimeout(() => setCopied(false), 2000)
     })
   }

   const handleAvatarSelect = (avatar) => {
     setTempAvatar(avatar);
   };

   async function handleSaveUsername() {
     if (!newUsername.trim() || !user) return
     setSaving(true)
     try {
       await updateProfile(user, { displayName: newUsername.trim() })
       await update(ref(db, `users/${user.uid}/profile`), {
         displayName: newUsername.trim(),
         updatedAt: new Date().toISOString(),
       })
       const nextProfile = saveProfile({ displayName: newUsername.trim(), playerId, avatar })
       setEditingUsername(false)
       if (onUsernameUpdated) onUsernameUpdated(newUsername.trim())
       if (onProfileUpdated) onProfileUpdated(nextProfile)
     } catch (err) {
       console.error('Failed to update username:', err)
       alert('Failed to update username. Please try again.')
     }
     setSaving(false)
   }

   async function handleSaveAvatar() {
     if (!user || !tempAvatar) return
     setSavingAvatar(true)
     try {
       const displayName = user.displayName || loadProfile()?.displayName || 'Player'
       if (canUseAsAuthPhotoURL(tempAvatar)) {
         await updateProfile(user, { photoURL: tempAvatar })
       }
       // Update Firebase Realtime Database under profile
       await update(ref(db, `users/${user.uid}/profile`), {
         avatar: tempAvatar,
         updatedAt: new Date().toISOString(),
       })
       // Update localStorage
       const nextProfile = saveProfile({ displayName, playerId, avatar: tempAvatar })
       setAvatar(tempAvatar)
       setEditingAvatar(false)
       setTempAvatar(null)
       if (onProfileUpdated) onProfileUpdated(nextProfile)
     } catch (err) {
       console.error('Failed to update avatar:', err)
       alert('Failed to update avatar. Please try again.')
     }
     setSavingAvatar(false)
   }

  if (!user) return null

  const unlockedMilestones = stats ? MILESTONES.filter(m => m.check(stats)) : []

  return (
    <div className={styles.wrap}>
      {onBack && (
        <button className={styles.backBtn} onClick={onBack}>
          Back
        </button>
      )}

       <div className={styles.header}>
         <h1 className={styles.title}>Profile</h1>

         {/* Avatar section */}
         <div className={styles.avatarSection}>
           <div className={styles.avatarPreview}>
             <AvatarPreview
               value={editingAvatar ? tempAvatar || avatar || user.photoURL || getDefaultAvatar() : avatar || user.photoURL || getDefaultAvatar()}
               className={`${styles.avatarImg} ${editingAvatar ? styles.editing : ''}`}
               onClick={() => {
                 setEditingAvatar(true);
                 setTempAvatar(avatar || user.photoURL || getDefaultAvatar());
               }}
             />
             {editingAvatar && (
               <div className={styles.avatarOverlay}>
                 <button
                   className={styles.cancelBtn}
                   onClick={() => {
                     setEditingAvatar(false);
                     setTempAvatar(null);
                   }}
                 >
                   Cancel
                 </button>
                 <button
                   className={styles.saveUsernameBtn}
                   onClick={handleSaveAvatar}
                   disabled={savingAvatar || !tempAvatar}
                 >
                   {savingAvatar ? 'Saving...' : 'Save'}
                 </button>
               </div>
             )}
           </div>
           {editingAvatar ? (
             <div className={styles.avatarPicker}>
               <AvatarGrid value={tempAvatar} onChange={handleAvatarSelect} />
             </div>
           ) : (
             <button
               className={styles.editBtn}
               onClick={() => {
                 setEditingAvatar(true);
                 setTempAvatar(avatar || user.photoURL || getDefaultAvatar());
               }}
             >
               Change Avatar
             </button>
           )}
         </div>

         {/* Username edit section */}
        {editingUsername ? (
          <div className={styles.editUsernameRow}>
            <input
              className={styles.usernameInput}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              autoFocus
            />
            <button
              className={styles.saveUsernameBtn}
              onClick={handleSaveUsername}
              disabled={saving || !newUsername.trim()}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => { setEditingUsername(false); setNewUsername('') }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className={styles.usernameRow}>
            <p className={styles.username}>{user.displayName || 'Player'}</p>
            <button className={styles.editBtn} onClick={() => { setNewUsername(user.displayName || ''); setEditingUsername(true) }}>
              Edit
            </button>
          </div>
        )}

        <p className={styles.email}>{user.email}</p>

        {/* Player ID badge */}
        {playerId && (
          <div className={styles.playerIdRow}>
  <span className={styles.playerIdLabel}>Player ID</span>
  <span className={styles.playerIdValue}>{playerId}</span>
  <button className={styles.copyBtn} onClick={handleCopyId}>
    {copied ? '✅ Copied!' : 'Copy'}
  </button>
</div>
        )}

        <div className={styles.walletCard}>
          <div>
            <p className={styles.walletLabel}>Virtual coins</p>
            <p className={styles.walletCopy}>Wallet balance for rewards and event entry.</p>
          </div>
          <div className={styles.walletAmount}>
            <span className={styles.walletMark}>C</span>
            <strong>{coinBalance}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading your stats...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          {/* Daily Streak Hero Card */}
          {streak && (
            <section className={styles.heroCard}>
              <div className={styles.heroTop}>
                <div>
                  <p className={styles.heroLabel}>Daily Streak</p>
                  <p className={styles.heroValue}>{streak.current || 0} Day{(streak.current || 0) !== 1 ? 's' : ''}</p>
                </div>
                <div className={styles.heroMeta}>
                  <span>Best: {streak.best || 0}</span>
                  {streak.lastPlayedDateKey && (
                    <span>Last played {formatStreakDate(streak.lastPlayedDateKey)}</span>
                  )}
                </div>
              </div>
              <p className={styles.heroCopy}>
                {streak.current > 0
                  ? 'Keep your streak alive by playing the daily challenge again tomorrow.'
                  : 'Play the daily challenge to start your streak!'}
              </p>
            </section>
          )}

          {/* Stats */}
          <section className={styles.statsCard}>
            <h2 className={styles.sectionTitle}>Stats</h2>
            <div className={styles.statGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Games Played</span>
                <span className={styles.statValue}>{stats?.totalGames || 0}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Wins</span>
                <span className={styles.statValue} style={{ color: '#00FF87' }}>
                  {stats?.wins || 0}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Losses</span>
                <span className={styles.statValue} style={{ color: '#FF5C5C' }}>
                  {stats?.losses || 0}
                </span>
              </div>
               <div className={styles.statBox}>
                 <span className={styles.statLabel}>Win Streak</span>
                 <span className={styles.statValue} style={{ color: '#FFD700' }}>
                   {stats?.winStreak || 0}
                 </span>
               </div>
               {(stats?.teamGames || 0) > 0 && (
                 <>
                   <div className={styles.statBox}>
                     <span className={styles.statLabel}>Team Games</span>
                     <span className={styles.statValue}>{stats.teamGames}</span>
                   </div>
                   <div className={styles.statBox}>
                     <span className={styles.statLabel}>Team Wins</span>
                     <span className={styles.statValue} style={{ color: '#00FF87' }}>
                       {stats.teamWins || 0}
                     </span>
                   </div>
                 </>
               )}
            </div>
            <div className={styles.formSection}>
              <p className={styles.formTitle}>
                 Recent Form
             </p>
              <FormBadge results={[...myForm].reverse()} />
            </div>
          </section>

          {/* Milestones */}
          <section className={styles.statsCard}>
            <h2 className={styles.sectionTitle}>Milestones</h2>
            {unlockedMilestones.length > 0 ? (
              <div className={styles.badgeGrid}>
                {unlockedMilestones.map(m => (
                  <div key={m.id} className={styles.badgeCard}>
                    <div className={styles.badgeIcon}>{m.icon}</div>
                    <div>
                      <p className={styles.badgeTitle}>{m.title}</p>
                      <p className={styles.badgeCopy}>{m.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noMilestones}>
                No badges unlocked yet. Your first ones arrive at 10 wins, 50 total points, and a 3-day daily streak.
              </p>
            )}
          </section>
        <RivalrySection rivalries={rivalries} accent="#00FF87" />
   {/* Recent Matches */}
{matches.length > 0 && (() => {
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
  const currentMonthData = monthMap[activeMonth]
  const currentMatches = currentMonthData?.matches || []

  const [year, month] = activeMonth ? activeMonth.split('-').map(Number) : [null, null]
  const firstDay = year ? new Date(year, month - 1, 1).getDay() : 0
  const daysInMonth = year ? new Date(year, month, 0).getDate() : 0
  const playedDays = new Set(currentMatches.map(m => m._date.getDate()))

  const filteredMatches = selectedDay
    ? currentMatches.filter(m => m._date.getDate() === selectedDay)
    : currentMatches
  const visibleMatches = filteredMatches.slice(0, visibleMatchesCount)

  return (
    <section className={styles.matchesCard}>
      <h2 className={styles.sectionTitle}>Recent Matches</h2>

      {/* Month Dropdown */}
      <select
        className={styles.monthSelect}
        value={activeMonth}
        onChange={e => { setSelectedMonth(e.target.value); setSelectedDay(null); setVisibleMatchesCount(5) }}
      >
        {monthKeys.map(k => (
          <option key={k} value={k}>
            {monthMap[k].label}
          </option>
        ))}
      </select>

      {/* Calendar Toggle */}
      <button
        className={styles.calendarToggle}
        onClick={() => { setShowCalendar(v => !v); setSelectedDay(null); setVisibleMatchesCount(5) }}
      >
        {showCalendar ? '▲ Hide Calendar' : '▼ Filter by Day'}
      </button>

      {/* Calendar Grid */}
      {showCalendar && year && (
        <div className={styles.calendarWrap}>
          <div className={styles.calendarHeader}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className={styles.calendarGrid}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const hasMatch = playedDays.has(day)
              const isSelected = selectedDay === day
              return (
                <button
                  key={day}
                  onClick={() => hasMatch && setSelectedDay(isSelected ? null : day)}
                  className={`${styles.dayButton} ${hasMatch ? styles.hasMatch : ''} ${isSelected ? styles.selectedDay : ''}`}
                  disabled={!hasMatch}
                >
                  {day}
                </button>
              )
            })}
          </div>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className={styles.clearDayButton}
            >
              ✕ Clear day filter
            </button>
          )}
        </div>
      )}

      {/* Match List */}
      <div className={styles.matchesList}>
        {filteredMatches.length === 0 ? (
          <p className={styles.emptyMatches}>
            No matches on this day.
          </p>
        ) : (
          visibleMatches.map((match, idx) => (
            <div key={idx} className={styles.matchItem}>
              <div className={styles.matchHeader}>
                <span className={styles.opponent}>vs {match.opponentName || 'Unknown'}</span>
                <span className={styles.result} style={{ color: match.result === 'win' ? '#00FF87' : '#FF5C5C' }}>
                  {match.result === 'win' ? 'WON' : 'LOST'}
                </span>
              </div>
              <div className={styles.matchDetails}>
                <span>{match.sport === 'basketball' ? '🏀' : '⚽'} {match.sport}</span>
                <span>{match._date.toLocaleDateString()}</span>
                {match.coinsEarned > 0 && (
                  <span style={{ color: '#FFD700', fontWeight: 600 }}>+{match.coinsEarned} C</span>
                )}
                {match.coinsLost > 0 && (
                  <span style={{ color: '#FF5C5C', fontWeight: 600 }}>-{match.coinsLost} C</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {filteredMatches.length > 5 && (
        <button
          className={styles.moreMatchesBtn}
          onClick={() => {
            if (visibleMatchesCount >= filteredMatches.length) {
              setVisibleMatchesCount(5)
              return
            }
            setVisibleMatchesCount((count) => Math.min(count + 10, filteredMatches.length))
          }}
        >
          {visibleMatchesCount >= filteredMatches.length ? 'Show less' : 'Show more'}
        </button>
      )}
    </section>
  )
})()}
          {matches.length === 0 && (
            <p className={styles.noMatches}>
              No matches yet. Start playing online to see your game history!
            </p>
          )}
        </>
      )}

      {/* Logout section */}
      <section className={styles.logoutSection}>
        {isAdmin && onAdmin && (
          <button className={styles.adminBtn} onClick={onAdmin}>
            Admin Dashboard
          </button>
        )}
        <button className={styles.logoutBtn} onClick={onLogout}>
          Log out
        </button>
      </section>
    </div>
  )
}
