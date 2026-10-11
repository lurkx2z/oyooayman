/* =====================================================================
   FILM — "What If Gravity Doubled?" (narrated film test, 16:9)
     build(app)   café + plaza + parked car, the cast, the drop experiment, the HUD (gauge, word-timed narration
                  subtitles, lane labels and timers, the car's ride-height tag), the sound
     update(app,t) shot camera, set, cast, experiment, rim light, shadows, fog, HUD
     grade(t, p)   warm sunrise grade per shot; DOF; the gravity hit; the end fade
   16:9: the shared SceneManager sizes the stage 9:16, so this film installs its own resize() on the app instance
   (film-side, no engine edit). Capture mode honours ?w=1920&h=1080.
   ===================================================================== */

function gbResize() {
  let sw, sh;
  if (CONFIG.captureMode) { sw = CONFIG.captureWidth; sh = CONFIG.captureHeight; }
  else {
    const W = window.innerWidth, H = window.innerHeight - (this.recording ? 0 : 118);
    sw = Math.min(W, H * 16 / 9); sh = sw * 9 / 16;
  }
  this.stage.style.width = sw + 'px'; this.stage.style.height = sh + 'px';
  document.documentElement.style.setProperty('--u', (sw / 1920) + 'px');
  let rw, rh;
  const res = CONFIG.render.resolution;
  if (CONFIG.captureMode) { rw = sw; rh = sh; }
  else if (res === 'auto') { const dpr = Math.min(window.devicePixelRatio || 1, 2); rw = Math.min(1920, Math.round(sw * dpr)); rh = Math.round(rw * 9 / 16); }
  else { const f = parseFloat(res) || 1; rw = Math.round(1920 * f); rh = Math.round(1080 * f); }
  if (!(this.post instanceof GbPost)) this.post = new GbPost(this.renderer);
  this.renderer.setPixelRatio(1);
  this.renderer.setSize(rw, rh, false);
  this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
  this.post.setSize(rw, rh);
  this.camera.aspect = rw / rh;
  this.camera.updateProjectionMatrix();
}

const FILM = {
  build(app) {
    FILM._app = app;
    app.resize = gbResize.bind(app);
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.scene.fog = new THREE.FogExp2('#6e5070', 0.012);
    app.camera.near = 0.02; app.camera.far = 900;
    app.cafe = new GbCafe(app.scene); app.cafe.build();
    app.cast = new GbCast(app, app.cafe);
    app.drop = new GbDrop(app.scene, (m) => app.cast._cup(m, m));
    const pm = new THREE.PMREMGenerator(app.renderer), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), gbSkyMaterial()));
    app.scene.environment = pm.fromScene(es, 0.04).texture;
    app.scene.background = new THREE.Color('#2a2d63');
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    this._hudExtras(app);
    app.audio = new GbAudio(app.tl, app);
  },

  _hudExtras(app) {
    const hud = document.getElementById('hud');
    // the gravity gauge (prototype design): top-left dial + big serif number + a small line
    const ticks = [];
    for (let i = 0; i <= 8; i++) {
      const g = 0.5 + i * 0.25, a = (-120 + (i / 8) * 240) * Math.PI / 180, r1 = 62, r2 = i % 2 ? 54 : 48;
      ticks.push(`<line x1="${75 + Math.sin(a) * r1}" y1="${75 - Math.cos(a) * r1}" x2="${75 + Math.sin(a) * r2}" y2="${75 - Math.cos(a) * r2}" stroke="#f1e6d6" stroke-width="${i % 2 ? 2 : 3.2}" opacity="${i % 2 ? 0.55 : 0.9}"/>`);
      if (!(i % 4)) ticks.push(`<text x="${75 + Math.sin(a) * 36}" y="${80 - Math.cos(a) * 36}" fill="#f1e6d6" font-size="13" font-family="Inter" text-anchor="middle" opacity="0.8">${g.toFixed(1)}</text>`);
    }
    const g = document.createElement('div'); g.className = 'gb-gauge';
    g.innerHTML = `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="68" fill="rgba(10,6,20,0.35)" stroke="#f1e6d6" stroke-opacity="0.5" stroke-width="2"/>
      <path class="arc" d="" fill="none" stroke="#ffb46b" stroke-width="7" stroke-linecap="round"/>${ticks.join('')}
      <line class="needle" x1="75" y1="75" x2="75" y2="22" stroke="#ffd9a8" stroke-width="4" stroke-linecap="round"/><circle cx="75" cy="75" r="7" fill="#ffd9a8"/></svg>
      <div><div class="lab">GRAVITY</div><div class="val"><span class="v">1.0</span><small>g</small></div><div class="sub"></div></div>`;
    hud.appendChild(g);
    app.gauge = { el: g, needle: g.querySelector('.needle'), arc: g.querySelector('.arc'), v: g.querySelector('.v'), sub: g.querySelector('.sub'), last: {} };
    // narration subtitles: one element per phrase, one span per word (word-timed from the real audio)
    app.subs = GN.phrases.map((P) => {
      const d = document.createElement('div'); d.className = 'gn-sub' + (P.title ? ' gn-title' : '');
      d.innerHTML = P.tokens.map((tk) => `<span>${tk.text}</span>`).join(' ');
      d.style.opacity = '0'; hud.appendChild(d);
      return { P, el: d, spans: [...d.querySelectorAll('span')], last: {} };
    });
    // experiment labels (projected) and the replay tag
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.lab = {
      l1: mk('gb-lane l', '<div class="g">1 g</div><div class="n">NORMAL GRAVITY</div><div class="p">≈ 0.45 s</div>'),
      l2: mk('gb-lane r', '<div class="g">2 g</div><div class="n">DOUBLE GRAVITY</div><div class="p">≈ 0.32 s</div>'),
      t1: mk('gb-timer l', '<span class="v">0.00</span><small> s</small>'),
      t2: mk('gb-timer r', '<span class="v">0.00</span><small> s</small>'),
      m1: mk('gb-tag', '1.00 m'),
      replay: mk('gb-replay', 'SLOW-MOTION REPLAY'),
      car1: mk('gb-tag', 'RIDE HEIGHT AT 1 g'),
      car2: mk('gb-tag', 'AT 2 g · <b>≈10 cm lower</b>'),
    };
  },

  update(app, t) {
    const shot = gbShotAt(t), cam = app.camera, C = app.cast;
    FILM._shot = shot;
    const outside = !!shot.outside, exp = !!shot.exp;
    app.cafe.setClear(exp);
    app.cafe.update(t, cam);
    C.carRef = shot.id === 'O2' ? MathX.window(t, GB.carCU + 0.5, GB.world + 0.1, 0.4, 0.3) : 0;
    C.update(t, { outside, exp });
    app.drop.update(t, exp);
    const ctx = { car: C.car };
    if (!outside && !exp) {
      ctx.cupP = C.cup.position.clone();
      const [tx, tz] = GB_SET.heroTable; ctx.cupRestP = new THREE.Vector3(tx - 0.22, GB_SET.tableH + 0.008, tz + 0.12);
      ctx.cupH = C.cupState(t, ctx.cupRestP).h;
      ctx.faceP = C.hero.worldOf('hc', new THREE.Vector3());
    }
    let S = shot.cam(t, ctx);
    // look-dev: FILM._dbgCam = [x,y,z, ax,ay,az, fov] overrides the shot camera (inspection only, via stills --eval)
    if (FILM._dbgCam) { const v = FILM._dbgCam; S = { pos: new THREE.Vector3(v[0], v[1], v[2]), at: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6] || 40, focus: 1, dof: 0 }; }
    gbApplyShot(cam, S);
    FILM._S = S;
    cam.updateMatrixWorld(true);
    GB_RIM.dir.value.copy(GB_SET.sunDir).add(new THREE.Vector3(0, 0.25, 0)).normalize().transformDirection(cam.matrixWorldInverse);
    GB_RIM.gain.value = shot.rim || 1;
    if (outside) GB_RIM.color.value.setRGB(1.0, 0.7, 0.45); else GB_RIM.color.value.setRGB(1.0, 0.58, 0.3);
    if (outside) app.cafe.focusShadow(2.6, -10.0, 9); else if (exp) app.cafe.focusShadow(0.65, -1.0, 2.5); else app.cafe.focusShadow(-1.2, -2.0, 4.5);
    const F = app.scene.fog;
    if (outside) { F.color.set('#9a7690'); F.density = 0.011; } else { F.color.set('#5e4462'); F.density = 0.016; }
    this._hudUpdate(app, t, shot);
  },

  _hudUpdate(app, t, shot) {
    const G = app.gauge, cam = app.camera, W = StoryHUD.win;
    // the gauge: ONE gravity value (gbG, the physics' own) through a meter response; hidden in the experiment shots
    const vis = W(t, -1, GB.end - 0.8, 0.35, 0.5) * (shot.exp ? 0 : 1);   // on from frame 1
    const gNow = gbG(t), swing = MathX.ramp(t, GB.g, GB.g + 0.9);
    const gv = t < GB.g ? 1 : 1 + (gNow - 1) * Ease.outBack(swing);
    const val = Math.min(2, Math.max(1, gNow < 1.5 ? 1 : gv)).toFixed(1);
    if (G.last.o !== vis.toFixed(3)) { G.el.style.opacity = vis.toFixed(3); G.last.o = vis.toFixed(3); }
    if (G.last.v !== val) { G.v.textContent = val; G.last.v = val; }
    const ang = -120 + ((gv - 0.5) / 2.0) * 240;
    G.needle.setAttribute('transform', `rotate(${ang.toFixed(2)} 75 75)`);
    const a0 = (-120 + ((1 - 0.5) / 2) * 240) * Math.PI / 180, a1 = ang * Math.PI / 180, R = 62;
    G.arc.setAttribute('d', gv > 1.005 ? `M ${75 + Math.sin(a0) * R} ${75 - Math.cos(a0) * R} A ${R} ${R} 0 0 1 ${75 + Math.sin(a1) * R} ${75 - Math.cos(a1) * R}` : '');
    const sub = t < GB.g ? 'EARTH NORMAL' : t < GB.g + 0.6 ? '' : 'SAME MASS · TWICE THE WEIGHT';
    if (G.last.s !== sub) { G.sub.textContent = sub; G.last.s = sub; }
    // narration subtitles: visible only while that phrase is being spoken; each word brightens as it is said
    for (const S of app.subs) {
      const P = S.P, a = W(t, P.show, P.hide, 0.12, 0.18);
      const o = a.toFixed(3);
      if (S.last.o !== o) { S.el.style.opacity = o; S.last.o = o; }
      if (a > 0.001) S.spans.forEach((sp, i) => { const k = (t >= P.tokens[i].start - 0.04 ? 1 : 0.42).toString(); if (sp._k !== k) { sp.style.opacity = k; sp._k = k; } });
    }
    // projection helper (16:9 frame in design pixels)
    const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
    const place = (el, world, a, dx = 0, dy = 0) => {
      if (a <= 0.01) { if (el._a !== 0) { el.style.opacity = '0'; el._a = 0; } return; }
      const p = world.clone().project(cam);
      el.style.left = (((p.x * 0.5 + 0.5) * 1920 + dx) * u).toFixed(1) + 'px'; el.style.top = (((-p.y * 0.5 + 0.5) * 1080 + dy) * u).toFixed(1) + 'px';
      const s = a.toFixed(3); if (el._a !== s) { el.style.opacity = s; el._a = s; }
    };
    // the experiment: lane labels over the boards; the predicted time lights up as the narrator says it;
    // the timers count the measured fall live and freeze at the landing; "1.00 m" on the stick while it is said
    const L = app.lab, D = app.drop, E = shot.exp;
    const la = E ? MathX.smooth(t, GB.wideExp + 0.6, GB.wideExp + 1.4) : 0;
    const Z = GB_DROP.z;
    for (const [k, li, win] of [['l1', 0, GB.lane1], ['l2', 1, GB.lane2]]) {
      const LN = GB_DROP.lanes[li], ex = LN.x + LN.side * (GB_DROP.boardW / 2 + 0.03);   // just outside the board's outer edge
      place(L[k], new THREE.Vector3(ex, 0.84, Z - 0.2), la);
      const hi = MathX.window(t, win[0] - 0.1, GB.out, 0.25, 0.3);
      const pe = L[k].querySelector('.p'); const ps = hi.toFixed(2); if (pe._s !== ps) { pe.style.opacity = ps; pe._s = ps; }
      L[k].classList.toggle('on', t >= win[0] - 0.1 && t < win[1] + 0.6);
      const ta = E ? MathX.smooth(t, GB.drop - 0.9, GB.drop - 0.4) : 0;
      const te = L[li ? 't2' : 't1'];
      place(te, new THREE.Vector3(ex, 0.36, Z - 0.2), ta);
      const tv = D.timer(t, li).toFixed(2);
      const ve = te.querySelector('.v'); if (ve.textContent !== tv) ve.textContent = tv;
      te.classList.toggle('done', gbExpT(t) >= D.lanes[li].landT);
    }
    place(L.m1, new THREE.Vector3(GB_DROP.rulerX + 0.05, GB_DROP.h, Z), E ? MathX.window(t, GB.oneM[0] - 0.1, GB.oneM[1] + 1.2, 0.25, 0.5) : 0, 70, 0);
    const ra = E ? W(t, GB.replay - 0.1, GB.replayEnd + 0.2, 0.25, 0.4) : 0;
    if (L.replay._a !== ra.toFixed(3)) { L.replay.style.opacity = ra.toFixed(3); L.replay._a = ra.toFixed(3); }
    // the car: where the body sat at 1 g (dashed line + ghost) and where it sits now
    const ca = app.cast.carRef || 0, car = app.cast.car;
    if (ca > 0.01) {
      car.g.updateMatrixWorld(true);
      // tags just behind the front wheel: the dashed 1 g sill line (above) and the sill where it is now (below)
      const zs = GB_CAR.refSide * (GB_CAR.W / 2 + 0.08), tx = GB_CAR.wheelX - GB_CAR.wheelR - 0.55;
      const p1 = new THREE.Vector3(tx, GB_CAR.wheelR + car.sill, zs).applyMatrix4(car.g.matrixWorld);
      const p2 = new THREE.Vector3(tx, car.sill, zs).applyMatrix4(car.body.matrixWorld);
      place(L.car1, p1, ca, 0, -30); place(L.car2, p2, ca, 0, 40);
    } else { place(L.car1, new THREE.Vector3(), 0); place(L.car2, new THREE.Vector3(), 0); }
  },

  grade(t, p) {
    const shot = FILM._shot || gbShotAt(t), S = FILM._S;
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    p.ao = 0.55; p.exposure = 1.0; p.saturation = 1.05; p.contrast = 1.08; p.warmth = 0.1; p.blackLift = 0.012;
    p.vignette = 0.45; p.soft = 0.015; p.bloom = 0.16; p.bloomThreshold = 1.3; p.grain = 0.024; p.uneven = 0.03; p.keepWarm = 1;
    p.tunnel = 1.3; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.flashColor.setRGB(1.0, 0.86, 0.7);
    p.dof = S ? S.dof : 0; p.focus = S ? S.focus : 5;
    if (shot.outside) { p.exposure = 0.98; p.saturation = 1.08; p.warmth = 0.07; p.bloom = 0.22; p.bloomThreshold = 1.2; }
    if (shot.exp) { p.ao = 0.5; p.vignette = 0.5; p.saturation = 1.0; p.contrast = 1.1; }
    if (shot.id === 'S2c' || shot.id === 'S3') p.ao = 0.45;
    // the doubling: a pressure pulse (exposure dip + a breath of chroma, a vignette squeeze), not a white flash
    const hit = MathX.impulse(t, GB.g, 0.14);
    p.exposure *= 1 - 0.18 * hit; p.chroma = 0.004 * hit; p.vignette += 0.3 * MathX.impulse(t, GB.g, 0.5);
    const after = MathX.smooth(t, GB.g, GB.g + 1.5);
    if (!shot.outside && !shot.exp) { p.saturation -= 0.03 * after; p.contrast += 0.03 * after; }
    // effort: the vignette tightens while he strains
    p.vignette += 0.12 * MathX.window(t, GB.lift, GB.down, 0.4, 0.4) + 0.1 * MathX.window(t, GB.rise2[0], GB.rise2[1], 0.4, 0.4);
    // the replay reads as a replay: a little cooler and softer
    if (gbInReplay(t)) { p.saturation -= 0.12; p.warmth -= 0.04; p.vignette += 0.08; }
    // no fade-in: the café is there from frame 1; only the slow fade at the very end
    p.fade = MathX.smooth(t, GB.fade[0], GB.fade[1]);
  },

  debug(app, t) { const s = gbShotAt(t); return `shot ${s.id} · g ${gbG(t).toFixed(2)} · exp ${gbExpT(t).toFixed(3)}`; },
};
