/* عامل الخدمة — التطبيق كله يعمل بلا إنترنت بعد أول فتحة (عدا التلاوة غير المحفوظة).
 * VERSION يتغيّر في كل نشر (deploy.py) · AUDIO يتغيّر فقط لما تتغيّر الأصوات (make_precache.py) — فلا يُعاد تنزيل ١٠ م.ب بلا داعٍ. */
const VERSION = 'sedra-202609152158';
const AUDIO = 'sedra-audio-8dcbf24a87';
const SHELL = 'sedra-shell-' + VERSION;
const QURAN = 'sedra-quran';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const list = await (await fetch('precache.json', { cache: 'no-store' })).json();
    const shell = await caches.open(SHELL);
    await shell.addAll(list.shell.map((u) => new Request(u, { cache: 'reload' })));
    const audio = await caches.open(AUDIO);
    const have = new Set((await audio.keys()).map((r) => new URL(r.url).pathname));
    const base = new URL(self.registration.scope).pathname;
    const missing = list.audio.filter((u) => !have.has(base + u));
    for (let i = 0; i < missing.length; i += 20) await audio.addAll(missing.slice(i, i + 20));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![SHELL, AUDIO, QURAN].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'everyayah.com') {
    // التلاوة: المحفوظة بزر «للاستماع بدون إنترنت» تُخدم من الجهاز، وغيرها من الشبكة
    e.respondWith(caches.open(QURAN).then((c) => c.match(req.url)).then((hit) => hit || fetch(req)));
    return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('sw.js')) {
    // الشبكة أولاً لتصل التحديثات، والكاش عند انقطاعها
    e.respondWith(fetch(req).then((r) => {
      if (r.ok && !url.pathname.endsWith('precache.json')) { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((h) => h || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
