const CACHE_NAME = 'workout-app-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/login',
  '/register',
  '/style.css',
  '/api.js',
  '/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Don't cache API requests
  if (event.request.url.includes('workout-api')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
