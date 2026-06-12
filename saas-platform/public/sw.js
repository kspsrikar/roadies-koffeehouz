const CACHE_NAME = 'roadies-saas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/globe.svg',
  '/vercel.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Return a generic offline page or value if fetch fails
        return new Response('Offline mode enabled. Showing cached resources.', {
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
