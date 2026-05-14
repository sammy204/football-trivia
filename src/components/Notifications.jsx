import { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { db } from '../lib/firebase'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const notificationsRef = ref(db, 'notifications')
    get(notificationsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        // Sort by timestamp descending (newest first)
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        setNotifications(list)
      } else {
        setNotifications([])
      }
      setLoading(false)
    }).catch((error) => {
      console.error('Error fetching notifications:', error)
      setLoading(false)
    })
  }, [])

  const dismissNotification = async (id) => {
    try {
      await remove(ref(db, `notifications/${id}`))
    } catch (e) {
      console.error('Failed to dismiss notification:', e)
    }
  }

  if (loading) {
    return <div className="admin-placeholder">Loading notifications...</div>
  }

  if (notifications.length === 0) {
    return <div className="admin-placeholder">No notifications</div>
  }

  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      <div className="notifications-list">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-item">
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
              <span className="notification-time">
                {new Date(notification.timestamp).toLocaleString()}
              </span>
            </div>
            <button 
              className="dismiss-btn"
              onClick={() => dismissNotification(notification.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Notifications