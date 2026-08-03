// Bump this on every deploy so browsers detect the new service-worker.js bytes,
// activate it immediately (skipWaiting/clients.claim below), and drop the old cache.
const CACHE_NAME = 'jungle-films-templates-v2'
// Must match vite.config.ts `base` — this file is copied to dist/ as-is, Vite doesn't rewrite it.
const BASE = '/code-proyectos/'
const APP_SHELL = [BASE, `${BASE}index.html`, `${BASE}manifest.json`]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

// Navigation requests (the HTML page) go network-first so a new deploy is picked up
// on next load instead of being stuck on whatever was cached first. Everything else
// (JS/CSS with content-hashed filenames, images) stays cache-first since a changed
// file always gets a new URL anyway.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(`${BASE}index.html`))),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        return response
      })
    }),
  )
})
