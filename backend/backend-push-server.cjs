const path = require('path')
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, '.env.backend'),
})
const express = require('express')
const cors = require('cors')
const webpush = require('web-push')
const cron = require('node-cron')
const admin = require('firebase-admin')

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || (process.platform === 'win32'
    ? path.join(__dirname, 'serviceAccountKey.json')
    : '/etc/secrets/serviceAccountKey.json')
const serviceAccount = require(serviceAccountPath)

const app = express()

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://sports-trivia-85170-default-rtdb.firebaseio.com',
})

const db = admin.firestore()
const rtdb = admin.database()
const subscriptionsCollection = db.collection('push_subscriptions')
const testRoutesEnabled = String(process.env.ENABLE_TEST_ROUTES).toLowerCase() === 'true'

// Middleware
app.use(cors())
app.use(express.json())

app.use('/api/test', (req, res, next) => {
  if (!testRoutesEnabled) {
    return res.status(404).json({ error: 'Test routes are disabled' })
  }
  next()
})

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

const NIGERIA_UTC_OFFSET_HOURS = 1

function getNigeriaDateKey(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const year = nigeriaDate.getUTCFullYear()
  const month = String(nigeriaDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(nigeriaDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPreviousNigeriaDateKey(date = new Date()) {
  const nigeriaDate = new Date(date.getTime() + NIGERIA_UTC_OFFSET_HOURS * 60 * 60 * 1000)
  const previousDate = new Date(Date.UTC(
    nigeriaDate.getUTCFullYear(),
    nigeriaDate.getUTCMonth(),
    nigeriaDate.getUTCDate() - 1,
  ))
  return getNigeriaDateKey(previousDate)
}

function parseDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return null
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

function getDayDifference(fromDateKey, toDateKey) {
  const fromDate = parseDateKey(fromDateKey)
  const toDate = parseDateKey(toDateKey)
  if (!fromDate || !toDate) return 0
  return Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000))
}

async function sendNotificationToUser({ userId, title, body, type, dateKey }) {
  if (!userId) return { sent: 0, failed: 0 }

  const snapshot = await subscriptionsCollection.where('userId', '==', userId).get()
  if (snapshot.empty) return { sent: 0, failed: 0 }

  const payload = JSON.stringify({ title, body, type, dateKey })
  let sent = 0
  let failed = 0

  for (const doc of snapshot.docs) {
    const subscription = doc.data()
    try {
      await webpush.sendNotification(subscription, payload)
      sent++
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await doc.ref.delete()
      }
      failed++
    }
  }

  return { sent, failed }
}

async function setNotificationSent({ userId, notificationType, dateKey }) {
  if (!userId || !notificationType || !dateKey) return

  await rtdb.ref(`users/${userId}/notifications/${notificationType}`).update({
    lastSentDateKey: dateKey,
    updatedAt: new Date().toISOString(),
  })
}

async function resetBrokenStreak({ userId, streak, todayDateKey }) {
  await rtdb.ref(`users/${userId}/dailyStreak`).update({
    ...streak,
    current: 0,
    lastBrokenOnDateKey: todayDateKey,
    updatedAt: new Date().toISOString(),
  })
}

function buildStreakReminderMessage() {
  return {
    title: 'Keep your streak alive',
    body: 'You have not played today. Jump in before midnight to protect your streak.',
  }
}

function buildStreakLostMessage(previousCount) {
  return {
    title: 'Your streak is gone',
    body: `You missed a day and lost your ${previousCount}-day streak. Play today to start a new one.`,
  }
}

// POST /api/subscriptions - Register push subscription
app.post('/api/subscriptions', async (req, res) => {
  const payload = req.body?.subscription?.endpoint ? req.body : { subscription: req.body }
  const subscription = payload.subscription
  const userId = payload.userId || null
  const email = payload.email || null
  const displayName = payload.displayName || null

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' })
  }

  try {
    const id = Buffer.from(subscription.endpoint).toString('base64').slice(0, 100)
    await subscriptionsCollection.doc(id).set({
      ...subscription,
      userId,
      email,
      displayName,
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
cron.schedule('0 11 * * *', async () => {
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

// Scheduled job: Send daily challenge closed notification at 11:30 UTC (12:30 PM Nigeria)
cron.schedule('30 11 * * *', async () => {
  console.log('Sending daily challenge closed notifications...')

  const payload = JSON.stringify({
    title: 'Daily Challenge Closed ⛔',
    body: 'The daily football/basketball challenge has ended. Come back tomorrow for a new one!',
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
    console.log(`Closed notification sent to ${sent} users, ${failed} failed`)
  } catch (error) {
    console.error('Error in closing cron job:', error)
  }
})

app.post('/api/test/streak-reminder', async (req, res) => {
  const { userId, dateKey } = req.body
  const targetDateKey = dateKey || getNigeriaDateKey()

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    const message = buildStreakReminderMessage()
    const result = await sendNotificationToUser({
      userId,
      title: message.title,
      body: message.body,
      type: 'streakReminder',
      dateKey: targetDateKey,
    })

    await setNotificationSent({
      userId,
      notificationType: 'streakReminder',
      dateKey: targetDateKey,
    })

    res.json({
      success: true,
      userId,
      dateKey: targetDateKey,
      ...result,
    })
  } catch (error) {
    console.error('Error sending manual streak reminder:', error)
    res.status(500).json({ error: 'Failed to send streak reminder' })
  }
})

app.post('/api/test/streak-lost', async (req, res) => {
  const { userId, previousCount, dateKey } = req.body
  const targetDateKey = dateKey || getNigeriaDateKey()

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    let streakCount = previousCount || 1

    if (!previousCount) {
      try {
        const snapshot = await rtdb.ref(`users/${userId}/dailyStreak`).get()
        const streak = snapshot.val() || null
        streakCount = streak?.current || 1
      } catch (readError) {
        console.warn('Could not read daily streak for manual streak lost test:', readError.message)
      }
    }

    const message = buildStreakLostMessage(streakCount)

    const result = await sendNotificationToUser({
      userId,
      title: message.title,
      body: message.body,
      type: 'streakLost',
      dateKey: targetDateKey,
    })

    await setNotificationSent({
      userId,
      notificationType: 'streakLost',
      dateKey: targetDateKey,
    })

    res.json({
      success: true,
      userId,
      dateKey: targetDateKey,
      previousCount: streakCount,
      ...result,
    })
  } catch (error) {
    console.error('Error sending manual streak lost notification:', error)
    res.status(500).json({ error: error.message || 'Failed to send streak lost notification' })
  }
})

// Scheduled job: 10:00 PM Nigeria time streak reminder
cron.schedule('0 22 * * *', async () => {
  const todayDateKey = getNigeriaDateKey()
  console.log(`Sending streak reminder notifications for ${todayDateKey}...`)

  try {
    const snapshot = await rtdb.ref('users').get()
    const users = snapshot.val() || {}
    let targeted = 0
    let sent = 0
    let failed = 0

    for (const [userId, userData] of Object.entries(users)) {
      const streak = userData?.dailyStreak
      const notifications = userData?.notifications?.streakReminder
      const playedToday = Boolean(userData?.playActivity?.[todayDateKey])

      if (!streak?.current || streak.current < 1) continue
      if (playedToday) continue
      if (notifications?.lastSentDateKey === todayDateKey) continue

      targeted++
      const message = buildStreakReminderMessage()
      const result = await sendNotificationToUser({
        userId,
        title: message.title,
        body: message.body,
        type: 'streakReminder',
        dateKey: todayDateKey,
      })

      sent += result.sent
      failed += result.failed
      await setNotificationSent({
        userId,
        notificationType: 'streakReminder',
        dateKey: todayDateKey,
      })
    }

    console.log(`Streak reminders targeted ${targeted} users, sent ${sent}, failed ${failed}`)
  } catch (error) {
    console.error('Error sending streak reminders:', error)
  }
}, { timezone: 'Africa/Lagos' })

// Scheduled job: 12:05 AM Nigeria time streak loss notification
cron.schedule('5 0 * * *', async () => {
  const todayDateKey = getNigeriaDateKey()
  const yesterdayDateKey = getPreviousNigeriaDateKey()
  console.log(`Checking broken streaks for ${todayDateKey} (missed ${yesterdayDateKey})...`)

  try {
    const snapshot = await rtdb.ref('users').get()
    const users = snapshot.val() || {}
    let targeted = 0
    let sent = 0
    let failed = 0

    for (const [userId, userData] of Object.entries(users)) {
      const streak = userData?.dailyStreak
      const notifications = userData?.notifications?.streakLost
      const playedYesterday = Boolean(userData?.playActivity?.[yesterdayDateKey])

      if (!streak?.current || streak.current < 1) continue
      if (playedYesterday) continue
      if (notifications?.lastSentDateKey === todayDateKey) continue

      const dayDiff = getDayDifference(streak.lastPlayedDateKey, todayDateKey)
      if (dayDiff <= 1) continue

      const previousCount = streak.current
      targeted++

      await resetBrokenStreak({
        userId,
        streak,
        todayDateKey,
      })

      const message = buildStreakLostMessage(previousCount)
      const result = await sendNotificationToUser({
        userId,
        title: message.title,
        body: message.body,
        type: 'streakLost',
        dateKey: todayDateKey,
      })

      sent += result.sent
      failed += result.failed
      await setNotificationSent({
        userId,
        notificationType: 'streakLost',
        dateKey: todayDateKey,
      })
    }

    console.log(`Broken streak check targeted ${targeted} users, sent ${sent}, failed ${failed}`)
  } catch (error) {
    console.error('Error sending streak lost notifications:', error)
  }
}, { timezone: 'Africa/Lagos' })

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
