self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/info.html',
                '/style.css',
                '/main.js',
                '/icon-192.png',
                '/icon-512.png',
                '/myticket_logo.svg',
            ]);
        }).catch((error) => {
            console.error('Caching failed:', error);
        })
    );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

