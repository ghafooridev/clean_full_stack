const STATIC_CACHE = "react-todo-static-v1";
const API_CACHE = "react-todo-api-v1";
const API_ORIGIN = "http://localhost:4000";
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg"];
const PRECACHED_API = ["/todos"];

// Vite preview and Express both send `Vary: Origin`, so cached entries must ignore it to match.
const matchOptions = { ignoreVary: true };

async function precacheAppShell() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.allSettled(APP_SHELL_FILES.map((url) => cache.add(url)));

  const index = await cache.match("/index.html", matchOptions);
  if (!index) return;

  const html = await index.text();
  const assetUrls = [...html.matchAll(/\s(?:src|href)="(\/[^"]+)"/g)].map(
    (match) => match[1],
  );
  await Promise.allSettled(assetUrls.map((url) => cache.add(url)));
}

// The first page load fires its API calls before this worker controls the page,
// so those responses are never seen by the fetch handler.
async function precacheApi() {
  const cache = await caches.open(API_CACHE);
  await Promise.allSettled(
    PRECACHED_API.map(async (path) => {
      const url = API_ORIGIN + path;
      const response = await fetch(url);
      if (response.ok) await cache.put(url, response);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([precacheAppShell(), precacheApi()]).then(() =>
      self.skipWaiting(),
    ),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, API_CACHE];
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  const key = request.url;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(key, response.clone());
    return response;
  } catch {
    return (await cache.match(key, matchOptions)) || Response.error();
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put("/index.html", response.clone());
    return response;
  } catch {
    return (await cache.match("/index.html", matchOptions)) || Response.error();
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, matchOptions);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin === API_ORIGIN) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstStatic(request));
});
