// Service worker template. vite.config.js fills in the version and file list at build time
// and writes dist/sw.js. A new deploy changes the version, so phones fetch the new files in
// the background and show them on the next launch. (Pattern shared with ClassFlow and Noor.)
const APP_CACHE = 'multiply-app-94d927a8975d';
const FILES = ["./assets/index-B8w5zQLV.css","./assets/index-BQ99VN5M.js","./assets/lexend-latin-ext-wght-normal-B6JQhE1e.woff2","./assets/lexend-latin-wght-normal-ci0D1wrL.woff2","./assets/lexend-vietnamese-wght-normal-RvljkFvg.woff2","./icon-192.png","./icon-512.png","./icon.svg","./index.html","./manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      // Only old app caches are removed. Progress is in localStorage, not here.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('multiply-app-') && k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const options = { ignoreVary: true };
  if (request.mode === 'navigate') {
    event.respondWith(caches.match(new URL('./index.html', self.registration.scope).href, options).then((cached) => cached || fetch(request)));
    return;
  }
  event.respondWith(caches.match(request, options).then((cached) => cached || fetch(request)));
});
