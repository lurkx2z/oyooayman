/* =====================================================================
   FILM — "What If Gravity Doubled? Episode 01: The Day Everything Became Heavy" (3-minute test, 16:9)
     build(app)   café + staircase + plaza + balcony + ramp + parked car, the cast (GbCast3), the ball experiment,
                  the hologram, the HUD (gravity gauge, word-timed narration subtitles, hologram labels, lane labels
                  and timers, measured results, the car's ride-height tags, the fountain's 1 g line, the load tag)
     update(app,t) shot camera, set, cast, experiment, rim light, shadows, fog, HUD
     grade(t, p)   warm sunrise grade per shot (warmer and lower toward the end); DOF; the gravity hit; the end fade
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
    app.cast = new GbCast3(app, app.cafe);
    app.drop = new GbDrop(app.scene);
    app.holo = new GbHolo(app.scene, (m) => app.cast._cup(m, m));
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
    // the gravity gauge: top-left dial + big serif number + a small line
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
    // the episode card (top right in the opening): "EPISODE 01 · THE DAY EVERYTHING BECAME HEAVY"
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.ep = mk('gb-ep', '<div class="k">EPISODE 01</div><div class="t">The Day Everything Became Heavy</div>');
    const D = GB_DROP, l0 = (li) => app.drop.lanes[li];
    const f2 = (v) => v.toFixed(2), f1 = (v) => v.toFixed(1);
    app.lab = {
      l1: mk('gb-lane l', '<div class="g">1 g</div><div class="n">NORMAL GRAVITY</div><div class="p">≈ 0.45 s</div>'),
      l2: mk('gb-lane r', '<div class="g">2 g</div><div class="n">DOUBLE GRAVITY</div><div class="p">≈ 0.32 s</div>'),
      t1: mk('gb-timer l', '<span class="v">0.00</span><small> s</small>'),
      t2: mk('gb-timer r', '<span class="v">0.00</span><small> s</small>'),
      m1: mk('gb-tag', '1.00 m'),
      same: mk('gb-tag', 'TWO IDENTICAL CERAMIC BALLS · <b>0.64 kg</b>'),
      e1: mk('gb-tag', `IMPACT ENERGY <b>${f1(l0(0).energy)} J</b>`),
      e2: mk('gb-tag', `IMPACT ENERGY <b>${f1(l0(1).energy)} J · 2×</b>`),
      r1: mk('gb-res l', `<div>FALL <b>${f2(l0(0).landT)} s</b></div><div>IMPACT <b>${f1(l0(0).vImpact)} m/s</b></div><div>ENERGY <b>${f1(l0(0).energy)} J</b></div>`),
      r2: mk('gb-res r', `<div>FALL <b>${f2(l0(1).landT)} s</b></div><div>IMPACT <b>${f1(l0(1).vImpact)} m/s</b></div><div>ENERGY <b>${f1(l0(1).energy)} J</b></div>`),
      bounce: mk('gb-tag', `FIRST BOUNCE · SAME HEIGHT <b>${Math.round(D.e * D.e * D.h * 100)} cm</b><div style=\"font-size:0.62em;opacity:0.8;margin-top:0.3em\">same restitution assumed</div>`),
      replay: mk('gb-replay', 'SLOW-MOTION REPLAY ×4'),
      car1: mk('gb-tag', 'RIDE HEIGHT AT 1 g'),
      car2: mk('gb-tag', 'AT 2 g · <b>≈10 cm lower</b>'),
      // the hologram: mass never changes; weight (the force) doubles
      hm: mk('gb-holo', '<div class="k">MASS</div><div class="v">0.25 kg</div><div class="s">UNCHANGED</div>'),
      hw: mk('gb-holo w', '<div class="k">WEIGHT AT <span class="gg">1 g</span></div><div class="v"><span class="n">2.45</span> N</div><div class="s">×<span class="x">1</span></div>'),
      hb: mk('gb-holo b', '<div class="k">YOUR BODY · 75 kg</div><div class="v">736 N → 1,472 N</div><div class="s">SAME MASS · TWICE THE WEIGHT</div>'),
      f1g: mk('gb-tag', 'JET HEIGHT AT 1 g'),
      f2g: mk('gb-tag', 'AT 2 g · <b>HALF</b>'),
      load: mk('gb-holo w', '<div class="k">BRACKET LOAD</div><div class="v">2.0× <small>design</small></div><div class="s">THIS BRACKET: RATED 2.5×</div>'),
    };
  },

  update(app, t) {
    const shot = gbShotAt(t), cam = app.camera, C = app.cast;
    FILM._shot = shot;
    const outside = !!shot.outside, exp = !!shot.exp;
    app.cafe.setClear(exp);
    app.cafe.update(t, cam);
    C.carRef = shot.carRef ? MathX.window(t, GB.carCU + 0.5, GB.carry + 0.1, 0.4, 0.3) : 0;
    const Cs = C.update(t, { outside, exp });
    app.drop.update(t, exp);
    FILM._holo = app.holo.update(t, !!shot.holo || (!outside && !exp && t > GB.s3 && t < GB.exp));
    // the fountain's 1 g jet line: on "might barely reach half" and in the silent wide
    const fl = shot.fountRef ? Math.max(MathX.window(t, GB.half - 0.2, GB.rules, 0.4, 0.4), MathX.window(t, GB.s9b + 0.8, GB.s9c, 0.6, 0.4)) : 0;
    app.cafe.oldLineM.opacity = 0.9 * fl;
    const ctx = { car: C.car, rampZ: C.rampZ(t), railGrip: C.railGrip };
    if (!outside && !exp) {
      ctx.cupP = C.cup.position.clone();
      const [tx, tz] = GB_SET.heroTable; ctx.cupRestP = new THREE.Vector3(tx - 0.22, GB_SET.tableH + 0.008, tz + 0.12);
      ctx.cupH = Cs ? Cs.h : 0;
    }
    if (C.hero.root.visible) ctx.faceP = C.hero.worldOf('hc', new THREE.Vector3());
    let S = shot.cam(t, ctx);
    // look-dev: FILM._dbgCam = [x,y,z, ax,ay,az, fov] overrides the shot camera (inspection only, via stills --eval)
    if (FILM._dbgCam) { const v = FILM._dbgCam; S = { pos: new THREE.Vector3(v[0], v[1], v[2]), at: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6] || 40, focus: 1, dof: 0 }; }
    gbApplyShot(cam, S);
    FILM._S = S;
    cam.updateMatrixWorld(true);
    GB_RIM.dir.value.copy(GB_SET.sunDir).add(new THREE.Vector3(0, 0.25, 0)).normalize().transformDirection(cam.matrixWorldInverse);
    GB_RIM.gain.value = shot.rim || 1;
    if (outside) GB_RIM.color.value.setRGB(1.0, 0.7 - 0.08 * FILM._late(t), 0.45 - 0.1 * FILM._late(t)); else GB_RIM.color.value.setRGB(1.0, 0.58, 0.3);
    if (outside) {
      // shadows follow the action: the square's centre, the ramp, the balcony, the fountain
      if (shot.id === 'I1') app.cafe.focusShadow(10.8, ctx.rampZ, 4);
      else if (shot.id === 'H3') app.cafe.focusShadow(6.2, -6.0, 3.5);
      else if (shot.id === 'J3') app.cafe.focusShadow(-7.5, -5.5, 4);
      else app.cafe.focusShadow(-0.5, -10.0, 10);
    } else if (exp) app.cafe.focusShadow(0.65, -1.0, 2.5);
    else if (t >= GB.heart && t < GB.out) app.cafe.focusShadow(0.6, 2.6, 3.5);
    else app.cafe.focusShadow(-1.8, -2.4, 3.5);
    const F = app.scene.fog;
    if (outside) { F.color.set('#8f7890'); F.density = 0.0075; } else { F.color.set('#5e4462'); F.density = 0.016; }
    this._hudUpdate(app, t, shot);
  },

  // 0 → 1 across scenes 10–12: the sun sinks a little lower and warmer in the grade
  _late(t) { return MathX.smooth(t, GB.s10, GB.s12); },

  _hudUpdate(app, t, shot) {
    const G = app.gauge, cam = app.camera, W = StoryHUD.win;
    // the gauge: ONE gravity value (gbG, the physics' own) through a meter response; hidden in the experiment and
    // hologram close-ups and in the silent reveal; from the change on it always reads 2.0
    const hide = shot.exp || shot.id === 'K2' || shot.id === 'L1' || shot.id === 'C3';
    const vis = W(t, 0.25, GB.end - 0.8, 0.35, 0.5) * (hide ? 0 : 1);
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
    // the episode card under the title
    const ea = W(t, 1.0, 5.6, 0.6, 0.6).toFixed(3); if (app.ep._a !== ea) { app.ep.style.opacity = ea; app.ep._a = ea; }
    // narration subtitles: visible only while that phrase is being spoken; each word brightens as it is said
    for (const S of app.subs) {
      const P = S.P, a = W(t, P.show, P.hide, 0.12, 0.18);
      const o = a.toFixed(3);
      if (S.last.o !== o) { S.el.style.opacity = o; S.last.o = o; }
      if (a > 0.001) S.spans.forEach((sp, i) => { const k = (t >= P.tokens[i].start - 0.04 ? 1 : 0.62).toString(); if (sp._k !== k) { sp.style.opacity = k; sp._k = k; } });
    }
    // projection helper (16:9 frame in design pixels)
    const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
    const place = (el, world, a, dx = 0, dy = 0) => {
      if (a <= 0.01 || !world) { if (el._a !== 0) { el.style.opacity = '0'; el._a = 0; } return; }
      const p = world.clone().project(cam);
      el.style.left = (((p.x * 0.5 + 0.5) * 1920 + dx) * u).toFixed(1) + 'px'; el.style.top = (((-p.y * 0.5 + 0.5) * 1080 + dy) * u).toFixed(1) + 'px';
      const s = a.toFixed(3); if (el._a !== s) { el.style.opacity = s; el._a = s; }
    };
    const L = app.lab, D = app.drop, E = shot.exp, Z = GB_DROP.z, V = (x, y, z) => new THREE.Vector3(x, y, z);
    // ---- the hologram labels (scene 3)
    const H = FILM._holo;
    if (H && shot.holo && shot.id !== 'C2') {
      place(L.hm, H.massP, H.a * MathX.smooth(t, GB.mass - 0.2, GB.mass + 0.3), -150, -20);
      place(L.hw, H.arrowP, H.aw, 150, 0);
      // no in-between numbers: the arrow grows as a comparison, the label states the two weights (1 g reference, now 2 g)
      const two = H.w > 1.5, x = L.hw.querySelector('.x'), n = L.hw.querySelector('.n'), gg = L.hw.querySelector('.gg');
      const xs = two ? '2  (was 2.45 N at 1 g)' : '1', ns = two ? '4.9' : '2.45', gs = two ? '2 g · NOW' : '1 g';
      if (x.textContent !== xs) x.textContent = xs;
      if (n.textContent !== ns) n.textContent = ns;
      if (gg.textContent !== gs) gg.textContent = gs;
    } else { place(L.hm, null, 0); place(L.hw, null, 0); }
    place(L.hb, shot.id === 'C2' && FILM._app.cast.hero.root.visible ? FILM._app.cast.hero.worldOf('hc', V(0, 0, 0)).add(V(0, -0.3, 0.55)) : null, shot.id === 'C2' ? W(t, GB.body + 0.3, GB.pull, 0.4, 0.3) : 0, 0, 0);
    // ---- the experiment: lane labels over the boards; the predicted time lights up as the narrator says it;
    // the timers count the measured fall live and freeze at the first impact; "1.00 m" while it is said
    const la = E ? MathX.smooth(t, GB.wideExp + 0.6, GB.wideExp + 1.4) * (1 - MathX.smooth(t, GB.clampCU - 0.2, GB.clampCU)) + MathX.smooth(t, GB.dropWide, GB.dropWide + 0.01) * (1 - MathX.smooth(t, GB.replay - 0.2, GB.replay)) : 0;
    for (const [k, li, win] of [['l1', 0, GB.lane1], ['l2', 1, GB.lane2]]) {
      const LN = GB_DROP.lanes[li], ex = LN.x + LN.side * (GB_DROP.boardW / 2 + 0.03);
      place(L[k], V(ex, 0.9, Z - 0.2), E ? la : 0);
      const hi = MathX.window(t, win[0] - 0.1, GB.s6, 0.25, 0.3);
      const pe = L[k].querySelector('.p'); const ps = hi.toFixed(2); if (pe._s !== ps) { pe.style.opacity = ps; pe._s = ps; }
      L[k].classList.toggle('on', t >= win[0] - 0.1 && t < win[1] + 0.6);
      const ta = E && (shot.id === 'E1' || shot.id === 'D4') ? MathX.smooth(t, GB.drop - 0.9, GB.drop - 0.4) : 0;
      const te = L[li ? 't2' : 't1'];
      place(te, V(ex, 0.42, Z - 0.2), shot.id === 'E1' ? ta : 0);
      const tv = D.timer(t, li).toFixed(2);
      const ve = te.querySelector('.v'); if (ve.textContent !== tv) ve.textContent = tv;
      te.classList.toggle('done', gbExpT(t) >= D.lanes[li].landT);
      // the impact energy (said in D4: "roughly twice the energy") above each clamp
      place(L[li ? 'e2' : 'e1'], V(LN.x, GB_DROP.padH + GB_DROP.h + 0.16, Z), shot.id === 'D4' ? W(t, GB.energy[0] - 0.2, GB.drop - 0.5, 0.3, 0.4) : 0);
      // the measured result
      place(L[li ? 'r2' : 'r1'], V(LN.x + LN.side * 0.05, 0.85, Z), shot.id === 'E3' ? MathX.smooth(t, GB.result + 0.2, GB.result + 0.7) : 0, LN.side * 40, 0);
    }
    place(L.m1, V(GB_DROP.rulerX + 0.05, GB_DROP.padH + GB_DROP.h, Z), E ? MathX.window(t, GB.oneM[0] - 0.1, GB.oneM[1] + 1.2, 0.25, 0.5) : 0, 70, 0);
    place(L.same, V(GB_DROP.rulerX, 1.3, Z), shot.id === 'D1' ? W(t, GB.wideExp + 0.8, GB.lane1[0] - 0.4, 0.3, 0.3) : 0);
    place(L.bounce, V(GB_DROP.rulerX, GB_DROP.padH + GB_DROP.e * GB_DROP.e + 0.06, Z), shot.id === 'E3' ? MathX.smooth(t, GB.result + 0.9, GB.result + 1.5) : 0);
    const ra = E ? W(t, GB.replay - 0.1, GB.replayEnd + 0.2, 0.25, 0.4) : 0;
    if (L.replay._a !== ra.toFixed(3)) { L.replay.style.opacity = ra.toFixed(3); L.replay._a = ra.toFixed(3); }
    // ---- the car: where the body sat at 1 g (dashed line + ghost) and where it sits now
    const ca = app.cast.carRef || 0, car = app.cast.car;
    if (ca > 0.01) {
      car.g.updateMatrixWorld(true);
      const zs = GB_CAR.refSide * (GB_CAR.W / 2 + 0.08), tx = GB_CAR.wheelX - GB_CAR.wheelR - 0.55;
      const p1 = V(tx, GB_CAR.wheelR + car.sill, zs).applyMatrix4(car.g.matrixWorld);
      const p2 = V(tx, car.sill, zs).applyMatrix4(car.body.matrixWorld);
      place(L.car1, p1, ca, 0, -30); place(L.car2, p2, ca, 0, 40);
    } else { place(L.car1, null, 0); place(L.car2, null, 0); }
    // ---- the fountain: the dashed 1 g height and the jet now
    const fo = app.cafe.oldLineM.opacity, [fx, fz] = GB_SET.fountain;
    place(L.f1g, V(fx + 1.2, 1.78 + (app.cafe.H1 || 0), fz), fo, 20, -26);
    place(L.f2g, V(fx + 0.6, 1.78 + (app.cafe.Hc || 0) * 0.5, fz), fo * MathX.smooth(t, GB.half + 0.4, GB.half + 0.9), 90, 0);
    // ---- the balcony bracket: the engineer's reading
    if (shot.gaugeTag) { const gp = app.cafe.gauge.getWorldPosition(V(0, 0, 0)); place(L.load, gp, W(t, GB.gaugeUp[0] + 0.4, GB.back10, 0.4, 0.3), 170, 30); }
    else place(L.load, null, 0);
  },

  grade(t, p) {
    const shot = FILM._shot || gbShotAt(t), S = FILM._S;
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    p.ao = 0.55; p.exposure = 1.0; p.saturation = 1.05; p.contrast = 1.08; p.warmth = 0.1; p.blackLift = 0.012;
    p.vignette = 0.45; p.soft = 0.015; p.bloom = 0.16; p.bloomThreshold = 1.3; p.grain = 0.024; p.uneven = 0.03; p.keepWarm = 1;
    p.tunnel = 1.3; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.flashColor.setRGB(1.0, 0.86, 0.7);
    p.dof = S ? S.dof * 0.5 : 0; p.focus = S ? S.focus : 5;
    if (shot.outside) {
      const late = FILM._late(t);
      p.contrast = 1.13; p.exposure = 0.98 - 0.05 * late; p.saturation = 1.08 + 0.04 * late; p.warmth = 0.07 + 0.07 * late; p.bloom = 0.22 + 0.08 * late; p.bloomThreshold = 1.2 - 0.1 * late;
    }
    if (shot.exp) { p.ao = 0.5; p.vignette = 0.5; p.saturation = 1.0; p.contrast = 1.1; }
    if (shot.holo) { p.bloom = 0.18; }
    if (shot.id === 'B1' || shot.id === 'B2') p.ao = 0.45;
    // the doubling: a pressure pulse (exposure dip + a breath of chroma, a vignette squeeze), not a white flash
    const hit = MathX.impulse(t, GB.g, 0.14);
    p.exposure *= 1 - 0.18 * hit; p.chroma = 0.004 * hit; p.vignette += 0.3 * MathX.impulse(t, GB.g, 0.5);
    const after = MathX.smooth(t, GB.g, GB.g + 1.5);
    if (!shot.outside && !shot.exp) { p.saturation -= 0.03 * after; p.contrast += 0.03 * after; }
    // effort: the vignette tightens while he strains (the lift, standing up, the stairs)
    p.vignette += 0.12 * MathX.window(t, GB.lift, GB.down, 0.4, 0.4) + 0.1 * MathX.window(t, GB.stand[0], GB.stand[1], 0.4, 0.4) + 0.1 * MathX.window(t, GB.step1[0], GB.handCU + 2, 0.4, 0.6);
    // the replay reads as a replay: a little cooler and softer
    if (gbInReplay(t)) { p.saturation -= 0.12; p.warmth -= 0.04; p.vignette += 0.08; }
    // no fade-in: the café is there from frame 1; only the slow fade at the very end
    p.fade = MathX.smooth(t, GB.fade[0], GB.fade[1]);
  },

  debug(app, t) { const s = gbShotAt(t); return `shot ${s.id} · g ${gbG(t).toFixed(2)} · exp ${gbExpT(t).toFixed(3)}`; },
};
