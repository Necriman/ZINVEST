/* Zinvest PWA — cache shell + static chunks; navigations network-first with offline fallback */
const CACHE_VERSION = "zinvest-pwa-v2";
const PRECACHE_URLS = ["/", "/offline.html", "/icon-192.png", "/icon-512.png", "/zinvest-mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})));
      self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match("/offline.html")),
        ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(js|css|woff2?|png|svg|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request)
            .then((res) => {
              if (res.ok) caches.open(CACHE_VERSION).then((c) => c.put(request, res.clone()));
            })
            .catch(() => {});
          return cached;
        }
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        });
      }),
    );
  }
});
