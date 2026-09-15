/* شاشة التثبيت — منقولة من تطبيق التفاح الأخضر بعد تجربتها على الجوالات.
 * - أندرويد/كمبيوتر: زر يفتح نافذة التثبيت الأصلية (beforeinstallprompt).
 * - آيفون: خطوات «مشاركة ← إضافة إلى الشاشة الرئيسية».
 * - داخل متصفح واتساب/إنستغرام المصغّر: لا تثبيت أصلاً ← «افتح في Safari/Chrome».
 *   ⚠ واتساب آيفون ينتحل UA سفاري بالحرف — الفارق الوحيد أن navigator.standalone غير مُعرَّف.
 * التصنيف دالة خالصة محروسة في tests/install_check.js. */
(function (root) {
  'use strict';

  const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|MicroMessenger|WhatsApp|GSA\/|TikTok|musical_ly|Telegram/i;

  function classify(env) {
    const ua = env.ua || '';
    if (env.standaloneValue === true || env.displayStandalone === true) return 'installed';
    const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (env.touchPoints || 0) > 1);
    if (iOS) {
      const other = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua);
      if (!other && (IN_APP.test(ua) || !env.standaloneDefined)) return 'ios-inapp';
      return other ? 'ios-other' : 'ios-safari';
    }
    if (/Android/.test(ua)) return (IN_APP.test(ua) || /; wv\)/.test(ua)) ? 'android-inapp' : 'android';
    return 'desktop';
  }

  const api = { classify };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SEDRA_INSTALL = api;
  if (typeof document === 'undefined') return;

  let deferred = null;
  const SKIP = 'sedra.skipInstall';
  const mode = classify({
    ua: navigator.userAgent,
    standaloneDefined: 'standalone' in navigator,
    standaloneValue: navigator.standalone,
    displayStandalone: !!(root.matchMedia && root.matchMedia('(display-mode: standalone)').matches),
    touchPoints: navigator.maxTouchPoints,
  });
  const skipped = (() => { try { return localStorage.getItem(SKIP) === '1' || sessionStorage.getItem(SKIP) === '1'; } catch (e) { return false; } })();
  const fromApp = /[?&]source=pwa/.test(location.search);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  root.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    const b = document.getElementById('gateInstall');
    if (b) { b.disabled = false; b.classList.add('ready'); }
  });
  root.addEventListener('appinstalled', () => { deferred = null; paint('done'); });

  if (mode === 'installed' || skipped || fromApp || local) return;

  const SHARE = '<svg class="gate-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  const PLUS = '<svg class="gate-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  const steps = (arr) => '<ol class="gate-steps">' + arr.map((s) => '<li><span>' + s + '</span></li>').join('') + '</ol>';

  function body(m) {
    switch (m) {
      case 'android':
      case 'desktop':
        return '<button class="gate-btn" id="gateInstall">تثبيت التطبيق</button>' +
          '<div class="gate-help" id="gateHelp" hidden>' + (m === 'android'
            ? steps(['افتح قائمة المتصفح <b>⋮</b> فوق', 'اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>'])
            : steps(['اضغط أيقونة التثبيت ' + PLUS + ' في شريط العنوان', 'اختر <b>«تثبيت»</b>'])) + '</div>';
      case 'android-inapp':
        return '<button class="gate-btn ready" id="gateChrome">افتح في Chrome وثبّته</button>' +
          '<p class="gate-note">المتصفح داخل هذا التطبيق لا يسمح بالتثبيت</p>';
      case 'ios-inapp':
        return '<button class="gate-btn ready" id="gateSafari">افتح في Safari وثبّته</button>' +
          '<p class="gate-note" id="gateCopied">متصفح واتساب/إنستغرام ليس فيه خيار التثبيت — أو اضغط <b>⋯</b> واختر «فتح في Safari»</p>';
      case 'ios-safari':
        return steps(['اضغط زر المشاركة ' + SHARE + ' في الأسفل', 'اختر <b>«إضافة إلى الشاشة الرئيسية»</b> ' + PLUS, 'اضغط <b>«إضافة»</b>']) +
          '<div class="gate-arrow" aria-hidden="true">↓</div>';
      case 'ios-other':
        return steps(['اضغط زر المشاركة ' + SHARE + ' بجانب شريط العنوان', 'اختر <b>«إضافة إلى الشاشة الرئيسية»</b> ' + PLUS, 'اضغط <b>«إضافة»</b>']);
      case 'done':
        return '<p class="gate-ok">✓ تم تثبيت التطبيق</p><p class="gate-note">افتحه من أيقونة «سدرة» على شاشتك</p>';
    }
    return '';
  }

  function close() {
    try { sessionStorage.setItem(SKIP, '1'); } catch (e) { /* وضع خاص */ }
    const g = document.getElementById('gate');
    if (g) g.remove();
    document.documentElement.classList.remove('gate-open');
  }
  function paint(m) {
    const g = document.getElementById('gate');
    if (!g) return;
    g.querySelector('.gate-body').innerHTML = body(m);
    g.querySelector('.gate-skip').textContent = m === 'done' ? 'تمام' : 'متابعة من المتصفح';
    wire();
  }
  function wire() {
    const inst = document.getElementById('gateInstall');
    if (inst) {
      if (deferred) inst.classList.add('ready');
      inst.onclick = async () => {
        if (!deferred) { document.getElementById('gateHelp').hidden = false; return; }
        const e = deferred; deferred = null;
        e.prompt();
        try { const c = await e.userChoice; if (c && c.outcome === 'accepted') paint('done'); } catch (err) { /* أُغلقت */ }
      };
      setTimeout(() => { const h = document.getElementById('gateHelp'); if (h && !deferred) h.hidden = false; }, 3500);
    }
    const chrome = document.getElementById('gateChrome');
    if (chrome) chrome.onclick = () => {
      location.href = 'intent://' + location.host + location.pathname + location.search + '#Intent;scheme=https;package=com.android.chrome;end';
    };
    const safari = document.getElementById('gateSafari');
    if (safari) safari.onclick = () => {
      const url = location.href.split('#')[0];
      try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (e) { /* ليس مهماً */ }
      location.href = 'x-safari-' + url;
      setTimeout(() => {
        const n = document.getElementById('gateCopied');
        if (n && document.visibilityState === 'visible') n.innerHTML = 'تم نسخ الرابط ✓ افتح <b>Safari</b> والصقه في شريط العنوان';
      }, 1200);
    };
  }
  function mount() {
    const g = document.createElement('div');
    g.id = 'gate'; g.className = 'gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'gateT');
    g.innerHTML = '<div class="gate-card">' +
      '<img class="gate-logo" src="icons/icon-512.png?v=sedra-202609152158" alt="سدرة للأطفال" width="512" height="512">' +
      '<h1 id="gateT">ثبّت «سدرة للأطفال»</h1>' +
      '<p class="gate-sub">حروف وأرقام وقرآن وقصص — مجاني، بلا إعلانات، ويعمل بدون إنترنت</p>' +
      '<div class="gate-body"></div>' +
      '<button class="gate-skip" type="button">متابعة من المتصفح</button></div>';
    document.body.appendChild(g);
    document.documentElement.classList.add('gate-open');
    g.querySelector('.gate-skip').onclick = close;
    paint(mode);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(typeof window !== 'undefined' ? window : globalThis);
