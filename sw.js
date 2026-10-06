'use strict';
importScripts('./pwa-assets.js');
const BASE = new URL('./', self.location.href);
const PREFIX = 'family-hub-pwa-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE = PREFIX + self.PWA_VERSION;
const ALLOWED = new Set(self.PWA_ASSETS.map(path => new URL(path, BASE).href));
self.addEventListener('install', event => {
  // Atomic shell install: any missing required resource keeps the old worker active.
  event.waitUntil(caches.open(CACHE).then(async cache => {
    try {
      await cache.addAll(self.PWA_ASSETS.map(path => new Request(new URL(path, BASE), {cache: 'reload'})));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  }));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      (key.startsWith(PREFIX) || /^family-hub-v10-/.test(key)) && key !== CACHE
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const canonical = new URL(url.pathname, BASE.origin);
  if (canonical.href === BASE.href) canonical.pathname += 'index.html';
  if (!ALLOWED.has(canonical.href)) return;
  // Query-versioned static files resolve to their exact shell entry. Unknown routes
  // are never served the family homepage as a fallback.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate' || canonical.pathname.endsWith('.webmanifest')) {
      try { return await fetch(request, {cache: 'no-cache'}); }
      catch {
        return (await cache.match(canonical.href)) || Response.error();
      }
    }
    // Serve a coherent version of JS/CSS with the active worker; only a complete
    // newly installed shell replaces it. Never runtime-cache API/user/media data.
    return (await cache.match(canonical.href)) || fetch(request);
  })());
});
