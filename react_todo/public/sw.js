const STATIC_CACHE = "react-todo-static-v3";
const API_CACHE = "react-todo-api-v3";
const API_ORIGIN = "http://localhost:4000";
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg"];
const PRECACHED_API = ["/todos"];
const MATCH = { ignoreVary: true, ignoreSearch: true };

async function save(cache, key, response) {
  if (!response.ok) return;
  const headers = new Headers(response.headers);
  headers.delete("Vary");
  headers.set("Access-Control-Allow-Origin", self.location.origin);
  await cache.put(
    key,
    new Response(await response.blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  );
}

async function precache(cache, urls) {
  for (const url of urls) {
    try {
      await save(cache, url, await fetch(url));
    } catch (error) {
      console.warn("sw precache skipped", url, error);
    }
  }
}

async function networkFirst(cacheName, request, storeKey = request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(storeKey, MATCH);
  try {
    const response = await fetch(request);
    await save(cache, storeKey, response.clone());
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, MATCH);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await save(cache, request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function navigate(request) {
  const page = await networkFirst(STATIC_CACHE, request, "/index.html");
  if (page.ok) return page;
  const cache = await caches.open(STATIC_CACHE);
  return (await cache.match("/", MATCH)) || page;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(STATIC_CACHE);
      await precache(pages, APP_SHELL_FILES);

      const index = await pages.match("/index.html", MATCH);
      if (index) {
        const assets = [...(await index.text()).matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(
          (match) => match[1],
        );
        await precache(pages, assets);
      }

      await precache(
        await caches.open(API_CACHE),
        PRECACHED_API.map((path) => API_ORIGIN + path),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin === API_ORIGIN) {
    event.respondWith(networkFirst(API_CACHE, request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(
      request.mode === "navigate" ? navigate(request) : cacheFirst(request),
    );
  }
});
