import { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { db } from '../lib/firebase'

function Analytics() {
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const analyticsRef = ref(db, 'analytics')
    get(analyticsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setAnalytics(data)
      } else {
        setAnalytics({})
      }
      setLoading(false)
    }).catch((error) => {
      console.error('Error fetching analytics:', error)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="admin-placeholder">Loading analytics...</div>
  }

  return (
    <div className="analytics-container">
      <h2>Analytics</h2>
      {Object.keys(analytics).length === 0 ? (
        <div className="admin-placeholder">No analytics data available</div>
      ) : (
        <div className="analytics-grid">
          {Object.entries(analytics).map(([key, value]) => (
            <div key={key} className="analytics-card">
              <h3>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
              <div className="analytics-value">
                {typeof value === 'object' ? (
                  <pre>{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  <span>{value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Analytics