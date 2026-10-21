// Service Worker: App-Shell offline verfügbar machen (relative Pfade → funktioniert unter /30min-gym/)
const VERSION = '30mingym-v1.0.0';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/main.js', './js/core/util.js', './js/core/defaults.js', './js/core/store.js', './js/core/training.js',
  './js/core/protocol.js', './js/core/exercises.js', './js/core/pdf.js',
  './js/ui/dom.js', './js/ui/charts.js', './js/ui/figures.js', './js/ui/actions.js',
  './js/ui/views/today.js', './js/ui/views/exercises.js', './js/ui/views/progress.js', './js/ui/views/protocols.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Netzwerk zuerst (für Updates), bei fehlender Verbindung aus dem Cache
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
