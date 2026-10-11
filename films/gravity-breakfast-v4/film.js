/* =====================================================================
   FILM — "What If Gravity Doubled at Breakfast?" (Cinematic Hybrid prototype, 16:9)
     build(app)   the café + plaza, the cast, his POV hands, the HUD (title/captions + gauge, lids, tags), sound
     update(app,t) shot camera (or the POV controller), set, cast, hands, rim light, shadows, fog, HUD extras
     grade(t, p)   warm sunrise grade per shot; DOF; the gravity hit; transitions
   16:9 note: the shared SceneManager sizes the stage 9:16; this film installs its own resize() on the app
   instance (film-side, no engine edit). Capture mode already honours ?w=1920&h=1080.
   ===================================================================== */

// POV hand poses: hands resting / pressing flat on the table edge (aimed at world points every frame)
const GB_HAND_POSES = Object.assign({}, HAND_POSES, {
  gbRest: { p: [0.12, -0.3, -0.42], F: [0, 0.35, -1], N: [0, -1, -0.3], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.4, 0.25], aim: [0, 0.05, 0] },
  gbPress: { p: [0.13, -0.3, -0.42], F: [0, 0.35, -1], N: [0, -1, -0.3], curl: [0.08, 0.08, 0.1, 0.14], thumb: [0.6, 0.1], aim: [0, 0.05, 0], trem: 0.0035 },
});
const GB_HAND_BLEND = Object.assign({}, HAND_BLEND, { gbRest: 0.3, gbPress: 0.35 });
for (const k of Object.keys(GB_HAND_POSES)) { GB_HAND_POSES[k + '!'] = GB_HAND_POSES[k]; GB_HAND_BLEND[k + '!'] = 0.02; }

// the 16:9 resize (installed on the SceneManager instance)
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
    if (/[?&]safe\b/.test(location.search)) document.body.classList.add('gb-showsafe');
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.scene.fog = new THREE.FogExp2('#6e5070', 0.012);
    app.camera.near = 0.02; app.camera.far = 900;
    app.cafe = new GbCafe(app.scene); app.cafe.build();
    app.cast = new GbCast(app, app.cafe);
    // his hands in POV: the same dark skin as his face, teal sleeves (the locked ViewerHands, recoloured)
    app.hands = new ViewerHands(app.camera, { scale: 1.0, skin: '#5e3c2f', nail: '#7a5446', sleeve: '#357780', cuff: '#285d64', watch: false,
      sleeveLen: 1.1, sleeveFit: 0.85, poses: GB_HAND_POSES, blends: GB_HAND_BLEND });
    for (const k of ['skin', 'nail', 'sleeve', 'cuff']) { app.hands.mats[k].roughness = k === 'skin' ? 0.6 : 0.95; gbAddRim(app.hands.mats[k], k === 'skin' ? 0.4 : 0.25, -1); }
    // environment reflections: a small PMREM of the dawn sky
    const pm = new THREE.PMREMGenerator(app.renderer), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), gbSkyMaterial()));
    app.scene.environment = pm.fromScene(es, 0.04).texture;
    app.scene.background = new THREE.Color('#2a2d63');
    // HUD
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    this._hudExtras(app);
    app.audio = new GbAudio(app.tl, app);
  },

  _hudExtras(app) {
    const hud = document.getElementById('hud'), stage = document.getElementById('stage');
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
    const lt = document.createElement('div'); lt.className = 'gb-lid top'; const lb = document.createElement('div'); lb.className = 'gb-lid bot';
    stage.appendChild(lt); stage.appendChild(lb); app.lids = [lt, lb];
    const mkTag = () => { const d = document.createElement('div'); d.className = 'gb-tag'; hud.appendChild(d); return d; };
    app.tags = { ghost: mkTag(), real: mkTag(), old: mkTag(), now: mkTag(), lamp: mkTag(), b2: mkTag(), b1: mkTag(), m4: mkTag(), m8: mkTag(), m12: mkTag() };
    app.tags.lamp.innerHTML = 'CORD STRETCHES · SWINGS 1.4× FASTER'; app.tags.b2.innerHTML = '2 g'; app.tags.b1.innerHTML = '1 g · NORMAL';
    app.tags.m4.innerHTML = '4 m'; app.tags.m8.innerHTML = '8 m'; app.tags.m12.innerHTML = '12 m';
    app.tags.ghost.innerHTML = '1 g · NORMAL'; app.tags.real.innerHTML = '2 g';
    app.tags.old.innerHTML = 'BEFORE · 1 g'; app.tags.now.innerHTML = 'NOW · 2 g <b>½ height</b>';
    const sf = document.createElement('div'); sf.className = 'gb-safe'; stage.appendChild(sf);
  },

  update(app, t) {
    const shot = gbShotAt(t), cam = app.camera, C = app.cast;
    FILM._shot = shot;
    const pov = !!shot.pov, outside = !!shot.outside;
    // the set first (lamps, chair sink), then the cast (the hero sits on the sunk chair)
    // V3: the falling-cup shot runs on slow-motion scene time (story time everywhere else)
    const tc = shot.id === 'S5b' ? gbScene(t) : t;
    FILM._tc = tc;
    app.cafe.update(tc, cam);
    const ctx = {};
    C._fallSide = GB_FALL_SIDE;
    C.update(tc, { pov, outside: true, seated: true, ghost: false });
    ctx.smashP = C.smashP; ctx.fallSide = GB_FALL_SIDE;
    if (C.raceBase) { ctx.raceLead = C.raceLead; ctx.raceGhost = C.raceGhost; }
    ctx.cupP = C.cup.position.clone();
    ctx.faceP = C.hero.worldOf('hc', new THREE.Vector3());
    const e = C.hero.face.eyes[1].eg; e.updateMatrixWorld(true); ctx.eyeP = e.getWorldPosition(new THREE.Vector3());
    // camera
    let S = null;
    if (!pov) { S = shot.cam(t, ctx); gbApplyShot(cam, S); }
    // look-dev: ?gbcam=x,y,z,ax,ay,az[,fov] overrides the shot camera (inspection only)
    const dc = /[?&]gbcam=([^&]+)/.exec(location.search);
    if (dc) { const v = dc[1].split(',').map(Number); S = { pos: new THREE.Vector3(v[0], v[1], v[2]), at: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6] || 30, focus: 1, dof: 0 }; gbApplyShot(cam, S); }
    FILM._S = S;
    // POV hands: aimed so the palms sit on the table edge (they stay put while the head rises)
    if (pov) {
      const [tx, tz] = GB_SET.heroTable, y = GB_SET.tableH + 0.012;
      const Fw = new THREE.Vector3(1, 0, 0), Nw = new THREE.Vector3(0, -1, 0);
      cam.updateMatrixWorld(true);
      for (const [name, side] of [['gbRest', 1], ['gbPress', 1]]) {
        const P = GB_HAND_POSES[name];
        gbAimHand(P, cam, new THREE.Vector3(tx - 0.3, y + (name === 'gbPress' ? 0.0 : 0.01), tz + 0.17), Fw.clone().add(new THREE.Vector3(0, 0, 0.25)), Nw, side);
      }
      // the left hand mirrors: aim its own copy
      const L = (GB_HAND_POSES.gbRestL = GB_HAND_POSES.gbRestL || JSON.parse(JSON.stringify(GB_HAND_POSES.gbRest)));
      gbAimHand(L, cam, new THREE.Vector3(tx - 0.3, y + 0.01, tz - 0.17), new THREE.Vector3(1, 0, -0.25), Nw, -1);
      const LP = (GB_HAND_POSES.gbPressL = GB_HAND_POSES.gbPressL || JSON.parse(JSON.stringify(GB_HAND_POSES.gbPress)));
      gbAimHand(LP, cam, new THREE.Vector3(tx - 0.3, y, tz - 0.17), new THREE.Vector3(1, 0, -0.25), Nw, -1);
    }
    app.hands.update(t);
    if (pov) this._leftHand(app, t);
    // rim light: toward the window/sun, in view space
    cam.updateMatrixWorld(true);
    GB_RIM.dir.value.copy(GB_SET.sunDir).add(new THREE.Vector3(0, 0.25, 0)).normalize().transformDirection(cam.matrixWorldInverse);
    GB_RIM.gain.value = shot.rim || 1;
    if (outside) GB_RIM.color.value.setRGB(1.0, 0.7, 0.45); else GB_RIM.color.value.setRGB(1.0, 0.58, 0.3);
    // sun shadows follow the shot
    if (outside) app.cafe.focusShadow(0, -9, 16); else app.cafe.focusShadow(-1.2, -2.0, 4.5);
    // fog per place
    const F = app.scene.fog;
    if (outside) { F.color.set('#9a7690'); F.density = 0.011; } else { F.color.set('#5e4462'); F.density = pov ? 0.02 : 0.016; }
    this._hudUpdate(app, t, shot);
  },

  // the ViewerHands mirror the right pose for the left hand; give the left its own aimed pose
  _leftHand(app, t) {
    const H = app.hands, h = H.left, S = SCRIPT.hands.left;
    let i = 0; while (i + 1 < S.length && S[i + 1][0] <= t) i++;
    const cur = S[i][1].replace('!', ''), prev = i > 0 ? S[i - 1][1].replace('!', '') : cur;
    const pick = (n) => (n === 'gbRest' ? GB_HAND_POSES.gbRestL : n === 'gbPress' ? GB_HAND_POSES.gbPressL : null);
    const A = pick(prev), B = pick(cur);
    if (!A || !B) return;
    const w = i > 0 ? Ease.inOutSine(MathX.clamp((t - S[i][0]) / (GB_HAND_BLEND[cur] || 0.3), 0, 1)) : 1;
    const L = (u, v) => u + (v - u) * w;
    h.g.position.set(-L(A.p[0], B.p[0]), L(A.p[1], B.p[1]), L(A.p[2], B.p[2]));
    H._orient(A.F, A.N, -1, H._q); H._orient(B.F, B.N, -1, H._q2);
    h.g.quaternion.slerpQuaternions(H._q, H._q2, w);
  },

  _hudUpdate(app, t, shot) {
    const G = app.gauge, cam = app.camera;
    // gauge (V2): ONE gravity value for the whole film. The needle follows gbG(t) — the same function the physics
    // uses — through a meter response (a quick swing with a small overshoot that settles), and never resets.
    // It is on screen from the first second to the wide finale, in every shot.
    const vis = MathX.window(t, 0.35, GB.end - 0.5, 0.35, 0.4);   // V4: stays up to the end (the race numbers are the result)
    const gNow = gbG(t), swing = MathX.ramp(t, GB.g, GB.g + 0.9);
    const gv = t < GB.g ? 1 : 1 + (gNow - 1) * Ease.outBack(swing);
    const val = Math.min(2, Math.max(1, gNow < 1.5 ? 1 : gv)).toFixed(1);
    if (G.last.o !== vis.toFixed(3)) { G.el.style.opacity = vis.toFixed(3); G.last.o = vis.toFixed(3); }
    if (G.last.v !== val) { G.v.textContent = val; G.last.v = val; }
    const ang = -120 + ((gv - 0.5) / 2.0) * 240;
    G.needle.setAttribute('transform', `rotate(${ang.toFixed(2)} 75 75)`);
    const a0 = (-120 + ((1 - 0.5) / 2) * 240) * Math.PI / 180, a1 = ang * Math.PI / 180, R = 62;
    G.arc.setAttribute('d', gv > 1.005 ? `M ${75 + Math.sin(a0) * R} ${75 - Math.cos(a0) * R} A ${R} ${R} 0 0 1 ${75 + Math.sin(a1) * R} ${75 - Math.cos(a1) * R}` : '');
    const sub = t < GB.g + 0.5 ? (t < GB.g ? 'EARTH NORMAL' : '')
      : t < GB.close ? 'SAME MASS · TWICE THE WEIGHT'
      : t < GB.pov ? 'HIS ARM 4 kg → FEELS LIKE 8 kg'
      : t < GB.fall ? 'HIS BODY 75 kg → FEELS LIKE 150 kg'
      : t < GB.out ? (t < app.cast.smashT + 0.15 ? 'SLOW MOTION · TWICE THE ACCELERATION'
        : `${app.cast.fallT.toFixed(2)} s · HITS AT ${Math.sqrt(2 * 19.62 * app.cast.fallH).toFixed(1)} m/s   (1 g: ${app.cast.fallT1.toFixed(2)} s · ${Math.sqrt(2 * 9.81 * app.cast.fallH).toFixed(1)} m/s)`)
      : t < GB.wide ? 'SAME NOZZLE SPEED → HALF THE HEIGHT'
      : t < GB.release ? 'BALLOON: WEIGHT ×2 · LIFT FROM THE AIR ×2'
      : `CLIMBED  2 g: ${(app.cast.raceH2 || 0).toFixed(1)} m · 1 g: ${(app.cast.raceH1 || 0).toFixed(1)} m`;
    if (G.last.s !== sub) { G.sub.textContent = sub; G.last.s = sub; }
    // eyelids (V3): one short partial blink into the POV — no second blink, no long black
    const close = 0.42 * MathX.smooth(t, GB.pov - 0.2, GB.pov - 0.02) * (1 - MathX.smooth(t, GB.pov + 0.02, GB.pov + 0.25));
    const lidH = (close * 52).toFixed(2) + '%';
    for (const l of app.lids) { if (l._h !== lidH) { l.style.height = lidH; l._h = lidH; } l.style.display = close > 0.002 ? 'block' : 'none'; }
    // pinned tags (projected): the ghost vs real cup in the close-up; old vs new jet height in the wide
    const W = 1920, Hh = 1080, u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
    const place = (el, world, a) => {
      if (a <= 0.01) { if (el._a !== 0) { el.style.opacity = '0'; el._a = 0; } return; }
      const p = world.clone().project(cam);
      el.style.left = ((p.x * 0.5 + 0.5) * W * u).toFixed(1) + 'px'; el.style.top = ((-p.y * 0.5 + 0.5) * Hh * u).toFixed(1) + 'px';
      el.style.opacity = a.toFixed(3); el._a = a;
    };
    // V3: the falling cup (S5b): '2 g' on the real cup, '1 g' on the ghost released beside it
    const C = app.cast, isFall = shot.id === 'S5b', tc = FILM._tc;
    const fa = isFall ? MathX.window(tc, GB_TOFF + 0.06, C._smashScene + 0.5, 0.08, 0.3) : 0;
    const realP = (C.trayCupB.visible ? C.trayCupB.position : C.smashP).clone().add(new THREE.Vector3(0, 0.16, 0));
    place(app.tags.real, realP, fa); place(app.tags.ghost, C.ghost.position.clone().add(new THREE.Vector3(0, 0.16, 0)), fa * (C.ghost.visible ? 1 : 0));
    const isS6 = shot.id === 'S6a', fz = GB_SET.fountain;
    const la = isS6 ? MathX.window(t, GB.out + 0.7, GB.wide, 0.35, 0.3) : 0;
    app.cafe.oldLineM.opacity = 0.9 * la;
    place(app.tags.old, new THREE.Vector3(fz[0] + 1.25, 1.78 + app.cafe.H1, fz[1]), la);
    place(app.tags.now, new THREE.Vector3(fz[0] + 1.25, 1.78 + app.cafe.Hc + 0.15, fz[1]), la);
    // V4: the lamp in the room shot (the most central one on screen while the camera looks up)
    const lk = shot.id === 'S3' ? MathX.window(t, GB.room + 1.3, GB.close - 0.5, 0.25, 0.25) : 0;
    let best = null, bd = 9;
    if (lk > 0) for (const L of app.cafe.lamps) { const w = L.body.getWorldPosition(new THREE.Vector3()); const q = w.clone().project(cam); const d = Math.hypot(q.x, q.y); if (q.z < 1 && d < bd) { bd = d; best = w; } }
    place(app.tags.lamp, best ? best.clone().add(new THREE.Vector3(0, 0.12, 0)) : new THREE.Vector3(), best ? lk : 0);
    // V4: the balloon race (2 g bunch vs the 1 g ghost) and its height scale
    const rb = C.raceBase, ra = shot.id === 'S6b' && rb ? MathX.smooth(t, GB.release + 0.15, GB.release + 0.5) * (1 - MathX.smooth(t, GB.end - 0.6, GB.end - 0.2)) : 0;
    place(app.tags.b2, rb ? C.raceLead.clone().add(new THREE.Vector3(-0.35, 0.05, 0)) : new THREE.Vector3(), ra);
    place(app.tags.b1, rb ? C.raceGhost.clone().add(new THREE.Vector3(0.45, 0.05, 0)) : new THREE.Vector3(), ra);
    for (const [k, m] of [['m4', 4], ['m8', 8], ['m12', 12]]) place(app.tags[k], rb ? rb.clone().add(new THREE.Vector3(0.18, m + 0.15, 0)) : new THREE.Vector3(), rb && shot.id === 'S6b' ? MathX.smooth(t, GB.release - 0.3, GB.release) * (1 - MathX.smooth(t, GB.end - 0.6, GB.end - 0.2)) * 0.85 : 0);
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
    if (shot.pov) { p.ao = 0.45; p.vignette = 0.62; p.dof = 0.12; p.focus = 2.2; }
    if (shot.id === 'S4') { p.ao = 0.45; }
    if (shot.id === 'S5b') { p.vignette = 0.55; p.saturation = 1.0; }
    // the gravity hit: a quick pressure pulse (exposure dip + a breath of chroma), not a white flash
    const hit = MathX.impulse(t, GB.g, 0.14);
    p.exposure *= 1 - 0.22 * hit; p.chroma = 0.004 * hit; p.vignette += 0.35 * MathX.impulse(t, GB.g, 0.5);
    // after the hit the room reads a touch heavier (story through colour)
    const after = MathX.smooth(t, GB.g, GB.g + 1.5);
    if (!shot.outside) { p.saturation -= 0.04 * after; p.contrast += 0.04 * after; }
    // effort: the vignette tightens while he strains
    p.vignette += 0.14 * (MathX.window(t, GB.try[0], GB.try[1], 0.4, 0.4) + MathX.window(t, GB.stand[0], GB.stand[1], 0.4, 0.3));
    // transitions: a dip to black between the exterior and the interior (fast), the push into his face (dark),
    // a warm light bloom through the window into the outside reveal
    // V3: a short, partial dip on the push (max 0.5) — the V2 long black at ~14.4 s is gone
    p.fade = 0.5 * MathX.smooth(t, GB.push + 0.3, GB.pov - 0.04) * (1 - MathX.smooth(t, GB.pov, GB.pov + 0.25));
    p.smear.set(0, 0);
    // the end
    p.fade = Math.max(p.fade, MathX.smooth(t, GB.end - 0.45, GB.end));
  },

  debug(app, t) { const s = gbShotAt(t); return `shot ${s.id} · g ${gbG(t).toFixed(2)}`; },
};
