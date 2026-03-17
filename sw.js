const CACHE_VERSION = 'bodypilot-v4';
const STATIC_CACHE = CACHE_VERSION + '-static';
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';

const APP_SHELL = [
  '/',
  '/index.html',
  '/pages/dashboard.html',
  '/pages/login.html',
  '/pages/register.html',
  '/pages/settings.html',
  '/pages/reports.html',
  '/pages/terms.html',
  '/pages/privacy.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/js/main.js',
  '/js/config.js',
  '/js/auth.js',
  '/js/store.js',
  '/js/dashboard.js',
  '/js/food-db.js',
  '/js/advisor.js',
  '/js/exercise-db.js',
  '/js/barcode-db.js',
  '/js/gamification.js',
  '/js/settings.js',
  '/js/reports.js',
  '/js/vision-api.js',
  '/js/youtube.js',
  '/pages/youtube.html',
  '/manifest.json',
  '/offline.html'
];

// Install - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network-first for pages, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // HTML pages: network-first
  if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Static assets (CSS, JS, images): cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
