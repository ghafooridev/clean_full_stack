# Service worker, explained simply

The service worker is a small script the browser keeps running next to the page. After it has saved the page files, the app can still open when the network is off.

| File | Role |
| --- | --- |
| `react_todo/public/sw.js` | The worker you edit. |
| `react_todo/src/main.tsx` | Registers `/sw.js` after the page loads. |
| `react_todo/dist/sw.js` | The copy the preview server actually sends. `npm run build` creates it. |

`npm run preview` serves `dist/` (usually `http://localhost:4173`).
Use that URL to test offline. `npm run dev` (`http://localhost:5173`) is a different server. The worker is not meant for that.

You still need **one reload while online** after changing `sw.js`, so the browser can install the new file.

## How the page turns it on

```js
navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
```

`updateViaCache: 'none'` tells the browser to download `sw.js` again instead of trusting an old copy.

The browser then runs three steps:

1. **install** — download the files we want to keep and save them.
2. **activate** — delete old caches and start controlling the page.
3. **fetch** — every later request can be answered from the cache when the network fails.

`skipWaiting()` makes the new worker take over immediately.
`clients.claim()` makes it control the tab that is already open.

## Why the first visit is special

This is the most important idea in this file.

A service worker **does not control the page that registered it** until it has installed (and, here, claimed the tab). Timeline of the first visit:

1. The browser asks for `/todo` or `/todo/list`.
2. It downloads `index.html`, then the JS and CSS linked in that HTML, then `GET http://localhost:4000/todos`.
3. React starts. `main.tsx` registers `/sw.js`.
4. Only now does **install** run.

So the first HTML, JS, CSS, image, and todo-list requests happen **before** the `fetch` event can see them. The `fetch` handler cannot be the only way those files get cached. Install must download them itself. That is why `precache` exists, why we read `index.html`, and why `/todos` is listed in `PRECACHED_API`.

After install + `skipWaiting` + `clients.claim`, later requests (and the next reload) go through `fetch`.

## The settings at the top of `sw.js`

```js
const STATIC_CACHE = "react-todo-static-v3";
const API_CACHE = "react-todo-api-v3";
const API_ORIGIN = "http://localhost:4000";
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg"];
const PRECACHED_API = ["/todos"];
const MATCH = { ignoreVary: true, ignoreSearch: true };
```

| Name | What it means |
| --- | --- |
| `STATIC_CACHE` | Box for the page: HTML, JS, CSS, images, icons. |
| `API_CACHE` | Box for API JSON, such as the todo list. |
| `API_ORIGIN` | Only requests to this host are treated as API calls. |
| `APP_SHELL_FILES` | Files saved first. Their names never change. |
| `PRECACHED_API` | API paths saved during install, even if the page has not asked yet. |
| `MATCH.ignoreVary` | Still use a saved file when the `Origin` header is different. |
| `MATCH.ignoreSearch` | `?something=1` on the URL does not stop a cache hit. |

The `v3` part is only a label. When you bump it to `v4`, activate deletes the old boxes.

They are two boxes so a new page build does not wipe the saved todo list, and a new API cache does not wipe the page files.

`APP_SHELL_FILES` does **not** list JS or CSS. Those names change on every Vite build. See the next section.

## Why we read `index.html` during install

This is the block in `install`:

```js
const index = await pages.match("/index.html", MATCH);
if (index) {
  const assets = [...(await index.text()).matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(
    (match) => match[1],
  );
  await precache(pages, assets);
}
```

**Do not delete this.** Without it, offline mode loads HTML and then a blank, unstyled page.

After `npm run build`, `dist/index.html` looks like:

```html
<script type="module" crossorigin src="/assets/index-CgR7scPo.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-kyH9Vy4I.css">
```

Vite adds a hash (`CgR7scPo`, `kyH9Vy4I`) so a new build gets a new filename. You cannot put `/src/style.css` or `/assets/index-CgR7scPo.js` in `APP_SHELL_FILES`:

- `/style.css` is not a URL the built page loads. `src/style.css` is compiled into `/assets/index-….css`.
- `/assets/index-CgR7scPo.js` will be wrong after the next build.

So install:

1. Saves `APP_SHELL_FILES` (stable names).
2. Reads the saved `index.html`.
3. Collects every `src="..."` and `href="..."` that starts with `/`.
4. Precaches those hashed files (JS, CSS, and any image linked from the HTML).

The regex `/(?:src|href)="(\/[^"]+)"/g` means: find `src="` or `href="`, then capture a path that starts with `/`.

What this does **not** catch:

- Images imported in React (`src/assets/images.jpeg`) if they are only referenced from JS, not from `index.html`. Those are requested when the page runs. The `fetch` handler saves them the first time they load **while the worker is in control**. After the first controlled visit, they work offline.
- `/todos` JSON. That is a different origin (`localhost:4000`), so it is handled by `PRECACHED_API`.

## Why `save` rewrites headers

Vite preview and Express send `Vary: Origin`.
The built JS and CSS tags include `crossorigin`, so the browser sends an `Origin` header.

If we stored the raw response:

- `cache.match` can miss because of `Vary: Origin`.
- The browser can refuse the saved JS/CSS (no `Access-Control-Allow-Origin`), and the offline page stays blank or unstyled.

`save` only stores OK responses, strips `Vary`, and sets `Access-Control-Allow-Origin` to this site. `MATCH` also uses `ignoreVary` and `ignoreSearch` as a second safety net.

## Functions in `sw.js`

Five helpers, then three browser events. Cache reads use `cache.match(..., MATCH)` directly.

### `save(cache, key, response)`

Puts one successful response into a cache.

- `cache` — an open Cache box.
- `key` — URL string (such as `/index.html`) or a `Request`.
- `response` — the network result.

Steps:

1. If `response.ok` is false (not status 200–299), store nothing.
2. Copy headers, delete `Vary`, set `Access-Control-Allow-Origin`.
3. Store a new `Response` whose body is `response.blob()`.

Used by `precache`, `networkFirst`, and `cacheFirst`.

### `precache(cache, urls)`

Downloads a list of URLs and saves each one.

- `cache` — an open Cache box.
- `urls` — URL strings.

For each URL: `fetch(url)`, then `save`. If one file fails, it logs `sw precache skipped` and continues. One missing icon does not stop install.

Used three times in `install`: app shell, hashed assets from HTML, API list.

There is no extra `?sw-precache=` query. Vite preview already sends `Cache-Control: no-cache`.

### `networkFirst(cacheName, request, storeKey = request)`

Try the internet first. If that fails, use the cache.

- `cacheName` — `STATIC_CACHE` or `API_CACHE`.
- `request` — what to send to the network.
- `storeKey` — where to save and look up. Defaults to `request`. Navigation passes `"/index.html"` so `/todo` and `/todo/list` share one saved page.

Steps:

1. Open the cache and `match` `storeKey` with `MATCH`.
2. `fetch(request)`.
3. On success, `save` a clone under `storeKey` and return the live response.
4. On failure (offline), return the saved copy, or `Response.error()` if nothing was saved.

Used for API requests and by `navigate`. `Response.error()` is a failed response (`ok` is false). It does not throw, so the console does not show an uncaught `Failed to fetch` from the worker.

### `cacheFirst(request)`

Use the cache immediately. If nothing is saved, try the network and then save.

- `request` — JS, CSS, image, or icon.

Steps:

1. Open `STATIC_CACHE` and `match` the request.
2. If found, return it.
3. Otherwise `fetch`, `save` a clone, and return the live response.
4. If fetch fails too, return `Response.error()`.

Used for same-origin files that are not page navigations.

### `navigate(request)`

Open any app URL (`/todo`, `/todo/list`, …) from one saved HTML file.

1. `networkFirst(STATIC_CACHE, request, "/index.html")`.
2. If that response is OK, return it.
3. Otherwise try `/` in the static cache.
4. If that is also missing, return the failed page from step 1.

`/todo` is not a real file. Vite always returns `index.html`. One saved copy is enough. React Router then shows Home or the list.

### `install` event

Runs once when a new `sw.js` is downloaded.

`event.waitUntil(...)` tells the browser to wait until saving is finished.

```js
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
```

| Step | Why |
| --- | --- |
| `precache(APP_SHELL_FILES)` | Stable files: `/`, `/index.html`, icons. |
| Read `index.html` and precache `src` / `href` | Hashed JS and CSS. Cannot be listed by hand. First visit does not go through `fetch`. |
| `precache` `/todos` | Same first-visit problem, other origin. |
| `skipWaiting()` | Activate now, do not wait for old tabs to close. |

If you skip the HTML-parsing step, Cache Storage will have `index.html` but not `index-….js` / `index-….css`. Offline you get a white page.

If you skip `PRECACHED_API`, the page shell can load and then show **error...** because `/todos` was never stored.

### `activate` event

Runs after install, when this worker becomes the one in charge.

1. `caches.keys()` lists every cache name.
2. Deletes every name that is not `STATIC_CACHE` or `API_CACHE` (old `v1` / `v2`, leftover boxes).
3. `self.clients.claim()` takes over the current tab.

### `fetch` event

Runs on every request from a page this worker controls. Only `GET` is handled. `POST`, `PUT`, and `DELETE` go to the network, so creating or editing a todo still needs the API.

The handler only chooses which helper to call:

```js
if (url.origin === API_ORIGIN) {
  event.respondWith(networkFirst(API_CACHE, request));
} else if (url.origin === self.location.origin) {
  event.respondWith(
    request.mode === "navigate" ? navigate(request) : cacheFirst(request),
  );
}
```

| Condition | Helper | Offline |
| --- | --- | --- |
| `url.origin === API_ORIGIN` | `networkFirst` | Saved JSON, if install or an earlier visit stored it. |
| Other websites | (do nothing) | Browser default. |
| `request.mode === "navigate"` | `navigate` | React starts from the saved HTML. |
| Same-origin JS, CSS, images, icons | `cacheFirst` | Saved file. If it was never saved, the request fails. |

**Why cache-first for JS/CSS:** a new build gets a new hashed name. The old file in the cache is unused, not stale content under the same URL.

**Why network-first for the API:** the todo list can change. Prefer a fresh list when online; use yesterday's list when offline.

## What you should not remove

| Code | If you remove it |
| --- | --- |
| Reading `index.html` for `src` / `href` | Offline page is blank / has no CSS. |
| `PRECACHED_API` / `/todos` | List page shows **error...** after the first visit goes offline. |
| `save` rewriting CORS / `Vary` | JS or CSS may not run from cache. |
| `MATCH` (`ignoreVary`) | Cache lookups miss. |
| `skipWaiting` + `clients.claim` | The tab keeps the old worker until you close it. |
| Navigation → `/index.html` | `/todo/list` has nothing to fall back to. |

## How to see it in the browser

1. Open `http://localhost:4173/todo` (preview, after `npm run build`).
2. DevTools → **Application** → **Service Workers**. `/sw.js` should be activated.
3. **Cache Storage** should show `react-todo-static-v3` and `react-todo-api-v3`.
4. Static cache should include `index.html`, the hashed `.js`, and the hashed `.css` (same names as in `dist/index.html`).
5. API cache should include `http://localhost:4000/todos`.
6. Reload once **online** after any worker change, then go offline and reload.

If an old worker will not go away: Application → Service Workers → **Unregister**, then reload online once.

## How to update the worker

```bash
cd react_todo
npm run build
npm run preview
```

Preview serves `dist/`. Edits in `public/sw.js` are invisible until you build (or copy the file into `dist/`).

Then reload once while online.

When old CSS/JS is stuck, bump both names:

```js
const STATIC_CACHE = "react-todo-static-v4";
const API_CACHE = "react-todo-api-v4";
```

Activate deletes every cache that is not these two names.

## How to cache something new

**Another API path, for example `/health`:**

```js
const PRECACHED_API = ["/todos", "/health"];
```

Any other `GET` to `http://localhost:4000` is also saved the first time the page calls it **while the worker is in control**.

**A new file in `public/`** (name does not change):

```js
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg", "/logo.svg"];
```

**A CSS or image imported from React** (`src/style.css`, `src/assets/images.jpeg`):

Do not put the source path in the worker. After `npm run build`, look at `dist/index.html`. Links there are picked up by the HTML-parsing step. Files only mentioned inside the JS bundle are saved the first time the page requests them with the worker in control. Reload once online after adding them.

**A different API host:**

```js
const API_ORIGIN = "http://localhost:4000";
```

Requests to other websites are ignored.

## Checklist when offline looks empty

- Preview URL (`4173`), not Vite dev (`5173`).
- Reloaded **once online** after the last `sw.js` edit.
- Cache names are `v3`, not `v1` / `v2`.
- Static cache has the **hashed** `.js` and `.css` from `dist/index.html`, not `/style.css`.
- API was running at least once while online, so `/todos` could be saved.
- Image imported from JS: visit the page once online **after** the worker is active, then go offline.
