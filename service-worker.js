const CACHE_NAME = 'PWA-QUEUE-ACTIVITY-V04';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.origin === 'https://lukqiyskvaeuqxtpkwax.supabase.co') {
        event.respondWith(
            caches.open(CACHE_NAME).then(async cache => {
                const cachedResponse = await cache.match(event.request);
                const now = Date.now();

                if (cachedResponse) {
                    const cachedTime = new Date(cachedResponse.headers.get('sw-fetched-time'));
                    if (now - cachedTime.getTime() < 1 * 60 * 60 * 1000) {
                        return cachedResponse;
                    }
                }

                const fetchResponse = await fetch(event.request);
                const headers = new Headers(fetchResponse.headers);
                headers.append('sw-fetched-time', new Date().toISOString());
                const response = new Response(fetchResponse.body, { headers });
                cache.put(event.request, response.clone());
                return fetchResponse;
            })
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});
