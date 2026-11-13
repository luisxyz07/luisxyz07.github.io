'use strict';
const BASE = self.registration.scope;
const PREFIX = 'welten-' + new URL(BASE).pathname + '-';
const CACHE = PREFIX + '2026-11-13-v5';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/app.css', 'assets/app.js', 'assets/home.css', 'assets/update.js',
  'assets/worlds.css', 'assets/night.css',
  'under_quiet_stars/index.html', 'under_quiet_stars/style.css', 'under_quiet_stars/flowers.js',
  'under_quiet_stars/cats.html', 'under_quiet_stars/cat_style.css', 'under_quiet_stars/images/cat2.png',
  'nights_embrace/index.html',
  'northern_lights/index.html', 'northern_lights/style.css', 'northern_lights/aurora.js',
  'images/apple-touch-icon.png', 'images/flowers-icon.ico'
].map(asset => new URL(asset, BASE).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const old = names.filter(name => name.startsWith(PREFIX) && name !== CACHE);
    await Promise.all(old.map(name => caches.delete(name)));
    await self.clients.claim();
    // An installed app may still display HTML from its previous offline cache.
    if (old.length) {
      const pages = await self.clients.matchAll({ type: 'window' });
      await Promise.all(pages.filter(page => page.url.startsWith(BASE)).map(page => page.navigate(page.url).catch(() => {})));
    }
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== new URL(BASE).origin || !url.href.startsWith(BASE)) return;
  const canonical = new URL(url.href);
  canonical.search = '';
  canonical.hash = '';
  if (canonical.pathname.endsWith('/')) canonical.pathname += 'index.html';
  if (!ASSETS.includes(canonical.href)) {
    if (request.mode === 'navigate') event.respondWith(fetch(request).catch(() => new Response('Diese Seite ist offline nicht verfügbar.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
    return;
  }
  // Serve the complete shell stored by this active version.
  event.respondWith((async () => {
    let cache;
    try {
      cache = await caches.open(CACHE);
      const stored = await cache.match(canonical.href);
      if (stored) return stored;
    } catch { /* Storage failure must not prevent a live network response. */ }
    try {
      const response = await fetch(request);
      if (response.ok && cache) event.waitUntil(cache.put(canonical.href, response.clone()).catch(() => {}));
      return response;
    } catch {
      return new Response('Diese Seite ist offline nicht verfügbar.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
