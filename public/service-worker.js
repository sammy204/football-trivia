// Service Worker for Football Trivia PWA with Push Notifications

const CACHE_NAME = 'football-trivia-v2'
const urlsToCache = [
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

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

function isAppShellAsset(url) {
  return (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  )
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse
    throw new Error('Network request failed and no cache entry was found.')
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) return cachedResponse

  const response = await fetch(request)
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

// Fetch event - prefer fresh app shell, cache static assets for offline fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  if (isNavigationRequest(event.request) || isAppShellAsset(url)) {
    event.respondWith(networkFirst(event.request))
    return
  }

  event.respondWith(cacheFirst(event.request))
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
