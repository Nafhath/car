const CACHE_NAME = 'neon-drift-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './renderer.js',
    './engine3d.js',
    './network.js',
    './icon-512.png',
    './manifest.json',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.url.startsWith('ws')) return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(response => {
                if (response.ok && e.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            }).catch(() => {
                if (e.request.mode === 'navigate') return caches.match('./index.html');
            });
        })
    );
});
