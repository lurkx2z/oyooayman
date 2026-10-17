/* =====================================================================
   FILM — "What if your car could fly?" (Tesla's flying Roadster, explained)
     build(app)    every set (each its own THREE.Scene + camera), the HUD (title, readouts, word-timed subtitles,
                   tags, the three-ways chips, the verdict panel, pinned labels), the soundtrack
     update(app,t) the shot's set and camera (shots.js), the HUD
     view(app,t)   [the shot's scene, its camera]
     grade(t,p)    per set; the cuts (a 2-frame dip), the landings' hits, the final fade
   Sets register themselves in TR_SET_BUILDERS: name → (app) => { scene, camera, frame(t, shot, app), grade?(t, p) }.
   ===================================================================== */

const TR_SET_BUILDERS = {};

// a soft gradient environment map for a set's reflections
function trEnv(renderer, top, mid, low) {
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
    for (const [name, f] of Object.entries(TR_SET_BUILDERS)) app.sets[name] = f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    this._hudExtras(app);
    app.audio = new TrAudio(app.tl, app);
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
    app.ways = mk('tr-ways', ['WING', 'SUCTION', 'THRUST'].map((w, i) => `<div class="w"><b>${i + 1}</b>${w}</div>`).join(''));
    app.verdict = mk('tr-verdict', `<div class="col"><div class="h ok">SHOWN</div>${TR_VERDICT.shown.map((x) => `<div class="i">✓ ${x}</div>`).join('')}</div>` +
      `<div class="col"><div class="h pr">STILL A PROMISE</div>${TR_VERDICT.promised.map((x) => `<div class="i">○ ${x}</div>`).join('')}</div>`);
    app.vItems = [...app.verdict.querySelectorAll('.i')]; app.vHeads = [...app.verdict.querySelectorAll('.h')];
    app.labs = [];
    for (let i = 0; i < 8; i++) app.labs.push(mk('af-lab', ''));
  },

  update(app, t) {
    const shot = trShotAt(t);
    FILM._shot = shot;
    const set = app.sets[shot.set];
    set.frame(t, shot, app);
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
    const W = trWayAt(t);
    app.ways.style.opacity = W ? W.a.toFixed(3) : '0';
    if (W) [...app.ways.children].forEach((el, i) => { el.style.opacity = W.seen[i] ? (W.on === i ? '1' : W.on < 0 ? '0.85' : '0.38') : '0'; el.classList.toggle('on', W.on === i); });
    const va = StoryHUD.win(t, TR.real + 0.2, TR.pov - 0.2, 0.3, 0.3);
    app.verdict.style.opacity = va.toFixed(3);
    if (va > 0) {
      const at = ['clings', 'jumps', 'closed'].map((w) => trW(18, w).start - 0.1).concat([trW(18, 'production').start - 0.1, trW(18, 'flying').start - 0.1]);
      app.vItems.forEach((el, i) => { el.style.opacity = t >= at[i] ? '1' : '0'; });
      app.vHeads[1].style.opacity = t >= TR.promise ? '1' : '0';
    }
    const R = trReadoutAt(t);
    app.ro.style.opacity = R ? R.a.toFixed(3) : '0';
    if (R) {
      app.ro.children[0].textContent = R.label; app.ro.children[1].innerHTML = R.value; app.ro.children[2].textContent = R.sub || '';
    }
    const G = trTagAt(t);
    app.tag.style.opacity = G ? G.a.toFixed(3) : '0';
    if (G) app.tag.textContent = G.text;
    const L = (set.labels ? set.labels(t, shot, app) : []) || [];
    app.labs.forEach((el, i) => {
      const l = L[i];
      if (!l) { el.style.opacity = '0'; return; }
      el.style.opacity = l.a.toFixed(3); el.innerHTML = l.html;
      el.style.left = (l.x * 100).toFixed(2) + '%'; el.style.top = (l.y * 100).toFixed(2) + '%';
    });
  },

  view(app, t) {
    const set = FILM._set || app.sets.site;
    return [set.scene, set.camera];
  },

  grade(t, p) {
    const shot = FILM._shot || TR_SHOTS[0];
    if (!FILM._cuts) FILM._cuts = trCutTimes();
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.08; p.contrast = 1.06; p.warmth = 0.0; p.blackLift = 0.006;
    p.vignette = 0.5; p.soft = 0.08; p.bloom = 0.28; p.bloomThreshold = 1.1; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    const set = FILM._set;
    if (set && set.grade) set.grade(t, p, shot);
    // every cut: a 2-frame dip
    for (const c of FILM._cuts) if (Math.abs(t - c) < 0.07) p.fade = Math.max(p.fade, 0.3 * (1 - Math.abs(t - c) / 0.07));
    // the end: the music cuts to silence, the picture to black
    p.fade = Math.max(p.fade, MathX.smooth(t, TR.end - 0.6, TR.end - 0.05));
  },

  debug(app, t) { const s = FILM._shot; return `shot ${s ? s.id : '-'} · set ${s ? s.set : '-'}`; },
};

