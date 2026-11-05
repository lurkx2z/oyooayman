/* =====================================================================
   FAIR KIT — what the fair's pieces share:
     nbLamps(scene, max)   light SOURCES as points (bulbs, LEDs, sparks, nav lights): a world size with a minimum size
                           on screen (a bulb 40 m away is still a dot), HDR colour, depth-tested (a body in front hides
                           it). Rewritten every frame from scratch (pure): begin(); add(x, y, z, size m, r, g, b); end()
     nbSign(text, o)       a lit sign (neon tubes or a lightbox) as a canvas texture on a plane: a SOURCE
     nbBounceLights(set)   every light that stands for light bouncing (the sun's direct light reaching a surface, the sky's
                           light, the environment) scaled by the bounce at story time s: with nothing bouncing, no
                           surface sends any light to your eyes, so everything that isn't a source renders black
   ===================================================================== */

function nbLamps(scene, max = 6000, o = {}) {
  const g = new THREE.BufferGeometry(), P = new Float32Array(max * 3), S = new Float32Array(max), C = new Float32Array(max * 3);
  const aP = new THREE.BufferAttribute(P, 3), aS = new THREE.BufferAttribute(S, 1), aC = new THREE.BufferAttribute(C, 3);
  for (const a of [aP, aS, aC]) a.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', aP); g.setAttribute('size', aS); g.setAttribute('col', aC); g.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { proj: { value: 600 }, minPx: { value: o.minPx ?? 2.2 }, maxPx: { value: o.maxPx ?? 90 }, px: { value: 1 }, k: { value: 1 }, pull: { value: o.pull ?? 0.003 } },
    vertexShader: `attribute float size; attribute vec3 col; uniform float proj, minPx, maxPx, px, k, pull; varying vec3 vC; varying float vS;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); mv.xyz *= 1.0 - pull; gl_Position = projectionMatrix * mv;   // (pulled 0.3% towards you: a bulb is never buried in its own fitting)
        float s = size * proj / max(0.05, -mv.z); float lum = max(col.r, max(col.g, col.b)); float ps = clamp(s, minPx * px * max(1.0, sqrt(lum / 3.2)), maxPx * px);   // (a very bright lamp far off still glares)
        vC = col * k * min(1.0, (s * s) / (ps * ps) * 6.0 + 0.16); vS = ps; gl_PointSize = ps * 2.2; }`,
    fragmentShader: `varying vec3 vC; varying float vS; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q) * 2.2;
        float core = 1.0 - smoothstep(0.7, 1.0, r), halo = exp(-r * r * 1.1) * 0.22; float a = core + halo; if (a < 0.004) discard;
        gl_FragColor = vec4(vC * a, 1.0); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6; scene.add(pts);
  let n = 0;
  return {
    pts, mat,
    begin(cam, px = 1) { n = 0; if (cam) mat.uniforms.proj.value = (1080 * px) / (2 * Math.tan(MathX.deg(cam.fov) / 2)); mat.uniforms.px.value = px; },
    add(x, y, z, size, r, gg, b) { if (n >= max || !(r + gg + b > 0.001)) return; P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z; S[n] = size; C[n * 3] = r; C[n * 3 + 1] = gg; C[n * 3 + 2] = b; n++; },
    addV(v, size, c, k = 1) { this.add(v.x, v.y, v.z, size, c[0] * k, c[1] * k, c[2] * k); },
    end() { g.setDrawRange(0, n); aP.needsUpdate = aS.needsUpdate = aC.needsUpdate = true; aP.updateRange && (aP.updateRange.count = n * 3); },
    get count() { return n; },
  };
}
// bulb colours (linear HDR): warm filament, cool LED, and the fair's coloured caps
const NB_BULB = {
  warm: [3.4, 2.1, 0.9], white: [3.0, 2.8, 2.5], red: [3.6, 0.45, 0.25], green: [0.5, 3.0, 0.7], blue: [0.6, 1.2, 3.8], amber: [3.6, 1.7, 0.3],
  pink: [3.4, 0.8, 2.2], cyan: [0.6, 2.8, 3.2], yellow: [3.4, 2.8, 0.6],
};
const NB_BULB_SET = ['red', 'amber', 'yellow', 'green', 'blue', 'pink', 'white', 'cyan'];

// a lit sign: text in neon tubes (o.neon) or on a lightbox, drawn on a canvas; MeshBasicMaterial (a source)
function nbSign(text, o = {}) {
  const w = o.w || 1024, h = o.h || 256, col = o.color || '#ff4a8a';
  const c = nbCanvas(w, h, (g) => {
    if (o.neon) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      g.font = `${o.italic ? 'italic ' : ''}700 ${Math.round(h * (o.fs || 0.58))}px ${o.font || 'Georgia, serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const [blur, a] of [[h * 0.14, 0.5], [h * 0.05, 0.9], [0, 1]]) { g.shadowColor = col; g.shadowBlur = blur; g.lineWidth = Math.max(4, h * 0.035); g.strokeStyle = blur ? col : '#fff6f0'; g.globalAlpha = a; g.strokeText(text, w / 2, h / 2 + 2); }
      g.globalAlpha = 1;
    } else {
      g.fillStyle = o.bg || '#fff3d6'; g.fillRect(0, 0, w, h);
      g.fillStyle = o.ink || '#b3122a'; g.font = `800 ${Math.round(h * (o.fs || 0.6))}px ${o.font || 'Arial, sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
      g.strokeStyle = o.ink || '#b3122a'; g.lineWidth = h * 0.05; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h * 0.88);
    }
  });
  const tex = nbTex(c, { repeat: false });
  const m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(o.k || 1.6, o.k || 1.6, o.k || 1.6), transparent: !!o.neon, blending: o.neon ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.neon });
  return m;
}

// the light that stands for bouncing: registered once per set, scaled every frame by b (0…1) and the shot's own needs
function nbBounceLights(S) {
  const L = { list: [], env: 1 };
  L.reg = (light, base) => { L.list.push([light, base ?? light.intensity]); return light; };
  L.apply = (b, k = 1) => { for (const [l, base] of L.list) l.intensity = base * b * k; S.scene.environmentIntensity = L.env * b * k; };
  return L;
}

// a striped awning texture
function nbStripeCanvas(a = '#d8263a', b = '#f4ece0', n = 8, w = 512, h = 256) {
  return nbCanvas(w, h, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * w / n, 0, w / n + 1, h); } g.fillStyle = "rgba(0,0,0,0.06)"; for (let i = 0; i < 400; i++) g.fillRect((i * 37) % w, (i * 91) % h, 2, 2); });
}
// a painted fairground board (the Fun House's face): a colourful scene drawn on a canvas
function nbFunFaceCanvas(w = 2048, h = 768) {
  return nbCanvas(w, h, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d3f8a'); gr.addColorStop(1, '#5a2a8a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = new RNG(77);
    for (let i = 0; i < 26; i++) { g.fillStyle = ['#ffcf3a', '#ff5a7a', '#3ad0ff', '#7aff6a', '#ff8a2a'][i % 5]; g.globalAlpha = 0.85; const x = r.range(0, w), y = r.range(0, h), s = r.range(30, 90);
      g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, rr = k % 2 ? s * 0.45 : s; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } g.closePath(); g.fill(); }
    g.globalAlpha = 1;
    // swirls
    g.strokeStyle = 'rgba(255,240,200,0.55)'; g.lineWidth = 10;
    for (let i = 0; i < 8; i++) { g.beginPath(); const cx = 120 + i * 260, cy = h * 0.8; for (let a = 0; a < 12; a += 0.1) { const rr = a * 7; g.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.6); } g.stroke(); }
    // the lettering
    g.font = 'italic 900 300px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 26; g.strokeStyle = '#2a0a12'; g.strokeText('FUN HOUSE', w / 2, h * 0.42);
    const tg = g.createLinearGradient(0, h * 0.2, 0, h * 0.62); tg.addColorStop(0, '#fff2a0'); tg.addColorStop(1, '#ff9a2a'); g.fillStyle = tg; g.fillText('FUN HOUSE', w / 2, h * 0.42);
    g.font = '700 70px Arial, sans-serif'; g.fillStyle = '#ffe6f0'; g.fillText('★ THE HALL OF MIRRORS ★ LAUGH YOURSELF SILLY ★', w / 2, h * 0.8);
  });
}
