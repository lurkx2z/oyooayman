/* =====================================================================
   NS — a neutron star (1.4 suns, 12 km radius; illustrated, the light paths exact: space.js tfLensDome):
     approach  in from 80 radii: a ball 24 km wide, its glowing crust, two hot spots at its magnetic poles. Its gravity
               bends light so much you see 76% of its surface at once: the far-side hot spot shows round the edge
               (a faint grid of latitude and longitude, added, shows the wrap)
     surface   on it (pretend): a perfectly smooth glowing plain to a flat horizon, a ruler on the ground (the tallest
               mountains are under a millimetre), the pole and you on a small deck
     sky       up: starlight falling in arrives squeezed (×1.24): every star bluer and brighter
     clocks    the whole pole, both clocks; a day sped up (the sky wheels round)
   Everything near you is in metres round the origin; the star and the sky are drawn by the lens dome at infinity.
   ===================================================================== */

// the crust (equirectangular, lat/long of the star): a glowing iron surface, faint crystal mottling, two hot polar caps
// (magnetic poles tilted 60° from the spin axis), and a grid every 30° (added for the eye)
function tfNsCanvas() {
  return tfCanvas(2048, 1024, (g, w, h) => {
    const n3 = EarthScene._noise3(CONFIG.seed + 1301), img = g.createImageData(w, h), d = img.data;
    const poles = [[0, 30], [180, -30]].map(([lo, la]) => { const a = lo * Math.PI / 180, b = la * Math.PI / 180; return [Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)]; });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const lon = (x / w) * 2 * Math.PI - Math.PI, lat = (0.5 - y / h) * Math.PI;
      const X = Math.cos(lat) * Math.cos(lon), Y = Math.sin(lat), Z = Math.cos(lat) * Math.sin(lon);
      let n = 0, a = 0.5, f = 9; for (let o = 0; o < 4; o++) { n += a * n3(X * f + 2, Y * f + 5, Z * f + 9); a *= 0.5; f *= 2.2; }
      let v = 0.55 + 0.25 * (n - 0.5);
      let hot = 0; for (const p of poles) { const c = X * p[0] + Y * p[1] + Z * p[2]; hot += Math.exp(-(1 - c) * 90) * 2.2 + Math.exp(-(1 - c) * 12) * 0.35; }
      const gl = (lat * 180 / Math.PI) / 30, gn = ((lon * 180 / Math.PI) + 180) / 30;
      const grid = Math.max(Math.exp(-Math.pow((gl - Math.round(gl)) * 30 / 0.5, 2)), Math.exp(-Math.pow((gn - Math.round(gn)) * 30 * Math.cos(lat) / 0.5, 2)));
      const i = (y * w + x) * 4;
      const r = v * 0.62 + hot * 1.0, gg = v * 0.72 + hot * 0.95, b = v * 1.0 + hot * 0.9;
      d[i] = 255 * Math.min(1, r * (1 - 0.35 * grid) + grid * 0.12); d[i + 1] = 255 * Math.min(1, gg * (1 - 0.2 * grid) + grid * 0.3); d[i + 2] = 255 * Math.min(1, b + grid * 0.25); d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

TF_SETS.ns = (app) => {
  const S = tfSet(app, { sky: '#000000', hemi: ['#000000', '#bcd0ff', 0], fov: 50, near: 0.02, far: 9000, env: ['#0a0c14', '#1c2236', '#a8c0ff'] });
  const { scene, camera: cam, hemi } = S;
  const W = tfWin, K = tfK, P = TFP.ns;
  const surfTex = tfTex(tfNsCanvas(), { repeat: false }); surfTex.wrapS = THREE.RepeatWrapping;
  const lens = tfLensDome(scene, { surface: { map: surfTex, color: '#ffffff' } });
  const uS = P.x;                                          // r_s / R
  const ROT_NS = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(2.1).multiply(new THREE.Matrix4().makeRotationX(0.5)));
  // ---- the ground near you: the crust, glowing, smooth as glass; it fades into the lens dome's far ground
  const plainU = { uK: { value: 0.8 } };
  const plain = new THREE.Mesh(new THREE.CircleGeometry(400, 96).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: plainU, transparent: true, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uK; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        float g = 0.0, a = 0.5; vec2 q = vW.xz / 0.9; for (int i = 0; i < 5; i++){ g += a * n(q); q = q * 2.2 + 3.1; a *= 0.5; }
        float r0 = length(vW.xz - cameraPosition.xz);
        vec3 c = vec3(0.62, 0.72, 1.0) * mix(0.32 + 0.5 * g, 0.55, smoothstep(8.0, 120.0, r0)) * uK;
        float r = length(vW.xz);
        gl_FragColor = vec4(c, 1.0 - smoothstep(120.0, 380.0, r)); }`,
  }));
  plain.renderOrder = -2; scene.add(plain);
  // a deck, you, the pole
  const deckM = tfStd('#24272c', 0.3, 0.85);
  tfMesh(new THREE.CylinderGeometry(1.25, 1.1, 0.12, 64), deckM, 0, 0.06, 0);
  tfMesh(new THREE.TorusGeometry(1.25, 0.03, 10, 96).rotateX(Math.PI / 2), tfStd('#8a8f96', 0.3, 0.9), 0, 0.12, 0);
  const rigG = new THREE.Group(); rigG.position.set(0, 0.12, 0); scene.add(rigG);
  const rig = tfRig(rigG);
  // a steel ruler on the ground beside the deck (10 cm, millimetre marks)
  const rulerC = tfCanvas(2048, 200, (g, w, h) => {
    g.fillStyle = '#d4d8de'; g.fillRect(0, 0, w, h); g.fillStyle = '#16181c'; g.font = '700 58px Inter, Arial, sans-serif'; g.textAlign = 'center';
    for (let mm = 0; mm <= 300; mm++) { const x = 20 + mm * (w - 40) / 300, L = mm % 10 === 0 ? 96 : mm % 5 === 0 ? 66 : 40; g.fillRect(x - 1.6, 0, 3.2, L); if (mm % 10 === 0) g.fillText(String(mm / 10), x, 168); }
  });
  const RULER = [0.75, 0.0, -1.6];
  const ruler = tfMesh(new THREE.BoxGeometry(0.31, 0.002, 0.03), [0, 0, (() => { const tx = tfTex(rulerC, { repeat: false }); return tfStd('#ffffff', 0.3, 0.2, { map: tx, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: 0.55 }); })(), 0, 0, 0].map((x) => x || tfStd('#a8adb4', 0.3, 0.9)), RULER[0], 0.001, RULER[2]);
  ruler.rotation.y = 0.5;
  const glowL = new THREE.HemisphereLight('#000000', '#c4d4ff', 1.3); scene.add(glowL);
  const E = [TF_EYE[0], TF_EYE[1] + 0.12, TF_EYE[2]], AH = tfAim(E, [rig.head[0], rig.head[1] + 0.12, rig.head[2]]), AF = tfAim(E, [rig.feet[0], rig.feet[1] + 0.12, rig.feet[2]]);
  // the approach: the camera looks at the star from r (r_s units); the star's direction in world
  const STAR_DIR = tfN3([0.15, -0.1, -1]);
  // a few bright stars in the sky you look up at: temperature (K), yaw, pitch, brightness
  const BRIGHT = [[3500, 0.55, 0.72, 1.0], [5800, 1.05, 0.62, 1.1], [10000, 1.3, 0.9, 0.9], [4500, 0.8, 0.4, 0.7], [7500, 1.42, 0.5, 0.6], [5800, 0.62, 1.0, 0.6]];
  const bright = BRIGHT.map(([T, y, p, b]) => ({ s: tfGlowSprite(scene, '#ffffff', 1), d: new THREE.Vector3(...tfDir(y, p)), c0: tfStarRGB(T), c1: tfStarRGB(T * P.blue), b }));

  const CAM = {
    approach(t) {
      const k = K(t, TF.ns - 0.3, TF.nsLand, (x) => x), dr = tfDrift(t, 0.006, 0.2, 81);
      const d = [STAR_DIR[0] + dr[0] - 0.12 * K(t, TF.ns2, TF.nsLand), STAR_DIR[1] + dr[1], STAR_DIR[2]];
      tfCam(cam, [0, 1.6, 0], [d[0], 1.6 + d[1], d[2]], tfLerp(36, 50, k), tfLerp(-4, 3, k));
    },
    surface(t) {
      // across the plain, down at the ruler, then up
      const dr = tfDrift(t, 0.004, 0.3, 83), c1 = tfCap('ns3', 1).show, c2 = tfCap('ns3', 2).show;
      let a = tfAimLerp([0.3, -0.05], tfAim(E, RULER), K(t, c1 - 0.5, c1 + 1.0));
      a = tfAimLerp(a, [0.85, 0.8], K(t, c2 - 0.4, c2 + 1.6));
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], a[0], a[1], tfLerp(tfLerp(60, 13, K(t, c1 - 0.5, c1 + 1.4)), 60, K(t, c2 - 0.4, c2 + 1.6)));
    },
    sky(t) {
      const dr = tfDrift(t, 0.004, 0.3, 85), k = K(t, TF.ns4, TF.ns5, (x) => x);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], 0.85 + 0.15 * k, tfLerp(0.8, 0.42, Ease.inOutSine(k)), 60);
    },
    clocks(t) {
      const dr = tfDrift(t, 0.004, 0.3, 87), k = K(t, TF.ns5, TF.ns5 + 1.4);
      const p = tfV(E, [E[0] - 0.35, E[1] - 0.15, E[2] + 1.15], k), mid = [rig.head[0], tfLerp(rig.head[1], 0.95, k) + 0.12, rig.head[2]];
      const a = tfAimLerp([1.0, 0.42], tfAim(p, mid), k);
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], a[0], a[1], tfLerp(64, 62, k));
    },
  };

  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      (CAM[m] || CAM.approach)(t);
      const far = m === 'approach';
      // the star's spin (slow, for the eye) and the sped-up day's sky
      const spin = (t - TF.ns) * 0.18;
      lens.U.uSpin.value.setFromMatrix4(new THREE.Matrix4().makeRotationY(spin).premultiply(new THREE.Matrix4().makeRotationX(-0.35)));
      const day = m === 'clocks' ? (tfClock(t).head - 6) / TFP.day : 0;
      lens.U.uStarRot.value.copy(ROT_NS).multiply(new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(day * Math.PI * 2 * 0.3)));
      if (far) {
        // in from 80 radii (r_s units) to 7
        const r = Math.exp(tfLerp(Math.log(30 / uS), Math.log(2.4 / uS), K(t, TF.ns - 0.3, TF.nsLand - 0.2, (x) => Math.pow(x, 1.4))));
        lens.update(cam, STAR_DIR, r, uS);
        lens.U.uSurfK.value = 1.1; lens.U.uTint.value.setRGB(1, 1, 1); lens.U.uK.value = 0.9;
      } else {
        // standing on it: the camera 1.7 m up; starlight arrives squeezed by 1/√(1 − r_s/R)
        lens.update(cam, [0, -1, 0], (P.R + 1.7) / P.rs, uS);
        lens.U.uSurfK.value = 0.55;
      }
      // the squeeze, shown: the sky as from far away, then as it really arrives here (bluer, brighter)
      const sq = far ? 0 : m === 'sky' ? K(t, tfCap('ns4', 1).show - 0.3, tfCap('ns4', 1).show + 1.6) : m === 'clocks' ? 1 : 0;
      if (!far) { const tn = tfBlueTint(P.blue); lens.U.uTint.value.setRGB(tfLerp(1, tn[0], sq), tfLerp(1, tn[1], sq), 1); lens.U.uK.value = 1.6 * tfLerp(1, P.blue, sq); }
      for (const b of bright) {
        b.s.visible = !far;
        b.s.position.copy(cam.position).addScaledVector(b.d, 3000); b.s.scale.setScalar(3000 * 0.05 * b.b * tfLerp(1, 1.12, sq));
        const k = 1.6 * tfLerp(1, P.blue, sq); b.s.material.color.setRGB(tfLerp(b.c0[0], b.c1[0], sq) * k, tfLerp(b.c0[1], b.c1[1], sq) * k, tfLerp(b.c0[2], b.c1[2], sq) * k);
      }
      plain.visible = !far; rigG.visible = !far; ruler.visible = !far;
      scene.children.forEach((o) => { if (o.isMesh && o.geometry && o.geometry.type === 'CylinderGeometry' || (o.isMesh && o.geometry.type === 'TorusGeometry')) o.visible = !far; });
      glowL.intensity = far ? 0 : 1.3; hemi.intensity = 0;
      if (!far) { const c = tfClock(t), F = tfFmtClock(c); rig.update(F, { lamp: 0, on: 1, show: m !== 'clocks' }); }
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.exposure = 0.95; p.vignette = 0.55; p.bloom = 0.5; p.bloomThreshold = 1.0; p.grain = 0.026; p.contrast = 1.08; p.saturation = 1.04;
      if (m !== 'approach') { p.exposure = 0.85; p.bloomThreshold = 1.2; }
      if (m === 'approach') p.flash = 0.6 * MathX.smooth(t, TF.nsLand - 0.5, TF.nsLand);
      if (m === 'surface') p.flash = Math.max(p.flash, 0.6 * (1 - MathX.smooth(t, TF.nsLand, TF.nsLand + 0.7)));
      p.flashColor.setRGB(0.8, 0.88, 1);
    },
    labels(t) {
      const m = tfShotAt(t).mode;
      if (m === 'approach') return [{ p: [STAR_DIR[0] * 100, 1.6 + STAR_DIR[1] * 100 + 10, STAR_DIR[2] * 100], text: 'A NEUTRON STAR', sub: '24 km WIDE · GRID LINES ADDED', a: W(t, tfCap('ns', 1).show, TF.ns2 - 0.2, 0.4, 0.3) }];
      if (m === 'surface') return [{ p: [RULER[0] + 0.05, 0, RULER[2] + 0.13], text: 'ITS TALLEST MOUNTAINS', sub: 'UNDER 1 mm', a: W(t, tfCap('ns3', 1).show + 0.6, tfCap('ns3', 2).show - 0.3, 0.4, 0.3) }];
      return [];
    },
  };
  return set;
};
