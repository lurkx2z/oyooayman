/* =====================================================================
   WATER — the stylised water pieces this film needs (all pure functions of time):
     nstWaterMat(opts)   glossy see-through water with a Fresnel edge (Look skips it: it has its own onBeforeCompile)
     NstPuddle           a sessile drop that can slump into a spreading thin film (polar mesh, volume kept)
     NstStream           a falling stream: smooth glassy column (normal) → ragged, fraying, breaking up (no surface tension)
     NstSpray            soft spray / mist particles (instanced billboards, hashed lifetimes)
     nstWetLook(m, k)    bead → wet film look (darker, glossy)
     nstSpreadR(V, dt)   gravity–viscous spreading radius of a film (Huppert: R ∝ (g V³ t / ν)^(1/8))
   ===================================================================== */

// brightness of what water's rim mirrors (1 indoors / by day; film.js lowers it at night and in the storm)
const NST_RIM = { value: 1 };

function nstWaterMat({ color = '#a9c3cc', opacity = 0.32, fres = 0.6, rough = 0.03, env = 1.4, side = THREE.FrontSide, name = 'nstWater', depthWrite = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.0, transparent: true, opacity, depthWrite, side, name, envMapIntensity: env });
  m.userData.fres = { value: fres };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFres = m.userData.fres; sh.uniforms.uRim = NST_RIM;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFres, uRim;')
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        {
          float fr = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);
          // the rim mirrors the bright room; specular highlights stay bright instead of being thinned by the low alpha
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.78, 0.84, 0.87) * uRim, clamp(uFres * fr, 0.0, 1.0) * 0.6);
          float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
          gl_FragColor.a = clamp(diffuseColor.a + uFres * fr + 0.85 * smoothstep(0.9, 2.6, lum), 0.0, 1.0);
        }`);
  };
  m.customProgramCacheKey = () => 'nstWater';
  return m;
}

// a bead (glossy see-through lens) → a thin wet film (reads as a darker, glossy wet patch on the surface), k 0..1
// (a dim reflection: a thin film on a counter mirrors the window as a faint sheen, not as a white sheet)
const NST_WET = { color: new THREE.Color('#0b0f11'), opacity: 0.5, fres: 0.3, env: 0.18, rough: 0.1 };
function nstWetLook(m, k) {
  const u = m.userData;
  if (!u.base) u.base = { color: m.color.clone(), opacity: m.opacity, fres: u.fres.value, env: m.envMapIntensity, rough: m.roughness };
  m.color.copy(u.base.color).lerp(NST_WET.color, k);
  m.opacity = MathX.lerp(u.base.opacity, NST_WET.opacity, k);
  u.fres.value = MathX.lerp(u.base.fres, NST_WET.fres, k);
  m.envMapIntensity = MathX.lerp(u.base.env, NST_WET.env, k);
  m.roughness = MathX.lerp(u.base.rough, NST_WET.rough, k);
}

// radius (m) of a thin film of volume V (m³) spreading under gravity against viscosity, dt seconds after it was let go
function nstSpreadR(V, dt) {
  if (dt <= 0) return 0;
  const g = 9.81, nu = 1.0e-6;
  return 0.55 * Math.pow(g * V * V * V * dt / nu, 0.125);     // Huppert's similarity solution, prefactor ≈ 0.55 (axisymmetric)
}

// ---------------------------------------------------------------------------------------------------------------------
// A drop / film on a flat surface. The mesh is a polar grid lying on y = 0 of its own group.
// set(R, H, flat, rough, seed, t): R mean radius (m), H centre height (m), flat 0 = dome (bead) → 1 = film with a soft lip,
// rough = how irregular the edge is (fingering as it spreads).
// ---------------------------------------------------------------------------------------------------------------------
class NstPuddle {
  constructor(parent, mat, { na = 56, nr = 9, seed = 1 } = {}) {
    this.na = na; this.nr = nr; this.seed = seed;
    const n = 1 + na * nr;
    this.pos = new Float32Array(n * 3);
    const idx = [];
    for (let a = 0; a < na; a++) {
      const a1 = (a + 1) % na;
      idx.push(0, 1 + a1, 1 + a);
      for (let r = 0; r < nr - 1; r++) {
        const p = 1 + r * na + a, q = 1 + r * na + a1, p2 = p + na, q2 = q + na;
        idx.push(p, q, q2, p, q2, p2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(idx);
    this.geo = g;
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.renderOrder = 3;
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = false; this.mesh.castShadow = false;
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    parent.add(this.group);
  }

  // per-angle radius factor (smooth, deterministic)
  _edge(th, rough) {
    if (rough <= 0) return 1;
    const s = this.seed;
    const v = 0.55 * Math.sin(th * 3 + s * 1.7) + 0.3 * Math.sin(th * 5 + s * 3.1 + 1.0) + 0.22 * Math.sin(th * 9 + s * 0.7) + 0.12 * Math.sin(th * 15 + s * 2.3);
    return 1 + rough * v;
  }

  set(R, H, flat = 0, rough = 0, stretch = [1, 1]) {
    const P = this.pos, na = this.na, nr = this.nr;
    P[0] = 0; P[1] = Math.max(H, 0.00005); P[2] = 0;
    for (let a = 0; a < na; a++) {
      const th = (a / na) * Math.PI * 2, er = this._edge(th, rough) * R;
      const cx = Math.cos(th) * stretch[0], cz = Math.sin(th) * stretch[1];
      for (let r = 0; r < nr; r++) {
        const u = (r + 1) / nr;
        // dome: sqrt(1 − u²) (a spherical-ish cap); film: flat top, a short soft lip at the edge
        const dome = Math.sqrt(Math.max(0, 1 - u * u));
        const lip = Math.min(1, Math.pow(Math.max(0, (1 - u) / 0.18), 0.6));
        const h = H * MathX.lerp(dome, lip, flat);
        const i = 1 + r * na + a;
        P[i * 3] = cx * er * u; P[i * 3 + 1] = r === nr - 1 ? 0.00002 : Math.max(h, 0.00004); P[i * 3 + 2] = cz * er * u;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// A falling stream from `a` (start point, world) with initial velocity `v0` (m/s, vector), radius r0 at the start,
// to the plane y = yEnd. update(t, flow, fray): flow 0..1 (how much water: 0 = off), fray 0 (normal smooth column that
// pinches into drops near the bottom) → 1 (no surface tension: ragged, splitting into ligaments and spray).
// ---------------------------------------------------------------------------------------------------------------------
class NstStream {
  constructor(parent, mat, { a, v0, r0 = 0.004, yEnd = 0, ns = 44, nrad = 9, seed = 3, spread = 0, frayLen = 0 } = {}) {
    this.a = a.clone(); this.v0 = v0.clone(); this.r0 = r0; this.yEnd = yEnd; this.ns = ns; this.nrad = nrad; this.seed = seed;
    this.spread = spread;      // > 0: with no surface tension the column also loosens and widens into a ragged rope as it falls
    this.frayLen = frayLen;    // > 0: the fraying develops over this fall height (m) instead of over the whole stream
    // flight time to the end plane: a.y + v0y τ − g τ²/2 = yEnd
    const g = 9.81, dy = this.a.y - yEnd, vy = this.v0.y;
    this.T = (vy + Math.sqrt(vy * vy + 2 * g * dy)) / g;
    const n = (ns + 1) * nrad;
    this.pos = new Float32Array(n * 3);
    const idx = [];
    for (let s = 0; s < ns; s++) for (let k = 0; k < nrad; k++) {
      const k1 = (k + 1) % nrad, p = s * nrad + k, q = s * nrad + k1, p2 = p + nrad, q2 = q + nrad;
      idx.push(p, p2, q2, p, q2, q);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(idx);
    this.geo = geo;
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 3;
    parent.add(this.mesh);
    this._c = new THREE.Vector3();
  }

  // centre of the stream at flight time τ
  at(tau, out) {
    out.copy(this.a).addScaledVector(this.v0, tau);
    out.y -= 0.5 * 9.81 * tau * tau;
    return out;
  }

  update(t, flow, fray) {
    const P = this.pos, ns = this.ns, nr = this.nrad, sd = this.seed;
    this.mesh.visible = flow > 0.002;
    if (!this.mesh.visible) return;
    const g = 9.81, v0 = this.v0.length() + 0.05, T = this.T * Math.min(1, flow * 3);   // a stream that is just starting reaches part-way
    const c = this._c;
    for (let s = 0; s <= ns; s++) {
      const u = s / ns, tau = u * T;
      this.at(tau, c);
      const v = Math.hypot(this.v0.x, this.v0.y - g * tau, this.v0.z) + 0.05;
      let r = this.r0 * Math.sqrt(v0 / v) * Math.sqrt(Math.max(flow, 0.05));     // continuity: the column thins as it speeds up
      const uf = this.frayLen > 0 ? MathX.clamp((this.a.y - c.y) / this.frayLen, 0, 1.4) : u;    // how far the fraying has got
      r *= 1 + this.spread * fray * 2.6 * uf * uf;
      // travelling disturbance (moves with the water): the phase follows the parcel, not the screen
      const ph = tau * 26 - t * 0.0 + (t - tau) * 0.0;
      const parcel = t - tau;                                  // when this parcel left the tap
      // normal: a smooth glassy column whose bottom pinches into drops (Rayleigh–Plateau, driven by surface tension)
      const pinch = (1 - fray) * MathX.smooth(u, 0.62, 0.8) * (0.5 + 0.5 * Math.sin(parcel * 95 + sd));
      // no surface tension: nothing smooths the surface, so ripples grow; the column splits and frays toward the bottom
      const rag = fray * (0.25 + 1.6 * uf * uf);
      const brk = fray * MathX.smooth(uf, 0.35, 0.95);
      for (let k = 0; k < nr; k++) {
        const th = (k / nr) * Math.PI * 2;
        let rr = r * (1 - 0.85 * pinch);
        if (rag > 0) {
          const n1 = Math.sin(th * 2 + parcel * 31 + sd) * 0.5 + Math.sin(th * 3 - parcel * 47 + sd * 2) * 0.35 + Math.sin(th * 5 + parcel * 73) * 0.25;
          rr *= 1 + rag * n1;
          // gaps: the column tears into ligaments (radius falls to ~0 in places)
          const gap = 0.5 + 0.5 * Math.sin(parcel * 57 + th * 1.0 + sd * 1.3) * Math.sin(parcel * 23 + sd);
          rr *= 1 - brk * MathX.smooth(gap, 0.45, 0.8) * 0.92;
          rr = Math.max(rr, 0.00005);
        }
        // the ragged column also wanders sideways a little
        const wob = fray * (r * 2.2 + this.spread * 0.009) * uf * uf;
        const ox = Math.cos(th) * rr + wob * Math.sin(parcel * 13 + sd), oz = Math.sin(th) * rr + wob * Math.cos(parcel * 11 + sd);
        const i = (s * nr + k) * 3;
        P[i] = c.x + ox; P[i + 1] = c.y; P[i + 2] = c.z + oz;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Spray / mist: soft billboards. Each emitter is a function spawn(i, k) → { p:[x,y,z], v:[vx,vy,vz], life, size0, size1, a, g }
// evaluated for "slots" i whose hashed birth times cycle with period `period`. Pure function of t.
// ---------------------------------------------------------------------------------------------------------------------
class NstSpray {
  constructor(scene, max = 900) {
    this.sys = new BillboardSystem(scene, max, false);
    this.sys.mesh.renderOrder = 5;
    this.sys.uniforms.uLight.value = 1.0;
  }
  begin(fog) { this.sys.begin(fog); }
  // emit `n` slots, each reborn every `period` seconds from t0 to t1, using spawn(i, cycleIndex, rnd)
  emit(t, n, period, t0, t1, spawn, shade = 1, tint = [0.82, 0.88, 0.9]) {
    if (t < t0) return;
    for (let i = 0; i < n; i++) {
      const off = hash1(i * 13.7 + 3) * period;
      const cyc = Math.floor((t - t0 - off) / period);
      if (cyc < 0) continue;
      const born = t0 + off + cyc * period;
      if (born > t1) continue;
      const s = spawn(i, cyc, hash2(i * 7 + 1, cyc * 3 + 11));
      const age = t - born;
      if (age > s.life) continue;
      const k = age / s.life;
      const gg = s.g !== undefined ? s.g : 9.81;
      const x = s.p[0] + s.v[0] * age, y = s.p[1] + s.v[1] * age - 0.5 * gg * age * age, z = s.p[2] + s.v[2] * age;
      if (s.floor !== undefined && y < s.floor) continue;
      const a = s.a * Math.min(1, k * 6) * (1 - k) * (1 - k);
      this.sys.push(x, y, z, MathX.lerp(s.size0, s.size1, k), hash1(i + cyc * 0.37) * 6.28, a, shade, tint[0], tint[1], tint[2]);
    }
  }
  end() { this.sys.end(); }
}
