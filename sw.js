const CACHE_VERSION = 'mb-tracker-v5';
const BASE = '/mercedes-fahrkosten/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.svg',
  BASE + 'icon-512.svg',
  BASE + 'vehicle.webp',
  BASE + 'vehicle.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(ASSETS.map((url) => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Anfragen an die Supabase-Projekt-API (Auth/REST) niemals cachen oder aus dem
  // Cache bedienen -- sonst würde die App bei fehlender Verbindung fälschlich
  // veraltete Cloud-Daten als "aktuell" ansehen, statt sauber offline zu gehen.
  if (url.includes('.supabase.co')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((resp) => {
          if (resp && resp.ok) {
            caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
