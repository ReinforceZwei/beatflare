// Change the version number when you update files or the service worker
const CACHE_VERSION = 'v4';
const CACHE_NAME = `tap-bpm-cache-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/metronome.component.js',
  '/metronome.js',
  '/tap-bpm.component.js',
  '/tap-bpm.js',
  '/timer.js',
  '/timer-worker.js',
  '/hooks.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/click.mp3',
  '/click-high.mp3',
  // External dependencies from importmap - entry points only
  'https://esm.sh/preact@10.23.1',
  'https://esm.sh/preact@10.23.1/',
  'https://esm.sh/@preact/signals@1.3.0?external=preact',
  'https://esm.sh/htm@3.1.1/preact?external=preact',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

// Install event: Cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell and content');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Force the waiting service worker to become active
        console.log('Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete old version caches
              return cacheName.startsWith('tap-bpm-cache-') && cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        console.log('Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event: Serve from cache, falling back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the fetched resource for future use
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            // You could return a custom offline page here
          });
      })
  );
}); 