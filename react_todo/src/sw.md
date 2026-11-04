# Service worker, explained simply

The service worker is a small script the browser keeps running next to the page. After it has saved the page files, the app can still open when the network is off.

The script you edit is `react_todo/public/sw.js`.
The page turns it on in `react_todo/src/main.tsx`.

`npm run build` copies `public/sw.js` into `dist/sw.js`.
`npm run preview` serves that `dist` folder (usually `http://localhost:4173`).
The worker does not run on `npm run dev` the same way, because the dev server is not the built app.

## How it starts

In `main.tsx` the page waits until it has loaded, then calls:

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

You still need **one reload while online** after changing `sw.js`, so the browser can install the new file.

## The settings at the top of `sw.js`

```js
const STATIC_CACHE = "react-todo-static-v3";
const API_CACHE = "react-todo-api-v3";
const API_ORIGIN = "http://localhost:4000";
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg"];
const PRECACHED_API = ["/todos"];
const matchOptions = { ignoreVary: true, ignoreSearch: true };
```

| Name | What it means |
| --- | --- |
| `STATIC_CACHE` | Name of the box that stores the page: HTML, JS, CSS, images, icons. |
| `API_CACHE` | Name of the box that stores API answers, such as the todo list. |
| `API_ORIGIN` | The API address. Only requests to this host are treated as API calls. |
| `APP_SHELL_FILES` | Files saved first, before we read `index.html`. |
| `PRECACHED_API` | API paths saved during install, even if the page has not asked for them yet. |
| `ignoreVary` | Still use a saved file when the `Origin` header is different. Vite and Express send `Vary: Origin`. |
| `ignoreSearch` | `?something=1` on the URL does not stop a cache hit. |

The `v3` part is just a version label. It is not a special browser feature.

## Two caches

- **Static cache** holds the app shell: the page, the JavaScript bundle, the CSS file, images, and icons.
- **API cache** holds JSON from `http://localhost:4000`, starting with `/todos`.

They are separate so a new page build does not wipe the saved todo list, and a new API cache does not wipe the page files. On activate, any cache whose name is not in the `keep` list is deleted.

## What gets saved on install

`precacheAppShell` does this:

1. Download `/`, `/index.html`, `/favicon.svg`, and `/icons.svg`.
2. Read the HTML.
3. Find every `src="..."` and `href="..."` that starts with `/`.
4. Download those files too.

That is how the real built files get cached, for example:

- `/assets/index-CgR7scPo.js`
- `/assets/index-kyH9Vy4I.css`
- `/assets/images-DbpGPTUr.jpeg` only if the HTML links it directly

CSS and images that Vite puts **inside** the JavaScript are requested when the page runs. The `fetch` handler saves them the first time they load online. They are not named `/style.css`. `src/style.css` becomes a hashed file under `/assets/`.

`precacheApi` downloads each path in `PRECACHED_API` and stores the JSON. This matters because the first visit asks for `/todos` **before** the worker is in control, so that first request would otherwise never be saved.

`fetchFresh` adds `?sw-precache=<time>` so install does not reuse an old cached `index.html` that is missing the new CSS or JS link. The saved key is still the clean URL, without that query.

## Why copies of responses are stored

`corsCopy` saves a copy that:

- removes the `Vary` header
- sets `Access-Control-Allow-Origin` to this site

The built page loads JS and CSS with `crossorigin`. If the saved file does not allow this origin, the browser refuses to use it and the offline page stays blank or unstyled.

Only successful responses (`response.ok`) are stored.

## What happens on each request

Only `GET` requests are handled.

| Request | Strategy | Offline behavior |
| --- | --- | --- |
| `http://localhost:4000/...` | Network first | Use the saved JSON if the network fails. |
| Opening a page (`/todo`, `/todo/list`, …) | Network first, stored as `/index.html` | Serve the saved `index.html` so the React app can start. |
| JS, CSS, images, icons | Cache first | Use the saved file. If it was never saved, try the network and then save it. |

Network first means: try the internet, and if that works, replace the saved copy. If the internet fails, use what was saved before.

Cache first means: use the saved file immediately. This is right for files whose names change when the content changes (`index-AbCd123.js`).

`POST`, `PUT`, and `DELETE` are not cached. Creating or editing a todo still needs the API.

## How to see it in the browser

1. Open the preview site, usually `http://localhost:4173/todo`.
2. DevTools → **Application** → **Service Workers**. You should see `/sw.js` activated.
3. **Cache Storage** should show `react-todo-static-v3` and `react-todo-api-v3`.
4. Open the static cache. You should see `index.html`, the `.js` file, and the `.css` file.
5. Open the API cache. You should see `http://localhost:4000/todos`.
6. Reload once **online** after any worker change, then switch on offline and reload.

If an old worker will not go away: Application → Service Workers → **Unregister**, then reload online once.

## How to update the worker

Change `public/sw.js`, then:

```bash
cd react_todo
npm run build
npm run preview
```

`build` copies the new `sw.js` into `dist`. Preview will not see edits that exist only in `public/` until you build again.

Then reload the site once while online.

When the saved files themselves must be thrown away (you changed what is cached, or old CSS/JS is stuck), bump both names:

```js
const STATIC_CACHE = "react-todo-static-v4";
const API_CACHE = "react-todo-api-v4";
```

Activate deletes every cache that is not these two names.

## How to cache something new

**Another API list, for example `/health`:**

```js
const PRECACHED_API = ["/todos", "/health"];
```

Any other `GET` to `http://localhost:4000` is also saved the first time the page calls it while online, because the fetch handler uses network-first for that host.

**A new icon or file in `public/`:**

Add its URL to `APP_SHELL_FILES`:

```js
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg", "/logo.svg"];
```

**A CSS or image imported from React (`src/style.css`, `src/assets/images.jpeg`):**

Do not put the source path in the worker. Vite renames those files during build. After `npm run build`, look at `dist/index.html`. Every `src` and `href` there is picked up automatically on the next install. Files that are only mentioned inside the JS bundle are saved the first time the page requests them online.

**A different API host or port:**

```js
const API_ORIGIN = "http://localhost:4000";
```

Change this if the API moves. Requests to other websites are ignored and go to the network as usual.

## A short checklist when offline looks empty

- You opened the **preview** URL (`4173`), not the Vite dev URL (`5173`).
- You reloaded **once online** after the last edit to `sw.js`.
- Cache Storage shows the `v3` names, not an older `v1` or `v2`.
- The static cache contains the `.css` and `.js` names from `dist/index.html`.
- The API was running at least once while online, so `/todos` could be saved.
