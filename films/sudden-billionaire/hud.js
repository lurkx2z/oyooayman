/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     YOUR MONEY to the cent (money.js), what just left it (a purchase, a gift), GIVEN AWAY · PROMISED,
                  NEXT: what's coming (so there is always something coming); under it one context line for the scene
     top right    WHEN (day one … year ten) and where; or, in a study, where and when it was done
     bottom left  the honest label (your story is made up; how strong each study is)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams (SVG): the studies' numbers, your money against what you gave
     in the scene labels a set pins to things (set.labels(t) → [{ p, text, sub, a }]); downtown, the camera glasses'
                  gaze ring (set.gaze(t) → { p, a, text })
   ===================================================================== */

const SB_W = StoryHUD.win;
const sbClockTime = (d) => { const s = ((22 * 3600 + 59 * 60 + 30 + d * 86400) % 86400 + 86400) % 86400, h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
// the story's date, said the way the captions say it
function sbWhenStr(d) {
  if (d < 0.4) return 'SATURDAY';
  if (d < 30) return 'DAY ' + (Math.floor(d) + 1);
  if (d < 365) return 'MONTH ' + (Math.floor(d / 30.44) + 1);
  return 'YEAR ' + Math.floor(d / 365);
}
// [from, to, label, value, sub(t)]: the story's places (WHEN), the studies' (THE STUDY)
const SB_WHERE = [
  [0.3, SB.titleShot, 'WHEN', () => 'TEN YEARS FROM NOW', () => 'THE CROSSING · 9:36 PM · RAIN'],
  [SB.flat + 0.3, SB.mum, 'WHEN', () => 'SATURDAY NIGHT', (t) => 'YOUR FLAT · ' + sbClockTime(sbDay(t))],
  [SB.mum + 0.3, SB.dunn, 'WHEN', null, (t) => 'YOUR FLAT · ' + sbClockTime(sbDay(t))],
  [SB.dunn + 0.3, SB.out, 'THE STUDY', () => 'VANCOUVER, 2008', () => 'A UNIVERSITY CAMPUS · 46 PEOPLE'],
  [SB.out + 0.3, SB.house, 'WHEN', null, (t) => 'YOUR FLAT · ' + sbClockTime(sbDay(t))],
  [SB.house + 0.3, SB.garage, 'WHEN', null, () => 'THE HOUSE'],
  [SB.garage + 0.2, SB.neighbours, 'WHEN', null, () => 'THE GARAGE'],
  [SB.neighbours + 0.3, SB.six, 'WHEN', null, () => 'YOUR OLD STREET'],
  [SB.six + 0.3, SB.brick, 'WHEN', null, (t) => 'THE KITCHEN · ' + sbClockTime(sbDay(t))],
  [SB.brick + 0.3, SB.sweden, 'THE STUDY', () => 'ILLINOIS, 1978', () => '22 LOTTERY WINNERS · 22 OTHERS'],
  [SB.sweden + 0.2, SB.enough, 'THE STUDY', () => 'SWEDEN, 2020', () => '3,300 LOTTERY PLAYERS'],
  [SB.enough + 0.3, sbCap('enough', 1).show - 0.1, 'WHEN', null, () => 'THE TERRACE'],
  [sbCap('enough', 1).show, SB.compare, 'THE SURVEY', () => 'BOSTON, 2018', () => '4,155 MILLIONAIRES'],
  [SB.compare + 0.3, SB.boss, 'THE SURVEY', () => 'HARVARD, 1998', () => '257 STUDENTS AND STAFF'],
  [SB.boss + 0.3, SB.cookies, 'WHEN', null, () => 'YOUR COMPANY'],
  [SB.cookies + 0.3, SB.game, 'THE STUDY', () => 'BERKELEY, 1998', () => 'GROUPS OF THREE STUDENTS'],
  [SB.game + 0.3, SB.candy, 'THE GAME', () => 'BERKELEY', () => '100+ PAIRS · SHOWN IN A 2013 TALK'],
  [SB.candy + 0.3, SB.views, 'THE STUDY', () => 'BERKELEY, 2012', () => 'A JAR OF SWEETS FOR CHILDREN'],
  [SB.views + 0.3, sbCap('views', 1).show - 0.1, 'WHEN', null, () => 'THE HOUSE'],
  [sbCap('views', 1).show, SB.yacht, 'THE STUDY', () => 'BRITAIN, 2014', () => 'LOTTERY WINNERS, OVER YEARS'],
  [SB.yacht + 0.3, SB.wall, 'WHEN', null, () => 'THE MARINA'],
  [SB.wall + 0.3, SB.walk, 'WHEN', null, () => 'THE GATE'],
  [SB.walk + 0.3, SB.glass, 'WHEN', null, () => 'DOWNTOWN'],
  [SB.glass + 0.3, SB.drive, 'THE STUDY', () => 'NEW YORK, 2016', () => '61 PEOPLE · ONE BLOCK EACH'],
  [SB.drive + 0.3, sbCap('drive', 1).show - 0.1, 'WHEN', null, () => 'YOUR CAR'],
  [sbCap('drive', 1).show, SB.nostop, 'THE STUDY', () => 'BERKELEY, 2012', () => 'A ZEBRA CROSSING · 152 CARS'],
  [SB.nostop + 0.3, SB.years, 'WHEN', null, () => 'A ZEBRA CROSSING'],
  [SB.years + 0.3, SB.note, 'WHEN', null, () => 'THE HOUSE'],
  [SB.note + 0.3, SB.pledge, 'WHEN', null, () => 'THE GARAGE'],
  [SB.pledge + 0.3, SB.real, 'THE GIVING PLEDGE', () => '2010 → 2025', () => 'THE ORIGINAL 57 AMERICANS'],
  [SB.letters + 0.3, SB.video, 'THE STUDY', () => 'THE NETHERLANDS, 2021', () => '360 LETTERS, WRONG ADDRESSES'],
  [SB.video + 0.3, SB.feeney, 'THE STUDY', () => 'BERKELEY, 2010', () => 'A 46-SECOND VIDEO'],
  [SB.feeney + 0.3, SB.point, 'A REAL MAN', () => 'CHUCK FEENEY', () => '1931–2023 · SAN FRANCISCO'],
  [SB.point + 0.3, SB.herLook + 0.8, 'WHEN', () => 'TEN YEARS FROM NOW', () => 'THE CROSSING · 9:36 PM · RAIN'],
];
// the readout's NEXT: [until, text]
const SB_NEXT = [
  [SB.titleShot, 'NEXT · HOW YOU GOT HERE'], [SB.draw, 'NEXT · THE DRAW'], [SB.won, 'NEXT · YOUR NUMBERS'], [SB.promise, 'NEXT · WHAT YOU\'LL DO WITH IT'],
  [SB.mum, 'NEXT · DAY ONE'], [SB.out, 'NEXT · DAY THREE'], [SB.interest, 'NEXT · WHILE YOU SLEEP'], [SB.house, 'NEXT · MONTH TWO'],
  [SB.neighbours, 'NEXT · YOUR OLD STREET'], [SB.six, 'NEXT · MONTH SIX'], [SB.enough, 'NEXT · WANTING MORE'], [SB.boss, 'NEXT · POWER'],
  [SB.yacht, 'NEXT · YEAR TWO'], [SB.walk, 'NEXT · YEAR THREE'], [SB.years, 'NEXT · YEARS FIVE TO NINE'], [SB.note, 'NEXT · THE NOTE'],
  [SB.real, 'NEXT · IS ANY OF THIS REAL?'], [SB.feeney, 'NEXT · A MAN WHO GAVE IT ALL AWAY'], [SB.point, 'NEXT · THE SAME CROSSING'], [1e9, ''],
];
function sbReadoutAt(t) {
  const a = Math.max(SB_W(t, 0.3, SB.titleShot - 0.1, 0.5, 0.3), SB_W(t, SB.rent - 0.2, SB.herLook + 0.8, 0.5, 1.4));   // (for the first time in the film, it goes away: when she thanks you)
  if (a <= 0) return null;
  const w = sbMoney(t), pre = t >= SB.titleShot && t < SB.billion;
  const promised = t < SB.titleShot || t >= SB.stick;
  const g = sbGivenPct(t), gs = g <= 0 ? '0%' : g < 0.1 ? g.toFixed(3) + '%' : g < 1 ? g.toFixed(2) + '%' : g.toFixed(1) + '%';
  const s = pre ? 'RENT DUE MONDAY · <b>$1,240</b>' : `GIVEN AWAY <b>${gs}</b>` + (promised ? ' · PROMISED <b>50%</b>' : '');
  const D = sbDelta(t);
  let dl = '', dk = 'dl';
  if (D) { const u = t - D.t0, k = MathX.smooth(u, 0, 0.25) * (1 - MathX.smooth(u, 2.3, 2.8)); if (k > 0.02) { dl = (D.kind === 'give' ? '→ GIVEN ' : '− ') + sbDollars(D.a, false) + ' · ' + D.what; dk = D.kind === 'give' ? 'dl give' : 'dl'; } }
  const nx = SB_NEXT.find((x) => t < x[0]);
  return { a, v: sbDollars(w), s, dl, dk, next: nx ? nx[1] : '' };
}
// the scene's context line: [from, to, label, value(t)] (value: text, or { l, v, v2 } with HTML)
const SB_CTX = [
  [SB.rent + 0.6, SB.draw - 0.2, 'BY MONDAY', () => ({ v: 'YOU\'RE $827.63 SHORT', v2: '' })],
  [SB.draw + 0.5, SB.balls - 0.1, 'TONIGHT\'S JACKPOT', () => ({ v: '$3.4 BILLION', v2: 'THE ODDS: 1 IN 292 MILLION' })],
  [sbCap('won', 1).show + 1.4, SB.scale - 0.1, 'TAKEN AS CASH, AFTER 37% TAX', () => ({ v: '$1,000,000,000', v2: '' })],
  [sbCap('scale', 0).show + 0.3, sbCap('scale', 1).show - 0.1, 'COUNTING ONE DOLLAR A SECOND', () => ({ v: '31.7 YEARS', v2: 'NO SLEEP, NO BREAKS' })],
  [sbCap('scale', 1).show + 0.3, sbCap('scale', 2).show - 0.1, '10,000,000 NOTES OF $100', (t) => ({ v: (1.33 * MathX.smooth(t, SB.cashUp, SB.cashTop)).toFixed(2) + ' m DEEP', v2: '11.4 m³ · ON 3.3 × 2.6 m OF FLOOR' })],
  [sbCap('scale', 2).show + 0.3, SB.promise - 0.1, 'EACH NOTE ABOUT 1 g', () => ({ v: '10 TONNES', v2: 'ABOUT TWO ELEPHANTS' })],
  [SB.stick + 0.6, SB.mum - 0.2, 'HALF', () => ({ v: '$500,000,000', v2: 'YOUR PROMISE' })],
  [sbCap('out', 1).show - 0.2, SB.who - 0.1, 'MESSAGES', (t) => ({ v: sbThousands(sbMsgCount(t)), v2: 'AND COUNTING' })],
  [sbCap('interest', 1).show + 0.2, sbCap('interest', 2).show - 0.05, 'AT 5% A YEAR', () => ({ v: '$137,000 A DAY', v2: '$1.59 A SECOND' })],
  [sbCap('interest', 2).show, SB.house - 0.2, 'SINCE THIS SENTENCE APPEARED', (t) => ({ v: '+' + sbDollars(Math.max(0, sbMoney(Math.min(t, sbCap('interest', 2).hide)) - sbMoney(sbCap('interest', 2).show))), v2: '' })],
  [sbCap('house', 1).show + 0.2, SB.garage - 0.1, 'BATHROOMS', () => ({ v: '11 · USED 2', v2: '' })],
  [sbCap('neighbours', 1).show + 0.2, SB.six - 0.2, 'EACH $1,000 A NEIGHBOUR WON', () => ({ v: '+2.4% RISK OF BANKRUPTCY', v2: 'FOR THE PEOPLE NEARBY' })],
  [SB.sweden + 0.5, SB.enough - 0.2, 'BIG WINNERS, 10+ YEARS ON', () => ({ v: 'MORE SATISFIED WITH LIFE', v2: 'NOT CLEARLY HAPPIER DAY TO DAY' })],
  [SB.plate + 0.4, SB.extra - 0.1, 'THE PLATE', () => ({ v: '5 COOKIES · 3 PEOPLE', v2: '' })],
  [SB.extra - 0.1, SB.game - 0.2, 'LEFT ON THE PLATE', (t) => ({ v: t < SB.extra + 0.5 ? '2 COOKIES' : '1 COOKIE', v2: t < SB.extra + 0.5 ? 'ONE EACH, SO FAR' : 'YOU TOOK THE EXTRA ONE' })],
  [sbCap('game', 2).show + 0.2, SB.game2 + 1.5, 'THE RICH PLAYER', () => ({ v: '2× MONEY · 2× PAY · 2 DICE', v2: 'DECIDED BY A COIN' })],
  [sbCap('views', 1).show + 0.4, SB.yacht - 0.2, 'BIGGER WIN', () => ({ v: 'MORE RIGHT-WING', v2: 'LESS FOR SHARING WEALTH OUT' })],
  [sbCap('yacht', 1).show + 0.3, SB.wall - 0.1, 'THE ONE NEXT TO IT', () => ({ v: '120 m', v2: 'TWICE YOURS' })],
  [SB.glass + 0.4, SB.drive - 0.2, 'YOUR EYES ON PEOPLE', (t) => ({ v: sbGazeOnPeople(t).toFixed(1) + ' s', v2: t < SB.glass2 ? 'IN THIS BLOCK' : 'STILL ' + sbGazeOnPeople(t).toFixed(1) + ' s' })],
  [sbCap('note', 1).show + 0.2, SB.pledge - 0.2, 'HALF, NOW', (t) => ({ v: sbDollars(sbMoney(t) / 2, false), v2: 'GIVEN SO FAR: ' + sbWords(sbGiven(t)) })],
  [sbCap('video', 0).show + 0.4, SB.feeney - 0.2, 'THE VIDEO', (t) => ({ v: '0:' + String(Math.min(46, Math.floor(MathX.clamp((t - sbCap('video', 0).show - 0.6) * 46 / 6.5, 0, 46)))).padStart(2, '0') + ' / 0:46', v2: 'ABOUT CHILD POVERTY' })],
  [sbCap('feeney', 0).show + 0.4, SB.point - 0.2, 'GAVE AWAY', () => ({ v: 'OVER $8 BILLION', v2: 'KEPT ABOUT $2 MILLION' })],
];
// the messages arriving on day three (the phone and the context line share this)
function sbMsgCount(t) {
  const a = sbCap('out', 1).show, b = sbCap('out', 2).show, c = sbCap('out', 3).show;
  if (t < a - 0.6) return 0;
  if (t < a + 0.6) return Math.round(40 * MathX.smooth(t, a - 0.6, a + 0.4));
  if (t < b) return 40 + Math.round(4 * (t - a - 0.6));
  if (t < b + 0.8) return Math.round(sbLerp(44, 900, MathX.smooth(t, b - 0.2, b + 0.6)));
  if (t < c) return 900 + Math.round(30 * (t - b - 0.8));
  if (t < c + 0.9) return Math.round(sbLerp(930, 2600, MathX.smooth(t, c - 0.2, c + 0.7)));
  return 2600 + Math.round(12 * (t - c - 0.9));
}
// the camera glasses: seconds your eyes spent on people (downtown; street.js says where you look)
let SB_GAZE = null;
function sbGazeOnPeople(t) {
  if (!SB_GAZE) { const t0 = SB.glass, n = Math.ceil((SB.drive - t0) * 30) + 2, a = new Float32Array(n); let s = 0; for (let i = 0; i < n; i++) { a[i] = s; s += (typeof sbGazeTarget === 'function' && sbGazeTarget(t0 + i / 30).person ? 1 : 0) / 30; } SB_GAZE = { t0, a }; }
  const i = MathX.clamp(Math.floor((t - SB_GAZE.t0) * 30), 0, SB_GAZE.a.length - 1);
  return SB_GAZE.a[i];
}
// the honest labels: [from, to, text] (the first match wins)
const SB_TAGS = [
  [0.3, SB.titleShot, 'ILLUSTRATION · YOUR STORY IS MADE UP'],
  [SB.flat + 0.4, SB.dunn, 'ILLUSTRATION · YOUR STORY IS MADE UP'],
  [SB.dunn + 0.3, SB.out, 'REAL STUDY · 2008 · REPEATED IN 2020: A SMALLER EFFECT'],
  [SB.out + 0.3, SB.neighbours, 'ILLUSTRATION · YOUR STORY IS MADE UP'],
  [SB.neighbours + 0.3, SB.six, 'REAL STUDY · CANADA · LOTTERY WINS UNDER $150,000'],
  [SB.six + 0.3, SB.brick, 'ILLUSTRATION'],
  [SB.brick + 0.3, SB.sweden, 'REAL STUDY · 1978 · ONLY 22 WINNERS'],
  [SB.sweden + 0.2, SB.enough, 'REAL STUDY · SWEDEN · 2020 · 3,300 PLAYERS'],
  [sbCap('enough', 1).show, SB.compare, 'REAL SURVEY · 2018 · 4,155 MILLIONAIRES'],
  [SB.compare + 0.3, SB.boss, 'REAL SURVEY · 1998 · 257 PEOPLE'],
  [SB.boss + 0.3, SB.cookies, 'ILLUSTRATION'],
  [SB.cookies + 0.3, SB.game, 'UNPUBLISHED LAB STUDY · 1998 · ILLUSTRATED'],
  [SB.game + 0.3, SB.candy, 'FROM A TALK, NOT A PUBLISHED PAPER · ILLUSTRATED'],
  [SB.candy + 0.3, SB.views, 'REAL STUDY · 2012 · SMALL · LATER CRITICISED'],
  [sbCap('views', 1).show, SB.yacht, 'REAL STUDY · BRITAIN · 2014'],
  [SB.yacht + 0.3, SB.glass, 'ILLUSTRATION · YOUR STORY IS MADE UP'],
  [SB.glass + 0.3, SB.drive, 'REAL STUDY · 2016 · 61 PEOPLE · ILLUSTRATED'],
  [sbCap('drive', 1).show, SB.nostop, 'REAL STUDY · 2012 · ONLY 5 CHEAP CARS WERE WATCHED'],
  [SB.nostop + 0.3, SB.pledge, 'ILLUSTRATION · YOUR STORY IS MADE UP'],
  [SB.pledge + 0.3, SB.real, 'REAL · INSTITUTE FOR POLICY STUDIES · AUGUST 2025'],
  [SB.letters + 0.3, sbCap('letters', 2).show - 0.1, 'REAL FIELD EXPERIMENT · 2021 · 360 LETTERS'],
  [sbCap('letters', 2).show, SB.video, 'REAL · LARGE SURVEYS · US TAX DATA, 2008'],
  [SB.video + 0.3, SB.feeney, 'REAL STUDY · 2010 · ITS MAIN RESULT FAILED TO REPEAT IN 2020'],
  [SB.feeney + 0.3, SB.point, 'REAL · ILLUSTRATED'],
  [SB.point + 0.3, SB.herLook + 0.8, 'ILLUSTRATION · YOUR STORY IS MADE UP'],
];
// a caption's text with its numbers in amber
function sbCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/(\$?\b\d[\d,.]*%?(?:\s?(?:million|billion|years|tonnes|metres|seconds|times|cookies))?|one billion dollars|Eleven|used two|five cookies|twice as many|\bhalf\b|Half|double|Ten years)/g, '<span class="n">$1</span>');
}

class SbHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('sb-ro', '<div class="l">YOUR MONEY</div><div class="v"></div><div class="dl"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roD = this.ro.querySelector('.dl'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('sb-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('sb-tag');
    this.where = mk('sb-where', '<div class="l"></div><div class="v"></div><div class="f"></div>'); this.whereL = this.where.querySelector('.l'); this.whereV = this.where.querySelector('.v'); this.whereF = this.where.querySelector('.f');
    this.cap = mk('sb-cap');
    this.caps = SBT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: g.id === 'question' ? SB.end - 0.2 : c.hide, html: sbCapHtml(c.text), q: g.id === 'question' })));   // (the question stays to the end)
    this.inset = mk('sb-inset');
    this.rec = mk('sb-rec', 'REC · CAMERA GLASSES');
    this.gaze = mk('sb-gaze', '<span class="t"></span>'); this.gazeT = this.gaze.querySelector('.t');
    this.labels = [];
    this.root = root;
    this._last = {};
    this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = SB_W;
    // ---- the diagrams first (a big one clears the panels)
    const big = this._insets(t);
    // ---- the readout
    const R = sbReadoutAt(t), ra = R ? R.a * (1 - big) : 0;
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (R) { this._txt('rov', this.roV, R.v); this._txt('rod', this.roD, R.dl); this._cls('rodk', this.roD, R.dk); this._html('ros', this.roS, R.s); this._txt('ron', this.roN, R.next); }
    // ---- the context line
    const cx = SB_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.5, 0.4) * (1 - big)).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t), o = typeof r === 'string' ? { v: r } : r;
      this._txt('cxl', this.ctxL, o.l || cx[2]); this._html('cxv', this.ctxV, o.v); this._html('cxv2', this.ctxV2, o.v2 || '');
      this._set('cxt', this.ctx, 'top', ra > 0.05 ? '' : 'calc(var(--u) * 44)');
    }
    // ---- when / where
    const wh = SB_WHERE.find((x) => t >= x[0] && t < x[1]);
    this._set('wh', this.where, 'opacity', wh ? (W(t, wh[0], wh[1], 0.5, 0.3) * (1 - big)).toFixed(3) : '0');
    if (wh) { this._txt('whl', this.whereL, wh[2]); this._txt('whv', this.whereV, wh[3] ? wh[3](t) : sbWhenStr(sbDay(t))); this._html('whf', this.whereF, wh[4] ? wh[4](t) : ''); }
    // ---- the honest label
    const tg = SB_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the caption
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'sb-cap q' : 'sb-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the camera glasses: REC and the gaze ring
    const ga = set && set.gaze ? set.gaze(t) : null, cam = set ? set.camera : null, _p = SbHud._p || (SbHud._p = new THREE.Vector3());
    this._set('rec', this.rec, 'opacity', (ga ? ga.a : 0).toFixed(3));
    if (ga && cam) {
      _p.set(ga.p[0], ga.p[1], ga.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.05 && Math.abs(_p.y) < 1.05;
      this._set('gza', this.gaze, 'opacity', vis ? ga.a.toFixed(3) : '0');
      this._set('gzx', this.gaze, 'left', ((_p.x * 0.5 + 0.5) * 100).toFixed(2) + '%'); this._set('gzy', this.gaze, 'top', ((-_p.y * 0.5 + 0.5) * 100).toFixed(2) + '%');
      this._txt('gzt', this.gazeT, ga.text || '');
    } else this._set('gza', this.gaze, 'opacity', '0');
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'sb-lab'; this.root.appendChild(d); this.labels.push(d); }
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      const r = l.side ? l.side === 'l' : lx > 72; if (d._r !== r) { d._r = r; d.classList.toggle('r', r); }
      // (kept clear of the panels: the readout and context line top left, WHERE top right)
      let top = ly;
      if ((ra > 0.05 || cx) && lx < 42) top = Math.max(top, 42);
      if (lx > 60 && wh) top = Math.max(top, 22);
      d.style.left = lx.toFixed(2) + '%'; d.style.top = top.toFixed(2) + '%';
      const h = `<span class="d"></span><span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (d._h !== h) { d._h = h; d.innerHTML = h; }
    });
  }

  // the diagrams (SVG, 760×470 design px); returns how much a big one covers the panels (0…1)
  _insets(t) {
    const W = SB_W, c = sbCap;
    const which = [
      ['dunn', c('dunn', 1).show - 0.2, SB.out - 0.2, ''],
      ['brick', c('brick', 2).show - 0.3, SB.sweden + 0.2, ''],
      ['enough', c('enough', 2).show - 0.2, SB.compare - 0.2, ''],
      ['compare', c('compare', 0).show + 0.2, SB.boss - 0.2, 'mid'],
      ['candy', c('candy', 1).show + 0.4, SB.views - 0.2, ''],
      ['drive', c('drive', 2).show - 0.2, c('drive', 3).hide + 0.1, ''],
      ['years', c('years', 1).show - 0.2, SB.note - 0.2, ''],
      ['pledge', c('pledge', 1).show - 0.2, SB.real - 0.3, 'big'],
      ['letters', c('letters', 1).show - 0.2, SB.video - 0.2, ''],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, which && which[3] ? 'sb-inset ' + which[3] : 'sb-inset');
    if (!which) return 0;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key !== this._insetKey) { this._insetKey = key; this.inset.innerHTML = SbHud[k](u, t); }
    return which[3] === 'big' ? a : 0;
  }
  static svg(body) { return `<svg viewBox="0 0 760 470" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.68) { return `<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // a labelled horizontal bar: y, label, value text, fraction, colour, appear (0…1)
  static bar(y, label, val, f, col, k = 1, x0 = 300, w = 400) {
    return `<text x="${x0 - 20}" y="${y + 30}" class="b" text-anchor="end">${label}</text>
      <rect x="${x0}" y="${y}" width="${w}" height="44" rx="6" fill="rgba(255,255,255,0.08)"/>
      <rect x="${x0}" y="${y}" width="${(w * f * k).toFixed(1)}" height="44" rx="6" fill="${col}"/>
      <text x="${(x0 + w * f * k + 14).toFixed(1)}" y="${y + 31}" class="b" opacity="${k}">${val}</text>`;
  }
  // Dunn 2008: who was happier by the evening
  static dunn(u, t) {
    const k1 = MathX.smooth(t, sbCap('dunn', 1).show, sbCap('dunn', 1).show + 0.6), k2 = MathX.smooth(t, sbCap('dunn', 2).show + 0.3, sbCap('dunn', 2).show + 1.2);
    const fig = (x, col, happy) => `<g transform="translate(${x},0)"><circle cx="0" cy="190" r="34" fill="${col}"/><rect x="-40" y="232" width="80" height="96" rx="30" fill="${col}"/>
      <path d="M -14 ${happy ? 196 : 202} Q 0 ${happy ? 210 : 198} 14 ${happy ? 196 : 202}" stroke="#0b0e14" stroke-width="5" fill="none" stroke-linecap="round" opacity="${k2}"/></g>`;
    return SbHud.svg(`${SbHud.plate()}
      <text x="40" y="58" class="t">GIVEN AN ENVELOPE OF $5 OR $20 IN THE MORNING</text>
      <g opacity="${k1}">${fig(220, '#8fa0b8', false)}${fig(540, '#ffcf8a', true)}
      <text x="220" y="372" class="b" text-anchor="middle">TOLD: SPEND IT</text><text x="220" y="400" class="b" text-anchor="middle">ON YOURSELF</text>
      <text x="540" y="372" class="b" text-anchor="middle">TOLD: SPEND IT</text><text x="540" y="400" class="b" text-anchor="middle">ON SOMEONE ELSE</text></g>
      <g opacity="${k2}"><text x="540" y="126" class="s" text-anchor="middle">HAPPIER BY THE EVENING</text>
      <text x="380" y="446" class="s" text-anchor="middle">$5 OR $20: THE AMOUNT MADE NO DIFFERENCE</text></g>`);
  }
  // Brickman 1978: everyday pleasures, 0–5
  static brick(u, t) {
    const k = MathX.smooth(u, 0.2, 1.4);
    return SbHud.svg(`${SbHud.plate()}
      <text x="40" y="58" class="t">HOW MUCH THEY ENJOYED EVERYDAY THINGS</text>
      <text x="40" y="94" class="s">0 = NOT AT ALL · 5 = A GREAT DEAL</text>
      ${SbHud.bar(170, 'LOTTERY WINNERS', '3.33', 3.33 / 5, '#ffcf8a', k)}
      ${SbHud.bar(250, 'EVERYONE ELSE', '3.82', 3.82 / 5, '#8fa0b8', k)}
      <text x="40" y="372" class="s">BREAKFAST · A JOKE · A COMPLIMENT · A FRIEND</text>
      <text x="40" y="408" class="s">TV · A MAGAZINE · BUYING CLOTHES</text>
      <text x="40" y="446" class="s" opacity="0.8">22 WINNERS: A SMALL STUDY</text>`);
  }
  // Donnelly et al. 2018: how much more would make you a perfect 10
  static enough(u, t) {
    const k = MathX.smooth(u, 0.2, 1.4);
    return SbHud.svg(`${SbHud.plate()}
      <text x="40" y="58" class="t">WHAT WOULD MAKE YOU PERFECTLY HAPPY?</text>
      <text x="40" y="94" class="s">MILLIONAIRES' ANSWERS (SHARE WHO CHOSE EACH)</text>
      ${SbHud.bar(140, 'DOUBLE', '23%', 0.232 / 0.3, '#8fa0b8', k)}
      ${SbHud.bar(210, '5 TIMES MORE', '25%', 0.245 / 0.3, '#c9a873', k)}
      ${SbHud.bar(280, '10 TIMES MORE', '27%', 0.268 / 0.3, '#ffcf8a', k)}
      <text x="380" y="400" class="s" text-anchor="middle">THREE IN FOUR WANTED AT LEAST DOUBLE</text>
      <text x="380" y="438" class="s" text-anchor="middle" opacity="0.8">WHATEVER THEY ALREADY HAD</text>`);
  }
  // Solnick & Hemenway 1998: two worlds
  static compare(u, t) {
    const k1 = MathX.smooth(t, sbCap('compare', 0).show + 0.3, sbCap('compare', 0).show + 1.3), k2 = MathX.smooth(t, sbCap('compare', 1).show, sbCap('compare', 1).show + 1.0), k3 = MathX.smooth(t, sbCap('compare', 2).show + 0.4, sbCap('compare', 2).show + 1.4);
    const sc = 230 / 200000, col = (x, v, c, lab, k) => `<rect x="${x}" y="${(380 - v * sc * k).toFixed(1)}" width="74" height="${(v * sc * k).toFixed(1)}" rx="6" fill="${c}"/><text x="${x + 37}" y="${(368 - v * sc * k).toFixed(1)}" class="b" text-anchor="middle" opacity="${k}">${lab}</text>`;
    return SbHud.svg(`${SbHud.plate(0.74)}
      <g opacity="${k1}"><text x="200" y="64" class="t" text-anchor="middle">WORLD A</text>
      ${col(110, 50000, '#ffcf8a', '$50k', k1)}${col(210, 25000, '#8fa0b8', '$25k', k1)}
      <text x="147" y="414" class="s" text-anchor="middle">YOU</text><text x="247" y="414" class="s" text-anchor="middle">EVERYONE</text></g>
      <g opacity="${k2}"><text x="560" y="64" class="t" text-anchor="middle">WORLD B</text>
      ${col(470, 100000, '#ffcf8a', '$100k', k2)}${col(570, 200000, '#8fa0b8', '$200k', k2)}
      <text x="507" y="414" class="s" text-anchor="middle">YOU</text><text x="607" y="414" class="s" text-anchor="middle">EVERYONE</text></g>
      <line x1="380" y1="80" x2="380" y2="420" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <g opacity="${k3}"><rect x="40" y="86" width="320" height="42" rx="21" fill="rgba(255,207,138,0.18)" stroke="#ffcf8a" stroke-width="2"/>
      <text x="200" y="115" class="b" text-anchor="middle">ABOUT HALF CHOSE THIS</text>
      <text x="380" y="454" class="s" text-anchor="middle">PRICES THE SAME IN BOTH WORLDS</text></g>`);
  }
  // Piff 2012: candy meant for children
  static candy(u, t) {
    const k = MathX.smooth(u, 0.2, 1.2);
    return SbHud.svg(`${SbHud.plate()}
      <text x="40" y="58" class="t">SWEETS TAKEN (AVERAGE PIECES)</text>
      ${SbHud.bar(140, 'FELT RICHER', '1.17', 1.17 / 1.4, '#ffcf8a', k)}
      ${SbHud.bar(220, 'FELT POORER', '0.60', 0.6 / 1.4, '#8fa0b8', k)}
      <text x="40" y="350" class="s">THEY WERE TOLD THE JAR WAS FOR CHILDREN</text>
      <text x="40" y="386" class="s">IN A NEARBY LAB</text>
      <text x="40" y="440" class="s" opacity="0.8">MADE TO FEEL RICH: BY COMPARING THEMSELVES</text>`);
  }
  // Piff 2012: the crossing (13 top cars, 6 drove through; 5 cheapest, none did)
  static drive(u, t) {
    const k1 = MathX.smooth(u, 0.2, 1.4), k2 = MathX.smooth(t, sbCap('drive', 3).show, sbCap('drive', 3).show + 1.0);
    const car = (x, y, red, k) => `<g transform="translate(${x},${y})" opacity="${k}"><rect x="0" y="8" width="44" height="18" rx="6" fill="${red ? '#ff7a64' : '#8fa0b8'}"/><rect x="8" y="0" width="26" height="14" rx="5" fill="${red ? '#ff7a64' : '#8fa0b8'}"/><circle cx="10" cy="28" r="5" fill="#0b0e14"/><circle cx="34" cy="28" r="5" fill="#0b0e14"/></g>`;
    let top = '', low = '';
    for (let i = 0; i < 13; i++) top += car(40 + i * 53, 128, i < 6, MathX.smooth(k1 * 13, i, i + 1));
    for (let i = 0; i < 5; i++) low += car(40 + i * 53, 318, false, MathX.smooth(k2 * 5, i, i + 1));
    return SbHud.svg(`${SbHud.plate()}
      <text x="40" y="58" class="t">A PEDESTRIAN WAITS AT THE CROSSING</text>
      <text x="40" y="104" class="s">THE MOST EXPENSIVE CARS · 13 WATCHED</text>${top}
      <text x="40" y="208" class="b" opacity="${k1}"><tspan fill="#ff9b86">6 DROVE ON</tspan> · 7 STOPPED</text>
      <g opacity="${k2}"><text x="40" y="294" class="s">THE CHEAPEST CARS · 5 WATCHED</text>${low}
      <text x="40" y="398" class="b">ALL 5 STOPPED</text>
      <text x="40" y="444" class="s" opacity="0.8">5 IS VERY FEW: A SMALL STUDY</text></g>`);
  }
  // your money against what you gave, years 0–10 (computed from money.js at a few story days)
  static years(u, t) {
    if (!SbHud._yrs) {
      // (the curves by story day: the ledger at its own days, as the cold open sees it)
      const r = SBM.rate, pts = [];
      for (let y = 0; y <= 10.0001; y += 0.25) {
        const d = y * 365; let w = (SBM.win + SBM.start) * Math.exp(r * d), g = 0;
        SB_LEDGER.forEach((e, i) => { if (SB_LEDGER_DAY[i] <= d) { w -= e[1] * Math.exp(r * (d - SB_LEDGER_DAY[i])); if (e[2] === 'give') g += e[1]; } });
        for (const [d0, yr, kind] of SB_FLOWS) if (d > d0) { w -= (yr / 365) * (Math.exp(r * (d - d0)) - 1) / r; if (kind === 'give') g += yr * (d - d0) / 365; }
        pts.push([y, w, g]);
      }
      SbHud._yrs = pts;
    }
    const P = SbHud._yrs, X = (y) => 80 + y * 62, Y = (v) => 390 - v / 1.5e9 * 300, upto = Math.min(10, sbDay(t) / 365);
    const path = (j) => P.filter((p) => p[0] <= upto + 1e-6).map((p, i) => `${i ? 'L' : 'M'} ${X(p[0]).toFixed(1)} ${Y(p[j]).toFixed(1)}`).join(' ');
    const last = P.filter((p) => p[0] <= upto + 1e-6).pop();
    return SbHud.svg(`${SbHud.plate()}
      <text x="40" y="58" class="t">YOUR MONEY · AND WHAT YOU GAVE</text>
      <line x1="80" y1="390" x2="700" y2="390" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <line x1="80" y1="${Y(5e8).toFixed(1)}" x2="700" y2="${Y(5e8).toFixed(1)}" stroke="rgba(159,224,176,0.45)" stroke-width="2" stroke-dasharray="8 8"/>
      <text x="700" y="${(Y(5e8) - 10).toFixed(1)}" class="s" text-anchor="end" fill="#9fe0b0">YOUR PROMISE: $500 MILLION</text>
      <path d="${path(1)}" stroke="#ffcf8a" stroke-width="5" fill="none"/>
      <path d="${path(2)}" stroke="#9fe0b0" stroke-width="5" fill="none"/>
      ${last ? `<text x="${(X(last[0]) - 8).toFixed(1)}" y="${(Y(last[1]) - 14).toFixed(1)}" class="b" text-anchor="end">${sbWords(last[1])}</text><text x="${(X(last[0]) - 8).toFixed(1)}" y="${(Y(last[2]) - 14).toFixed(1)}" class="b" text-anchor="end" fill="#9fe0b0">GIVEN ${sbWords(last[2])}</text>` : ''}
      ${[0, 2, 4, 6, 8, 10].map((y) => `<text x="${X(y)}" y="424" class="s" text-anchor="middle">${y ? 'YEAR ' + y : 'THE WIN'}</text>`).join('')}`);
  }
  // the Giving Pledge at 15 (IPS, 2025): 57 original US signers
  static pledge(u, t) {
    const c = (k) => sbCap('pledge', k).show, k2 = MathX.smooth(t, c(2), c(2) + 1.0), k3 = MathX.smooth(t, c(3), c(3) + 1.0), k4 = MathX.smooth(t, c(4), c(4) + 1.2);
    let dots = '';
    // 57 people: the first 32 are still billionaires, the last 22 have died (8 of them kept the promise), 3 others
    for (let i = 0; i < 57; i++) {
      const x = 70 + (i % 19) * 33, y = 120 + Math.floor(i / 19) * 40, still = i < 32, dead = i >= 35, kept = dead && i < 43;
      const col = k4 > 0.01 && dead ? (kept ? `rgba(159,224,176,${0.4 + 0.6 * k4})` : `rgba(255,255,255,${0.35 - 0.2 * k4})`) : k2 > 0.01 && still ? '#ffcf8a' : 'rgba(235,230,220,0.75)';
      dots += `<circle cx="${x}" cy="${y}" r="13" fill="${col}"/>`;
    }
    return SbHud.svg(`${SbHud.plate(0.8)}
      <text x="40" y="66" class="t">57 AMERICAN BILLIONAIRES PROMISED IN 2010</text>${dots}
      <g opacity="${k2 * (1 - k4)}"><text x="40" y="270" class="eq"><tspan fill="#ffcf8a">32</tspan> STILL BILLIONAIRES: <tspan fill="#ffcf8a">+283%</tspan></text>
      <text x="40" y="306" class="s">RICHER BY 166% EVEN AFTER INFLATION</text></g>
      <g opacity="${k3 * (1 - k4)}"><rect x="40" y="350" width="680" height="34" rx="8" fill="rgba(255,255,255,0.12)"/><rect x="40" y="350" width="${(680 * 0.8 * k3).toFixed(1)}" height="34" rx="8" fill="#c9a873"/>
      <text x="40" y="420" class="s">80% OF WHAT WAS TRACKED WENT TO PRIVATE FOUNDATIONS</text><text x="40" y="452" class="s" opacity="0.8">FOUNDATIONS THE GIVERS OFTEN RUN THEMSELVES</text></g>
      <g opacity="${k4}"><text x="40" y="290" class="eq"><tspan fill="#9fe0b0">8</tspan> OF THE <tspan fill="#ffcf8a">22</tspan> WHO HAVE DIED</text>
      <text x="40" y="328" class="s">GAVE AT LEAST HALF</text></g>`);
  }
  // Andreoni et al. 2021: misdelivered letters returned; then the share of income given (US, 2008)
  static letters(u, t) {
    const k1 = MathX.smooth(u, 0.2, 1.3), k2 = MathX.smooth(t, sbCap('letters', 3).show, sbCap('letters', 3).show + 1.0);
    return SbHud.svg(`${SbHud.plate()}
      <g opacity="${1 - k2}"><text x="40" y="58" class="t">LOST LETTERS POSTED BACK</text>
      ${SbHud.bar(130, 'RICH HOMES', '81%', 0.81, '#ffcf8a', k1)}
      ${SbHud.bar(210, 'POOR HOMES', '38%', 0.38, '#8fa0b8', k1)}
      <text x="40" y="360" class="s">ENVELOPES DELIVERED TO THE WRONG ADDRESS</text><text x="40" y="396" class="s">ON PURPOSE, ACROSS A DUTCH CITY</text></g>
      <g opacity="${k2}"><text x="40" y="58" class="t">SHARE OF SPARE INCOME GIVEN (US, 2008)</text>
      ${SbHud.bar(130, 'EARNING $50–75k', '7.6%', 0.76, '#8fa0b8', k2)}
      ${SbHud.bar(210, 'EARNING $100k+', '4.2%', 0.42, '#ffcf8a', k2)}
      <text x="40" y="360" class="s">MORE DOLLARS FROM THE RICH</text><text x="40" y="396" class="s">BUT A SMALLER SHARE OF WHAT THEY HAVE</text></g>`);
  }
}
