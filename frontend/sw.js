const CACHE_NAME = 'neon-drift-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './renderer.js',
    './network.js',
    './icon-512.png',
];

// Install — cache all game assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate — remove old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — serve from cache first, fallback to network
self.addEventListener('fetch', (e) => {
    // Skip WebSocket requests
    if (e.request.url.startsWith('ws')) return;

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(response => {
                // Cache new requests dynamically
                if (response.ok && e.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback — return cached index
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
