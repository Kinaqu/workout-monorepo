const CACHE_NAME = 'kinova-app-v5';
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/style.css',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
  '/logo_without_bg.svg',
  '/fonts/manrope-400.ttf',
  '/fonts/manrope-500.ttf',
  '/fonts/manrope-600.ttf',
  '/fonts/manrope-700.ttf',
  '/fonts/manrope-800.ttf',
  '/fonts/sora-400.ttf',
  '/fonts/sora-500.ttf',
  '/fonts/sora-600.ttf',
  '/fonts/sora-700.ttf'
];

function getNavigationCacheKey(url) {
  if (url.pathname.startsWith('/login')) {
    return '/login';
  }

  if (url.pathname.startsWith('/register')) {
    return '/register';
  }

  return '/';
}

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
    || url.pathname.startsWith('/fonts/')
    || url.pathname === '/style.css'
    || url.pathname === '/manifest.json'
    || url.pathname === '/favicon.svg'
    || url.pathname === '/logo.svg'
    || url.pathname === '/logo_without_bg.svg';
  const isNavigationRequest = request.mode === 'navigate';

  if (!isSameOrigin || isApiRequest || (!isNavigationRequest && !isStaticAsset)) {
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: isNavigationRequest }).then(async cachedResponse => {
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
        const fallback = await caches.match(getNavigationCacheKey(url), { ignoreSearch: true });
        if (fallback) {
          return fallback;
        }
      }

      throw new Error(`Failed to fetch ${url.pathname}`);
    }),
  );
});
