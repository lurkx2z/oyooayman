/* =====================================================================
   CROWD — ~9,000 fans in the stands, one instanced draw per stand section.
   Each fan is a small low-poly figure posed in the vertex shader from story time and three times of its own:
     · the drum: it claps (arms up, hands together overhead) when THE DRUM'S SOUND REACHES IT
       (beat + distance / 34.3 m/s): the claps sweep along the stands in stripes
     · the goal: it jumps the moment it SEES the ball go in (light is instant), the same moment for everyone
     · the thunder: it ducks when the thunder's front reaches its seat: the far stand first, your rows last
   Full rigs (script people) stand where the camera looks closely: the friend, the drummer, your neighbours.
   ===================================================================== */

const SND_CROWD_SKIN = ['#f1c9a5', '#e0ac85', '#c68863', '#8d5b3e', '#5e3b28', '#f6d7bd'];
const SND_CROWD_HAIR = ['#1b1410', '#2e2118', '#4a3220', '#6b4a2c', '#9c7a4a', '#151515', '#7a7570'];
const SND_CROWD_HOME = ['#e2b82e', '#e2b82e', '#e8c23c', '#1f2f52', '#22355e'];             // the home colours: yellow and navy
const SND_CROWD_CASUAL = ['#d9d6cc', '#2a2c30', '#56606c', '#7a3b34', '#3c5a46', '#b9b2a2', '#30475e', '#8a8478', '#efeee8', '#4d4a6a'];
const SND_CROWD_AWAY = ['#b8322a', '#c23a30', '#efeee8', '#b8322a'];

// smooth 2-D value noise (empty patches in the stands)
function sndNoise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// every fan: where (floor under its feet), which way it faces, and its own seed
function sndCrowdSeats() {
  const S = SND_ST.side, E = SND_ST.end, out = [], rng = new RNG(4401);
  const free = (stand, r, x) => {
    if (stand === 'main' && r >= 5 && r <= 16 && Math.abs(x - SND.friend.x) < 6.5) return false;    // a quiet block round the friend (a few rigs)
    if (stand === 'main' && r >= 10 && r <= 13 && Math.abs(x - 6.0) < 2.1) return false;             // your rows at the end (rigs)
    if (stand === 'main' && r >= 2 && r <= 9 && x > 2.0 && x < 11.5 && !(r >= 8 && Math.abs(x - 6.6) > 0.95)) return false;   // your place at the start, and the rows below it
    if (stand === 'main' && r <= 17 && x > 35.6 && x < 41.5) return false;                           // below you in shot 4 (rigs)
    if (stand === 'far' && Math.abs(r - SND.drum.row) <= 1 && x > SND.drum.x - 1.2 && x < SND.drum.x + 2.3) return false;   // the drummer
    return true;
  };
  for (const s of [-1, 1]) {
    const aisles = [-49, -35, -21, -7, 7, 21, 35, 49], stand = s > 0 ? 'main' : 'far';
    for (let r = 0; r < S.rows; r++) {
      for (let x = S.x0 + 0.45; x < S.x1 - 0.4; x += 0.56) {
        if (aisles.some((a) => Math.abs(x - a) < 0.75)) continue;
        const occ = 0.86 - 0.12 * (r / S.rows) - 0.25 * MathX.smooth(sndNoise2(x * 0.07 + s * 9, r * 0.25), 0.62, 0.8);
        if (rng.next() > occ) continue;
        const xx = x + rng.range(-0.07, 0.07);
        if (!free(stand, r, xx)) continue;
        const q = sndSideSeat(s, r, xx);
        out.push({ x: xx, y: q.y, z: q.z - s * 0.1, yaw: (s > 0 ? Math.PI : 0) + rng.range(-0.22, 0.22), stand, r, seed: rng.next(), away: false });
      }
    }
  }
  for (const s of [-1, 1]) {
    const aisles = [-20, -6.5, 6.5, 20], stand = s > 0 ? 'east' : 'west';
    for (let r = 0; r < E.rows; r++) {
      for (let z = E.z0 + 0.45; z < E.z1 - 0.4; z += 0.56) {
        if (aisles.some((a) => Math.abs(z - a) < 0.75)) continue;
        const occ = 0.84 - 0.1 * (r / E.rows) - 0.25 * MathX.smooth(sndNoise2(z * 0.07 + s * 5, r * 0.3 + 4), 0.62, 0.8);
        if (rng.next() > occ) continue;
        const zz = z + rng.range(-0.07, 0.07), q = sndEndSeat(s, r, zz);
        // the away fans: a block of the east end
        out.push({ x: q.x - s * 0.1, y: q.y, z: zz, yaw: (s > 0 ? -Math.PI / 2 : Math.PI / 2) + rng.range(-0.22, 0.22), stand, r, seed: rng.next(), away: s > 0 && zz < -7 });
      }
    }
  }
  return out;
}

class SndCrowd {
  constructor(scene) {
    this.fans = sndCrowdSeats();
    // each fan's own times (the sound uses the same numbers: its claps, its cheer and its gasp are heard from where it is)
    for (const f of this.fans) {
      const h = hash1(f.seed * 1000 + 7), s2 = hash1(f.seed * 1000 + 19), s3 = hash1(f.seed * 1000 + 31);
      f.head = { x: f.x, y: f.y + 1.6, z: f.z };
      f.tDrum = SoundArrival.dist(SND_DRUM, f.head) / SND.C1 + 0.12 + 0.05 * h;   // after each beat is struck, this fan claps (hands meet 0.09 s later)
      f.tThunder = sndThunderAt(f.head) + 0.05 + 0.1 * s3;                          // the thunder reaches this seat: it ducks
      f.tGoal = !f.away && s2 > 0.18 ? SND_BALL.tGoal + 0.22 + 0.4 * h : 1e6;       // it SEES the goal: it jumps
      f.scarf = !f.away && s3 > 0.2;
      f.clapper = !f.away && h > 0.07;
      f.h = h; f.s2 = s2; f.s3 = s3;
    }
    this.uniforms = { uT: { value: 0 }, uDrum: { value: new THREE.Vector4(SND.drum.t0, SND.drum.period, SND.drum.n, 0) } };
    const geo = this._fanGeometry(), mat = this._material();
    // group by stand and 14 m section (so whole sections outside the view are culled)
    const groups = new Map();
    for (const f of this.fans) {
      const along = f.stand === 'main' || f.stand === 'far' ? f.x : f.z, key = f.stand + ':' + Math.floor((along + 70) / 14);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    }
    this.meshes = [];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    for (const list of groups.values()) {
      const n = list.length, g = geo.clone();
      const A = new Float32Array(n * 4), Bt = new Float32Array(n * 4), sh = new Float32Array(n * 3), sk = new Float32Array(n * 3), hr = new Float32Array(n * 3);
      const mesh = new THREE.InstancedMesh(g, mat, n);
      list.forEach((f, i) => {
        mesh.setMatrixAt(i, m4.compose(p.set(f.x, f.y, f.z), q.setFromEuler(e.set(0, f.yaw, 0)), sc.setScalar(0.93 + 0.14 * f.s2)));
        A.set([f.seed, f.tDrum, f.tThunder, f.tGoal], i * 4);
        Bt.set([f.scarf ? 1 : 0, 0, 0, f.clapper ? 1 : 0], i * 4);
        const col = (arr, k) => new THREE.Color(arr[Math.floor(k * arr.length) % arr.length]);
        const shirt = f.away ? col(SND_CROWD_AWAY, f.s2) : f.s3 < 0.55 ? col(SND_CROWD_HOME, f.h) : col(SND_CROWD_CASUAL, f.s2);
        const skin = col(SND_CROWD_SKIN, hash1(f.seed * 1000 + 43)), hair = col(SND_CROWD_HAIR, hash1(f.seed * 1000 + 57));
        sh.set([shirt.r, shirt.g, shirt.b], i * 3); sk.set([skin.r, skin.g, skin.b], i * 3); hr.set([hair.r, hair.g, hair.b], i * 3);
      });
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4));
      g.setAttribute('aB', new THREE.InstancedBufferAttribute(Bt, 4));
      g.setAttribute('aShirt', new THREE.InstancedBufferAttribute(sh, 3));
      g.setAttribute('aSkin', new THREE.InstancedBufferAttribute(sk, 3));
      g.setAttribute('aHair', new THREE.InstancedBufferAttribute(hr, 3));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = false; mesh.receiveShadow = true;
      mesh.name = 'crowd';
      scene.add(mesh); this.meshes.push(mesh);
    }
  }

  // one standing fan, facing +z, feet at 0. aPart: 0 legs · 1 torso · 2 skin (head) · 3 hair · 4/5 arm (+x/−x) · 6/7 hand · 8 scarf
  _fanGeometry() {
    const parts = [];
    const add = (g, part, x, y, z, sx = 1, sy = 1, sz = 1) => {
      g = g.index ? g.toNonIndexed() : g; g.scale(sx, sy, sz); g.translate(x, y, z);
      const n = g.attributes.position.count, a = new Float32Array(n).fill(part);
      g.setAttribute('aPart', new THREE.BufferAttribute(a, 1));
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      parts.push(g); return g;
    };
    add(new THREE.BoxGeometry(0.3, 0.84, 0.17), 0, 0, 0.42, 0);
    add(new THREE.BoxGeometry(0.4, 0.58, 0.25), 1, 0, 1.13, 0);
    // the head: an angular ball; its top faces are hair
    const hd = add(new THREE.IcosahedronGeometry(1, 0), 2, 0, 1.585, 0, 0.11, 0.13, 0.115);
    { const P = hd.attributes.position, A = hd.attributes.aPart; for (let i = 0; i < P.count; i += 3) { const cy = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3, cz = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3; if (cy > 1.6 || (cz < -0.04 && cy > 1.53)) for (let k = 0; k < 3; k++) A.setX(i + k, 3); } }
    for (const sx of [1, -1]) {
      add(new THREE.BoxGeometry(0.1, 0.56, 0.11), sx > 0 ? 4 : 5, sx * 0.235, 1.39 - 0.28, 0);
      add(new THREE.BoxGeometry(0.085, 0.1, 0.07), sx > 0 ? 6 : 7, sx * 0.235, 1.39 - 0.61, 0);
    }
    // the scarf: a strip whose shape is set in the shader (uv.x along it, uv.y across)
    add(new THREE.PlaneGeometry(1, 1, 6, 1), 8, 0, 1.4, 0);
    for (const g of parts) for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'aPart'].includes(k)) g.deleteAttribute(k);
    const geo = THREE.mergeGeometries(parts, false);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.1, 0), 1.5);   // (arms up and jumps stay inside)
    geo.boundingBox = new THREE.Box3(new THREE.Vector3(-0.9, -0.1, -0.9), new THREE.Vector3(0.9, 2.4, 0.9));
    return geo;
  }

  _material() {
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true, name: 'crowdFan' });
    const U = this.uniforms;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = U.uT; sh.uniforms.uDrum = U.uDrum;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', /* glsl */`#include <common>
          attribute float aPart; attribute vec4 aA; attribute vec4 aB; attribute vec3 aShirt; attribute vec3 aSkin; attribute vec3 aHair;
          uniform float uT; uniform vec4 uDrum;
          varying vec3 vCrowdCol; varying float vScarf;
          vec3 rotTo(vec3 v, vec3 b){                       // rotate v by the rotation taking (0,−1,0) to b
            vec3 ax = vec3(-b.z, 0.0, b.x); float s = length(ax), c = -b.y;
            if (s < 1e-4) return c > 0.0 ? v : vec3(v.x, -v.y, -v.z);
            ax /= s; return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1.0 - c);
          }`)
        .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
          {
            float part = aPart, seed = aA.x, t = uT;
            // the thunder: duck (hands over the head), then straighten and look round
            float du = t - aA.z, duck = smoothstep(0.0, 0.14, du) * (1.0 - smoothstep(1.4, 3.0, du));
            // the goal: jump with the arms up, a few times
            float gu = t - aA.w, jOn = step(0.0, gu) * (1.0 - smoothstep(2.4, 3.2, gu));
            float jump = jOn * pow(max(0.0, sin(gu * 6.6 * (0.9 + 0.2 * fract(seed * 13.0)))), 1.5) * 0.24;
            // the drum: this fan's own clock (the beat reaches it aA.y after it is struck)
            // every beat: a quick clap in front of the chest; every 4th beat (the accent): scarves up overhead for ~0.6 s,
            // so each accent shows as one band of raised scarves spreading out from the drum (62 m apart, 20 m wide)
            float ph = (t - uDrum.x - aA.y) / uDrum.y;
            float k = clamp(floor(ph + 0.25), 0.0, uDrum.z - 1.0);
            float cu = (ph - k) * uDrum.y;
            float clap = aB.w * step(-0.25, ph) * (1.0 - smoothstep(0.05, 0.16, abs(cu - 0.09)));
            float ka = clamp(floor((ph + 0.25) / 4.0), 0.0, floor((uDrum.z - 1.0) / 4.0));
            float ca = (ph - 4.0 * ka) * uDrum.y;
            float up = aB.w * smoothstep(-0.04, 0.06, ca) * (1.0 - smoothstep(0.5, 0.75, ca));
            float meet = 1.0 - smoothstep(0.0, 0.06, abs(ca - 0.09));
            float sway = sin(t * (0.7 + 0.5 * fract(seed * 7.0)) + seed * 40.0);
            vec3 p = transformed;
            vec3 hand[2];
            for (int i = 0; i < 2; i++) {
              float sx = i == 0 ? 1.0 : -1.0;
              vec3 sh = vec3(sx * 0.235, 1.39, 0.0);
              vec3 dRest = normalize(vec3(sx * 0.12, -1.0, 0.1 + 0.08 * sway));
              vec3 dUp = normalize(vec3(sx * 0.45, 1.0, 0.16));
              vec3 dMeet = normalize(vec3(-sx * 0.28, 1.0, 0.32));
              vec3 dDuck = normalize(vec3(-sx * 0.3, 0.8, 0.5));
              vec3 dClap = normalize(vec3(-sx * 0.55, 0.25, 0.8));
              vec3 d = normalize(mix(mix(dRest, dClap, clap), mix(dUp, dMeet, meet), up));
              d = normalize(mix(d, dUp, jOn * smoothstep(0.0, 0.12, gu) * (1.0 - smoothstep(2.2, 3.0, gu))));
              d = normalize(mix(d, dDuck, duck));
              hand[i] = sh + d * 0.6;
              bool mine = (i == 0 && (part == 4.0 || part == 6.0)) || (i == 1 && (part == 5.0 || part == 7.0));
              if (mine) p = sh + rotTo(p - sh, d);
            }
            vScarf = -1.0;
            if (part == 8.0) {
              float on = aB.x * max(max(up, jOn), 0.0);
              float s = uv.x, w = uv.y;
              vec3 q = mix(hand[1], hand[0], s);
              q.y -= (1.0 - w) * 0.2 + 0.05 * sin(3.14159 * s);
              q.z += 0.02;
              p = on > 0.5 ? q : vec3(0.0, 1.2, 0.0);
              vScarf = s;
            }
            // the upper body: sways, leans in to duck
            if (part > 0.5) {
              float yaw = 0.07 * sway * (1.0 - duck);
              p.xz = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw)) * p.xz;
              float lean = 0.9 * duck, py = p.y - 0.9;
              p = vec3(p.x, 0.9 + py * cos(lean) - p.z * sin(lean), py * sin(lean) + p.z * cos(lean));
            }
            p.y *= 1.0 - 0.24 * duck;
            p.y += jump;
            transformed = p;
            vec3 pants = mix(vec3(0.05, 0.06, 0.09), vec3(0.09, 0.13, 0.22), step(0.5, fract(seed * 7.31)));
            vCrowdCol = part < 0.5 ? pants : (part < 1.5 || part == 4.0 || part == 5.0) ? aShirt : (part == 3.0 ? aHair : aSkin);
          }`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vCrowdCol; varying float vScarf;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = vCrowdCol;
          if (vScarf >= 0.0) diffuseColor.rgb = mix(vec3(0.96, 0.95, 0.9), vec3(0.85, 0.62, 0.06), step(0.72, fract(vScarf * 3.0 + 0.25)));`);
    };
    mat.customProgramCacheKey = () => 'sndCrowd3';
    return mat;
  }

  update(t) { this.uniforms.uT.value = t; this.uniforms.uDrum.value.w = 1; }
}
