/* =====================================================================
   SOUNDTRACK — "Killua × Eren in WWII"
   A synthesised trailer score at 120 BPM (a beat every 0.5 s, a bar every
   2 s) in D minor (Dm – B♭ – F – C), cut to the picture: every edit point
   lands on a hit, every 5–7 s the music changes gear.
     music     intro drone → tense pulse → SILENCE → the drop → drive →
               SILENCE → the bolt → brass swell → BRAAAM reveal → taiko
               drive → fast hats (Killua) → montage → half-time aura walk
               → the army's pulse → barrage → a held chord for the size
               shot → the guns die → the push → the break → SILENCE →
               a quiet theme → the final hit
     Killua    clean, dry, high: electric cracks, zips that pan, a thin
               crackle while he is close; never bass
     Eren      heavy and warm: thunder, sub, steam, footsteps that shake,
               metal that bends, three roars
     war       rifles, cannons, shells, a machine gun, engines, radio
   ===================================================================== */

class XAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [XB, XSLOW]; }

  _build(ctx) {
    const S = new SoundKit(ctx, 1944), END = CONFIG.duration + 1.4;
    const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
    // a soft limiter on everything
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(out);
    const rev = S.reverb(2.4), revG = ctx.createGain(); revG.gain.value = 0.3; rev.connect(revG); revG.connect(comp);
    const bus = (g, r = 0, dest = comp) => { const b = ctx.createGain(); b.gain.value = g; b.connect(dest); if (r) { const s = ctx.createGain(); s.gain.value = r; b.connect(s); s.connect(rev); } return b; };
    // the music runs through a low-pass that closes in slow motion and a gain that carves the silences
    const musLP = S.filter('lowpass', 18000, 0.7), musG = ctx.createGain(); musLP.connect(musG); musG.connect(comp);
    const mus = bus(0.42, 0.25, musLP), drums = bus(0.6, 0.12, musLP);
    const kfx = bus(0.8, 0.18), efx = bus(1.0, 0.3), war = bus(0.85, 0.3), amb = bus(0.6, 0.15);
    const lin = (p, pts) => { p.setValueAtTime(pts[0][1], 0); for (const [t, v] of pts) p.linearRampToValueAtTime(v, t); };
    const D = XB;

    // music level: [time, gain]; the three silences are hard cuts
    lin(musG.gain, [[0, 0.0], [0.3, 0.7], [4.5, 0.7], [4.55, 0.0], [5.0, 0.0], [5.05, 0.8], [10.9, 1.0], [10.98, 0.0], [11.99, 0.0], [12.0, 1.0], [14.98, 1.0], [15.0, 0.0], [15.24, 0.0], [15.25, 0.9], [19.2, 0.9], [19.5, 0.0], [20.69, 0.0], [20.7, 1.0],
      [34.6, 1.0], [34.65, 0.55], [35.35, 0.55], [35.4, 1.0], [49.0, 1.0], [49.2, 0.6], [50.95, 0.6], [51.0, 1.0], [57.0, 1.0], [57.05, 0.35], [58.55, 0.35], [58.6, 1.0], [62.15, 1.0], [62.2, 0.0], [62.99, 0.0], [63.0, 0.7], [64.95, 0.7], [65.0, 1.0], [71.55, 1.0], [71.6, 0.0]]);
    // the slow-motion moments sound underwater
    musLP.frequency.setValueAtTime(18000, 0); for (const [a, b] of XSLOW) { musLP.frequency.setValueAtTime(18000, a); musLP.frequency.exponentialRampToValueAtTime(420, a + 0.06); musLP.frequency.setValueAtTime(420, b - 0.05); musLP.frequency.exponentialRampToValueAtTime(18000, b + 0.08); }

    /* ---------------- instruments ---------------- */
    const osc = (type, f, t0, t1) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.start(t0); o.stop(t1); return o; };
    const env = (t, a, peak, d, hold = 0) => { const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); if (hold) g.gain.setValueAtTime(peak, t + a + hold); g.gain.setTargetAtTime(0, t + a + hold, Math.max(0.003, d / 4)); return g; };
    const noiseHit = (t, dur, type, f, q, vol, dest, noise = 'white', pan = 0, a = 0.002, f1 = null) => {
      const n = S.noise(noise, t, t + dur + 0.1), b = S.filter(type, f, q), g = env(t, a, vol, dur);
      if (f1) { b.frequency.setValueAtTime(f, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur); }
      n.connect(b); b.connect(g); g.connect(S.panned(dest, pan));
    };
    const sub = (t, f0, f1, vol, dec, dest) => { const o = osc('sine', f0, t, t + dec * 1.8 + 0.1); o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.5, dec * 0.6)); const g = env(t, 0.004, vol, dec); o.connect(g); g.connect(dest); };
    // drums
    const kick = (t, v = 1) => { sub(t, 160, 44, 0.9 * v, 0.42, drums); noiseHit(t, 0.02, 'highpass', 3000, 0.7, 0.18 * v, drums); };
    const snare = (t, v = 1) => { noiseHit(t, 0.2, 'bandpass', 1900, 0.7, 0.42 * v, drums, 'white'); const o = osc('triangle', 210, t, t + 0.2); o.frequency.exponentialRampToValueAtTime(160, t + 0.08); const g = env(t, 0.002, 0.22 * v, 0.1); o.connect(g); g.connect(drums); };
    const hat = (t, v = 1, open = false) => noiseHit(t, open ? 0.22 : 0.045, 'highpass', 7500, 0.8, 0.12 * v, drums, 'white', 0.15);
    const taiko = (t, v = 1) => { sub(t, 110, 58, 0.85 * v, 0.7, drums); noiseHit(t, 0.35, 'lowpass', 600, 0.7, 0.4 * v, drums, 'pink'); };
    const crash = (t, v = 1) => { noiseHit(t, 1.8, 'highpass', 4500, 0.5, 0.2 * v, drums, 'white', 0, 0.003); noiseHit(t, 1.0, 'bandpass', 3200, 0.8, 0.1 * v, drums); };
    // harmony: D minor — Dm, B♭, F, C (a bar each)
    const CH = [[38, 50, 53, 57], [34, 46, 50, 53], [29, 41, 45, 48], [36, 48, 52, 55]];      // midi
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const chordAt = (t) => CH[Math.floor(t / 2) % 4];
    const saws = (t0, t1, f, vol, cut, dest, det = [-9, 0, 8], a = 0.05, r = 0.2, cut1 = null) => {
      const g = ctx.createGain(), lp = S.filter('lowpass', cut, 1.2);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.setValueAtTime(vol, Math.max(t0 + a, t1 - r)); g.gain.linearRampToValueAtTime(0, t1);
      if (cut1) { lp.frequency.setValueAtTime(cut, t0); lp.frequency.exponentialRampToValueAtTime(cut1, t1); }
      for (const c of det) { const o = osc('sawtooth', f, t0, t1 + 0.05); o.detune.value = c; o.connect(lp); }
      lp.connect(g); g.connect(dest);
    };
    const bass = (t, dur, m, v = 1) => saws(t, t + dur, hz(m), 0.16 * v, 260, mus, [-6, 6], 0.008, Math.min(0.08, dur * 0.4));
    const stab = (t, m, v = 1) => { for (const n of chordAt(t).slice(1)) saws(t, t + 0.22, hz(n + 12), 0.05 * v, 2600, mus, [-12, 0, 11], 0.004, 0.14, 700); };
    const pad = (t0, t1, notes, vol, cut = 900) => { for (const n of notes) saws(t0, t1, hz(n), vol, cut, mus, [-14, 0, 13], Math.min(1.2, (t1 - t0) * 0.3), Math.min(1.0, (t1 - t0) * 0.3)); };
    const braam = (t, dur, v = 1, root = 26) => { for (const [m, k] of [[root, 1], [root + 7, 0.7], [root + 12, 0.8]]) saws(t, t + dur, hz(m), 0.2 * v * k, 180, mus, [-18, -6, 7, 19], 0.06, dur * 0.6, 1400); sub(t, 70, 36, 0.8 * v, dur * 0.6, mus); };
    const pluck = (t, m, v = 1) => { const o = osc('triangle', hz(m), t, t + 0.4), g = env(t, 0.003, 0.07 * v, 0.22); o.connect(g); g.connect(mus); };
    const riser = (t0, t1, vol = 0.18) => { const n = S.noise('white', t0, t1 + 0.05), b = S.filter('bandpass', 300, 2.5), g = ctx.createGain(); b.frequency.setValueAtTime(300, t0); b.frequency.exponentialRampToValueAtTime(7000, t1);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t1 - 0.02); g.gain.linearRampToValueAtTime(0, t1); n.connect(b); b.connect(g); g.connect(mus);
      const o = osc('sawtooth', 110, t0, t1), og = ctx.createGain(), ol = S.filter('lowpass', 1200, 1); o.frequency.exponentialRampToValueAtTime(440, t1); og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(vol * 0.3, t1 - 0.02); og.gain.linearRampToValueAtTime(0, t1); o.connect(ol); ol.connect(og); og.connect(mus); };
    const roll = (t0, t1) => { for (let t = t0; t < t1; t += MathX.lerp(0.125, 0.0625, (t - t0) / (t1 - t0))) snare(t, 0.3 + 0.6 * (t - t0) / (t1 - t0)); };

    // grooves, beat by beat: pulse | drive | half | fast | taiko | aura
    const groove = (t0, t1, style, v = 1) => {
      for (let t = Math.ceil(t0 * 4 - 1e-6) / 4; t < t1 - 1e-6; t += 0.25) {
        const b = Math.round(t * 4) % 16, beat = b / 2;         // 16 sixteenths per bar (2 s); beat 0..7.5 in eighths
        const on = (n) => b === n;
        if (style === 'pulse') { if (on(0) || on(8)) kick(t, 0.6 * v); if (b % 2 === 0) pluck(t, chordAt(t)[1 + (b / 2) % 3] + 12, 0.8 * v); if (on(0)) bass(t, 1.9, chordAt(t)[0], 0.7 * v); }
        if (style === 'drive') { if (b % 4 === 0) kick(t, v); if (on(4) || on(12)) snare(t, v); if (b % 2 === 0) hat(t, 0.8 * v, on(14)); if (b % 2 === 0) bass(t, 0.22, chordAt(t)[0], v); if (on(0) || on(6) || on(10)) stab(t, 0, v); }
        if (style === 'half') { if (on(0) || on(10)) kick(t, v); if (on(8)) snare(t, v); if (b % 2 === 0) hat(t, 0.6 * v); if (on(0)) bass(t, 1.9, chordAt(t)[0], 0.9 * v); }
        if (style === 'fast') { if (on(0) || on(6) || on(8) || on(11)) kick(t, v); if (on(4) || on(12)) snare(t, v); hat(t, (b % 2 ? 0.45 : 0.8) * v); if (b % 2 === 0) bass(t, 0.12, chordAt(t)[0] + (b % 4 ? 12 : 0), v); }
        if (style === 'taiko') { if (on(0) || on(8)) taiko(t, v); if (on(6) || on(14)) taiko(t, 0.55 * v); if (on(4) || on(12)) snare(t, 0.7 * v); if (b % 4 === 0) bass(t, 0.45, chordAt(t)[0], v); if (on(0)) stab(t, 0, v); }
        if (style === 'aura') { if (on(0)) { kick(t, v); taiko(t, 0.6 * v); } if (on(8)) snare(t, v); if (on(0)) bass(t, 1.9, chordAt(t)[0], v); }
        void beat;
      }
    };

    /* ---------------- sound effects ---------------- */
    // Killua: a dry crack (a click of white noise, a fast falling zap, a short high ring) — never any bass
    const crack = (t, v = 1, pan = 0) => {
      noiseHit(t, 0.05, 'highpass', 2500, 0.7, 0.5 * v, kfx, 'white', pan, 0.001);
      const o = osc('square', 5200, t, t + 0.12); o.frequency.exponentialRampToValueAtTime(700, t + 0.07); const hp = S.filter('highpass', 600, 0.7), g = env(t, 0.001, 0.12 * v, 0.07); o.connect(hp); hp.connect(g); g.connect(S.panned(kfx, pan));
      for (let i = 0; i < 4; i++) noiseHit(t + 0.012 + i * 0.017 + S.rng.range(0, 0.01), 0.012, 'highpass', 3500, 0.7, 0.18 * v, kfx, 'white', pan + S.rng.range(-0.2, 0.2), 0.001);
    };
    const zip = (t, dur, v = 1, p0 = -0.8, p1 = 0.8) => { const n = S.noise('white', t, t + dur + 0.05), b = S.filter('bandpass', 900, 3), g = env(t, dur * 0.4, 0.3 * v, dur * 0.6), p = ctx.createStereoPanner();
      b.frequency.setValueAtTime(900, t); b.frequency.exponentialRampToValueAtTime(6500, t + dur); p.pan.setValueAtTime(p0, t); p.pan.linearRampToValueAtTime(p1, t + dur); n.connect(b); b.connect(g); g.connect(p); p.connect(kfx); };
    const crackle = (t0, t1, v = 1) => { const src = ctx.createBufferSource(); src.buffer = S.crackleBuffer(Math.min(6, t1 - t0 + 0.1), 70); src.start(t0); src.stop(t1); const hp = S.filter('highpass', 2200, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.16 * v, t0 + 0.05); g.gain.setValueAtTime(0.16 * v, t1 - 0.08); g.gain.linearRampToValueAtTime(0, t1); src.connect(hp); hp.connect(g); g.connect(kfx); };
    // Eren / the titan: weight
    const step = (t, v = 1) => { sub(t, 70, 30, 0.9 * v, 0.6, efx); noiseHit(t, 0.5, 'lowpass', 300, 0.7, 0.5 * v, efx, 'brown'); noiseHit(t + 0.06, 0.6, 'bandpass', 1500, 0.6, 0.06 * v, efx, 'pink'); };
    const steam = (t0, t1, v = 1) => { const n = S.noise('pink', t0, t1), b = S.filter('highpass', 2500, 0.6), g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.1 * v, t0 + Math.min(1.5, (t1 - t0) * 0.3)); g.gain.setValueAtTime(0.1 * v, t1 - Math.min(1.5, (t1 - t0) * 0.3)); g.gain.linearRampToValueAtTime(0, t1); n.connect(b); b.connect(g); g.connect(efx); };
    const roar = (t, dur, v = 1) => {
      const g = ctx.createGain(), sh = ctx.createWaveShaper(), curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(x * 3); } sh.curve = curve;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32 * v, t + 0.18); g.gain.setValueAtTime(0.32 * v, t + dur * 0.6); g.gain.linearRampToValueAtTime(0, t + dur);
      for (const [f, d] of [[92, 0], [97, 12], [139, -8], [46, 0]]) { const o = osc('sawtooth', f, t, t + dur + 0.05); o.detune.value = d; o.frequency.setValueAtTime(f * 0.8, t); o.frequency.linearRampToValueAtTime(f, t + 0.25); o.frequency.linearRampToValueAtTime(f * 0.78, t + dur);
        const vib = osc('sine', 7 + S.rng.range(0, 3), t, t + dur), vg = ctx.createGain(); vg.gain.value = f * 0.04; vib.connect(vg); vg.connect(o.frequency); o.connect(sh); }
      const n = S.noise('pink', t, t + dur), f1 = S.filter('bandpass', 700, 2), f2 = S.filter('bandpass', 1300, 3); f1.frequency.setValueAtTime(500, t); f1.frequency.linearRampToValueAtTime(800, t + 0.3); f1.frequency.linearRampToValueAtTime(520, t + dur);
      n.connect(f1); n.connect(f2); const ng = ctx.createGain(); ng.gain.value = 1.4; f1.connect(ng); f2.connect(ng); ng.connect(sh);
      const lp = S.filter('lowpass', 2600, 0.8); sh.connect(lp); lp.connect(g); g.connect(efx); sub(t, 60, 40, 0.5 * v, dur * 0.7, efx);
    };
    const thunder = (t, v = 1) => { noiseHit(t, 0.12, 'highpass', 900, 0.6, 0.9 * v, efx, 'white', 0, 0.001); sub(t, 90, 26, 1.0 * v, 2.6, efx); noiseHit(t, 3.0, 'lowpass', 500, 0.6, 0.8 * v, efx, 'brown', 0, 0.004, 90);
      for (let i = 0; i < 5; i++) noiseHit(t + 0.15 + i * 0.32 + S.rng.range(0, 0.15), 0.8, 'lowpass', 300, 0.7, 0.4 * v * (1 - i * 0.15), efx, 'brown', S.rng.range(-0.5, 0.5)); };
    const metal = (t, v = 1, dur = 0.9) => { for (const f of [187, 293, 421, 612, 877, 1310]) { const o = osc('triangle', f * S.rng.range(0.97, 1.03), t, t + dur + 0.1), g = env(t, 0.003, 0.05 * v, dur * S.rng.range(0.5, 1)); o.frequency.linearRampToValueAtTime(f * 0.94, t + dur); o.connect(g); g.connect(efx); }
      noiseHit(t, 0.4, 'bandpass', 1800, 1.2, 0.3 * v, efx, 'white'); };
    const groan = (t0, t1, v = 1) => { for (const f of [62, 93, 131]) { const o = osc('sawtooth', f, t0, t1), lp = S.filter('lowpass', 500, 4), g = ctx.createGain(); o.frequency.linearRampToValueAtTime(f * 0.85, t1); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.06 * v, t0 + 0.2); g.gain.linearRampToValueAtTime(0, t1); o.connect(lp); lp.connect(g); g.connect(efx); } };
    const glass = (t, n = 14, v = 1) => { for (let i = 0; i < n; i++) { const tt = t + S.rng.range(0, 0.6), o = osc('sine', S.rng.range(2800, 7600), tt, tt + 0.3), g = env(tt, 0.001, 0.04 * v, S.rng.range(0.05, 0.22)); o.connect(g); g.connect(S.panned(efx, S.rng.range(-0.8, 0.8))); } noiseHit(t, 0.3, 'highpass', 4000, 0.7, 0.15 * v, efx); };
    // war
    const rifle = (t, v = 1, pan = 0) => { noiseHit(t, 0.06, 'highpass', 1200, 0.6, 0.8 * v, war, 'white', pan, 0.001); sub(t, 140, 60, 0.4 * v, 0.2, war); noiseHit(t + 0.03, 1.0, 'lowpass', 1400, 0.7, 0.14 * v, war, 'pink', pan, 0.01); };
    const cannon = (t, v = 1, pan = 0) => { noiseHit(t, 0.12, 'highpass', 600, 0.6, 0.9 * v, war, 'white', pan, 0.001); sub(t, 110, 32, 1.0 * v, 1.2, war); noiseHit(t, 1.6, 'lowpass', 700, 0.6, 0.6 * v, war, 'brown', pan, 0.004, 120); noiseHit(t + 0.4, 1.2, 'lowpass', 400, 0.6, 0.15 * v, war, 'brown', -pan); };
    const blast = (t, v = 1, pan = 0) => { sub(t, 85, 28, 1.0 * v, 1.6, war); noiseHit(t, 1.8, 'lowpass', 1400, 0.6, 0.85 * v, war, 'brown', pan, 0.004, 110); noiseHit(t, 0.25, 'bandpass', 2500, 0.8, 0.3 * v, war, 'white', pan);
      const src = ctx.createBufferSource(); src.buffer = S.crackleBuffer(1.5, 40); src.start(t + 0.1); const cg = env(t + 0.1, 0.01, 0.2 * v, 1.2), cl = S.filter('bandpass', 1500, 0.6); src.connect(cl); cl.connect(cg); cg.connect(war); };
    const engine = (t0, t1, v = 1, die = null) => { const o = osc('sawtooth', 32, t0, t1), o2 = osc('square', 48, t0, t1), lp = S.filter('lowpass', 220, 2), g = ctx.createGain(), am = osc('sine', 9, t0, t1), ag = ctx.createGain();
      ag.gain.value = 0.035 * v; am.connect(ag); ag.connect(g.gain); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.09 * v, t0 + 0.4); g.gain.setValueAtTime(0.09 * v, t1 - 0.3); g.gain.linearRampToValueAtTime(0, t1);
      if (die) { o.frequency.setValueAtTime(32, die); o.frequency.exponentialRampToValueAtTime(12, die + 0.8); o2.frequency.setValueAtTime(48, die); o2.frequency.exponentialRampToValueAtTime(15, die + 0.8); }
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(war); };
    const mg = (t0, t1, v = 1, pan = 0) => { for (let t = t0; t < t1; t += 1 / 13) { noiseHit(t, 0.05, 'highpass', 900, 0.6, 0.5 * v, war, 'white', pan, 0.001); sub(t, 120, 70, 0.25 * v, 0.08, war); } };
    const clank = (t, v = 1) => { for (const f of [520, 830, 1240]) { const o = osc('square', f, t, t + 0.15), g = env(t, 0.001, 0.04 * v, 0.08); o.connect(g); g.connect(war); } noiseHit(t, 0.06, 'bandpass', 2400, 1, 0.2 * v, war); };
    const shout = (t, words, v = 1, pan = -0.2) => { let tt = t; for (const [d, vow, f] of words) { S.voice(tt, f, d, vow, 0.22 * v, pan, war, 0.85); tt += d + 0.03; } };
    const radio = (t0, t1) => { const g = ctx.createGain(), b = S.filter('bandpass', 1500, 1.6); g.gain.value = 1; b.connect(g); g.connect(war); S.chatter(t0, t1, 0.18, 0.3, b, 170, 5); noiseHit(t0, t1 - t0, 'bandpass', 2500, 0.6, 0.04, war, 'white', 0.3, 0.02); clank(t0 - 0.05, 0.4); clank(t1, 0.4); };
    const whoosh = (t, dur, v = 1, f0 = 300, f1 = 2400) => noiseHit(t, dur, 'bandpass', f0, 1.5, 0.3 * v, efx, 'pink', 0, dur * 0.5, f1);
    const heart = (t, v = 1) => { sub(t, 60, 40, 0.5 * v, 0.18, amb); sub(t + 0.17, 55, 38, 0.35 * v, 0.2, amb); };
    const ring = (t0, t1, v = 1) => { const o = osc('sine', 6100, t0, t1), g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.02 * v, t0 + 0.2); g.gain.linearRampToValueAtTime(0, t1); o.connect(g); g.connect(amb); };

    /* ---------------- the score and the sound, in order ---------------- */
    // ambience under everything: wind, far guns, crackling fires (gone in the silences, back after)
    const ambG = ctx.createGain(); ambG.connect(amb);
    lin(ambG.gain, [[0, 0], [0.4, 1], [4.5, 1], [4.55, 0.15], [5.0, 0.15], [5.1, 1], [10.9, 0.6], [12.0, 1], [62.2, 0.3], [63.0, 1], [71.6, 1], [71.7, 0]]);
    { const w = S.noise('brown', 0, END), lp = S.filter('lowpass', 380, 0.6), g = ctx.createGain(); g.gain.value = 0.35; w.connect(lp); lp.connect(g); g.connect(ambG);
      const f = ctx.createBufferSource(); f.buffer = S.crackleBuffer(6, 9); f.loop = true; f.start(0); f.stop(END); const fl = S.filter('bandpass', 1400, 0.6), fg = ctx.createGain(); fg.gain.value = 0.05; f.connect(fl); fl.connect(fg); fg.connect(ambG); }
    for (const t of [1.6, 4.1, 7.3, 26.0, 39.0, 44.8, 53.4, 63.6, 69.0]) S.farBoom(t, 0.35, S.rng.range(-0.7, 0.7), ambG);

    // 0–4.5 the battle: a drone and a taiko under the question; far guns, machine guns, shouts, the squad's tank
    pad(0.2, 4.6, [26, 33, 38], 0.05, 500); taiko(0.3, 0.9); whoosh(0.0, 0.6, 0.6, 200, 1600); taiko(2.4, 0.6); taiko(3.9, 0.5); engine(0, 9.2, 0.8);
    for (const [t, pan] of [[1.15, -0.6], [2.3, 0.5], [3.35, -0.8], [4.1, 0.7], [7.0, -0.6], [9.0, 0.6]]) blast(t, 0.45, pan);
    mg(0.6, 1.4, 0.18, 0.6); mg(2.0, 2.6, 0.15, -0.5); mg(3.0, 3.9, 0.16, 0.4); for (const t of [0.9, 1.7, 2.8, 3.1, 3.7, 4.2]) rifle(t, 0.22, S.rng.range(-0.8, 0.8));
    shout(1.0, [[0.25, 'a', 200], [0.3, 'o', 185]], 0.5, 0.5); shout(3.2, [[0.4, 'a', 220]], 0.45, -0.4);
    // 4.55–5 everything drops out; 5.0 two strikes in the road (one cold, one warm); the smoke parts on two figures
    ring(4.55, 5.0, 0.8); crack(D.arrive, 1.3, 0.25); thunder(D.arrive, 0.6); whoosh(D.arrive + 0.05, 0.9, 0.9, 300, 1200);
    // 5–11 the reaction: a tense pulse; the officer's orders; rifles come up
    groove(5.2, 10.9, 'pulse'); pad(5.2, 10.9, [38, 45, 50], 0.035, 700); riser(9.0, 10.95, 0.16);
    shout(D.halt - 0.15, [[0.32, 'a', 190]]); shout(D.order, [[0.18, 'i', 210], [0.3, 'a', 200]]);
    for (let i = 0; i < 6; i++) clank(D.aim + 0.03 + i * 0.07, 0.5);
    crackle(D.spark, D.spark + 0.8, 0.9); crack(D.spark + 0.05, 0.35, 0.2);
    // SILENCE (11–12): the wind, a breath, the safety comes off
    S.breath(11.3, 0.5, true, 0.05, amb); clank(11.72, 0.35);
    // 12.0 THE DROP: the shot, a muzzle flash, he is gone
    rifle(D.shot, 1.2); sub(D.shot, 90, 30, 0.9, 1.2, mus); kick(D.shot, 1.2); crash(D.shot, 0.8); crack(D.shot + 0.02, 1.0, 0.3);
    // slow motion: a stretched bullet passes through empty air; the residue crackles
    { const t = 12.2, n = S.noise('pink', t, t + 0.6), b = S.filter('bandpass', 900, 4), g = env(t, 0.25, 0.25, 0.35), p = ctx.createStereoPanner(); b.frequency.setValueAtTime(1200, t); b.frequency.exponentialRampToValueAtTime(380, t + 0.5); p.pan.setValueAtTime(-0.6, t); p.pan.linearRampToValueAtTime(0.7, t + 0.5); n.connect(b); b.connect(g); g.connect(p); p.connect(kfx); }
    sub(12.12, 55, 28, 0.6, 0.7, efx); crackle(12.12, 12.75, 0.7);
    // the whip, the groove, the crack on the tank
    whoosh(12.72, 0.32, 0.9, 400, 4000); groove(12.75, 15.0, 'drive');
    for (const [k, t] of D.drop.entries()) { crack(t, 0.9, -0.4 + k * 0.4); noiseHit(t + 0.25, 0.2, 'lowpass', 400, 0.7, 0.3, war, 'brown'); }
    crack(D.onTank - 0.05, 1.2, -0.2); crackle(D.onTank, D.cut[0], 0.8);
    // the black cut: nothing — one snap of blue light — then the tank is dead
    crack(D.cut[0] + 0.06, 1.1, 0); metal(D.dead, 0.9, 1.4); sub(D.dead, 60, 30, 0.7, 1.2, efx); engine(9.2, D.dead, 0.6, D.cut[0] - 0.3);
    groove(D.dead, 19.2, 'half'); crackle(D.dead + 0.1, D.gone, 0.4); crack(D.gone, 1.0, 0.4); zip(D.gone, 0.2, 0.7, 0, 0.9);
    // 19.4 the bite; SILENCE; a heartbeat
    noiseHit(D.bite, 0.08, 'bandpass', 900, 1.0, 0.25, efx, 'white'); S.breath(D.bite - 0.45, 0.35, true, 0.06, amb);
    heart(19.75, 0.9); heart(20.3, 1.0); ring(19.6, 20.72, 1);
    // 20.7 THE BOLT: thunder, a white-out; the ring of dust, windows, soldiers thrown, steam
    thunder(D.bolt, 1.3); sub(D.bolt, 60, 24, 1.0, 2.4, mus); crash(D.bolt, 1.0);
    whoosh(D.ring, 1.2, 1.2, 150, 900); glass(D.ring + 0.1, 18, 1); for (const t of [21.1, 21.25, 21.4]) noiseHit(t, 0.2, 'lowpass', 400, 0.7, 0.35, war, 'brown');
    steam(21.0, 25.5, 1.4); steam(24.3, END, 0.4);
    // the rise: a brass swell under the steam, the camera climbs
    pad(21.5, 24.3, [26, 33, 38, 45], 0.06, 400); { const o = osc('sawtooth', hz(38), 21.5, 24.3), lp = S.filter('lowpass', 300, 2), g = ctx.createGain(), tr = osc('sine', 11, 21.5, 24.3), tg = ctx.createGain(); tg.gain.value = 0.04; tr.connect(tg); tg.connect(g.gain);
      lp.frequency.setValueAtTime(300, 21.5); lp.frequency.exponentialRampToValueAtTime(3000, 24.25); g.gain.setValueAtTime(0, 21.5); g.gain.linearRampToValueAtTime(0.08, 24.25); g.gain.linearRampToValueAtTime(0, 24.3); o.connect(lp); lp.connect(g); g.connect(mus); }
    riser(22.6, 24.28, 0.22); step(22.0, 0.5); step(23.1, 0.7);
    // 24.3 THE REVEAL: BRAAAM; 25.5 the roar
    braam(D.reveal, 2.6, 1.3); taiko(D.reveal, 1.2); crash(D.reveal, 1.0); step(D.reveal, 1.0);
    groove(D.reveal + 0.5, 27.0, 'taiko', 0.8); roar(D.roar, 1.9, 1.1);
    // 27–41 intercut: one drive under it all — taiko and metal on Eren's shots, fast hats and dry cracks on Killua's
    const parts = [[27.0, 28.4, 'E'], [28.4, 29.8, 'K'], [29.8, 31.9, 'E'], [31.9, 32.9, 'K'], [32.9, 33.7, 'E'], [33.7, 34.6, 'K'], [34.6, 35.4, 'R'], [35.4, 37.0, 'K'], [37.0, 38.4, 'E'], [38.4, 41.0, 'K']];
    for (const [a, b, who] of parts) groove(a, b, who === 'E' ? 'taiko' : who === 'K' ? 'fast' : 'pulse', who === 'R' ? 0.6 : 1);
    engine(26.6, 32.6, 0.8, D.stop); engine(30.6, 34.0, 0.6);
    for (let t = 26.2; t < 29.8; t += 0.95) step(t, 0.6);
    cannon(D.fire1, 1.0, -0.3); blast(D.fire1 + 0.25, 0.9, 0.1); cannon(D.fire2, 1.0, 0.3); blast(D.fire2 + 0.25, 0.9, -0.1);
    crack(D.touch, 1.1, -0.3); crackle(D.touch, D.touch + 0.6, 1.2);
    groan(D.grab, D.throw + 0.1, 1.0); metal(D.grab + 0.45, 0.7, 1.0); whoosh(D.throw, 0.9, 1.3, 120, 700); metal(D.throw + 0.9, 1.2, 1.2); blast(D.throw + 0.9, 1.1, -0.4); crash(D.throw + 0.9, 0.6);
    crack(D.leap, 1.0, 0.2); zip(D.leap, 0.18, 0.8, -0.3, 0.5);
    step(D.stomp - 0.55, 0.6); metal(D.stomp, 1.3, 1.5); blast(D.stomp, 1.0); sub(D.stomp, 80, 25, 1.0, 1.4, efx); kick(D.stomp, 1.2);
    cannon(D.fire3, 1.0, 0.2); blast(D.fire3 + 0.25, 0.7, -0.2); crack(D.behind, 1.2, -0.1);
    pad(D.stare - 0.2, D.stare + 0.6, [62, 69], 0.03, 2400); heart(D.stare, 0.7);
    mg(D.mg - 0.1, D.mg + 0.5, 0.8, -0.4); crack(D.mg + 0.35, 1.1, 0.1); crack(D.mg + 0.95, 0.8, -0.2); clank(D.lower, 0.6);
    step(D.crush - 0.55, 0.7); blast(D.crush, 1.1); sub(D.crush, 75, 24, 1.0, 1.3, efx); noiseHit(D.crush + 0.05, 1.2, 'lowpass', 900, 0.6, 0.5, efx, 'brown');
    zip(D.trench, 0.5, 1.2, -0.9, 0.9); for (let i = 0; i < 6; i++) crack(D.trench + i * 0.075, 0.6, -0.8 + i * 0.32); step(39.6, 0.6); step(40.5, 0.6); riser(39.6, 40.98, 0.14);
    // 41–46 the montage: a hit on every cut
    groove(41.0, 46.4, 'drive', 1.05); crash(41.0, 0.8); step(41.0, 1.0); blast(41.5, 0.6);
    crack(42.0, 1.1, 0.3); kick(42.0, 1); blast(43.4, 1.2, 0.3); metal(43.4, 0.8); crash(43.0, 0.5);
    crack(44.2, 1.0, -0.3); noiseHit(44.5, 1.4, 'lowpass', 600, 0.6, 0.6, war, 'brown'); roar(45.2, 1.2, 0.95); crash(45.2, 0.6);
    // the aura walk: half-time, a held choir-like chord; the blast behind him
    groove(46.4, 49.0, 'aura'); pad(46.4, 49.0, [50, 57, 62, 69], 0.045, 1600); crackle(46.4, 49.0, 0.5);
    for (let t = 46.6; t < 49; t += 0.5) noiseHit(t, 0.05, 'lowpass', 900, 0.7, 0.05, kfx, 'pink');
    blast(D.auraBlast, 1.4, -0.2); metal(D.auraBlast + 0.05, 0.8); crash(D.auraBlast, 0.8); step(D.auraBlast - 0.5, 0.8);
    // 49–57 the army adapts: radio, the battery loads, the barrage — not enough
    groove(49.0, 51.0, 'pulse', 0.8); radio(D.radio, D.radio + 1.3); for (let i = 0; i < 4; i++) clank(D.battery + i * 0.12, 0.8); shout(D.barrage - 0.45, [[0.28, 'a', 180]], 1, 0.3);
    for (let i = 0; i < 4; i++) cannon(D.barrage + i * 0.15, 1.1, -0.5 + i * 0.33);
    for (const k of [0.5, 0.7, 0.9, 1.1, 1.3, 1.6, 1.9]) blast(D.barrage + k, 0.7, S.rng.range(-0.5, 0.5));
    groove(51.0, 52.5, 'taiko'); groove(52.5, 54.0, 'fast', 0.9); for (let i = 0; i < 5; i++) { crack(D.cross + i * 0.3, 0.7, -0.8 + i * 0.4); zip(D.cross + i * 0.3, 0.14, 0.5, -0.8 + i * 0.4, -0.4 + i * 0.4); }
    // the size shot: the held chord, no drums; the giant's steps
    pad(D.size, D.silent, [26, 38, 45, 50, 57], 0.05, 1200); step(54.6, 0.7); step(55.8, 0.7); riser(55.4, 56.98, 0.12);
    // 57 the guns go silent, one by one
    for (let i = 0; i < 4; i++) { crack(D.silent + i * 0.4, 1.0, -0.6 + i * 0.4); sub(D.silent + i * 0.4, 50, 30, 0.2, 0.3, war); }
    pad(57.0, 58.6, [26, 33], 0.04, 400);
    // 58.6 the last push; the break; smoke
    groove(58.6, 59.6, 'drive'); roll(59.6, 60.58); riser(59.0, 60.58, 0.2); engine(55.0, 60.6, 0.8);
    cannon(D.push, 1.0, -0.2); blast(D.push + 0.3, 0.8); cannon(D.push + 0.6, 1.0, 0.25); blast(D.push + 0.9, 0.8);
    braam(D.break, 2.4, 1.2); blast(D.break, 1.4, 0.2); metal(D.break, 1.3, 1.6); blast(D.break + 0.25, 1.0, -0.3); crash(D.break, 1.0); kick(D.break, 1.3); sub(D.break, 70, 22, 1.0, 2.2, efx);
    noiseHit(D.smoke, 2.2, 'lowpass', 500, 0.6, 0.6, efx, 'brown', 0, 0.3, 120);
    // SILENCE (62.2–63): a ring, debris settling
    ring(62.2, 63.1, 1.2); for (let i = 0; i < 6; i++) { const t = 62.25 + S.rng.range(0, 0.7); noiseHit(t, 0.04, 'bandpass', S.rng.range(1500, 4000), 2, 0.05, amb, 'white', S.rng.range(-0.6, 0.6)); }
    // 63 the retreat: a quiet theme; running feet; one trips
    pad(63.0, 65.0, [38, 45, 50, 52, 57], 0.035, 900); for (let i = 0; i < 4; i++) pluck(63.0 + i * 0.5, [62, 65, 69, 67][i], 0.8);
    for (let t = 63.1; t < 66; t += 0.16) S.step(t, 0.06 * S.rng.range(0.6, 1), S.rng.range(-0.6, 0.6), war);
    noiseHit(63.75, 0.25, 'lowpass', 500, 0.7, 0.3, war, 'brown'); shout(63.3, [[0.25, 'a', 230], [0.2, 'o', 220]], 0.7, 0.4);
    // 65 the final: the theme rises, the giant rises, the roar, the last hit
    pad(65.0, 68.2, [26, 38, 45, 50, 53, 57], 0.05, 700); groove(65.0, 68.2, 'aura', 0.9);
    for (let i = 0; i < 6; i++) pluck(65.0 + i * 0.5, [62, 65, 69, 74, 72, 69][i], 1.0);
    riser(66.4, 67.58, 0.16); step(66.0, 0.9); step(D.titanUp, 1.1);
    roar(D.titanUp + 0.6, 2.2, 1.25); crash(D.titanUp + 0.6, 0.7);
    braam(D.caption, 3.4, 1.3); taiko(D.caption, 1.3); kick(D.caption, 1.2); crash(D.caption, 1.1); pad(D.caption, 71.6, [26, 38, 45, 50, 57, 62], 0.05, 1400);
    thunder(D.black + 0.02, 0.35);
  }
}
