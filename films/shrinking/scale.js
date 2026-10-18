/* =====================================================================
   SCALE — your height over time and the ways it is written on screen.
     shH(t)        your height in metres (monotone cubic through SH_KEYS in log10)
     shL(t)        log10 of it
     shFmt(h)      "1.75 m" · "4.6 mm" · "240 µm" · "35 nm" · "80 pm" · "3.2 fm" · "1.6 × 10⁻³⁵ m"
     SH_SIZES      what you are as tall as (the readout's second line) and the NEXT landmark
     shRoom(h)     your 4 m bedroom, to you: the equivalent distance and what it is as big as
   ===================================================================== */

// ---- the height curve: PCHIP (Fritsch–Carlson) through (t, log10 h)
const SH_CURVE = (() => {
  const X = SH_KEYS.map((k) => k[0]), Y = SH_KEYS.map((k) => Math.log10(k[1])), n = X.length;
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const w1 = 2 * (X[i + 1] - X[i]) + (X[i] - X[i - 1]), w2 = (X[i + 1] - X[i]) + 2 * (X[i] - X[i - 1]);
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return { X, Y, m };
})();
function shL(t) {
  const { X, Y, m } = SH_CURVE;
  if (t <= X[0]) return Y[0];
  if (t >= X[X.length - 1]) return Y[Y.length - 1];
  let i = 0; while (X[i + 1] < t) i++;
  const h = X[i + 1] - X[i], s = (t - X[i]) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * Y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * Y[i + 1] + (s3 - s2) * h * m[i + 1];
}
const shH = (t) => Math.pow(10, shL(t));
// the shrink rate in decades per second (positive = getting smaller)
const shRate = (t) => (shL(t - 0.05) - shL(t + 0.05)) / 0.1;

// ---- formatting
const SH_SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
function shSig(x) { return x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2); }
function shFmt(h) {
  const U = [[1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm']];
  for (const [u, name] of U) if (h >= u * 0.9995) return `${shSig(h / u)} ${name}`;
  const e = Math.floor(Math.log10(h)), mant = h / Math.pow(10, e);
  return `${mant.toFixed(1)} × 10${String(e).split('').map((c) => SH_SUP[c]).join('')} m`;
}
// the zeros after the decimal point before the first digit (0.0016 → 2)
const shZeros = (h) => -Math.floor(Math.log10(h)) - 1;

// ---- what you are as tall as, and the next thing on the way down: [height (m), what, short name for NEXT]
const SH_SIZES = [
  [1.75, 'AN ADULT'], [1.15, 'A SIX-YEAR-OLD'], [0.86, 'A TWO-YEAR-OLD'], [0.5, 'A NEWBORN BABY'], [0.3, 'A CAT'], [0.15, 'A PENCIL'],
  [0.065, 'YOUR THUMB'], [0.0114, 'A TOY BRICK'], [0.0078, 'THE EDGE OF YOUR PHONE'], [0.003, 'A FLEA'], [0.002, 'ONE LETTER ON A SCREEN'],
  [0.000055 * 10, 'TEN PIXELS'], [3.0e-4, 'A DUST MITE'], [7.0e-5, 'THE WIDTH OF A HAIR'], [3.0e-5, 'A GRAIN OF POLLEN'],
  [2.0e-6, 'A BACTERIUM'], [5.0e-7, 'A WAVE OF LIGHT'], [2.0e-7, 'A VIRUS'],
  [2.0e-9, 'A STRAND OF DNA'], [1.5e-10, 'AN ATOM'],
  [5.5e-15, 'A NUCLEUS'], [1.7e-15, 'A PROTON'], [1.0e-19, 'THE CLOSEST ANY EXPERIMENT HAS LOOKED'], [1.6e-35, 'THE PLANCK LENGTH'],
];
// the line under your height: the last landmark you have shrunk to (or past)
function shNow(h) {
  let cur = SH_SIZES[0];
  for (const s of SH_SIZES) if (h <= s[0] * 1.02) cur = s;
  return cur;
}
function shNext(h) {
  for (const s of SH_SIZES) if (s[0] < h * 0.98) return s;
  return null;
}

// ---- your bedroom (4 m across), to you: the same ratio at human size
const SH_ROOM = 4.0;
const SH_LY = 9.4607e15;
const SH_THINGS = [   // [real size (m), what]
  [4, 'A BEDROOM'], [15, 'A HOUSE'], [100, 'A FOOTBALL PITCH'], [400, 'A SKYSCRAPER'], [4000, 'A MOUNTAIN'], [30e3, 'A CITY'],
  [800e3, 'A COUNTRY'], [4.5e6, 'A CONTINENT'], [12.7e6, 'THE EARTH'], [140e6, 'JUPITER'], [384e6, 'THE DISTANCE TO THE MOON'],
  [1.39e9, 'THE SUN'], [3.0e11, 'THE ORBIT OF THE EARTH'], [9e12, 'THE ORBIT OF NEPTUNE'], [4.0e16, 'THE DISTANCE TO THE NEAREST STAR'],
  [9.5e20, 'THE MILKY WAY'], [2.4e22, 'THE DISTANCE TO ANDROMEDA'], [8.8e26, 'THE VISIBLE UNIVERSE'],
];
function shRoom(h) {
  const L = SH_ROOM * 1.75 / h;
  // "AS BIG AS" only when within 30 % of a real size; otherwise "BIGGER THAN" the largest thing it has passed
  let what = 'AS BIG AS A BEDROOM';
  for (const [sz, name] of SH_THINGS) { if (L >= sz * 0.7 && L <= sz * 1.3) { what = 'AS BIG AS ' + name; break; } if (L > sz) what = 'BIGGER THAN ' + name; }
  let v;
  if (L < 1000) v = `${shSig(L)} m`;
  else if (L < 1e9) v = `${Math.round(L / 1000).toLocaleString('en-US')} km`;
  else if (L < 1e12) v = `${shSig(L / 1e9)} million km`;
  else if (L < SH_LY * 0.1) v = `${shSig(L / 1e12)} billion km`;
  else if (L < SH_LY * 1e3) v = `${shSig(L / SH_LY)} light-years`;
  else if (L < SH_LY * 1e6) v = `${Math.round(L / SH_LY).toLocaleString('en-US')} light-years`;
  else if (L < SH_LY * 1e9) v = `${shSig(L / SH_LY / 1e6)} million light-years`;
  else if (L < 8.8e26) v = `${shSig(L / SH_LY / 1e9)} billion light-years`;
  else {
    const k = L / 8.8e26;
    v = k < 1000 ? `${shSig(k)} × the universe` : `${Math.round(k).toLocaleString('en-US')} × the universe`;
    if (k >= 1e6) v = `${shSig(k / 1e6)} million × the universe`;
    if (k >= 1e9) v = `${shSig(k / 1e9)} billion × the universe`;
  }
  if (L > 8.8e26 * 1.3) what = 'BIGGER THAN EVERYTHING WE CAN SEE';
  return { L, v, what };
}
