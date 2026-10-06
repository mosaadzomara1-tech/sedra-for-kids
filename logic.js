/* منطق «سدرة للأطفال» الخالص — بلا DOM ولا شبكة، ويختبره tests/logic_check.js.
 * القاعدة: كل قرار (اختيار السؤال · النجوم · رحلة اليوم · وقت الشاشة · بوابة الأهل · تقييم الكتابة) دالة هنا. */
(function (root) {
  'use strict';

  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d]);

  /* مولّد عشوائي ببذرة — نفس البذرة = نفس النتيجة (للاختبار ولثبات رحلة اليوم) */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const range = (n) => [...Array(n).keys()];

  /* خيارات السؤال: الصحيح + مشتّتات مختلفة، مخلوطة */
  function pickOptions(correct, poolSize, n, rnd) {
    n = Math.min(n, poolSize);
    const others = shuffle(range(poolSize).filter((i) => i !== correct), rnd).slice(0, n - 1);
    return shuffle([correct, ...others], rnd);
  }
  /* خيارات «الحروف المتشابهة»: المشتّتات من عائلة الشكل نفسها أولاً (ب ت ث ن ي) */
  function familyOptions(correct, families, poolSize, n, rnd) {
    const fam = families.find((f) => f.includes(correct)) || [correct];
    const picked = [correct, ...shuffle(fam.filter((x) => x !== correct), rnd).slice(0, n - 1)];
    const rest = shuffle(range(poolSize).filter((i) => !picked.includes(i)), rnd);
    while (picked.length < Math.min(n, poolSize)) picked.push(rest.shift());
    return shuffle(picked, rnd);
  }

  /* صناديق لايتنر: الخطأ يرجع للصندوق ٠، والصواب يتقدّم — والأضعف يُسأل عنه أكثر */
  const MAX_BOX = 4;
  function updateBox(boxes, key, correct) {
    const b = Object.assign({}, boxes);
    b[key] = correct ? Math.min(MAX_BOX, (b[key] || 0) + 1) : 0;
    return b;
  }
  function nextTarget(poolSize, boxes, rnd, avoid) {
    const w = [];
    let total = 0;
    for (let i = 0; i < poolSize; i++) {
      const wi = i === avoid && poolSize > 1 ? 0 : Math.pow(2, MAX_BOX - (boxes[i] || 0));
      w.push(wi); total += wi;
    }
    let r = rnd() * total;
    for (let i = 0; i < poolSize; i++) { r -= w[i]; if (r < 0) return i; }
    return poolSize - 1;
  }
  const mastered = (boxes, keys) => keys.filter((k) => (boxes[k] || 0) >= 3).length;

  /* نجوم الجولة: المحاولة تُكافأ دائماً (نجمة على الأقل) — نكافئ الجهد لا النتيجة وحدها */
  function roundStars(correct, total) {
    if (total <= 0) return 0;
    const r = correct / total;
    return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
  }
  const STAR_PER_STICKER = 10;
  const stickersUnlocked = (stars, total) => Math.max(0, Math.min(total, Math.floor(stars / STAR_PER_STICKER)));

  /* بوابة الأهل: ضرب رقمين (٣–٩) بإدخال لا باختيار — الطفل لا يحلّه ولا يخمّنه */
  function gateQuestion(rnd) {
    const a = 3 + Math.floor(rnd() * 7), b = 3 + Math.floor(rnd() * 7);
    return { a, b, answer: a * b };
  }
  const gateCheck = (q, input) => {
    const v = String(input == null ? '' : input).replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)).trim();
    return /^\d+$/.test(v) && +v === q.answer;
  };

  /* وقت الشاشة */
  const dateKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function addUsage(usage, day, seconds) {
    const u = {}; u[day] = ((usage && usage[day]) || 0) + Math.max(0, seconds);
    return u; // اليوم الحالي فقط — لا تتضخّم الحالة
  }
  function remainingSeconds(usage, day, limitMin, bonusMin) {
    if (!limitMin) return Infinity; // ٠ = بلا حدّ
    return Math.max(0, (limitMin + (bonusMin || 0)) * 60 - ((usage && usage[day]) || 0));
  }

  /* الكتابة بالإصبع: شبكة N×N — تمديد الخلايا بنصف قطر r */
  function dilate(arr, N, r) {
    const out = new Uint8Array(arr.length);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!arr[y * N + x]) continue;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < N && xx >= 0 && xx < N) out[yy * N + xx] = 1;
      }
    }
    return out;
  }
  /* التغطية = كم من الحرف مرّ عليه الإصبع · الدقة = كم من الرسم قريب من الحرف */
  function traceScore(mask, ink, nearMask) {
    let inLetter = 0, covered = 0, inkTotal = 0, inkNear = 0;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i]) { inLetter++; if (ink[i]) covered++; }
      if (ink[i]) { inkTotal++; if ((nearMask || mask)[i]) inkNear++; }
    }
    const coverage = inLetter ? covered / inLetter : 0;
    const precision = inkTotal ? inkNear / inkTotal : 0;
    const stars = inkTotal < 20 ? 0 : coverage >= 0.7 && precision >= 0.75 ? 3 : coverage >= 0.5 && precision >= 0.6 ? 2 : coverage >= 0.3 && precision >= 0.4 ? 1 : 0;
    return { coverage, precision, stars };
  }

  /* القرآن: البسملة قبل كل سورة إلا الفاتحة (آيتها الأولى) — ثم كل آية × التكرار */
  function surahQueue(s, count, repeat, from) {
    const q = [];
    const start = from || 1;
    if (s !== 1 && s !== 9 && start === 1) q.push({ s: 1, a: 1, basmala: true, rep: 1 });
    for (let a = start; a <= count; a++) for (let r = 1; r <= Math.max(1, repeat); r++) q.push({ s, a, rep: r });
    return q;
  }
  const ayahUrl = (folder, s, a) => 'https://everyayah.com/data/' + folder + '/' + String(s).padStart(3, '0') + String(a).padStart(3, '0') + '.mp3';

  /* ───── ألعاب المهارات ───── */
  /* النمط: AB · AAB · ABB · ABC — يُعرض ٥ والسادس هو السؤال */
  // ثلاثة خيارات بحدّ أقصى في كل الألعاب: طفل الثالثة يتشتّت مع الأربعة (قرار المالك ٢٠٢٦-١٠-٠٥).
  // مصدر واحد — app.js بياخده من هنا، وشكل الشبكة بيتحسب من عدد الخيارات نفسه.
  const MAX_OPTIONS = 3;

  function makePattern(rnd, pool) {
    const units = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]];
    const unit = units[Math.floor(rnd() * units.length)];
    const items = shuffle(pool, rnd).slice(0, 3);
    const seq = [];
    while (seq.length < 6) for (const u of unit) seq.push(items[u]);
    const answer = seq[5];
    const used = [...new Set(unit.map((u) => items[u]))];
    const extra = shuffle(pool.filter((x) => !used.includes(x)), rnd).slice(0, Math.max(0, 3 - used.length));
    return { shown: seq.slice(0, 5), answer, options: shuffle([...used, ...extra], rnd) };
  }
  /* الرقم الناقص: ٤ أرقام متتالية وواحد مخفي، والخيارات قريبة منه (تُدرّب التسلسل لا التخمين) */
  // min = أصغر قيمة مسموحة في الخيارات: ٠ للأرقام، ١ للقوائم (أيام/روتين) اللي مالهاش عنصر صفر
  function makeSequence(rnd, max, min) {
    max = max || 20;
    min = min == null ? 0 : min;
    const start = 1 + Math.floor(rnd() * (max - 3));
    const items = [start, start + 1, start + 2, start + 3];
    const hole = Math.floor(rnd() * 4);
    const answer = items[hole];
    // ٣ خيارات قريبة دايماً: الأقرب الأول (±١ ثم ±٢ …) جوّه الحدود — عند الطرف بنكمّل من الناحية التانية
    const cand = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5].map((d) => answer + d).filter((x) => x >= min && x <= max);
    const near = shuffle(cand.slice(0, 4), rnd).slice(0, MAX_OPTIONS - 1);
    return { items: items.map((x, i) => (i === hole ? null : x)), answer, options: shuffle([answer, ...near], rnd) };
  }
  /* ───── دفعة v4 ───── */
  /* الساعة: زاويتا العقربين بالدرجات من ١٢ باتجاه عقارب الساعة */
  const clockAngles = (h, m) => ({ hour: (h % 12) * 30 + m / 2, minute: m * 6 });
  /* سؤال الساعة: ساعة كاملة (أو ونص لو half) + خياران مضلِّلان من الأخطاء الشائعة:
     نفس الساعة بالدقايق التانية، والساعة اللي بعدها/قبلها (العقرب الصغير بين رقمين في «ونص») */
  function clockQuestion(rnd, half) {
    const h = 1 + Math.floor(rnd() * 12), m = half && rnd() < 0.5 ? 30 : 0;
    const wrap = (x) => ((x + 11) % 12) + 1, same = (a, b) => a.h === b.h && a.m === b.m;
    const cands = [{ h: wrap(h + 1), m }, { h: wrap(h - 1), m }];
    if (half) cands.unshift({ h, m: m ? 0 : 30 });
    const opts = [{ h, m }];
    for (const c of shuffle(cands, rnd)) if (opts.length < 3 && !opts.some((o) => same(o, c))) opts.push(c);
    return { h, m, options: shuffle(opts, rnd) };
  }
  /* أين يعيش؟: حيوان + بيئته + بيئتين تانيين مختلفين */
  function habitatQuestion(rnd, pairs, nHabitats, lastKey) {
    let k; do { k = Math.floor(rnd() * pairs.length); } while (pairs.length > 1 && k === lastKey);
    const [animal, home] = pairs[k];
    const others = shuffle([...Array(nHabitats).keys()].filter((x) => x !== home), rnd).slice(0, 2);
    return { key: k, animal, home, options: shuffle([home, ...others], rnd) };
  }
  /* كرّر الترتيب: أول مرة بطاقتين، وبعدها بطاقة زيادة كل مرة — من غير نفس البطاقة ٣ مرات ورا بعض */
  function echoExtend(seq, n, rnd) {
    const out = seq.slice();
    do {
      let k; do { k = Math.floor(rnd() * n); } while (out.length >= 2 && out[out.length - 1] === k && out[out.length - 2] === k);
      out.push(k);
    } while (out.length < 2);
    return out;
  }
  const echoStars = (best) => (best >= 5 ? 3 : best >= 3 ? 2 : 1);   // نجمة على الأقل دايماً

  /* النرد: مواضع النقاط في شبكة ٣×٣ — لإدراك الكمية بلا عدّ */
  const DICE = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const diceLayout = (n) => DICE[n] || [];
  /* الذاكرة: أزواج (حرف ↔ صورته) مخلوطة */
  function memoryDeck(pairs, poolSize, rnd) {
    const chosen = shuffle(range(poolSize), rnd).slice(0, pairs);
    return shuffle(chosen.flatMap((i) => [{ i, face: 'a' }, { i, face: 'b' }]), rnd);
  }
  const memoryStars = (moves, pairs) => (moves <= pairs + 2 ? 3 : moves <= pairs * 2 ? 2 : 1);

  /* ───── مهارات مضافة: الوعي الصوتي · الأضداد · التصنيف · الحجم · الظل · الحساب · المكان · شكل الحرف ─────
   * كلها تُرجع {options:[...], answer} ولا تلمس DOM — الواجهة ترسم فقط. */

  /* خيارات رقمية قريبة من الجواب داخل مدى — تُدرّب الحساب لا التخمين */
  function nearOptions(answer, min, max, n, rnd) {
    const near = shuffle([-3, -2, -1, 1, 2, 3].map((d) => answer + d).filter((x) => x >= min && x <= max), rnd);
    const out = [answer];
    while (out.length < n && near.length) { const x = near.shift(); if (!out.includes(x)) out.push(x); }
    for (let x = min; out.length < n && x <= max; x++) if (!out.includes(x)) out.push(x);
    return shuffle(out, rnd);
  }

  /* سؤال الزوج: يُعرض طرف s من الزوج p، والجواب طرفه الآخر، والمشتّتات أطراف من أزواج تانية.
     نفس المنطق للعبتين: القافية (الكلمة ← اللي تشبه آخرها) والأضداد (الكلمة ← عكسها) */
  function pairQuestion(rnd, pairCount, n) {
    n = n || 3;
    const p = Math.floor(rnd() * pairCount), s = Math.floor(rnd() * 2);
    const others = shuffle(range(pairCount).filter((i) => i !== p), rnd).slice(0, n - 1);
    const opts = [{ p, s: 1 - s, correct: true }, ...others.map((i) => ({ p: i, s: Math.floor(rnd() * 2), correct: false }))];
    return { p, s, options: shuffle(opts, rnd) };
  }
  const makeRhyme = pairQuestion, makeOpposite = pairQuestion;

  /* التصنيف: تُنادى مجموعة ويُختار فرد منها بين أفراد مجموعات أخرى */
  function makeSort(rnd, sizes, n) {
    n = n || 4;
    const c = Math.floor(rnd() * sizes.length);
    const others = shuffle(range(sizes.length).filter((i) => i !== c), rnd).slice(0, n - 1);
    const pick = (i) => ({ c: i, k: Math.floor(rnd() * sizes[i]), correct: i === c });
    return { c, options: shuffle([pick(c), ...others.map(pick)], rnd) };
  }

  /* الحجم: أربعة أحجام مختلفة لنفس الصورة — الأكبر أو الأصغر */
  const SIZES = [0.55, 0.85, 1.2, 1.7];
  function makeSize(rnd, n) {
    n = n || 4;
    const big = rnd() < 0.5;
    const scales = shuffle(SIZES.slice(0, n), rnd);
    const want = big ? Math.max(...scales) : Math.min(...scales);
    return { big, options: scales.map((z) => ({ z, correct: z === want })) };
  }

  /* واحد من n: n عناصر مختلفة من المخزن وواحد منها هو المطلوب.
     للظل (صورة معتمة ← صاحبها) والمفاهيم المكانية (جهة ← مشهدها) */
  function pickOne(rnd, poolSize, n) {
    n = Math.min(n || 4, poolSize);
    const picked = shuffle(range(poolSize), rnd).slice(0, n);
    const t = picked[Math.floor(rnd() * picked.length)];
    return { t, options: picked.map((i) => ({ i, correct: i === t })) };
  }
  const makeShadow = pickOne, makeSpatial = pickOne;

  /* الجمع والطرح ضمن ١٠ — بالصور دائماً، فالطفل يعدّ ما يراه قبل أن يحفظ */
  function makeArith(rnd, sub, max) {
    max = max || 10;
    let a, b;
    if (sub) { a = 2 + Math.floor(rnd() * (max - 1)); b = 1 + Math.floor(rnd() * (a - 1)); }
    else { a = 1 + Math.floor(rnd() * (max - 1)); b = 1 + Math.floor(rnd() * (max - a)); }
    const answer = sub ? a - b : a + b;
    return { a, b, sub: !!sub, answer, options: nearOptions(answer, 0, max, MAX_OPTIONS, rnd) };
  }

  /* شكل الحرف: يُعرض الحرف في أول الكلمة أو وسطها أو آخرها ويُسمّى — مهارة عربية خالصة */
  const FORMS = ['start', 'middle', 'end'];
  const pickForm = (rnd) => FORMS[Math.floor(rnd() * FORMS.length)];

  /* روابط العدد ١٠: يظهر a (١–٩) على الإطار العشري، والسؤال كم نحتاج لنكمّل عشرة */
  function bondQuestion(rnd) {
    const a = 1 + Math.floor(rnd() * 9), need = 10 - a;
    return { a, need, options: nearOptions(need, 0, 10, MAX_OPTIONS, rnd) };
  }

  /* ───── رحلة اليوم — التعلّم التكيّفي ─────
   * لكل طفل كل يوم: أضعف حرف عربي · أضعف حرف إنجليزي · أضعف رقم · أول سورة لم تُحفظ · أول قصة لم تُسمع
   * · لعبة من أقل مجال مهارات لُعب. ثابتة طوال اليوم (بذرة من التاريخ + الطفل). */
  function dailyPlan(p, ctx, day) {
    const r = rng(hashStr(day + '|' + (p.id || '')));
    const pickAny = (arr) => arr[Math.floor(r() * arr.length)];
    const weak = (boxes, order) => order.find((i) => (boxes[i] || 0) < 3) ?? pickAny(order);
    const games = p.games || {};
    const plays = (id) => (games[id] && games[id].plays) || 0;
    const areas = Object.keys(ctx.gameAreas).sort((a, b) =>
      ctx.gameAreas[a].reduce((t, id) => t + plays(id), 0) - ctx.gameAreas[b].reduce((t, id) => t + plays(id), 0));
    const pool = ctx.gameAreas[areas[0]];
    const least = Math.min(...pool.map(plays));
    const game = pickAny(pool.filter((id) => plays(id) === least));
    return [
      { type: 'ar', target: weak(p.boxes_ar || {}, ctx.arOrder) },
      { type: 'en', target: weak(p.boxes_en || {}, ctx.enOrder) },
      { type: 'num', target: weak(p.boxes_num || {}, range(20).map((i) => i + 1)) },
      { type: 'surah', target: ctx.surahOrder.find((s) => !(p.memorized || {})[s]) ?? pickAny(ctx.surahOrder) },
      { type: 'story', target: ctx.storyIds.find((id) => !(p.stories || {})[id]) ?? pickAny(ctx.storyIds) },
      { type: 'game', target: game },
    ];
  }

  /* ملخّص تقدّم الطفل — لركن الأهل */
  function progressSummary(p, counts) {
    const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
    const ar = mastered(p.boxes_ar || {}, range(counts.ar));
    const en = mastered(p.boxes_en || {}, range(counts.en));
    const num = mastered(p.boxes_num || {}, range(counts.num).map((i) => i + 1));
    const surahs = Object.keys(p.memorized || {}).filter((k) => p.memorized[k]).length;
    const stories = Object.keys(p.stories || {}).length;
    const areaPlays = {};
    for (const [area, ids] of Object.entries(counts.gameAreas || {}))
      areaPlays[area] = ids.reduce((t, id) => t + (((p.games || {})[id] || {}).plays || 0), 0);
    return {
      ar, en, num, surahs, stories, stars: p.stars || 0, areaPlays,
      pct: { ar: pct(ar, counts.ar), en: pct(en, counts.en), num: pct(num, counts.num), surahs: pct(surahs, counts.surahs), stories: pct(stories, counts.stories) },
    };
  }

  /* ركن الأهل: «نعمل إيه الأسبوع ده؟» — من تقدّم الطفل على الجهاز بس.
     strong: ألعاب أخد فيها ٣ نجوم (الأكتر لعباً) · weakGames: لعبها وأحسن نتيجة نجمة
     weakLetters: حروف غلط فيها آخر مرة (صندوقها رجع صفر) · focus: المجال اللي محتاج اهتمام
     (مجال ماجرّبهوش خالص الأول، وبعدين الأقل في متوسط النجوم) · tryNext: لعبة منه لسه مالعبهاش */
  function parentInsights(p, gameAreas) {
    const games = (p && p.games) || {};
    const played = Object.entries(games).filter(([, r]) => r && r.plays > 0);
    const byPlays = (a, b) => b[1].plays - a[1].plays || (a[0] < b[0] ? -1 : 1);
    const strong = played.filter(([, r]) => r.best >= 3).sort(byPlays).slice(0, 3).map(([id]) => id);
    const weakGames = played.filter(([, r]) => r.best <= 1).sort(byPlays).slice(0, 3).map(([id]) => id);
    const weakLetters = Object.entries((p && p.boxes_ar) || {}).filter(([, b]) => b === 0)
      .map(([k]) => +k).sort((a, b) => a - b).slice(0, 5);
    let focus = null, best = Infinity;
    for (const [area, ids] of Object.entries(gameAreas || {})) {
      const recs = ids.map((id) => games[id]).filter((r) => r && r.plays > 0);
      const score = recs.length ? recs.reduce((t, r) => t + r.best, 0) / recs.length : -1;   // ماجرّبهوش = الأولوية
      if (score < best) { best = score; focus = area; }
    }
    const tryNext = focus ? ((gameAreas[focus] || []).find((id) => !(games[id] && games[id].plays > 0)) || null) : null;
    return { strong, weakGames, weakLetters, focus, tryNext, empty: !played.length && !weakLetters.length };
  }

  const api = { toArabicDigits, rng, hashStr, shuffle, pickOptions, familyOptions, updateBox, nextTarget, mastered, roundStars,
    stickersUnlocked, STAR_PER_STICKER, gateQuestion, gateCheck, dateKey, addUsage, remainingSeconds, dilate, traceScore,
    surahQueue, ayahUrl, makePattern, makeSequence, diceLayout, memoryDeck, memoryStars, dailyPlan, progressSummary, MAX_BOX,
    nearOptions, makeRhyme, makeOpposite, makeSort, makeSize, makeShadow, makeArith, makeSpatial, pickForm, FORMS, bondQuestion,
    clockAngles, clockQuestion, habitatQuestion, echoExtend, echoStars, parentInsights, MAX_OPTIONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SK = api;
})(typeof window !== 'undefined' ? window : globalThis);
