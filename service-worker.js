const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png'
];

// Tambahkan URL eksternal (Google Apps Script)
const externalUrls = [
    'https://script.google.com/macros/s/AKfycbxdivtQioU3j1TmBDtU76De6jr3iXk_5UbXLVvaKHWwT4PjOFWRIvkM2UfF_b8em80/exec'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll([...urlsToCache, ...externalUrls]);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event Listener
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Cache hit - return the response
            if (response) {
                return response;
            }

            // Fetch from network if not in cache
            return fetch(event.request).then(networkResponse => {
                // Cache the new response
                if (event.request.url.startsWith('https://script.google.com')) {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }

                return networkResponse;
            }).catch(error => {
                console.error('Fetching failed:', error);
                throw error;
            });
        })
    );
});