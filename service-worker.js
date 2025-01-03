const CACHE_NAME = 'PWA-QUEUE-ACTIVITY-V04';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install Service Worker dan cache file statis
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// Aktivasi Service Worker dan hapus cache lama
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

// Tangani permintaan fetch dengan caching dan refresh data
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Caching untuk permintaan ke Supabase (dengan pengecekan kadaluarsa cache)
    if (url.origin === 'https://lukqiyskvaeuqxtpkwax.supabase.co') {
        event.respondWith(
            caches.open(CACHE_NAME).then(async cache => {
                const cachedResponse = await cache.match(event.request);
                const now = Date.now();

                // Gunakan cache jika belum kadaluarsa (1 jam)
                if (cachedResponse) {
                    const cachedTime = new Date(cachedResponse.headers.get('sw-fetched-time'));
                    if (now - cachedTime.getTime() < 1 * 60 * 60 * 1000) { // Cache 1 jam
                        return cachedResponse;
                    }
                }

                // Ambil data dari jaringan jika cache sudah kedaluwarsa
                const fetchResponse = await fetch(event.request);
                const responseClone = fetchResponse.clone(); // Salin respons sebelum dipakai
                const headers = new Headers(fetchResponse.headers);
                headers.append('sw-fetched-time', new Date().toISOString());
                const response = new Response(responseClone.body, { headers });

                // Simpan respons ke cache
                cache.put(event.request, response.clone());

                return fetchResponse;
            })
        );
    }
    // Default: caching untuk file statis dan CDN
    else if (url.protocol === 'http:' || url.protocol === 'https:') {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(fetchResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
    }
});
