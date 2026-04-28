const VERSION = 'retro-arcade-v15';
const APP_SHELL_CACHE = `${VERSION}-shell`;
const APP_SHELL = [
    './',
    './index.html',
    './style.css?v=15',
    './manifest.json?v=15',
    './assets/icons/icon.svg',
    './js/config.js?v=15',
    './js/gameState.js?v=15',
    './js/audio.js?v=15',
    './js/renderer.js?v=15',
    './js/input.js?v=15',
    './js/collision.js?v=15',
    './js/graphics.js?v=15',
    './js/arcade.js?v=15',
    './js/pacman.js?v=15',
    './js/fieldGames.js?v=15',
    './js/sprites.js?v=15',
    './js/enemies.js?v=15',
    './js/storage.js?v=15',
    './js/main.js?v=15'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith('retro-arcade-') && key !== APP_SHELL_CACHE)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/')) return;

    event.respondWith(
        caches.match(request)
            .then(cached => cached || fetch(request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type === 'opaque') return response;
                    const copy = response.clone();
                    caches.open(APP_SHELL_CACHE).then(cache => cache.put(request, copy));
                    return response;
                }))
            .catch(() => caches.match('./index.html'))
    );
});
