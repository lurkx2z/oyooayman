/* =====================================================================
   HUD — this film's overlay (DOM in #hud, a pure function of time). The new recipe's minimal text, bold sans:
     top left      MAGNITUDE and one giant number (it pops yellow on every tick), one status word, the minute bar
                   (MINUTE N · your clock; it fills towards the next magnitude)
     in the scene  labels pinned to things (set.labels(t, shot) → [{ p, text, sub, a, side, you, quake }]): measured
                   first, then placed clear of the counter and of each other
     diagrams      full-frame SVG drawings where the narration compares (shot.dia; clear of the counter)
     bottom left   the honest tag (what is real, what is made up)
     the end       the question, big; then the honest note
   ===================================================================== */

const eqN = (x) => Math.round(x).toLocaleString('en-US');

// the honest tags: [from, to, text] (film seconds)
const EQ_TAGS = (() => {
  const W = (id, k = 0) => eqW(id, k) - 0.3, E = (id, d = 0.4) => eqE_(id) + d;
  return [
    [W('sat'), E('sat'), 'SAN FRANCISCO IS REAL · YOUR CAFÉ AND YOUR PIER ARE MADE UP'],
    [W('rule'), E('rule'), 'THE ONE MADE-UP RULE · REAL EARTHQUAKES PEAK AND STOP'],
    [W('x32'), E('x32'), 'EACH STEP: ABOUT 10× THE SHAKING · 32× THE ENERGY (USGS: LOG₁₀ E = 1.5 M + 4.8)'],
    [W('realtime'), E('realtime', 1.2), 'ONE MINUTE OF FILM = ONE MINUTE OF EARTHQUAKE'],
    [W('faults'), E('faults'), 'REAL: THE SAN ANDREAS AND HAYWARD FAULTS (USGS)'],
    [W('alert'), E('alert', 1.8), 'REAL: CALIFORNIA’S SHAKEALERT SENDS PHONE ALERTS LIKE THIS'],
    [W('drop'), E('drop'), 'REAL ADVICE IN A REAL EARTHQUAKE: DROP, COVER, HOLD ON'],
    [W('ferry'), E('ferry'), 'REAL: THE FERRY BUILDING (1898) CAME THROUGH 1906 AND 1989'],
    [W('start'), E('start'), 'A TURBINE HELICOPTER TAKES A MINUTE OR TWO TO START UP'],
    [W('mud'), E('sink'), 'REAL: MUCH OF THE WATERFRONT IS FILL · IN 1989 FILL LIKE IT TURNED TO MUD'],
    [W('haiti'), E('haiti'), 'HAITI, 12 JANUARY 2010: MAGNITUDE 7.0'],
    [W('split'), E('split'), 'REAL: ON SOFT FILL THE GROUND SLIDES TOWARD THE WATER AND CRACKS OPEN (LATERAL SPREADING)'],
    [W('lift'), E('lift', 1.5), 'THE PIER IS GOING: YOUR PILOT LIFTS OFF BEFORE THE ENGINE IS AT FULL POWER'],
    [W('baybridge'), E('baybridge', 1.5), 'REAL: LOMA PRIETA, 1989 (6.9): A 15 M PIECE OF THE BAY BRIDGE’S EAST SPAN FELL'],
    [W('y1906'), E('fires'), 'SAN FRANCISCO, 18 APRIL 1906: MAGNITUDE 7.9 · THE FIRES BURNED FOR THREE DAYS'],
    [W('bravo'), E('bravo'), 'CASTLE BRAVO, 1954: 15 MEGATONS · MAGNITUDE 8 ≈ 15 MEGATONS OF TNT'],
    [W('pyramid'), E('pyramid'), 'REAL: IN 1989 THE PYRAMID SWAYED FOR OVER A MINUTE, UNDAMAGED'],
    [W('notjust'), E('notjust', 1.5), 'REAL: ABOUT 1.4 MILLION EARTHQUAKES OF MAGNITUDE 2 OR MORE A YEAR (USGS)\nIN THIS FILM, EVERY ONE OF THEM KEEPS GROWING TOO'],
    [W('japan'), E('japan'), 'TŌHOKU, JAPAN, 11 MARCH 2011: MAGNITUDE 9.0–9.1'],
    [W('tsar'), E('tsar'), 'TSAR BOMBA, 1961: 50 MEGATONS, THE BIGGEST BOMB EVER BUILT'],
    [W('empty'), E('empty', 1.0), 'REAL: SHAKING CAN SLOSH A BAY LIKE A BATH (A SEICHE)'],
    [W('mexico'), E('mexico'), 'REAL: IN 1985 AND 2017 THE OLD LAKE BED MADE MEXICO CITY SHAKE HARDER'],
    [W('never2'), E('never2'), 'VALDIVIA, CHILE, 22 MAY 1960: MAGNITUDE 9.5, THE STRONGEST EVER RECORDED'],
    [W('fault'), E('fault'), 'BIGGER QUAKES NEED LONGER FAULTS · THE LONGEST EVER SEEN: ABOUT 1,500 KM · A TEN NEEDS FAR MORE'],
    [W('gravity'), E('gravity'), 'REAL: A FEW SPOTS HAVE SHAKEN PAST 1 G (NORTHRIDGE 1994, IWATE 2008) · HERE THE WHOLE CITY DOES'],
    [W('month'), E('month'), 'ALL HUMAN ENERGY USE: ABOUT 620 EXAJOULES A YEAR'],
    [W('dam'), E('dam'), 'HOOVER DAM: 221 M TALL, 1936 · LAKE MEAD BEHIND IT'],
    [W('needle'), E('needle'), 'SPACE NEEDLE: 184 M, 1962'],
    [W('crack'), E('crack', 3.4), 'THE CRACK GROWS AT 5 KM/S, AS FAST AS THE FASTEST REAL RUPTURES'],
    [E('crack', 3.6), eqTick(9) - 0.4, 'REAL FAULTS SLIDE SIDEWAYS, THEY DON’T GAPE OPEN · PAST MAGNITUDE 10, NOBODY KNOWS WHAT THEY’D DO'],
    [W('tokyo'), E('tokyo'), 'TOKYO IS 16 HOURS AHEAD OF SAN FRANCISCO · TOKYO SKYTREE: 634 M'],
    [W('dubai'), E('dubai'), 'BURJ KHALIFA: 828 M'],
    [W('istanbul'), E('istanbul'), 'THE BOSPHORUS BRIDGE, 1973: EUROPE ON ONE SIDE, ASIA ON THE OTHER'],
    [W('sun'), E('sun'), 'ALL THE SUNLIGHT REACHING EARTH: ABOUT 174,000 TERAWATTS'],
    [W('melt'), E('melt'), 'REAL: FAST FAULT SLIP CAN MELT ROCK (PSEUDOTACHYLYTE)'],
    [W('dino'), E('dino'), 'THE CHICXULUB ASTEROID, 66 MILLION YEARS AGO: ABOUT 4 × 10²³ JOULES'],
    [W('seven'), E('seven'), 'TO BLOW EARTH APART: ABOUT 2.2 × 10³² JOULES (ITS GRAVITATIONAL BINDING ENERGY)'],
  ];
})();

// the diagrams: shot.dia → (u: seconds since the diagram started, t, shot) → SVG body (1920 × 1080)
const EQ_DIA = (() => {
  const K = (u, a, b) => MathX.smooth(u, a, b);
  const f2 = (x) => x.toFixed(2), f1 = (x) => x.toFixed(1);
  const plate = (x, y, w, h, a = 0.74) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="rgba(8,10,14,${a})"/>`;
  const tx = (x, y, s, cls, text, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" class="${cls}" font-size="${s}" text-anchor="${anchor}" ${extra}>${text}</text>`;
  const bar = (x, y, w, h, col, k = 1, r = 10) => `<rect x="${x}" y="${y}" width="${f1(Math.max(0, w * k))}" height="${h}" rx="${Math.min(r, h / 2)}" fill="${col}"/>`;
  // a title's size so that it fits w px (caps in the bold face run about 0.7 em a letter)
  const fit = (text, w, size) => Math.min(size, Math.floor(w / (0.7 * text.replace(/<[^>]+>/g, '').length)));
  const op = (k, body) => `<g opacity="${f2(k)}">${body}</g>`;
  const RED = '#ff4a3a', AMB = '#ffd36a', YOU = '#ff6a1f', SKY = '#7cc8ff', PALE = '#e8e3d8';
  const bolt = (x, y, s, col) => `<path transform="translate(${x} ${y}) scale(${s})" d="M30 0 L4 54 L24 54 L12 100 L50 38 L28 38 L42 0 Z" fill="${col}"/>`;
  // a comparison: two bars (left a known thing, right this earthquake), at the right of the frame
  const compare = (u, title, la, va, a, lb, vb, b, col2 = RED) => {
    let s = plate(1290, 250, 570, 600);
    const H = 340, m = Math.max(a, b), k1 = K(u, 0.3, 1.2), k2 = K(u, 1.2, 2.1), y0 = 760;
    s += tx(1330, 318, fit(title, 510, 40), 'b', title);
    s += bar(1350, y0 - H * a / m * k1, 200, H * a / m * k1, PALE, 1, 14) + bar(1600, y0 - H * b / m * k2, 200, H * b / m * k2, col2, 1, 14);
    s += op(k1, tx(1450, y0 - H * a / m - 20, 40, 'b', va, 'middle')) + op(k2, tx(1700, y0 - H * b / m - 20, 40, 'b', vb, 'middle'));
    s += tx(1450, 806, Math.min(26, fit(la, 240, 26)), 's', la, 'middle') + op(k2, tx(1700, 806, Math.min(26, fit(lb, 240, 26)), 's', lb, 'middle'));
    return s;
  };
  // squares: n of them in a grid, filling in over [a, b] seconds
  const squares = (u, x0, y0, cols, n, size, gap, col, a, b) => {
    let s = '';
    const k = K(u, a, b) * n;
    for (let i = 0; i < n; i++) { if (i >= k) break; const c = i % cols, r = Math.floor(i / cols); s += `<rect x="${x0 + c * (size + gap)}" y="${y0 + r * (size + gap)}" width="${size}" height="${size}" rx="${Math.min(4, size / 4)}" fill="${col}"/>`; }
    return s;
  };
  // a phone, with rows of notifications appearing at given film times
  const phone = (u, t, x, y, title, rows, sub) => {
    const k = K(u, 0.05, 0.4);
    let s = `<g transform="translate(${f1(x + 40 * (1 - k))} ${y})" opacity="${f2(k)}">`;
    s += `<rect x="0" y="0" width="470" height="780" rx="56" fill="#0d0f13" stroke="#3a3f48" stroke-width="6"/><rect x="22" y="22" width="426" height="736" rx="40" fill="#1b2230"/>`;
    s += tx(235, 118, 78, 'b', title, 'middle') + tx(235, 158, 24, 's', sub, 'middle');
    rows.forEach(([at, a, b, col], i) => { const kk = MathX.smooth(t, at, at + 0.25); if (kk <= 0) return; s += op(kk, `<rect x="40" y="${200 + i * 128}" width="390" height="110" rx="22" fill="${col || 'rgba(255,255,255,0.13)'}"/>${tx(66, 246 + i * 128, 32, 'b', a)}${tx(66, 286 + i * 128, 24, 'w', b)}`); });
    return s + '</g>';
  };
  // a ladder of magnitudes on a line (left → right), each a tick with a name
  const D = {
    // minute 1: about a bolt of lightning
    lightning: (u) => {
      let s = plate(1300, 230, 560, 560);
      s += tx(1580, 310, 40, 'b', 'MAGNITUDE 3', 'middle');
      s += op(K(u, 0.4, 1.0), bolt(1520, 350, 2.6, AMB));
      s += op(K(u, 1.2, 1.8), tx(1580, 700, 44, 'b', '≈ 1 BOLT OF', 'middle') + tx(1580, 752, 44, 'b', 'LIGHTNING', 'middle', `style="fill:${AMB}"`));
      return s;
    },
    // every step up: 32 times the energy
    x32: (u) => {
      let s = plate(1180, 200, 690, 640);
      s += tx(1220, 270, fit('+1 MAGNITUDE = 32× THE ENERGY', 620, 40), 'b', '+1 MAGNITUDE = <tspan fill="' + AMB + '">32×</tspan> THE ENERGY');
      s += tx(1240, 340, 28, 's', 'MAGNITUDE 3') + `<rect x="1240" y="360" width="40" height="40" rx="5" fill="${PALE}"/>`;
      s += op(K(u, 1.6, 2.0), tx(1240, 470, 28, 's', 'MAGNITUDE 4'));
      s += squares(u, 1240, 490, 8, 32, 40, 8, YOU, 1.8, 4.6);
      s += op(K(u, 4.4, 5.0), tx(1680, 620, 64, 'b', '32×', 'middle'));
      return s;
    },
    // two steps: a thousand
    x1000: (u) => {
      let s = plate(1180, 150, 690, 760);
      s += tx(1220, 220, 40, 'b', '+2 MAGNITUDES = <tspan fill="' + AMB + '">1,000×</tspan>');
      s += tx(1240, 280, 28, 's', 'MAGNITUDE 3') + `<rect x="1240" y="296" width="14" height="14" rx="2" fill="${PALE}"/>`;
      s += op(K(u, 0.4, 0.8), tx(1240, 360, 28, 's', 'MAGNITUDE 5'));
      s += squares(u, 1240, 380, 32, 1000, 14, 4, RED, 0.5, 3.6);
      return s;
    },
    // a normal earthquake's seismogram (a few seconds) against this one (a minute, and still going)
    seismo: (u) => {
      let s = plate(1120, 240, 750, 560);
      const trace = (y, len, amp, decay, col, k) => { let d = ''; const N = Math.max(2, Math.floor(len * k)); for (let i = 0; i < N; i++) { const x = 1170 + i, q = i / 640; const a = amp * (decay ? Math.exp(-Math.max(0, q - 0.03) * 22) * MathX.smooth(q, 0, 0.02) : MathX.smooth(q, 0, 0.05) * (0.7 + 0.3 * Math.sin(q * 9))); d += (i ? 'L' : 'M') + x + ' ' + f1(y + a * Math.sin(i * 0.9) * Math.sin(i * 0.37 + 1)); } return `<path d="${d}" stroke="${col}" stroke-width="3" fill="none"/>`; };
      s += tx(1160, 310, fit('A NORMAL EARTHQUAKE: A FEW SECONDS', 680, 34), 'b', 'A NORMAL EARTHQUAKE: A FEW SECONDS');
      s += `<line x1="1170" y1="420" x2="1810" y2="420" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>` + trace(420, 640, 70, true, PALE, K(u, 0.3, 1.6));
      s += op(K(u, 2.8, 3.3), tx(1160, 560, fit('A NORMAL EARTHQUAKE: A FEW SECONDS', 680, 34), 'b', 'THIS ONE: <tspan fill="' + RED + '">A WHOLE MINUTE</tspan>'));
      s += `<line x1="1170" y1="680" x2="1810" y2="680" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>` + op(K(u, 3.0, 3.2), trace(680, 640, 70, false, RED, K(u, 3.0, 7.5)));
      return s;
    },
    moab: (u) => compare(u, 'THE BIGGEST NON-NUCLEAR BOMB', 'MOAB, 2017', '11 T', 11, 'MAGNITUDE 4', '15 T', 15) + op(K(u, 2.4, 3.0), tx(1575, 852, 24, 'w', 'TONS OF TNT · NOT NUCLEAR', 'middle')),
    // the phone alert
    alert: (u, t) => phone(u, t, 1340, 150, eqClock(eqS(t)).replace(/ (AM|PM)/, ''), [[eqW('alert') - 0.1, 'EMERGENCY ALERT', 'EARTHQUAKE DETECTED!', '#a3221c'], [eqW('alert') + 0.5, 'DROP, COVER, HOLD ON', 'PROTECT YOURSELF', '#6a1a16']], 'SATURDAY'),
    // 500 tons of TNT: five hundred blocks, right under your feet
    tnt: (u) => {
      let s = plate(1150, 200, 720, 640);
      s += tx(1190, 270, 44, 'b', '<tspan fill="' + AMB + '">500</tspan> TONS OF TNT');
      s += squares(u, 1200, 310, 25, 500, 20, 5, '#d0452e', 0.3, 3.2);
      s += op(K(u, 3.2, 3.8), tx(1510, 810, 34, 'b', 'RIGHT UNDER YOUR FEET ↓', 'middle'));
      return s;
    },
    hiro: (u) => compare(u, 'THE HIROSHIMA BOMB', 'HIROSHIMA, 1945', '15 KT', 15, 'MAGNITUDE 6', '15 KT', 15.1),
    // the helicopter takes two minutes: two more ticks on its clock
    twoMin: (u, t) => {
      let s = plate(260, 760, 1400, 260);
      const x0 = 330, x1 = 1590, t0 = eqW('start', 0), k = MathX.clamp((t - t0) / 7, 0, 1);
      s += tx(x0, 830, 36, 'b', 'START-UP: ABOUT 2 MINUTES');
      s += `<rect x="${x0}" y="880" width="${x1 - x0}" height="22" rx="11" fill="rgba(255,255,255,0.16)"/>` + bar(x0, 880, x1 - x0, 22, AMB, 0.06 + 0.1 * k, 11);
      const ticks = [[0.0, 'NOW · MAGNITUDE 6'], [0.5, '7'], [1.0, '8 · FULL POWER']];
      ticks.forEach(([q, l], i) => { const kk = K(u, 0.5 + i * 0.7, 0.9 + i * 0.7), x = x0 + (x1 - x0) * q; s += op(kk, `<rect x="${x - 4}" y="866" width="8" height="50" rx="4" fill="${i ? RED : '#fff'}"/>${tx(x, 966, 32, 'b', l, i === 2 ? 'end' : i ? 'middle' : 'start')}`); });
      return s;
    },
    // the waterfront: fill over the old bay floor (sand, rubble, Gold Rush ships); shaking turns it to mud
    mud: (u) => {
      let s = plate(160, 640, 1600, 390);
      const y0 = 720, k = K(u, 0.3, 1.2);
      s += tx(200, 700, 36, 'b', 'UNDER THE WATERFRONT');
      s += `<rect x="200" y="${y0}" width="1520" height="16" fill="#8a8580"/>` + tx(1700, y0 - 10, 24, 's', 'THE ROAD', 'end');
      s += op(k, `<rect x="200" y="${y0 + 16}" width="1520" height="80" fill="#c9a86a"/>${tx(230, y0 + 66, 30, 'b', 'SAND', 'start', 'style="fill:#2a1e0e"')}`);
      s += op(K(u, 0.9, 1.6), `<rect x="200" y="${y0 + 96}" width="1520" height="70" fill="#7a6a58"/>${tx(230, y0 + 142, 30, 'b', 'RUBBLE')}`);
      const sh = K(u, 1.6, 2.4);
      s += op(sh, `<rect x="200" y="${y0 + 166}" width="1520" height="100" fill="#4a4036"/>${tx(230, y0 + 226, 30, 'b', 'OLD SHIPS FROM THE GOLD RUSH')}` + [760, 1180, 1500].map((x, i) => `<path d="M${x} ${y0 + 200 + i * 6} l 160 0 l -20 40 l -120 0 z" fill="#6b5236" stroke="#2a1e0e" stroke-width="3"/><rect x="${x + 70}" y="${y0 + 176 + i * 6}" width="8" height="26" fill="#2a1e0e"/>`).join(''));
      return s;
    },
    // 1906: a card
    y1906: (u) => {
      let s = plate(1260, 220, 600, 560);
      s += tx(1300, 300, 34, 's', '18 APRIL 1906');
      s += tx(1300, 400, 96, 'b', '7.9');
      s += op(K(u, 0.6, 1.2), tx(1300, 470, 34, 'w', 'THE FIRES BURNED') + tx(1300, 512, 34, 'w', 'FOR THREE DAYS'));
      s += op(K(u, 1.8, 2.4), `<line x1="1300" y1="560" x2="1820" y2="560" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>${tx(1300, 620, 34, 's', 'NOW')}${tx(1300, 720, 96, 'b', '8', 'start', `style="fill:${RED}"`)}`);
      return s;
    },
    bravo: (u) => compare(u, 'THE BIGGEST US BOMB', 'CASTLE BRAVO, 1954', '15 MT', 15, 'MAGNITUDE 8', '15 MT', 15.85),
    // your phone: the other cities
    phone: (u, t) => {
      const q = (id, w) => { const M = eqQMag(id, eqS(eqWord('phone', w).start)); return `EARTHQUAKE · MAGNITUDE ${M}`; };
      return phone(u, t, 1340, 130, eqClock(eqS(t)).replace(/ (AM|PM)/, ''), [
        [eqWord('phone', 'los').start - 0.15, 'LOS ANGELES', q('la', 'los'), '#5a1a16'], [eqWord('phone', 'tokyo').start - 0.15, 'TOKYO', q('tokyo', 'tokyo'), '#5a1a16'],
        [eqWord('phone', 'mexico').start - 0.15, 'MEXICO CITY', q('mexico', 'mexico'), '#5a1a16'], [eqWord('phone', 'istanbul').start - 0.15, 'ISTANBUL', q('istanbul', 'istanbul'), '#5a1a16']], 'BREAKING NEWS');
    },
    // ten Tsar Bombas
    tsar: (u) => {
      let s = plate(1180, 230, 690, 560);
      s += tx(1220, 300, 40, 'b', 'MAGNITUDE 9 =');
      for (let i = 0; i < 10; i++) { const k = K(u, 0.4 + i * 0.16, 0.6 + i * 0.16), c = i % 5, r = Math.floor(i / 5), x = 1260 + c * 116, y = 360 + r * 170;
        s += op(k, `<circle cx="${x + 45}" cy="${y + 44}" r="40" fill="#ffb347"/><rect x="${x + 33}" y="${y + 80}" width="24" height="58" rx="6" fill="#e0e0d8"/><ellipse cx="${x + 45}" cy="${y + 140}" rx="46" ry="12" fill="#ffb347"/>`); }
      s += op(K(u, 2.3, 2.9), tx(1525, 760, 40, 'b', '10 × TSAR BOMBA', 'middle', `style="fill:${AMB}"`));
      return s;
    },
    // Mexico City: an old lake bed over rock; the soft clay shakes much harder
    lakebed: (u, t) => {
      let s = plate(160, 640, 1600, 390);
      const y0 = 760, sh = K(u, 1.5, 2.2), W = (x) => sh * 18 * Math.sin(x * 0.03 - t * 9) * Math.exp(-Math.abs(x - 960) / 600);
      s += tx(200, 710, 36, 'b', 'MEXICO CITY: AN OLD LAKE BED');
      let d = `M 200 ${y0}`; for (let x = 200; x <= 1720; x += 20) d += ` L ${x} ${f1(y0 + W(x))}`; d += ` L 1720 ${y0 + 150} Q 960 ${y0 + 40} 200 ${y0 + 150} Z`;
      s += `<path d="${d}" fill="#8a7a5a"/>` + tx(960, y0 + 70, 30, 'b', 'SOFT CLAY (THE OLD LAKE)', 'middle', 'style="fill:#20180c"');
      s += `<path d="M 200 ${y0 + 150} Q 960 ${y0 + 40} 1720 ${y0 + 150} L 1720 ${y0 + 250} L 200 ${y0 + 250} Z" fill="#4a4a50"/>` + tx(960, y0 + 210, 30, 'b', 'ROCK', 'middle');
      s += op(sh, tx(1700, 710, 32, 's', 'THE CLAY SHAKES LIKE JELLY', 'end'));
      return s;
    },
    // the record ladder: the strongest earthquakes ever recorded, and now
    record: (u) => {
      let s = plate(1120, 160, 750, 760);
      s += tx(1160, 230, 38, 'b', 'THE STRONGEST EVER RECORDED');
      const L = [['HAITI 2010', 7.0, PALE], ['SAN FRANCISCO 1906', 7.9, PALE], ['JAPAN 2011', 9.1, PALE], ['CHILE 1960', 9.5, AMB], ['NOW', 10, RED]];
      const x0 = 1160, sc = 560 / 10;
      L.forEach(([n, m, col], i) => { const k = K(u, 0.6 + i * 0.9, 1.3 + i * 0.9), y = 280 + i * 124; if (i === 4) { /* (the last row waits for Chile) */ }
        s += op(Math.min(1, k * 2), tx(x0, y + 30, 28, i === 4 ? 'b' : 's', n) + bar(x0, y + 46, m * sc, 44, col, k, 12) + tx(x0 + m * sc * k + 16, y + 80, 36, 'b', m.toFixed(1).replace('.0', i === 4 ? '' : '.0'))); });
      s += op(K(u, 5.0, 5.6), tx(1160, 890, 30, 'b', 'IN ENERGY: 5.6× CHILE', 'start', `style="fill:${RED}"`));
      return s;
    },
    // a month of all human energy use (a calendar filling)
    month: (u) => {
      let s = plate(1240, 220, 620, 560);
      s += tx(1280, 290, 34, 'b', 'ALL THE ENERGY HUMANS USE');
      const k = K(u, 0.4, 3.0) * 30;
      for (let i = 0; i < 30; i++) { const c = i % 7, r = Math.floor(i / 7), x = 1290 + c * 76, y = 330 + r * 76; s += `<rect x="${x}" y="${y}" width="64" height="64" rx="10" fill="${i < k ? AMB : 'rgba(255,255,255,0.12)'}"/>`; }
      s += op(K(u, 3.0, 3.6), tx(1550, 740, 44, 'b', 'FOR A WHOLE MONTH', 'middle'));
      return s;
    },
    // three years
    years: (u) => {
      let s = plate(1180, 220, 690, 560);
      s += tx(1220, 290, 34, 'b', 'ALL THE ENERGY HUMANS USE');
      for (let y = 0; y < 3; y++) { const k = K(u, 0.5 + y * 0.9, 1.3 + y * 0.9) * 12; for (let m = 0; m < 12; m++) { const x = 1230 + (m % 6) * 100, yy = 340 + y * 130 + Math.floor(m / 6) * 52; s += `<rect x="${x}" y="${yy}" width="88" height="44" rx="8" fill="${m < k ? AMB : 'rgba(255,255,255,0.1)'}"/>`; }
        s += op(K(u, 0.5 + y * 0.9, 0.9 + y * 0.9), tx(1840, 400 + y * 130, 30, 's', `YEAR ${y + 1}`, 'end')); }
      s += op(K(u, 3.4, 4.0), tx(1525, 750, 40, 'b', 'IN ONE EARTHQUAKE', 'middle', `style="fill:${RED}"`));
      return s;
    },
    // four days of all the sunlight on the planet
    sun: (u) => {
      let s = plate(1240, 200, 620, 600);
      s += `<circle cx="1550" cy="380" r="110" fill="#ffd34a"/>` + [...Array(12)].map((_, i) => { const a = i / 12 * 6.283; return `<line x1="${1550 + Math.cos(a) * 130}" y1="${380 + Math.sin(a) * 130}" x2="${1550 + Math.cos(a) * 165}" y2="${380 + Math.sin(a) * 165}" stroke="#ffd34a" stroke-width="10" stroke-linecap="round"/>`; }).join('');
      s += tx(1550, 610, 34, 'b', 'ALL THE SUNLIGHT ON EARTH', 'middle');
      for (let d = 0; d < 4; d++) { const k = K(u, 0.8 + d * 0.6, 1.3 + d * 0.6); s += op(k, `<rect x="${1300 + d * 128}" y="650" width="112" height="70" rx="12" fill="${AMB}"/>${tx(1356 + d * 128, 698, 28, 'b', `DAY ${d + 1}`, 'middle', 'style="fill:#1a1206"')}`); }
      s += op(K(u, 3.4, 4.0), tx(1550, 776, 30, 's', 'IN ONE EARTHQUAKE', 'middle'));
      return s;
    },
    // the next minute passes the dinosaur asteroid
    dino: (u) => {
      let s = plate(1180, 200, 690, 640);
      const H = 390, y0 = 748, E12 = eqE(12), E13 = eqE(13), A = 4e23, m = E13;
      s += tx(1220, 270, 36, 'b', 'ENERGY');
      const col = (x, v, c, l1, l2, l3, a, b) => { const k = K(u, a, b), h = Math.max(4, H * v / m * k); return bar(x, y0 - h, 170, h, c, 1, 12) + op(k, tx(x + 85, y0 + 30, 21, 's', l1, 'middle') + tx(x + 85, y0 + 56, 19, 'w', l2, 'middle') + (l3 ? tx(x + 85, y0 + 79, 19, 'w', l3, 'middle') : '')); };
      s += col(1220, E12, RED, 'MAGNITUDE 12', 'NOW', '', 0.2, 0.8) + col(1420, A, PALE, 'THE ASTEROID', '66 MILLION', 'YEARS AGO', 0.8, 1.6) + col(1620, E13, RED, 'MAGNITUDE 13', 'IN ONE', 'MINUTE', 2.0, 3.0);
      return s;
    },
    // seven more minutes: enough to blow Earth apart (a ladder, ×32 every step, on a log scale)
    seven: (u) => {
      let s = plate(1120, 170, 750, 720);
      s += tx(1160, 240, 36, 'b', 'EVERY BAR: 32× THE ONE BEFORE');
      const y0 = 840, sc = 52, lg = (M) => 1.5 * M + 4.8, base = lg(12);
      const bind = Math.log10(2.2e32), yb = y0 - (bind - base + 1) * sc * 0.56 * 1.6;
      for (let M = 12; M <= 19; M++) { const k = K(u, 0.3 + (M - 12) * 0.35, 0.6 + (M - 12) * 0.35), h = (lg(M) - base + 1) * sc * 0.56 * 1.6;
        s += op(k, bar(1170 + (M - 12) * 84, y0 - h, 64, h, M === 19 ? RED : M === 12 ? YOU : PALE, 1, 10) + tx(1202 + (M - 12) * 84, y0 + 36, 28, 'b', String(M), 'middle')); }
      s += op(K(u, 3.0, 3.6), `<line x1="1150" y1="${f1(yb)}" x2="1850" y2="${f1(yb)}" stroke="${AMB}" stroke-width="5" stroke-dasharray="18 10"/>${tx(1160, yb - 16, 28, 's', 'ENOUGH TO BLOW THE PLANET APART')}`);
      return s;
    },
    // the end: the question, then the honest note
    question: (u) => {
      const k = K(u, 0.25, 0.9), a = K(u, 2.4, 2.9);
      return op(k, `<rect x="0" y="0" width="1920" height="1080" fill="rgba(0,0,0,${f2(0.35 * k)})"/>${tx(960, 580, 118, 'b', 'WHO WOULD YOU CALL?', 'middle')}`)
        + op(a, tx(960, 960, 30, 'w', 'REAL EARTHQUAKES PEAK AND STOP · THE ONE MADE-UP RULE IS THAT THIS ONE DOESN’T', 'middle') + tx(960, 1004, 26, 's', 'EVERY COMPARISON IN THIS FILM USES REAL DATA', 'middle'));
    },
  };
  return D;
})();

class EqHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.dia = mk('eq-dia');
    this.count = mk('eq-count', '<div class="l">MAGNITUDE</div><div class="v"></div>'); this.countV = this.count.querySelector('.v');
    this.stat = mk('eq-stat');
    this.bar = mk('eq-bar', '<div class="t"></div><div class="tr"><div class="f"></div></div>'); this.barT = this.bar.querySelector('.t'); this.barF = this.bar.querySelector('.f');
    this.tag = mk('eq-tag');
    this.labels = []; this.root = root; this._last = {}; this._diaKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    void app;
    const W = StoryHUD.win, q = shot.mode === 'question', s = eqStoryOf(t, shot), open = shot.s !== undefined;
    const M = Math.min(12, eqMagOf(s)), k = eqMinOf(s), tk = open ? -1 : eqTick(k);
    // ---- the counter: MAGNITUDE N (the cold open says twelve; then from the first tick, the one you're in)
    const ca = q ? 1 - MathX.smooth(t, shot.t0 + 0.2, shot.t0 + 0.7) : open ? MathX.smooth(t, 0.15, 0.4) : MathX.smooth(t, EQ.tick0 + 0.1, EQ.tick0 + 0.3);
    this._set('ca', this.count, 'opacity', ca.toFixed(3));
    this._txt('cv', this.countV, String(M));
    const pop = !open ? Math.exp(-Math.max(0, t - tk) / 0.25) * MathX.smooth(t, tk, tk + 0.03) : 0;
    this._cls('cc', this.count, pop > 0.2 || M >= 12 ? 'eq-count tick' : 'eq-count');
    this._set('cs', this.count, 'transform', `scale(${(1 + 0.16 * pop).toFixed(3)})`);
    // ---- the status word
    const [sw, tone] = EQ_STATUS[M] || ['', ''];
    this._txt('sx', this.stat, sw);
    this._cls('sc', this.stat, 'eq-stat' + (tone ? ' ' + tone : ''));
    const spop = !open ? Math.exp(-Math.max(0, t - tk - 0.1) / 0.25) * MathX.smooth(t, tk + 0.1, tk + 0.13) : 0;
    this._set('sa', this.stat, 'opacity', ca.toFixed(3));
    this._set('ss', this.stat, 'transform', `scale(${(1 + 0.1 * spop).toFixed(3)})`);
    // ---- the minute bar: MINUTE N · your clock; it fills towards the next magnitude
    this._txt('bt', this.barT, `MINUTE ${k} · ${eqClock(s)}`);
    this._set('bf', this.barF, 'width', (100 * MathX.clamp((s - 60 * (k - 1)) / 60, 0, 1)).toFixed(2) + '%');
    this._set('ba', this.bar, 'opacity', (ca * 0.95).toFixed(3));
    // ---- the honest tag
    const tg = EQ_TAGS.filter((x) => t >= x[0] && t < x[1]).pop();
    if (tg) this._txt('tgt', this.tag, tg[2]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagram for this shot (a diagram that runs on across a cut keeps its clock)
    const f = shot.dia ? EQ_DIA[shot.dia] : null, d0 = shot.diaT0 ?? shot.t0, u = t - d0;
    let da = 0;
    if (f) { const nx = EQ_SHOTS[EQ_SHOTS.indexOf(shot) + 1], cont = nx && nx.dia === shot.dia; da = W(t, d0, cont ? shot.t1 + 10 : shot.t1 + (q ? 3 : 0), 0.35, cont ? 0.01 : 0.3); }
    this._set('da', this.dia, 'opacity', da.toFixed(3));
    if (f) { const key = shot.dia + '|' + Math.round(t * 30); if (key !== this._diaKey) { this._diaKey = key; this.dia.innerHTML = `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">${f(u, t, shot)}</svg>`; } }
    // ---- labels pinned in the scene (measure first, then place)
    const Ls = set && set.labels ? set.labels(t, shot) || [] : [];
    while (this.labels.length < Ls.length) { const d = document.createElement('div'); d.className = 'eq-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = EqHud._p || (EqHud._p = new THREE.Vector3());
    // (the boxes already placed this frame, in % of the frame: the counter first; a later label that would overlap
    // one moves down)
    const placed = [[0, 31, 0, 37]];
    if (f) placed.push([58, 100, 15, 85]);
    this.labels.forEach((d, i) => {
      const l = Ls[i];
      if (!l || !cam || !(l.a > 0.01)) { d.style.opacity = '0'; return; }
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (l.p.isVector3) _p.copy(l.p); else _p.set(l.p[0], l.p[1], l.p[2]);
      _p.project(cam);
      const vis = _p.z < 1 && _p.z > -1 && Math.abs(_p.x) < 1.05 && Math.abs(_p.y) < 1.05;
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 2, 98), ly = (-_p.y * 0.5 + 0.5) * 100;
      const base = 'eq-lab' + (l.you ? ' you' : '') + (l.quake ? ' quake' : '');
      if (d._tx !== tx) { d._tx = tx; d.className = base; d.innerHTML = '<span class="d"></span>' + tx; d._w = d.offsetWidth; d._hh = d.offsetHeight; }
      let right = l.side ? l.side === 'r' : lx > 60;
      const wPct = this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      let ty = MathX.clamp(ly, 8, 88);
      if (vis) {
        const hPct = this.root.clientHeight ? 100 * (d._hh || 0) / this.root.clientHeight : 0, x0 = right ? lx - wPct : lx, x1 = right ? lx : lx + wPct;
        for (let k2 = 0; k2 < 6; k2++) { const hit = placed.find((r) => x0 < r[1] && x1 > r[0] && ty - hPct / 2 < r[3] && ty + hPct / 2 > r[2]); if (!hit) break; ty = hit[3] + hPct / 2 + 0.8; }
        placed.push([x0, x1, ty - hPct / 2, ty + hPct / 2]);
      }
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      d.style.opacity = String(vis && ty < 92 ? MathX.clamp(l.a, 0, 1) : 0);
      const hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx, cl = base + (right ? ' r' : '');
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
      if (d.className !== cl) d.className = cl;
    });
  }
}
