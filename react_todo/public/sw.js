const STATIC_CACHE = "react-todo-static-v3";
const API_CACHE = "react-todo-api-v3";
const API_ORIGIN = "http://localhost:4000";
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg"];
const PRECACHED_API = ["/todos"];

const matchOptions = { ignoreVary: true, ignoreSearch: true };

function corsCopy(response) {
  const headers = new Headers(response.headers);
  headers.delete("Vary");
  headers.set("Access-Control-Allow-Origin", self.location.origin);
  return response.blob().then(
    (body) =>
      new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      }),
  );
}

async function put(cache, key, response) {
  if (!response.ok) return;
  await cache.put(key, await corsCopy(response));
}

async function match(cache, request) {
  return (
    (await cache.match(request, matchOptions)) ||
    (await cache.match(typeof request === "string" ? request : request.url, matchOptions))
  );
}

async function fetchFresh(url) {
  const busted = new URL(url, self.location.origin);
  busted.searchParams.set("sw-precache", String(Date.now()));
  return fetch(busted.href);
}

async function precacheAppShell() {
  const cache = await caches.open(STATIC_CACHE);
  for (const url of APP_SHELL_FILES) {
    try {
      await put(cache, url, await fetchFresh(url));
    } catch (error) {
      console.warn("sw precache skipped", url, error);
    }
  }

  const index = await match(cache, "/index.html");
  if (!index) return;

  const html = await index.text();
  const assetUrls = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(
    (matchResult) => matchResult[1],
  );
  for (const url of assetUrls) {
    try {
      await put(cache, url, await fetchFresh(url));
    } catch (error) {
      console.warn("sw precache skipped", url, error);
    }
  }
}

async function precacheApi() {
  const cache = await caches.open(API_CACHE);
  for (const path of PRECACHED_API) {
    const url = API_ORIGIN + path;
    try {
      const response = await fetchFresh(url);
      await put(cache, url, response);
    } catch (error) {
      console.warn("sw api precache skipped", url, error);
    }
  }
}


async function networkFirst(cacheName, request, storeKey) {
  const cache = await caches.open(cacheName);
  const cached = await match(cache, storeKey || request);
  try {
    const response = await fetch(request);
    await put(cache, storeKey || request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([precacheAppShell(), precacheApi()]).then(() => self.skipWaiting()),
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



self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin === API_ORIGIN) {
    event.respondWith(networkFirst(API_CACHE, request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(STATIC_CACHE, request, "/index.html").catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (await match(cache, "/")) || Response.error();
      }),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await match(cache, request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        await put(cache, request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});
