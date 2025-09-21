const CACHE_NAME = 'hill-rd-setlist-manager-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/performance/performance.html',
    '/performance/performance.js',
    '/performance/performance.css',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/images/mylogo.png',
    'lib/mammoth.browser.min.js',
    'lib/idb.min.js',
    'lib/tesseract/tesseract.min.js',
    'lib/tesseract/worker.min.js',
    'lib/tesseract/tesseract-core.wasm',
    'lib/tesseract/tesseract-core-simd.wasm.js',
    'lib/tesseract/tesseract-core-simd.wasm',
    // Do NOT precache traineddata to avoid decompression/caching pitfalls
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            }).catch(err => { console.warn('Cache addAll failed', err); })
    );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

// Cache-first strategy with network fallback.
// For navigation (HTML) requests, ignore query string so cached pages work with ?params.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // only cache GET

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
      const urlObj = new URL(req.url);
      const isTrainedData = urlObj.pathname.endsWith('/lib/tesseract/eng.traineddata') || urlObj.pathname.endsWith('/lib/tesseract/eng.traineddata.gz');

      // Prefer cached HTML ignoring search so /performance/performance.html?x matches
      const cached = isTrainedData ? undefined : await caches.match(req, isHTML ? { ignoreSearch: true } : undefined);
      if (cached) return cached;

      let res;
      if (isHTML) {
        // SPA routing: for navigations to non-performance paths, serve /index.html
        if (!urlObj.pathname.startsWith('/performance/')) {
          const indexKey = new Request('/index.html');
          const cachedIndex = await caches.match(indexKey);
          if (cachedIndex) return cachedIndex;
          res = await fetch('/index.html', { redirect: 'follow' });
          if (res && res.status === 200) cache.put(indexKey, res.clone());
        } else {
          // For performance navigations, always serve the base document without query
          const perfKey = new Request('/performance/performance.html');
          const cachedPerf = await caches.match(perfKey);
          if (cachedPerf) return cachedPerf;
          res = await fetch('/performance/performance.html', { redirect: 'follow' });
          if (res && res.status === 200) cache.put(perfKey, res.clone());
        }
      } else {
        if (isTrainedData) {
          // Always fetch traineddata fresh; do not cache or transform
          res = await fetch(req.url, { redirect: 'follow', cache: 'no-store' });
        } else {
        res = await fetch(req);
        }
      }

      // Cache same-origin successful responses
      if (!isTrainedData && res && res.status === 200 && req.url.startsWith(self.location.origin)) {
        const key = isHTML ? new Request(new URL(req.url).pathname) : req;
        cache.put(key, res.clone());
      }
      return res;
    } catch (err) {
      // Offline fallback for navigations
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
      throw err;
    }
  })());
});
