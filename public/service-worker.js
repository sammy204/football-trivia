// Service Worker for Football Trivia PWA with Push Notifications

const CACHE_NAME = 'football-trivia-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/logo-mark.svg',
]

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Non-critical caching errors shouldn't fail the install
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request)
        .then((response) => {
          // Don't cache if response is not ok
          if (!response || response.status !== 200) return response
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(event.request)
        })
    })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  let data = {
    title: 'Football Trivia',
    body: 'Daily challenge is ready!',
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/logo-mark.svg',
    badge: '/logo-mark.svg',
    tag: 'daily-challenge',
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus()
        }
      }
      // If not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
