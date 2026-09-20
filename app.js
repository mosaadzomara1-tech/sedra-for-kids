/* سدرة للأطفال — الواجهة. كل قرار منطقي في logic.js (SK). بلا مكتبات. */
(function () {
  'use strict';
  const SK = window.SK;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const view = $('#view');
  const D = SK.toArabicDigits;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rnd = Math.random;
  const ROUND = 5;
  let C = null, Q = null;

  /* ───────────── الحالة (على الجهاز فقط) ───────────── */
  const KEY = 'sedra.v1';
  const AVATARS = ['🦁', '🐰', '🐼', '🦊', '🐱', '🐻', '🦄', '🐸', '🐧', '🐢'];
  const STICKERS = ['🌟', '🌈', '🦋', '🌸', '🍉', '🚀', '🐬', '🎈', '🌻', '🐞', '🍭', '⛵', '🦜', '🐝', '🍓', '🌙', '🎨', '🐳', '🍀', '🏆'];
  const fresh = () => ({ profiles: [{ id: 'p1', name: '', avatar: '🦁' }], active: 'p1', prog: {}, bonus: null, usage: {},
    settings: { limitMin: 30, reciter: 'Husary_Muallim_128kbps', repeat: 1, echo: false, sound: true, speed: 1, order: 'abc', enOrder: 'abc', auto: true } });
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.profiles) && s.profiles.length) { const f = fresh(); s.settings = Object.assign(f.settings, s.settings || {}); return Object.assign(f, s); }
    } catch (e) { /* وضع خاص أو بيانات تالفة */ }
    return fresh();
  }
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* لا مساحة */ } };
  const kid = () => S.profiles.find((p) => p.id === S.active) || S.profiles[0];
  function P() {
    const id = kid().id;
    const p = S.prog[id] || (S.prog[id] = {});
    const d = { stars: 0, boxes_ar: {}, boxes_en: {}, boxes_num: {}, memorized: {}, stories: {}, traced: {}, games: {}, plan: null };
    for (const k in d) if (p[k] === undefined) p[k] = d[k];
    return p;
  }
  function updBox(store, key, ok) { const p = P(); p[store] = SK.updateBox(p[store], key, ok); save(); }

  /* ───────────── الصوت ───────────── */
  const A = (p) => (/^https?:/.test(p) ? p : 'audio/' + p + '.mp3');
  const player = new Audio();
  const QA = new Audio(); // التلاوة
  let seq = null, stopCurrent = null;
  function play(list, onend) {
    stopAudio();
    list = [].concat(list).map(A);
    if (!S.settings.sound) { if (onend) onend(); return; }
    seq = { list, i: 0, onend };
    step();
  }
  function step() {
    if (!seq) return;
    if (seq.i >= seq.list.length) { const cb = seq.onend; seq = null; if (cb) cb(); return; }
    const mine = seq;
    player.src = seq.list[seq.i++];
    try { player.preservesPitch = true; player.playbackRate = +S.settings.speed || 1; } catch (e) { /* متصفح قديم */ }
    player.play().catch(() => { if (seq === mine) step(); });
  }
  player.onended = step;
  player.onerror = step;
  function stopAudio() { seq = null; player.pause(); }
  function stopAll() { stopAudio(); if (stopCurrent) { stopCurrent(); stopCurrent = null; } }
  const PRAISES = ['great', 'super', 'bravo', 'mashallah', 'clever', 'keep'];
  let lastPraise = -1;
  // التكرار يقتل الدافعية — لا نعيد آخر مدحة قيلت
  function praise() { let i; do { i = Math.floor(rnd() * PRAISES.length); } while (i === lastPraise && PRAISES.length > 1); lastPraise = i; return 'ui/' + PRAISES[i]; }

  /* ───────────── النجوم والاحتفال ───────────── */
  function paintStars(bump) {
    $('#starsN').textContent = D(P().stars);
    if (bump) { const s = $('#stars'); s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); }
  }
  function addStars(n) {
    if (!n) return;
    const p = P(), before = SK.stickersUnlocked(p.stars, STICKERS.length);
    p.stars += n; save(); paintStars(true); celebrate();
    if (SK.stickersUnlocked(p.stars, STICKERS.length) > before) setTimeout(() => toast('🏅 ملصق جديد! افتح «ملصقاتي»'), 900);
  }
  function celebrate() {
    const fx = $('#fx');
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('i');
      el.textContent = i % 3 ? '⭐' : '✨';
      el.style.left = '50%'; el.style.top = '45%';
      const a = (i / 12) * Math.PI * 2;
      el.style.setProperty('--dx', Math.cos(a) * 160 + 'px'); el.style.setProperty('--dy', Math.sin(a) * 160 + 'px');
      fx.appendChild(el); setTimeout(() => el.remove(), 1200);
    }
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  /* ───────────── الألعاب (المهارة وراء كل لعبة) ───────────── */
  const GAMES = {
    ar: { area: 'literacy', emoji: '🎧', title: 'اسمع واختر الحرف', skill: 'التمييز السمعي للحروف' },
    fam: { area: 'literacy', emoji: '🔍', title: 'الحروف المتشابهة', skill: 'التمييز البصري: ب ت ث ن ي' },
    syl: { area: 'literacy', emoji: '🎵', title: 'اسمع واختر الحركة', skill: 'الفتحة والكسرة والضمة' },
    pic: { area: 'literacy', emoji: '🖼️', title: 'بأيّ حرف تبدأ؟', skill: 'الصوت الأول في الكلمة' },
    build: { area: 'literacy', emoji: '🧩', title: 'ركّب الكلمة', skill: 'تركيب الحروف: ب + ا + ب' },
    en: { area: 'literacy', emoji: '🔤', title: 'Listen & choose', skill: 'الحروف الإنجليزية' },
    spell: { area: 'literacy', emoji: '🐱', title: 'Spell it', skill: 'تهجئة c-a-t' },
    num: { area: 'math', emoji: '🔢', title: 'كم العدد؟', skill: 'العدّ وربط الرقم بالكمية' },
    flash: { area: 'math', emoji: '⚡', title: 'نظرة سريعة', skill: 'إدراك الكمية بلا عدّ' },
    more: { area: 'math', emoji: '⚖️', title: 'أيّهما أكثر؟', skill: 'المقارنة' },
    seq: { area: 'math', emoji: '🔜', title: 'الرقم الناقص', skill: 'تسلسل الأرقام' },
    memory: { area: 'thinking', emoji: '🃏', title: 'لعبة الذاكرة', skill: 'الذاكرة والتركيز' },
    odd: { area: 'thinking', emoji: '🧐', title: 'أيّها مختلف؟', skill: 'التصنيف والمنطق' },
    pattern: { area: 'thinking', emoji: '🔁', title: 'أكمل النمط', skill: 'الأنماط والتفكير' },
    color: { area: 'thinking', emoji: '🎨', title: 'أين اللون؟', skill: 'الألوان' },
    shape: { area: 'thinking', emoji: '🔷', title: 'أين الشكل؟', skill: 'الأشكال' },
    rhyme: { area: 'literacy', emoji: '🎶', title: 'مَن يشبه آخره؟', skill: 'الوعي الصوتي والقافية' },
    form: { area: 'literacy', emoji: '✍️', title: 'شكل الحرف', skill: 'الحرف في أول الكلمة ووسطها وآخرها' },
    add: { area: 'math', emoji: '➕', title: 'اجمع معي', skill: 'الجمع ضمن ١٠ بالصور' },
    sub: { area: 'math', emoji: '➖', title: 'كم بقي؟', skill: 'الطرح ضمن ١٠ بالصور' },
    size: { area: 'math', emoji: '📐', title: 'الأكبر والأصغر', skill: 'المقارنة بالحجم' },
    sort: { area: 'thinking', emoji: '🗂️', title: 'صنّف معي', skill: 'التصنيف إلى مجموعات' },
    shadow: { area: 'thinking', emoji: '🌑', title: 'أين صاحب الظل؟', skill: 'الإدراك البصري' },
    oppo: { area: 'world', emoji: '↔️', title: 'ما عكسه؟', skill: 'الأضداد والمفاهيم' },
    space: { area: 'world', emoji: '📦', title: 'أين الكرة؟', skill: 'فوق وتحت وداخل ويمين ويسار' },
    emo: { area: 'world', emoji: '😊', title: 'بماذا يشعر؟', skill: 'فهم المشاعر والتعبير عنها' },
  };
  const AREAS = { literacy: '📖 القراءة', math: '🔢 الرياضيات', thinking: '🧠 التفكير', world: '🌍 أنا وعالمي' };
  const gameAreas = () => { const o = {}; for (const [id, g] of Object.entries(GAMES)) (o[g.area] = o[g.area] || []).push(id); return o; };

  /* ───────────── رحلة اليوم ───────────── */
  const surahOrder = () => Q.levels.flatMap((l) => l.surahs);
  const arOrder = () => (S.settings.order === 'shape' ? C.ar_shape_order : C.ar_letters.map((l) => l.i));
  const enOrder = () => (S.settings.enOrder === 'phonics' ? C.en_phonics_order : C.en_letters.map((l) => l.i));
  function planView(it) {
    switch (it.type) {
      case 'ar': { const L = C.ar_letters[it.target]; return { emoji: L.emoji, label: 'حرف ' + L.name, go: 'ar-l/' + it.target }; }
      case 'en': { const L = C.en_letters[it.target]; return { emoji: L.letter, label: 'Letter ' + L.letter, go: 'en-l/' + it.target }; }
      case 'num': return { emoji: D(it.target), label: 'الرقم ' + D(it.target), go: 'num-l/' + it.target };
      case 'surah': return { emoji: '📖', label: 'سورة ' + Q.surahs[it.target].name, go: 'surah/' + it.target };
      case 'story': { const s = C.stories.find((x) => x.id === it.target) || C.stories[0]; return { emoji: s.emoji, label: s.title, go: 'story/' + s.id }; }
      default: { const g = GAMES[it.target] || GAMES.ar; return { emoji: g.emoji, label: g.title, go: 'game/' + it.target }; }
    }
  }
  function todayPlan() {
    const p = P(), day = SK.dateKey(new Date());
    if (!p.plan || p.plan.day !== day) {
      const ctx = { arOrder: arOrder(), enOrder: enOrder(), surahOrder: surahOrder(), storyIds: C.stories.map((s) => s.id), gameAreas: gameAreas() };
      p.plan = { day, items: SK.dailyPlan(Object.assign({ id: kid().id }, p), ctx, day), done: {} };
      save();
    }
    const items = p.plan.items.map((it) => Object.assign(planView(it), { done: !!p.plan.done[it.type] }));
    return { items, done: items.filter((x) => x.done).length };
  }
  function markPlan(type, target) {
    const p = P();
    if (!p.plan || p.plan.day !== SK.dateKey(new Date()) || p.plan.done[type]) return;
    const it = p.plan.items.find((x) => x.type === type);
    if (!it || (target !== undefined && String(it.target) !== String(target))) return;
    p.plan.done[type] = 1; save();
    if (Object.keys(p.plan.done).length === p.plan.items.length) setTimeout(() => { addStars(5); toast('🏆 أنهيت رحلة اليوم! +٥ نجوم'); play('ui/plan_done'); }, 1600);
  }

  /* ───────────── التنقّل ───────────── */
  const routes = {};
  const BACK = { 'ar-l': 'ar', 'en-l': 'en', 'num-l': 'num', surah: 'quran', story: 'stories', game: 'games', 'learn-i': 'learn' };
  const go = (h) => { if (location.hash === '#' + h) render(); else location.hash = h; };
  function setTitle(t) { $('#title').textContent = t; document.title = t + ' — سدرة'; }
  function render() {
    stopAll();
    if (!C) return;
    const parts = (location.hash.slice(1) || 'home').split('/');
    const r = routes[parts[0]] ? parts[0] : 'home';
    $('#back').hidden = r === 'home';
    view.onclick = null;
    view.innerHTML = '';
    window.scrollTo(0, 0);
    routes[r](...parts.slice(1));
    checkTime();
  }
  $('#back').onclick = () => {
    const p = (location.hash.slice(1) || 'home').split('/');
    if (p[0] === 'trace') return go((p[1] === 'num' ? 'num' : p[1]) + '-l/' + p[2]);
    go(BACK[p[0]] || 'home');
  };
  $('#stars').onclick = () => go('stickers');
  window.addEventListener('hashchange', render);
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g && view.contains(g)) { go(g.dataset.go); return; }
    const s = e.target.closest('[data-say]');
    if (s && view.contains(s)) play(s.dataset.say.split('|'));
  });

  /* ───────────── الرئيسية ───────────── */
  const TILES = [
    ['ar', 'أ ب ت', 'الحروف العربية', 't-green'], ['en', 'A B C', 'English', 't-blue'],
    ['num', '١ ٢ ٣', 'الأرقام', 't-orange'], ['quran', '📖', 'قرآني', 't-teal'],
    ['stories', '📚', 'حكايات', 't-purple'], ['games', '🎮', 'ألعاب ومهارات', 't-red'],
    ['duas', '🤲', 'أذكاري', 't-pink'], ['adab', '🌷', 'آدابي', 't-yellow'],
    ['learn', '🕌', 'ديني', 't-cyan'], ['colors', '🎨', 'ألوان وأشكال', 't-lime'],
    ['world', '🌍', 'أنا وعالمي', 't-sky'],
  ];
  routes.home = () => {
    setTitle('سدرة للأطفال');
    const k = kid(), plan = todayPlan();
    view.innerHTML = `
      <div class="hello"><span class="av">${k.avatar}</span>
        <div><h2>أهلاً ${esc(k.name || 'يا بطل')}</h2><p>ماذا نتعلّم اليوم؟</p></div>
        ${S.profiles.length > 1 ? `<div class="kids">${S.profiles.map((x) => `<button data-kid="${x.id}" class="${x.id === k.id ? 'on' : ''}" aria-label="${esc(x.name || 'طفل')}">${x.avatar}</button>`).join('')}</div>` : ''}
      </div>
      <div class="card plan">
        <div class="plan-h"><b>🗺️ رحلة اليوم</b><span>${D(plan.done)} / ${D(plan.items.length)}</span></div>
        <div class="progress"><i style="width:${(plan.done / plan.items.length) * 100}%"></i></div>
        <div class="plan-items">${plan.items.map((it) => `<button class="plan-it ${it.done ? 'done' : ''}" data-go="${it.go}"><span class="emo">${esc(it.emoji)}</span><span>${esc(it.label)}</span></button>`).join('')}</div>
      </div>
      <div class="tiles">${TILES.map(([r, big, lbl, cls]) => `<button class="tile ${cls}" data-go="${r}"><span class="big">${big}</span><span class="lbl">${lbl}</span></button>`).join('')}
        <button class="tile t-purple" data-go="stickers"><span class="big">🏅</span><span class="lbl">ملصقاتي</span></button></div>
      <button class="parent-link" data-go="parents">🔒 ركن الأهل</button>`;
    $$('[data-kid]', view).forEach((b) => (b.onclick = () => { S.active = b.dataset.kid; save(); paintStars(); render(); }));
  };

  /* ───────────── الحروف العربية ───────────── */
  routes.ar = () => {
    setTitle('الحروف العربية');
    const shape = S.settings.order === 'shape';
    view.innerHTML = `
      <div class="qbar"><button class="toggle ${shape ? '' : 'on'}" data-order="abc">أ ب ت — الترتيب</button>
        <button class="toggle ${shape ? 'on' : ''}" data-order="shape">المتشابهة معاً</button></div>
      <div class="grid">${arOrder().map((i) => { const L = C.ar_letters[i]; return `<button class="cell ${(P().boxes_ar[i] || 0) >= 3 ? 'done' : ''}" data-go="ar-l/${i}"><span class="l">${L.letter}</span><span class="e">${L.emoji}</span></button>`; }).join('')}</div>
      <div class="row-title">العب وتعلّم</div>
      <div class="list">${['ar', 'fam', 'syl', 'pic', 'build', 'memory'].map(gameItem).join('')}</div>`;
    $$('[data-order]', view).forEach((b) => (b.onclick = () => { S.settings.order = b.dataset.order; save(); render(); }));
  };
  function gameItem(id) {
    const g = GAMES[id], rec = P().games[id];
    return `<button class="item" data-go="game/${id}"><span class="emo">${g.emoji}</span><span><span class="tt">${esc(g.title)}</span><span class="st">${esc(g.skill)}${rec ? ' · أفضل نتيجة ' + '⭐'.repeat(rec.best) : ''}</span></span></button>`;
  }
  routes['ar-l'] = (i) => {
    i = ((+i || 0) % 28 + 28) % 28;
    const L = C.ar_letters[i], f = L.forms, h = L.harakat;
    setTitle('حرف ' + L.name);
    view.innerHTML = `
      <div class="card center">
        <button class="big-letter" data-say="ar/${i}">${L.letter}</button>
        <button class="word" data-say="ar/${i}"><span class="emo">${L.emoji}</span><span>${L.word}</span></button>
        <div class="row-title">الحركات — اضغط واسمع</div>
        <div class="chips">${['فتحة', 'كسرة', 'ضمة'].map((nm, k) => `<button class="chip" data-say="syl/${i}_${k}">${h[k]}<small>${nm}</small></button>`).join('')}<span class="chip">${h[3]}<small>سكون</small></span></div>
        <div class="row-title">شكل الحرف في الكلمة</div>
        <div class="chips">${[['alone', 'وحده'], ['start', 'أوّل'], ['middle', 'وسط'], ['end', 'آخر']].map(([k, nm]) => `<span class="chip">${f[k]}<small>${nm}</small></span>`).join('')}</div>
      </div>
      <div class="nav">
        <button class="btn ghost round" data-go="ar-l/${(i + 27) % 28}" aria-label="السابق">→</button>
        <button class="btn" data-go="trace/ar/${i}">✍️ اكتب الحرف</button>
        <button class="btn ghost round" data-go="ar-l/${(i + 1) % 28}" aria-label="التالي">←</button>
      </div>`;
    play('ar/' + i);
    markPlan('ar', i);
  };

  /* ───────────── English ───────────── */
  routes.en = () => {
    setTitle('English ABC');
    const ph = S.settings.enOrder === 'phonics';
    view.innerHTML = `
      <div class="qbar"><button class="toggle ${ph ? '' : 'on'}" data-eo="abc">A → Z</button>
        <button class="toggle ${ph ? 'on' : ''}" data-eo="phonics">s a t p i n — Phonics</button></div>
      <div class="grid en">${enOrder().map((i) => { const L = C.en_letters[i]; return `<button class="cell ${(P().boxes_en[i] || 0) >= 3 ? 'done' : ''}" data-go="en-l/${i}"><span class="l">${L.letter}${L.lower}</span><span class="e">${L.emoji}</span></button>`; }).join('')}</div>
      <div class="row-title">Play & learn</div>
      <div class="list">${['en', 'spell'].map(gameItem).join('')}</div>`;
    $$('[data-eo]', view).forEach((b) => (b.onclick = () => { S.settings.enOrder = b.dataset.eo; save(); render(); }));
  };
  routes['en-l'] = (i) => {
    i = ((+i || 0) % 26 + 26) % 26;
    const L = C.en_letters[i];
    setTitle('Letter ' + L.letter);
    view.innerHTML = `
      <div class="card center en">
        <button class="big-letter" data-say="en/${i}">${L.letter}${L.lower}</button>
        <button class="word" data-say="en/${i}" dir="ltr"><span class="emo">${L.emoji}</span><span>${esc(L.word)}</span></button>
        <div class="meaning">${esc(L.ar)}${L.letter === 'X' ? ' — ' + esc(C.en_x_note) : ''}</div>
      </div>
      <div class="nav">
        <button class="btn ghost round" data-go="en-l/${(i + 25) % 26}" aria-label="السابق">→</button>
        <button class="btn blue" data-go="trace/en/${i}">✍️ Write it</button>
        <button class="btn ghost round" data-go="en-l/${(i + 1) % 26}" aria-label="التالي">←</button>
      </div>`;
    play('en/' + i);
    markPlan('en', i);
  };

  /* ───────────── الأرقام ───────────── */
  routes.num = () => {
    setTitle('الأرقام');
    view.innerHTML = `
      <div class="grid">${C.numbers.map((N) => `<button class="cell ${(P().boxes_num[N.n] || 0) >= 3 ? 'done' : ''}" data-go="num-l/${N.n}"><span class="l">${D(N.n)}</span><span class="e">${N.n}</span></button>`).join('')}</div>
      <div class="row-title">العب وتعلّم</div>
      <div class="list">${['num', 'flash', 'more', 'seq'].map(gameItem).join('')}</div>`;
  };
  function tenFrame(n, emoji, clickable) {
    const frames = Math.max(1, Math.ceil(n / 10));
    let html = '';
    for (let f = 0; f < frames; f++) {
      html += '<div class="tenframe">';
      for (let c = 0; c < 10; c++) {
        const idx = f * 10 + c, on = idx < n;
        html += clickable && on ? `<button class="tf obj" data-idx="${idx}">${emoji}</button>` : `<span class="tf ${on ? 'full' : ''}">${on ? emoji : ''}</span>`;
      }
      html += '</div>';
    }
    return html;
  }
  routes['num-l'] = (n) => {
    n = Math.max(0, Math.min(20, +n || 0));
    const N = C.numbers[n], emoji = C.count_emoji[n % C.count_emoji.length];
    setTitle('الرقم ' + D(n));
    view.innerHTML = `
      <div class="card center">
        <div class="num-big"><span>${D(n)}</span><span>${n}</span></div>
        <div class="chips">
          <button class="word" data-say="num/ar${n}">🔊 ${N.ar}</button>
          <button class="word" data-say="num/en${n}" dir="ltr">🔊 ${N.en}</button>
        </div>
        ${n ? `<p class="note">اضغط على كل واحدة وعُدّ معي 👆</p><div class="frames">${tenFrame(n, emoji, true)}</div>` : `<p class="note">صفر يعني: لا شيء</p><div class="frames">${tenFrame(0, '', false)}</div>`}
      </div>
      <div class="nav">
        <button class="btn ghost round" data-go="num-l/${n ? n - 1 : 20}" aria-label="السابق">→</button>
        ${n < 10 ? `<button class="btn orange" data-go="trace/num/${n}">✍️ اكتب الرقم</button>` : '<span></span>'}
        <button class="btn ghost round" data-go="num-l/${n < 20 ? n + 1 : 0}" aria-label="التالي">←</button>
      </div>`;
    let count = 0;
    $$('.tf.obj', view).forEach((b) => (b.onclick = () => {
      if (b.classList.contains('on')) return;
      count++; b.classList.add('on'); b.insertAdjacentHTML('beforeend', `<b>${D(count)}</b>`);
      if (count === n) {
        play(['num/ar' + count, praise()]);
        const p = P();
        if ((p.boxes_num[n] || 0) < 1) { updBox('boxes_num', n, true); addStars(1); }
      } else play('num/ar' + count);
    }));
    play(n ? ['num/ar' + n, 'ui/count_me'] : 'num/ar0');
    markPlan('num', n);
  };

  /* ───────────── الكتابة بالإصبع ───────────── */
  routes.trace = (kind, i) => {
    i = +i || 0;
    const ch = kind === 'ar' ? C.ar_letters[i % 28].letter : kind === 'en' ? C.en_letters[i % 26].letter : D(Math.min(9, i));
    setTitle('اكتب ' + ch);
    view.innerHTML = `
      <p class="center note">مرّر إصبعك فوق الخط المنقّط 👆</p>
      <div class="trace-wrap"><canvas id="trBg"></canvas><canvas id="trInk"></canvas></div>
      <div class="result" id="trRes"></div>
      <div class="nav"><button class="btn ghost" id="trClear">🔄 من جديد</button><button class="btn" id="trDone">✅ خلصت</button></div>`;
    const bg = $('#trBg'), ink = $('#trInk');
    const size = bg.getBoundingClientRect().width, dpr = Math.min(2, window.devicePixelRatio || 1);
    [bg, ink].forEach((c) => { c.width = c.height = Math.round(size * dpr); });
    const W = bg.width, g = bg.getContext('2d'), x = ink.getContext('2d');
    const font = `800 ${Math.round(W * 0.62)}px "Baloo Bhaijaan 2", sans-serif`;
    const drawText = (ctx, fill, stroke) => {
      ctx.clearRect(0, 0, W, W); ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
      if (fill) { ctx.fillStyle = fill; ctx.fillText(ch, W / 2, W * 0.56); }
      if (stroke) { ctx.setLineDash([W / 50, W / 45]); ctx.lineWidth = W / 110; ctx.strokeStyle = stroke; ctx.strokeText(ch, W / 2, W * 0.56); ctx.setLineDash([]); }
    };
    const guide = () => drawText(g, '#e6f2ea', '#86bb9b');
    guide();
    if (document.fonts) document.fonts.load(font).then(guide).catch(() => {});
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = x.fillStyle = '#2bb673'; x.lineWidth = W * 0.075;
    let drawing = false, last = null;
    const pos = (e) => { const r = ink.getBoundingClientRect(); return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * W) / r.height]; };
    ink.onpointerdown = (e) => { drawing = true; ink.setPointerCapture(e.pointerId); last = pos(e); x.beginPath(); x.arc(last[0], last[1], x.lineWidth / 2, 0, 7); x.fill(); };
    ink.onpointermove = (e) => { if (!drawing) return; const p = pos(e); x.beginPath(); x.moveTo(last[0], last[1]); x.lineTo(p[0], p[1]); x.stroke(); last = p; };
    ink.onpointerup = ink.onpointercancel = () => { drawing = false; };
    $('#trClear').onclick = () => { x.clearRect(0, 0, W, W); $('#trRes').textContent = ''; };
    const grid = (src, N) => {
      const c = document.createElement('canvas'); c.width = c.height = N;
      const cx = c.getContext('2d'); cx.drawImage(src, 0, 0, N, N);
      const d = cx.getImageData(0, 0, N, N).data, out = new Uint8Array(N * N);
      for (let k = 0; k < N * N; k++) out[k] = d[k * 4 + 3] > 50 ? 1 : 0;
      return out;
    };
    $('#trDone').onclick = () => {
      const N = 64, solid = document.createElement('canvas'); solid.width = solid.height = W;
      drawText(solid.getContext('2d'), '#000', null);
      const mask = grid(solid, N), inkG = grid(ink, N);
      const s = SK.traceScore(mask, SK.dilate(inkG, N, 2), SK.dilate(mask, N, 4));
      const key = kind + i, p = P(), prev = p.traced[key] || 0;
      if (s.stars) {
        $('#trRes').textContent = '⭐'.repeat(s.stars);
        play(praise());
        p.traced[key] = Math.max(prev, s.stars); save();
        addStars(s.stars > prev ? s.stars - prev : 1);
        if (s.stars >= 2 && kind !== 'num') updBox(kind === 'ar' ? 'boxes_ar' : 'boxes_en', i, true);
      } else { $('#trRes').textContent = '🙂'; play('ui/again'); }
    };
    play('ui/trace');
  };

  /* ───────────── القرآن ───────────── */
  routes.quran = () => {
    setTitle('قرآني');
    const mem = P().memorized;
    view.innerHTML = Q.levels.map((lv) => `
      <div class="level"><h3>${esc(lv.title)}</h3><p>${esc(lv.hint)}</p>
        <div class="surahs">${lv.surahs.map((n) => { const s = Q.surahs[n]; return `<button class="surah ${mem[n] ? 'done' : ''}" data-go="surah/${n}"><span class="nm">${s.name}</span><span class="ct">${D(s.count)} آيات</span></button>`; }).join('')}</div>
      </div>`).join('') + '<p class="source">التلاوة من EveryAyah.com — المصحف المعلّم مخصوص لتعليم الأطفال</p>';
  };
  routes.surah = (n) => {
    const s = Q.surahs[n];
    if (!s) return go('quran');
    setTitle('سورة ' + s.name);
    const st = S.settings, mem = !!P().memorized[n];
    view.innerHTML = `
      <p class="idea">💡 ${esc(s.idea)}</p>
      <div class="qbar">
        <button class="btn" id="qPlay">▶️ استمع</button>
        <select id="qRep" aria-label="التكرار">${[1, 3, 5].map((r) => `<option value="${r}" ${+st.repeat === r ? 'selected' : ''}>كل آية × ${D(r)}</option>`).join('')}</select>
        <button class="toggle ${st.echo ? 'on' : ''}" id="qEcho">🗣️ وقت للترديد</button>
        <select id="qRec" aria-label="القارئ">${Q.reciters.map((r) => `<option value="${r.id}" ${st.reciter === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select>
      </div>
      <div class="mushaf">${+n !== 1 ? `<span class="basmala">${Q.basmala}</span>` : ''}${s.ayat.map((t, k) => `<span class="ayah" data-a="${k + 1}">${t} <span class="an">﴿${D(k + 1)}﴾</span></span> `).join('')}</div>
      <p class="note center">اضغط على أي آية لتسمع من عندها</p>
      <div class="nav"><button class="btn ghost" id="qSave">⤓ بدون نت</button><button class="btn ${mem ? '' : 'orange'}" id="qMem">${mem ? '✅ حفظتُها' : '⭐ حفظتُها'}</button></div>
      <p class="source">${esc(Q.source.name)} · التلاوة: EveryAyah.com</p>`;
    let queue = [], qi = 0, playing = false, timer = null;
    const clearHl = () => $$('.cur', view).forEach((e) => e.classList.remove('cur'));
    function hl(it) {
      clearHl();
      const el = it.basmala ? $('.basmala', view) : $(`.ayah[data-a="${it.a}"]`, view);
      if (el) { el.classList.add('cur'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }
    function next() {
      if (!playing) return;
      if (qi >= queue.length) { stop(); markPlan('surah', n); play(praise()); return; }
      const it = queue[qi];
      hl(it);
      QA.src = SK.ayahUrl(S.settings.reciter, it.s, it.a);
      QA.play().catch(() => stop('اضغط ▶️ مرة أخرى'));
    }
    function stop(msg) {
      playing = false; clearTimeout(timer); QA.pause(); clearHl();
      const b = $('#qPlay'); if (b) b.textContent = '▶️ استمع';
      if (msg) toast(msg);
    }
    QA.onended = () => {
      const done = queue[qi]; qi++;
      if (S.settings.echo && done && !done.basmala) timer = setTimeout(next, Math.min(15000, (QA.duration || 3) * 1000 + 600));
      else next();
    };
    QA.onerror = () => { if (playing) stop('تعذّر تحميل التلاوة — تأكد من الإنترنت أو احفظ السورة'); };
    function start(from) {
      stopAudio(); clearTimeout(timer);
      queue = SK.surahQueue(+n, s.count, +S.settings.repeat, from); qi = 0; playing = true;
      $('#qPlay').textContent = '⏸️ إيقاف'; next();
    }
    stopCurrent = () => stop();
    $('#qPlay').onclick = () => (playing ? stop() : start(1));
    $$('.ayah', view).forEach((el) => (el.onclick = () => start(+el.dataset.a)));
    $('#qRep').onchange = (e) => { S.settings.repeat = +e.target.value; save(); };
    $('#qEcho').onclick = (e) => { S.settings.echo = !S.settings.echo; e.currentTarget.classList.toggle('on', S.settings.echo); save(); };
    $('#qRec').onchange = (e) => { S.settings.reciter = e.target.value; save(); if (playing) start(queue[qi] && !queue[qi].basmala ? queue[qi].a : 1); };
    $('#qMem').onclick = (e) => {
      const p = P(), was = !!p.memorized[n];
      p.memorized[n] = !was; save();
      e.currentTarget.textContent = was ? '⭐ حفظتُها' : '✅ حفظتُها';
      e.currentTarget.classList.toggle('orange', was);
      if (!was) { if (!p.memorized['_' + n]) { p.memorized['_' + n] = 0; addStars(5); } markPlan('surah', n); play(praise()); }
    };
    $('#qSave').onclick = async (e) => {
      const b = e.currentTarget, rec = S.settings.reciter;
      const urls = (+n !== 1 ? [SK.ayahUrl(rec, 1, 1)] : []).concat(s.ayat.map((_, k) => SK.ayahUrl(rec, +n, k + 1)));
      try {
        const cache = await caches.open('sedra-quran');
        let k = 0;
        for (const u of urls) {
          if (!(await cache.match(u))) { const r = await fetch(u, { mode: 'cors' }); if (!r.ok) throw new Error(r.status); await cache.put(u, r); }
          b.textContent = `⤓ ${D(++k)} / ${D(urls.length)}`;
        }
        b.textContent = '✅ محفوظة بدون إنترنت';
      } catch (err) { b.textContent = '⚠️ تعذّر الحفظ — تأكد من الإنترنت'; }
    };
  };

  /* ───────────── القصص ───────────── */
  const KIND = { quran: ['من القرآن', ''], sunnah: ['من السنة', 'sunnah'], adab: ['حكاية تربوية', 'adab'] };
  routes.stories = () => {
    setTitle('حكايات');
    const read = P().stories;
    view.innerHTML = `<div class="list">${C.stories.map((s) => `
      <button class="item ${read[s.id] ? 'done' : ''}" data-go="story/${s.id}"><span class="emo">${s.emoji}</span>
        <span><span class="tt">${esc(s.title)}</span><span class="tag ${KIND[s.kind][1]}">${KIND[s.kind][0]}</span></span></button>`).join('')}</div>`;
  };
  routes.story = (id) => {
    const st = C.stories.find((x) => x.id === id);
    if (!st) return go('stories');
    setTitle(st.title);
    const total = st.parts.length + 2;
    let pg = 0, autoTimer = null;
    stopCurrent = () => clearTimeout(autoTimer);
    const advance = () => { clearTimeout(autoTimer); if (S.settings.auto && pg < total - 1) autoTimer = setTimeout(() => { pg++; paint(); }, 1400); };
    function paint() {
      clearTimeout(autoTimer); stopAudio();
      const dots = `<div class="dots">${Array.from({ length: total }, (_, k) => `<i class="${k === pg ? 'on' : ''}"></i>`).join('')}</div>`;
      let body = '', audio = null;
      if (pg < st.parts.length) {
        const part = st.parts[pg];
        if (part.quran) {
          body = `<div class="ayah-q">${part.quran}</div><div class="ref">﴿ ${esc(part.ref)} ﴾</div>
            <div class="center" style="margin-top:12px"><button class="btn" data-say="${SK.ayahUrl(S.settings.reciter, part.s, part.a)}">🔊 استمع للآية</button></div>`;
          audio = SK.ayahUrl(S.settings.reciter, part.s, part.a);
        } else {
          body = `<p class="story-text">${esc(part.text)}</p>`;
          audio = pg === 0 ? [`story/${id}_t`, `story/${id}_0`] : `story/${id}_${pg}`;
        }
        if (pg === 0) body = `<div class="story-emo">${st.emoji}</div><h2 class="center">${esc(st.title)}</h2>` + body;
      } else if (pg === st.parts.length) {
        body = `<div class="story-emo">💡</div><div class="lesson"><b>العبرة</b><br>${esc(st.lesson)}</div>
          ${st.surah ? `<div class="center" style="margin-top:14px"><button class="btn" data-go="surah/${st.surah}">📖 اسمع سورة ${Q.surahs[st.surah].name}</button></div>` : ''}
          <p class="source">📚 ${esc(st.source)}</p>`;
        audio = `story/${id}_l`;
      } else {
        const order = SK.shuffle(st.choices.map((c, k) => k), rnd);
        body = `<div class="story-emo">❓</div><p class="story-text">${esc(st.question)}</p>
          <div class="opts">${order.map((k) => `<button class="opt" data-k="${k}">${esc(st.choices[k])}</button>`).join('')}</div>`;
        audio = `story/${id}_q`;
      }
      view.innerHTML = `<div class="card story-page">${body}</div>${dots}
        <div class="nav"><button class="btn ghost round" id="sPrev" ${pg ? '' : 'disabled'} aria-label="السابق">→</button>
        <button class="toggle ${S.settings.auto ? 'on' : ''}" id="sAuto">▶ تلقائي</button>
        <button class="btn round" id="sNext" ${pg < total - 1 ? '' : 'disabled'} aria-label="التالي">←</button></div>`;
      $('#sPrev').onclick = () => { if (pg) { pg--; paint(); } };
      $('#sNext').onclick = () => { if (pg < total - 1) { pg++; paint(); } };
      $('#sAuto').onclick = (e) => { S.settings.auto = !S.settings.auto; save(); e.currentTarget.classList.toggle('on', S.settings.auto); if (S.settings.auto && !seq && player.paused) advance(); };
      let answered = false;
      $$('.opt', view).forEach((b) => (b.onclick = () => {
        if (answered) return;
        if (+b.dataset.k === st.answer) {
          answered = true; b.classList.add('ok');
          const p = P();
          if (!p.stories[id]) { p.stories[id] = 1; save(); addStars(3); } else celebrate();
          markPlan('story', id);
          play(praise());
        } else { b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 500); play('ui/again'); }
      }));
      play(audio, pg < st.parts.length ? advance : null);
    }
    paint();
  };

  /* ───────────── الأذكار · الآداب · ديني ───────────── */
  routes.duas = () => {
    setTitle('أذكاري');
    view.innerHTML = C.duas.map((x) => `
      <button class="card dua" data-say="dua/${x.id}" style="width:100%;text-align:start">
        <div class="when"><span class="emo">${x.emoji}</span>${esc(x.when)} <span style="margin-inline-start:auto">🔊</span></div>
        <div class="txt">${esc(x.text)}</div>${x.reply ? `<div class="reply">${esc(x.reply)}</div>` : ''}
        <div class="source" style="text-align:start">📚 ${esc(x.source)}</div></button>`).join('');
  };
  routes.adab = () => {
    setTitle('آدابي');
    view.innerHTML = C.adab.map((x) => `
      <button class="card dua" data-say="adab/${x.id}" style="width:100%;text-align:start">
        <div class="when"><span class="emo">${x.emoji}</span>${esc(x.title)} <span style="margin-inline-start:auto">🔊</span></div>
        <div class="txt" style="font-size:22px;color:inherit">${esc(x.text)}</div>
        <div class="hadith">${esc(x.hadith)}</div>
        <div class="source" style="text-align:start">📚 ${esc(x.source)}</div></button>`).join('');
  };
  routes.learn = () => {
    setTitle('ديني');
    const E = { islam: '☪️', iman: '💚', wudu: '💧', salah: '🕌' };
    view.innerHTML = `<div class="list">${C.learn.map((x) => `<button class="item" data-go="learn-i/${x.id}"><span class="emo">${E[x.id] || '📘'}</span><span><span class="tt">${esc(x.title)}</span><span class="st">${D(x.items.length)} خطوات</span></span></button>`).join('')}</div>`;
  };
  routes['learn-i'] = (id) => {
    const x = C.learn.find((y) => y.id === id);
    if (!x) return go('learn');
    setTitle(x.title);
    view.innerHTML = `<div class="center" style="margin-bottom:12px"><button class="btn" id="lAll">▶ استمع للكل</button></div>
      <div class="steps">${x.items.map((it, k) => `<button class="step" data-k="${k}"><span class="emo">${it[0]}</span><span><b>${esc(it[1])}</b><span>${esc(it[2])}</span></span></button>`).join('')}</div>
      <p class="source">📚 ${esc(x.source)}</p>`;
    const hl = (k) => { $$('.step', view).forEach((e, j) => e.classList.toggle('cur', j === k)); };
    $$('.step', view).forEach((b) => (b.onclick = () => { hl(+b.dataset.k); play(`learn/${id}_${b.dataset.k}`, () => hl(-1)); }));
    $('#lAll').onclick = () => {
      let k = 0;
      const one = () => { if (k >= x.items.length) { hl(-1); return; } hl(k); const el = $$('.step', view)[k]; if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); play(`learn/${id}_${k++}`, one); };
      one();
    };
  };

  /* ───────────── ألوان وأشكال ───────────── */
  const SHAPE_SVG = {
    circle: '<circle cx="50" cy="50" r="40"/>',
    square: '<rect x="14" y="14" width="72" height="72" rx="4"/>',
    triangle: '<polygon points="50,10 92,88 8,88"/>',
    rectangle: '<rect x="5" y="27" width="90" height="46" rx="4"/>',
    star: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38"/>',
    heart: '<path d="M50 90C22 68 6 52 6 32A22 22 0 0 1 50 22A22 22 0 0 1 94 32C94 52 78 68 50 90Z"/>',
  };
  const shapeSvg = (k, color) => `<svg viewBox="0 0 100 100" class="shp" aria-hidden="true"><g fill="${color || '#3a8dde'}">${SHAPE_SVG[C.shapes[k].id]}</g></svg>`;
  const swatch = (k) => `<span class="swatch" style="background:${C.colors[k].hex}"></span>`;
  routes.colors = () => {
    setTitle('ألوان وأشكال');
    view.innerHTML = `
      <div class="row-title">الألوان — Colors</div>
      <div class="grid cs">${C.colors.map((c, k) => `<button class="cell" data-say="color/ar${k}|color/en${k}">${swatch(k)}<span class="e">${esc(c.ar)}</span><span class="e" dir="ltr">${c.en}</span></button>`).join('')}</div>
      <div class="row-title">الأشكال — Shapes</div>
      <div class="grid cs">${C.shapes.map((s, k) => `<button class="cell" data-say="shape/ar${k}|shape/en${k}">${shapeSvg(k)}<span class="e">${esc(s.ar)}</span><span class="e" dir="ltr">${s.en}</span></button>`).join('')}</div>
      <div class="row-title">العب</div><div class="list">${['color', 'shape'].map(gameItem).join('')}</div>`;
  };

  /* ───────────── أنا وعالمي: المشاعر والحصيلة اللغوية ───────────── */
  routes.world = () => {
    setTitle('أنا وعالمي');
    view.innerHTML = `
      <div class="row-title">😊 مشاعري</div>
      <div class="grid cs">${C.emotions.map((e) => `<button class="cell" data-emo="${e.id}"><span class="bigc">${e.emoji}</span><span class="e">${esc(e.ar)}</span><span class="e" dir="ltr">${esc(e.en)}</span></button>`).join('')}</div>
      <p class="note center tip" id="emoTip">اضغط على الوجه لتعرف ماذا تفعل حين تشعر به 💛</p>
      ${C.world.map((g) => `<div class="row-title">${g.icon} ${esc(g.title)}</div>
        <div class="grid cs">${g.items.map((it, k) => `<button class="cell" data-say="wld/${g.id}_${k}|wld/${g.id}_${k}e"><span class="bigc">${it[0]}</span><span class="e">${esc(it[1])}</span><span class="e" dir="ltr">${esc(it[2])}</span></button>`).join('')}</div>`).join('')}
      <div class="row-title">العب</div><div class="list">${['emo', 'oppo', 'space', 'sort', 'shadow'].map(gameItem).join('')}</div>`;
    $$('[data-emo]', view).forEach((b) => (b.onclick = () => {
      const e = C.emotions.find((x) => x.id === b.dataset.emo);
      $$('[data-emo]', view).forEach((o) => o.classList.toggle('cur', o === b));
      $('#emoTip').textContent = e.tip;
      play([`emo/${e.id}`, `emo/${e.id}_t`]);
    }));
  };

  /* ───────────── الألعاب ───────────── */
  routes.games = () => {
    setTitle('ألعاب ومهارات');
    const areas = gameAreas();
    view.innerHTML = Object.entries(AREAS).map(([a, t]) => `<div class="row-title">${t}</div><div class="list">${areas[a].map(gameItem).join('')}</div>`).join('');
  };
  const letterBtn = (i) => C.ar_letters[i].letter;
  const FORM_AR = { start: 'في أوّل الكلمة', middle: 'في وسط الكلمة', end: 'في آخر الكلمة' };
  const wordOpt = (emo, w) => `<span class="big-emo">${emo}</span><span class="cap">${esc(w)}</span>`;
  const oppSide = (p, s) => (s ? { w: C.opposites[p].o, e: C.opposites[p].oe, a: `opp/${p}b` }
    : { w: C.opposites[p].w, e: C.opposites[p].e, a: `opp/${p}a` });
  const scene = (id) => `<span class="scene s-${id}"><span class="bx"></span><span class="bl">⚽</span></span>`;
  let _shadow = null;
  const shadowPool = () => (_shadow || (_shadow = C.categories.flatMap((c) => c.items)));
  // الجمع والطرح بالصور دائماً: الطفل يعدّ ما يراه قبل أن يحفظ الناتج
  function arithQ(sub) {
    const s = SK.makeArith(rnd, sub, 10), e = C.count_emoji[Math.floor(rnd() * C.count_emoji.length)];
    const run = (k, gone) => Array.from({ length: k }, () => `<span class="${gone ? 'gone' : ''}">${e}</span>`).join('');
    const pic = sub
      ? `<span class="count">${run(s.a - s.b)}${run(s.b, true)}</span>`
      : `<span class="count">${run(s.a)}</span><b class="op">+</b><span class="count">${run(s.b)}</span>`;
    return { key: s.a * 100 + s.b, cls: 'four',
      prompt: `<div class="sum">${pic}</div><div class="eq">${[D(s.a), sub ? '−' : '+', D(s.b), '=', '❓'].map((x) => `<span>${x}</span>`).join('')}</div>`,
      audio: ['ui/' + (sub ? 'sub' : 'add')], after: 'num/ar' + s.answer,
      options: s.options.map((x) => ({ html: D(x), correct: x === s.answer })) };
  }
  const MAKE = {
    ar(last) {
      const t = SK.nextTarget(28, P().boxes_ar, rnd, last);
      return { key: t, box: ['boxes_ar', t], cls: 'four', prompt: '<div class="pic">👂</div>', audio: ['ui/where_ar', 'arn/' + t],
        options: SK.pickOptions(t, 28, 4, rnd).map((i) => ({ html: letterBtn(i), correct: i === t })) };
    },
    fam(last) {
      const t = SK.nextTarget(28, P().boxes_ar, rnd, last);
      return { key: t, box: ['boxes_ar', t], cls: 'four', prompt: '<div class="pic">🔍</div>', audio: ['ui/where_ar', 'arn/' + t],
        options: SK.familyOptions(t, C.ar_families, 28, 4, rnd).map((i) => ({ html: letterBtn(i), correct: i === t })) };
    },
    syl(last) {
      const t = SK.nextTarget(28, P().boxes_ar, rnd, last), h = Math.floor(rnd() * 3);
      return { key: t, cls: 'three', prompt: `<div class="pic">🎵</div><div class="note">${esc(C.ar_letters[t].name)}</div>`, audio: ['ui/which_haraka', `syl/${t}_${h}`],
        options: SK.shuffle([0, 1, 2], rnd).map((k) => ({ html: C.ar_letters[t].harakat[k], correct: k === h })) };
    },
    pic(last) {
      const t = SK.nextTarget(28, P().boxes_ar, rnd, last), L = C.ar_letters[t];
      return { key: t, box: ['boxes_ar', t], cls: 'four', prompt: `<div class="pic">${L.emoji}</div>`, audio: ['ui/starts'], after: 'ar/' + t,
        options: SK.pickOptions(t, 28, 4, rnd).map((i) => ({ html: letterBtn(i), correct: i === t })) };
    },
    en(last) {
      const t = SK.nextTarget(26, P().boxes_en, rnd, last);
      return { key: t, box: ['boxes_en', t], cls: 'four ltr', prompt: '<div class="pic">👂</div>', audio: ['ui/where_en', 'enn/' + t],
        options: SK.pickOptions(t, 26, 4, rnd).map((i) => ({ html: C.en_letters[i].letter + C.en_letters[i].lower, correct: i === t })) };
    },
    num(last) {
      const boxes = {}; for (let k = 0; k < 10; k++) boxes[k] = P().boxes_num[k + 1] || 0;
      const n = SK.nextTarget(10, boxes, rnd, last == null ? -1 : last - 1) + 1, emoji = C.count_emoji[Math.floor(rnd() * C.count_emoji.length)];
      return { key: n, box: ['boxes_num', n], cls: 'four', prompt: `<div class="frames">${tenFrame(n, emoji, false)}</div>`, audio: ['ui/how_many'], after: 'num/ar' + n,
        options: SK.pickOptions(n - 1, 10, 4, rnd).map((i) => ({ html: D(i + 1), correct: i + 1 === n })) };
    },
    flash(last) {
      let n; do { n = 1 + Math.floor(rnd() * 6); } while (n === last);
      const dots = (k) => `<div class="dice">${Array.from({ length: 9 }, (_, j) => `<span>${SK.diceLayout(k).includes(j) ? '🔵' : ''}</span>`).join('')}</div>`;
      return { key: n, cls: 'four', prompt: `<div id="flashBox">${dots(n)}</div>`, audio: ['ui/flash'], after: 'num/ar' + n,
        onShow(again) { const box = $('#flashBox'); box.innerHTML = dots(n); clearTimeout(this.t); this.t = setTimeout(() => { if (box.isConnected) box.innerHTML = '<div class="pic">❓</div>'; }, 1500); if (!again) play('ui/flash'); },
        options: SK.pickOptions(n - 1, 6, 4, rnd).map((i) => ({ html: D(i + 1), correct: i + 1 === n })) };
    },
    more() {
      const a = 1 + Math.floor(rnd() * 9); let b; do { b = 1 + Math.floor(rnd() * 9); } while (Math.abs(a - b) < 1);
      const e = C.count_emoji[Math.floor(rnd() * C.count_emoji.length)];
      const grp = (k) => `<span class="count">${Array.from({ length: k }, () => `<span>${e}</span>`).join('')}</span>`;
      return { key: a * 10 + b, cls: 'two', prompt: '<div class="pic">⚖️</div>', audio: ['ui/more'],
        options: [{ html: grp(a), correct: a > b }, { html: grp(b), correct: b > a }] };
    },
    seq() {
      const s = SK.makeSequence(rnd, 20);
      return { key: s.answer, cls: 'four', prompt: `<div class="seq">${s.items.map((x) => `<span class="${x === null ? 'hole' : ''}">${x === null ? '؟' : D(x)}</span>`).join('')}</div>`,
        audio: ['ui/next_num'], after: 'num/ar' + s.answer, options: s.options.map((x) => ({ html: D(x), correct: x === s.answer })) };
    },
    odd(last) {
      let k; do { k = Math.floor(rnd() * C.odd_sets.length); } while (k === last && C.odd_sets.length > 1);
      const set = C.odd_sets[k];
      return { key: k, cls: 'four', prompt: '<div class="pic">🧐</div>', audio: ['ui/odd'],
        options: SK.shuffle([0, 1, 2, 3], rnd).map((j) => ({ html: set.items[j], correct: j === 3 })) };
    },
    pattern() {
      const p = SK.makePattern(rnd, C.pattern_pool);
      return { key: p.shown.join(''), cls: p.options.length === 4 ? 'four' : 'three', prompt: `<div class="seq pat">${p.shown.map((x) => `<span>${x}</span>`).join('')}<span class="hole">❓</span></div>`,
        audio: ['ui/pattern'], options: p.options.map((x) => ({ html: x, correct: x === p.answer })) };
    },
    color(last) {
      let t; do { t = Math.floor(rnd() * C.colors.length); } while (t === last);
      return { key: t, cls: 'four', prompt: '<div class="pic">🎨</div>', audio: ['ui/where_color', 'color/ar' + t], after: 'color/en' + t,
        options: SK.pickOptions(t, C.colors.length, 4, rnd).map((i) => ({ html: swatch(i), correct: i === t })) };
    },
    shape(last) {
      let t; do { t = Math.floor(rnd() * C.shapes.length); } while (t === last);
      const col = ['#3a8dde', '#e8564f', '#2bb673', '#f59e2b'];
      return { key: t, cls: 'four', prompt: '<div class="pic">🔷</div>', audio: ['ui/where_shape', 'shape/ar' + t], after: 'shape/en' + t,
        options: SK.pickOptions(t, C.shapes.length, 4, rnd).map((i, j) => ({ html: shapeSvg(i, col[j]), correct: i === t })) };
    },
    rhyme() {
      const r = SK.makeRhyme(rnd, C.rhymes.length), w = C.rhymes[r.p][r.s];
      return { key: r.p * 2 + r.s, cls: 'three', prompt: `<div class="pic">${w.e}</div><div class="qword">${esc(w.w)}</div>`,
        audio: ['ui/rhyme', `rhy/${r.p}_${r.s}`], after: `rhy/${r.p}_${1 - r.s}`,
        options: r.options.map((o) => ({ html: wordOpt(C.rhymes[o.p][o.s].e, C.rhymes[o.p][o.s].w), correct: o.correct })) };
    },
    form(last) {
      const t = SK.nextTarget(28, P().boxes_ar, rnd, last), f = SK.pickForm(rnd), L = C.ar_letters[t];
      return { key: t, box: ['boxes_ar', t], cls: 'four',
        prompt: `<div class="pic formg">${L.forms[f]}</div><div class="note">${FORM_AR[f]}</div>`,
        audio: ['ui/what_letter'], after: 'arn/' + t,
        options: SK.familyOptions(t, C.ar_families, 28, 4, rnd).map((i) => ({ html: letterBtn(i), correct: i === t })) };
    },
    add() { return arithQ(false); },
    sub() { return arithQ(true); },
    size(last) {
      const s = SK.makeSize(rnd), e = C.count_emoji[Math.floor(rnd() * C.count_emoji.length)];
      const k = (s.big ? 'b' : 's') + e;
      if (k === last) return MAKE.size(null);
      return { key: k, cls: 'four', prompt: '<div class="pic">📐</div>', audio: ['ui/' + (s.big ? 'size_big' : 'size_small')],
        options: s.options.map((o) => ({ html: `<span class="zoom" style="font-size:${(o.z * 2.4).toFixed(2)}rem">${e}</span>`, correct: o.correct })) };
    },
    sort(last) {
      let s; do { s = SK.makeSort(rnd, C.categories.map((c) => c.items.length)); } while (s.c === last && C.categories.length > 1);
      const cat = C.categories[s.c];
      return { key: s.c, cls: 'four', prompt: `<div class="pic">${cat.icon}</div><div class="qword">${esc(cat.ar)}</div>`,
        audio: ['ui/sort', 'cat/' + s.c],
        options: s.options.map((o) => ({ html: `<span class="big-emo">${C.categories[o.c].items[o.k]}</span>`, correct: o.correct })) };
    },
    shadow(last) {
      const pool = shadowPool();
      let s; do { s = SK.makeShadow(rnd, pool.length); } while (s.t === last);
      return { key: s.t, cls: 'four', prompt: `<div class="pic shadow">${pool[s.t]}</div>`, audio: ['ui/shadow'],
        options: s.options.map((o) => ({ html: `<span class="big-emo">${pool[o.i]}</span>`, correct: o.correct })) };
    },
    oppo(last) {
      let r; do { r = SK.makeOpposite(rnd, C.opposites.length); } while (r.p === last && C.opposites.length > 1);
      const q = oppSide(r.p, r.s);
      return { key: r.p, cls: 'three', prompt: `<div class="pic">${q.e}</div><div class="qword">${esc(q.w)}</div>`,
        audio: ['ui/opposite', q.a], after: oppSide(r.p, 1 - r.s).a,
        options: r.options.map((o) => { const x = oppSide(o.p, o.s); return { html: wordOpt(x.e, x.w), correct: o.correct }; }) };
    },
    space(last) {
      let s; do { s = SK.makeSpatial(rnd, C.spatial.length); } while (s.t === last && C.spatial.length > 1);
      return { key: s.t, cls: 'four', prompt: '<div class="pic">⚽</div>', audio: ['ui/where_ball', 'spa/' + C.spatial[s.t].id],
        options: s.options.map((o) => ({ html: scene(C.spatial[o.i].id), correct: o.correct })) };
    },
    emo(last) {
      const n = C.emotions.length;
      let t; do { t = Math.floor(rnd() * n); } while (t === last && n > 1);
      return { key: t, cls: 'four', prompt: '<div class="pic">❓</div>', audio: ['ui/how_feel', 'emo/' + C.emotions[t].id],
        options: SK.pickOptions(t, n, 4, rnd).map((i) => ({ html: wordOpt(C.emotions[i].emoji, C.emotions[i].ar), correct: i === t })) };
    },
  };

  function finishRound(id, correct) {
    const stars = SK.roundStars(correct, ROUND), p = P();
    const rec = p.games[id] || { plays: 0, best: 0 };
    p.games[id] = { plays: rec.plays + 1, best: Math.max(rec.best, stars) }; save();
    addStars(stars); markPlan('game', id);
    view.innerHTML = `<div class="card center"><div class="story-emo">🎉</div><h2>${correct === ROUND ? 'ممتاز!' : 'أحسنت!'}</h2>
      <div class="result">${'⭐'.repeat(stars)}</div><p class="note">${D(correct)} من ${D(ROUND)} من أول مرة</p></div>
      <div class="nav"><button class="btn" data-go="game/${id}">🔄 العب مرة أخرى</button><button class="btn ghost" data-go="games">🎮 ألعاب أخرى</button></div>`;
    play(praise());
  }

  routes.game = (id) => {
    const G = GAMES[id];
    if (!G) return go('games');
    setTitle(G.title);
    if (id === 'memory') return memoryGame();
    if (id === 'build' || id === 'spell') return buildGame(id === 'build' ? 'ar' : 'en');
    let q = 0, correct = 0, cur = null, last = null, firstTry = true, busy = false, t = null;
    stopCurrent = () => { clearTimeout(t); if (cur && cur.t) clearTimeout(cur.t); };
    function nextQ() {
      if (q >= ROUND) return finishRound(id, correct);
      firstTry = true; busy = false;
      cur = MAKE[id](last); last = cur.key;
      view.innerHTML = `<div class="progress"><i style="width:${(q / ROUND) * 100}%"></i></div>
        <div class="card center prompt">${cur.prompt}<button class="btn ghost" id="again">🔊 اسمع مرة أخرى</button></div>
        <div class="opts ${cur.cls || ''}">${cur.options.map((o, k) => `<button class="opt" data-k="${k}">${o.html}</button>`).join('')}</div>`;
      $('#again').onclick = () => { play(cur.audio); if (cur.onShow) cur.onShow(true); };
      $$('.opt', view).forEach((b) => (b.onclick = () => answer(+b.dataset.k, b)));
      if (cur.onShow) cur.onShow(false); else play(cur.audio);
    }
    function answer(k, b) {
      if (busy) return;
      const ok = cur.options[k].correct;
      if (cur.box && firstTry) updBox(cur.box[0], cur.box[1], ok);
      if (ok) {
        busy = true; b.classList.add('ok');
        if (firstTry) correct++;
        q++;
        const done = () => { t = setTimeout(nextQ, 500); };
        play([cur.after, praise()].filter(Boolean), done);
      } else {
        firstTry = false; b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 500);
        play(['ui/again'].concat(cur.audio));
      }
    }
    nextQ();
  };

  function memoryGame() {
    const rec = P().games.memory, pairs = rec && rec.best >= 2 ? 6 : 4;
    const deck = SK.memoryDeck(pairs, 28, rnd);
    let open = [], matched = 0, moves = 0, lock = false;
    view.innerHTML = `<p class="center note">اقلب بطاقتين: الحرف وصورته 🃏</p>
      <div class="memory ${pairs > 4 ? 'm6' : ''}">${deck.map((c, k) => `<button class="mcard" data-k="${k}" aria-label="بطاقة"><span class="back">❓</span><span class="front">${c.face === 'a' ? C.ar_letters[c.i].letter : C.ar_letters[c.i].emoji}</span></button>`).join('')}</div>`;
    play('ui/memory');
    $$('.mcard', view).forEach((b) => (b.onclick = () => {
      const c = deck[+b.dataset.k];
      if (lock || b.classList.contains('flip')) return;
      b.classList.add('flip'); open.push([b, c]);
      if (c.face === 'a') play('arn/' + c.i);
      if (open.length < 2) return;
      moves++;
      const [[b1, c1], [b2, c2]] = open; open = [];
      if (c1.i === c2.i) {
        b1.classList.add('ok'); b2.classList.add('ok'); matched++;
        updBox('boxes_ar', c1.i, true);
        play('ar/' + c1.i, matched === pairs ? () => memoryDone() : null);
      } else { lock = true; setTimeout(() => { b1.classList.remove('flip'); b2.classList.remove('flip'); lock = false; }, 1000); }
    }));
    function memoryDone() {
      const stars = SK.memoryStars(moves, pairs), p = P(), r = p.games.memory || { plays: 0, best: 0 };
      p.games.memory = { plays: r.plays + 1, best: Math.max(r.best, stars) }; save();
      addStars(stars); markPlan('game', 'memory');
      view.innerHTML = `<div class="card center"><div class="story-emo">🎉</div><h2>أحسنت!</h2><div class="result">${'⭐'.repeat(stars)}</div><p class="note">${D(moves)} محاولة</p></div>
        <div class="nav"><button class="btn" data-go="game/memory">🔄 مرة أخرى</button><button class="btn ghost" data-go="games">🎮 ألعاب أخرى</button></div>`;
      play(praise());
    }
  }

  function buildGame(lang) {
    const id = lang === 'ar' ? 'build' : 'spell', words = lang === 'ar' ? C.ar_words : C.en_words;
    const order = SK.shuffle(words.map((_, k) => k), rnd).slice(0, ROUND);
    let q = 0, correct = 0;
    function paint() {
      if (q >= ROUND) return finishRound(id, correct);
      const W = words[order[q]], say = `word/${lang}${order[q]}`;
      let pos = 0, mistakes = 0;
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      view.innerHTML = `<div class="progress"><i style="width:${(q / ROUND) * 100}%"></i></div>
        <div class="card center prompt"><div class="pic">${W.emoji}</div>
          <div class="slots" dir="${dir}">${W.letters.map((_, k) => `<span class="slot" data-s="${k}"></span>`).join('')}</div>
          <div class="built" id="built"></div><button class="btn ghost" data-say="${say}">🔊 اسمع</button></div>
        <div class="opts four ${lang === 'en' ? 'ltr' : ''}" dir="${dir}">${SK.shuffle(W.letters, rnd).map((l) => `<button class="opt" data-l="${esc(l)}">${esc(l)}</button>`).join('')}</div>`;
      play([lang === 'ar' ? 'ui/build' : 'ui/spell_en', say]);
      $$('.opt', view).forEach((b) => (b.onclick = () => {
        if (b.disabled || pos >= W.letters.length) return;
        if (b.dataset.l === W.letters[pos]) {
          b.disabled = true; b.classList.add('ok');
          $(`.slot[data-s="${pos}"]`, view).textContent = W.letters[pos];
          const li = lang === 'ar' ? C.ar_letters.findIndex((L) => L.letter === W.letters[pos]) : W.letters[pos].toUpperCase().charCodeAt(0) - 65;
          pos++;
          if (pos === W.letters.length) {
            if (!mistakes) correct++;
            $('#built').textContent = W.word;
            play([say, praise()], () => { q++; setTimeout(paint, 400); });
          } else play((lang === 'ar' ? 'arn/' : 'enn/') + li);
        } else { mistakes++; b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 500); play('ui/again'); }
      }));
    }
    paint();
  }

  /* ───────────── الملصقات ───────────── */
  routes.stickers = () => {
    setTitle('ملصقاتي');
    const stars = P().stars, got = SK.stickersUnlocked(stars, STICKERS.length);
    const nextIn = got >= STICKERS.length ? 0 : SK.STAR_PER_STICKER - (stars % SK.STAR_PER_STICKER);
    view.innerHTML = `<div class="card center"><div class="result">⭐ ${D(stars)}</div>
      <p>${got >= STICKERS.length ? 'جمعتَ كل الملصقات! 🏆' : `باقي ${D(nextIn)} نجوم للملصق الجديد`}</p>
      <div class="progress"><i style="width:${got >= STICKERS.length ? 100 : ((SK.STAR_PER_STICKER - nextIn) / SK.STAR_PER_STICKER) * 100}%"></i></div></div>
      <div class="stickers">${STICKERS.map((s, k) => `<div class="stk ${k < got ? '' : 'locked'}">${k < got ? s : '🔒'}</div>`).join('')}</div>`;
  };

  /* ───────────── ركن الأهل (خلف بوابة) ───────────── */
  let parentUntil = 0;
  function gate(onOk) {
    if (Date.now() < parentUntil) return onOk();
    const q = SK.gateQuestion(rnd);
    let v = '';
    view.innerHTML = `<div class="card center"><p style="font-size:24px">🔒 هذا الركن للأهل</p><p class="note">أجب عن السؤال للدخول</p>
      <div class="gate-q">${q.a} × ${q.b} = ?</div><div class="gate-in" id="gin">&nbsp;</div>
      <div class="pad" dir="ltr">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((x) => `<button data-p="${x}">${x}</button>`).join('')}</div></div>`;
    $$('[data-p]', view).forEach((b) => (b.onclick = () => {
      const x = b.dataset.p;
      if (x === '⌫') v = v.slice(0, -1);
      else if (x === '✓') { if (SK.gateCheck(q, v)) { parentUntil = Date.now() + 10 * 60e3; onOk(); return; } v = ''; $('#gin').textContent = '✗'; return; }
      else if (v.length < 3) v += x;
      $('#gin').textContent = v || ' ';
    }));
  }
  routes.parents = () => { setTitle('ركن الأهل'); gate(parentsPanel); };
  function parentsPanel() {
    const day = SK.dateKey(new Date()), used = Math.round(((S.usage || {})[day] || 0) / 60);
    const counts = { ar: 28, en: 26, num: 20, surahs: surahOrder().length, stories: C.stories.length, gameAreas: gameAreas() };
    const bar = (label, pct, txt) => `<div class="bar"><span>${label}</span><div class="progress"><i style="width:${pct}%"></i></div><b>${txt}</b></div>`;
    view.innerHTML = `
      <div class="card"><h3>👧 الأطفال</h3>
        ${S.profiles.map((k) => `<div class="kid-row">
          <input class="txt" data-name="${k.id}" value="${esc(k.name)}" placeholder="اسم الطفل" maxlength="20">
          <div class="avs">${AVATARS.map((a) => `<button data-av="${k.id}|${a}" class="${k.avatar === a ? 'on' : ''}">${a}</button>`).join('')}</div>
          ${S.profiles.length > 1 ? `<button class="btn ghost" data-del="${k.id}">حذف</button>` : ''}</div>`).join('')}
        ${S.profiles.length < 4 ? '<div class="form-row"><button class="btn ghost" id="addKid">➕ إضافة طفل</button></div>' : ''}
      </div>
      ${S.profiles.map((k) => {
        const p = S.prog[k.id] || {}, s = SK.progressSummary(p, counts);
        return `<div class="card"><h3>${k.avatar} تقدّم ${esc(k.name || 'الطفل')} — ⭐ ${D(s.stars)}</h3>
          ${bar('الحروف العربية', s.pct.ar, `${D(s.ar)}/${D(28)}`)}${bar('English', s.pct.en, `${D(s.en)}/${D(26)}`)}
          ${bar('الأرقام ١–٢٠', s.pct.num, `${D(s.num)}/${D(20)}`)}${bar('السور المحفوظة', s.pct.surahs, `${D(s.surahs)}/${D(counts.surahs)}`)}
          ${bar('القصص', s.pct.stories, `${D(s.stories)}/${D(counts.stories)}`)}
          <p class="note">جولات الألعاب: ${Object.entries(AREAS).map(([a, t]) => `${t} ${D(s.areaPlays[a] || 0)}`).join(' · ')}</p>
          <p class="note">«متقَن» = ٣ إجابات صحيحة متتالية من أول مرة. الحرف الذي يخطئ فيه الطفل يعود له أكثر تلقائياً.</p></div>`;
      }).join('')}
      <div class="card"><h3>⏰ وقت الشاشة</h3>
        <div class="form-row"><label>الحد اليومي</label><select class="txt" id="limit">${[[0, 'بلا حد'], [15, '١٥ دقيقة'], [20, '٢٠ دقيقة'], [30, '٣٠ دقيقة'], [45, '٤٥ دقيقة'], [60, 'ساعة']].map(([v, t]) => `<option value="${v}" ${+S.settings.limitMin === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <p class="note">استُخدم اليوم: ${D(used)} دقيقة. عند انتهاء الوقت تظهر شاشة «وقت الراحة».</p>
        <button class="btn ghost" id="bonus">➕ ١٠ دقائق إضافية اليوم</button></div>
      <div class="card"><h3>⚙️ إعدادات</h3>
        <div class="form-row"><label>الصوت</label><button class="toggle ${S.settings.sound ? 'on' : ''}" id="sound">${S.settings.sound ? '🔊 مفعّل' : '🔇 مغلق'}</button></div>
        <div class="form-row"><label>سرعة الكلام</label><select class="txt" id="speed">${[[0.8, '🐢 بطيء — للمبتدئ'], [0.9, 'أهدأ قليلاً'], [1, '🙂 عادي'], [1.1, 'أسرع قليلاً'], [1.2, '🐇 سريع — للمتقن']].map(([v, t]) => `<option value="${v}" ${(+S.settings.speed || 1) === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="form-row"><label>القارئ</label><select class="txt" id="rec">${Q.reciters.map((r) => `<option value="${r.id}" ${S.settings.reciter === r.id ? 'selected' : ''}>${esc(r.name)} — ${esc(r.note)}</option>`).join('')}</select></div>
        <div class="form-row"><button class="btn ghost" id="reset">🗑️ تصفير تقدّم ${esc(kid().name || 'الطفل الحالي')}</button></div></div>
      <div class="card"><h3>📚 منهجنا</h3>
        <p class="note">القراءة: القاعدة النورانية (الحرف ← الحركة ← المقطع ← الكلمة) والحروف المتشابهة معاً وشكل الحرف في أول الكلمة ووسطها وآخرها والوعي الصوتي بالقافية · الإنجليزي: Phonics · الأرقام: الإطار العشري وإدراك الكمية بلا عدّ ثم الجمع والطرح ضمن ١٠ بالصور · التفكير: التصنيف والأنماط والظل والحجم · أنا وعالمي: المشاعر وماذا أفعل حين أشعر بها، والأضداد، والمفاهيم المكانية، والحصيلة اللغوية بالعربي والإنجليزي · التعلّم التكيّفي: «رحلة اليوم» تُبنى لكل طفل من أضعف ما عنده.</p>
        <p class="note">القرآن: الرسم العثماني برواية حفص، والتلاوة بصوت قرّاء حقيقيين (EveryAyah). القصص بمواضعها من القرآن وتخريج أحاديثها، والحكاية التربوية مُعلَّمة بذلك.</p>
        <p class="note">🔐 بلا إعلانات ولا حسابات. كل التقدّم على هذا الجهاز فقط، ولا يُرسل شيء. الاتصال الخارجي الوحيد: تحميل التلاوة. <a href="privacy.html">الخصوصية</a></p></div>`;
    $$('[data-name]', view).forEach((i) => (i.onchange = () => { S.profiles.find((k) => k.id === i.dataset.name).name = i.value.trim().slice(0, 20); save(); }));
    $$('[data-av]', view).forEach((b) => (b.onclick = () => { const [id, a] = b.dataset.av.split('|'); S.profiles.find((k) => k.id === id).avatar = a; save(); parentsPanel(); }));
    $$('[data-del]', view).forEach((b) => (b.onclick = () => {
      if (!confirm('حذف الطفل وتقدّمه؟')) return;
      S.profiles = S.profiles.filter((k) => k.id !== b.dataset.del); delete S.prog[b.dataset.del];
      if (!S.profiles.find((k) => k.id === S.active)) S.active = S.profiles[0].id;
      save(); paintStars(); parentsPanel();
    }));
    const add = $('#addKid');
    if (add) add.onclick = () => { const id = 'p' + Date.now().toString(36); S.profiles.push({ id, name: '', avatar: AVATARS[S.profiles.length % AVATARS.length] }); save(); parentsPanel(); };
    $('#limit').onchange = (e) => { S.settings.limitMin = +e.target.value; save(); };
    $('#bonus').onclick = () => { const b = S.bonus && S.bonus.day === day ? S.bonus.min : 0; S.bonus = { day, min: b + 10 }; save(); toast('تمت إضافة ١٠ دقائق لليوم'); };
    $('#sound').onclick = () => { S.settings.sound = !S.settings.sound; save(); parentsPanel(); };
    $('#speed').onchange = (e) => { S.settings.speed = +e.target.value; save(); play('ui/welcome'); };
    $('#rec').onchange = (e) => { S.settings.reciter = e.target.value; save(); };
    $('#reset').onclick = () => { if (confirm('تصفير كل النجوم والتقدّم لهذا الطفل؟')) { delete S.prog[kid().id]; save(); paintStars(); parentsPanel(); } };
  }

  /* ───────────── وقت الشاشة ───────────── */
  let lastTick = Date.now();
  const onParents = () => location.hash.startsWith('#parents');
  function checkTime() {
    const day = SK.dateKey(new Date()), bonus = S.bonus && S.bonus.day === day ? S.bonus.min : 0;
    const rem = SK.remainingSeconds(S.usage, day, +S.settings.limitMin, bonus);
    const r = $('#rest');
    if (rem <= 0 && !onParents()) {
      if (!r) {
        stopAll();
        const d = document.createElement('div');
        d.id = 'rest'; d.className = 'rest';
        d.innerHTML = '<div class="moon">🌙</div><h2>وقت الراحة</h2><p>تعلّمنا كثيراً اليوم! نكمل غداً إن شاء الله</p><p>العب بالخارج، أو اقرأ مع ماما وبابا 📚</p><button class="btn ghost" id="restP">🔒 للأهل</button>';
        document.body.appendChild(d);
        play('ui/rest');
        $('#restP').onclick = () => { d.remove(); go('parents'); };
      }
    } else if (r) r.remove();
  }
  setInterval(() => {
    const now = Date.now(), dt = Math.min(60, (now - lastTick) / 1000);
    lastTick = now;
    if (document.visibilityState !== 'visible' || onParents() || !C) return;
    S.usage = SK.addUsage(S.usage, SK.dateKey(new Date()), dt); save(); checkTime();
  }, 15000);
  document.addEventListener('visibilitychange', () => { lastTick = Date.now(); if (document.visibilityState !== 'visible') stopAll(); });

  /* ───────────── الإقلاع ───────────── */
  async function boot() {
    try {
      const [c, q] = await Promise.all([fetch('data/content.json').then((r) => r.json()), fetch('data/quran.json').then((r) => r.json())]);
      C = c; Q = q;
    } catch (e) {
      view.innerHTML = '<div class="card center">تعذّر تحميل المحتوى — افتح التطبيق من رابطه لا من الملف مباشرة</div>';
      return;
    }
    paintStars();
    render();
    // على جهاز التطوير لا عامل خدمة — وإلا يخدم نسخة قديمة من الكاش أثناء التعديل
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  }
  boot();
})();
