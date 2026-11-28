/* =====================================================================
   FX — the earthquake's debris, dust, smoke, fire and glass, all pure functions of the time since each event
   (from the twice-as-long film's fx.js, renamed eq*, plus this film's own):
     eqCrackTex()                     a canvas of radiating cracks
     eqDecal(scene, tex, size)        a flat decal on the ground (polygon offset: no z-fighting)
     eqDebris(scene, n, mat)          chunks thrown out ballistically: .frame(t, events, ground)
     eqBurst(puffs, adds, t, ev)      dust, smoke columns, fire, glass glints for one event into the puff pools
     eqCityFx(soft, adds, s, city)    the whole city from the air: dust where each building falls, the fires' smoke
                                      columns (from minute six), the haze of dust that grows over everything
   Particle alpha is clamped to 1 by the pools (eqPuffs.add).
   ===================================================================== */

function eqCrackTex(seed = 3, S = 512, o = {}) {
  const r = new RNG(seed);
  return eqTex(eqCanvas(S, S, (g) => {
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
function eqDecal(scene, tex, size, o = {}) {
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const d = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); d.rotation.x = -Math.PI / 2; d.scale.set(size, size, 1); d.receiveShadow = true; d.renderOrder = 2; d.visible = false;
  scene.add(d); return d;
}

// chunks of road and kerb: n instanced lumps; each event throws `n` of them
function eqDebris(scene, n, mat) {
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
function eqBurst(soft, adds, t, ev, o = {}) {
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
      const tg = Math.sqrt(2 * Math.max(0, y0) / 9.8); if (u > tg + (ev.linger ?? 0.5)) continue;   // (linger: the shards glitter on the ground)
      const tt = Math.min(u, tg), y = Math.max(0.03, y0 - 4.9 * tt * tt);
      const tw = 0.5 + 0.5 * Math.sin(u * 30 + h(11) * 40);
      const gs = ev.gs || 1, lg = u < tg ? 1 : 0.4 * (1 - MathX.smooth(u - tg, (ev.linger ?? 0.5) * 0.6, ev.linger ?? 0.5));
      adds.add(x0 + vx * tt, y, z0 + vz * tt, (0.06 + 0.1 * h(12)) * gs, 0.9 * tw * lg, 0.85, 0.95, 1.0);
      if (i % 3 === 0) soft.add(x0 + vx * tt, y, z0 + vz * tt, 0.09 * gs, 0.5 * (u < tg ? 1 : lg * 2), 0.75, 0.85, 0.9);
    } else if (ev.kind === 'column') {
      // a column of smoke rising from a crater, fed for 14 s, leaning with the wind (east)
      // (a steady fire: ev.period > 0 keeps the column fed for as long as the event lives)
      const P = ev.period || 0; let age = P ? (u + h(1) * P) % P : u - h(1) * h(1) * 10;
      if (age < 0 || (P && age > u)) continue;
      const rr = S * (0.3 + 0.5 * h(3)) * (1 + age * 0.06), x = ev.p[0] + Math.cos(a) * rr + age * S * 0.05, z = ev.p[2] + Math.sin(a) * rr, y = ev.p[1] + S * 0.4 + S * 4 * (1 - Math.exp(-age * (0.08 + 0.05 * h(2))));
      const sz = S * (0.7 + 0.6 * h(4)) * (1 + age * 0.09), al = 0.5 * MathX.smooth(age, 0, 1.5) * Math.exp(-age / 30);
      const g = MathX.lerp(0.05, 0.11, h(5)) * (1 + 0.6 * Math.exp(-age / 3));   // (dark: it reads against pale roofs)
      soft.add(x, y, z, sz, al, g, g * 0.97, g * 0.95);
    } else if (ev.kind === 'flame') {
      // a steady fire (flickering tongues at its foot, for as long as it lives)
      const ph = (u * (0.8 + 0.6 * h(3)) + h(4)) % 1, x = ev.p[0] + Math.cos(a) * S * 0.8 * h(5), z = ev.p[2] + Math.sin(a) * S * 0.8 * h(5), y = ev.p[1] + S * 1.6 * ph;
      adds.add(x, y, z, S * (0.8 - 0.5 * ph), 0.8 * (1 - ph) * MathX.smooth(u, 0, 1.5), 1.0, 0.5 + 0.3 * (1 - ph), 0.15);
    } else if (ev.kind === 'fire') {
      const R = S * (0.6 + 1.3 * sp) * (1 - Math.exp(-u * 2)), x = ev.p[0] + Math.cos(a) * R, z = ev.p[2] + Math.sin(a) * R, y = ev.p[1] + S * (0.3 + 2.2 * el) * (1 - Math.exp(-u * 1.5));
      const heat = Math.exp(-u / (life * 0.25)), sz = S * (0.6 + h(4)) * (0.5 + u * 0.4);
      adds.add(x, y, z, sz * 0.8, 0.85 * heat, 1.0, 0.55 + 0.25 * h(5), 0.18);
      soft.add(x, y + S * 0.4 * u, z, sz * 1.3, 0.5 * Math.exp(-u / (life * 0.6)) * MathX.smooth(u, 0.2, 0.8), 0.16, 0.15, 0.15);
    }
  }
}


// ---------------------------------------------------------------------------------------------------------------------
// THE CITY FROM THE AIR: for every building that has started to fall (the city's info list: { x, z, y, h, w, sf }),
// a cloud of dust rolling out from its foot for 20 s; from minute six, fires (a smoke column and flames) at a few
// hundred of the fallen ones. Only what is within `range` of the camera, and at most `max` events.
// ---------------------------------------------------------------------------------------------------------------------
const EQ_FIRE_S0 = 311.5;                                                     // "And the fires are starting again."
function eqCityFx(soft, adds, s, info, cam, o = {}) {
  const range = o.range || 6000, max = o.max || 260, cx = cam.position.x, cz = cam.position.z;
  let n = 0;
  for (let i = 0; i < info.length && n < max; i++) {
    const b = info[i], u = s - b.sf; if (u < 0 || u > 40) continue;
    const d = Math.hypot(b.x - cx, b.z - cz); if (d > range) continue;
    if (d > 2500 && i % 3) continue;
    n++;
    const S = Math.max(8, b.w * 0.6 + b.h * 0.15);
    eqBurst(soft, adds, s, { t: b.sf + 0.6, p: [b.x, b.y + 2, b.z], kind: 'dust', size: S, n: d < 1500 ? 14 : 6, seed: i * 7 + 1, life: 40, alpha: 0.5 });
  }
  if (s > EQ_FIRE_S0) {
    let k = 0;
    for (let i = 0; i < info.length && k < (o.fires || 70); i += 37) {
      const b = info[i]; if (s < b.sf + 6 || (s < EQ_FIRE_S0 + 2 && i % 2)) continue;
      const d = Math.hypot(b.x - cx, b.z - cz); if (d > range * 1.3) continue;
      k++;
      const t0 = Math.max(b.sf + 6, EQ_FIRE_S0 + (i % 11) * 0.7), S = 22 + b.h * 0.25;
      eqBurst(soft, adds, s, { t: t0, p: [b.x, b.y + b.h * 0.15, b.z], kind: 'column', size: S, n: d < 2500 ? 22 : 12, seed: i * 13 + 5, life: 300, period: 36 });
      if (d < 3500) eqBurst(soft, adds, s, { t: t0, p: [b.x, b.y + 1, b.z], kind: 'flame', size: S * 0.45, n: 8, seed: i * 17 + 3, life: 300 });
    }
  }
}
