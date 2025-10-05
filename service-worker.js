const CACHE_NAME = 'phone-imei-manager-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const OFFLINE_PAGE = '/offline.html';

// Resources to pre-cache
const APP_SHELL = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdn.jsdelivr.net/npm/@zxing/library@latest',
    OFFLINE_PAGE
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)),
            caches.open(CACHE_NAME),
            caches.open(DYNAMIC_CACHE)
        ]).then(() => self.skipWaiting())
    );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && 
                                  name !== STATIC_CACHE && 
                                  name !== DYNAMIC_CACHE)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch handler with strategies
self.addEventListener('fetch', (event) => {
    // Parse the request URL
    const requestURL = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (event.request.headers.get('accept').includes('text/html')) {
        // HTML - Network first, fallback to cache
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(response => response || caches.match(OFFLINE_PAGE));
                })
        );
    } else if (APP_SHELL.includes(requestURL.pathname)) {
        // App Shell - Cache first
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    } else if (event.request.url.includes('firestore.googleapis.com')) {
        // Firestore API - Network first with offline persistence
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    } else {
        // Everything else - Stale while revalidate
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    const fetchPromise = fetch(event.request)
                        .then(networkResponse => {
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => cache.put(event.request, networkResponse.clone()));
                            return networkResponse;
                        });
                    return cachedResponse || fetchPromise;
                })
        );
    }
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-phones') {
        event.waitUntil(syncPhones());
    }
});

// Push notification handler
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('IMEI Manager', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Helper function to sync offline changes
async function syncPhones() {
    // The service worker cannot access localStorage; notify all clients to process queued writes
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    for (const client of allClients) {
        client.postMessage({ type: 'sync-phones' });
    }
}



