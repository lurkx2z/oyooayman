/* =====================================================================
   MONEY — your story's money, a pure function of film time (the readout, the phone, the bank app all read it).
     sbDay(t)    the story's clock: days since you won (the draw ends at day 0, Saturday 10:59 pm). Between the
                 film's date jumps it runs in real time (so the cents tick); at a jump it rolls to the new date in 1.6 s.
     sbMoney(t)  YOUR MONEY ($): $412.37 before the win; after it, $1,000,000,412.37 earning 5% a year
                 ($137,000 a day, $1.59 a second), minus what you spend and give (each at the moment you see it),
                 each of those also no longer earning.
     sbGiven(t)  what you've given away ($), and sbGivenPct(t) as a share of the billion you won.
     sbDelta(t)  the last thing you paid for (for the readout's "− $28,000,000 · THE HOUSE"), shown for 2.8 s.
   The story is made up; the 5% is a typical long-run return on a large, mixed portfolio (assumed, see PLAN.md § 2).
   ===================================================================== */

const SBM = { start: 412.37, win: 1e9, rate: 0.05 / 365, rent: 1240 };

// the date jumps: [film time, story day]; the cold open and the ending are ten years on
const SB_DAYS = [
  [SB.mum, 0.45],                     // day one, 10:48 am
  [SB.out, 2.38],                     // day three, 9:07 am
  [SB.interest, 4.13],                // day five, 3:07 am
  [SB.house, 60.4],                   // month two
  [SB.neighbours, 75.6],
  [SB.six, 182.35],                   // month six, 8:24 am
  [SB.enough, 270.8],                 // month nine, dusk
  [SB.boss, 365.4],                   // year one
  [SB.views, 480.9],
  [SB.yacht, 730.8],                  // year two
  [SB.wall, 790.5],
  [SB.walk, 1095.5],                  // year three
  [SB.drive, 1180.4],
  [SB.years, 1826.5],                 // year five …
  [sbW('years', 'eight').start - 0.2, 2922.5],   // … year eight
  [SB.note, 3290.6],                  // year nine
  [SB.point, 3652.9],                 // year ten, 9:36 pm
];
SBM.roll = 1.6;
SBM.tWin = SB.ball[5];
function sbDay(t) {
  if (t < SB.mum) return t < SB.titleShot ? 3652.9 + (t - SB.titleShot) / 86400 : (t - SBM.tWin) / 86400;
  let i = SB_DAYS.length - 1; while (i > 0 && SB_DAYS[i][0] > t) i--;
  const [t1, d1] = SB_DAYS[i], d0 = i > 0 ? SB_DAYS[i - 1][1] + (t1 - SB_DAYS[i - 1][0]) / 86400 : (t1 - SBM.tWin) / 86400;
  const u = (t - t1) / SBM.roll;
  return u < 1 ? d0 + (d1 - d0) * Ease.inOutSine(Math.max(0, u)) : d1 + (t - t1 - SBM.roll) / 86400;
}
// what you pay for or give: [film time, $, 'spend' | 'give', what]
const SB_LEDGER = [
  [SB.sendMum, 310000, 'give', "YOUR MUM'S HOUSE"],
  [SB.sendFriend, 64000, 'give', "SAM'S DEBTS"],
  [SB.buyHouse, 28000000, 'spend', 'THE HOUSE'],
  [SB.buyCar, 420000, 'spend', 'THE CAR'],
  [SB.buyYacht, 70000000, 'spend', 'THE YACHT'],
  [SB.buyWall, 3000000, 'spend', 'A WALL, A GATE, A GUARD'],
  [SB.give10, 10000000, 'give', 'A HOSPITAL WING'],
  [SB.give5, 5000000, 'give', 'A SCHOOL'],
];
// what keeps going out: [from story day, $ a year, 'spend' | 'give'] (staff, upkeep, security; a gala cheque now and then)
const SB_FLOWS = [[60.4, 6e6, 'spend'], [365.4, 1e6, 'give'], [730.8, 7e6, 'spend'], [790.5, 2e6, 'spend']];

function sbMoneyAt(t) {
  if (t < SB.billion && t >= SB.titleShot) return SBM.start;
  const d = Math.max(0, sbDay(t)), r = SBM.rate;
  let w = (SBM.win + SBM.start) * Math.exp(r * d);
  for (const [te, a] of SB_LEDGER) if (t >= te && t >= SB.titleShot) w -= a * Math.exp(r * (d - Math.max(0, sbDay(te))));
  for (const [d0, y] of SB_FLOWS) if (d > d0) w -= (y / 365) * (Math.exp(r * (d - d0)) - 1) / r;
  return w;
}
// (the cold open: every ledger entry, at its own story day)
const SB_LEDGER_DAY = SB_LEDGER.map((e) => sbDay(e[0]));
function sbMoney(t) {
  if (t < SB.titleShot) {
    const d = sbDay(t), r = SBM.rate;
    let w = (SBM.win + SBM.start) * Math.exp(r * d);
    SB_LEDGER.forEach((e, i) => { w -= e[1] * Math.exp(r * (d - SB_LEDGER_DAY[i])); });
    for (const [d0, y] of SB_FLOWS) if (d > d0) w -= (y / 365) * (Math.exp(r * (d - d0)) - 1) / r;
    return w;
  }
  if (t < SB.billion) return SBM.start;
  const k = Ease.inOutCubic(MathX.clamp((t - SB.billion) / 1.6, 0, 1));
  const w = sbMoneyAt(t);
  return k < 1 ? SBM.start + (w - SBM.start) * k : w;
}
function sbGiven(t) {
  const ten = t < SB.titleShot, d = sbDay(t);
  let g = 0;
  for (const [te, a, kind] of SB_LEDGER) if (kind === 'give' && (ten || t >= te)) g += a;
  for (const [d0, y, kind] of SB_FLOWS) if (kind === 'give' && d > d0) g += y * (d - d0) / 365;
  return g;
}
const sbGivenPct = (t) => 100 * sbGiven(t) / SBM.win;
function sbDelta(t) {
  for (let i = SB_LEDGER.length - 1; i >= 0; i--) { const e = SB_LEDGER[i]; if (t >= e[0] && t < e[0] + 2.8) return { t0: e[0], a: e[1], kind: e[2], what: e[3] }; }
  return null;
}
// $ a second right now (for the phone's "+$1.59/s")
const sbPerSecond = (t) => sbMoney(t) * SBM.rate / 86400;
// the note's "half" (the caption says it: build-timing writes the number, script.js checks it)
SBM.halfAtNote = () => sbMoney(sbCap('note', 1).show) / 2;

// formatting: "$1,000,000,412.37", "$28,000,000", "$137,000"
function sbThousands(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function sbDollars(x, cents = true) {
  if (!cents) return '$' + sbThousands(x);
  const c = Math.floor(x * 100 + 1e-6), w = Math.floor(c / 100), f = String(c % 100).padStart(2, '0');
  return '$' + sbThousands(w) + '.' + f;
}
// "$28 MILLION", "$1.3 BILLION"
function sbWords(x) {
  if (x >= 1e9) return '$' + (x / 1e9).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + ' BILLION';
  if (x >= 1e6) return '$' + (x >= 1e8 ? Math.round(x / 1e6) : (x / 1e6).toFixed(1).replace(/\.0$/, '')) + ' MILLION';
  return '$' + sbThousands(x);
}
