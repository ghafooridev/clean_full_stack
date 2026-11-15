# راهنمای فارسی Service Worker در پروژه React Todo

این جزوه کد Service Worker فعلی پروژه را توضیح می‌دهد: معماری دو Cache، ذخیره‌سازی فایل‌های Vite، Cache کردن API، چرخه‌ی عمر Worker، مسیریابی SPA و رفتار آفلاین.

## ۱. تصویر کلی

در این پیاده‌سازی دو فضای ذخیره‌سازی داریم:

- `STATIC_CACHE`: فایل‌های Frontend مانند HTML، JavaScript، CSS و آیکون‌ها.
- `API_CACHE`: پاسخ‌های Backend مانند JSON لیست Todo.

استراتژی‌ها:

| درخواست | استراتژی | رفتار |
|---|---|---|
| فایل‌های JS/CSS/تصویر | Cache First | اول Cache، در صورت نبودن Network |
| API | Network First | اول Network، در صورت شکست Cache |
| Navigation مثل `/todo` | Network First با کلید `/index.html` | آنلاین صفحه‌ی تازه؛ آفلاین HTML ذخیره‌شده |

```text
Browser
  |
  v
Service Worker
  |----------------------|
  v                      v
Static requests       API requests
  |                      |
Static Cache           API Cache
Cache First            Network First
```

## ۲. فایل‌ها و محیط اجرا

فایل توسعه:

```text
react_todo/public/sw.js
```

بعد از `npm run build`، Vite آن را به این مسیر کپی می‌کند:

```text
react_todo/dist/sw.js
```

`npm run preview` پوشه‌ی `dist` را سرو می‌کند؛ معمولاً روی `http://localhost:4173`. سرور Development روی `5173` محیط دیگری است. پس از تغییر `public/sw.js` باید Build جدید بگیری و صفحه را یک بار Online بارگذاری کنی تا مرورگر نسخه‌ی جدید Worker را دریافت کند.

## ۳. تنظیمات ابتدای فایل

```javascript
const STATIC_CACHE = "react-todo-static-v3";
const API_CACHE = "react-todo-api-v3";
const API_ORIGIN = "http://localhost:4000";
const APP_SHELL_FILES = ["/", "/index.html", "/favicon.svg", "/icons.svg"];
const PRECACHED_API = ["/todos"];
const MATCH = { ignoreVary: true, ignoreSearch: true };
```

### `STATIC_CACHE`

نام Cache مربوط به فایل‌های Frontend است. پسوند `v3` برچسب نسخه است. با تغییر نسخه می‌توان Cache قبلی را کنار گذاشت و منابع Build جدید را نگه داشت.

### `API_CACHE`

Cache جداگانه برای پاسخ‌های API است. جدا کردن Cacheها اجازه می‌دهد داده‌ها و فایل‌های Frontend را مستقل‌تر مدیریت کنیم.

### `API_ORIGIN`

```javascript
const API_ORIGIN = "http://localhost:4000";
```

این Origin متعلق به Backend است. در Fetch Handler با آن تشخیص می‌دهیم که درخواست مربوط به API است یا Frontend.

مقدار باید URL واقعی داخل کوتیشن باشد؛ نه Markdown link. همچنین `localhost` به همان دستگاهی اشاره می‌کند که مرورگر روی آن اجرا می‌شود. در موبایل، `localhost` موبایل است، نه کامپیوتر توسعه‌دهنده.

### `APP_SHELL_FILES`

فهرست فایل‌های ثابت و ضروری است که هنگام Install ذخیره می‌شوند. فایل‌های Hashدار JS/CSS را دستی اینجا نمی‌نویسیم، چون نام آن‌ها در Buildهای مختلف عوض می‌شود.

### `PRECACHED_API`

مسیرهایی از API که هنگام نصب Worker از قبل دریافت و ذخیره می‌شوند. `/todos` با `API_ORIGIN` ترکیب می‌شود و به `http://localhost:4000/todos` تبدیل می‌شود.

### `MATCH`

```javascript
const MATCH = { ignoreVary: true, ignoreSearch: true };
```

- `ignoreVary: true`: هنگام جست‌وجوی Cache، تفاوت Headerهایی که در `Vary` آمده‌اند نادیده گرفته می‌شود.
- `ignoreSearch: true`: Query String در تطبیق Cache نادیده گرفته می‌شود.

مثلاً ممکن است `/todos?page=1` و `/todos?page=2` یک ورودی Cache را Match کنند. این کار برای APIهایی که خروجی‌شان به Query String وابسته است خطرناک است. همچنین نادیده گرفتن Vary برای پاسخ‌های وابسته به زبان، نوع محتوا یا هویت کاربر می‌تواند پاسخ اشتباه ایجاد کند. در اپ واقعی، به‌ویژه API احراز هویت‌شده، این تنظیمات باید با دقت بازبینی شوند.

## ۴. تابع `save(cache, key, response)`

```javascript
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
```

کار این تابع ذخیره‌ی یک Response موفق در Cache است.

1. `response.ok` بررسی می‌کند Status در محدوده‌ی 200 تا 299 باشد. پاسخ 404 یا 500 ذخیره نمی‌شود.
2. `new Headers(response.headers)` هدرها را کپی می‌کند تا بتوانیم نسخه‌ی جدیدی از آن‌ها را تغییر دهیم.
3. `headers.delete("Vary")` هدر Vary را حذف می‌کند. Vary مشخص می‌کند پاسخ بر اساس کدام Headerهای درخواست متفاوت است. حذف آن تطبیق Cache را آسان‌تر می‌کند، اما ممکن است پاسخ‌هایی را با هم مخلوط کند که باید جدا باشند.
4. `headers.set("Access-Control-Allow-Origin", self.location.origin)` این هدر را روی Response ذخیره‌شده تنظیم می‌کند.
5. `response.blob()` بدنه را می‌خواند و با Status و Headerها یک Response جدید می‌سازد.
6. `cache.put(key, response)` آن Response را ذخیره می‌کند.

**نکته‌ی امنیتی CORS:** Service Worker نمی‌تواند CORS را دور بزند. خود `fetch()` به API باید از ابتدا توسط سیاست CORS سرور مجاز باشد تا Response در اختیار Worker قرار بگیرد. تغییر Header بعد از دریافت پاسخ، جایگزین تنظیم CORS در Backend نیست. برای پاسخ‌های same-origin نیز معمولاً افزودن `Access-Control-Allow-Origin` لازم نیست. این قسمت از کد باید متناسب با رفتار واقعی Backend و مرورگر آزمایش شود.

## ۵. تابع `precache(cache, urls)`

```javascript
async function precache(cache, urls) {
  for (const url of urls) {
    try {
      await save(cache, url, await fetch(url));
    } catch (error) {
      console.warn("sw precache skipped", url, error);
    }
  }
}
```

برای هر URL:

1. با `fetch(url)` درخواست می‌فرستد.
2. Response را به `save` می‌دهد.
3. اگر Fetch خطا بدهد، خطا را ثبت می‌کند و سراغ URL بعدی می‌رود.

تفاوت مهم با `cache.addAll()` این است که شکست یک URL در این تابع باعث توقف کل حلقه نمی‌شود؛ چون خطا برای هر URL جداگانه گرفته می‌شود.

این رفتار نصب را منعطف‌تر می‌کند، اما یک خطر دارد: ممکن است نصب Worker موفق شود درحالی‌که یک فایل ضروری مثل JS اصلی Cache نشده است. در آن صورت صفحه‌ی آفلاین ممکن است سفید یا ناقص باشد. برای فایل‌های حیاتی می‌توان سیاست سخت‌گیرانه‌تری در نظر گرفت.

حلقه ترتیبی است؛ چون در هر دور `await` می‌کنیم و تا پایان درخواست فعلی سراغ بعدی نمی‌رویم.

## ۶. تابع `networkFirst(cacheName, request, storeKey)`

```javascript
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
```

این تابع استراتژی Network First را پیاده می‌کند:

1. Cache مربوطه را باز می‌کند.
2. نسخه‌ی قبلی را از Cache می‌خواند تا برای زمان قطع شبکه آماده باشد.
3. ابتدا `fetch(request)` را امتحان می‌کند.
4. اگر درخواست موفق شد، یک Clone را ذخیره و Response اصلی را برمی‌گرداند.
5. اگر Fetch به علت خطای شبکه Reject شد، نسخه‌ی Cache را برمی‌گرداند.
6. اگر Cache هم خالی بود، `Response.error()` می‌دهد.

### پارامتر `storeKey`

مقدار پیش‌فرض `request` است. در حالت Navigation مقدار `/index.html` به آن داده می‌شود تا مسیرهای SPA مثل `/todo` و `/todo/list` از یک HTML استفاده کنند.

### چرا `response.clone()`؟

بدنه‌ی Response قابل مصرف است. تابع `save` بدنه‌ی Response را می‌خواند؛ بنابراین Clone را به آن می‌دهیم و Response اصلی را برای برگرداندن به صفحه نگه می‌داریم.

### خطای شبکه با HTTP 500 فرق دارد

`catch` فقط وقتی اجرا می‌شود که `fetch()` Reject شود؛ مثلاً به دلیل قطع ارتباط. اگر سرور HTTP 500 برگرداند، `fetch()` معمولاً Resolve می‌شود و Response با `ok === false` می‌دهد. `save` آن را ذخیره نمی‌کند، ولی تابع همان پاسخ 500 را برمی‌گرداند؛ Cache به‌صورت خودکار جایگزین آن نمی‌شود.

## ۷. رویداد `install`

```javascript
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(STATIC_CACHE);
      await precache(pages, APP_SHELL_FILES);

      const index = await pages.match("/index.html", MATCH);
      if (index) {
        const assets = [
          ...(await index.text()).matchAll(/(?:src|href)="(\/[^"]+)"/g)
        ].map((match) => match[1]);
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
```

`install` هنگام نصب نسخه‌ی جدید Service Worker اجرا می‌شود. هدف این بخش آماده کردن منابع برای Offline است.

### گام اول: بازکردن Static Cache

```javascript
const pages = await caches.open(STATIC_CACHE);
```

اگر Cache وجود نداشته باشد ساخته می‌شود؛ در غیر این صورت همان Cache باز می‌شود.

### گام دوم: ذخیره‌ی فایل‌های ثابت

```javascript
await precache(pages, APP_SHELL_FILES);
```

فایل‌هایی مانند `/`، `/index.html` و آیکون‌ها ذخیره می‌شوند.

### گام سوم: خواندن HTML ذخیره‌شده

```javascript
const index = await pages.match("/index.html", MATCH);
```

فایل HTML را می‌خوانیم تا مسیر فایل‌های Buildشده‌ی Vite را پیدا کنیم.

Vite ممکن است HTMLای تولید کند که شبیه این باشد:

```html
<script type="module" src="/assets/index-B5AvCPKV.js"></script>
<link rel="stylesheet" href="/assets/index-ABC123.css">
```

اسم این فایل‌ها Hash دارد و در Build بعدی ممکن است تغییر کند. پس نباید آن‌ها را به‌صورت ثابت در کد Service Worker بنویسیم.

### گام چهارم: استخراج `src` و `href`

```javascript
const assets = [
  ...(await index.text()).matchAll(/(?:src|href)="(\/[^"]+)"/g)
].map((match) => match[1]);
```

Regex دنبال `src="..."` یا `href="..."` می‌گردد و مقدارهایی را برمی‌دارد که با `/` شروع شده‌اند. در نتیجه مسیر JS و CSS نهایی استخراج می‌شود و با `precache` ذخیره می‌شود.

این Regex تمام وابستگی‌های برنامه را پیدا نمی‌کند. مثلاً تصویری که فقط داخل کد React یا CSS استفاده شده باشد ممکن است در HTML نباشد. چنین فایلی در صورت درخواست و در حالی که Worker کنترل صفحه را دارد، می‌تواند در مسیر Runtime Cache ذخیره شود.

**چرا این مرحله مهم است؟** اگر HTML ذخیره شود اما JS ذخیره نشود، مرورگر در حالت Offline نمی‌تواند React را اجرا کند و احتمالاً صفحه سفید می‌بینی.

### گام پنجم: ذخیره‌ی API

```javascript
await precache(
  await caches.open(API_CACHE),
  PRECACHED_API.map((path) => API_ORIGIN + path),
);
```

مسیر `/todos` به URL کامل API تبدیل و پاسخ آن در API Cache ذخیره می‌شود. به این ترتیب لیست Todo از قبل برای حالت آفلاین آماده است؛ مشروط به اینکه API هنگام نصب در دسترس باشد و CORS اجازه‌ی درخواست بدهد.

### گام ششم: `event.waitUntil()`

به مرورگر می‌گوید تا پایان Promise عملیات نصب صبر کند. اگر Promise رد شود، نصب ناموفق می‌شود. البته چون `precache` خطای هر URL را می‌گیرد، شکست یک URL به‌تنهایی الزاماً نصب را متوقف نمی‌کند.

### گام هفتم: `self.skipWaiting()`

به Worker جدید اجازه می‌دهد برای فعال‌شدن منتظر بسته‌شدن تمام تب‌های تحت کنترل Worker قبلی نماند. این کار آپدیت را سریع‌تر می‌کند، اما اگر صفحه‌ی قدیمی با Worker یا Cache جدید ناسازگار باشد، ممکن است مشکل نسخه‌ای ایجاد شود.

## ۸. رویداد `activate`

```javascript
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
```

این رویداد پس از نصب موفق و فعال‌شدن Worker جدید اجرا می‌شود.

### `caches.keys()`

نام تمام Cacheهای موجود در Origin فعلی را برمی‌گرداند؛ مثلاً:

```javascript
[
  "react-todo-static-v1",
  "react-todo-api-v1",
  "react-todo-static-v3",
  "react-todo-api-v3"
]
```

### فیلتر Cacheهای قدیمی

```javascript
.filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
```

دو Cache فعلی نگه داشته می‌شوند و بقیه برای حذف انتخاب می‌شوند.

### حذف Cacheها

```javascript
.map((key) => caches.delete(key))
```

هر `caches.delete` یک Promise است. `Promise.all` صبر می‌کند همه‌ی حذف‌ها تمام شوند.

### `self.clients.claim()`

به Worker فعال اجازه می‌دهد کلاینت‌های موجود و قابل‌کنترل در Scope خودش را تحت کنترل بگیرد. برای مثال صفحه‌ای که قبل از فعال‌شدن Worker باز بوده، می‌تواند بدون انتظار برای بازدید بعدی تحت کنترل آن قرار بگیرد.

### هشدار مهم درباره‌ی فیلتر فعلی

کد فعلی هر Cacheای را که نامش دقیقاً یکی از دو نام فعلی نیست حذف می‌کند؛ حتی اگر Cache متعلق به بخش دیگری از همان Origin باشد. در پروژه‌ی بزرگ‌تر بهتر است فقط Cacheهای خود برنامه را حذف کنیم:

```javascript
.filter(
  (key) =>
    key.startsWith("react-todo-") &&
    key !== STATIC_CACHE &&
    key !== API_CACHE
)
```

## ۹. رویداد `fetch`

این بخش تصمیم می‌گیرد هر درخواست از کجا پاسخ داده شود.

### ۹.۱ فقط GET

```javascript
const { request } = event;
if (request.method !== "GET") return;
```

فقط GET وارد منطق Cache می‌شود. بنابراین POST، PUT، PATCH و DELETE در این نسخه آفلاین نمی‌شوند. برای پشتیبانی از Mutation آفلاین، به راهکاری جدا مثل IndexedDB و صف عملیات نیاز داریم.

### ۹.۲ تشخیص API

```javascript
const url = new URL(request.url);

if (url.origin === API_ORIGIN) {
  event.respondWith(networkFirst(API_CACHE, request));
  return;
}
```

اگر Origin درخواست API باشد، Network First اجرا می‌شود:

- آنلاین: پاسخ تازه از Backend دریافت و ذخیره می‌شود.
- آفلاین: پاسخ ذخیره‌شده برگردانده می‌شود.
- اگر نسخه‌ای ذخیره نشده باشد: خطا برمی‌گردد.

### ۹.۳ نادیده گرفتن Originهای دیگر

```javascript
if (url.origin !== self.location.origin) return;
```

درخواست به سایت‌های دیگر توسط این Worker مدیریت نمی‌شود و رفتار پیش‌فرض مرورگر ادامه پیدا می‌کند.

### ۹.۴ Navigation Fallback

```javascript
if (request.mode === "navigate") {
  event.respondWith(
    (async () => {
      const page = await networkFirst(STATIC_CACHE, request, "/index.html");
      if (page.ok) return page;

      const cache = await caches.open(STATIC_CACHE);
      return (await cache.match("/", MATCH)) || page;
    })(),
  );
  return;
}
```

درخواست Navigation یعنی مرورگر می‌خواهد یک سند را باز کند؛ مثلاً `/todo`.

در SPA، مسیر `/todo` فایل مستقل نیست. سرور باید HTML اصلی را برگرداند و React Router بعداً View مناسب را انتخاب کند.

در این کد:

- درخواست واقعی ممکن است `/todo` باشد.
- پاسخ برای ذخیره و بازیابی با کلید `/index.html` نگهداری می‌شود.
- اگر پاسخ موفق باشد، همان پاسخ برگردانده می‌شود.
- اگر پاسخ موفق نباشد، Cache مربوط به `/` به‌عنوان fallback بررسی می‌شود.

به همین دلیل مسیرهای `/todo` و `/todo/list` می‌توانند با یک HTML آفلاین باز شوند.

### ۹.۵ Cache First برای فایل‌های Frontend

```javascript
event.respondWith(
  (async () => {
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
  })(),
);
```

برای درخواست JS، CSS، تصویر و فایل‌های same-origin:

1. Cache بررسی می‌شود.
2. اگر پاسخ وجود داشت، همان پاسخ برگردانده می‌شود.
3. اگر نبود، درخواست به Network می‌رود.
4. در صورت موفقیت، پاسخ ذخیره و برگردانده می‌شود.
5. در صورت شکست شبکه، خطا برمی‌گردد.

این بخش Runtime Cache را هم فراهم می‌کند: فایل‌هایی که در Install از قبل پیدا نشده‌اند، در اولین درخواست موفق می‌توانند ذخیره شوند.

## ۱۰. چرا اولین بازدید متفاوت است؟

در اولین بازدید معمولاً ترتیب کلی چنین است:

1. مرورگر `/todo` را درخواست می‌کند.
2. HTML از سرور دریافت می‌شود.
3. فایل JS و CSS درخواست می‌شوند.
4. React اجرا می‌شود.
5. کد `main.tsx`، Service Worker را Register می‌کند.
6. مرورگر Worker را نصب می‌کند.
7. رویداد `install` منابع را Precache می‌کند.
8. Worker فعال می‌شود و `clients.claim()` می‌تواند صفحه را تحت کنترل بگیرد.

بنابراین درخواست‌های اولیه‌ی HTML و JS لزوماً از Fetch Handler همین Worker عبور نکرده‌اند. به همین دلیل Install باید منابع ضروری را خودش دانلود کند و نباید فقط به Runtime Cache تکیه کرد.

## ۱۱. Precache در برابر Runtime Cache

| ویژگی | Precache | Runtime Cache |
|---|---|---|
| زمان ذخیره | هنگام Install | هنگام استفاده از برنامه |
| تعیین منابع | فهرست از پیش مشخص‌شده | درخواست‌های واقعی |
| مثال این پروژه | HTML، JS/CSS استخراج‌شده، `/todos` | تصویر یا فایل دیگری که بعداً درخواست می‌شود |
| هدف | آماده‌سازی منابع ضروری | نگه‌داشتن منابعی که در اجرا مصرف شده‌اند |

## ۱۲. جدول نهایی تصمیم‌گیری

| درخواست | مسیر کد | رفتار آنلاین | رفتار آفلاین |
|---|---|---|---|
| `GET /todos` روی API | Network First | دریافت و ذخیره‌ی پاسخ تازه | آخرین JSON ذخیره‌شده |
| `POST /todos` | از این Handler عبور نمی‌کند | رفتار عادی شبکه | پشتیبانی نشده |
| `/todo` | Navigation | HTML از سرور و ذخیره با کلید `/index.html` | HTML ذخیره‌شده |
| JS/CSS | Cache First | Cache؛ در صورت نبودن Network و ذخیره | فایل Cache شده |
| درخواست به Origin دیگر | نادیده گرفته می‌شود | رفتار پیش‌فرض مرورگر | وابسته به مرورگر و Cache خودش |

## ۱۳. آزمایش در مرورگر

از پوشه‌ی React:

```bash
npm run build
npm run preview
```

سپس:

1. آدرس Preview مثل `http://localhost:4173/todo` را باز کن.
2. DevTools → Application → Service Workers را بررسی کن؛ Worker باید فعال باشد.
3. Application → Cache Storage را باز کن.
4. باید `react-todo-static-v3` و `react-todo-api-v3` را ببینی.
5. Static Cache باید `index.html` و فایل JS/CSS دارای Hash را داشته باشد.
6. API Cache باید `http://localhost:4000/todos` را داشته باشد.
7. در حالت Online یک بار Reload کن.
8. Network را Offline کن و دوباره Reload بزن.

انتظار می‌رود HTML، JS، CSS و آخرین لیست ذخیره‌شده Todo نمایش داده شوند. ایجاد، ویرایش و حذف Todo در این نسخه آفلاین پشتیبانی نمی‌شود.

## ۱۴. به‌روزرسانی Worker و Cache

پس از تغییر `public/sw.js`:

```bash
npm run build
npm run preview
```

سپس یک بار Online صفحه را Reload کن.

برای نسخه‌ی جدید Cache می‌توان نام‌ها را تغییر داد:

```javascript
const STATIC_CACHE = "react-todo-static-v4";
const API_CACHE = "react-todo-api-v4";
```

در زمان Activate، Cacheهای قبلی طبق فیلتر موجود حذف می‌شوند.

اگر Worker قدیمی در مرورگر باقی ماند، در محیط آموزشی از Application → Service Workers گزینه‌ی Unregister استفاده کن و دوباره صفحه را Online باز کن.

## ۱۵. محدودیت‌ها و ملاحظات Production

1. **Mutation آفلاین نداریم:** فقط GET مدیریت می‌شود. برای عملیات نوشتن باید IndexedDB و صف ارسال مجدد طراحی شود.
2. **Query String:** `ignoreSearch: true` ممکن است پاسخ Queryهای متفاوت را اشتباه Match کند.
3. **حریم خصوصی و کاربران:** Cache پاسخ شخصی باید با هویت کاربر، Logout، تغییر حساب و مجوزها هماهنگ باشد. Cache مشترک و بدون جداسازی می‌تواند باعث نمایش داده‌ی کاربر دیگر شود.
4. **CORS:** تغییر Header در تابع `save` محدودیت CORS را دور نمی‌زند؛ Backend باید درخواست را مجاز کند.
5. **HTTP 500:** `networkFirst` فعلی فقط در خطای شبکه به Cache برمی‌گردد، نه در هر Status غیرموفق.
6. **وابستگی‌های غیرمستقیم:** Regex فقط `src` و `href` داخل HTML را پیدا می‌کند؛ تمام تصاویر و منابعی که از JS/CSS بارگذاری می‌شوند الزاماً Precache نمی‌شوند.
7. **پاک‌سازی Cache:** فیلتر فعلی ممکن است Cacheهای دیگر همان Origin را هم حذف کند؛ در اپ بزرگ‌تر باید حذف را به Prefix اختصاصی محدود کرد.
8. **localhost:** روی دستگاه دیگر به Backend کامپیوتر اشاره نمی‌کند؛ باید آدرس قابل‌دسترسی Backend و CORS مناسب تنظیم شود.
9. **فایل‌های Cache نشده:** اگر فایلی در Precache نباشد و اولین درخواستش در حالت Offline اتفاق بیفتد، Worker نمی‌تواند آن را از هیچ‌جا بازیابی کند.

## ۱۶. واژه‌نامه

| اصطلاح | معنی |
|---|---|
| Service Worker | اسکریپت واسط بین صفحه و درخواست‌های شبکه |
| Register | ثبت Worker در مرورگر |
| Install | نصب نسخه‌ی جدید Worker |
| Activate | فعال‌شدن Worker و آماده‌شدن برای کنترل صفحه |
| Fetch Event | رویداد درخواست منابع توسط صفحه |
| Cache Storage | فضای ذخیره‌سازی Responseها |
| App Shell | منابع پایه برای بالا آمدن UI |
| Precache | ذخیره‌ی منابع از پیش تعیین‌شده |
| Runtime Cache | ذخیره‌ی منابع هنگام استفاده |
| Cache First | اول Cache، سپس Network |
| Network First | اول Network، سپس Cache در صورت شکست |
| Navigation Fallback | برگرداندن HTML اصلی برای مسیرهای SPA |
| `skipWaiting()` | اجازه‌ی فعال‌شدن سریع‌تر Worker جدید |
| `clients.claim()` | گرفتن کنترل کلاینت‌های موجود و قابل‌کنترل |
| `event.waitUntil()` | متصل‌کردن Promise به چرخه‌ی عمر رویداد |
| `response.clone()` | ساخت نسخه‌ی دیگری از Response |
| `Vary` | تعیین Headerهایی که روی انتخاب پاسخ اثر دارند |
| CORS | سیاست مرورگر برای دسترسی به منابع Originهای دیگر |

## ۱۷. خلاصه‌ی ذهنی

برای به خاطر سپردن فایل:

1. ثابت‌ها نام Cacheها، Origin API و فهرست Precache را مشخص می‌کنند.
2. `save` پاسخ موفق را ذخیره می‌کند.
3. `precache` مجموعه‌ای از URLها را از قبل دانلود می‌کند.
4. `networkFirst` برای API و Navigation ابتدا شبکه را امتحان می‌کند.
5. `install` فایل‌های App Shell، فایل‌های Hashشده‌ی Vite و `/todos` را ذخیره می‌کند.
6. `activate` Cacheهای قدیمی را حذف و کنترل صفحه‌ها را می‌گیرد.
7. `fetch` نوع درخواست را تشخیص می‌دهد و استراتژی مناسب را اجرا می‌کند.

**اصل اصلی:** Offline شدن فقط به ذخیره‌ی فایل‌ها وابسته نیست؛ باید هم منابع ضروری را از قبل ذخیره کنیم و هم برای هر نوع درخواست، سیاست پاسخ‌دهی آفلاین داشته باشیم.
