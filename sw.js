const VERSION = 'v1';
const SHELL_CACHE = `coverflow-shell-${VERSION}`;
const API_CACHE = `coverflow-api-${VERSION}`;
const ARTWORK_CACHE = `coverflow-artwork-${VERSION}`;
const CACHES = new Set([SHELL_CACHE, API_CACHE, ARTWORK_CACHE]);

const MAX_API_ENTRIES = 60;
const MAX_ARTWORK_ENTRIES = 300;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/albums/itunes.js',
  './src/coverflow/coverflow.js',
  './src/coverflow/coverflow.css',
  './src/player/player.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !CACHES.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(event, SHELL_CACHE));
  } else if (url.hostname === 'itunes.apple.com') {
    event.respondWith(networkFirst(request, API_CACHE, MAX_API_ENTRIES));
  } else if (url.hostname.endsWith('.mzstatic.com')) {
    event.respondWith(cacheFirst(request, ARTWORK_CACHE, MAX_ARTWORK_ENTRIES));
  }
});

async function staleWhileRevalidate(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });

  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  event.waitUntil(refresh);

  return cached || (await refresh) || offlineResponse();
}

async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    return (await cache.match(request)) || offlineResponse();
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      await cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    return offlineResponse();
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
}

function offlineResponse() {
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}
