require('dotenv').config()
const express = require('express')
const cors = require('cors')
const webpush = require('web-push')
const cron = require('node-cron')
const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

const app = express()

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const subscriptionsCollection = db.collection('push_subscriptions')

// Middleware
app.use(cors())
app.use(express.json())

// Configure web-push
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys in environment')
  process.exit(1)
}

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:support@footballtrivia.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// POST /api/subscriptions - Register push subscription
app.post('/api/subscriptions', async (req, res) => {
  const subscription = req.body

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' })
  }

  try {
    const id = Buffer.from(subscription.endpoint).toString('base64').slice(0, 100)
    await subscriptionsCollection.doc(id).set({
      ...subscription,
      registeredAt: admin.firestore.FieldValue.serverTimestamp()
    })
    console.log('Subscription saved to Firestore')
    const snapshot = await subscriptionsCollection.get()
    res.status(201).json({ success: true, count: snapshot.size })
  } catch (error) {
    console.error('Error saving subscription:', error)
    res.status(500).json({ error: 'Failed to save subscription' })
  }
})

// GET /api/subscriptions/count - Get subscription count
app.get('/api/subscriptions/count', async (req, res) => {
  try {
    const snapshot = await subscriptionsCollection.get()
    res.json({ count: snapshot.size })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get count' })
  }
})

// POST /api/notify - Manually trigger notifications
app.post('/api/notify', async (req, res) => {
  const { title, body } = req.body

  if (!title || !body) {
    return res.status(400).json({ error: 'Missing title or body' })
  }

  const payload = JSON.stringify({ title, body })
  let sent = 0
  let failed = 0

  try {
    const snapshot = await subscriptionsCollection.get()
    for (const doc of snapshot.docs) {
      const subscription = doc.data()
      try {
        await webpush.sendNotification(subscription, payload)
        sent++
      } catch (error) {
        if (error.statusCode === 410) {
          await doc.ref.delete()
        }
        failed++
      }
    }
    res.json({ sent, failed, total: snapshot.size })
  } catch (error) {
    console.error('Error sending notifications:', error)
    res.status(500).json({ error: 'Failed to send notifications' })
  }
})

// Scheduled job: Send daily challenge notification at 12:00 UTC
cron.schedule('0 12 * * *', async () => {
  console.log('Sending daily challenge notifications...')

  const payload = JSON.stringify({
    title: 'Daily Challenge Ready!',
    body: 'The daily football/basketball challenge has started. Play now!',
  })

  let sent = 0
  let failed = 0

  try {
    const snapshot = await subscriptionsCollection.get()
    for (const doc of snapshot.docs) {
      const subscription = doc.data()
      try {
        await webpush.sendNotification(subscription, payload)
        sent++
      } catch (error) {
        if (error.statusCode === 410) {
          await doc.ref.delete()
        }
        failed++
      }
    }
    console.log(`Sent to ${sent} users, ${failed} failed`)
  } catch (error) {
    console.error('Error in cron job:', error)
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Push notification server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  process.exit(0)
})