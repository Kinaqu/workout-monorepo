(function () {
  const CACHE_PREFIX = 'kinova-app-';

  function isVercelPreviewHost(hostname) {
    return typeof hostname === 'string' && hostname.endsWith('.vercel.app');
  }

  async function clearKinovaCaches() {
    if (!('caches' in window)) {
      return;
    }

    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX)).map(key => caches.delete(key)));
  }

  async function disableServiceWorkerCaching() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    await clearKinovaCaches();
  }

  async function enableServiceWorkerCaching() {
    await navigator.serviceWorker.register('/sw.js');
  }

  window.addEventListener('load', () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const action = isVercelPreviewHost(window.location.hostname)
      ? disableServiceWorkerCaching()
      : enableServiceWorkerCaching();

    action.catch(error => {
      console.log('Service worker setup failed:', error);
    });
  });
})();
