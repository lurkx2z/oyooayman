/* =====================================================================
   FX — the destruction and the speed, all pure functions of the time since each event:
     twCrackTex()                     a canvas of radiating cracks (the pavement at step 7, the craters)
     twDecal(scene, tex, size)        a flat decal on the ground (polygon offset: no z-fighting)
     twDebris(scene, n, mat)          chunks thrown out ballistically: .frame(t, events) with events
                                      [{ t, p:[x,y,z], n, v, up, size, seed }]
     twBurst(puffs, adds, t, ev)      dust, smoke, sparks, glass glints for one event into a puff pool
     twShock(scene)                   the expanding shock ring on the ground and the vapour cone around you
     twGlow(scene)                    the hot air in front of you (from Mach 4) and the trail of fire behind
   ===================================================================== */

function twCrackTex(seed = 3, S = 512, o = {}) {
  const r = new RNG(seed);
  return twTex(twCanvas(S, S, (g) => {
    g.clearRect(0, 0, S, S);
    const c = S / 2;
    if (o.crater) {
      const gr = g.createRadialGradient(c, c, 0, c, c, c * 0.62);
      gr.addColorStop(0, 'rgba(16,13,11,0.98)'); gr.addColorStop(0.55, 'rgba(40,34,28,0.9)'); gr.addColorStop(0.8, 'rgba(70,60,48,0.55)'); gr.addColorStop(1, 'rgba(90,80,66,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, c * 0.62, 0, 6.29); g.fill();
    }
    g.strokeStyle = 'rgba(14,12,10,0.95)'; g.lineCap = 'round';
    const arms = o.arms || 14;
    for (let a = 0; a < arms; a++) {
      let x = c + (o.crater ? Math.cos(a) * c * 0.3 : 0), y = c + (o.crater ? Math.sin(a) * c * 0.3 : 0), ang = (a / arms) * Math.PI * 2 + r.range(-0.2, 0.2), w = r.range(3, 7);
      const len = r.range(0.55, 0.95) * c;
      for (let s = 0; s < len; s += 9) {
        ang += r.range(-0.35, 0.35); const nx = x + Math.cos(ang) * 9, ny = y + Math.sin(ang) * 9;
        g.lineWidth = w * (1 - s / len) + 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke(); x = nx; y = ny;
        if (r.next() < 0.12) { let bx = x, by = y, ba = ang + r.range(-1.2, 1.2); for (let q = 0; q < 6; q++) { const mx = bx + Math.cos(ba) * 8, my = by + Math.sin(ba) * 8; g.lineWidth = 1.4; g.beginPath(); g.moveTo(bx, by); g.lineTo(mx, my); g.stroke(); bx = mx; by = my; ba += r.range(-0.4, 0.4); } }
      }
    }
  }), { repeat: false });
}
function twDecal(scene, tex, size, o = {}) {
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const d = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); d.rotation.x = -Math.PI / 2; d.scale.set(size, size, 1); d.receiveShadow = true; d.renderOrder = 2; d.visible = false;
  scene.add(d); return d;
}

// chunks of road and kerb: n instanced lumps; each event throws `n` of them
function twDebris(scene, n, mat) {
  const g = new THREE.DodecahedronGeometry(1, 0), I = new THREE.InstancedMesh(g, mat, n); I.castShadow = true; I.receiveShadow = true; I.frustumCulled = false; I.count = 0; scene.add(I);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
  return {
    I,
    frame(t, events, ground = 0) {
      let k = 0;
      for (const ev of events) {
        const u = t - ev.t; if (u < 0 || u > (ev.life || 9)) continue;
        for (let i = 0; i < ev.n && k < n; i++) {
          const h = (j) => hash1(ev.seed * 977 + i * 31 + j * 7);
          const a = h(1) * Math.PI * 2, el = MathX.lerp(0.35, 1.25, h(2)), sp = ev.v * MathX.lerp(0.35, 1.0, h(3));
          const vx = Math.cos(a) * Math.cos(el) * sp + (ev.dir ? ev.dir[0] * ev.v * 0.4 : 0), vz = Math.sin(a) * Math.cos(el) * sp + (ev.dir ? ev.dir[1] * ev.v * 0.4 : 0), vy = Math.sin(el) * sp * (ev.up || 1);
          // fall until the ground, then rest (slide a little)
          let tt = u, y = ev.p[1] + vy * tt - 4.9 * tt * tt;
          const tl = (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0, ev.p[1] - ground))) / 9.8;
          if (tt > tl) { tt = tl + Math.min(0.3, (tt - tl)) * 0.3; y = ground; }
          const s = ev.size * MathX.lerp(0.3, 1.0, h(4) ** 2);
          V.set(ev.p[0] + vx * tt, Math.max(ground + s * 0.5, y), ev.p[2] + vz * tt);
          E.set(h(5) * 6 + u * (h(6) - 0.5) * 9 * (u < tl ? 1 : 0), h(7) * 6, h(8) * 6); Q.setFromEuler(E); S.set(s, s * 0.7, s * 0.9);
          M.compose(V, Q, S); I.setMatrixAt(k++, M);
        }
      }
      I.count = k; I.instanceMatrix.needsUpdate = true;
    },
  };
}

// one event's particles into the puff pools (soft: dust, smoke; adds: sparks, glints, fire)
//   ev = { t, p, kind: 'dust' | 'impact' | 'glass' | 'fire', size, n, seed, dir }
function twBurst(soft, adds, t, ev, o = {}) {
  const u = t - ev.t; if (u < 0) return;
  const n = ev.n || 40, S = ev.size || 1, life = ev.life || 6;
  if (u > life) return;
  for (let i = 0; i < n; i++) {
    const h = (j) => hash1(ev.seed * 131 + i * 17 + j * 3);
    const a = h(1) * Math.PI * 2, el = h(2), sp = MathX.lerp(0.4, 1.0, h(3));
    if (ev.kind === 'dust' || ev.kind === 'impact') {
      // a ring of dust rolling out and up, slowing (drag), growing, fading
      const R = S * (2.2 * sp) * (1 - Math.exp(-u * 1.6)) * (ev.kind === 'impact' ? 2.4 : 1);
      const x = ev.p[0] + Math.cos(a) * R, z = ev.p[2] + Math.sin(a) * R, y = ev.p[1] + S * (0.2 + 1.4 * el * el) * (1 - Math.exp(-u * 1.2)) + u * 0.3 * S * el;
      const sz = S * (0.5 + 1.0 * h(4)) * (0.6 + u * 0.3), al = (ev.alpha || 0.55) * Math.exp(-u / (life * 0.45)) * MathX.smooth(u, 0, 0.08);
      const g = MathX.lerp(0.62, 0.8, h(5)) * (ev.dark ? 0.55 : 1);
      soft.add(x, y, z, sz, al, g * 1.02, g * 0.97, g * 0.9);
    } else if (ev.kind === 'glass') {
      // glints falling from a facade (p: a point on it; dir: its outward normal): out, then down, spinning (twinkle)
      const vx = (ev.dir ? ev.dir[0] : 0) * (2 + 5 * sp) + (h(6) - 0.5) * 3, vz = (ev.dir ? ev.dir[1] : 0) * (2 + 5 * sp) + (h(7) - 0.5) * 3;
      const y0 = ev.p[1] + (h(8) - 0.5) * (ev.spread || 10), x0 = ev.p[0] + (h(9) - 0.5) * (ev.wide || 10) * Math.abs(ev.dir ? ev.dir[1] : 1), z0 = ev.p[2] + (h(10) - 0.5) * (ev.wide || 10) * Math.abs(ev.dir ? ev.dir[0] : 1);
      const tg = Math.sqrt(2 * Math.max(0, y0) / 9.8); if (u > tg + 0.5) continue;
      const tt = Math.min(u, tg), y = Math.max(0.03, y0 - 4.9 * tt * tt);
      const tw = 0.5 + 0.5 * Math.sin(u * 30 + h(11) * 40);
      adds.add(x0 + vx * tt, y, z0 + vz * tt, 0.06 + 0.1 * h(12), 0.9 * tw * (u < tg ? 1 : 0.4), 0.85, 0.95, 1.0);
      if (i % 3 === 0) soft.add(x0 + vx * tt, y, z0 + vz * tt, 0.09, 0.5, 0.75, 0.85, 0.9);
    } else if (ev.kind === 'column') {
      // a column of smoke rising from a crater, fed for 14 s, leaning with the wind (east)
      const tb = h(1) * h(1) * 10, age = u - tb; if (age < 0) continue;
      const rr = S * (0.3 + 0.5 * h(3)) * (1 + age * 0.06), x = ev.p[0] + Math.cos(a) * rr + age * S * 0.05, z = ev.p[2] + Math.sin(a) * rr, y = ev.p[1] + S * 0.4 + S * 4 * (1 - Math.exp(-age * (0.08 + 0.05 * h(2))));
      const sz = S * (0.7 + 0.6 * h(4)) * (1 + age * 0.09), al = 0.5 * MathX.smooth(age, 0, 1.5) * Math.exp(-age / 30);
      const g = MathX.lerp(0.05, 0.11, h(5)) * (1 + 0.6 * Math.exp(-age / 3));   // (dark: it reads against pale roofs)
      soft.add(x, y, z, sz, al, g, g * 0.97, g * 0.95);
    } else if (ev.kind === 'fire') {
      const R = S * (0.6 + 1.3 * sp) * (1 - Math.exp(-u * 2)), x = ev.p[0] + Math.cos(a) * R, z = ev.p[2] + Math.sin(a) * R, y = ev.p[1] + S * (0.3 + 2.2 * el) * (1 - Math.exp(-u * 1.5));
      const heat = Math.exp(-u / (life * 0.25)), sz = S * (0.6 + h(4)) * (0.5 + u * 0.4);
      adds.add(x, y, z, sz * 0.8, 0.85 * heat, 1.0, 0.55 + 0.25 * h(5), 0.18);
      soft.add(x, y + S * 0.4 * u, z, sz * 1.3, 0.5 * Math.exp(-u / (life * 0.6)) * MathX.smooth(u, 0.2, 0.8), 0.16, 0.15, 0.15);
    }
  }
}

// the expanding shock ring on the ground (additive, a thin bright band and a soft wake) and the vapour cone
function twShock(scene) {
  const ringM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { k: { value: 0 }, w: { value: 0.08 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float k, w; varying vec2 vU; void main(){ float r = length(vU - 0.5) * 2.0; float a = exp(-pow((r - 0.96) / w, 2.0)) + 0.25 * smoothstep(0.98, 0.5, r) * smoothstep(0.0, 0.9, r); gl_FragColor = vec4(vec3(1.0, 0.97, 0.92) * a * k, 1.0); }',
  });
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ringM); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 6; ring.visible = false; scene.add(ring);
  // the vapour cone: a white, soft, open cone around you (its tip ahead, its mouth behind)
  const coneM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { k: { value: 0 } },
    vertexShader: 'varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ vU = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float k; varying vec2 vU; varying vec3 vN; varying vec3 vV; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } void main(){ float rim = pow(1.0 - abs(dot(vN, vV)), 1.6); float stri = 0.75 + 0.25 * sin(vU.x * 60.0 + vU.y * 7.0); float a = k * rim * stri * smoothstep(0.0, 0.25, vU.y) * smoothstep(1.0, 0.55, vU.y); gl_FragColor = vec4(vec3(0.96, 0.97, 1.0), a * 0.85); }',
  });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 2.3, 3.6, 40, 6, true), coneM); cone.renderOrder = 7; cone.visible = false; scene.add(cone);
  return {
    ring, cone,
    // the ring: centre p, radius R, strength k
    setRing(p, R, k) { ring.visible = k > 0.002 && R > 0.1; if (!ring.visible) return; ring.position.set(p[0], p[1] + 0.25, p[2]); ring.scale.set(R, R, 1); ringM.uniforms.k.value = k; },
    // the cone around a point, pointing along dir [x, y, z]
    setCone(p, dir, k, s = 1) {
      cone.visible = k > 0.002; if (!cone.visible) return;
      cone.position.set(p[0], p[1], p[2]); cone.scale.setScalar(s);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...dir).normalize());
      coneM.uniforms.k.value = k;
    },
  };
}

// the air in front of you glowing (a shell, hot side forward) and a trail of fire behind
function twGlow(scene) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { k: { value: 0 }, dir: { value: new THREE.Vector3(0, 0, 1) }, col: { value: new THREE.Color('#ffb05a') } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vN = normalize((modelMatrix * vec4(normal, 0.0)).xyz); vP = normal; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz); gl_Position = projectionMatrix * mv; }',
    // (brightest on the front, where the air is squeezed; a soft edge, so it never reads as a hard egg outline)
    fragmentShader: 'uniform float k; uniform vec3 dir, col; varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec3 N = normalize(vN); float front = smoothstep(-0.4, 1.0, dot(N, normalize(dir))); float nv = abs(dot(N, normalize(vV))), f = 1.0 - nv; float halo = pow(f, 1.6) * (1.0 - smoothstep(0.68, 1.0, f)) + 0.22 * nv; float a = k * (0.12 + 1.5 * front * front) * halo; gl_FragColor = vec4(col * a, 1.0); }',
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), m); shell.renderOrder = 8; shell.visible = false; scene.add(shell);
  return {
    shell, m,
    set(p, dir, k, size = 1.6, col) { shell.visible = k > 0.002; if (!shell.visible) return; shell.position.set(p[0], p[1], p[2]); shell.scale.set(size * 0.75, size, size * 0.75); m.uniforms.k.value = k; m.uniforms.dir.value.set(...dir).normalize(); if (col) m.uniforms.col.value.set(col); },
  };
}
