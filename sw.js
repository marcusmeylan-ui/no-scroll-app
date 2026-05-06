const CACHE_NAME = "noscroll-v16";

const APP_SHELL_FILES = [
  "/",
  "/index.html",
  "/app.js",
  "/style.css",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_FILES);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Always try network first for movie data
  if (url.pathname === "/movies.json") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  const isAppShell =
    APP_SHELL_FILES.includes(url.pathname) ||
    url.pathname === "/" ||
    url.origin !== self.location.origin;

  if (isAppShell) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache valid responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});