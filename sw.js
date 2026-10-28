// Service worker : l'app reste utilisable sans réseau (fiches, cartes, exercices ; le tuteur IA demande Internet).
// Stratégie : on sert la copie en cache tout de suite et on la met à jour en arrière-plan.
// Le nom du cache inclut le chemin de l'app pour ne pas se mélanger avec les apps de langues (même adresse).
const VERSION = 'v20261028-1922';
const CACHE = 'applangues' + self.location.pathname.replace(/sw\.js$/, '') + VERSION;
const SHELL = [
  './', './index.html', './css/style.css', './css/theme.css', './css/vivid.css', './manifest.webmanifest',
  './fonts/jost-latin.woff2', './fonts/jost-latin-italic.woff2',
  './icons/favicon.svg', './icons/favicon-32.png', './icons/icon-192.png',
  './js/vendor/katex/katex.min.css', './js/vendor/katex/katex.min.js', './js/vendor/katex/auto-render.min.js',
  './js/lang.js', './js/data/course.js', './js/data/slt.js', './js/data/al.js', './js/data/bandits.js', './js/data/rl.js', './js/data/ts.js',
  './js/data/projet-al.js', './js/data/projet-bandits.js', './js/data/projet-tfe.js', './js/data/projet-ateliers.js', './js/data/tp.js', './js/data/code.js', './js/data/glossary.js',
  './js/store.js', './js/sync.js', './js/speech.js', './js/ai.js', './js/app.js',
];
const PREFIX = 'applangues' + self.location.pathname.replace(/sw\.js$/, '');

self.addEventListener('install', e => {
  // cache: 'reload' : on va chercher les fichiers neufs sur le serveur, pas les copies que le navigateur garde quelques minutes
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Seuls les fichiers de l'app sont mis en cache (polices KaTeX comprises, au premier usage) ; IA, GitHub et /api passent par le réseau.
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => cached);
    return cached || network;
  }));
});
