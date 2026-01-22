const CACHE_NAME = 'dork-tool-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './assets/css/style.css',
    './assets/js/core.js',
    './assets/js/dork-engine.js',
    './assets/js/dorks-data.js',
    './assets/js/app.js',
    './assets/data/dorks.json',
    './assets/images/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Strategy: Stale-While-Revalidate for most content
    // But for simple static sites, Cache First is often safer to ensure speed
    // Let's go with Cache First, falling back to network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
