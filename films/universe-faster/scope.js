/* =====================================================================
   SCOPE — Saturn in your telescope's eyepiece (enlarged: a backyard telescope shows it smaller). Its rings are tilted
   9° to us this autumn (they were edge-on in March 2025, so they look thin). Titan, its largest moon, is the dot to
   the side. The air above the garden makes it shimmer; the sky turns, so it drifts across the field.
     saturn0   7:29: Saturn as it is
     saturn1   9:32 → 9:35 (the night sped up): smaller, redder, dimmer (uxSaturnSeen); over the edge at 9:34, it
               still shines with the light already on its way
   ===================================================================== */

function uxSaturnCanvas() {
  const W = 1024, H = 512, cx = W / 2, cy = H / 2, R = 150, B = Math.sin(9 * Math.PI / 180);
  return uxCanvas(W, H, (g) => {
    g.clearRect(0, 0, W, H);
    // the rings (ratios of Saturn's radius: C 1.24–1.53, B 1.53–1.95, Cassini 1.95–2.02, A 2.02–2.27)
    const ring = (half) => {
      g.save(); g.translate(cx, cy); g.rotate(-0.08); g.scale(1, B);
      g.beginPath(); if (half) g.rect(-W, 0, 2 * W, H / B); else g.rect(-W, -H / B, 2 * W, 2 * H / B); g.clip();
      for (const [r0, r1, col, a] of [[1.24, 1.53, '150,135,110', 0.35], [1.53, 1.95, '228,212,176', 0.95], [2.02, 2.27, '205,190,158', 0.8]]) {
        for (let k = 0; k < 24; k++) { const rr = R * (r0 + (r1 - r0) * (k + 0.5) / 24); g.strokeStyle = `rgba(${col},${(a * (0.82 + 0.18 * Math.sin(k * 2.7))).toFixed(3)})`; g.lineWidth = R * (r1 - r0) / 24 + 1; g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.stroke(); }
      }
      g.restore();
    };
    ring(false);
    // the globe: bands, limb darkening; the rings' shadow across it
    g.save(); g.translate(cx, cy); g.rotate(-0.08); g.scale(1, 0.9);
    const gr = g.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.1, 0, 0, R);
    gr.addColorStop(0, '#f2e2b4'); gr.addColorStop(0.7, '#d9c08a'); gr.addColorStop(1, '#7a6440');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'multiply';
    for (const [y, h, c] of [[-0.62, 0.1, '#c9b07c'], [-0.38, 0.12, '#bfa070'], [-0.12, 0.09, '#d8c294'], [0.22, 0.14, '#c2a676'], [0.5, 0.1, '#b89a6c']]) { g.fillStyle = c; g.fillRect(-R, y * R, 2 * R, h * R); }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(30,22,12,0.45)'; g.fillRect(-R, -0.2 * R, 2 * R, 0.07 * R);
    g.restore();
    // the near half of the rings, over the globe
    ring(true);
  });
}

UX_SETS.scope = (app) => {
  const S = uxSet(app, { sky: '#000000', fov: 30, near: 0.1, far: 100, hemi: ['#000000', '#000000', 0] });
  const scene = S.scene, cam = S.camera;
  uxCam(cam, [0, 0, 0], [0, 0, -10], 30);
  const tex = uxTex(uxSaturnCanvas(), { repeat: false });
  const U = { uMap: { value: tex }, uC: { value: new THREE.Color(1, 1, 1) }, uT: { value: 0 }, uSee: { value: 1 } };
  const sat = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec3 uC; uniform float uT, uSee; varying vec2 vUv;
      void main() {
        // the seeing: the air bends the image a little, fast and in patches
        vec2 o = uSee * 0.0035 * vec2(sin(vUv.y * 31.0 + uT * 23.0) + 0.6 * sin(vUv.y * 67.0 - uT * 41.0), sin(vUv.x * 27.0 - uT * 19.0) + 0.5 * sin(vUv.x * 53.0 + uT * 37.0));
        vec4 c = texture2D(uMap, vUv + o) * 0.6 + texture2D(uMap, vUv + o * 1.6 + vec2(0.0015, 0.0)) * 0.4;
        gl_FragColor = vec4(c.rgb * uC, c.a);
      }`,
  }));
  scene.add(sat);
  const titan = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: uxDotTex(0.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.9, 0.82, 0.62) }));
  scene.add(titan);
  // the eyepiece: a soft-edged round field, the barrel's dark rim around it
  const fieldTex = uxTex(uxCanvas(1024, 1024, (g, w) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, w);
    const gr = g.createRadialGradient(w / 2, w / 2, w * 0.36, w / 2, w / 2, w * 0.5);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.78, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.92, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.arc(w / 2, w / 2, w * 0.455, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(70,74,82,0.22)'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, w / 2, w * 0.47, 0, Math.PI * 2); g.stroke();
  }), { repeat: false });
  const mask = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fieldTex, transparent: true, depthWrite: false, depthTest: false }));
  mask.renderOrder = 10; mask.position.set(0, 0, -5); scene.add(mask);
  // (the black outside the field: the field texture covers a square; the rest of the 16:9 frame is plain black)
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: '#000', depthTest: false })); sideL.renderOrder = 11; scene.add(sideL);
  const sideR = sideL.clone(); scene.add(sideR);
  const faint = new THREE.Group(); scene.add(faint);
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: uxDotTex(0.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.35, 0.36, 0.4) })); s.position.set((uxR(i, 81) - 0.5) * 4.4, (uxR(i, 82) - 0.5) * 4.4, -10); s.scale.setScalar(0.04); faint.add(s); }

  return {
    scene, camera: cam,
    frame(t, shot) {
      const n = Math.max(0, uxNight(t)), vt = uxVis(t);
      // the field: 5 units wide at z = −5 is about 53° here; the eyepiece circle fills the frame's height
      const fh = 2 * 5 * Math.tan(MathX.deg(cam.fov / 2)); mask.scale.setScalar(fh * 1.0);
      sideL.position.set(-fh / 2 - 5 - 0.0, 0, -4.9); sideR.position.set(fh / 2 + 5, 0, -4.9);
      const Sx = shot.mode === 'saturn1' ? uxSaturnSeen(n) : { size: 1, stretch: 1, bright: 1 };
      const c = uxStretchedBB(5772, Sx.stretch).rgb, c0 = UX_BB.at(5772).rgb, b = MathX.clamp(Math.pow(Sx.bright, 0.38), 0, 1.2);
      const tint = c.map((x, i) => x / c0[i]), mx = Math.max(...tint);
      U.uC.value.setRGB(...tint.map((x) => x / mx * b * 1.15)); U.uT.value = t; U.uSee.value = 1;
      // the drift across the field (the Earth turns), and you nudging the telescope back after it
      const t0 = shot.t0, u = t - t0, dx = 0.55 - ((u * 0.045) % 1.1), dy = -0.12 + 0.05 * Math.sin(u * 0.3);
      const sz = 1.9 * Sx.size;
      sat.scale.set(sz, sz, 1); sat.position.set(dx, dy, -10);
      titan.position.set(dx + 2.6 * Sx.size, dy - 0.32 * Sx.size, -10); titan.scale.setScalar(0.06); titan.material.color.setRGB(0.9 * b * tint[0] / mx, 0.82 * b * tint[1] / mx, 0.62 * b * tint[2] / mx);
      faint.position.set(dx * 0.98, dy, 0);
      this._sat = [dx, dy + 0.62 * Sx.size, -10];
    },
    grade(t, p) { p.exposure = 1.05; p.bloom = 0.5; p.bloomThreshold = 0.7; p.vignette = 0.2; p.grain = 0.03; p.saturation = 1.0; p.soft = 0.12; },
    labels(t) {
      const s = uxShotAt(t);
      if (s.mode === 'saturn1' && t >= UX.satGone - 0.2) return [{ p: this._sat, text: 'SATURN', sub: 'OVER THE EDGE · ITS LIGHT STILL ARRIVING', a: StoryHUD.win(t, UX.satGone - 0.2, UX.blue - 0.2, 0.4, 0.3) }];
      return [];
    },
  };
};
