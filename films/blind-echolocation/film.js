/* =====================================================================
   FILM — "What If You Went Blind... And Learned to See With Sound?" (7-minute-class documentary, 16:9)
     build(app)    the sets (each its own THREE.Scene), the cast, the acoustic layers (pulses, wavefronts, rings),
                   the HUD (title, word-timed subtitles, the "slowed" tag, science labels)
     update(app,t) the shot's camera, set, cast and VIEW MODE (reality ↔ acoustic), the pulses, fog
     view(app,t)   [the shot's scene, the camera]
     grade(t,p)    per shot; the collapse of the light in scene 1 (desaturation, the tunnel), DOF, fades
   16:9: the shared SceneManager sizes the stage 9:16, so this film installs its own resize() (film-side, as in the
   gravity films).
   ===================================================================== */

function beResize() {
  let sw, sh;
  if (CONFIG.captureMode) { sw = CONFIG.captureWidth; sh = CONFIG.captureHeight; }
  else { const W = window.innerWidth, H = window.innerHeight - (this.recording ? 0 : 118); sw = Math.min(W, H * 16 / 9); sh = sw * 9 / 16; }
  this.stage.style.width = sw + 'px'; this.stage.style.height = sh + 'px';
  document.documentElement.style.setProperty('--u', (sw / 1920) + 'px');
  let rw, rh;
  const res = CONFIG.render.resolution;
  if (CONFIG.captureMode) { rw = sw; rh = sh; }
  else if (res === 'auto') { const dpr = Math.min(window.devicePixelRatio || 1, 2); rw = Math.min(1920, Math.round(sw * dpr)); rh = Math.round(rw * 9 / 16); }
  else { const f = parseFloat(res) || 1; rw = Math.round(1920 * f); rh = Math.round(1080 * f); }
  if (!(this.post instanceof GbPost)) this.post = new GbPost(this.renderer);
  this.renderer.setPixelRatio(1); this.renderer.setSize(rw, rh, false);
  this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
  this.post.setSize(rw, rh);
  this.camera.aspect = rw / rh; this.camera.updateProjectionMatrix();
}

// a soft environment map for a set (reflections on glass/metal): a gradient sphere
function beEnvFor(renderer, top, mid, low) {
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(mid) }, c: { value: new THREE.Color(low) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 a,b,c; varying vec3 vD; void main(){ float h = vD.y; vec3 col = h > 0.0 ? mix(b, a, smoothstep(0.0, 0.7, h)) : mix(b, c, smoothstep(0.0, -0.5, h)); gl_FragColor = vec4(col, 1.0); }',
  })));
  const tex = pm.fromScene(es, 0.04).texture; pm.dispose();
  return tex;
}

const FILM = {
  build(app) {
    FILM._app = app;
    app.resize = beResize.bind(app);
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.camera.near = 0.02; app.camera.far = 600;
    const cast = app.cast = new BeCast(app);
    // ---- the sets
    app.sets = {};
    const apt = app.sets.apt = new BeApartment().build();
    apt.scene.environment = beEnvFor(app.renderer, '#9fb4e0', '#e8c8a0', '#5a4034');
    apt.scene.background = new THREE.Color('#0b0a10');
    apt.scene.fog = new THREE.FogExp2('#cdb9a6', 0.018);
    apt.hero = cast.heroIn(apt.scene, 'noor');
    apt.slice = new BeSlice(apt.scene, -BE_APT.W, BE_APT.W, -BE_APT.D, BE_APT.D, 0.72);
    beScene2Props(apt);
    beScene3Props(apt);
    cast.buildPhone(apt.scene); beAcoustic(cast.phoneScreenM, { refl: 0.9, crisp: 0.9 }); beAcousticScene(cast.phone);
    // the later chapters' sets (each scene file registers its builder: (app, cast) => …)
    for (const f of BE_SET_BUILDERS) f(app, cast);
    // the acoustic layers of each set
    for (const S of Object.values(app.sets)) { S.waves = new BeWaves(S.scene, 14); S.rings = new BeRings(S.scene, 64, true); S.ringsX = new BeRings(S.scene, 32, false); }
    app.pulses = new BePulses();
    this._schedule(app);
    beSchedule2(app);
    beSchedule3(app);
    for (const f of BE_SCHEDULERS) f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    this._hudExtras(app);
    app.audio = new BeAudio(app.tl, app);
  },

  // ---- the pulse schedule (sound events that carry information). The audio uses the same beats.
  _schedule(app) {
    const P = app.pulses, C = app.cast, ph = (t) => C.phoneAt(t).P;
    // scene 1: the alarm's buzz (amber): faint when the room "hasn't disappeared", clearer on "the alarm beside you"
    for (const t of C.buzzTimes(BE.room, BE.knock)) P.add({ t, p: ph(t).clone(), kind: 1, speed: 1.4, w: 0.06, life: 1.5, str: 0.7 + 1.1 * MathX.smooth(t, BE.alarm - 0.5, BE.alarm + 0.6), set: 'apt' });
    // the car outside (violet): a moving source beyond the window
    this.carP = (t) => new THREE.Vector3(7.5, 0.6, -9 + 15 * MathX.ramp(t, BE.cars - 0.4, BE.cars + 2.6));
    for (let t = BE.cars; t < BE.cars + 2.2; t += 0.32) P.add({ t, p: this.carP(t), kind: 2, speed: 9, w: 0.45, life: 1.4, str: 1.3 * MathX.window(t, BE.cars, BE.cars + 2.2, 0.4, 0.8), set: 'apt' });
    // footsteps in the hallway (amber, small)
    this.stepTimes = beEvery(BE.steps, BE.steps + 3.2, 0.56, 0.04, 3);
    this.stepP = (t) => new THREE.Vector3(-3.6 + 2.0 * (t - BE.steps), 0.05, 2.9);
    for (const t of this.stepTimes) P.add({ t, p: this.stepP(t), kind: 1, speed: 2.5, w: 0.08, life: 1.1, str: 1.4, set: 'apt' });
    // her fingertips on the table edge, the knock
    P.add({ t: BE.touch, p: new THREE.Vector3(-0.99, BE_APT.nightH, -1.62), kind: 0, speed: 2.2, w: 0.04, life: 1.0, str: 0.55, set: 'apt' });
    P.add({ t: BE.knock, p: BE_APT.phone0.clone(), kind: 0, speed: 2.5, w: 0.05, life: 1.0, str: 0.6, set: 'apt' });
    // ★ the impact: the first true echo picture of the room; the bounce; the skid (a trail of small contacts)
    this.impactP = C.phoneAt(BE.impact + 0.001).P.clone();
    P.add({ t: BE.impact, p: this.impactP, kind: 0, speed: 5.5, w: 0.12, life: 3.2, str: 1.25, set: 'apt', big: true });
    // its first reflections: one pulse per wall from the IMAGE SOURCE behind it (it starts at the wall exactly when the
    // direct front reaches it, and travels back into the room: the physically correct reflected front)
    for (const Wl of app.sets.apt.walls.slice(0, 4)) {
      const dist = this.impactP.clone().sub(Wl.p).dot(Wl.n), img = this.impactP.clone().addScaledVector(Wl.n, -2 * dist);
      P.add({ t: BE.impact, p: img, kind: 0, speed: 5.5, w: 0.1, life: 2.2, str: 0.5 * Wl.refl, set: 'apt', echo: true });
    }
    P.add({ t: BE.bounce, p: C.phoneAt(BE.bounce).P.clone(), kind: 0, speed: 4.5, w: 0.08, life: 1.6, str: 0.6, set: 'apt' });
    for (let t = BE.slide[0]; t < BE.slide[1]; t += 0.18) P.add({ t, p: ph(t).clone(), kind: 0, speed: 2.4, w: 0.05, life: 0.8, str: 0.4 * (1 - 0.6 * MathX.ramp(t, BE.slide[0], BE.slide[1])), set: 'apt' });
    // the phone still buzzing under the dresser (muffled: weaker, shorter)
    for (const t of C.buzzTimes(BE.slide[1] + 0.5, BE.s2 + 4)) P.add({ t, p: ph(BE.slide[1] + 1), kind: 1, speed: 0.9, w: 0.04, life: 1.0, str: 0.32, set: 'apt' });
  },

  _hudExtras(app) {
    const hud = document.getElementById('hud');
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.title = mk('be-title', '<div class="q">What if you went blind…</div><div class="s">and learned to see with sound?</div>');
    app.tag = mk('be-tag', 'VISUALIZATION · SOUND SLOWED');
    app.rt = mk('be-tag be-rt', '');
    app.big = mk('be-big', 'Echolocation');
    app.chart = document.createElement('canvas'); app.chart.className = 'be-chart'; app.chart.width = 1920; app.chart.height = 1080; app.chart.style.opacity = '0'; hud.appendChild(app.chart);
    app.week = mk('be-week', '');
    app.labs = [];   // projected science labels (shot.labels(t) → [{ p, html, a, cls }])
    app.mtag = mk('be-tag be-mtag', '<span class="a">THE MOVIE VERSION</span><span class="b">NOT HOW IT WORKS</span>');
    app.subs = BN.phrases.map((P) => {
      const d = document.createElement('div'); d.className = 'be-sub';
      d.innerHTML = P.tokens.map((tk) => `<span>${tk.text}</span>`).join(' ');
      d.style.opacity = '0'; hud.appendChild(d);
      return { P, el: d, spans: [...d.querySelectorAll('span')], last: {} };
    });
  },

  update(app, t) {
    const shot = beShotAt(t), cam = app.camera, C = app.cast;
    FILM._shot = shot;
    const set = app.sets[shot.set];
    const ctx = {};
    // ---- the cast
    if (shot.set === 'apt') {
      const ph = C.phoneAt(t); C.phone.position.copy(ph.P); C.phone.rotation.copy(ph.R);
      const ring = t < BE.dark0 ? C.buzz(t) : 0;
      C.phoneScreenM.emissiveIntensity = t < BE.dark0 ? 1.1 : 0;
      ctx.bedV = C.bedView(t);
      if (t < BE.s2) C.heroBed(set.hero, t, ctx.bedV, !!shot.fp);
      else if (t < BE.s3) beHeroS2(set.hero, t, set, C);
      else set.hero.root.visible = false;
      if (t >= BE.s3 && t < BE.s4) beHeroS3(set.hero2, t, set); else if (t >= BE.s14) beHeroS14(set.hero2, t, set, C); else set.hero2.root.visible = false;
      if (t < BE.s14) { set.caneFold.visible = false; set.cane14.visible = false; }
      set.doorPivot.rotation.y = t >= BE.s14 ? beDoor14(t) : t >= BE.s3 ? -1.45 : 0;
      set.warm14.intensity = t >= BE.s14 ? 6 * Ease.inOutSine(MathX.ramp(t, BE.qOpen[0], BE.qOpen[1] + 0.8)) : 0;
      beProps2(set, t);
      void ring;
    } else if (set.frame) set.frame(app, t, shot, ctx);   // a later set poses its own cast
    let S = shot.cam(t, ctx);
    if (FILM._dbgCam) { const v = FILM._dbgCam; S = { pos: new THREE.Vector3(v[0], v[1], v[2]), at: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6] || 50, focus: 1, dof: 0 }; }
    cam.position.copy(S.pos); cam.up.set(0, 1, 0); cam.lookAt(S.at);
    if (S.roll) cam.rotateZ(S.roll);
    cam.fov = S.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    FILM._S = S;
    // ---- the view mode (reality ↔ acoustic)
    const L = FILM._look = shot.look(t);
    BE_AC.uBeAc.value = L.ac; BE_AC.real.world.value = L.world; BE_AC.real.hero.value = L.hero; BE_AC.real.glow.value = L.glow ?? L.world;
    const T = shot.clock ? shot.clock.value(t) : t;   // a slowed shot runs the sound on its own clock
    BE_AC.uBeT.value = T;
    BE_AC.uBeDecay.value = shot.decay || 0.4; BE_AC.uBeFall.value = typeof shot.fall === 'function' ? shot.fall(t) : shot.fall || 0.09; BE_AC.uBeGain.value = shot.gainAt ? shot.gainAt(t) : shot.gain || 1; BE_AC.gain.hero.value = shot.heroGain || 0.6;
    app.pulses.apply(T, 1, (q) => q.set === shot.set && (!q.shot || q.shot === shot.id) && (shot.clock ? q.clock === (shot.clockId || 'c3') : !q.clock));
    // ---- the set: lights fade with reality (they are what the audience sees, not what she hears)
    for (const v of BE_AC.uBeCS.value) v.w = 0; for (const v of BE_AC.uBeLS.value) v.z = 0; BE_AC.uBeRev.value.w = 0;   // (scene 13's city lights its own continuous sources)
    if (shot.set === 'apt') {
      set.update(t, L.ac > 0.5 ? L.world : 1, cam);
      if (!set.ceilings) { set.ceilings = []; set.root.traverse((o) => { if (o.isMesh && /Ceiling(Plaster|LampGlow)|backroom/i.test(o.material.name || '') && (o.position.y > 2 || /Ceiling/.test(o.material.name))) set.ceilings.push(o); }); }
      for (const m of set.pendant.concat(set.ceilings)) m.visible = !shot.plan;
      const F = set.scene.fog; F.color.set('#cdb9a6').multiplyScalar(MathX.lerp(1, L.world, L.ac)); F.density = 0.018;
      this._aptAcoustics(app, set, t, L);
    } else {
      if (set.update) set.update(t, L, cam, shot);
      set.waves.begin(); set.rings.begin(); set.ringsX.begin();
      if (set.fx) set.fx(app, t, shot, L);
      set.waves.end(); set.rings.end(); set.ringsX.end();
    }
    { let nc = 0, nl = 0; BE_AC.uBeCS.value.forEach((v, i) => { if (v.w > 0) nc = i + 1; }); BE_AC.uBeLS.value.forEach((v, i) => { if (v.z > 0) nl = i + 1; }); BE_AC.uBeN.value.y = nc; BE_AC.uBeN.value.z = nl; if (L.ac <= 0.001) BE_AC.uBeN.value.set(0, 0, 0); }   // (the view's block is off then)
    for (const S2 of Object.values(app.sets)) if (S2 !== set) { S2.waves.begin(); S2.waves.end(); S2.rings.begin(); S2.rings.end(); S2.ringsX.begin(); S2.ringsX.end(); }
    this._hudUpdate(app, t, shot);
  },

  // the apartment's wavefronts and rings for the current time
  _aptAcoustics(app, set, t, L) {
    const W = set.waves, R = set.rings, RX = set.ringsX, C = app.cast;
    W.begin(); R.begin(); RX.begin();
    if (L.ac > 0.5 && t < BE.s2) {
      // the impact: the outgoing shell and its reflections (image sources) from the room's walls, floor and ceiling
      set.slice.hide();
      if (!FILM._shot.plan) {
        W.click({ t: BE.impact, p: this.impactP }, t, set.walls.slice(0, 4), { speed: 5.5, life: 2.4, a: 0.3 });
        W.click({ t: BE.bounce, p: C.phoneAt(BE.bounce).P }, t, set.walls.slice(0, 4), { speed: 4.5, life: 1.2, a: 0.1 });
      }
      // the alarm: amber rings at the phone while it buzzes
      const ph = C.phoneAt(t).P.clone(); ph.y += 0.02;
      const under = t > BE.slide[1];
      R.source(ph, C.buzzTimes(BE.room - 0.2, t + 0.01).filter((x) => x > t - 1.5), t, { r: under ? 0.1 : 0.16, a: (under ? 0.5 : 0.95) * MathX.smooth(t, BE.room - 0.3, BE.alarm + 0.5) + (under ? 0 : 0.15), dur: 1.0 });
      // the car: violet ripples beyond the window wall (direction and motion only)
      if (t > BE.cars - 0.5 && t < BE.cars + 3.5) RX.source(this.carP(t), beEvery(BE.cars, BE.cars + 2.3, 0.32).filter((x) => x <= t), t, { r: 2.4, a: 0.95, col: '#9a7cff', dur: 1.4, th: 0.08 });
      // footsteps in the hall (through the wall: small amber rings, low on the floor)
      RX.source(new THREE.Vector3(0, 0, 0), [], t);
      for (const s of this.stepTimes) if (t > s && t < s + 1.1) RX.source(this.stepP(s), [s], t, { r: 0.6, a: 0.95, dur: 1.0, th: 0.08, squash: 0.45 });
    }
    if (L.ac > 0.05) { beRings2(this._app, set, t, FILM._shot); beFx3(this._app, set, t, FILM._shot); if (t >= BE.s14) beFx14(this._app, set, t, FILM._shot); }
    W.end(); R.end(); RX.end();
  },

  _hudUpdate(app, t, shot) {
    const W = StoryHUD.win;
    const ta = W(t, BE.title[0], BE.title[1], 0.5, 0.6).toFixed(3); if (app.title._a !== ta) { app.title.style.opacity = ta; app.title._a = ta; }
    // the label fades in and out once per RUN of consecutive labelled shots (it does not blink at every cut)
    const run = shot.tag ? beTagRun(shot) : null;
    const tg = (run ? MathX.smooth(t, run[0] + 0.2, run[0] + 0.6) * (1 - MathX.smooth(t, run[1] - 0.4, run[1])) : 0).toFixed(3);
    if (app.tag._a !== tg) { app.tag.style.opacity = tg; app.tag._a = tg; }
    const tt = typeof shot.tag === 'string' ? shot.tag : 'VISUALIZATION · SOUND SLOWED';   // e.g. 'SLOW MOTION' for real footage slowed
    if (shot.tag && app.tag._t !== tt) { app.tag.textContent = tt; app.tag._t = tt; }
    // the slowed clock's readout: the real time since the click
    const rto = (shot.clock ? MathX.smooth(t, shot.t0 + 0.4, shot.t0 + 0.9) * (1 - MathX.smooth(t, shot.t1 - 0.3, shot.t1)) : 0).toFixed(3);
    if (app.rt._a !== rto) { app.rt.style.opacity = rto; app.rt._a = rto; }
    if (shot.clock) { const txt = 'REAL TIME AFTER THE CLICK  ' + (shot.clock.value(t) * 1000).toFixed(1) + ' ms'; if (app.rt._t !== txt) { app.rt.textContent = txt; app.rt._t = txt; } }
    const bo = W(t, BE.echoW - 0.1, BE.over + 0.9, 0.6, 0.7).toFixed(3); if (app.big._a !== bo) { app.big.style.opacity = bo; app.big._a = bo; }
    const wk = shot.week ? shot.week(t) : 0, wa = (wk ? MathX.smooth(t, shot.t0 + 0.15, shot.t0 + 0.5) * (1 - MathX.smooth(t, shot.t1 - 0.25, shot.t1)) : 0).toFixed(3);
    if (app.week._a !== wa) { app.week.style.opacity = wa; app.week._a = wa; }
    if (wk && app.week._n !== wk) { app.week.innerHTML = typeof wk === 'string' ? wk : '<span>WEEK</span> ' + wk; app.week._n = wk; }   // a string: a card of its own
    // projected labels
    const labs = shot.labels ? shot.labels(t) : [], v = new THREE.Vector3();
    while (app.labs.length < labs.length) { const d = document.createElement('div'); d.className = 'be-lab'; d.style.opacity = '0'; document.getElementById('hud').appendChild(d); app.labs.push(d); }
    app.labs.forEach((d, i) => {
      const L = labs[i], a = L ? MathX.clamp(L.a, 0, 1) : 0, o = a.toFixed(3);
      if (d._a !== o) { d.style.opacity = o; d._a = o; }
      if (!L || a <= 0) return;
      if (d._h !== L.html) { d.innerHTML = L.html; d._h = L.html; }
      const cls = 'be-lab ' + (L.cls || ''); if (d.className !== cls) d.className = cls;
      if (L.p) v.copy(L.p).project(app.camera); else v.set(0, 0, 0);   // no p: a screen-placed card (dx, dy in %)
      d.style.left = ((v.x * 0.5 + 0.5) * 100 + (L.dx || 0)).toFixed(2) + '%'; d.style.top = ((0.5 - v.y * 0.5) * 100 + (L.dy || 0)).toFixed(2) + '%';
    });
    const co = (shot.chart || shot.draw ? MathX.smooth(t, shot.t0, shot.t0 + 0.35) * (1 - MathX.smooth(t, shot.t1 - 0.3, shot.t1)) : 0);
    if (app.chart._a !== co.toFixed(3)) { app.chart.style.opacity = co.toFixed(3); app.chart._a = co.toFixed(3); }
    if (co > 0) { if (shot.draw) shot.draw(app.chart, t); else beDrawSignatures(app.chart, MathX.ramp(t, shot.t0 + 0.2, shot.t1 - 0.6)); }
    const mt = (shot.movie ? MathX.smooth(t, BE.movies + 0.3, BE.movies + 0.7) * (1 - MathX.smooth(t, BE.learn - 0.5, BE.learn)) : 0).toFixed(3);
    if (app.mtag._a !== mt) { app.mtag.style.opacity = mt; app.mtag._a = mt; }
    const nb = t > BE.superN + 0.15 ? '1' : '0';
    if (app.mtag._b !== nb) { app.mtag.classList.toggle('no', nb === '1'); app.mtag._b = nb; }
    for (const S of app.subs) {
      const P = S.P, a = W(t, P.show, P.hide, 0.12, 0.18) * (t < BE.title[1] ? 0 : 1), o = a.toFixed(3);
      if (S.last.o !== o) { S.el.style.opacity = o; S.last.o = o; }
      if (a > 0.001) S.spans.forEach((sp, i) => { const k = (t >= P.tokens[i].start - 0.04 ? 1 : 0.78).toString(); if (sp._k !== k) { sp.style.opacity = k; sp._k = k; } });
    }
  },

  view(app) { return [app.sets[FILM._shot.set].scene, app.camera]; },

  grade(t, p) {
    const shot = FILM._shot || beShotAt(t), S = FILM._S, L = FILM._look || BE_REAL;
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    if (shot.flash) p.flash = shot.flash(t);
    p.ao = 0.5; p.exposure = 1.0; p.saturation = 1.06; p.contrast = 1.07; p.warmth = 0.08; p.blackLift = 0.01;
    p.vignette = 0.42; p.soft = 0.012; p.bloom = 0.2; p.bloomThreshold = 1.25; p.grain = 0.022; p.uneven = 0.025; p.keepWarm = 1;
    p.tunnel = 1.3; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.dof = S ? S.dof * 0.5 : 0; p.focus = S ? S.focus : 3;
    // the acoustic view: black base, the glows carry it (stronger bloom, no warmth, no AO)
    const ac = L.ac;
    p.bloom = MathX.lerp(p.bloom, 0.55, ac); p.bloomThreshold = MathX.lerp(p.bloomThreshold, 0.5, ac); p.ao *= 1 - ac; p.warmth *= 1 - ac;
    p.blackLift = MathX.lerp(p.blackLift, 0.004, ac); p.vignette += 0.25 * ac;
    // scene 1: the collapse: colour drains, the frame closes in, a soft blur (and the sunlight goes last)
    if (t >= BE.dark0 && t < BE.s2) {
      const k = MathX.smooth(t, BE.dark0, BE.dark1), c = MathX.window(t, BE.dark0, BE.colors + 1.2, 0.3, 1.0);
      p.saturation = MathX.lerp(1.06, 0.15, c * MathX.smooth(t, BE.dark0, BE.colors));
      p.tunnel = MathX.lerp(1.3, 0.75, k * (1 - MathX.smooth(t, BE.colors, BE.hands + 1)));
      p.tunnelDark = 0.6 * k * (1 - MathX.smooth(t, BE.colors, BE.hands + 1));
      p.edgeBlur = 0.5 * MathX.window(t, BE.dark0, BE.sun, 0.2, 1.0);
      p.exposure *= 1 + 0.25 * MathX.impulse(t, BE.dark0, 0.15);   // a last flare before it goes
    }
    // the impact: a breath of light in the acoustic view
    p.exposure *= 1 + 0.15 * MathX.impulse(t, BE.impact, 0.25);
    p.fade = MathX.smooth(t, BE.end - (window.BE_CUT ? 1.4 : 3), BE.end);
  },

  debug(app, t) { const s = beShotAt(t); return `shot ${s.id} · ac ${(FILM._look || BE_REAL).ac.toFixed(2)}`; },
};

// the run of consecutive shots that carry the same "slowed" label as this one: [first t0, last t1]
function beTagRun(shot) {
  if (shot._run) return shot._run;
  const i = BE_SHOTS.indexOf(shot), txt = (s) => (typeof s.tag === 'string' ? s.tag : s.tag ? 'slowed' : null), me = txt(shot);
  let a = i, b = i;
  while (a > 0 && txt(BE_SHOTS[a - 1]) === me && Math.abs(BE_SHOTS[a - 1].t1 - BE_SHOTS[a].t0) < 1e-3) a--;
  while (b < BE_SHOTS.length - 1 && txt(BE_SHOTS[b + 1]) === me && Math.abs(BE_SHOTS[b].t1 - BE_SHOTS[b + 1].t0) < 1e-3) b++;
  return (shot._run = [BE_SHOTS[a].t0, Math.min(BE_SHOTS[b].t1, BE.end)]);
}
