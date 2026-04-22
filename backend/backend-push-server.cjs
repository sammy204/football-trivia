/**
 * Push Notification Server Backend (Node.js + Express + web-push)
 * 
 * Usage:
 * 1. npm install express web-push cors dotenv
 * 2. Create .env with:
 *    VAPID_PUBLIC_KEY=<your_public_key>
 *    VAPID_PRIVATE_KEY=<your_private_key>
 *    VAPID_EMAIL=admin@footballtrivia.com
 * 3. node server.js
 * 
 * Deploy to:
 * - Heroku
 * - Railway
 * - Render
 * - Vercel (as serverless function)
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const webpush = require('web-push')
const cron = require('node-cron')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Configure web-push
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys in environment')
  process.exit(1)
}

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'admin@footballtrivia.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// In-memory subscription store (replace with database in production)
const subscriptions = new Map()

// POST /api/subscriptions - Register push subscription
app.post('/api/subscriptions', (req, res) => {
  const subscription = req.body

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' })
  }

  // Store subscription (keyed by endpoint for deduplication)
  subscriptions.set(subscription.endpoint, {
    ...subscription,
    registeredAt: new Date(),
  })

  console.log(`Subscription registered: ${subscription.endpoint.slice(0, 50)}...`)
  res.status(201).json({ success: true, count: subscriptions.size })
})

// GET /api/subscriptions/count - Get subscription count
app.get('/api/subscriptions/count', (req, res) => {
  res.json({ count: subscriptions.size })
})

// POST /api/notify - Manually trigger notifications (for testing)
app.post('/api/notify', async (req, res) => {
  const { title, body } = req.body

  if (!title || !body) {
    return res.status(400).json({ error: 'Missing title or body' })
  }

  const payload = JSON.stringify({ title, body })
  let sent = 0
  let failed = 0

  for (const [endpoint, subscription] of subscriptions.entries()) {
    try {
      await webpush.sendNotification(subscription, payload)
      sent++
    } catch (error) {
      if (error.statusCode === 410) {
        // Subscription expired
        subscriptions.delete(endpoint)
      }
      failed++
    }
  }

  res.json({ sent, failed, total: subscriptions.size })
})

// Scheduled job: Send daily challenge notification at 12:00 UTC
cron.schedule('0 12 * * *', async () => {
  console.log('🎯 Sending daily challenge notifications...')

  const payload = JSON.stringify({
    title: 'Daily Challenge Ready!',
    body: 'The daily football/basketball challenge has started. Play now!',
  })

  let sent = 0
  let failed = 0

  for (const [endpoint, subscription] of subscriptions.entries()) {
    try {
      await webpush.sendNotification(subscription, payload)
      sent++
    } catch (error) {
      if (error.statusCode === 410) {
        subscriptions.delete(endpoint)
      }
      failed++
    }
  }

  console.log(`✅ Sent to ${sent} users, ${failed} failed, ${subscriptions.size} active`)
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', subscriptions: subscriptions.size, time: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Push notification server running on port ${PORT}`)
  console.log(`📍 Subscriptions active: ${subscriptions.size}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  process.exit(0)
})
