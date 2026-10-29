/* FRAGMENTS — service worker : cache d'abord, tout hors ligne (y compris les scénarios). */
const CACHE = 'fragments-v2.13';
const ASSETS = [
  './', 'index.html', 'privacy.html', 'manifest.webmanifest', 'css/app.css', 'css/ecrans.css', 'css/documents.css', 'css/fouille.css', 'css/extras.css',
  'js/defi.js', 'js/engine.js', 'js/qr.js', 'js/docs.js', 'js/audio.js', 'js/i18n.js', 'js/autres-jeux.js', 'js/howto.js', 'js/share-image.js',
  'js/app-etat.js', 'js/app-joueur.js', 'js/app-mj.js', 'js/app-accueil.js', 'js/app.js',
  'i18n/strings.json', 'i18n/scenarios/en/index.json', 'i18n/scenarios/en/bunker.json', 'i18n/scenarios/en/train.json', 'i18n/scenarios/en/manoir.json',
  'data/index.json', 'data/bunker.json', 'data/train.json', 'data/manoir.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'fonts/big-shoulders-stencil-display-latin-700-normal.woff2', 'fonts/big-shoulders-stencil-display-latin-900-normal.woff2',
  'fonts/big-shoulders-text-latin-400-normal.woff2', 'fonts/big-shoulders-text-latin-600-normal.woff2', 'fonts/big-shoulders-text-latin-800-normal.woff2',
  'fonts/courier-prime-latin-400-normal.woff2', 'fonts/courier-prime-latin-700-normal.woff2', 'fonts/courier-prime-latin-400-italic.woff2',
  'fonts/caveat-latin-500-normal.woff2', 'fonts/caveat-latin-700-normal.woff2'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('fragments-') === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
