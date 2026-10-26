/* =====================================================================
   PHONE — your phone (a body and a 540×1170 screen canvas, redrawn only when what it shows changes). No real app:
     chat    the family group chat at 10 AM: nobody can understand anybody, so everybody types
     music   a song playing in your earbuds (4 PM: the last normal sound)
     lock    the lock screen
   (The body and canvas are the billionaire film's phone, with this film's screens.)
   ===================================================================== */

const LB_FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
// the group chat (made up; no real person): [who, text, mine]
const LB_CHAT = [
  ['Mum', 'Why does everyone sound like a whale', false], ['Dad', 'I said PASS THE MILK', false],
  ['You', 'I can\'t understand a word anyone says', true], ['Mum', 'Same. Your dad sounds like a fridge', false],
  ['Gran', 'Is this the end of the world', false], ['Dad', 'Texting only from now on. Agreed?', false],
  ['You', 'Agreed', true], ['Mum', '👍', false],
];
function lbRR2(g, x, y, w, h, r) { lbRR(g, x, y, w, h, r); }
function lbPhoneDraw(g, w, h, s) {
  const bg = s.app === 'lock' ? '#0c1220' : '#0e1014';
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textBaseline = 'alphabetic';
  const T = (txt, x, y, size, col = '#f4f2ee', weight = 500, align = 'left') => { g.font = `${weight} ${size}px ${LB_FONT}`; g.fillStyle = col; g.textAlign = align; g.fillText(txt, x, y); };
  // the status bar
  T(s.clock || '10:58', 44, 58, 26, '#f4f2ee', 600); g.fillStyle = '#f4f2ee'; g.fillRect(w - 92, 40, 46, 22); g.fillStyle = bg; g.fillRect(w - 88, 44, 30, 14);
  if (s.app === 'off') { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); return; }
  if (s.app === 'chat') {
    T('Family', w / 2, 140, 34, '#ffffff', 700, 'center'); T('4 people', w / 2, 178, 22, '#8a929e', 500, 'center');
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 200, w, 2);
    const n = Math.min(LB_CHAT.length, s.n || 0);
    let y = h - 150;
    for (let i = n - 1; i >= 0 && y > 240; i--) {
      const [who, txt, mine] = LB_CHAT[i]; g.font = `500 28px ${LB_FONT}`; const tw = Math.min(380, g.measureText(txt).width), lines = tw >= 380 ? 2 : 1, bh = 34 + lines * 36;
      y -= bh + (mine ? 18 : 48);
      const bx = mine ? w - 40 - tw - 40 : 40;
      g.fillStyle = mine ? '#2f7cf6' : '#2a2e36'; lbRR(g, bx, y, tw + 40, bh, 26); g.fill();
      if (!mine) T(who, bx + 6, y - 10, 21, '#9aa4b2', 600);
      if (lines === 1) T(txt, bx + 20, y + 46, 28, '#ffffff', 500);
      else { const ws = txt.split(' '); let l1 = ''; for (const w2 of ws) { if (g.measureText(l1 + w2).width > 360) break; l1 += w2 + ' '; } T(l1.trim(), bx + 20, y + 46, 28, '#ffffff', 500); T(txt.slice(l1.length), bx + 20, y + 82, 28, '#ffffff', 500); }
    }
    g.fillStyle = '#1a1d23'; g.fillRect(0, h - 120, w, 120); g.fillStyle = '#2a2e36'; lbRR(g, 30, h - 100, w - 60, 64, 32); g.fill();
    T(s.typing || 'Message', 60, h - 58, 26, s.typing ? '#ffffff' : '#6a707a', 500);
    return;
  }
  if (s.app === 'music') {
    g.fillStyle = '#2a1e3a'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 160, 0, 620); gr.addColorStop(0, '#e08a5a'); gr.addColorStop(1, '#7a3a6a');
    g.fillStyle = gr; lbRR(g, 70, 150, w - 140, w - 140, 30); g.fill();
    T('♪', w / 2, 150 + (w - 140) / 2 + 60, 180, 'rgba(255,255,255,0.85)', 400, 'center');
    T(s.title || 'Saturday', 70, 680, 38, '#ffffff', 700); T(s.artist || 'Recorded last year', 70, 724, 26, '#c8b8d8', 500);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(70, 790, w - 140, 6); g.fillStyle = '#fff'; g.fillRect(70, 790, (w - 140) * (s.k || 0.3), 6);
    g.beginPath(); g.arc(70 + (w - 140) * (s.k || 0.3), 793, 12, 0, 7); g.fill();
    T('🎧  Earbuds', w / 2, 900, 28, '#e8e0f0', 600, 'center');
    return;
  }
  T(s.clock || '10:58', w / 2, 240, 128, '#f4f2ee', 300, 'center'); T(s.date || 'Saturday', w / 2, 290, 28, '#c8ccd4', 500, 'center');
}
function lbPhone() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(lbRoundBox(0.074, 0.0085, 0.158, 0.009, 0.002), lbStd('#23262c', 0.35, 0.4)); body.rotation.x = Math.PI / 2; body.position.z = -0.0085; g.add(body);
  const scr = lbCanvasTex(540, 1170, lbPhoneDraw);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.0685, 0.148), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: true }));
  screen.position.z = 0.0007; g.add(screen);
  return { g, screen, scr, update(state) { scr.update(state); } };
}
// what the phone shows at film time t
function lbPhoneState(t, mode) {
  const h = lbH(t), clock = lbClockText(h);
  if (mode === 'chat') { const n = Math.floor(MathX.clamp((t - LB.text) * 1.6, 0, LB_CHAT.length)); return { app: 'chat', clock, n }; }
  if (mode === 'music') return { app: 'music', clock, title: 'Saturday Song', artist: 'Recorded last year', k: Math.round((0.3 + (t - LB.earbuds) * 0.01) * 100) / 100 };
  return { app: 'lock', clock };
}
