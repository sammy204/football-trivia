import { useEffect, useMemo, useState } from 'react'
import { get, push, ref, remove } from 'firebase/database'
import { db } from '../lib/firebase'
import { listenToAllSeasonalEvents } from '../lib/seasonalEvents'
import styles from './Notifications.module.css'

const DEFAULT_TITLE = 'Seasonal event is live'

function getNotifyEndpoint() {
  const backendUrl = import.meta.env.VITE_PUSH_BACKEND_URL
  return backendUrl ? `${backendUrl.replace(/\/$/, '')}/api/notify` : '/api/notify'
}

function buildSeasonalBody(event) {
  if (!event) return ''
  return `${event.name} is now live. Play anytime while the seasonal event is active.`
}

function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [seasonalEvents, setSeasonalEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  const selectedEvent = useMemo(
    () => seasonalEvents.find((event) => event.id === selectedEventId) || null,
    [seasonalEvents, selectedEventId]
  )

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    setLoadingEvents(true)
    const unsubscribe = listenToAllSeasonalEvents(
      (events) => {
        setSeasonalEvents(events)
        setLoadingEvents(false)
      },
      (error) => {
        console.error('Error fetching seasonal events:', error)
        setLoadingEvents(false)
      }
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    setTitle(`${selectedEvent.name} is live`)
    setBody(buildSeasonalBody(selectedEvent))
  }, [selectedEvent])

  async function loadNotifications() {
    setLoading(true)
    try {
      const snapshot = await get(ref(db, 'notifications'))
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({ id, ...val }))
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        setNotifications(list)
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanBody = body.trim()
    if (!cleanTitle || !cleanBody) {
      setStatus({ type: 'error', message: 'Add a title and message before sending.' })
      return
    }

    setSending(true)
    setStatus(null)
    try {
      const response = await fetch(getNotifyEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle, body: cleanBody }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Notification send failed.')
      }

      const logEntry = {
        title: cleanTitle,
        message: cleanBody,
        type: 'seasonal',
        eventId: selectedEvent?.id || null,
        eventName: selectedEvent?.name || null,
        sent: result.sent || 0,
        failed: result.failed || 0,
        total: result.total || 0,
        timestamp: Date.now(),
        createdBy: user?.uid || 'admin',
      }

      const saved = await push(ref(db, 'notifications'), logEntry)
      setNotifications((current) => [{ id: saved.key, ...logEntry }, ...current])
      setStatus({
        type: 'success',
        message: `Sent to ${logEntry.sent} subscriber${logEntry.sent === 1 ? '' : 's'}${logEntry.failed ? `, ${logEntry.failed} failed` : ''}.`,
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
      setStatus({ type: 'error', message: error.message || 'Failed to send notification.' })
    } finally {
      setSending(false)
    }
  }

  async function dismissNotification(id) {
    try {
      await remove(ref(db, `notifications/${id}`))
      setNotifications((current) => current.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }
  }

  return (
    <div className={styles.container}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Seasonal push</p>
            <h2>Send notification</h2>
          </div>
          <span className={styles.target}>All subscribed users</span>
        </div>

        <form className={styles.form} onSubmit={handleSend}>
          <label className={styles.label}>
            Seasonal event
            <select
              className={styles.select}
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={loadingEvents}
            >
              <option value="">{loadingEvents ? 'Loading events...' : 'Choose an event'}</option>
              {seasonalEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Title
            <input
              className={styles.input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Seasonal event is live"
              maxLength={80}
            />
          </label>

          <label className={styles.label}>
            Message
            <textarea
              className={styles.textarea}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Tell players what is happening..."
              rows={4}
              maxLength={220}
            />
          </label>

          <div className={styles.actions}>
            <button className={styles.sendBtn} type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send notification'}
            </button>
            {status && (
              <p className={`${styles.status} ${styles[status.type]}`}>
                {status.message}
              </p>
            )}
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>History</p>
            <h2>Sent notifications</h2>
          </div>
        </div>

        {loading ? (
          <div className={styles.placeholder}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.placeholder}>No notifications sent yet.</div>
        ) : (
          <div className={styles.list}>
            {notifications.map((notification) => (
              <div key={notification.id} className={styles.item}>
                <div className={styles.content}>
                  <p className={styles.title}>{notification.title || 'Notification'}</p>
                  <p className={styles.message}>{notification.message}</p>
                  <span className={styles.time}>
                    {new Date(notification.timestamp).toLocaleString()}
                    {typeof notification.sent === 'number' && ` · ${notification.sent} sent`}
                    {notification.eventName && ` · ${notification.eventName}`}
                  </span>
                </div>
                <button
                  className={styles.dismissBtn}
                  onClick={() => dismissNotification(notification.id)}
                  title="Dismiss from history"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Notifications
