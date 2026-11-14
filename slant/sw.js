/* Offline worker for Slant. Written by tools/home-screen.py from runtime.json; do not edit.
   It precaches the runtime files below and answers them cache-first. VERSION is a hash of
   those files, so a release that changes any of them installs a new cache and drops the old. */
'use strict';
const VERSION = '533b426bcdc4';
const FILES = [
  "engine.js",
  "favicon.svg",
  "fonts/IBMPlexMono-500.woff2",
  "fonts/IBMPlexSans-400.woff2",
  "fonts/OFL.txt",
  "index.html",
  "levels.js",
  "og.png",
  "privacy.html",
  "paint-input.js",
  "regions.js",
  "score-clock.js",
  "scores.js",
  "slant.css",
  "slant.js",
  "controls.css",
  "controls.js",
  "access.js",
  "bridge-client.js",
  "manifest.webmanifest",
  "pwa.js",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png"
];
const PREFIX = 'home-screen ' + self.registration.scope + ' ';
const CACHE = PREFIX + VERSION;
const BASE = new URL(self.registration.scope).pathname;

async function store(cache, name) {
  const response = await fetch(new Request(name, { cache: 'reload' }));
  if (!response.ok) throw new Error(name + ' ' + response.status);
  // A redirected response cannot answer a navigation, so keep a clean copy.
  const body = response.redirected ? new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers: response.headers }) : response;
  await cache.put(name, body);
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(FILES.map(name => store(cache, name)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  let name;
  try { name = decodeURIComponent(url.pathname.slice(BASE.length)); } catch (e) { return; }
  if (name === '' || name.endsWith('/')) name += 'index.html';
  if (!FILES.includes(name)) return;
  // Version stamps (?v=) are ignored here: the page and its files come from one cache.
  event.respondWith(caches.open(CACHE).then(cache => cache.match(name)).then(hit => hit || fetch(request)));
});
