const CACHE_NAME = "naadix-lab-v2";
const LAB_SCOPE = new URL(self.registration.scope);
const LAB_HOME = new URL("home-lab.html", LAB_SCOPE).pathname;
const OFFLINE_URLS = [
  LAB_HOME,
  "/css/lab/lab-theme.css",
  "/css/lab/home-lab.css",
  "/javascript/lab/auth.js",
  "/javascript/lab/lab-common.js",
  "/javascript/lab/home-lab.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => caches.match(LAB_HOME));
    })
  );
});
