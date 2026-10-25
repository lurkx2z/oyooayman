/* =====================================================================
   WD — Sirius B, the white dwarf next to the brightest star in our sky (illustrated; the numbers are physics.js's):
     approach   out of the starfield towards Sirius: Sirius A blazing, Sirius B a small white point that grows into a
                ball the size of the Earth, glowing at 25,000 °C (blue-white)
     surface    standing on it (pretend): a glowing plain to a flat horizon, a black sky, Sirius A a brilliant star; you
                and the pole lit from below
     clocks     the two clocks; a day sped up (the sky wheels round)
     stretched  far away again, as the Hubble telescope saw it: Sirius A with its diffraction spikes, B a faint dot beside
                it (hud.js draws the stretched spectrum line over it)
   Units: approach and stretched in km (Sirius B's radius 6,010 km at the origin); the surface in metres, also round the
   origin (the star's model is hidden then).
   ===================================================================== */

// a white dwarf's face: hot hydrogen, nearly featureless, faint mottling
function tfWdCanvas() {
  return tfCanvas(1024, 512, (g, w, h) => {
    const n3 = EarthScene._noise3(CONFIG.seed + 1201), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const lon = (x / w) * 6.2832, lat = (0.5 - y / h) * Math.PI, X = Math.cos(lat) * Math.cos(lon), Y = Math.sin(lat), Z = Math.cos(lat) * Math.sin(lon);
      let n = 0, a = 0.5, f = 6; for (let o = 0; o < 5; o++) { n += a * n3(X * f + 3, Y * f + 7, Z * f + 1); a *= 0.5; f *= 2.1; }
      const v = 0.86 + 0.34 * (n - 0.5), i = (y * w + x) * 4;
      d[i] = 255 * v * 0.86; d[i + 1] = 255 * v * 0.92; d[i + 2] = 255 * v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// a bright star as a telescope sees it: a core, a halo, four diffraction spikes
function tfSpikeTex() {
  return tfTex(tfCanvas(512, 512, (g, w) => {
    const c = w / 2;
    const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.04, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.12, 'rgba(200,220,255,0.35)'); gr.addColorStop(0.4, 'rgba(160,190,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.globalCompositeOperation = 'lighter';
    for (const a of [0, Math.PI / 2]) {
      g.save(); g.translate(c, c); g.rotate(a + Math.PI / 4);
      const lg = g.createLinearGradient(-c, 0, c, 0); lg.addColorStop(0, 'rgba(180,200,255,0)'); lg.addColorStop(0.5, 'rgba(230,240,255,0.9)'); lg.addColorStop(1, 'rgba(180,200,255,0)');
      g.fillStyle = lg; g.fillRect(-c, -2.5, w, 5); g.restore();
    }
  }), { repeat: false });
}

TF_SETS.wd = (app) => {
  const S = tfSet(app, { sky: '#000000', hemi: ['#000000', '#cfe0ff', 0], fov: 50, near: 1, far: 5e6, env: ['#0a0c12', '#20283a', '#cfe0ff'] });
  const { scene, camera: cam, hemi } = S;
  const W = tfWin, K = tfK;
  const stars = tfStarDome(scene, { k: 0.8, r: 4e6 });
  const ROT_WD = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationX(0.9));
  // ---- Sirius B (km), and Sirius A far beyond it: 20 AU off to one side (a blazing point with a halo)
  const R = TFP.wd.R / 1000;
  const wdU = { uMap: { value: tfTex(tfWdCanvas(), { repeat: false }) }, uK: { value: 1.0 } };
  const wdM = new THREE.ShaderMaterial({
    uniforms: wdU,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D uMap; uniform float uK; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ float mu = max(0.0, dot(normalize(vN), normalize(cameraPosition - vW)));
        vec3 c = texture2D(uMap, vUv).rgb * uK * (0.3 + 0.7 * pow(mu, 0.7));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const wd = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), wdM); scene.add(wd);
  const wdGlow = tfGlowSprite(scene, '#bcd2ff', R * 3.2); wdGlow.material.opacity = 0.5;
  const A_DIR = new THREE.Vector3(0.138, -0.05, -0.99).normalize(), A_SURF = new THREE.Vector3(-0.55, 0.2, -1).normalize();
  const sirA = tfGlowSprite(scene, '#e4eeff', 1); const sirAhalo = tfGlowSprite(scene, '#9fbcff', 1); sirAhalo.material.opacity = 0.45;
  const spikeM = new THREE.SpriteMaterial({ map: tfSpikeTex(), color: new THREE.Color(1.3, 1.4, 1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const spike = new THREE.Sprite(spikeM); spike.renderOrder = -4; scene.add(spike);
  const spikeB = new THREE.Sprite(new THREE.SpriteMaterial({ map: tfDotTex(0.2), color: new THREE.Color(1.1, 1.2, 1.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); scene.add(spikeB);

  // ---- the surface (metres): a glowing plain, a platform, you
  const SURF = new THREE.Group(); scene.add(SURF);   // (at the origin too: the star's model is hidden while you're down here)
  const plainU = { uT: { value: 0 }, uK: { value: 0.82 } };
  const plain = new THREE.Mesh(new THREE.CircleGeometry(60000, 128).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: plainU, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT, uK; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz;
        float g = 0.0, a = 0.5; vec2 q = p / 2.2 + vec2(uT * 0.05, 0.0);
        for (int i = 0; i < 5; i++){ g += a * n(q); q = q * 2.1 + 5.3; a *= 0.5; }
        float far = length(p - cameraPosition.xz);
        float v = mix(0.62 + 0.62 * g, 0.95, smoothstep(30.0, 600.0, far));
        v *= mix(0.86, 1.18, smoothstep(200.0, 4000.0, far));
        gl_FragColor = vec4(vec3(0.82, 0.9, 1.0) * v * uK, 1.0); }`,
  }));
  SURF.add(plain);
  // a low hovering deck (the same idea as the black hole's platform, plainer) so your feet have somewhere to be
  const deckM = tfStd('#2a2d32', 0.35, 0.8);
  tfMesh(new THREE.CylinderGeometry(1.25, 1.1, 0.12, 64), deckM, 0, 0.06, 0, SURF);
  tfMesh(new THREE.TorusGeometry(1.25, 0.03, 10, 96).rotateX(Math.PI / 2), tfStd('#8a8f96', 0.3, 0.9), 0, 0.12, 0, SURF);
  const rigG = new THREE.Group(); rigG.position.set(0, 0.12, 0); SURF.add(rigG);
  const rig = tfRig(rigG);
  const glowL = new THREE.HemisphereLight('#000000', '#d8e6ff', 1.4); scene.add(glowL);
  const aL = new THREE.DirectionalLight('#e8f0ff', 1.2); scene.add(aL); scene.add(aL.target);
  const E = [TF_EYE[0], TF_EYE[1] + 0.12, TF_EYE[2]], AH = tfAim(E, [rig.head[0], rig.head[1] + 0.12, rig.head[2]]), AF = tfAim(E, [rig.feet[0], rig.feet[1] + 0.12, rig.feet[2]]), AFEET = tfAim(E, [0.02, 0.15, -0.3]);
  const AA = [Math.atan2(-A_SURF.x, -A_SURF.z), Math.asin(A_SURF.y)];
  const sw = (p) => p;
  const P = TFP.wd;

  const CAM = {
    approach(t) {
      // from 200,000 km in to just above the surface; Sirius A off to the left
      const k = K(t, TF.wd - 0.3, TF.wdLand, (x) => Math.pow(x, 1.6)), d = Math.exp(tfLerp(Math.log(200000), Math.log(R * 1.9), k));
      const side = new THREE.Vector3(0.3, 0.12, 1).normalize();
      const p = side.clone().multiplyScalar(d);
      const at = new THREE.Vector3().lerpVectors(A_DIR.clone().multiplyScalar(d * 0.35), new THREE.Vector3(0, 0, 0), K(t, TF.wd, TF.wd + 3.5));
      tfCam(cam, p.toArray(), at.toArray(), tfLerp(40, 52, k));
    },
    surface(t) {
      // your eyes: out over the plain to Sirius A, then down at the pole and your feet
      const dr = tfDrift(t, 0.004, 0.3, 71), c1 = tfCap('wd2', 1).show;
      const a = tfAimLerp([AA[0] - 0.1 + 0.05 * K(t, TF.wdLand, TF.wd2), AA[1] - 0.12], [tfLerp(AF[0], AFEET[0], 0.45), tfLerp(AF[1], AFEET[1], 0.45)], K(t, TF.wd2 - 0.6, TF.wd2 + 1.8));
      tfLook(cam, sw([E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]]), a[0], a[1], tfLerp(tfLerp(58, 54, K(t, TF.wd2 - 0.6, TF.wd2 + 1.8)), 46, K(t, c1 - 0.4, c1 + 2.4)));
    },
    clocks(t) {
      // a step back: the whole pole, both clocks (you've stepped out of the shot)
      const dr = tfDrift(t, 0.004, 0.3, 73), k = K(t, TF.wd3, TF.wd3 + 1.4);
      const p = tfV(E, [E[0] - 0.35, E[1] - 0.15, E[2] + 1.15], k), mid = [rig.head[0], tfLerp(rig.head[1], 0.95, k) + 0.12, rig.head[2]];
      const a = tfAim(p, mid);
      tfLook(cam, sw([p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]]), a[0], a[1], tfLerp(40, 62, k));
    },
    stretched(t) {
      // far off (the telescope's view): A blazing with its spikes, B a faint dot beside it
      const k = K(t, TF.wd4 - 0.3, TF.ns, (x) => x);
      const p = A_DIR.clone().multiplyScalar(-2.4e6).add(new THREE.Vector3(0, 0, 0));
      const at = A_DIR.clone().multiplyScalar(0.0);
      tfCam(cam, p.toArray(), at.toArray(), tfLerp(14, 11, k));
    },
  };

  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      (CAM[m] || CAM.approach)(t);
      const onS = m === 'surface' || m === 'clocks';
      SURF.visible = onS; wd.visible = wdGlow.visible = !onS;
      const near = onS ? 0.02 : 1; if (cam.near !== near) { cam.near = near; cam.updateProjectionMatrix(); }
      stars.follow(cam);
      // the sky wheels round in the sped-up day
      const day = m === 'clocks' ? (tfClock(t).head - 6) / TFP.day : 0;
      stars.U.uRot.value.copy(ROT_WD).multiply(new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(day * Math.PI * 2 * 0.25)));
      stars.U.uK.value = onS ? 0.5 : 0.8;
      // Sirius A: 20 AU away (a point; its glow drawn at a fixed angular size)
      const D = cam.position.clone().addScaledVector((onS ? A_SURF : A_DIR).clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), day * Math.PI * 2 * 0.25), 3e6);
      sirA.position.copy(D); sirAhalo.position.copy(D);
      sirA.scale.setScalar(3e6 * (onS ? 0.014 : 0.02)); sirAhalo.scale.setScalar(3e6 * (onS ? 0.09 : 0.12));
      sirA.visible = sirAhalo.visible = m !== 'stretched';
      spike.visible = spikeB.visible = m === 'stretched';
      if (m === 'stretched') {
        // (in the telescope view A and B are 8 arcseconds apart; drawn far wider to be seen)
        const a = cam.position.clone().multiplyScalar(-1).normalize();
        const right = new THREE.Vector3().crossVectors(a, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, a);
        const c = cam.position.clone().addScaledVector(a, 2e6);
        spike.position.copy(c).addScaledVector(right, 0.06e6).addScaledVector(up, 0.03e6); spike.scale.setScalar(0.42e6);
        spikeB.position.copy(c).addScaledVector(right, -0.11e6).addScaledVector(up, -0.06e6); spikeB.scale.setScalar(0.025e6);
        wd.visible = wdGlow.visible = false;
      }
      // the platform's world: the plain glows, lighting you from below
      plainU.uT.value = t;
      glowL.intensity = onS ? 1.4 : 0; hemi.intensity = 0;
      aL.position.copy(cam.position).addScaledVector(A_DIR, 100); aL.target.position.copy(cam.position); aL.intensity = onS ? 1.0 : 0;
      if (onS) {
        const c = tfClock(t), F = tfFmtClock(c);
        rig.update(F, { lamp: 0, on: 1, show: m !== 'clocks' });
      }
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.exposure = 0.95; p.vignette = 0.55; p.bloom = 0.55; p.bloomThreshold = 1.0; p.grain = 0.026; p.contrast = 1.08; p.saturation = 1.0;
      if (m === 'surface' || m === 'clocks') { p.exposure = 0.8; p.bloom = 0.7; p.bloomThreshold = 1.3; }
      if (m === 'approach') { p.flash = 0.6 * MathX.smooth(t, TF.wdLand - 0.5, TF.wdLand) ; p.flashColor.setRGB(0.85, 0.92, 1); }
      if (m === 'surface') p.flash = Math.max(p.flash, 0.6 * (1 - MathX.smooth(t, TF.wdLand, TF.wdLand + 0.7)));
    },
    labels(t) {
      const m = tfShotAt(t).mode;
      if (m === 'approach') return [{ p: cam.position.clone().addScaledVector(A_DIR, 3e6).toArray(), text: 'SIRIUS A', sub: 'THE BRIGHTEST STAR IN OUR SKY', a: W(t, TF.wd + 0.8, tfCap('wd', 0).hide - 0.2, 0.4, 0.3) }, { p: [0, R * 1.05, 0], text: 'SIRIUS B', sub: 'THE SIZE OF THE EARTH', a: W(t, tfCap('wd', 1).show, TF.wdLand - 0.6, 0.4, 0.3) }];
      if (m === 'stretched') { return []; }
      return [];
    },
  };
  return set;
};
