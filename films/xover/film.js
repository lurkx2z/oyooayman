/* =====================================================================
   FILM — "Killua × Eren in WWII"
   Builds the battlefield and the action; drives the camera from the shot
   list (handheld, impact shakes, whip-pan smear); fires the muzzle
   flashes, the bullet, the tank shells, the windows that burst, the
   warm and cold light flashes; the title and the last line; the grade
   (white-out at the bolt, the black cut, the final black).
   ===================================================================== */

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app; FILM._app = app;
    camera.near = 0.05; camera.far = 2400; camera.updateProjectionMatrix();
    app.world = new XWorld(scene, renderer); app.world.build();
    app.act = new XAction(app);
    Look.apply(scene, camera);
    // muzzle flashes (rifle, tanks, guns) and the bullet / shells as ribbons
    this.fireEv = [[W(XB.shot), 'A0', 0.6], [W(XB.fire1), 'T2', 3], [W(XB.fire2), 'T3', 3], [W(XB.fire3), 'T7', 3], [W(XB.push), 'T8', 3], [W(XB.push + 0.6), 'T9', 3],
      ...[0, 1, 2, 3].map((i) => [W(XB.barrage + i * 0.15), 'G' + i, 3.5])];
    this.mflash = new XBill(scene, { n: this.fireEv.length, seed: 41, kind: 'flash', color: '#ffd59a', additive: true, alpha: 1, fadeIn: 0.01, fadeOut: 0.3,
      spawn: (i) => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), t0: this.fireEv[i][0], life: i === 0 ? 0.13 : 0.12, s0: this.fireEv[i][2], s1: this.fireEv[i][2] * 1.6, rot: i }) });
    this.trail = new XRibbon(scene, 200, '#ffe2b0');
    // glass shards for the windows that burst in the transformation
    const near = app.world.windows.filter((p) => Math.hypot(p.position.x + 2, p.position.z + 23) < 30); this.burst = near;
    const glass = new THREE.MeshStandardMaterial({ color: '#c8d4da', roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.8 });
    this.shards = new XDebris(scene, near.length * 10, glass, 61, (i, r) => { const p = near[Math.floor(i / 10)].position, dir = new THREE.Vector3(p.x + 2, 0, p.z + 23).normalize();
      return { p: p.clone().add(new THREE.Vector3(r.range(-0.5, 0.5), r.range(-0.4, 0.4), r.range(-0.5, 0.5))), v: dir.multiplyScalar(r.range(4, 9)).add(new THREE.Vector3(0, r.range(1, 4), 0)), t0: W(XB.ring) + Math.hypot(p.x + 2, p.z + 23) / 40, size: r.range(0.08, 0.2), flat: 0.05, spin: new THREE.Vector3(r.range(-9, 9), r.range(-9, 9), r.range(-9, 9)) }; });
    // concrete and wall chunks (the bunker, the falling wall, the break)
    const rubble = (n, seed, c, tf, rad) => new XDebris(scene, n, app.world.mConcrete, seed, (i, r) => ({ p: new THREE.Vector3(c[0] + r.range(-rad, rad), c[1] + r.range(0, 2.5), c[2] + r.range(-rad, rad)), v: new THREE.Vector3(r.range(-3.5, 3.5), r.range(3, 10), r.range(-3.5, 3.5)), t0: W(tf), size: r.range(0.3, 1.1), spin: new THREE.Vector3(r.range(-4, 4), r.range(-4, 4), r.range(-4, 4)) }));
    this.rubble = [rubble(26, 71, [16, 1, -84], 43.4, 3.5), rubble(18, 73, [-8.5, 3, 0], 44.5, 3), rubble(22, 79, [-8, 0.5, -100], XB.break, 2.5), rubble(16, 83, [5, 0.4, -60], XB.stomp, 2), rubble(14, 89, [6, 0.3, -66], 41.5, 2.5)];
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const hud = document.getElementById('hud'), mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    this.title = mk('xo-title', '<span class="a">WHAT IF KILLUA AND EREN</span><span class="b">SPAWNED IN</span><span class="c">WORLD WAR II?</span>');
    this.subs = XCAPS.map(([a, b, txt]) => [a, b, mk('xo-sub', txt)]);
    this.caption = mk('xo-cap', 'NO ARMY ON EARTH<br>COULD STOP THIS.');
    // tracer fire across the field before they arrive (both ways), deterministic
    this.tracers = []; for (let i = 0; i < 70; i++) { const h = (k) => hash1(i * 13 + k), north = h(1) < 0.6, x0 = (h(2) - 0.5) * 80, z0 = north ? -82 + h(3) * 6 : 12 + h(3) * 10, x1 = x0 + (h(4) - 0.5) * 30, z1 = north ? 10 + h(5) * 20 : -70 - h(5) * 15;
      this.tracers.push({ t0: 0.1 + i * 0.16 + h(6) * 0.12, dur: 0.45 + h(7) * 0.3, a: new THREE.Vector3(x0, 1.0 + h(8) * 1.5, z0), b: new THREE.Vector3(x1, 1.2 + h(9) * 3, z1) }); }
    app.audio = typeof XAudio !== 'undefined' ? new XAudio(app.tl, app) : new AudioEngine(app.tl);
    this._prev = new THREE.Vector3(); this._dir = new THREE.Vector3();
  },

  _camera(app, t) {
    const S = xShotAt(t), u = MathX.clamp((t - S.t[0]) / (S.t[1] - S.t[0]), 0, 1), cam = app.camera;
    const C = window.XO_CAM ? { p: new THREE.Vector3(...window.XO_CAM.p), l: new THREE.Vector3(...window.XO_CAM.l), fov: window.XO_CAM.fov || 40 } : S.cam(t, u, app.act);
    cam.position.copy(C.p);
    // handheld + impact shakes (film time, so slow motion keeps the hand alive but heavier)
    let sh = 0; for (const [a, k, d] of S.shake || []) if (t >= a) sh += k * Math.exp(-(t - a) / d);
    const hand = (S.hand || 0), D = MathX.deg;
    cam.position.x += noise1(t * 1.3, 3) * 0.04 * hand + noise1(t * 21, 4) * 0.05 * sh;
    cam.position.y += noise1(t * 1.1, 5) * 0.03 * hand + noise1(t * 23, 6) * 0.06 * sh;
    cam.position.y = Math.max(cam.position.y, xGround(cam.position.x, cam.position.z) + 0.25);   // never under the ground
    cam.lookAt(C.l);
    cam.rotateZ(D((C.roll || 0) + noise1(t * 0.9, 7) * 0.6 * hand + noise1(t * 19, 8) * 1.4 * sh));
    cam.rotateX(D(noise1(t * 1.4, 9) * 0.5 * hand + noise1(t * 25, 10) * 1.2 * sh)); cam.rotateY(D(noise1(t * 1.2, 11) * 0.5 * hand + noise1(t * 22, 12) * 1.2 * sh));
    if (Math.abs(cam.fov - C.fov) > 1e-3) { cam.fov = C.fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld(true);
    // the sun's shadows follow the shot
    const f = S.focus || [0, -40]; if (this._focus !== S) { app.world.focus(f[0], f[1], f[2] || 35); this._focus = S; }
    this.shot = S; this.shake = sh;
  },

  update(app, t) {
    const cam = app.camera, A = app.act, w = xW(t);
    // a camera that follows someone needs them where they are now: pose the action once, then aim, then pose again for the lens
    if (xShotAt(t).cam.length >= 3) { this._camera(app, t); A.update(t, cam); }
    this._camera(app, t);
    A.update(t, cam);
    // muzzle flashes and the bullet / shells
    this.fireEv.forEach(([w0, who], i) => {
      const o = this.mflash.P[i]; if (w < w0 - 0.01 || w > w0 + 0.3) return;
      if (who === 'A0') A.A[0].muzzle(o.p); else if (who[0] === 'G') { const g = app.world.guns[+who[1]]; g.brl.updateMatrixWorld(true); o.p.set(0, 0, 3.3).applyMatrix4(g.brl.matrixWorld); } else A.tanks[who].muzzle(o.p);
    });
    this.mflash.update(w);
    this.trail.begin(cam);
    // the bullet: slow enough to be seen crossing the empty spot in the slow motion
    { const w0 = W(XB.shot), u = w - w0; if (u > 0 && u < 0.4) { const a = A.A[0].muzzle(new THREE.Vector3()), b = new THREE.Vector3(0.9, 1.25, -22), d = b.clone().sub(a).normalize(), p = a.clone().addScaledVector(d, 75 * u); this.trail.seg(p.clone().addScaledVector(d, -1.6), p, 0.05, 1); } }
    // shells: tank fire toward the titan, the column's shot at Killua, the barrage
    for (const [w0, who] of this.fireEv) {
      if (who === 'A0') continue; const u = w - w0; if (u < 0 || u > 0.3) continue;
      const m = who[0] === 'G' ? this.mflash.P[this.fireEv.findIndex((e) => e[1] === who)].p.clone() : A.tanks[who].muzzle(new THREE.Vector3());
      const tgt = who === 'T7' ? new THREE.Vector3(0.6, 2.2, A.tankS.T6.z) : A.titan.j.spine.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.5, 0));
      const p = m.clone().lerp(tgt, Math.min(1, u / 0.25)), d = tgt.clone().sub(m).normalize(); if (who[0] === 'G') p.y += Math.sin(Math.min(1, u / 0.25) * Math.PI) * 18;
      this.trail.seg(p.clone().addScaledVector(d, -3), p, 0.12, 0.9);
    }
    for (const r of this.tracers) { const u = (w - r.t0) / r.dur; if (u < 0 || u > 1 || r.t0 > XB.hush0[0] - 0.4) continue; const p = r.a.clone().lerp(r.b, u), d = r.b.clone().sub(r.a).normalize(); this.trail.seg(p.clone().addScaledVector(d, -7), p, 0.22, 0.95); }
    this.trail.end();
    // a lens inside a head: that head is not drawn
    A.A[0].j.head.visible = !(this.shot && this.shot.noHead);
    // windows burst with the shockwave; shards fly; rubble
    for (const p of this.burst) p.visible = w < W(XB.ring) + Math.hypot(p.position.x + 2, p.position.z + 23) / 40;
    this.shards.update(w); for (const r of this.rubble) r.update(w);
    // light flashes: warm for explosions and the bolt, cold for Killua
    this._lights(app, w, t);
    this._overlays(t);
    if (window.XO_HIDE) for (const k of window.XO_HIDE) { const o = A[k] || this[k]; if (o) (o.mesh || o.root || o).visible = false; }
  },

  _lights(app, w, t) {
    const Wd = app.world, A = app.act;
    let best = 0, at = null;
    for (const b of A.booms) { const u = w - b.w; if (u < 0 || u > 0.8) continue; const k = Math.exp(-u / 0.2); if (k > best) { best = k; at = A.fire.P[A.booms.indexOf(b) * 6].p; } }
    { const u = w - W(XB.arrive); if (u > 0 && u < 0.4) { const k = Math.exp(-u / 0.08) * 1.2; if (k > best) { best = k; at = new THREE.Vector3(-0.9, 3, -22); } } }
    const bolt = w - W(XB.bolt); if (bolt > 0 && bolt < 0.6) { const k = Math.exp(-bolt / 0.1) * 2.5; if (k > best) { best = k; at = new THREE.Vector3(-2, 6, -23); } }
    // the end: a fire glow behind the titan rims him for the final frame
    if (t > XB.final - 0.5 && best < 0.25) { best = 0.25 * MathX.smooth(t, XB.final - 0.5, XB.final + 1.0); at = A.titan.root.position.clone().add(new THREE.Vector3(0, 9, 7)); }
    Wd.warm.intensity = 300 * Math.min(best, 0.45 + 0.55 * Math.min(1, (at ? at.distanceTo(app.camera.position) : 99) / 30)); if (at) Wd.warm.position.copy(at);
    // cold: Killua's cracks (a hard blue-white flash between him and the lens) and a faint flicker on him while he is seen
    let ck = 0, cp = null; const K = A.killua.p.root, kc = K.position.clone().add(new THREE.Vector3(0, 1.1, 0)), toCam = app.camera.position.clone().sub(kc).normalize();
    for (const ev of A.ev) { if (ev[1] !== 'zap') continue; const u = w - ev[0]; if (u < 0 || u > 0.3) continue; const k = Math.exp(-u / 0.06) * ev[5] * 14; if (k > ck) { ck = k; cp = kc.clone().addScaledVector(toCam, 2.0); } }
    if (K.visible && app.camera.position.distanceTo(kc) < 6) { const base = 1.3 * (0.6 + 0.4 * Math.sin(t * 40)); if (base > ck) { ck = base; cp = kc.clone().addScaledVector(toCam, 1.2); } }
    if (t > XB.final && K.visible) { ck = Math.max(ck, 7); cp = K.position.clone().add(new THREE.Vector3(-0.8, 2.0, 1.6)); }
    if (A.trenchAt) { ck = Math.max(ck, 40); cp = A.trenchAt.clone().add(new THREE.Vector3(0, 2, 2)); }
    Wd.cold.intensity = ck; if (cp) Wd.cold.position.copy(cp);
  },

  _overlays(t) {
    const W2 = StoryHUD.win, T = XB.title, set = (el, v) => { const s = v.toFixed(3); if (el._o !== s) { el.style.opacity = s; el._o = s; } };
    set(this.title, W2(t, T[0], T[1], 0.25, 0.35));
    for (const [a, b, el] of this.subs) set(el, W2(t, a, b, 0.15, 0.2));
    set(this.caption, W2(t, XB.caption, XB.black, 0.5, 0.15));
  },

  view(app) { return [app.scene, app.camera]; },

  grade(t, p) {
    const A = FILM._app && FILM._app.act, w = xW(t);
    p.time = t; p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.8; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.04; p.saturation = 0.86; p.contrast = 1.14; p.warmth = 0.03; p.blackLift = 0.012;
    p.vignette = 0.7; p.soft = 0.03; p.bloom = 0.3; p.bloomThreshold = 1.05; p.grain = 0.03;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    // slow motion reads a little heavier
    const slow = xSlow(t) < 1 ? 1 : 0; p.contrast += 0.04 * slow; p.vignette += 0.1 * slow;
    // the arrival: a pale flash
    if (t >= XB.arrive && t < XB.arrive + 0.5) { p.flash = Math.max(p.flash, 0.28 * Math.exp(-(t - XB.arrive) / 0.08)); p.flashColor.setRGB(0.95, 0.93, 1.0); }
    // the drop: the muzzle flash
    if (t >= XB.shot && t < XB.shot + 0.1) { p.flash = 0.35; p.flashColor.setRGB(1, 0.85, 0.6); }
    // the bolt: white-out, warm
    if (t >= XB.bolt && t < XB.bolt + 1.0) { const k = t < XB.bolt + 0.05 ? 0.95 : 0.95 * Math.exp(-(t - XB.bolt - 0.05) / 0.07); p.flash = Math.max(p.flash, k); p.flashColor.setRGB(1, 0.86, 0.66); }
    // the black cut on the tank: black, a blue-white crack across it
    if (t >= XB.cut[0] && t < XB.cut[1]) { p.fade = 1; if (t >= XB.cut[0] + 0.06 && t < XB.cut[0] + 0.13) { p.fade = 0; p.flash = 0.85; p.flashColor.setRGB(0.6, 0.85, 1.0); } }
    // whip pans smear
    if (FILM.shot && FILM.shot.whip) p.smear.set(0.018 * Math.sin(MathX.clamp((t - FILM.shot.t[0]) / 0.25, 0, 1) * Math.PI), 0);
    // dark shots lifted
    if (FILM.shot && FILM.shot.exp) p.exposure *= FILM.shot.exp;
    // impacts: a touch of fringing
    p.chroma += 0.04 * Math.min(1, FILM.shake || 0);
    // the hush before the end, the final black
    if (t >= XB.black) p.fade = 1;
    void A; void w;
  },

  anchor() { return null; },
  debug(app, t) { return `t ${t.toFixed(2)} · w ${xW(t).toFixed(2)} · shot ${XSHOTS.indexOf(xShotAt(t))}`; },
};
