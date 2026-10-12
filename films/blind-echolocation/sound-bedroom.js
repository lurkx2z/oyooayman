/* =====================================================================
   SOUND — chapter 1 (scenes 1–2, the bedroom). Registers builders per stem (audio.js runs them).
   The bedroom's own acoustics: a small furnished room (4.6 × 2.65 × 4.2 m, soft bed and curtains): short, warm, its
   first reflections arrive within ≈ 3–15 ms of the direct sound (heard as the room's "size", not as separate echoes).
   The picture's slowed wave is labelled as slowed; the sound is always real time.
   ===================================================================== */

const BE_BEDROOM = { size: [4.6, 2.65, 4.2], rt60: 0.42, absorb: 0.38, bright: 0.45, wet: 0.32, seed: 41 };
// positions inside the room's box (x from the west wall, y up, z from the north wall)
const _beBox = (v) => [v.x + BE_APT.W, v.y, v.z + BE_APT.D];
const BE_EAR_BED = new THREE.Vector3(-0.36, 1.12, -1.4);

// the phone's alarm cycles (1.4 s): the vibration segments, and when it is on the table / falling / under the dresser
function beAlarmEnd() { return BE.s2 + 3.4; }

// ================================================================================================= SFX
beSound('sfx', 'bedroom', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const room = K.room('bedroom', Object.assign({ src: _beBox(BE_APT.phone0), lis: _beBox(BE_EAR_BED) }, BE_BEDROOM));
  const roomFloor = K.room('bedroomFloor', Object.assign({}, BE_BEDROOM, { src: _beBox(new THREE.Vector3(-1.42, 0.02, -1.36)), lis: _beBox(BE_EAR_BED), wet: 0.42, seed: 43 }));
  const END = beAlarmEnd();
  // ---- the alarm: the phone vibrating on the wooden bedside table (a buzz through the table's modes) + its tone
  const tableModes = [[172, 0.03, 1], [344, 0.02, 0.6], [520, 0.015, 0.45], [1150, 0.008, 0.25], [2300, 0.004, 0.12]];
  for (let k = 0; k * 1.4 < END; k++) for (const o of [0, 0.6]) {
    const t = k * 1.4 + o; if (t >= END) break;
    const phase = t < B.knock ? 'table' : t < B.slide[1] ? 'moving' : 'under';
    const att = t < B.dark0 ? 0.55 : MathX.lerp(0.62, 1.0, MathX.smooth(t, B.alarm - 0.6, B.alarm + 0.4));
    const y = fx.creak(0.45, phase === 'table' ? tableModes : phase === 'under' ? [[150, 0.03, 1], [300, 0.02, 0.4]] : [[180, 0.01, 0.5], [900, 0.006, 0.3]],
      { rate: [168, 178], jit: 0.04, env: (u) => Math.min(1, u * 25, (1 - u) * 25) });
    const vol = (phase === 'table' ? 0.2 : phase === 'moving' ? 0.08 : 0.14) * att * (t > END - 2 ? MathX.ramp(END, END - 2, t) : 1);
    K.put(y, t, { vol, norm: true, pan: 0.45, room, wet: phase === 'under' ? 0.4 : 0.9, lp: phase === 'under' ? 700 : 0 });
  }
  // the alarm tone: a soft three-note phone melody (small speaker: band-limited), muffled under the dresser
  const mel = [['A5', 0], ['C#6', 0.17], ['E6', 0.34], ['A6', 0.6]];
  for (let k = 0; k * 1.4 < END; k++) for (const [n, o] of mel) {
    const t = k * 1.4 + o + 0.05; if (t >= END) break;
    const under = t > B.slide[1], moving = t > B.knock && !under;
    const att = t < B.dark0 ? 0.6 : MathX.lerp(0.7, 1.0, MathX.smooth(t, B.alarm - 0.6, B.alarm + 0.4));
    const y = Float32Array.from(fx.bellBuf(gbMidi(n)).subarray(0, Math.round(0.9 * sr)));
    for (let i = 0; i < y.length; i++) y[i] *= Math.exp(-i / (0.22 * sr));
    GBX.bq(y, 'hp', 650, 0.7, sr); GBX.bq(y, 'peak', 2400, 1, sr, 4);
    K.put(y, t, { vol: (under ? 0.05 : moving ? 0.06 : 0.085) * att * (t > END - 2 ? MathX.ramp(END, END - 2, t) : 1), pan: 0.45, room, wet: 0.8, lp: under ? 900 : 5200 });
  }
  // ---- a car passing on the street beyond the window (her left): tyres and engine, through the glass, moving left → right
  {
    const dur = 4.4, n = Math.ceil(dur * sr), L = fx.arr(dur), R = fx.arr(dur), ty = fx.white(n), en = new Float32Array(n);
    GBX.bq(ty, 'bp', 900, 0.6, sr); GBX.bq(ty, 'lp', 1700, 0.7, sr);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, x = (t - 1.9) * 9, d = Math.hypot(x, 9), a = 1 / (1 + (d * d) / 30);
      const v = -9 * x / d;   // radial speed (approaching > 0)
      ph += 64 * (343 / (343 - v * 0.6)) / sr; if (ph >= 1) ph -= 1;
      en[i] = (ph * 2 - 1) * 0.5;
      const s = (ty[i] * 1.0 + en[i] * 0.35) * a * Math.min(1, t / 0.4, (dur - t) / 0.4);
      const pan = MathX.clamp(x / 14, -1, 1) * 0.8 - 0.35, ang = (pan + 1) * Math.PI / 4;
      L[i] = s * Math.cos(ang); R[i] = s * Math.sin(ang);
    }
    GBX.bq(L, 'lp', 1300, 0.7, sr); GBX.bq(R, 'lp', 1300, 0.7, sr);
    K.putLR(L, R, B.cars - 1.4, { vol: 0.35, norm: true });
  }
  // ---- footsteps in the hallway, beyond the closed door (ahead and right, walking past): wood, muffled by the door
  FILM.stepTimes.forEach((t, i) => {
    const y = fx.woodStep({ weight: 0.7, creak: i === 2 ? 0.3 : 0, scuff: i % 2 ? 0.08 : 0 });
    K.put(y, t, { vol: 0.2 * MathX.window(t, B.steps, B.steps + 3.2, 0.6, 1.2) + 0.03, norm: true, pan: 0.5 - 0.22 * i, lp: 1100, room, wet: 0.3 });
  });
  // ---- her fingertips find the table edge; the knock; the fall; the impact on the floorboards; the bounce; the skid
  K.put(fx.slap(fx.woodModes(260, 0.8), { amp: 0.5, skin: 0.5, width: 0.002 }), B.touch, { vol: 0.16, norm: true, pan: 0.4, room, wet: 0.6 });
  K.put(fx.slap(fx.woodModes(300, 0.6), { amp: 0.4, skin: 0.7, width: 0.0015 }), B.touch + 0.42, { vol: 0.1, norm: true, pan: 0.42, room, wet: 0.6 });
  K.put(fx.hit([[2100, 0.015, 1], [3400, 0.01, 0.6], [5200, 0.006, 0.3]], { width: 0.0006, noise: 0.3, nhp: 3000 }), B.knock, { vol: 0.2, norm: true, pan: 0.45, room });
  K.put(fx.rustle(B.drop - B.knock + 0.05, { density: 700, rub: 0.5, lo: 1600, hi: 7000, grain: 0.004 }), B.knock + 0.01, { vol: 0.12, norm: true, pan: 0.45, room });
  // ★ the impact: the phone's hard case and glass on oak boards: a bright crack, the board's thud, the case rattling
  {
    const caseM = [[1850, 0.02, 1], [2950, 0.014, 0.7], [4600, 0.01, 0.5], [7100, 0.006, 0.3]];
    const y = fx.hit(caseM.concat(fx.woodModes(118, 1.4)), { width: 0.0005, amp: 1, noise: 0.5, nhp: 2500, nlen: 0.006, extra: [[0.012, 0.0004, 0.45], [0.031, 0.0004, 0.25]] });
    for (let i = 0; i < 0.35 * sr; i++) y[i] += (1.1 * Math.sin(2 * Math.PI * 58 * i / sr) * Math.exp(-i / (0.07 * sr)) + 0.6 * Math.sin(2 * Math.PI * 96 * i / sr) * Math.exp(-i / (0.045 * sr))) * Math.min(1, i / (0.003 * sr));   // the boards' body
    { const rt = fx.rustle(0.18, { density: 1600, rub: 0.2, lo: 1800, hi: 9000, grain: 0.002, env: (u) => Math.exp(-u * 5) }); for (let i = 0; i < rt.length; i++) y[i + Math.round(0.004 * sr)] += rt[i] * 0.5; }   // the case rattles
    // saturate the first milliseconds (a real crash is dense, not one sharp spike): more weight for the same peak
    { const pk = GBX.peak(y); for (let i = 0; i < y.length; i++) y[i] = Math.tanh(4 * y[i] / pk) / Math.tanh(4); }
    K.put(y, B.impact, { vol: 0.95, pan: 0.5, room: roomFloor, wet: 1.4 });
    K.put(fx.hit(caseM, { width: 0.0004, amp: 0.6, noise: 0.25, nhp: 3000 }), B.bounce, { vol: 0.32, norm: true, pan: 0.52, room: roomFloor, wet: 1.0 });
    // the skid: friction noise that slows (scrape grains get sparser), a last tick against the dresser's leg
    const sd = B.slide[1] - B.slide[0];
    K.put(fx.rustle(sd + 0.1, { density: 1400, rub: 0.55, lo: 900, hi: 6500, grain: 0.003, env: (u) => Math.pow(1 - u, 1.4) * Math.min(1, u * 20) }), B.slide[0] - 0.1, { vol: 0.3, norm: true, pan: 0.55, room: roomFloor, wet: 0.8 });
    K.put(fx.hit(fx.woodModes(320, 0.6).concat([[2400, 0.01, 0.5]]), { width: 0.0008, amp: 0.4 }), B.slide[1] - 0.05, { vol: 0.12, norm: true, pan: 0.6, room: roomFloor, wet: 0.7 });
  }
});

// ================================================================================================= AMBIENCE
beSound('amb', 'bedroom', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, D = B.s3 + 1.5, n = Math.ceil(D * sr), L = fx.arr(D), R = fx.arr(D);
  // the room tone (a quiet flat in the morning: a low hum of the building, air)
  for (const X of [L, R]) {
    const w = fx.white(n), h = fx.white(n); GBX.bq(w, 'lp', 260, 0.6, sr); GBX.bq(w, 'hp', 45, 0.7, sr); GBX.bq(h, 'bp', 2300, 0.5, sr);
    for (let i = 0; i < n; i++) X[i] += w[i] * 0.12 + h[i] * 0.006;
  }
  // the street beyond the window (her left): a far traffic wash; birds in the morning (they don't stop when the light goes)
  { const w = fx.white(n); GBX.bq(w, 'bp', 420, 0.5, sr); GBX.bq(w, 'lp', 900, 0.7, sr); const wv = fx.wander(0.15); for (let i = 0; i < n; i++) w[i] *= 0.8 + 0.2 * wv(i / sr); GBX.mixIn(L, R, w, 0, 0.045, -0.55); }
  for (let t = 0.4; t < D - 1; t += r.range(1.2, 3.4)) {
    const f = r.range(2900, 4600), k = r.int(2, 5), y = fx.arr(k * 0.12 + 0.1);
    for (let j = 0; j < k; j++) { const i0 = Math.round(j * r.range(0.09, 0.14) * sr), len = Math.round(r.range(0.04, 0.08) * sr), f1 = f * r.range(0.85, 1.15); let ph = 0; for (let i = 0; i < len && i0 + i < y.length; i++) { const u = i / len; ph += 2 * Math.PI * f1 * (1 + 0.25 * Math.sin(Math.PI * u)) / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u); } }
    GBX.bq(y, 'lp', 3600, 0.7, sr);   // through the glass
    GBX.mixIn(L, R, y, Math.round(t * sr), r.range(0.012, 0.024), r.range(-0.9, -0.4));
  }
  // the wall clock (right wall): a soft tick every second; you only notice it once the light is gone
  for (let t = 0.5; t < D; t += 1) {
    const y = fx.hit([[3100, 0.006, 1], [5200, 0.004, 0.5], [1400, 0.01, 0.4]], { width: 0.0003, amp: 1 });
    GBX.mixIn(L, R, y, Math.round(t * sr), (t < B.dark0 ? 0.004 : t < B.strange ? 0.009 : 0.014) * (t > B.s2 + 2 ? 0.6 : 1), 0.55);
  }
  const room = K.room('bedroomAmb', Object.assign({ src: [3.5, 2, 1], lis: _beBox(BE_EAR_BED) }, BE_BEDROOM, { wet: 0.2 }));
  K.putLR(L, R, 0, { vol: 1, fadeIn: 0.6, stop: D, fade: 1.2, room, wet: 0.5 });
});

// ================================================================================================= FOLEY
beSound('foley', 'bedroom', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE;
  const room = K.room('bedroomF', Object.assign({ src: _beBox(BE_EAR_BED), lis: _beBox(BE_EAR_BED) }, BE_BEDROOM, { wet: 0.22 }));
  const duvet = (t, d, v, pan = 0) => K.put(fx.rustle(d, { density: 260, rub: 0.45, lo: 300, hi: 4200, grain: 0.02 }), t, { vol: v, norm: true, pan, room });
  const breath = (t, d, v, o = {}) => K.put(fx.breath(d, o), t, { vol: v, norm: true, pan: 0, room, wet: 0.5 });
  duvet(0.05, 2.4, 0.16, -0.1);                                   // she sits up against the pillows
  breath(0.4, 1.4, 0.05, {});                                     // a sleepy exhale
  duvet(B.reach[0], 1.8, 0.09, 0.35);                             // the arm out from under the duvet
  breath(B.dark0 + 0.05, 0.55, 0.13, { inhale: true });           // ★ the light goes: a sharp inhale
  breath(B.dark0 + 1.1, 1.0, 0.06, {});
  breath(B.sun + 0.2, 0.7, 0.07, { inhale: true }); breath(B.sun + 1.0, 0.9, 0.05, {});
  K.put(fx.rustle(0.6, { density: 180, rub: 0.3, lo: 500, hi: 3500, grain: 0.015 }), B.handUp, { vol: 0.07, norm: true, pan: 0.2, room });   // the hand comes up
  breath(B.hands - 0.2, 0.9, 0.07, { inhale: true }); breath(B.hands + 0.8, 1.6, 0.05, {});
  breath(B.room + 1.0, 1.0, 0.04, {}); breath(B.alarm + 1.6, 0.8, 0.04, { inhale: true });
  duvet(B.alarm - 0.1, 0.9, 0.05, 0.3);                           // she turns toward the alarm
  duvet(B.cars + 0.4, 1.0, 0.05, -0.3);                           // …toward the window
  duvet(B.brain + 0.2, 2.6, 0.08, 0.35);                          // she leans and searches
  breath(B.brain + 1.2, 0.7, 0.05, { inhale: true });
  breath(B.impact + 0.12, 0.45, 0.12, { inhale: true });          // the startle after the crash
  duvet(B.impact + 0.05, 0.5, 0.06, 0.2);
  breath(B.back1 + 0.4, 1.5, 0.06, {});                           // the long exhale
  duvet(B.back1 + 1.2, 1.4, 0.06, 0.3);
});

// ================================================================================================= MUSIC
beSound('music', 'bedroom', function (ctx, dest, K) {
  const { fx } = K, B = BE, M = beMusicKit(ctx, K);
  // the morning: a warm felt-piano figure in D, gently rocking; it stops on "can't" (the last note left to decay)
  const fig = ['D4', 'A4', 'F#4', 'E5', 'B3', 'F#4', 'D4', 'C#5'];
  for (let i = 0; 0.2 + i * 0.42 < B.dark0 - 0.1; i++) M.piano(0.2 + i * 0.42, fig[i % 8], 0.42 + 0.1 * (i % 2 ? 0 : 1), 1.4, i % 2 ? 0.25 : -0.25, i * 0.42 + 0.2 > B.dark0 - 0.6 ? 1.2 : 0.08);
  M.strings(0.0, B.dark0 + 0.25, ['D3', 'A3', 'F#4'], 0.4, { att: 1.0, rel: 0.25, cut: 1300 });
  M.piano(B.dark0 - 0.02, 'D3', 0.45, 3.0, 0, 1.5);
  // the dark: a low drone with a slow beating, almost nothing; it shifts on "the strange part" and opens on the alarm
  M.strings(B.dark0 + 0.6, B.strange + 0.3, ['D2', 'A2'], 0.9, { att: 2.0, rel: 0.6, cut: 380, vib: 2 });
  M.strings(B.strange - 0.3, B.brain + 0.6, ['D2', 'A2', 'E3'], 1.0, { att: 1.2, rel: 0.8, cut: 420, cutTo: 700, vib: 2 });
  M.strings(B.room + 0.8, B.brain + 0.6, ['B4', 'E5'], 0.28, { att: 2.5, rel: 0.8, cut: 2600, vib: 3 });
  // "your brain is about to discover…": a rising, held suspension, cut dead just before the knock (the impact is unscored)
  M.strings(B.brain, B.knock - 0.06, ['D2', 'A2', 'E3', 'B3'], 1.0, { att: 2.0, rel: 0.04, cut: 500, cutTo: 2200, keys: [[B.touch, 0.8], [B.knock - 0.4, 1.0]] });
  M.strings(B.brain + 0.8, B.knock - 0.06, ['F#5', 'A5'], 0.3, { att: 2.0, rel: 0.04, cut: 3600, cutTo: 6000, vib: 3, keys: [[B.touch, 0.7], [B.knock - 0.4, 1.0]] });
  // the reveal: 0.35 s of nothing after the impact, then the room "appears": a high shimmering chord (A add9) and bells
  M.strings(B.impact + 0.35, B.back1 + 1.6, ['A4', 'B4', 'E5', 'C#6'], 0.55, { att: 0.7, rel: 1.4, cut: 4200, vib: 3 });
  M.strings(B.impact + 0.5, B.s2 + 1.2, ['A1', 'E2', 'A2'], 0.9, { att: 1.2, rel: 1.6, cut: 500 });
  [['E6', 0.45], ['A6', 0.75], ['C#7', 1.15], ['B6', 1.6]].forEach(([n, o], i) => M.bell(B.impact + o, n, 0.35 - 0.05 * i, i % 2 ? 0.4 : -0.4));
  void fx;
});

// a small music kit (the gravity films' felt piano and string pads) shared by every chapter
function beMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(3.2, { bright: 0.5, damp: 3.5, shape: 2.0, pre: 0.02, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.4;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4) => fx.play(fx.pianoBuf(gbMidi(n)), t, bus, { vol: vel * 0.34, pan, stop: t + dur + fade, fade }),
    bell: (t, n, vol, pan = 0) => fx.play(fx.bellBuf(gbMidi(n)), t, bus, { vol: vol * 0.25, pan }),
    strings(t0, t1, notes, vol, o = {}) {
      if (t1 - t0 < 0.1) return;
      const att = Math.min(o.att || 1.0, (t1 - t0) * 0.45), rel = Math.min(o.rel || 1.2, (t1 - t0) * 0.45), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.11 * (o.keys ? o.keys[0][1] : 1), t0 + att);
      for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) g.gain.linearRampToValueAtTime(vol * 0.11 * v, t);
      const vEnd = o.keys ? o.keys[o.keys.length - 1][1] : 1;
      g.gain.linearRampToValueAtTime(vol * 0.11 * vEnd, Math.max(t0 + att + 0.01, t1 - rel)); g.gain.linearRampToValueAtTime(0, t1);
      g.connect(bus);
      const lanes = [-0.55, 0, 0.55].map((p) => {
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(o.cut || 1700, t0);
        if (o.cutTo) lp.frequency.linearRampToValueAtTime(o.cutTo, t1 - rel * 0.5);
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = gbHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f; osc.detune.value = d + r.range(-2, 2);
          lfo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          lfo.connect(lg); lg.connect(osc.detune);
          og.gain.value = 1 / Math.sqrt(notes.length); osc.connect(og); og.connect(lanes[k]);
          osc.start(t0); osc.stop(t1 + 0.05); lfo.start(t0); lfo.stop(t1 + 0.05);
        });
      }
    },
  };
  return (K._music = M);
}

// ================================================================================================= SCENE 2
beSound('sfx', 'bedroom-s2', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const room = K.room('bedroom2', Object.assign({ src: [2.2, 0.6, 1.9], lis: [2.5, 1.5, 1.9] }, BE_BEDROOM));
  // B1: her nails on the floorboards under the dresser; the phone found; the alarm silenced (a soft screen tap)
  for (let t = B.s2 + 0.4; t < B.grab; t += r.range(0.35, 0.6)) K.put(fx.rustle(0.18, { density: 900, rub: 0.3, lo: 1200, hi: 7000, grain: 0.003 }), t, { vol: 0.05, norm: true, pan: -0.3, room, wet: 0.5 });
  K.put(fx.hit([[1900, 0.012, 1], [3300, 0.008, 0.5]], { width: 0.0008, amp: 0.5 }), B.grab, { vol: 0.08, norm: true, pan: -0.3, room });
  K.put(fx.hit([[2600, 0.004, 1]], { width: 0.0015, amp: 0.4 }), B.silence - 0.05, { vol: 0.05, norm: true, pan: -0.2, room });
  // B3: the pour: the stream into the glass. Its note RISES as the glass fills (the air column above the water gets
  // shorter): the sound a blind person really uses, together with the finger on the rim
  {
    const t0 = B.water + 0.1, d = 0.95, n = Math.ceil(d * sr), y = fx.white(n), z = new Float32Array(n);
    GBX.bq(y, 'bp', 2400, 0.8, sr);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n, lvl = 0.04 + 0.84 * Math.min(1, u * 1.05), L = 0.1 * (1 - lvl) + 0.012, f = 343 / (4 * L);
      ph += 2 * Math.PI * f / sr; z[i] = Math.sin(ph) * (0.5 + 0.5 * Math.sin(ph * 0.5 + i * 0.0007));
      const e = Math.min(1, u * 15, (1 - u) * 12);
      y[i] = (y[i] * 0.6 + z[i] * 0.35) * e;
    }
    for (let t = 0; t < d; t += r.range(0.02, 0.06)) { const L = new Float32Array(n), R = new Float32Array(n); fx.bubble(L, R, Math.round(t * sr), r.range(700, 1800) * (1 + t), r.range(0.004, 0.01), 0.3, 0); for (let i = 0; i < n; i++) y[i] += L[i] + R[i]; }
    K.put(y, t0, { vol: 0.16, norm: true, pan: -0.25, room, wet: 0.4 });
  }
  // B4: the palm over the painted door (a dry slide), the lever found, pressed (a metal latch)
  K.put(fx.rustle(1.0, { density: 300, rub: 0.6, lo: 900, hi: 5000, grain: 0.01 }), B.handle + 0.1, { vol: 0.06, norm: true, pan: -0.3, room });
  K.put(fx.hit(fx.metalModes(1450, 0.3).concat([[620, 0.02, 0.6]]), { width: 0.0007, amp: 0.6 }), B.handle + 1.25, { vol: 0.12, norm: true, pan: -0.35, room });
  // B6: the movie version's own cheesy sound design: a sci-fi sonar ping and a riser… and on "superhuman" it powers down
  K.put(fx.shimmer(1.6, 880, { skew: 0.15 }), B.movies + 0.05, { vol: 0.08, norm: true, room, wet: 0.2 });
  { const d = 2.6, n = Math.ceil(d * sr), y = fx.arr(d); let ph = 0;
    for (let i = 0; i < n; i++) { const u = i / n, f = 1500 * Math.pow(0.04, u); ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.4 * Math.sign(Math.sin(ph * 0.5))) * Math.pow(1 - u, 1.5) * Math.min(1, u * 60) * (0.6 + 0.4 * Math.sin(i / sr * 2 * Math.PI * 14)); }
    GBX.bq(y, 'lp', 3000, 0.7, sr);
    K.put(y, B.superN + 0.05, { vol: 0.1, norm: true }); }
  // B8: her bare feet on the boards (soft), fingertips whispering along the plaster; ★ the knuckle tap on the wall
  const plan = beScene2Props._plan;
  if (plan) for (const h of plan) if (h.t0 > BE.walk[0] && h.t0 < BE.walk[1] + 0.5) K.put(fx.woodStep({ weight: 0.25 }), h.t0, { vol: 0.05, norm: true, pan: 0.1, lp: 2500, room, wet: 0.5 });
  K.put(fx.rustle(B.walk[1] - B.walk[0], { density: 120, rub: 0.7, lo: 1500, hi: 6000, grain: 0.02, env: (u) => Math.min(1, u * 8, (1 - u) * 8) }), B.walk[0], { vol: 0.03, norm: true, pan: 0.35, room });
  { const y = fx.slap([[150, 0.02, 1], [420, 0.012, 0.6], [1100, 0.006, 0.35], [2600, 0.003, 0.2]], { amp: 1, skin: 0.35, width: 0.0012, len: 0.3 });
    K.put(y, B.tap, { vol: 0.42, norm: true, pan: 0.3, room, wet: 1.6 }); }
});
beSound('foley', 'bedroom-s2', function (ctx, dest, K) {
  const { fx } = K, B = BE;
  const room = K.room('bedroomF2', Object.assign({ src: [2.0, 1.4, 1.5], lis: [2.0, 1.5, 1.5] }, BE_BEDROOM, { wet: 0.22 }));
  const cloth = (t, d, v, pan = 0) => K.put(fx.rustle(d, { density: 240, rub: 0.4, lo: 350, hi: 4500, grain: 0.018 }), t, { vol: v, norm: true, pan, room });
  const breath = (t, d, v, o = {}) => K.put(fx.breath(d, o), t, { vol: v, norm: true, room, wet: 0.5 });
  cloth(B.s2 + 0.1, 2.6, 0.09, -0.2); breath(B.grab + 0.2, 1.4, 0.06, {});                 // kneeling, the relief
  cloth(B.clothes, 1.3, 0.14, 0.15);                                                      // the sweater
  cloth(B.handle, 0.6, 0.05, -0.2);
  breath(B.attn + 0.8, 0.8, 0.05, { inhale: true }); breath(B.attn + 2.2, 1.2, 0.04, {});
  breath(B.learn + 0.4, 1.3, 0.04, {});
  breath(B.tap + 0.18, 0.4, 0.09, { inhale: true });                                      // the tiny surprise
  breath(B.tap + 2.0, 1.5, 0.04, {});
});
beSound('amb', 'bedroom-s2', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE;
  // B7: the room's own sounds, louder for the "sparse map": the clock (south wall), traffic beyond the window, the hall
  for (let t = Math.ceil(B.learn); t < B.one + 0.5; t += 1) K.put(fx.hit([[3100, 0.006, 1], [5200, 0.004, 0.5], [1400, 0.01, 0.4]], { width: 0.0003, amp: 1 }), t, { vol: 0.05, norm: true, pan: 0.15 });
  { const d = B.one - B.learn, n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'bp', 700, 0.7, sr); GBX.bq(y, 'lp', 1300, 0.7, sr);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(Math.sin(Math.PI * u), 2); }
    K.put(y, B.learn, { vol: 0.07, norm: true, pan: -0.7 }); }
  for (const t of [B.learn + 1.9, B.learn + 2.5]) K.put(fx.woodStep({ weight: 0.6 }), t, { vol: 0.06, norm: true, pan: 0.6, lp: 1000 });
});
beSound('music', 'bedroom-s2', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // the montage: patient, a little stuck: low strings and a slow piano that keeps returning to the same two notes
  M.strings(B.s2 + 0.8, B.movies - 0.2, ['A1', 'E2', 'A2'], 0.7, { att: 1.5, rel: 1.0, cut: 600 });
  M.strings(B.clothes - 0.4, B.movies - 0.2, ['C#4', 'E4'], 0.3, { att: 2.0, rel: 1.0, cut: 1400, vib: 3 });
  [[B.first, 'A4'], [B.first + 1.4, 'E4'], [B.clothes, 'A4'], [B.water, 'B4'], [B.handle, 'A4'], [B.attn, 'E4'], [B.attn + 1.9, 'C#5'], [B.attn + 3.6, 'B4']].forEach(([t, n], i) => M.piano(t, n, 0.32, 2.2, i % 2 ? 0.2 : -0.2, 0.8));
  // the movie version: a trailer cliché (big, bright, synthetic), cut dead on "superhuman"
  M.strings(B.movies, B.superN + 0.05, ['D3', 'A3', 'D4', 'F#4', 'A4'], 1.1, { att: 1.0, rel: 0.05, cut: 1800, cutTo: 5000, vib: 2, wave: 'square' });
  M.strings(B.movies + 0.5, B.superN + 0.05, ['D2', 'D1'], 1.4, { att: 0.5, rel: 0.05, cut: 300, wave: 'square' });
  // the sparse map: nothing (the room is the music); the walk: a quiet pad; silence for the tap; one harmonic after it
  M.strings(B.one + 0.6, B.tap - 0.25, ['E2', 'B2', 'G#3'], 0.55, { att: 2.0, rel: 0.25, cut: 700 });
  M.strings(B.tap + 0.9, B.s3 + 1.4, ['E5', 'B5'], 0.3, { att: 1.2, rel: 1.2, cut: 4500, vib: 3 });
  M.bell(B.tap + 0.6, 'B6', 0.2, 0.3);
});
