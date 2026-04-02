const CACHE_NAME = 'workout-app-v4';
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/style.css',
  '/manifest.json',
  '/favicon.svg',
  '/icons/workout-logo.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(
        urlsToCache.map(url => cache.add(url))
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiRequest = url.href.includes('workout-api');
  const isStaticAsset = url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/icons/')
    || url.pathname === '/style.css'
    || url.pathname === '/manifest.json'
    || url.pathname === '/favicon.svg';
  const isNavigationRequest = request.mode === 'navigate';

  if (!isSameOrigin || isApiRequest || (!isNavigationRequest && !isStaticAsset)) {
    return;
  }

  event.respondWith(
    caches.match(request).then(async cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    }).catch(async () => {
      if (isNavigationRequest) {
        const fallback = await caches.match('/');
        if (fallback) {
          return fallback;
        }
      }

      throw new Error(`Failed to fetch ${url.pathname}`);
    }),
  );
});
