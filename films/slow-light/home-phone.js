/* =====================================================================
   HOME · PHONE — your phone: the video call with Gran in Sydney (her picture arrives late: she is drawn as she was
   one delay ago) and the map app (your dot drifts out to sea once the GPS signals arrive late). A 540×1170 canvas,
   redrawn only when what it shows changes. The faces are flat illustrations (no real person, no real app).
   ===================================================================== */

// a flat illustrated head: o = { skin, hair, style: 'bun' | 'short', glasses, mouth (0 shut … 1 wide), smile (0 … 1),
// blink (0 … 1), look (−1 … 1, eyes sideways), tilt (rad), cardigan / top colour }
function slDrawFace(g, cx, cy, s, o) {
  g.save(); g.translate(cx, cy); g.rotate(o.tilt || 0); g.scale(s, s);
  // shoulders and top
  g.fillStyle = o.top || '#7b5a6a';
  g.beginPath(); g.moveTo(-150, 260); g.bezierCurveTo(-140, 150, -70, 125, 0, 125); g.bezierCurveTo(70, 125, 140, 150, 150, 260); g.closePath(); g.fill();
  if (o.collar) { g.fillStyle = o.collar; g.beginPath(); g.moveTo(-34, 124); g.lineTo(0, 168); g.lineTo(34, 124); g.closePath(); g.fill(); }
  // neck
  g.fillStyle = o.skinDark || o.skin; g.fillRect(-26, 70, 52, 62);
  // hair behind
  g.fillStyle = o.hair;
  if (o.style === 'bun') { g.beginPath(); g.arc(0, -98, 34, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, -18, 84, 96, 0, 0, 7); g.fill(); }
  else { g.beginPath(); g.ellipse(0, -30, 80, 88, 0, 0, 7); g.fill(); }
  // face
  g.fillStyle = o.skin; g.beginPath(); g.ellipse(0, -6, 66, 84, 0, 0, 7); g.fill();
  // ears
  for (const x of [-64, 64]) { g.beginPath(); g.ellipse(x, 4, 11, 18, 0, 0, 7); g.fill(); }
  // hair in front
  g.fillStyle = o.hair;
  if (o.style === 'bun') { g.beginPath(); g.moveTo(-68, -20); g.bezierCurveTo(-66, -96, 66, -96, 68, -20); g.bezierCurveTo(40, -66, -40, -66, -68, -20); g.fill(); }
  else { g.beginPath(); g.moveTo(-70, -6); g.bezierCurveTo(-78, -104, 70, -112, 72, -18); g.bezierCurveTo(30, -60, -10, -76, -40, -50); g.bezierCurveTo(-56, -40, -62, -26, -70, -6); g.fill(); }
  // cheeks
  g.fillStyle = 'rgba(214,110,96,0.22)'; for (const x of [-38, 38]) { g.beginPath(); g.ellipse(x, 26, 16, 10, 0, 0, 7); g.fill(); }
  // eyes (closed into arcs by blink or a big laugh)
  const shut = Math.max(o.blink || 0, (o.smile || 0) > 0.75 ? (o.smile - 0.75) * 4 : 0), lk = (o.look || 0) * 6;
  for (const x of [-26, 26]) {
    if (shut > 0.6) { g.strokeStyle = '#2a1f1a'; g.lineWidth = 4.5; g.lineCap = 'round'; g.beginPath(); g.arc(x, -6, 9, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else {
      g.fillStyle = '#fbf6ef'; g.beginPath(); g.ellipse(x, -8, 12, 8 * (1 - shut), 0, 0, 7); g.fill();
      g.fillStyle = '#3a2a20'; g.beginPath(); g.arc(x + lk, -8, 5.5, 0, 7); g.fill();
    }
  }
  // brows
  g.strokeStyle = o.brow || o.hair; g.lineWidth = 5; g.lineCap = 'round';
  for (const x of [-26, 26]) { g.beginPath(); g.moveTo(x - 13, -27 - (o.smile || 0) * 3); g.quadraticCurveTo(x, -33 - (o.smile || 0) * 4, x + 13, -27 - (o.smile || 0) * 3); g.stroke(); }
  if (o.glasses) { g.strokeStyle = '#6a5a52'; g.lineWidth = 3.5; for (const x of [-26, 26]) { g.beginPath(); g.ellipse(x, -8, 20, 16, 0, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(-6, -10); g.lineTo(6, -10); g.stroke(); }
  // nose
  g.strokeStyle = 'rgba(120,70,50,0.55)'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(2, 2); g.quadraticCurveTo(8, 18, -2, 24); g.stroke();
  // mouth: a smile curve that opens
  const m = o.mouth || 0, sm = o.smile || 0, w = 20 + sm * 10;
  g.fillStyle = '#6e2a26';
  g.beginPath(); g.moveTo(-w, 44 - sm * 4); g.quadraticCurveTo(0, 50 + sm * 10 + m * 22, w, 44 - sm * 4); g.quadraticCurveTo(0, 46 + sm * 4, -w, 44 - sm * 4); g.fill();
  if (m + sm > 0.5) { g.fillStyle = '#f4efe8'; g.beginPath(); g.moveTo(-w * 0.8, 45 - sm * 3); g.quadraticCurveTo(0, 50 + sm * 3, w * 0.8, 45 - sm * 3); g.quadraticCurveTo(0, 47, -w * 0.8, 45 - sm * 3); g.fill(); }
  g.restore();
}

// Gran, as she actually was at her own time τ (film seconds): talking, waving hello, listening, laughing at the joke
function slGranAt(τ) {
  const talk = (a, b) => slWin(τ, a, b, 0.2, 0.2);
  const T = talk(SL.call + 0.6, SL.call + 3.2) + talk(SL.lagFrac + 0.4, SL.lagFrac + 2.4) + talk(SL.lagOne + 0.8, SL.lagOne + 2.6);
  const heard = SL.joke + 0.5 * (SL.jokeLaugh - SL.joke);           // she hears your joke half a round trip after you tell it
  const laugh = slWin(τ, heard + 0.1, heard + 3.6, 0.25, 0.9);
  const mouth = Math.max(0, Math.sin(τ * 17) * 0.5 + Math.sin(τ * 11.3) * 0.3) * MathX.clamp(T, 0, 1) + laugh * (0.55 + 0.3 * Math.abs(Math.sin(τ * 13)));
  const blink = Math.max(0, 1 - Math.abs(((τ * 0.31 + 0.4) % 1) - 0.5) * 40);
  return { mouth, smile: 0.25 + laugh * 0.75, blink, tilt: 0.04 * Math.sin(τ * 0.7) + laugh * 0.17 * Math.sin(τ * 9), wave: slWin(τ, SL.call + 0.2, SL.call + 2.4, 0.3, 0.3), look: 0.1 * Math.sin(τ * 0.4) };
}
// you, in the little self-view (no delay): you laugh at your own joke, then you've moved on (you look away)
function slYouAt(t) {
  const laugh = slWin(t, SL.joke, SL.joke + 2.2, 0.15, 0.6), away = slWin(t, SL.joke + 3.6, SL.jokeLaugh + 0.6, 0.6, 0.5);
  const talk = slWin(t, SL.joke - 1.6, SL.joke, 0.1, 0.1) + slWin(t, SL.call + 3.6, SL.call + 5.8, 0.2, 0.2);
  return { mouth: Math.max(0, Math.sin(t * 15) * 0.5) * MathX.clamp(talk, 0, 1) + laugh * 0.7, smile: 0.2 + laugh * 0.8 - away * 0.15, look: away * -0.9, blink: Math.max(0, 1 - Math.abs(((t * 0.27 + 0.1) % 1) - 0.5) * 40), tilt: laugh * 0.07 * Math.sin(t * 10) };
}

function slPhoneScreen() {
  const W = 540, H = 1170;
  const map = slCanvas(W, H, (g) => {
    // a calm map style: land, the harbour, streets, a park, labels
    g.fillStyle = '#ece7dc'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#a9cfe6';
    g.beginPath(); g.moveTo(0, 230); g.bezierCurveTo(120, 260, 200, 210, 300, 240); g.bezierCurveTo(400, 270, 470, 220, W, 250); g.lineTo(W, 560); g.bezierCurveTo(430, 590, 380, 520, 290, 560);
    g.bezierCurveTo(200, 600, 120, 540, 0, 580); g.closePath(); g.fill();
    g.fillRect(0, 0, W, 120);
    g.fillStyle = '#c9dfb4'; slRR(g, 330, 700, 150, 120, 18); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 16; g.lineCap = 'round';
    for (const [a, b, c, d] of [[0, 640, W, 610], [0, 900, W, 930], [120, 580, 160, H], [400, 560, 360, H], [0, 760, W, 790]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    g.strokeStyle = '#f6d58a'; g.lineWidth = 22; g.beginPath(); g.moveTo(0, 1040); g.bezierCurveTo(200, 1000, 340, 1080, W, 1030); g.stroke();
    g.fillStyle = '#ddd5c6'; for (let i = 0; i < 40; i++) { const x = slR(i, 3) * W, y = 600 + slR(i, 4) * 560; slRR(g, x, y, 40 + slR(i, 5) * 50, 30 + slR(i, 6) * 40, 6); g.fill(); }
    g.fillStyle = '#5a7a92'; g.font = 'italic 600 26px Georgia, serif'; g.textAlign = 'center'; g.fillText('The Harbour', 270, 420);
    g.fillStyle = '#6a6458'; g.font = '600 20px sans-serif'; g.fillText('QUAY ROAD', 270, 628);
  });
  const ct = slCanvasTex(W, H, (g, w, h, st) => {
    g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h);
    if (st.mode === 'call') {
      // Gran's kitchen in the morning (it is tomorrow morning in Sydney): a window, cupboards, warm light
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f3d9ad'); bg.addColorStop(1, '#c9a278'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff6df'; slRR(g, 300, 120, 200, 260, 10); g.fill(); g.fillStyle = '#bfe0f2'; slRR(g, 314, 134, 172, 232, 6); g.fill();
      g.strokeStyle = '#fff6df'; g.lineWidth = 8; g.beginPath(); g.moveTo(400, 134); g.lineTo(400, 366); g.stroke();
      g.fillStyle = '#8fb06e'; g.beginPath(); g.ellipse(420, 330, 50, 30, 0, 0, 7); g.fill();
      g.fillStyle = '#d9b98c'; g.fillRect(0, 470, 230, 150); g.fillStyle = '#c4a072'; g.fillRect(0, 470, 230, 8);
      const G = st.g;
      slDrawFace(g, 270, 640, 1.7, { skin: '#efc6a6', skinDark: '#e0b090', hair: '#d9d6d0', style: 'bun', glasses: true, top: '#8a5d73', collar: '#efe6dc', brow: '#bdb6ad', mouth: G.mouth, smile: G.smile, blink: G.blink, look: G.look, tilt: G.tilt });
      if (G.wave > 0.02) {           // her hand, waving hello
        g.save(); g.translate(430, 760 - G.wave * 140); g.rotate(0.35 * Math.sin(st.k * 0.9)); g.fillStyle = '#efc6a6';
        slRR(g, -34, -50, 68, 90, 26); g.fill(); for (let i = 0; i < 4; i++) { slRR(g, -32 + i * 17, -96, 14, 56, 7); g.fill(); } slRR(g, 26, -40, 36, 16, 8); g.fill(); g.restore();
      }
      // the delay, as the app shows it (a frozen-looking frame: a small spinner and the lag)
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, w, 150);
      g.fillStyle = '#fff'; g.font = '600 34px sans-serif'; g.textAlign = 'center'; g.fillText('Gran', w / 2, 74);
      g.font = '500 24px sans-serif'; g.fillStyle = '#d6e3ee'; g.fillText('Sydney · 6:' + String(24 + Math.floor((st.m || 0) % 30)).padStart(2, '0') + ' am', w / 2, 112);
      if (st.lag > 0.05) {
        g.fillStyle = 'rgba(20,20,24,0.72)'; slRR(g, w / 2 - 150, 170, 300, 56, 28); g.fill();
        g.fillStyle = '#ffcf7a'; g.font = '700 26px sans-serif'; g.fillText('POOR CONNECTION', w / 2, 207);
      }
      // you, in the corner
      g.save(); slRR(g, 352, 820, 160, 230, 22); g.clip();
      g.fillStyle = '#5b6f86'; g.fillRect(352, 820, 160, 230);
      const Y = st.y;
      slDrawFace(g, 432, 950, 0.62, { skin: '#d9a888', skinDark: '#c99674', hair: '#2a1d16', style: 'short', top: '#3f4a5a', mouth: Y.mouth, smile: Y.smile, blink: Y.blink, look: Y.look, tilt: Y.tilt });
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; slRR(g, 352, 820, 160, 230, 22); g.stroke();
      // the buttons
      g.fillStyle = '#e5483d'; g.beginPath(); g.arc(w / 2, 1090, 42, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; for (const x of [w / 2 - 140, w / 2 + 140]) { g.beginPath(); g.arc(x, 1090, 36, 0, 7); g.fill(); }
      g.strokeStyle = '#fff'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2 - 18, 1094); g.lineTo(w / 2 + 18, 1094); g.stroke();
    } else if (st.mode === 'map') {
      g.drawImage(map, 0, 0);
      // you: the flat on the quay (270, 640); the GPS fix drifts out over the water, the accuracy circle balloons
      const k = st.sea, x = slLerp(270, 210, k), y = slLerp(640, 380 - 40 * k, k), r = 26 + 260 * k * k + 12 * Math.sin(st.k * 2.2) * (1 - k);
      g.fillStyle = `rgba(66,133,244,${0.16 + 0.06 * k})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 19, 0, 7); g.fill();
      g.fillStyle = '#4285f4'; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill();
      // the search bar, the status card
      g.fillStyle = '#fff'; slRR(g, 30, 60, w - 60, 80, 40); g.fill();
      g.fillStyle = '#7a7a7a'; g.font = '500 28px sans-serif'; g.textAlign = 'left'; g.fillText('Search here', 74, 110);
      g.fillStyle = '#fff'; slRR(g, 30, 960, w - 60, 150, 26); g.fill();
      g.fillStyle = '#202124'; g.font = '700 30px sans-serif'; g.fillText(k > 0.3 ? 'You are in the harbour' : 'Your location', 64, 1018);
      g.fillStyle = k > 0.05 ? '#c5221f' : '#5f6368'; g.font = '500 24px sans-serif'; g.fillText(k > 0.05 ? 'GPS signal weak · accuracy ' + Math.round(10 + 2000 * k * k) + ' m' : 'Quay Road · accuracy 8 m', 64, 1062);
    }
    // the status bar
    g.fillStyle = st.mode === 'map' ? '#202124' : '#fff'; g.font = '600 26px sans-serif'; g.textAlign = 'left';
    const hh = Math.floor((st.m || 0) / 60) % 24, mm = Math.floor((st.m || 0) % 60);
    g.fillText(`${hh}:${String(mm).padStart(2, '0')}`, 36, 40); g.textAlign = 'right'; g.fillText('●●●  ▮', w - 36, 40);
  });
  return ct;
}
