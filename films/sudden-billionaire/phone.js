/* =====================================================================
   PHONE — your phone (a body and a 540×1170 screen canvas, redrawn only when what it shows changes). No real app:
     bank    your balance to the cent, the next thing due, what came in or went out
     sent    a transfer, sent (to your mum, to Sam)
     lock    the lock screen on day three: the messages piling up
     inbox   the messages: cousins you've never met, strangers' stories, offers
     stocks  your portfolio (the car's dashboard and downtown): the value and its line, $ a second
   ===================================================================== */

const SB_FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
// the messages on day three (made up; no real person)
const SB_INBOX = [
  ['Darren (cousin?)', 'hey!! it\'s Darren, your dad\'s cousin\'s boy. long time!!'], ['Unknown', 'Congratulations!!! Can we talk? It\'s important'],
  ['Maria', 'my son needs surgery and the insurance won\'t pay. please, anything'], ['Unknown', 'Exclusive opportunity: 40% returns, guaranteed'],
  ['Uncle Ray', 'Proud of you kid. Remember who taught you to ride a bike'], ['J. Okafor', 'I run a shelter for women. 30 beds. We close in May.'],
  ['Unknown', 'I know where you live. Call me.'], ['Becca (school)', 'omg is this YOU?? we should catch up!!'],
  ['Pastor Lee', 'The church roof. God bless you.'], ['Unknown', 'Your account has been flagged. Verify here'],
  ['Tom', 'Remember me? Year 9 chemistry. I need $8,000 by Friday'], ['Aunt Gina', 'Your cousin is starting a business, he just needs a little'],
];
function sbRR2(g, x, y, w, h, r) { sbRR(g, x, y, w, h, r); }
function sbPhoneDraw(g, w, h, s) {
  const bg = s.app === 'lock' ? '#0c1220' : '#0e1014';
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textBaseline = 'alphabetic';
  const T = (txt, x, y, size, col = '#f4f2ee', weight = 500, align = 'left') => { g.font = `${weight} ${size}px ${SB_FONT}`; g.fillStyle = col; g.textAlign = align; g.fillText(txt, x, y); };
  // the status bar
  T(s.clock || '10:58', 44, 58, 26, '#f4f2ee', 600); g.fillStyle = '#f4f2ee'; g.fillRect(w - 92, 40, 46, 22); g.fillStyle = bg; g.fillRect(w - 88, 44, 30, 14);
  if (s.app === 'off') { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); return; }
  if (s.app === 'bank' || s.app === 'sent') {
    T('Checking', 44, 150, 30, '#9aa4b2', 500);
    const big = s.bal.length > 13 ? (s.bal.length > 15 ? 50 : 58) : 76;
    T(s.bal, 44, 240, big, '#ffffff', 600);
    T(s.sub || 'Available balance', 44, 290, 24, s.subCol || '#9aa4b2', 500);
    if (s.rate) { sbRR(g, 44, 320, 300, 50, 25); g.fillStyle = 'rgba(120,220,150,0.16)'; g.fill(); T(s.rate, 64, 354, 24, '#8fe0a8', 600); }
    let y = 440;
    T(s.rowsTitle || 'Recent', 44, y, 26, '#9aa4b2', 600); y += 24;
    for (const [lab, amt, col] of s.rows || []) {
      y += 86; g.fillStyle = 'rgba(255,255,255,0.06)'; sbRR(g, 30, y - 60, w - 60, 76, 18); g.fill();
      T(lab, 56, y - 12, 27, '#e8e6e2', 500); T(amt, w - 56, y - 12, 27, col || '#e8e6e2', 600, 'right');
    }
    if (s.app === 'sent') {
      // the confirmation sheet sliding up
      const k = s.k ?? 1, top = h - 560 * k;
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a1e26'; sbRR(g, 0, top, w, 640, 40); g.fill();
      g.fillStyle = '#3ccf78'; g.beginPath(); g.arc(w / 2, top + 130, 62, 0, 7); g.fill();
      g.strokeStyle = '#0e1014'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(w / 2 - 28, top + 132); g.lineTo(w / 2 - 6, top + 154); g.lineTo(w / 2 + 30, top + 108); g.stroke();
      T('Sent', w / 2, top + 250, 40, '#ffffff', 700, 'center');
      T(s.amt, w / 2, top + 330, 60, '#ffffff', 600, 'center');
      T('to ' + s.to, w / 2, top + 385, 30, '#c8ccd4', 500, 'center');
      if (s.note) T(s.note, w / 2, top + 440, 24, '#8a929e', 500, 'center');
    }
    return;
  }
  if (s.app === 'lock') {
    T(s.clock || '9:07', w / 2, 240, 128, '#f4f2ee', 300, 'center'); T(s.date || 'Tuesday', w / 2, 290, 28, '#c8ccd4', 500, 'center');
    // the pile: a count badge, then the newest banners on top (each slides in)
    const n = s.n || 0;
    if (n > 0) {
      const shown = Math.min(6, n);
      for (let i = 0; i < shown; i++) {
        const m = SB_INBOX[(n - 1 - i + SB_INBOX.length * 400) % SB_INBOX.length], y = 360 + i * 112;
        g.fillStyle = `rgba(255,255,255,${0.16 - i * 0.015})`; sbRR(g, 26, y, w - 52, 100, 22); g.fill();
        g.fillStyle = '#3c8cff'; sbRR(g, 44, y + 20, 56, 56, 14); g.fill(); g.fillStyle = '#fff'; sbRR(g, 56, y + 34, 32, 28, 5); g.fill(); g.strokeStyle = '#3c8cff'; g.lineWidth = 3; g.beginPath(); g.moveTo(57, y + 36); g.lineTo(72, y + 50); g.lineTo(87, y + 36); g.stroke();
        T(m[0], 116, y + 44, 25, '#ffffff', 700); T('now', w - 48, y + 44, 21, '#c8ccd4', 500, 'right');
        const body = m[1].length > 34 ? m[1].slice(0, 33) + '…' : m[1]; T(body, 116, y + 78, 22, '#dfe2e8', 400);
      }
      if (n > shown) { g.fillStyle = 'rgba(255,255,255,0.22)'; sbRR(g, w / 2 - 170, 360 + shown * 112 + 10, 340, 54, 27); g.fill(); T('+ ' + sbThousands(n - shown) + ' more messages', w / 2, 360 + shown * 112 + 46, 24, '#fff', 600, 'center'); }
    }
    return;
  }
  if (s.app === 'inbox') {
    T('Messages', 44, 150, 52, '#ffffff', 700); T(sbThousands(s.n || 0) + ' unread', 44, 196, 24, '#3c8cff', 600);
    const off = s.scroll || 0;
    g.save(); g.beginPath(); g.rect(0, 220, w, h - 220); g.clip();
    for (let i = 0; i < 14; i++) {
      const m = SB_INBOX[(i + Math.floor(off / 120)) % SB_INBOX.length], y = 240 + i * 120 - (off % 120);
      const hue = (i * 47 + Math.floor(off / 120) * 47) % 360;
      g.fillStyle = `hsl(${hue},35%,45%)`; g.beginPath(); g.arc(78, y + 58, 38, 0, 7); g.fill(); T(m[0][0], 78, y + 70, 34, '#fff', 700, 'center');
      T(m[0], 136, y + 44, 27, '#ffffff', 700); T('9:0' + (i % 10), w - 40, y + 44, 21, '#8a929e', 500, 'right');
      const body = m[1].length > 30 ? m[1].slice(0, 29) + '…' : m[1]; T(body, 136, y + 84, 23, '#b8bec8', 400);
      g.fillStyle = '#3c8cff'; g.beginPath(); g.arc(w - 46, y + 80, 9, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(136, y + 116, w - 136, 2);
    }
    g.restore();
    return;
  }
  if (s.app === 'stocks') {
    T('Portfolio', 44, 150, 30, '#9aa4b2', 500);
    T(s.bal, 44, 236, s.bal.length > 15 ? 50 : 60, '#ffffff', 600);
    T(s.rate || '', 44, 286, 26, '#8fe0a8', 600);
    // the line (always up)
    const x0 = 40, x1 = w - 40, y0 = 640, y1 = 360;
    g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x0, y1 + k * 70); g.lineTo(x1, y1 + k * 70); g.stroke(); }
    g.beginPath();
    for (let i = 0; i <= 120; i++) { const u = i / 120, v = 0.15 + 0.7 * Math.pow(u, 1.25) + 0.05 * Math.sin(u * 23 + 1) * (1 - u * 0.5) + 0.03 * Math.sin(u * 71); const x = x0 + (x1 - x0) * u, y = y0 - (y0 - y1) * v; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.strokeStyle = '#3ccf78'; g.lineWidth = 6; g.stroke();
    T('1D   1W   1M   1Y   10Y', w / 2, 710, 26, '#9aa4b2', 600, 'center');
    let y = 790; for (const [lab, amt] of s.rows || []) { T(lab, 44, y, 27, '#e8e6e2', 500); T(amt, w - 44, y, 27, '#8fe0a8', 600, 'right'); y += 64; }
  }
}
function sbPhone() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(sbRoundBox(0.074, 0.0085, 0.158, 0.009, 0.002), sbStd('#23262c', 0.35, 0.4)); body.rotation.x = Math.PI / 2; body.position.z = -0.0085; g.add(body);
  const scr = sbCanvasTex(540, 1170, sbPhoneDraw);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.0685, 0.148), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: true }));
  screen.position.z = 0.0007; g.add(screen);
  return { g, screen, scr, update(state) { scr.update(state); } };
}
// what the phone shows at film time t (shared by the flat and the car: one source for the numbers)
function sbPhoneState(t, mode) {
  const d = sbDay(t), clock = sbClockTime(d).replace(/ [AP]M$/, '');
  const bal = sbDollars(sbMoney(t)), rate = '+' + sbDollars(sbPerSecond(t)) + ' / second';
  if (mode === 'flat' || mode === 'title') return { app: 'bank', clock, bal, sub: 'Available balance', rowsTitle: 'Coming up', rows: [['Rent · Monday', '−$1,240.00', '#ff9b86'], ['Phone bill · Tue', '−$45.00', '#ff9b86'], ['Lottery ticket', '−$2.00', '#e8e6e2']] };
  if (mode === 'mum') {
    const k1 = MathX.smooth(t, SB.sendMum - 0.2, SB.sendMum + 0.35) * (1 - MathX.smooth(t, SB.sendMum + 2.6, SB.sendMum + 2.9));
    const k2 = MathX.smooth(t, SB.sendFriend - 0.2, SB.sendFriend + 0.35);
    const base = { app: 'bank', clock, bal, rate, rows: [] };
    if (t >= SB.sendMum) base.rows.push(['Mum · mortgage paid off', '−$310,000.00', '#e8e6e2']);
    if (t >= SB.sendFriend) base.rows.unshift(['Sam · all debts cleared', '−$64,000.00', '#e8e6e2']);
    base.rows.push(['Interest', '+$1.59 / s', '#8fe0a8'], ['Lottery prize', '+$1,000,000,000.00', '#8fe0a8']);
    if (k2 > 0) return Object.assign(base, { app: 'sent', amt: '$64,000.00', to: 'Sam', note: '"all your debts. no arguments."', k: k2 });
    if (k1 > 0) return Object.assign(base, { app: 'sent', amt: '$310,000.00', to: 'Mum', note: 'Mortgage · paid in full', k: k1 });
    return base;
  }
  if (mode === 'out') return { app: 'lock', clock, date: 'Tuesday', n: sbMsgCount(t) };
  if (mode === 'who') return { app: 'inbox', clock, n: sbMsgCount(t), scroll: Math.max(0, (t - SB.who - 0.6)) * 95 };
  if (mode === 'interest') return { app: 'bank', clock, bal, rate, rowsTitle: 'Today', rows: [['Interest since midnight', '+' + sbDollars(sbMoney(t) * SBM.rate * (d % 1)), '#8fe0a8'], ['Interest yesterday', '+$136,986.30', '#8fe0a8']] };
  return { app: 'stocks', clock, bal, rate, rows: [['Since you woke up', '+' + sbDollars(sbPerSecond(t) * 3600 * 15, false)], ['This year', '+' + sbWords(sbMoney(t) * 0.05)]] };
}
