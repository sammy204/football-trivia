// Push notification subscription management
// Uses Firebase Cloud Messaging for cross-platform push notifications
import { ref, set } from 'firebase/database'
import { db } from './firebase'

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

function getSubscriptionId(endpoint) {
  return window.btoa(endpoint).replace(/[+/=]/g, '').slice(0, 100)
}

async function saveSubscriptionToRealtimeDb({ userId, subscription }) {
  if (!userId || !subscription?.endpoint) return

  const subscriptionId = getSubscriptionId(subscription.endpoint)
  await set(ref(db, `users/${userId}/pushSubscriptions/${subscriptionId}`), {
    endpoint: subscription.endpoint,
    keys: subscription.keys || {},
    createdAt: new Date().toISOString(),
  })
}

async function subscribeUserToPush(user) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not available')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(
         import.meta.env.VITE_VAPID_PUBLIC_KEY
      ),
    })

    if (user?.uid) {
      await saveSubscriptionToRealtimeDb({
        userId: user.uid,
        subscription,
      })
    }

    // Send subscription to your backend
    const backendUrl = import.meta.env.VITE_PUSH_BACKEND_URL
  ? `${import.meta.env.VITE_PUSH_BACKEND_URL.replace(/\/$/, '')}/api/subscriptions`
  : '/api/subscriptions'

    await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.uid || null,
        email: user?.email || null,
        displayName: user?.displayName || null,
        subscription,
      }),
    })

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
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
  checkAndRequestPushSubscription,
}
