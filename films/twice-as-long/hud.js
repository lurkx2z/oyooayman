/* =====================================================================
   HUD — this film's overlay (DOM in #hud, a pure function of time). The new recipe's minimal text, bold sans:
     top left      STEP and one big number (it pops yellow on every new step)
     under it      one status word: the step's length, then your speed, then Earth's clock
     in the scene  labels pinned to things (set.labels(t) → [{ p, text, sub, a, side, you }]): measure first, then place
     diagrams      a few full-frame SVG drawings where the narration explains (the rule, the sum, the way home, the clocks)
     bottom left   the honest tag (what is real, what is made up)
     the end       the question, big
   ===================================================================== */

const twN = (x) => Math.round(x).toLocaleString('en-US');

// the honest tags: [from, to, text]
const TW_TAGS = (() => {
  const b = (a, z, text) => [a, z, text];
  return [
    b(twW('late', 0) - 0.3, twE('late') + 0.3, 'YOUR STREET IS MADE UP · NEW YORK IS REAL'),
    b(twW('rule', 0) - 0.3, twE('loop') + 0.3, 'THE ONE MADE-UP RULE · THE REST FOLLOWS REAL PHYSICS · SHORTCUTS ARE TAGGED'),
    b(TW_T[10] + TW_D[10] + 2.3, twE('boom') + 0.3, 'REAL: FASTER THAN SOUND, YOU DRAG A SHOCK WAVE BEHIND YOU'),
    b(twW('squeeze', 0) - 0.3, twE('thirteen') + 0.3, 'REAL: AT MACH 9 THE SQUEEZED AIR REACHES THOUSANDS OF DEGREES'),
    b(twW('safe', 0) - 0.3, twE('safe') + 0.3, 'THE RULE KEEPS YOU IN ONE PIECE · NOTHING ELSE'),
    b(twW('fifteen', 0) - 0.3, twE('fifteen') + 0.3, 'ESCAPE VELOCITY FROM EARTH: 11.2 KM/S'),
    b(twW('meteor', 0) - 0.3, twE('boston') + 0.3, 'REAL: ALL ALONG YOUR PATH, THE BLAST WOULD SHATTER THE WINDOWS BELOW'),
    b(twW('push', 0) - 0.3, twE('push') + 0.3, 'IN REAL SPACE THERE IS NOTHING TO STEP ON'),
    b(twW('ninemin', 0) - 0.3, twE('ninemin') + 0.3, '9 MIN TO REACH ORBIT · 3 HOURS TO A DAY MORE TO REACH THE STATION'),
    b(twW('moon', 0) - 0.3, twE('moon') + 0.3, 'THE MOON, PLANETS, VOYAGER, STARS AND GALAXIES ARE PLACED ON YOUR PATH'),
    b(twW('real', 0) - 0.3, twE('real') + 0.3, 'REAL: SPECIAL RELATIVITY · ON THE ISS, ABOUT 0.005 S LESS EVERY 6 MONTHS'),
    b(twW('sun', 0) - 0.3, twE('sun') + 0.3, 'SUNLIGHT TAKES 8 MIN 20 S TO REACH EARTH'),
    b(twW('voyager', 0) - 0.3, twE('voyager') + 0.3, 'VOYAGER 1: LAUNCHED 1977 · ABOUT 26 BILLION KM AWAY, ONE LIGHT-DAY'),
    b(twW('star', 0) - 0.3, twE('star') + 1.6, 'SHOWN AS IF YOU STOPPED TO LOOK\nAT FULL SPEED, EVERYTHING BEHIND YOU WOULD FADE TO BLACK'),
    b(twW('turn', 0) - 0.3, twE('eleven_years') + 0.3, 'IF THE STEP AIMS STRAIGHT AT YOUR DOOR, WHEREVER EARTH HAS CARRIED IT\nYOUR ZIGZAG THROUGH NEW YORK STILL PUTS IT ABOUT 2 KM OFF'),
    b(twW('climb', 0) - 0.3, twE('climb') + 0.3, 'THE MILKY WAY: ABOUT 100,000 LIGHT YEARS ACROSS, 1,000 THICK'),
    b(twW('dust', 0) - 0.3, twE('dust') + 0.3, 'FROM HERE ON, THE EXPANSION OF THE UNIVERSE IS LEFT OUT'),
    b(twW('web', 0) - 0.3, twE('web') + 2.5, 'WE HAVE ONLY EVER MAPPED THE COSMIC WEB FROM INSIDE IT'),
    b(twW('sundies', 0) - 0.3, twE('sundies') + 3.0, 'REALLY: AT 6 BILLION YEARS THE SUN HAS ONLY BEGUN TO SWELL\nAT ITS BIGGEST, IN ABOUT 7.6 BILLION, IT PROBABLY SWALLOWS THE EARTH'),
    b(twW('ninety', 0) - 0.3, twE('ninety') + 0.3, 'THE OBSERVABLE UNIVERSE: ABOUT 93 BILLION LIGHT YEARS ACROSS\nWITH EXPANSION, NOT EVEN LIGHT LEAVING TODAY GETS PAST ~16 BILLION LIGHT YEARS'),
  ];
})();

// the diagrams: shot mode → (u: seconds into the shot, t, shot) → SVG body (1920 × 1080)
const TW_DIA = (() => {
  const K = (u, a, b) => MathX.smooth(u, a, b);
  const plate = (x, y, w, h, a = 0.72) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="rgba(8,10,14,${a})"/>`;
  const tx = (x, y, s, cls, text, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" class="${cls}" font-size="${s}" text-anchor="${anchor}" ${extra}>${text}</text>`;
  const bar = (x, y, w, h, col, k = 1, r = 10) => `<rect x="${x}" y="${y}" width="${Math.max(0, w * k).toFixed(1)}" height="${h}" rx="${Math.min(r, h / 2)}" fill="${col}"/>`;
  const YOU = '#ff6a1f', AMB = '#ffd36a', SKY = '#7cc8ff';
  const lens = ['75 CM', '1.5 M', '3 M', '6 M', '12 M'];
  // the first five steps, each twice the last (one row each, on the left, clear of you); `secs`: and each one takes a
  // second on your watch
  const steps = (u, secs) => {
    let s = plate(56, 300, 860, secs ? 560 : 480);
    s += tx(100, 372, 44, 'b', 'EVERY STEP: <tspan fill="' + AMB + '">TWICE THE LAST</tspan>');
    const x0 = 100, unit = 30;
    for (let i = 0; i < 5; i++) {
      const w = unit * Math.pow(2, i), k = K(u, 0.3 + i * 0.55, 0.75 + i * 0.55), y = 410 + i * 66;
      s += bar(x0, y, w, 46, YOU, k, 10);
      s += `<g opacity="${k.toFixed(2)}">${tx(x0 + w + 22, y + 36, 36, 'b', lens[i])}</g>`;
    }
    if (secs) s += `<g opacity="${K(u, 0.2, 0.8).toFixed(2)}">${tx(100, 806, 36, 's', 'AND EACH ONE: 1 SECOND ON YOUR WATCH')}</g>`;
    return s;
  };
  return {
    ruleA: (u) => steps(u, false),
    ruleB: (u) => steps(u + 4, true),
    // 1 + 2 + 4 + 8 = 15 against the next step's 16
    sum: (u) => {
      const x0 = 260, unit = 1300 / 16, k1 = K(u, 0.2, 1.4), k2 = K(u, 1.4, 2.4);
      let s = plate(180, 620, 1560, 390), x = x0;
      s += tx(240, 690, 40, 'b', 'ALL YOUR STEPS SO FAR');
      for (let i = 0; i < 4; i++) { const w = unit * Math.pow(2, i); s += bar(x, 720, (w - 6), 70, '#f4efe6', MathX.clamp(k1 * 4 - i, 0, 1), 10); x += w; }
      s += `<g opacity="${k1.toFixed(2)}">${tx(x0 + unit * 15 + 24, 770, 40, 's', '15')}</g>`;
      s += `<g opacity="${k2.toFixed(2)}">${tx(240, 862, 40, 'b', 'THE NEXT STEP')}${bar(x0, 890, unit * 16 - 6, 70, YOU, k2, 10)}${tx(x0 + unit * 16 + 24, 940, 40, 's', '16')}</g>`;
      s += `<g opacity="${K(u, 2.8, 3.4).toFixed(2)}">${tx(x0 + unit * 15, 845, 30, 's', '+1', 'middle')}</g>`;
      return s;
    },
    // out and back along the street: 1, 2, 4, 8 out… 16 back lands just behind the door
    loop: (u) => loopDia(u, 'YOUR FRONT DOOR', 4, ''),
    turn: (u) => loopDia(u, 'YOUR FRONT DOOR', 5, 'STEP 57'),
    last: (u) => loopDia(u, 'WHERE YOUR DOOR WAS', 5, 'STEP 91'),
    // your step against a landmark: [what, its height, your step]
    statue: (u) => compare(u, 'YOUR STEP', '96 M', 96, 'THE STATUE', '93 M', 93),
    esb: (u) => compare(u, 'YOUR STEP', '384 M', 384, 'TO ITS ROOF', '381 M', 381),
    // the Earth's curve: a straight line of steps leaves the ground (side view, exaggerated in height and length)
    curve: (u) => {
      const cx = 760, cy = 2650, R = 1800, k = K(u, 0.2, 2.2), top = cy - R;
      let s = plate(380, 400, 1160, 620);
      s += `<path d="M ${(cx - R * Math.sin(0.2)).toFixed(1)} ${(cy - R * Math.cos(0.2)).toFixed(1)} A ${R} ${R} 0 0 1 ${(cx + R * Math.sin(0.43)).toFixed(1)} ${(cy - R * Math.cos(0.43)).toFixed(1)}" stroke="#7fbf6a" stroke-width="12" fill="none"/>`;
      s += tx(cx, top + 150, 30, 's', 'THE GROUND', 'middle');
      const L = 720 * k;
      s += `<line x1="${cx}" y1="${top - 8}" x2="${(cx + L).toFixed(1)}" y2="${top - 8}" stroke="${YOU}" stroke-width="8" stroke-dasharray="26 14"/>`;
      s += `<circle cx="${(cx + L).toFixed(1)}" cy="${top - 8}" r="16" fill="${YOU}"/><circle cx="${cx}" cy="${top}" r="9" fill="#fff"/>`;
      s += tx(cx, top - 40, 26, 's', 'CENTRAL PARK', 'middle');
      s += tx(430, 480, 42, 'b', 'YOUR STEPS ARE <tspan fill="' + AMB + '">STRAIGHT</tspan>');
      s += `<g opacity="${K(u, 1.6, 2.4).toFixed(2)}">${tx(1490, 980, 38, 'b', 'THE EARTH <tspan fill="#7fbf6a">ISN\'T</tspan>', 'end')}</g>`;
      return s;
    },
    // the air piling up in front of you, and heating
    squeeze: (u) => {
      let s = plate(1180, 160, 640, 600);
      s += tx(1220, 228, 38, 'b', 'THE AIR AHEAD OF YOU');
      const cx = 1330, cy = 520, k = K(u, 0.3, 2.6), hot = K(u, 3.6, 5.6);
      for (let i = 0; i < 90; i++) {
        const r1 = twR(i, 3), r2 = twR(i, 7), y = 280 + r1 * 430, x0 = 1230 + r2 * 560;
        const dx = x0 - cx - 60, squash = dx > 0 ? MathX.lerp(dx, Math.pow(dx / 480, 2.2) * 480, k) : dx;
        const x = cx + 60 + squash, near = Math.exp(-Math.max(0, x - cx - 60) / 60);
        const c = hot > 0 ? `rgb(${Math.round(160 + 95 * near * hot)},${Math.round(200 - 120 * near * hot)},${Math.round(255 - 215 * near * hot)})` : SKY;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(6 + 3 * near * k).toFixed(1)}" fill="${c}"/>`;
      }
      s += `<path d="M${cx - 20} 600 l 30 -150 l 30 0 l -10 150 z" fill="${YOU}"/><circle cx="${cx + 18}" cy="430" r="26" fill="${YOU}"/>`;
      s += `<path d="M${cx + 90} 520 l 60 0 m -18 -16 l 18 16 l -18 16" stroke="#fff" stroke-width="6" fill="none"/>`;
      s += `<g opacity="${hot.toFixed(2)}">${tx(1220, 730, 34, 's', 'SQUEEZED AIR GETS HOT')}</g>`;
      return s;
    },
    ninemin: (u) => race(u, 'ASTRONAUTS', '9 MINUTES', 1, 'YOU', '22 STEPS', 22 / 540, 2.2),
    light8: (u) => race(u, 'LIGHT', '8 MIN 20 S', 1, 'YOU', '1 SECOND', 1 / 500, 2.8, 'BUT ON EARTH’S CLOCK, STEP 39 TOOK 11 MINUTES · LIGHT STILL WINS'),
    caught: (u) => race(u, 'VOYAGER 1', '49 YEARS', 1, 'YOU', '45 STEPS', 0.04, 2.2, 'ON EARTH’S CLOCK, YOUR 45 STEPS TOOK ABOUT A DAY'),
    // one step against the Earth: down to its centre (radius) / right across it (across)
    radius: (u) => earthDia(u, 'r'),
    across: (u) => earthDia(u, 'd'),
    // the trip to the Moon against step thirty
    barrier: (u) => {
      let s = plate(160, 660, 1600, 330);
      const x0 = 240, sc = 1360 / 402653, k1 = K(u, 0.4, 1.6), k2 = K(u, 1.6, 2.8);
      s += tx(x0, 730, 38, 'b', 'EARTH TO THE MOON');
      s += `<circle cx="${x0 + 16}" cy="776" r="16" fill="#5a9ad8"/>${bar(x0 + 40, 768, 384400 * sc - 40, 16, '#dcdcdc', k1, 8)}<circle cx="${x0 + 384400 * sc}" cy="776" r="11" fill="#cfcac0" opacity="${k1.toFixed(2)}"/>`;
      s += `<g opacity="${k1.toFixed(2)}">${tx(x0 + 384400 * sc - 10, 730, 34, 's', '384,400 KM', 'end')}</g>`;
      s += `<g opacity="${k2.toFixed(2)}">${tx(x0, 850, 38, 'b', 'STEP 30')}${bar(x0, 872, 402653 * sc, 46, YOU, k2, 12)}${tx(x0 + 402653 * sc, 960, 34, 's', '402,653 KM · IN 1 SECOND?', 'end')}</g>`;
      return s;
    },
    // your clock and Earth's
    clocks: (u) => clocks(u, 1, false),
    earth: (u, t) => clocks(u, twStepEarthS(30), true, t),
    marstime: (u) => twoNumbers(u, 'STEP 37 ALONE', 'YOUR CLOCK', '1 SECOND', 'EARTH’S CLOCK', '2.9 MINUTES'),
    day: (u) => twoNumbers(u, 'STEP 46 ALONE', 'YOUR CLOCK', '1 SECOND', 'EARTH’S CLOCK', '1 DAY'),
    // your phone: the boss has stopped calling
    boss: (u) => {
      const k = K(u, 0.1, 0.6);
      let s = `<g transform="translate(${1290 + 40 * (1 - k)} 150)" opacity="${k.toFixed(2)}">`;
      s += `<rect x="0" y="0" width="470" height="760" rx="56" fill="#0d0f13" stroke="#3a3f48" stroke-width="6"/><rect x="22" y="22" width="426" height="716" rx="40" fill="#1b2230"/>`;
      s += tx(235, 120, 84, 'b', '8:55', 'middle') + tx(235, 160, 24, 's', 'MONDAY · YOUR PHONE’S CLOCK', 'middle');
      const L = [['BOSS', '4 MISSED CALLS'], ['BOSS', 'WHERE ARE YOU??'], ['BOSS', 'YOU’RE LATE.'], ['NO SIGNAL', 'NO CALL CAN CATCH YOU NOW']];
      L.forEach(([a, b], i) => { const kk = K(u, 0.5 + i * 0.35, 0.8 + i * 0.35); s += `<g opacity="${kk.toFixed(2)}"><rect x="44" y="${210 + i * 118}" width="382" height="100" rx="22" fill="rgba(255,255,255,0.12)"/>${tx(70, 252 + i * 118, 30, 'b', a)}${tx(70, 290 + i * 118, 24, 's', b)}</g>`; });
      s += `<g opacity="${K(u, 2.2, 2.7).toFixed(2)}">${tx(235, 720, 26, 's', 'ON EARTH IT’S EVENING', 'middle')}</g></g>`;
      return s;
    },
    // the end: the question, and the two ways
    question: (u) => {
      const k = K(u, 0.2, 0.9), a = K(u, 1.2, 1.9);
      return `<g opacity="${k.toFixed(2)}">${tx(960, 520, 112, 'b', 'WHICH WAY', 'middle')}${tx(960, 650, 112, 'b', 'WOULD YOU STEP?', 'middle')}</g>
        <g opacity="${a.toFixed(2)}">${tx(380, 880, 68, 'b', '← BACK HOME', 'middle', `style="fill:${AMB}"`)}${tx(1540, 880, 68, 'b', 'STEP 91 →', 'middle', `style="fill:${YOU}"`)}</g>`;
    },
  };
  // (a small panel at the right edge, clear of the landmark)
  function compare(u, la, va, a, lb, vb, b) {
    let s = plate(1440, 330, 420, 470);
    const H = 300, m = Math.max(a, b), k1 = K(u, 0.2, 1.1), k2 = K(u, 0.8, 1.7), y0 = 730;
    s += bar(1490, y0 - H * a / m * k1, 140, H * a / m * k1, YOU, 1, 14) + bar(1670, y0 - H * b / m * k2, 140, H * b / m * k2, '#e8e3d8', 1, 14);
    s += tx(1560, y0 - H * a / m - 22, 42, 'b', va, 'middle', `opacity="${k1.toFixed(2)}"`) + tx(1740, y0 - H * b / m - 22, 42, 'b', vb, 'middle', `opacity="${k2.toFixed(2)}"`);
    s += tx(1560, 772, 26, 's', la, 'middle') + tx(1740, 772, 26, 's', lb, 'middle');
    return s;
  }
  // two bars racing; `note`: a last line under them (what Earth's clock says)
  function race(u, la, va, a, lb, vb, b, at, note) {
    let s = plate(160, note ? 560 : 690, 1600, note ? 380 : 300);
    const k1 = K(u, 0.3, 1.4), k2 = K(u, at, at + 0.8), y = note ? -130 : 0;
    s += tx(220, 760 + y, 40, 'b', la) + bar(560, 728 + y, 1000 * a, 44, '#e8e3d8', k1, 12) + `<g opacity="${k1.toFixed(2)}">${tx(1600, 764 + y, 40, 's', va)}</g>`;
    s += `<g opacity="${k2.toFixed(2)}">${tx(220, 900 + y, 40, 'b', lb)}${bar(560, 868 + y, Math.max(14, 1000 * b), 44, YOU, 1, 12)}${tx(560 + Math.max(14, 1000 * b) + 30, 904 + y, 40, 's', vb)}</g>`;
    if (note) s += `<g opacity="${K(u, at + 1.2, at + 1.8).toFixed(2)}">${tx(220, 892, 34, 'b', note)}</g>`;
    return s;
  }
  function twoNumbers(u, title, la, va, lb, vb) {
    let s = plate(1180, 150, 620, 590);
    const k1 = K(u, 0.2, 0.8), k2 = K(u, 1.0, 1.6);
    s += tx(1240, 222, 40, 'b', title);
    s += `<g opacity="${k1.toFixed(2)}">${tx(1240, 310, 34, 's', la)}${tx(1240, 400, 84, 'b', va)}</g>`;
    s += `<g opacity="${k2.toFixed(2)}">${tx(1240, 540, 34, 's', lb)}${tx(1240, 640, 84, 'b', vb, 'start', `style="fill:${AMB}"`)}</g>`;
    return s;
  }
  function clocks(u, earthRate, show, t) {
    let s = plate(1120, show ? 110 : 180, 700, show ? 670 : 600);
    if (show) s += tx(1470, 180, 40, 'b', 'STEP 30 ALONE', 'middle');
    const dial = (cx, cy, label, ang, col) => `<circle cx="${cx}" cy="${cy}" r="120" fill="rgba(255,255,255,0.06)" stroke="#fff" stroke-width="7"/>
      ${[...Array(12)].map((_, i) => { const a = i / 12 * 6.2832; return `<line x1="${cx + Math.sin(a) * 100}" y1="${cy - Math.cos(a) * 100}" x2="${cx + Math.sin(a) * 112}" y2="${cy - Math.cos(a) * 112}" stroke="#fff" stroke-width="5"/>`; }).join('')}
      <line x1="${cx}" y1="${cy}" x2="${(cx + Math.sin(ang) * 96).toFixed(1)}" y2="${(cy - Math.cos(ang) * 96).toFixed(1)}" stroke="${col}" stroke-width="9" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="10" fill="${col}"/>
      ${tx(cx, cy + 180, 32, 'b', label, 'middle')}`;
    // one turn = one second of your clock (both sweep through step thirty; Earth's goes 1.67 times round)
    const sw = show ? MathX.clamp((t - TW_T[30]) / TW_D[30], 0, 1) : (u % 2.2) / 2.2;
    s += dial(1300, 420, 'YOUR CLOCK', sw * 6.2832, YOU) + dial(1640, 420, 'EARTH’S CLOCK', sw * 6.2832 * earthRate, SKY);
    if (show) s += `<g opacity="${K(u, 0.6, 1.2).toFixed(2)}">${tx(1300, 680, 40, 's', '1 SECOND', 'middle')}${tx(1640, 680, 40, 's', twStepEarthS(30).toFixed(1) + ' SECONDS', 'middle', `style="fill:${AMB}"`)}</g>`;
    else s += `<g opacity="${K(u, 3.0, 3.6).toFixed(2)}">${tx(1470, 690, 30, 's', 'NEAR LIGHT SPEED, YOUR CLOCK RUNS SLOW', 'middle')}</g>`;
    return s;
  }
  function earthDia(u, which) {
    let s = plate(1200, 180, 620, 620);
    const cx = 1510, cy = 520, R = 200, k = K(u, 0.4, 1.6);
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#2f6aa8"/><path d="M${cx - 120} ${cy - 120} q 60 -40 110 10 q 40 50 -30 80 q -60 20 -80 -90 z" fill="#5d8a4a"/><circle cx="${cx}" cy="${cy}" r="8" fill="#fff"/>`;
    if (which === 'r') s += `<line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy - R + 2 * R * k * 0.5}" stroke="${YOU}" stroke-width="12" stroke-linecap="round"/>` + tx(1250, 250, 34, 'b', 'ONE STEP: 6,291 KM') + `<g opacity="${K(u, 1.6, 2.2).toFixed(2)}">${tx(1250, 770, 30, 's', 'TO THE CENTRE: 6,371 KM')}</g>`;
    else s += `<line x1="${cx - R}" y1="${cy}" x2="${cx - R + 2 * R * k}" y2="${cy}" stroke="${YOU}" stroke-width="12" stroke-linecap="round"/>` + tx(1250, 250, 34, 'b', 'ONE STEP: 12,583 KM') + `<g opacity="${K(u, 1.6, 2.2).toFixed(2)}">${tx(1250, 770, 30, 's', 'RIGHT ACROSS: 12,742 KM')}</g>`;
    return s;
  }
  function loopDia(u, home, nOut, backLabel) {
    let s = plate(160, 540, 1600, 410);
    const y = 820, xd = nOut === 4 ? 520 : 470, unit = nOut === 4 ? 1000 / 15 : 1100 / 31;
    s += `<line x1="200" y1="${y}" x2="1720" y2="${y}" stroke="rgba(255,255,255,0.35)" stroke-width="4"/>`;
    s += `<rect x="${xd - 18}" y="${y - 64}" width="36" height="64" rx="4" fill="#b8452f"/>${tx(xd, y + 50, 30, 'b', home, 'middle')}`;
    let x = xd;
    for (let i = 0; i < nOut; i++) {
      const w = unit * Math.pow(2, i), k = K(u, 0.3 + i * 0.45, 0.7 + i * 0.45);
      s += `<path d="M${x} ${y} Q ${x + w / 2} ${y - 40 - w * 0.35} ${x + w * k} ${y - 4 * (1 - k)}" stroke="${YOU}" stroke-width="7" fill="none" opacity="${Math.min(1, k * 3).toFixed(2)}"/>`;
      x += w;
    }
    // back: one step longer than all of them together lands one unit behind the door
    const kb = K(u, 0.5 + nOut * 0.45, 1.6 + nOut * 0.45), wb = unit * Math.pow(2, nOut), xe = x - wb * kb;
    s += `<path d="M${x} ${y} Q ${x - wb / 2} ${y - 70 - wb * 0.3} ${xe} ${y - 4 * (1 - kb)}" stroke="${AMB}" stroke-width="9" fill="none" opacity="${Math.min(1, kb * 3).toFixed(2)}"/>`;
    s += `<g opacity="${K(u, 1.6 + nOut * 0.45, 2.1 + nOut * 0.45).toFixed(2)}"><circle cx="${xd - unit}" cy="${y}" r="13" fill="${AMB}"/>${tx(xd - unit - 26, y - 30, 30, 's', 'JUST BEHIND IT', 'end')}</g>`;
    s += tx(220, 608, 40, 'b', backLabel ? `TURN ROUND: ${backLabel} GOES BACK` : 'STEP BACK, AND YOU LAND…');
    return s;
  }
})();

class TwHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.dia = mk('tw-dia');
    this.count = mk('tw-count', '<div class="l">STEP</div><div class="v"></div>'); this.countV = this.count.querySelector('.v');
    this.stat = mk('tw-stat');
    this.tag = mk('tw-tag');
    this.labels = []; this.root = root; this._last = {}; this._diaKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    void app;
    const W = StoryHUD.win, q = shot.mode === 'question';
    // ---- the counter (the cold open shows step ninety; from step one on, the step you're on)
    const open = shot.mode === 'open', st = twStepAt(t), n = open ? 90 : st.n, t0 = open ? -1 : (st.n ? TW_T[st.n] : 0);
    const ca = q ? 1 - MathX.smooth(t, shot.t0, shot.t0 + 0.5) : open ? MathX.smooth(t, 0.1, 0.4) : (n ? MathX.smooth(t, TW_T[1], TW_T[1] + 0.2) : 0);
    this._set('ca', this.count, 'opacity', ca.toFixed(3));
    this._txt('cv', this.countV, n ? String(n) : '');
    const pop = n && !open ? Math.exp(-Math.max(0, t - t0) / 0.18) * MathX.smooth(t, t0, t0 + 0.03) : 0;
    this._cls('cc', this.count, pop > 0.25 ? 'tw-count tick' : 'tw-count');
    this._set('cs', this.count, 'transform', `scale(${(1 + 0.12 * pop).toFixed(3)})`);
    // ---- the status word
    const [sx, tone, s0, cap] = open ? ['98 BILLION LIGHT YEARS', 'cold', -1, ''] : twStatusAt(t);
    // (over the red giant the count would say 12, 25, 49 billion years: long after the moment in the picture, so it steps aside)
    const giant = (shot.mode === 'redgiant' || shot.mode === 'swallow') ? MathX.smooth(t, TW_T[87] - 0.1, TW_T[87] + 0.3) : 0;
    const sa = (q ? 1 - MathX.smooth(t, shot.t0, shot.t0 + 0.5) : sx ? MathX.smooth(t, s0, s0 + 0.15) : 0) * (1 - giant);
    this._html('sx', this.stat, sx ? (cap ? `<small>${cap}</small>` : '') + sx : '');
    this._cls('sc', this.stat, 'tw-stat' + (tone ? ' ' + tone : ''));
    this._set('sa', this.stat, 'opacity', (sa * ca).toFixed(3));
    const spop = Math.exp(-Math.max(0, t - s0) / 0.2) * MathX.smooth(t, s0, s0 + 0.03);
    this._set('ss', this.stat, 'transform', `scale(${(1 + 0.08 * spop).toFixed(3)})`);
    // ---- the honest tag
    const tg = TW_TAGS.filter((x) => t >= x[0] && t < x[1]).pop();
    if (tg) this._txt('tgt', this.tag, tg[2]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagram for this shot
    const f = TW_DIA[shot.mode], u = t - shot.t0;
    const da = f ? W(t, shot.t0, shot.t1 + (q ? 2 : 0), 0.35, 0.3) : 0;
    this._set('da', this.dia, 'opacity', da.toFixed(3));
    if (f) { const key = shot.mode + '|' + Math.round(u * 30); if (key !== this._diaKey) { this._diaKey = key; this.dia.innerHTML = `<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">${f(u, t, shot)}</svg>`; } }
    // ---- labels pinned in the scene (measure first, then place)
    const Ls = set && set.labels ? set.labels(t, shot) || [] : [];
    while (this.labels.length < Ls.length) { const d = document.createElement('div'); d.className = 'tw-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = TwHud._p || (TwHud._p = new THREE.Vector3());
    const placed = [[0, 38, 0, 35]];   // (the boxes already placed this frame, in %, starting with the step counter: a later label that would overlap one moves down)
    this.labels.forEach((d, i) => {
      const l = Ls[i];
      if (!l || !cam || !(l.a > 0.01)) { d.style.opacity = '0'; return; }
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (l.p.isVector3) _p.copy(l.p); else _p.set(l.p[0], l.p[1], l.p[2]);
      _p.project(cam);
      const vis = _p.z < 1 && _p.z > -1 && Math.abs(_p.x) < 1.05 && Math.abs(_p.y) < 1.05;
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 2, 98), ly = (-_p.y * 0.5 + 0.5) * 100;
      const base = 'tw-lab' + (l.you ? ' you' : '');
      if (d._tx !== tx) { d._tx = tx; d.className = base; d.innerHTML = '<span class="d"></span>' + tx; d._w = d.offsetWidth; d._hh = d.offsetHeight; }
      let right = l.side ? l.side === 'r' : lx > 60;
      const wPct = this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      let ty = MathX.clamp(ly, 30, 88);
      if (vis) {
        const hPct = this.root.clientHeight ? 100 * (d._hh || 0) / this.root.clientHeight : 0, x0 = right ? lx - wPct : lx, x1 = right ? lx : lx + wPct;
        for (let k = 0; k < 6; k++) { const hit = placed.find((r) => x0 < r[1] && x1 > r[0] && ty - hPct / 2 < r[3] && ty + hPct / 2 > r[2]); if (!hit) break; ty = hit[3] + hPct / 2 + 0.8; }
        placed.push([x0, x1, ty - hPct / 2, ty + hPct / 2]);
      }
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      d.style.opacity = String(vis ? MathX.clamp(l.a, 0, 1) : 0);
      const hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx, cl = base + (right ? ' r' : '');
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
      if (d.className !== cl) d.className = cl;
    });
  }
}
