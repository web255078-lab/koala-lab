// オフライン対応：最初に全部をしまっておく。つながっていれば最新を取りに行き、だめならしまったものを出す。
// ファイルを増やしたら PRECACHE に足し、VERSION を上げる。
const VERSION = 'koalalab-v1';
const PRECACHE = [
  './', './index.html', './chapters/ch01.html', './chapters/ch02.html',
  './css/style.css', './manifest.webmanifest', './icons/icon.svg',
  './js/index.js', './js/ch01.js', './js/ch02.js',
  './js/core/chapters.js', './js/core/klesson.js', './js/core/store.js', './js/core/synth.js',
  './js/core/fx.js', './js/core/notes.js', './js/core/kit.js', './js/core/wav.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req, { ignoreSearch: true })) || Response.error();
    }
  }));
});
