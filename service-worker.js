const CACHE_NAME = 'activity-queue-cache-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png'
];

// Tambahkan URL eksternal yang sering digunakan
const externalUrls = [
    'https://script.google.com/macros/s/AKfycbzP7ZD7LQ9bYvwwXMzO-ryGYGH0xmeZbIh-PJEeTTnOFalwzxCzem4ERwzwYtOx8sTI/exec'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
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
    const requestUrl = new URL(event.request.url);

    // Handle requests to Google Apps Script
    if (requestUrl.origin === 'https://script.google.com') {
        event.respondWith(
            caches.match(event.request).then(response => {
                // Cache hit - return the cached response
                if (response) {
                    return response;
                }

                // Fetch from network if not in cache
                return fetch(event.request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        // Cache the new response dynamically
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(error => {
                    console.error('Fetching failed:', error);
                    // Optional: Return a fallback response here
                    throw error;
                });
            })
        );
        return;
    }

    // Handle other requests
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
