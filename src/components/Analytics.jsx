import { useEffect, useMemo, useState } from 'react'
import { get, ref } from 'firebase/database'
import { db } from '../lib/firebase'
import { getDateKey } from '../lib/seasonalEvents'
import styles from './Admin.module.css'

const PATHS = {
  users: 'users',
  dailyLeaderboards: 'dailyLeaderboards',
  weeklyLeaderboards: 'weeklyLeaderboards',
  seasonalLeaderboard: 'seasonalLeaderboard',
  seasonalEvents: 'seasonalEvents',
  lightningDaily: 'lightningDaily',
  notifications: 'notifications',
}

function objectValues(value) {
  return value && typeof value === 'object' ? Object.values(value) : []
}

function flattenDailyEntries(data) {
  const rows = []
  Object.entries(data || {}).forEach(([dateKey, sports]) => {
    Object.entries(sports || {}).forEach(([sport, sportNode]) => {
      Object.values(sportNode?.entries || {}).forEach((entry) => {
        rows.push({ ...entry, dateKey, sport, mode: 'Daily' })
      })
    })
  })
  return rows
}

function flattenSeasonalEntries(data) {
  const rows = []
  Object.entries(data || {}).forEach(([eventId, eventNode]) => {
    Object.values(eventNode?.entries || {}).forEach((entry) => {
      rows.push({ ...entry, eventId, mode: 'Seasonal' })
    })
  })
  return rows
}

function flattenLightningEntries(data) {
  const rows = []
  Object.entries(data || {}).forEach(([sport, dates]) => {
    Object.entries(dates || {}).forEach(([dateKey, entries]) => {
      Object.entries(entries || {}).forEach(([playerId, entry]) => {
        rows.push({ playerId, ...entry, dateKey, sport, mode: 'Lightning' })
      })
    })
  })
  return rows
}

function getEventStatus(event, todayKey) {
  if (!event?.active) return 'ended'
  if (event.startDate && event.startDate > todayKey) return 'scheduled'
  if (event.endDate && event.endDate < todayKey) return 'ended'
  return 'active'
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0)
}

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleString()
}

function TopList({ title, rows, getScore, getMeta }) {
  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {rows.length === 0 ? (
        <p style={emptyStyle}>No data yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {rows.slice(0, 5).map((row, index) => (
            <div key={`${title}-${index}-${row.playerId || row.displayName}`} style={rowStyle}>
              <div>
                <strong>#{index + 1} {row.displayName || 'Anonymous'}</strong>
                <p style={metaStyle}>{getMeta(row)}</p>
              </div>
              <span style={scoreStyle}>{getScore(row)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      setLoading(true)
      setError('')

      try {
        const results = await Promise.allSettled(
          Object.entries(PATHS).map(async ([key, path]) => {
            const snapshot = await get(ref(db, path))
            return [key, snapshot.exists() ? snapshot.val() : null]
          })
        )

        const nextData = {}
        const failures = []

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const [key, value] = result.value
            nextData[key] = value
          } else {
            failures.push(result.reason?.message || 'Unknown read error')
          }
        })

        if (!cancelled) {
          setData(nextData)
          if (failures.length) setError('Some analytics could not be loaded.')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching analytics:', err)
          setError('Could not load analytics.')
          setData({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAnalytics()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!error) return
    const timeout = window.setTimeout(() => setError(''), 5000)
    return () => window.clearTimeout(timeout)
  }, [error])

  const analytics = useMemo(() => {
    const source = data || {}
    const users = source.users || {}
    const dailyEntries = flattenDailyEntries(source.dailyLeaderboards)
    const seasonalEntries = flattenSeasonalEntries(source.seasonalLeaderboard)
    const lightningEntries = flattenLightningEntries(source.lightningDaily)
    const notifications = objectValues(source.notifications)
    const seasonalEvents = objectValues(source.seasonalEvents)
    const todayKey = getDateKey()

    const eventCounts = seasonalEvents.reduce((counts, event) => {
      const status = getEventStatus(event, todayKey)
      return { ...counts, [status]: (counts[status] || 0) + 1 }
    }, { active: 0, scheduled: 0, ended: 0 })

    const usersWithActivity = objectValues(users).filter((user) => user.playActivity)
    const activityDays = objectValues(users).reduce((sum, user) => {
      return sum + Object.keys(user.playActivity || {}).length
    }, 0)

    const topDaily = [...dailyEntries].sort((a, b) =>
      (b.score || 0) - (a.score || 0) || (a.totalTimeMs || 0) - (b.totalTimeMs || 0)
    )

    const topSeasonal = [...seasonalEntries].sort((a, b) =>
      (b.totalScore || 0) - (a.totalScore || 0) || (b.gamesPlayed || 0) - (a.gamesPlayed || 0)
    )

    const topLightning = [...lightningEntries].sort((a, b) =>
      (b.score || 0) - (a.score || 0) || (a.totalTimeMs || 0) - (b.totalTimeMs || 0)
    )

    return {
      totalUsers: Object.keys(users).length,
      activePlayers: usersWithActivity.length,
      activityDays,
      dailyEntries: dailyEntries.length,
      weeklyEntries: flattenDailyEntries(source.weeklyLeaderboards).length,
      seasonalPlayers: seasonalEntries.length,
      lightningEntries: lightningEntries.length,
      notificationsSent: notifications.reduce((sum, item) => sum + (item.sent || 0), 0),
      notificationLogs: notifications.length,
      eventCounts,
      topDaily,
      topSeasonal,
      topLightning,
      recentNotifications: notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5),
    }
  }, [data])

  if (loading) {
    return <div className={styles.loadingRow}>Loading analytics...</div>
  }

  return (
    <div className={styles.qmWrap}>
      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.overviewGrid}>
        {[
          ['Users', analytics.totalUsers, '👥'],
          ['Active Players', analytics.activePlayers, '🔥'],
          ['Daily Entries', analytics.dailyEntries, '📅'],
          ['Seasonal Players', analytics.seasonalPlayers, '🎯'],
          ['Lightning Entries', analytics.lightningEntries, '⚡'],
          ['Pushes Sent', analytics.notificationsSent, '🔔'],
        ].map(([label, value, icon]) => (
          <div key={label} className={styles.statCard}>
            <span className={styles.statIcon}>{icon}</span>
            <div>
              <p className={styles.statValue}>{formatNumber(value)}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Seasonal Events</h3>
        <div style={compactGridStyle}>
          <div style={miniStatStyle}><strong>{analytics.eventCounts.active || 0}</strong><span>Active</span></div>
          <div style={miniStatStyle}><strong>{analytics.eventCounts.scheduled || 0}</strong><span>Scheduled</span></div>
          <div style={miniStatStyle}><strong>{analytics.eventCounts.ended || 0}</strong><span>Ended</span></div>
          <div style={miniStatStyle}><strong>{analytics.notificationLogs}</strong><span>Notification logs</span></div>
        </div>
      </section>

      <div style={twoColumnStyle}>
        <TopList
          title="Top Daily Scores"
          rows={analytics.topDaily}
          getScore={(row) => `${row.score || 0}/${row.totalQuestions || '-'}`}
          getMeta={(row) => `${row.sport || 'sport'} · ${row.dateKey || 'date'}`}
        />
        <TopList
          title="Top Seasonal Scores"
          rows={analytics.topSeasonal}
          getScore={(row) => `${row.totalScore || 0} pts`}
          getMeta={(row) => `${row.gamesPlayed || 0} games · ${row.accuracyPct || 0}% accuracy`}
        />
      </div>

      <div style={twoColumnStyle}>
        <TopList
          title="Top Lightning Scores"
          rows={analytics.topLightning}
          getScore={(row) => `${row.score || 0} pts`}
          getMeta={(row) => `${row.sport || 'sport'} · ${row.dateKey || 'date'}`}
        />
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Recent Notifications</h3>
          {analytics.recentNotifications.length === 0 ? (
            <p style={emptyStyle}>No notification logs yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {analytics.recentNotifications.map((notification, index) => (
                <div key={`${notification.timestamp}-${index}`} style={rowStyle}>
                  <div>
                    <strong>{notification.title || 'Notification'}</strong>
                    <p style={metaStyle}>{notification.message || 'No message'}</p>
                    <p style={metaStyle}>{formatTime(notification.timestamp)}</p>
                  </div>
                  <span style={scoreStyle}>{notification.sent || 0} sent</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const sectionStyle = {
  marginTop: 16,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 18,
}

const sectionTitleStyle = {
  margin: '0 0 14px',
  color: 'var(--green, #4caf50)',
  fontSize: 18,
}

const twoColumnStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
}

const compactGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
}

const miniStatStyle = {
  display: 'grid',
  gap: 5,
  padding: 12,
  borderRadius: 12,
  background: 'rgba(0,0,0,0.18)',
  color: 'var(--muted, #888)',
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: 12,
  borderRadius: 12,
  background: 'rgba(0,0,0,0.18)',
}

const metaStyle = {
  margin: '4px 0 0',
  color: 'var(--muted, #888)',
  fontSize: 12,
}

const scoreStyle = {
  color: 'var(--green, #4caf50)',
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

const emptyStyle = {
  color: 'var(--muted, #888)',
  margin: 0,
}
