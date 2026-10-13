/* =====================================================================
   FILM — "What if Africa suddenly disappeared?"
     build(app)    every set (each its own THREE.Scene + camera), the HUD (title, readouts, word-timed subtitles,
                   time tags), the soundtrack
     update(app,t) the shot's set and camera (shots.js), the HUD
     view(app,t)   [the shot's scene, its camera]
     grade(t,p)    per set; the cuts (a 2-frame dip), the white hit on the vanish, the final fade
   Sets register themselves in AF_SET_BUILDERS: name → (app) => { scene, camera, frame(t, shot, app), grade?(t, p) }.
   ===================================================================== */

const AF_SET_BUILDERS = {};

// images (the planet maps) decode asynchronously: the page reports ready only when they have
window.AF_IMAGES_READY = false;
(function afHoldReady() {
  let v = false;
  Object.defineProperty(window, 'SIM_READY', { configurable: true, get: () => v && window.AF_IMAGES_READY, set: (x) => { v = x; } });
})();

// a soft gradient environment map for a set's reflections
function afEnv(renderer, top, mid, low) {
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
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.sets = {};
    app.planet = app.sets.planet = new AfPlanet(app.renderer);
    // wait for the planet's maps to decode
    const imgs = Object.values(app.planet.tex).map((tx) => tx.image ? Promise.resolve() : new Promise((r) => { const iv = setInterval(() => { if (tx.image && tx.image.complete) { clearInterval(iv); r(); } }, 30); }));
    Promise.all(imgs).then(() => { for (const tx of Object.values(app.planet.tex)) tx.needsUpdate = true; window.AF_IMAGES_READY = true; });
    for (const [name, f] of Object.entries(AF_SET_BUILDERS)) app.sets[name] = f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    this._hudExtras(app);
    app.audio = new AfAudio(app.tl, app);
  },

  _hudExtras(app) {
    const hud = document.getElementById('hud');
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.subs = AN.phrases.map((P) => {
      const d = mk('af-sub', P.tokens.map((tk) => `<span>${tk.text}</span>`).join(' '));
      return { P, el: d, spans: [...d.querySelectorAll('span')] };
    });
    app.ro = mk('af-ro', '<div class="l"></div><div class="v"></div><div class="s"></div>');
    app.tag = mk('af-tag', '');
    app.labs = [];
    for (let i = 0; i < 8; i++) app.labs.push(mk('af-lab', ''));
  },

  update(app, t) {
    const shot = afShotAt(t);
    FILM._shot = shot;
    const set = app.sets[shot.set] || app.planet;
    if (set === app.planet) { if (shot.frame) shot.frame(t, app.planet, app); else app.planet.set(afPlanetState(t)), app.planet.aim(18, 2, 3.4, 30, {}); }
    else set.frame(t, shot, app);
    FILM._set = set;
    this._hud(app, t, shot, set);
  },

  // ---- HUD: subtitles (word-timed), the top-left readout, a time tag (top right), projected labels
  _hud(app, t, shot, set) {
    for (const S of app.subs) {
      const a = StoryHUD.win(t, S.P.show, S.P.hide, 0.08, 0.12);
      S.el.style.opacity = a.toFixed(3);
      if (a > 0) S.spans.forEach((sp, i) => { sp.style.opacity = t >= S.P.tokens[i].start - 0.04 ? '1' : '0.45'; });
    }
    const R = afReadoutAt(t);
    app.ro.style.opacity = R ? R.a.toFixed(3) : '0';
    if (R) {
      app.ro.children[0].textContent = R.label; app.ro.children[1].innerHTML = R.value; app.ro.children[2].textContent = R.sub || '';
    }
    const G = afTagAt(t);
    app.tag.style.opacity = G ? G.a.toFixed(3) : '0';
    if (G) app.tag.textContent = G.text;
    const L = (set.labels ? set.labels(t, shot, app) : afPlanetLabels(t, shot, app)) || [];
    app.labs.forEach((el, i) => {
      const l = L[i];
      if (!l) { el.style.opacity = '0'; return; }
      el.style.opacity = l.a.toFixed(3); el.innerHTML = l.html;
      el.style.left = (l.x * 100).toFixed(2) + '%'; el.style.top = (l.y * 100).toFixed(2) + '%';
    });
  },

  view(app, t) {
    const set = FILM._set || app.planet;
    return [set.scene, set.camera];
  },

  grade(t, p) {
    const shot = FILM._shot || AF_SHOTS[0];
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.08; p.contrast = 1.06; p.warmth = 0.0; p.blackLift = 0.006;
    p.vignette = 0.5; p.soft = 0.08; p.bloom = 0.28; p.bloomThreshold = 1.1; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    const set = FILM._set;
    if (set && set.grade) set.grade(t, p, shot);
    // the vanish: a 2–3 frame pale hit
    p.flash = Math.max(p.flash, 0.35 * MathX.impulse(t, AF.van0 + 0.1, 0.08));
    // every cut: a 2-frame dip
    for (const s of AF_SHOTS) if (s.t0 > 0 && Math.abs(t - s.t0) < 0.07) p.fade = Math.max(p.fade, 0.35 * (1 - Math.abs(t - s.t0) / 0.07));
    // the end: the music cuts to silence, the picture to black
    p.fade = Math.max(p.fade, MathX.smooth(t, AF.end - 0.5, AF.end - 0.05));
  },

  debug(app, t) { const s = FILM._shot; return `shot ${s ? s.id : '-'} · set ${s ? s.set : '-'}`; },
};

// projected labels on the planet (the lost cities in P2; Suez in T2)
function afPlanetLabels(t, shot, app) {
  const P = app.planet, out = [], v = new THREE.Vector3(), cam = P.camera;
  const put = (lon, lat, html, a) => {
    v.copy(afDir(lon, lat)).multiplyScalar(1.004);
    const camDir = cam.position.clone().normalize();
    if (afDir(lon, lat).dot(camDir) < 0.15) return;
    v.project(cam);
    if (Math.abs(v.x) > 0.92 || Math.abs(v.y) > 0.92) return;
    out.push({ x: v.x * 0.5 + 0.5, y: 0.5 - v.y * 0.5, html, a });
  };
  if (shot.id === 'P2') {
    // the six biggest cities that do not crowd each other (Alexandria sits on Cairo); each label runs right of its dot,
    // so it is dropped if it would leave the frame, cross the readout (top left) or the caption (lower third)
    const n0 = out.length;
    ['Cairo', 'Lagos', 'Kinshasa', 'Luanda', 'Khartoum', 'Abidjan'].forEach((nm, i) => {
      const [name, lon, lat] = AF_CITIES.find((c) => c[0] === nm);   // (names only: the dataset's populations are city proper)
      const a = MathX.smooth(t, AF.erased + 0.3 + i * 0.35, AF.erased + 0.8 + i * 0.35) * (1 - MathX.smooth(t, AF.mine - 0.5, AF.mine - 0.1));
      put(lon, lat, `<span class="d"></span>${name}`, a);
    });
    for (let i = out.length - 1; i >= n0; i--) { const l = out[i]; if (l.x < 0.03 || l.x > 0.8 || (l.y > 0.62 && l.y < 0.82) || l.y < 0.1 || l.y > 0.93 || (l.y < 0.25 && l.x < 0.55)) out.splice(i, 1); }
  }
  if (shot.id === 'T1') {
    // Africa's big ports as nodes of the network; on "Ports disappear" each flares red, pops and is gone
    const n0 = out.length;
    [['LAGOS', 'lag'], ['TANGER MED', 'tng'], ['DURBAN', 'dur'], ['MOMBASA', 'mom'], ['PORT SAID', 'sai'], ['ABIDJAN', 'abi'], ['DAKAR', 'dak']].forEach(([name, wp], i) => {
      const [lon, lat] = AF_WP[wp], tr = AF.ports - 0.15 + i * 0.26;
      const a = MathX.smooth(t, AF.trade + 0.6 + i * 0.1, AF.trade + 1.0 + i * 0.1) * (1 - MathX.smooth(t, tr + 0.35, tr + 0.75));
      const red = MathX.smooth(t, tr, tr + 0.06), pop = 1 + 1.4 * MathX.smooth(t, tr, tr + 0.5);
      const col = red > 0.5 ? '#ff4a3a' : 'rgba(255, 215, 168, 0.9)';
      put(lon, lat, `<span class="d" style="background:${red > 0.5 ? '#ff4a3a' : 'transparent'};box-shadow:0 0 0 calc(var(--u) * 3) ${col};transform:scale(${pop.toFixed(2)})"></span>` +
        `<span style="color:${red > 0.5 ? '#ff8a7a' : '#f6efe2'}">${name}</span><small style="color:${red > 0.5 ? '#ff6a5a' : '#ffd7a8'}">${red > 0.5 ? 'PORT · GONE' : 'PORT'}</small>`, a);
    });
    for (let i = out.length - 1; i >= n0; i--) { const l = out[i]; if (l.x < 0.03 || l.x > 0.8 || (l.y > 0.64 && l.y < 0.8) || l.y < 0.06 || l.y > 0.95) out.splice(i, 1); }
  }
  if (shot.id === 'T2') {
    const a = MathX.smooth(t, AF.suez, AF.suez + 0.3) * (1 - MathX.smooth(t, AF.board - 0.4, AF.board - 0.1));
    put(32.4, 30.6, '<span class="d"></span>SUEZ CANAL<small>≈ 12 % OF WORLD TRADE</small>', a);
  }
  return out;
}
