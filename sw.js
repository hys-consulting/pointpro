// HYS PointPro — Service Worker (mode hors-ligne)
// Fichier réel (au lieu d'un blob: URL, non supporté par les navigateurs pour les SW).
// Pense à changer CACHE_VERSION à chaque déploiement important pour forcer le renouvellement du cache.
const CACHE_VERSION = 'hys-pointpro-v2.4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    // cache: 'no-store' pour ignorer le cache HTTP du navigateur (pas seulement
    // le cache du Service Worker) — sinon une page rechargée peu après un
    // déploiement peut recevoir une réponse HTTP mise en cache par le navigateur
    // lui-même (selon les en-têtes cache-control envoyés par l'hébergeur), même
    // si ce fetch() réseau s'exécute correctement. On veut toujours la dernière
    // version en ligne quand la connexion est disponible ; le repli vers le
    // cache du Service Worker (ci-dessous) ne sert qu'en mode hors-ligne.
    fetch(e.request, { cache: 'no-store' })
      .then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
