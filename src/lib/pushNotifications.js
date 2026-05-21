// Push notification subscription management

const SERVICE_WORKER_READY_TIMEOUT_MS = 10000
const SUBSCRIPTION_SAVE_TIMEOUT_MS = 10000

function withTimeout(promise, timeoutMs, message) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId)
  })
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    })
    console.log('Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

async function getReadyServiceWorkerRegistration() {
  const existingRegistration = await navigator.serviceWorker.getRegistration('/')
  if (!existingRegistration) {
    await registerServiceWorker()
  }

  return withTimeout(
    navigator.serviceWorker.ready,
    SERVICE_WORKER_READY_TIMEOUT_MS,
    'Service worker was not ready in time.'
  )
}

async function requestPushNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

async function subscribeUserToPush(user) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not available')
    return null
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Push notification permission has not been granted')
    return null
  }

  if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
    console.error('Missing VITE_VAPID_PUBLIC_KEY')
    return null
  }

  try {
    const registration = await getReadyServiceWorkerRegistration()
    const existingSubscription = await registration.pushManager.getSubscription()

    const subscription = existingSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    })

    const backendUrl = import.meta.env.VITE_PUSH_BACKEND_URL
      ? `${import.meta.env.VITE_PUSH_BACKEND_URL.replace(/\/$/, '')}/api/subscriptions`
      : '/api/subscriptions'

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), SUBSCRIPTION_SAVE_TIMEOUT_MS)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        userId: user?.uid || null,
        email: user?.email || null,
        displayName: user?.displayName || null,
        subscription,
        userAgent: navigator.userAgent,
      }),
    }).finally(() => window.clearTimeout(timeoutId))

    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(`Subscription save failed (${response.status}): ${message}`)
    }

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

async function refreshPushSubscription(user) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  const registration = await getReadyServiceWorkerRegistration()
  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) {
    await existingSubscription.unsubscribe()
  }

  return subscribeUserToPush(user)
}
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

async function checkAndRequestPushSubscription() {
  const hasPermission = await requestPushNotificationPermission()
  if (!hasPermission) {
    return false
  }

  const subscription = await subscribeUserToPush()
  return !!subscription
}

export {
  registerServiceWorker,
  requestPushNotificationPermission,
  subscribeUserToPush,
  refreshPushSubscription,
  checkAndRequestPushSubscription,
}
