self.addEventListener('install', event => {
  console.log('Service Worker zainstalowany');
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});