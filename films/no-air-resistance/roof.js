/* =====================================================================
   ROOF — the party on the roof, on story time S.
   The deck (pavers, a timber platform under the party), the parapets, the
   stair housing with its open door, the washing line and its sheets, the
   bunting and fairy lights, the party table, chairs, the chimney (steam and
   soot), the skylight, a kite on a long string.
   Before NR.loss the 50 km/h wind pushes everything: sheets and bunting
   fly, the tablecloth flaps, the kite flies, the chimney's smoke streams
   off. At NR.loss the air stops pushing solids: sheets and bunting swing
   down and hang, the kite drops into the street (it, its tail and its
   string all fall together, keeping their shape), and the soot in the
   smoke can't ride the air any more: what is already out falls out of the
   plume and no more can be lifted up the flue, while the steam (water
   droplets) keeps streaming with the wind: the smoke turns white.
   From NR_ICE.first the cloud's ice lands: holes punched in the sheets and
   the tablecloth (more and bigger as more of the ice lands, until they are
   rags), the deck whitening with ice powder, and one thing after another
   broken while you watch from the doorway (NR_ROOF_HITS): the cups, the
   bottles, the bunting's strings, the cake, the fairy lights, the sheets'
   pegs, the chairs, the chimney pot, the table (and, off to your left as
   you get in, the skylight's panes). From NR.roofHit the stair housing's
   timber roof over you is punched through: holes, light coming through
   them, ice and splinters falling inside.
   ===================================================================== */

// how much ice powder lies on upward faces (0..1); set per frame
const NR_ICY = { uIce: { value: 0 } };

// patch a material so its upward faces whiten in patches as ice powder piles up
function nrIcy(mat) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, NR_ICY);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vIcyW; varying vec3 vIcyN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvIcyW = (modelMatrix * vec4(transformed, 1.0)).xyz; vIcyN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uIce; varying vec3 vIcyW; varying vec3 vIcyN;
      float icyH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float icyN(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(icyH(i), icyH(i + vec2(1, 0)), u.x), mix(icyH(i + vec2(0, 1)), icyH(i + vec2(1, 1)), u.x), u.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float up = smoothstep(0.45, 0.85, vIcyN.y), n = 0.55 * icyN(vIcyW.xz * 2.3) + 0.45 * icyN(vIcyW.xz * 9.0);
        float cov = smoothstep(n - 0.12, n + 0.04, uIce * 1.3 - 0.15) * up;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.91, 0.95), cov * 0.92); }`);
  };
  mat.customProgramCacheKey = () => 'nrIcy';
  return mat;
}

// GLSL: holes punched through cloth by the ice. uv in metres on the cloth; uLanded: the share of the cloud's ice landed so far
const NR_HOLES_GLSL = `
  uniform float uLanded, uSeed;
  float nrH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.31) * 43758.5453); }
  // → 0 cloth, 1 hole; ring: the scorched-looking frayed edge
  float nrHoles(vec2 uv, out float ring) {
    float m = 0.0; ring = 0.0;
    vec2 g = uv / 0.11, c = floor(g), f = fract(g);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 cc = c + vec2(float(i), float(j));
      float t = nrH(cc);
      if (t < uLanded * 0.95) {
        vec2 o = vec2(nrH(cc + 3.1), nrH(cc + 7.7));
        float r = (0.12 + 0.2 * nrH(cc + 11.3)) * (0.7 + 1.25 * uLanded), d = length(vec2(float(i), float(j)) + o - f);
        m = max(m, 1.0 - smoothstep(r * 0.82, r, d)); ring = max(ring, 1.0 - smoothstep(r, r * 1.5, d));
      }
    }
    // a few big stones in the first, sparse seconds
    vec2 g2 = uv / 0.45, c2 = floor(g2), f2 = fract(g2);
    float t2 = nrH(c2 + 41.0);
    if (t2 < min(1.0, uLanded * 22.0) * 0.55) { vec2 o = vec2(nrH(c2 + 5.3), nrH(c2 + 9.1)) * 0.6 + 0.2; float d = length(o - f2) * 0.45; float r = 0.035 + 0.03 * nrH(c2 + 2.2);
      m = max(m, 1.0 - smoothstep(r * 0.8, r, d)); ring = max(ring, 1.0 - smoothstep(r, r * 1.6, d)); }
    return m;
  }`;

// the stair housing's roof (felt on timber) punched through by the ice: [x, z, time, radius]. They come faster and faster
// (the flux and the speed are both rising); none right over where you stand
const NR_HUT_HOLES = (() => {
  const H = NR_ROOF.hut, out = [], r = new RNG(6161), n = 60;
  for (let i = 0; out.length < n && i < 2000; i++) {
    const x = r.range(H.x0 + 0.3, H.x1 - 0.3), z = r.range(H.z0 + 0.3, H.z1 - 0.3);
    if (Math.hypot(x - 27.0, z + 0.8) < 0.45 || Math.hypot(x - 28.0, z + 0.8) < 0.55) continue;
    if (out.some((h) => Math.hypot(h[0] - x, h[1] - z) < 0.22)) continue;
    const k = out.length / n, t = NR.roofHit + (NR.quiet - 0.1 - NR.roofHit) * Math.pow(k, 0.72);
    out.push([x, z, t, r.range(0.05, 0.11)]);
  }
  // the first ones just in front of you (you have backed in to x ≈ 27.9, facing the door), so you see them come through
  out[0] = [27.3, -0.62, NR.roofHit, 0.1]; out[1] = [27.1, -1.08, NR.roofHit + 0.3, 0.09]; out[2] = [27.5, -1.18, NR.roofHit + 0.55, 0.085]; out[3] = [26.95, -0.45, NR.roofHit + 0.85, 0.08];
  return out;
})();
// the stairwell under the stair housing: a dog-leg stair round an open well, six storeys down to the ground floor. You
// stand at the top, at the rail (x = rail), over the well (x rail…vx1, z vz0…vz1); the near flights (x nx…rail) and the
// far ones (x vx1…x1) zig-zag down past it, a landing at each end of it
const NR_WELL = (() => {
  const H = NR_ROOF.hut, t = 0.2, Y = NR_ROOF.y, yb = LAYOUT.curbH, n = 6;
  return { x0: H.x0 + t, x1: H.x1 - t, z0: H.z0 + t, z1: H.z1 - t, nx: 27.8, rail: 28.55, vx1: 29.25, vz0: -2.0, vz1: 0.4, yb, n, hs: (Y - yb) / n };
})();

const NR_HOLES_ROOF_GLSL = `
  uniform vec4 uHoles[${60}]; uniform float uS;
  float nrRoofHole(vec2 p, out float rim) {
    float m = 0.0; rim = 0.0;
    for (int i = 0; i < ${60}; i++) { vec4 h = uHoles[i]; if (uS < h.z) continue;
      float r = h.w * (0.6 + 0.4 * smoothstep(h.z, h.z + 0.08, uS)), d = length(p - h.xy);
      float th = atan(p.y - h.y, p.x - h.x), jag = 0.8 + 0.1 * sin(th * 3.0 + h.z * 17.0) + 0.07 * sin(th * 5.0 + h.x * 23.0) + 0.05 * sin(th * 11.0 + h.y * 31.0);
      m = max(m, 1.0 - step(r * jag, d)); rim = max(rim, 1.0 - smoothstep(r * jag, r * jag * 1.9, d)); }
    return m; }`;
// patch a material so the hut roof's holes cut through it (world xz)
function nrHoley(mat, key) {
  const U = { uHoles: { value: NR_HUT_HOLES.map((h) => new THREE.Vector4(h[0], h[1], h[2], h[3])) }, uS: { value: 0 } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHoleW;').replace('#include <project_vertex>', '#include <project_vertex>\nvHoleW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHoleW;' + NR_HOLES_ROOF_GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>
        { float rim; if (nrRoofHole(vHoleW.xz, rim) > 0.5) discard; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.24, 0.18), rim * 0.85); }`);
  };
  mat.customProgramCacheKey = () => key;
  mat.userData.holes = U;
  return mat;
}

class NrRoof {
  constructor(app) {
    this.app = app; const scene = app.scene, R = NR_ROOF;
    this.Y = R.y;
    this.m = {
      paver: nrIcy(new THREE.MeshStandardMaterial({ map: this._paverTex(), roughness: 0.92 })),
      deck: nrIcy(new THREE.MeshStandardMaterial({ map: this._deckTex(), roughness: 0.85 })),
      coping: nrIcy(new THREE.MeshStandardMaterial({ color: '#cfc8b8', roughness: 0.8 })),
      wall: nrIcy(new THREE.MeshStandardMaterial({ color: '#e3d7bd', roughness: 0.9 })),
      hutWall: nrIcy(new THREE.MeshStandardMaterial({ color: '#d9cdb1', roughness: 0.9 })),
      hutRoof: nrIcy(new THREE.MeshStandardMaterial({ color: '#4d4a46', roughness: 0.9 })),
      inside: new THREE.MeshStandardMaterial({ color: '#2d2a27', roughness: 0.95 }),
      galv: nrIcy(new THREE.MeshStandardMaterial({ color: '#a8aeb3', roughness: 0.45, metalness: 0.6 })),
      dark: nrIcy(new THREE.MeshStandardMaterial({ color: '#2b2e31', roughness: 0.5, metalness: 0.4 })),
      wood: nrIcy(new THREE.MeshStandardMaterial({ color: '#8a6440', roughness: 0.8 })),
      white: nrIcy(new THREE.MeshStandardMaterial({ color: '#efede6', roughness: 0.55 })),
      brick: nrIcy(new THREE.MeshStandardMaterial({ map: this._brickTex(), roughness: 0.9 })),
      ac: nrIcy(new THREE.MeshStandardMaterial({ color: '#b9bcb8', roughness: 0.7, metalness: 0.2 })),
      pot: nrIcy(new THREE.MeshStandardMaterial({ color: '#a4593a', roughness: 0.85 })),
      leaf: nrIcy(new THREE.MeshStandardMaterial({ color: '#3f6b35', roughness: 0.85 })),
    };
    this.B = new Batcher();
    this._deck(); this._parapets(); this._hut(); this._clutter(); this._chimney(); this._skylightBuild(); this._tableBuild();
    this.B.build(scene, 'roof');
    this._laundry(); this._bunting(); this._tablecloth(); this._kite(); this._smoke(); this._well();
  }

  /* ---------------- textures ---------------- */
  _paverTex() {
    const c = Tex.canvas(512, 512), x = c.getContext('2d'), r = new RNG(901);
    x.fillStyle = '#6d6a64'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = r.range(-12, 12); x.fillStyle = `rgb(${142 + v},${138 + v},${130 + v})`; x.fillRect(i * 128 + 3, j * 128 + 3, 122, 122); }
    Tex.noise(x, 512, 512, 18, r);
    const t = Tex.tex(c); t.repeat.set(1 / 2.4, 1 / 2.4); return t;    // 60 cm slabs (the texture is 4 × 4 of them)
  }
  _deckTex() {
    const c = Tex.canvas(512, 512), x = c.getContext('2d'), r = new RNG(902);
    for (let i = 0; i < 8; i++) { const v = r.range(-14, 14); x.fillStyle = `rgb(${150 + v},${108 + v},${70 + v})`; x.fillRect(0, i * 64, 512, 62); x.fillStyle = '#3b2a1c'; x.fillRect(0, i * 64 + 62, 512, 2); }
    Tex.noise(x, 512, 512, 22, r);
    const t = Tex.tex(c); t.repeat.set(1 / 1.2, 1 / 1.2); return t;     // 15 cm boards
  }
  _brickTex() {
    const c = Tex.canvas(256, 256), x = c.getContext('2d'), r = new RNG(903);
    x.fillStyle = '#7a6d62'; x.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) { const v = r.range(-16, 16); x.fillStyle = `rgb(${142 + v},${70 + v * 0.6},${52 + v * 0.5})`; x.fillRect(i * 64 + (j % 2) * 32 + 2, j * 32 + 2, 60, 28); }
    Tex.noise(x, 256, 256, 14, r);
    return Tex.tex(c);
  }

  /* ---------------- the deck, the parapets ---------------- */
  _deck() {
    const R = NR_ROOF, y = R.y, B = this.B, t = R.parT;
    // (with holes under the skylight and under the stair housing, which has its own floor and the stairwell)
    const K = R.skylight, Hh = R.hut, holes = [[K.x - K.w / 2, K.x + K.w / 2, K.z - K.d / 2, K.z + K.d / 2], [Hh.x0 + 0.05, Hh.x1 - 0.05, Hh.z0 + 0.05, Hh.z1 - 0.05]];
    const xs = [R.x0 + t, R.x1 - t, ...holes.flatMap((h) => [h[0], h[1]])].sort((p, q) => p - q), zs = [R.z0 + t, R.z1 - t, ...holes.flatMap((h) => [h[2], h[3]])].sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
      const a = xs[i], b = xs[i + 1], c = zs[j], d = zs[j + 1], mx = (a + b) / 2, mz = (c + d) / 2;
      if (b - a < 1e-3 || d - c < 1e-3 || holes.some((h) => mx > h[0] && mx < h[1] && mz > h[2] && mz < h[3])) continue;
      B.add(Geo.flat(a, b, c, d, y + 0.004, 1), this.m.paver, null, { noShadow: true });
    }
    // the timber platform under the party (4 cm)
    const P = R.platform; B.add(new THREE.BoxGeometry(P.w, 0.04, P.d), this.m.deck, Geo.matrix(P.x, y + 0.02, P.z));
  }
  _parapets() {
    const R = NR_ROOF, y = R.y, B = this.B, t = R.parT, h = R.par, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2, L = R.x1 - R.x0, W = R.z1 - R.z0;
    for (const [w, d, x, z] of [[t, W, R.x0 + t / 2, cz], [t, W, R.x1 - t / 2, cz], [L, t, cx, R.z1 - t / 2], [L, t, cx, R.z0 + t / 2]]) {
      B.box(w, h, d, x, y + h / 2, z, this.m.wall);
      B.box(w + 0.1, 0.06, d + 0.1, x, y + h + 0.03, z, this.m.coping);
    }
  }
  // the stair housing: walls, a flat roof with an overhang, the open door (into a dim stairwell), a lamp over the door
  _hut() {
    const H = NR_ROOF.hut, y = NR_ROOF.y, B = this.B, t = 0.2, h = H.h, zc = (H.z0 + H.z1) / 2, dz0 = H.door - H.doorW / 2, dz1 = H.door + H.doorW / 2;
    B.box(t, h, H.z1 - H.z0, H.x1 - t / 2, y + h / 2, zc, this.m.hutWall);
    for (const z of [H.z0 + t / 2, H.z1 - t / 2]) B.box(H.x1 - H.x0, h, t, (H.x0 + H.x1) / 2, y + h / 2, z, this.m.hutWall);
    // the front, with the doorway
    B.box(t, h, dz0 - H.z0, H.x0 + t / 2, y + h / 2, (H.z0 + dz0) / 2, this.m.hutWall);
    B.box(t, h, H.z1 - dz1, H.x0 + t / 2, y + h / 2, (H.z1 + dz1) / 2, this.m.hutWall);
    B.box(t, h - H.doorH, H.doorW, H.x0 + t / 2, y + H.doorH + (h - H.doorH) / 2, H.door, this.m.hutWall);
    // the door frame and the door, swung right round flat against the outside wall (hinged on the left)
    for (const z of [dz0, dz1]) B.box(t + 0.06, H.doorH, 0.07, H.x0 + t / 2, y + H.doorH / 2, z, this.m.dark);
    B.box(t + 0.06, 0.08, H.doorW + 0.1, H.x0 + t / 2, y + H.doorH + 0.04, H.door, this.m.dark);
    B.box(t + 0.1, 0.1, H.doorW + 0.16, H.x0 + t / 2, y + H.doorH + 0.05, H.door, this.m.hutWall);      // (the lintel, closing the corner)
    B.add(new THREE.BoxGeometry(0.05, H.doorH - 0.04, H.doorW - 0.06), this.m.dark, Geo.matrix(H.x0 - 0.04, y + H.doorH / 2, dz1 + (H.doorW - 0.06) / 2 + 0.04));
    // the roof (felt on timber) and the ceiling under it: separate, so the ice can punch holes through them
    const slab = new THREE.Mesh(new THREE.BoxGeometry(H.x1 - H.x0 + 0.3, 0.18, H.z1 - H.z0 + 0.3), nrHoley(new THREE.MeshStandardMaterial({ color: '#4d4a46', roughness: 0.9 }), 'nrHoleSlab'));
    slab.position.set((H.x0 + H.x1) / 2 - 0.1, y + h + 0.09, zc); slab.castShadow = true; slab.receiveShadow = true; this.app.scene.add(slab);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(H.x1 - H.x0 - 2 * t, 0.02, H.z1 - H.z0 - 2 * t), nrHoley(new THREE.MeshStandardMaterial({ color: '#a89c88', roughness: 0.95 }), 'nrHoleCeil'));
    ceil.position.set((H.x0 + H.x1) / 2, y + h - 0.01, zc); this.app.scene.add(ceil);
    this.holeU = [slab.material.userData.holes, ceil.material.userData.holes];
    // inside: a dim stairwell (floor, inner walls, the first steps down)
    B.add(Geo.flat(H.x0 + t, NR_WELL.rail, H.z0 + t, H.z1 - t, y + 0.01, 1), this.m.inside, null, { noShadow: true });
    B.box(0.02, h - 0.02, H.z1 - H.z0 - 2 * t, H.x1 - t - 0.01, y + h / 2, zc, this.m.inside, 0, { noShadow: true });
    for (const z of [H.z0 + t + 0.01, H.z1 - t - 0.01]) B.box(H.x1 - H.x0 - 2 * t, h - 0.02, 0.02, (H.x0 + H.x1) / 2, y + h / 2, z, this.m.inside, 0, { noShadow: true });
    // the lamp over the door (a warm bulkhead light)
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.26), new THREE.MeshStandardMaterial({ color: '#ffe3b0', emissive: '#ffcf87', emissiveIntensity: 1.6 }));
    lamp.position.set(H.x0 - 0.06, y + H.doorH + 0.32, H.door); this.app.scene.add(lamp);
    // a warm light inside, so the stairwell isn't black when you stand in it
    const pl = new THREE.PointLight('#ffd9a0', 6, 6, 2); pl.position.set((H.x0 + H.x1) / 2 + 0.6, y + h - 0.4, zc); this.app.scene.add(pl);
    // a vent pipe on the hut roof
    B.add(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 10), this.m.galv, Geo.matrix(H.x1 - 0.7, y + h + 0.6, H.z0 + 0.8));
  }
  // AC units, plant pots, a couple of vent stacks
  _clutter() {
    const B = this.B, y = NR_ROOF.y;
    for (const [x, z] of [[27.6, -8.0], [27.6, -10.4]]) { B.box(1.4, 1.0, 1.9, x, y + 0.5, z, this.m.ac); B.add(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 18), this.m.dark, Geo.matrix(x, y + 1.03, z)); }
    for (const [x, z, s] of [[24.2, 2.15, 1.1], [25.6, 2.2, 0.9], [13.4, -4.4, 1], [13.4, -9.5, 0.9], [25.8, -3.9, 0.8]]) {
      B.add(new THREE.CylinderGeometry(0.28 * s, 0.22 * s, 0.5 * s, 12), this.m.pot, Geo.matrix(x, y + 0.25 * s, z));
      B.add(new THREE.IcosahedronGeometry(0.42 * s, 0), this.m.leaf, Geo.matrix(x, y + 0.75 * s, z, 0.3, x, 0, 1, 1.15, 1));
    }
    for (const [x, z] of [[24.2, -20.6], [29.6, -5.0], [15.2, -14.0]]) B.add(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 10), this.m.galv, Geo.matrix(x, y + 0.65, z));
  }
  _chimney() {
    const C = NR_ROOF.chimney, y = NR_ROOF.y, B = this.B;
    B.box(C.w, C.h, C.w, C.x, y + C.h / 2, C.z, this.m.brick);
    B.box(C.w + 0.14, 0.12, C.w + 0.14, C.x, y + C.h + 0.06, C.z, this.m.coping);
    this.potM = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.42, 12), this.m.pot); this.potM.position.set(C.x, y + C.h + 0.33, C.z); this.potM.castShadow = true; this.app.scene.add(this.potM);
    this.flue = new THREE.Vector3(C.x, y + C.h + 0.56, C.z);
  }
  // the skylight over the stairs below: a low frame with two glass panes (they break when the ice gets to them)
  _skylightBuild() {
    const K = NR_ROOF.skylight, y = NR_ROOF.y, B = this.B;
    B.box(K.w + 0.2, K.h, 0.1, K.x, y + K.h / 2, K.z - K.d / 2, this.m.dark); B.box(K.w + 0.2, K.h, 0.1, K.x, y + K.h / 2, K.z + K.d / 2, this.m.dark);
    B.box(0.1, K.h, K.d, K.x - K.w / 2, y + K.h / 2, K.z, this.m.dark); B.box(0.1, K.h, K.d, K.x + K.w / 2, y + K.h / 2, K.z, this.m.dark);
    B.box(K.w, 0.06, 0.06, K.x, y + K.h, K.z, this.m.dark);
    // the stairwell under it: a lit landing 3 m down and the shaft's pale walls (the lights are on in the flat below)
    const lit = new THREE.MeshStandardMaterial({ color: '#d8ccb6', emissive: '#7a6548', emissiveIntensity: 0.55, roughness: 0.9 });
    B.add(Geo.flat(K.x - K.w / 2, K.x + K.w / 2, K.z - K.d / 2, K.z + K.d / 2, y - 3.0, 1), lit, null, { noShadow: true });
    for (const s of [-1, 1]) { B.box(K.w, 3.0, 0.04, K.x, y - 1.5, K.z + s * K.d / 2, lit, 0, { noShadow: true }); B.box(0.04, 3.0, K.d, K.x + s * K.w / 2, y - 1.5, K.z, lit, 0, { noShadow: true }); }
    const gm = new THREE.MeshStandardMaterial({ color: '#c4d6e2', roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.42 });
    this.panes = [-1, 1].map((s, i) => { const p = new THREE.Mesh(new THREE.BoxGeometry(K.w - 0.1, 0.02, K.d / 2 - 0.08), gm); p.position.set(K.x, y + K.h + 0.01, K.z + s * K.d / 4); this.app.scene.add(p); return { p, s, i }; });
  }
  // the party table (its long side along x), a cake, plates, cups, bottles, a speaker; four folding chairs. The table and
  // the chairs are groups of their own (the ice brings them down); the cups are loose (it knocks them off)
  _tableBuild() {
    const T = NR_ROOF.table, y = NR_ROOF.y + 0.04, top = y + 0.74, hl = T.len / 2, hw = T.w / 2;
    this.tableTop = top + 0.012;
    const tg = new THREE.Group(); tg.position.set(T.x, y, T.z); this.app.scene.add(tg); this.tableG = tg;
    const legs = new THREE.Group(); tg.add(legs); this.legsG = legs;
    const lb = new Batcher(), tb = new Batcher();
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lb.box(0.05, 0.72, 0.05, dx * (hl - 0.1), 0.36, dz * (hw - 0.08), this.m.dark);
    lb.build(legs, 'tableLegs');
    tb.box(T.len, 0.03, T.w, 0, 0.725, 0, this.m.wood);
    const red = nrIcy(new THREE.MeshStandardMaterial({ color: '#c8352b', roughness: 0.5 })), green = nrIcy(new THREE.MeshStandardMaterial({ color: '#2f6b46', roughness: 0.25, metalness: 0.2 })), icing = this.m.white;
    const yt = this.tableTop, ly = yt - y;      // (local height of the table's top surface)
    const cake = new THREE.Group(), cm = (g, m, x, yy, z) => { const q = new THREE.Mesh(g, m); q.position.set(x, yy, z); q.castShadow = true; cake.add(q); };
    cm(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), new THREE.MeshStandardMaterial({ color: '#f3e3cf', roughness: 0.6 }), T.x + 0.1, yt + 0.06, T.z - 0.05);
    cm(new THREE.CylinderGeometry(0.175, 0.175, 0.03, 20), icing, T.x + 0.1, yt + 0.135, T.z - 0.05);
    for (let k = 0; k < 5; k++) cm(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 5), new THREE.MeshStandardMaterial({ color: ['#e8c34a', '#6fb6e0', '#e86f9f'][k % 3] }), T.x + 0.1 + 0.1 * Math.cos(k * 1.26), yt + 0.18, T.z - 0.05 + 0.1 * Math.sin(k * 1.26));
    this.app.scene.add(cake); this.cake = cake; this.cakeAt = [T.x + 0.1, yt, T.z - 0.05];
    // what's left of it once the ice has been through: a flattened smear (on the table, so it goes down with it)
    this.cakeMess = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.025, 14), new THREE.MeshStandardMaterial({ color: '#efe2cf', roughness: 0.8 })); this.cakeMess.position.set(0.1, ly + 0.0125, -0.05); this.cakeMess.visible = false; tg.add(this.cakeMess);
    tb.add(new THREE.CylinderGeometry(0.12, 0.1, 0.06, 16), icing, Geo.matrix(-0.6, ly + 0.03, 0.2));
    tb.box(0.12, 0.24, 0.16, 0.5, ly + 0.12, 0.25, this.m.dark);
    tb.build(tg, 'table');
    // the cups: knocked off one by one (each flies off the way the stone sent it and lands on the deck)
    const cg = new THREE.CylinderGeometry(0.045, 0.035, 0.12, 12);
    this.cups = [[-0.75, -0.3], [-0.95, -0.2], [0.75, 0.3], [0.9, 0.12], [0.85, -0.3], [-0.2, 0.3]].map(([dx, dz], i) => {
      const m = new THREE.Mesh(cg, red); m.position.set(T.x + dx, yt + 0.06, T.z + dz); m.castShadow = true; this.app.scene.add(m);
      const [c0, c1] = NR_ROOF_HITS.cups, h = (k) => hash1(i * 31 + k);
      return { m, p0: m.position.clone(), t: c0 + (c1 - c0) * (i + 0.3 * h(1)) / 6, a: h(2) * 6.283, v: 2.2 + 2.5 * h(3), vy: 1.5 + 2.0 * h(4), w: 8 + 10 * h(5) };
    });
    this.bottles = new THREE.Group();
    for (const [dx, dz] of [[-0.25, 0.05], [-0.32, 0.15]]) for (const [g, h] of [[new THREE.CylinderGeometry(0.04, 0.04, 0.24, 10), 0.12], [new THREE.CylinderGeometry(0.015, 0.02, 0.08, 8), 0.28]]) { const q = new THREE.Mesh(g, green); q.position.set(T.x + dx, yt + h, T.z + dz); q.castShadow = true; this.bottles.add(q); }
    this.app.scene.add(this.bottles); this.bottlesAt = [T.x - 0.285, yt, T.z + 0.1];
    // four folding chairs (white), on the long sides; each pivots on its back feet when it goes over
    this.chairs = [[-0.55, -0.85, 0], [0.5, -0.85, 0], [-0.4, 0.85, Math.PI], [0.6, 0.85, Math.PI]].map(([dx, dz, ry], i) => {
      const g = new THREE.Group(), inner = new THREE.Group(), cb = new Batcher(), back = -0.21;
      g.rotation.order = 'YXZ'; g.rotation.y = ry; g.position.set(T.x + dx + Math.sin(ry) * back, y, T.z + dz + Math.cos(ry) * back); inner.position.z = -back; g.add(inner);
      cb.box(0.42, 0.04, 0.42, 0, 0.45, 0, this.m.white);
      cb.add(new THREE.BoxGeometry(0.42, 0.42, 0.04), this.m.white, Geo.matrix(0, 0.68, -0.2));
      for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) cb.box(0.03, 0.45, 0.03, lx, 0.225, lz, this.m.galv);
      cb.build(inner, 'chair'); this.app.scene.add(g);
      return { g, t: NR_ROOF_HITS.chairs[i], dir: i % 2 ? 1 : -1 };
    });
  }

  /* ---------------- the stairwell (seen from its top rail, looking down) ---------------- */
  // flat-shaded and lit by hand (vertex colours): daylight from the hut's door and the windows fading with depth, a lamp's
  // glow on the ground floor; the sun can't reach in here
  _well() {
    const W = NR_WELL, Y = NR_ROOF.y, pos = [], col = [], c = new THREE.Color(), hs = W.hs;
    const light = (y) => { const d = (Y - y) / (Y - W.yb); return 0.92 * Math.exp(-2.1 * d) + 0.62 * Math.exp(-(y - W.yb) / 2.4) + 0.07; };
    const shade = { px: 0.62, nx: 0.74, py: 1.0, ny: 0.38, pz: 0.86, nz: 0.56 };
    const vtx = (x, y, z, base, f, flat) => { pos.push(x, y, z); const L = flat ? 1 : light(y) * f; c.set(base); col.push(Math.min(1, c.r * L), Math.min(1, c.g * L), Math.min(1, c.b * L)); };
    const quad = (a, b, cc, d, base, f, flat) => { for (const v of [a, b, cc, a, cc, d]) vtx(v[0], v[1], v[2], base, f, flat); };
    const box = (x0, x1, y0, y1, z0, z1, base) => {
      quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], base, shade.py);
      quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], base, shade.ny);
      quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], base, shade.nx);
      quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], base, shade.px);
      quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], base, shade.nz);
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], base, shade.pz);
    };
    // a slanted bar from (x, ya, za) to (x, yb, zb), w wide (x) and h deep (y)
    const bar = (xa, xb, ya, yb, za, zb, h, base) => {
      quad([xa, ya, za], [xa, yb, zb], [xb, yb, zb], [xb, ya, za], base, shade.py);
      quad([xa, ya - h, za], [xa, yb - h, zb], [xa, yb, zb], [xa, ya, za], base, shade.nx);
      quad([xb, ya, za], [xb, yb, zb], [xb, yb - h, zb], [xb, ya - h, za], base, shade.px);
      quad([xa, ya - h, za], [xb, ya - h, za], [xb, yb - h, zb], [xa, yb - h, zb], base, shade.ny);
    };
    const wallC = '#d9d0bf', stepC = '#b9b2a6', nose = '#7d776d', railC = '#3a3c3e', stringC = '#e9e4da', slab = '#c9c1b2';
    // the walls (inner faces, in 0.5 m bands so the light can fade down them)
    for (let y = W.yb; y < Y - 0.01; y += 0.5) {
      const y1 = Math.min(Y, y + 0.5);
      quad([W.x0, y, W.z0], [W.x0, y, W.z1], [W.x0, y1, W.z1], [W.x0, y1, W.z0], wallC, shade.px);
      quad([W.x1, y, W.z0], [W.x1, y1, W.z0], [W.x1, y1, W.z1], [W.x1, y, W.z1], wallC, shade.nx);
      quad([W.x0, y, W.z0], [W.x0, y1, W.z0], [W.x1, y1, W.z0], [W.x1, y, W.z0], wallC, shade.pz);
      quad([W.x0, y, W.z1], [W.x1, y, W.z1], [W.x1, y1, W.z1], [W.x0, y1, W.z1], wallC, shade.nz);
    }
    // the ground floor: stone tiles
    for (let i = 0; W.x0 + i * 0.32 < W.x1; i++) for (let j = 0; W.z0 + j * 0.32 < W.z1; j++) {
      const a = W.x0 + i * 0.32, b = Math.min(W.x1, a + 0.32), z0 = W.z0 + j * 0.32, z1 = Math.min(W.z1, z0 + 0.32), y = W.yb + 0.002;
      quad([a, y, z0], [a, y, z1], [b, y, z1], [b, y, z0], (i + j) % 2 ? '#3a3f42' : '#9a9387', 1.0);
    }
    const n = 10, tr = (W.vz1 - W.vz0) / n;
    for (let k = 0; k < W.n; k++) {
      const yk = Y - k * hs, yh = yk - hs / 2, r = hs / 2 / n;
      // the corridor at this floor (the top one is the hut's own floor), with a door in the wall; the landing at the near end
      if (k > 0) { box(W.x0, W.nx, yk - 0.25, yk, W.z0, W.z1, slab); quad([W.x0 + 0.01, yk, -1.3], [W.x0 + 0.01, yk, -0.3], [W.x0 + 0.01, yk + 2.1, -0.3], [W.x0 + 0.01, yk + 2.1, -1.3], '#6b5a48', shade.px); }
      box(k > 0 ? W.nx : W.rail, W.x1, yk - 0.25, yk, W.z0, W.vz0, slab);
      // flight 1 (far side) down to the half landing; the half landing (with a window); flight 2 (near side) down to the next floor
      for (let i = 0; i < n; i++) {
        const top = yk - (i + 1) * r, za = W.vz0 + i * tr;
        box(W.vx1, W.x1, top - r - 0.12, top, za, za + tr, stepC); box(W.vx1, W.x1, top - 0.03, top, za + tr - 0.03, za + tr, nose);
        const top2 = yh - (i + 1) * r, zb = W.vz1 - (i + 1) * tr;
        box(W.nx, W.rail, top2 - r - 0.12, top2, zb, zb + tr, stepC); box(W.nx, W.rail, top2 - 0.03, top2, zb, zb + 0.03, nose);
        // balusters on the well side of each step
        box(W.vx1 + 0.03, W.vx1 + 0.05, top, top + 0.9, za + tr / 2 - 0.01, za + tr / 2 + 0.01, railC);
        box(W.rail - 0.05, W.rail - 0.03, top2, top2 + 0.9, zb + tr / 2 - 0.01, zb + tr / 2 + 0.01, railC);
      }
      box(W.nx, W.x1, yh - 0.25, yh, W.vz1, W.z1, slab);
      quad([W.x1 - 0.01, yh + 0.9, 0.55], [W.x1 - 0.01, yh + 2.1, 0.55], [W.x1 - 0.01, yh + 2.1, 1.25], [W.x1 - 0.01, yh + 0.9, 1.25], '#eef3f6', 1, true);
      // the strings (white) and the handrails (dark) along the well
      bar(W.vx1, W.vx1 + 0.04, yk + 0.02, yh + 0.02, W.vz0, W.vz1, 0.32, stringC);
      bar(W.rail - 0.04, W.rail, yh + 0.02, yk - hs + 0.02, W.vz1, W.vz0, 0.32, stringC);
      bar(W.vx1 + 0.02, W.vx1 + 0.06, yk + 0.92, yh + 0.92, W.vz0, W.vz1, 0.04, railC);
      bar(W.rail - 0.06, W.rail - 0.02, yh + 0.92, yk - hs + 0.92, W.vz1, W.vz0, 0.04, railC);
      // the landings' rails across the ends of the well
      box(W.rail, W.vx1, yk + 0.88, yk + 0.92, W.vz0 - 0.04, W.vz0, railC);
      box(W.rail, W.vx1, yh + 0.88, yh + 0.92, W.vz1, W.vz1 + 0.04, railC);
      for (let x = W.rail + 0.1; x < W.vx1 - 0.05; x += 0.12) { box(x - 0.01, x + 0.01, yk, yk + 0.9, W.vz0 - 0.03, W.vz0 - 0.01, railC); box(x - 0.01, x + 0.01, yh, yh + 0.9, W.vz1 + 0.01, W.vz1 + 0.03, railC); }
    }
    // the top rail you lean over (along the well's near side, at the top)
    box(W.rail - 0.05, W.rail + 0.01, Y + 0.9, Y + 0.95, W.vz0, W.vz1, railC);
    for (let z = W.vz0 + 0.06; z < W.vz1; z += 0.12) box(W.rail - 0.03, W.rail - 0.01, Y, Y + 0.9, z - 0.01, z + 0.01, railC);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true })); m.name = 'well'; this.app.scene.add(m); this.well = m;
  }

  /* ---------------- cloth: the sheets and the tablecloth ---------------- */
  // a sheet on the line: local x along the line (0…W), y down from the line (0…−H), z downwind. uTheta: how far the wind
  // lifts it (rad); uRip: the flapping; integrates its curved profile in the vertex shader. Holes from the ice.
  _sheetMat(W, H, U, ghost) {
    const mat = ghost ? new THREE.MeshBasicMaterial({ color: '#8fb3e6', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ map: U.map, roughness: 0.9, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTheta, uRip, uT, uPh, uLimp; varying vec2 vUvM;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { float u = position.x / ${W.toFixed(3)}, v = -position.y / ${H.toFixed(3)}, s = v * ${H.toFixed(3)};
            float bell = 0.72 + 0.4 * sin(3.14159 * u), yy = 0.0, zz = 0.0, ds = s / 8.0;
            for (int i = 0; i < 8; i++) {
              float si = ds * (float(i) + 0.5), vi = si / ${H.toFixed(3)};
              float a = uTheta * bell * (0.5 + 0.5 * vi) + uRip * vi * (0.42 * sin(si * 3.1 - uT * 9.5 + u * 2.3 + uPh) + 0.16 * sin(si * 7.3 - uT * 16.0 + u * 6.1));
              yy -= cos(a) * ds; zz += sin(a) * ds;
            }
            // limp: loose vertical folds, the hem a little in
            zz += uLimp * (0.045 * sin(u * 17.0 + uPh) + 0.02 * sin(u * 41.0)) * (0.35 + v);
            transformed = vec3(position.x - 0.04 * uTheta * sin(3.14159 * u) * v, yy - 0.035 * sin(3.14159 * u), zz);
            vUvM = vec2(position.x, -position.y); }`);
      if (!ghost) {
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvM;' + NR_HOLES_GLSL)
          .replace('#include <color_fragment>', `#include <color_fragment>
            { float ring; float hole = nrHoles(vUvM, ring); if (hole > 0.5) discard; diffuseColor.rgb *= 1.0 - 0.45 * ring; }`);
      } else sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvM;');
    };
    mat.customProgramCacheKey = () => `nrSheet${W}x${H}${ghost ? 'g' : ''}`;
    return mat;
  }
  _laundry() {
    // run the line so that its left-hand normal (local +z) points downwind
    let [[ax, az], [bx, bz]] = NR_ROOF.line;
    if (-(bz - az) * NR_WIND_DIR.x + (bx - ax) * NR_WIND_DIR.z < 0) [ax, az, bx, bz] = [bx, bz, ax, az];
    const y = NR_ROOF.y, len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len, nx = -tz, nz = tx;
    this.lineT = [tx, tz]; this.lineN = [nx, nz]; this.lineY = y + 2.05;
    // posts and the line
    for (const [px, pz] of [[ax, az], [bx, bz]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.15, 8), this.m.galv); p.position.set(px, y + 1.075, pz); p.castShadow = true; this.app.scene.add(p);
      const cb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), this.m.galv); cb.position.set(px, y + 2.08, pz); cb.rotation.y = Math.atan2(tx, tz) + Math.PI / 2; this.app.scene.add(cb);
    }
    const ln = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 4), this.m.white); ln.position.set((ax + bx) / 2, this.lineY, (az + bz) / 2); ln.rotation.order = 'YXZ'; ln.rotation.set(Math.PI / 2, Math.atan2(tx, tz), 0); this.app.scene.add(ln); this.lineM = ln; this.pegs = [];
    // three sheets (white, pale blue, white with a stripe) and the NORMAL AIR ghost of the first one
    const W = 2.05, H = 1.7, geo = new THREE.PlaneGeometry(W, H, 22, 18); geo.translate(W / 2, -H / 2, 0);
    const tex = (bg, stripe) => { const c = Tex.canvas(128, 96), x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 128, 96); if (stripe) { x.fillStyle = stripe; x.fillRect(0, 70, 128, 10); } return Tex.tex(c, { repeat: false }); };
    const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(tx, 0, tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx, 0, nz));
    this.sheets = [[0.1, '#f4f2ec', null], [2.37, '#cfe0ee', null], [4.64, '#f4f2ec', '#c94f43']].map(([s0, bg, st], i) => {
      const U = { uTheta: { value: 1 }, uRip: { value: 1 }, uT: { value: 0 }, uPh: { value: i * 2.1 }, uLimp: { value: 0 }, uLanded: { value: 0 }, uSeed: { value: i + 1 }, map: tex(bg, st) };
      const m = new THREE.Mesh(geo, this._sheetMat(W, H, U, false)); m.quaternion.setFromRotationMatrix(basis); m.position.set(ax + tx * s0, this.lineY, az + tz * s0);
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; this.app.scene.add(m);
      const q0 = m.quaternion.clone();
      for (const f of [0.06, 0.94]) { const peg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.03), this.m.wood); peg.position.set(ax + tx * (s0 + f * W), this.lineY - 0.02, az + tz * (s0 + f * W)); this.app.scene.add(peg); this.pegs.push(peg); }
      return { m, U, i, s0, q0 };
    });
    const GU = { uTheta: { value: 1.5 }, uRip: { value: 1.6 }, uT: { value: 0 }, uPh: { value: 0.7 }, uLimp: { value: 0 } };
    const gm = this._sheetMat(W, H, GU, true), ghost = new THREE.Mesh(geo, gm); ghost.quaternion.copy(this.sheets[0].m.quaternion); ghost.position.copy(this.sheets[0].m.position); ghost.visible = false; ghost.frustumCulled = false; ghost.renderOrder = 7;
    const ge = new THREE.Mesh(geo, this._sheetMat(W, H, GU, true)); ge.material.wireframe = true; ge.renderOrder = 7; ge.frustumCulled = false; ghost.add(ge);
    this.app.scene.add(ghost); this.ghostSheet = { m: ghost, U: GU, mat: gm, edge: ge.material, W, H };
  }
  // the tablecloth: a top and four skirts hanging 0.3 m; the skirts flap in the wind; holes from the ice
  _tablecloth() {
    const T = NR_ROOF.table, y = this.tableTop - 0.004, w = T.len + 0.12, l = T.w + 0.12, d = 0.32;
    const pos = [], uvm = [], skirt = [], idx = [];
    const quad = (pts, uvs, sk) => { const b = pos.length / 3; for (let i = 0; i < 4; i++) { pos.push(...pts[i]); uvm.push(...uvs[i]); skirt.push(...sk[i]); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
    // subdivided panels (so the skirts can ripple)
    const panel = (o, ax, ay, n1, n2, uo, nrm, hang) => {
      for (let i = 0; i < n1; i++) for (let j = 0; j < n2; j++) {
        const p = (a, b) => [o[0] + ax[0] * a + ay[0] * b, o[1] + ax[1] * a + ay[1] * b, o[2] + ax[2] * a + ay[2] * b];
        const a0 = i / n1, a1 = (i + 1) / n1, b0 = j / n2, b1 = (j + 1) / n2, L1 = Math.hypot(...ax), L2 = Math.hypot(...ay);
        quad([p(a0, b0), p(a1, b0), p(a1, b1), p(a0, b1)], [[uo[0] + a0 * L1, uo[1] + b0 * L2], [uo[0] + a1 * L1, uo[1] + b0 * L2], [uo[0] + a1 * L1, uo[1] + b1 * L2], [uo[0] + a0 * L1, uo[1] + b1 * L2]],
          [[nrm[0], nrm[1], hang ? b0 : 0], [nrm[0], nrm[1], hang ? b0 : 0], [nrm[0], nrm[1], hang ? b1 : 0], [nrm[0], nrm[1], hang ? b1 : 0]]);
      }
    };
    const x0 = T.x - w / 2, x1 = T.x + w / 2, z0 = T.z - l / 2, z1 = T.z + l / 2;
    panel([x0, y, z0], [w, 0, 0], [0, 0, l], 8, 4, [0, 0], [0, 0], false);
    panel([x0, y, z0], [w, 0, 0], [0, -d, 0], 16, 3, [0, l], [0, -1], true);
    panel([x0, y, z1], [w, 0, 0], [0, -d, 0], 16, 3, [w, l], [0, 1], true);
    panel([x0, y, z0], [0, 0, l], [0, -d, 0], 8, 3, [2 * w, l], [-1, 0], true);
    panel([x1, y, z0], [0, 0, l], [0, -d, 0], 8, 3, [2 * w + l, l], [1, 0], true);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUvM', new THREE.Float32BufferAttribute(uvm, 2)); g.setAttribute('aSkirt', new THREE.Float32BufferAttribute(skirt, 3)); g.setIndex(idx); g.computeVertexNormals();
    const c = Tex.canvas(64, 64), x = c.getContext('2d'); x.fillStyle = '#f5f1e8'; x.fillRect(0, 0, 64, 64); x.fillStyle = 'rgba(200,60,60,0.85)'; for (let i = 0; i < 64; i += 16) { x.fillRect(i, 0, 8, 64); x.fillRect(0, i, 64, 8); }
    const tex = Tex.tex(c); tex.repeat.set(1, 1);
    const U = { uFlap: { value: 0 }, uT: { value: 0 }, uLanded: { value: 0 }, uSeed: { value: 9 } }, wd = NR_WIND_DIR;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aUvM; attribute vec3 aSkirt; uniform float uFlap, uT; varying vec2 vUvM;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = aUvM * 2.2;\n#endif')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec2 n = aSkirt.xy; float k = aSkirt.z; float side = dot(n, vec2(${wd.x.toFixed(3)}, ${wd.z.toFixed(3)}));
            float flap = uFlap * k * (0.55 * side + 0.25 * sin(aUvM.x * 6.0 - uT * 13.0) + 0.12 * sin(aUvM.x * 13.0 + uT * 19.0));
            transformed.xz += n * flap * 0.3; transformed.y += abs(flap) * 0.08;
            vUvM = aUvM; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvM;' + NR_HOLES_GLSL)
        .replace('#include <color_fragment>', `#include <color_fragment>
          { float ring; float hole = nrHoles(vUvM, ring); if (hole > 0.5) discard; diffuseColor.rgb *= 1.0 - 0.45 * ring; }`);
    };
    mat.customProgramCacheKey = () => 'nrCloth';
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    m.position.copy(this.tableG.position).negate(); this.tableG.add(m);      // (built in world space; it goes down with the table)
    this.cloth = { m, U };
  }

  /* ---------------- bunting and fairy lights ---------------- */
  _bunting() {
    const y = NR_ROOF.y, H = NR_ROOF.hut, [A, Bp] = NR_ROOF.line;
    const runs = [[[H.x0 - 0.05, y + 2.75, H.z1 - 0.2], [A[0], y + 2.12, A[1]]], [[H.x0 - 0.05, y + 2.75, H.z0 + 0.2], [Bp[0], y + 2.12, Bp[1]]]];
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.13, 0, 0, 0.13, 0, 0, 0, -0.32, 0], 3)); tri.computeVertexNormals();
    const cols = ['#d94a3d', '#f2c14e', '#3d8fd9', '#f4f1e8', '#5bb36a'];
    const pm = new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide });
    this.flags = []; this.strings = [];
    runs.forEach(([a, b], r) => {
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.floor(len / 0.42), sag = 0.05 * len;
      const pt = (f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - 4 * sag * f * (1 - f), a[2] + (b[2] - a[2]) * f];
      const str = []; for (let s = 0; s < 24; s++) str.push(...pt(s / 24), ...pt((s + 1) / 24));
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(str, 3));
      const L = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: '#e8e4da' })); L.frustumCulled = false; this.app.scene.add(L);
      this.strings.push({ L, rest: str.slice(), r });
      const tx = (b[0] - a[0]) / len, tz = (b[2] - a[2]) / len;
      let nx = -tz, nz = tx; const dn = nx * NR_WIND_DIR.x + nz * NR_WIND_DIR.z; if (dn < 0) { nx = -nx; nz = -nz; }
      for (let i = 1; i < n; i++) this.flags.push({ p: pt(i / n), tx, tz, nx, nz, k: Math.abs(dn), ph: i * 1.9 + a[0], col: cols[(i + this.flags.length) % 5], r, ry: hash1(i * 31 + r) * 6.3 });
    });
    const im = new THREE.InstancedMesh(tri, pm, this.flags.length); const c = new THREE.Color();
    this.flags.forEach((f, i) => im.setColorAt(i, c.set(f.col))); im.castShadow = true; im.frustumCulled = false; this.app.scene.add(im); this.flagM = im;
    // fairy lights: a string of warm bulbs from a pole at the front of the party, over the table, to the washing line's near post
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.6, 8), this.m.galv); pole.position.set(22.4, y + 1.3, 2.45); pole.castShadow = true; this.app.scene.add(pole);
    const fa = [22.4, y + 2.55, 2.45], fb = [Bp[0], y + 2.1, Bp[1]], fl = Math.hypot(fb[0] - fa[0], fb[2] - fa[2]), bm = new THREE.MeshStandardMaterial({ color: '#fff1c8', emissive: '#ffcc77', emissiveIntensity: 1.5 });
    const fpt = (f) => [fa[0] + (fb[0] - fa[0]) * f, fa[1] + (fb[1] - fa[1]) * f - 4 * 0.4 * f * (1 - f), fa[2] + (fb[2] - fa[2]) * f], fs = [];
    for (let s = 0; s < 30; s++) fs.push(...fpt(s / 30), ...fpt((s + 1) / 30));
    this.app.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(fs, 3)), new THREE.LineBasicMaterial({ color: '#2a2a2a' })));
    const bg = new THREE.SphereGeometry(0.03, 8, 6), nb = Math.floor(fl / 0.42), bi = new THREE.InstancedMesh(bg, bm, nb), M = new THREE.Matrix4();
    this.bulbs = [];
    for (let i = 0; i < nb; i++) { const p = fpt((i + 0.5) / nb); M.makeTranslation(p[0], p[1] - 0.05, p[2]); bi.setMatrixAt(i, M); this.bulbs.push({ p: [p[0], p[1] - 0.05, p[2]], t: NR_ROOF_HITS.lights + 1.6 * hash1(i * 17 + 5) ** 1.3 }); }
    bi.frustumCulled = false; this.app.scene.add(bi); this.bulbM = bi;
    this._q = new THREE.Quaternion(); this._m4 = new THREE.Matrix4(); this._v = new THREE.Vector3(); this._s1 = new THREE.Vector3(1, 1, 1);
    this._qf = new THREE.Quaternion(); this._xA = new THREE.Vector3(1, 0, 0);
  }

  /* ---------------- the kite: flown from the far end of the roof; at the change it drops into the street ---------------- */
  _kite() {
    const g = new THREE.Group(), c = Tex.canvas(64, 64), x = c.getContext('2d');
    x.fillStyle = '#e8402f'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#f6d24a'; x.beginPath(); x.moveTo(0, 0); x.lineTo(64, 64); x.lineTo(0, 64); x.fill();
    const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.5, 0, -0.42, 0.1, 0, 0, -0.75, 0, 0, 0.5, 0, 0, -0.75, 0, 0.42, 0.1, 0], 3));
    kg.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 1, 0, 0.7, 0.5, 0, 0.5, 1, 0.5, 0, 1, 0.7], 2)); kg.computeVertexNormals();
    const k = new THREE.Mesh(kg, new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.7, side: THREE.DoubleSide })); g.add(k);
    g.scale.setScalar(1.7); this.app.scene.add(g); this.kiteG = g;      // (a big box kite-sized diamond: it has to read from five storeys up)
    // its tail: bows on a ribbon; and the string (both as line pieces, positions set per frame)
    this.tailN = 10; this.tail = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshStandardMaterial({ color: '#3d8fd9', side: THREE.DoubleSide, roughness: 0.8 }), this.tailN); this.tail.frustumCulled = false; this.app.scene.add(this.tail);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(41 * 3), 3));
    this.kString = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: '#f4f2ec', transparent: true, opacity: 0.85 })); this.kString.frustumCulled = false; this.app.scene.add(this.kString);
    this.tg = new THREE.BufferGeometry(); this.tg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(this.tailN * 2 * 3), 3));
    this.tLine = new THREE.Line(this.tg, new THREE.LineBasicMaterial({ color: '#3d8fd9' })); this.tLine.frustumCulled = false; this.app.scene.add(this.tLine);
  }
  // where the kite flies (before the change) from the flyer's hand: 9 m downwind, 9 m up, bobbing
  _kiteAt(S, hand, out) {
    const D = NR_WIND_DIR, s = Math.min(S, NR.loss);
    return out.set(hand.x + D.x * 9 + 0.6 * Math.sin(s * 0.9), hand.y + 9.0 + 0.5 * Math.sin(s * 1.3) + 0.25 * Math.sin(s * 3.1), hand.z + D.z * 9 + 0.5 * Math.cos(s * 0.7));
  }

  /* ---------------- the chimney's smoke: steam (water: it rides the air) and soot (a solid: after the change it falls) ---------------- */
  _smoke() {
    this.pops = new BillboardSystem(this.app.scene, 64, true);
    this.steam = new BillboardSystem(this.app.scene, 520, false); this.steam.uniforms.uLight.value = 0.9;
    this.soot = new BillboardSystem(this.app.scene, 900, false); this.soot.uniforms.uLight.value = 1.0;
    this.beams = new StreakSystem(this.app.scene, 1600);
    this.hutFlash = new BillboardSystem(this.app.scene, 160, true);
  }

  /* ---------------- per frame ---------------- */
  update(S, cam) {
    const a = nrAero(S), after = S >= NR.loss, u = S - NR.loss, L = nrLoad(S), q = Math.sqrt(Math.max(0, L)), Y = NR_ROOF.y;
    const landed = NR_ICE.landed(S);
    NR_ICY.uIce.value = Math.min(1, landed * 1.6);
    // the sheets: lifted ~65° by the 50 km/h wind and flapping; at the change they swing down and back (a pendulum with
    // nothing to damp it but the cloth) and then hang still, whatever the wind does. In the storm the rain (water: still
    // blown at 110 km/h) drums on them: a lean of ~12° and a shiver. Then the ice shoots their pegs away: each drops
    // straight down and folds over onto the deck
    const rk = MathX.smooth(S, NR.gale[0] + 0.4, NR.gale[0] + 1.8) * (1 - MathX.smooth(landed, 0.05, 0.4));
    for (const Sh of this.sheets) {
      const lz = nrLoad(Math.min(S, NR.loss), Sh.i * 3), th0 = 1.05 * Math.min(1.25, lz) + 0.1 * noise1(Math.min(S, NR.loss) * 1.3 + Sh.i, 7);
      const th = after ? th0 * Math.exp(-0.75 * u) * Math.cos(2.9 * u) + rk * (0.21 + 0.035 * noise1(S * 2.3 + Sh.i * 5, 13)) : th0;
      Sh.U.uTheta.value = th; Sh.U.uRip.value = after ? Math.max(Math.exp(-3.0 * u), 0.075 * rk) : 0.7 + 0.3 * q;
      Sh.U.uT.value = after ? NR.loss + (1 - Math.exp(-3 * u)) / 3 + 0.55 * Math.max(0, S - NR.gale[0]) : S; Sh.U.uLimp.value = after ? MathX.smooth(u, 0.2, 2.0) : 0;
      Sh.U.uLanded.value = landed;
      const ul = S - NR_ROOF_HITS.sheets[Sh.i], top = this.lineY - (ul > 0 ? 0.5 * NR_G * ul * ul : 0), fold = MathX.clamp((Y + 1.72 - top) / 1.67);
      Sh.m.position.y = Math.max(Y + 0.05, top);
      Sh.m.quaternion.copy(Sh.q0); if (fold > 0) { Sh.m.quaternion.multiply(this._qf.setFromAxisAngle(this._xA, -Math.PI / 2 * fold * fold)); Sh.U.uTheta.value *= 1 - fold; Sh.U.uLimp.value = 1 + 1.5 * fold; }
    }
    this.pegs.forEach((p, k) => { const ul = S - NR_ROOF_HITS.sheets[k >> 1]; p.position.y = Math.max(Y + 0.03, this.lineY - 0.02 - (ul > 0 ? 0.5 * NR_G * ul * ul : 0)); });
    // the ghost sheet: what the 110 km/h storm would do to the first sheet in normal air
    const G = this.ghostSheet, ga = MathX.smooth(S, NR.gale[0] + 0.9, NR.gale[0] + 1.5) * (1 - MathX.smooth(S, 29.4, 29.9));
    G.m.visible = ga > 0.001;
    if (G.m.visible) { const U = nrWindKmh(S) / 50 * nrGust(S, 2); G.U.uTheta.value = Math.min(1.5, 1.05 * U * U * 0.45 + 0.4); G.U.uRip.value = 1.5; G.U.uT.value = S * 1.4; G.mat.opacity = 0.55 * ga; G.edge.opacity = 0.85 * ga; }
    // the tablecloth's skirts flap until the change
    this.cloth.U.uFlap.value = after ? 0.6 * Math.exp(-2.5 * u) * Math.cos(6 * u) : Math.min(1.2, L); this.cloth.U.uT.value = Math.min(S, NR.loss + 1); this.cloth.U.uLanded.value = landed;
    // bunting: each pennant lifted by the wind (and fluttering); at the change they swing down and ring to a stop
    let i = 0;
    for (const f of this.flags) {
      const th0 = 1.25 * f.k * Math.min(1.1, nrLoad(Math.min(S, NR.loss), f.p[0])) + 0.3, fl = 0.45 * Math.sin(Math.min(S, NR.loss) * 11 + f.ph) * f.k;
      const th = after ? (th0 + fl) * Math.exp(-0.9 * u) * Math.cos(4.4 * u + f.ph * 0.02) : th0 + fl;
      // swung about the string (tangent t): the tip points down (θ = 0) or out towards the downwind side n
      const c = Math.cos(th), sn = Math.sin(th), X = this._bx || (this._bx = new THREE.Vector3()), Yv = this._by || (this._by = new THREE.Vector3()), Z = this._bz || (this._bz = new THREE.Vector3());
      // its string is cut: it falls ½gt² and lies on the deck
      const ub = S - NR_ROOF_HITS.bunting[f.r], fy = f.p[1] - (ub > 0 ? 0.5 * NR_G * ub * ub : 0), down = fy < Y + 0.33;
      if (down) { X.set(Math.cos(f.ry), 0, Math.sin(f.ry)); Yv.set(Math.sin(f.ry), 0, -Math.cos(f.ry)); Z.set(0, 1, 0); this._m4.makeBasis(X, Yv, Z).setPosition(f.p[0] + 0.15 * Math.sin(f.ry), Y + 0.012 + 0.002 * (i % 5), f.p[2] + 0.15 * Math.cos(f.ry)); }
      else { X.set(f.tx, 0, f.tz); Yv.set(-sn * f.nx, c, -sn * f.nz); Z.crossVectors(X, Yv); this._m4.makeBasis(X, Yv, Z).setPosition(f.p[0], fy, f.p[2]); }
      this.flagM.setMatrixAt(i++, this._m4);
    }
    this.flagM.instanceMatrix.needsUpdate = true;
    for (const St of this.strings) {
      const ub = S - NR_ROOF_HITS.bunting[St.r], a = St.L.geometry.attributes.position.array, dr = ub > 0 ? 0.5 * NR_G * ub * ub : 0;
      if (ub > 0 || !St.reset) { for (let k = 1; k < a.length; k += 3) a[k] = Math.max(Y + 0.012, St.rest[k] - dr); St.L.geometry.attributes.position.needsUpdate = true; St.reset = ub <= 0; }
    }
    // the fairy lights: one bulb after another smashed
    let nOut = 0;
    this.pops.begin(null);
    this.bulbs.forEach((b, k) => {
      const out = S >= b.t; if (out) nOut++;
      this._m4.makeScale(out ? 0.001 : 1, out ? 0.001 : 1, out ? 0.001 : 1).setPosition(b.p[0], b.p[1], b.p[2]); this.bulbM.setMatrixAt(k, this._m4);
      const w = S - b.t; if (w >= 0 && w < 0.12) this.pops.push(b.p[0], b.p[1], b.p[2], 0.12 + 0.6 * w, k, 0.9 * (1 - w / 0.12), 1, 1.0, 0.86, 0.6);
    });
    this.bulbM.instanceMatrix.needsUpdate = true;
    this.pops.end();
    // shards: the skylight's panes (most fall down the stairwell), the chimney pot
    const St = this.app.storm;
    if (St) {
      const K = NR_ROOF.skylight, gl = [0.82, 0.9, 0.96];
      St.beginBits();
      for (const P of this.panes) {
        const t0 = NR_ROOF_HITS.panes[P.i], z0 = K.z + P.s * K.d / 4;
        St.shards(S, t0, [K.x - K.w / 2 + 0.1, K.x + K.w / 2 - 0.1, z0 - K.d / 4 + 0.05, z0 + K.d / 4 - 0.05, Y + K.h], 60, 11 + P.i, Y - 3.0, gl, [-7, 1.0], [0.05, 0.5]);
        St.shards(S, t0, [K.x - K.w / 2 + 0.1, K.x + K.w / 2 - 0.1, z0 - K.d / 4 + 0.05, z0 + K.d / 4 - 0.05, Y + K.h], 26, 21 + P.i, Y + 0.004, gl, [0.5, 3.5], [0.8, 2.6]);
      }
      const ba = this.bottlesAt, ca = this.cakeAt, tb = NR_ROOF.table, tw = S - NR_ROOF_HITS.table, ty = this.tableTop - (tw > 0 ? Math.min(0.68, 0.5 * NR_G * tw * tw) : 0);
      St.shards(S, NR_ROOF_HITS.bottles, [ba[0] - 0.06, ba[0] + 0.06, ba[2] - 0.08, ba[2] + 0.08, ty + 0.15], 46, 41, ty + 0.004, [0.22, 0.48, 0.3], [-1, 3.0], [0.4, 2.2], [0.02, 0.055]);
      St.shards(S, NR_ROOF_HITS.bottles, [ba[0] - 0.06, ba[0] + 0.06, ba[2] - 0.08, ba[2] + 0.08, ty + 0.15], 24, 42, Y + 0.044, [0.22, 0.48, 0.3], [0, 2.6], [1.4, 2.6], [0.02, 0.05]);
      St.shards(S, NR_ROOF_HITS.cake, [ca[0] - 0.12, ca[0] + 0.12, ca[2] - 0.12, ca[2] + 0.12, ty + 0.12], 50, 43, ty + 0.004, [0.95, 0.9, 0.82], [0.2, 2.6], [0.3, 1.6], [0.03, 0.07]);
      St.shards(S, NR_ROOF_HITS.cake, [ca[0] - 0.12, ca[0] + 0.12, ca[2] - 0.12, ca[2] + 0.12, ty + 0.12], 16, 44, Y + 0.044, [0.95, 0.9, 0.82], [0.5, 2.2], [1.2, 2.0], [0.03, 0.07]);
      const C = NR_ROOF.chimney;
      St.shards(S, NR_ROOF_HITS.pot, [C.x - 0.15, C.x + 0.15, C.z - 0.15, C.z + 0.15, Y + C.h + 0.4], 40, 31, Y + C.h + 0.13, [0.62, 0.34, 0.22], [-1, 3.5], [0.6, 2.4], [0.04, 0.1]);
      St.shards(S, NR_ROOF_HITS.pot, [C.x - 0.15, C.x + 0.15, C.z - 0.15, C.z + 0.15, Y + C.h + 0.4], 30, 32, Y + 0.004, [0.62, 0.34, 0.22], [0, 3.0], [1.4, 3.2], [0.04, 0.1]);
    }
    this.potM.visible = S < NR_ROOF_HITS.pot;
    this._wreckUpdate(S);
    this._hutUpdate(S, cam);
    if (St) St.endBits();      // (the shards' pool: begun above, the hut's splinters added in _hutUpdate)
    this.bottles.visible = S < NR_ROOF_HITS.bottles; this.cake.visible = S < NR_ROOF_HITS.cake; this.cakeMess.visible = !this.cake.visible;
    // the kite (its flyer's hand comes from the people; the kite, its tail and its string fall together after the change)
    this._kiteUpdate(S, u, after);
    // the skylight's panes break when the ice gets to them
    for (const P of this.panes) P.p.visible = S < NR_ROOF_HITS.panes[P.i];
    this._smokeUpdate(S, after, u);
  }

  // the cups knocked off, the chairs going over, the table giving way (its legs shot through: the top drops and tilts)
  _wreckUpdate(S) {
    const Y = NR_ROOF.y;
    for (const c of this.cups) {
      const w = S - c.t;
      if (w <= 0) { c.m.position.copy(c.p0); c.m.rotation.set(0, 0, 0); continue; }
      const y = c.p0.y + c.vy * w - 0.5 * NR_G * w * w, fl = Y + 0.05, tl = (c.vy + Math.sqrt(c.vy * c.vy + 2 * NR_G * (c.p0.y - fl))) / NR_G, ww = Math.min(w, tl);
      c.m.position.set(c.p0.x + Math.cos(c.a) * c.v * ww + (w > tl ? Math.cos(c.a) * 0.6 * Math.min(w - tl, 0.5) : 0), Math.max(fl, y), c.p0.z + Math.sin(c.a) * c.v * ww);
      if (w < tl) c.m.rotation.set(c.w * w, 0, c.w * 0.6 * w); else c.m.rotation.set(Math.PI / 2, c.a, 0);
    }
    for (const C of this.chairs) {
      const w = S - C.t, a = w <= 0 ? 0 : Math.min(1, (w / 0.5) ** 2), bounce = w > 0.5 ? 0.06 * Math.exp(-(w - 0.5) * 9) * Math.abs(Math.sin((w - 0.5) * 22)) : 0;
      C.g.rotation.x = C.dir * (Math.PI / 2 * a - bounce);
    }
    const w = S - NR_ROOF_HITS.table, tg = this.tableG, y0 = NR_ROOF.y + 0.04;
    this.legsG.visible = w < 0.02;
    if (w <= 0) { tg.position.y = y0; tg.rotation.set(0, 0, 0); }
    else { const d = Math.min(0.68, 0.5 * NR_G * w * w), k = d / 0.68; tg.position.y = y0 - d; tg.rotation.set(0.11 * k, 0, -0.06 * k); }
  }

  // the stair housing's roof: holes (set in its shader), the light coming through them (seen in the melt-water mist), the
  // splinters and ice falling inside, and more ice coming in through the holes once they're open
  _hutUpdate(S, cam) {
    for (const U of this.holeU) U.uS.value = S;
    const St = this.app.storm; if (!St) return;
    const Bm = this.beams, H = NR_ROOF.hut, Y = NR_ROOF.y, top = Y + H.h - 0.02;
    Bm.begin();
    if (S > NR.roofHit - 0.1 && S < NR.out + 6) {
      const fade = 1 - MathX.smooth(S, NR.quiet + 1.5, NR.out + 5);
      for (const [x, z, t, r] of NR_HUT_HOLES) {
        const w = S - t; if (w < 0) continue;
        const a = (0.05 + 0.03 * hash1(Math.floor(t * 977))) * MathX.smooth(w, 0, 0.25) * fade;
        Bm.push(x, top, z, x + 0.05, Y + 0.02, z - 0.03, 0.78, 0.83, 0.9, a, r * 1.1);
        Bm.push(x, top, z, x + 0.05, Y + 0.6, z - 0.03, 0.85, 0.88, 0.95, a * 0.6, r * 0.5);
      }
    }
    // and the ice that keeps coming in through each hole once it's open: a streak to the floor (1/100 s: longer than the
    // room is high), a spark, chips thrown up off the stairwell floor; the hole's own splinters falling first
    const Fh = this.hutFlash; Fh.begin(null);
    if (S > NR.roofHit - 0.1 && S < NR.quiet + 1.0) {
      for (let i = 0; i < NR_HUT_HOLES.length; i++) {
        const [x, z, t] = NR_HUT_HOLES[i]; if (S < t) continue;
        for (let k = 0; ; k++) {
          const tk = t + k * (0.16 + 0.22 * hash1(i * 101 + k)) / (0.5 + 1.5 * NR_ICE.flux(t)); if (tk > S || tk >= NR.quiet) break;
          const age = S - tk; if (age > 0.6) continue;
          const xs = x + 0.06 * (hash1(i * 131 + k) - 0.5), zs = z + 0.06 * (hash1(i * 137 + k) - 0.5);
          if (age < 0.012) Bm.push(xs, top + 0.3, zs, xs, Y + 0.02, zs, 0.9, 0.95, 1.0, 0.55, 0.012);
          if (age < 0.06) Fh.push(xs, Y + 0.05, zs, 0.12 + 0.6 * age, hash1(k) * 6.3, 0.8 * (1 - age / 0.06), 1, 0.95, 0.98, 1.0);
          for (let q = 0; q < 5; q++) {
            const a = hash1(i * 17 + k * 5 + q) * 6.283, vh = 1.2 + 3.0 * hash1(i * 19 + k * 7 + q), vy = 1.0 + 2.5 * hash1(i * 23 + k * 3 + q), sb = Math.min(age, 1 / 50), ta = age - sb;
            const y = Y + vy * age - 0.5 * NR_G * age * age; if (y < Y) continue;
            Bm.push(xs + Math.cos(a) * vh * ta, Y + vy * ta - 0.5 * NR_G * ta * ta, zs + Math.sin(a) * vh * ta, xs + Math.cos(a) * vh * age, y, zs + Math.sin(a) * vh * age, 0.92, 0.95, 1.0, 0.8 * (1 - age / 0.6), 0.006);
          }
        }
      }
    }
    Fh.end();
    Bm.end();
    NR_HUT_HOLES.forEach(([x, z, t, r], i) => { if (S > t && S < t + 1.0) St.shards(S, t, [x - r, x + r, z - r, z + r, top], 10, 300 + i, Y + 0.01, [0.6, 0.48, 0.34], [-2.5, 0.5], [0.2, 1.4], [0.02, 0.05]); });
  }

  _kiteUpdate(S, u, after) {
    const K = this.app.people && this.app.people.byId.K;
    if (!K) return;
    const hand = K.handWorld(-1, this._kh || (this._kh = new THREE.Vector3()));
    if (!this._kh0) { this._kh0 = new THREE.Vector3(); K.update(NR.loss); K.handWorld(-1, this._kh0); K.update(S); }
    const h0 = S < NR.loss ? hand : this._kh0, kp = this._kiteAt(S, h0, this._kp || (this._kp = new THREE.Vector3()));
    const drop = after ? NR_KITE.fall(u) : 0, floor = LAYOUT.curbH + 0.02, vis = S < NR.cut0;
    this.kiteG.visible = this.kString.visible = this.tail.visible = this.tLine.visible = vis;
    if (!vis) return;
    const ky = Math.max(floor, kp.y - drop);
    this.kiteG.position.set(kp.x, ky, kp.z);
    // it faces back along its string, leaning back; after the change it keeps the slow spin it had
    this.kiteG.lookAt(h0.x, ky + (h0.y - kp.y) + 7.5, h0.z);
    this.kiteG.rotateZ(0.15 * Math.sin(Math.min(S, NR.loss) * 1.7) + (after ? 0.35 * u : 0));
    // the tail: streaming downwind in the wind; after the change it keeps that shape as it falls (nothing changes it)
    const tp = this.tg.attributes.position.array, D = NR_WIND_DIR, s0 = Math.min(S, NR.loss);
    let o = 0;
    for (let k = 0; k < this.tailN; k++) {
      for (const e of [0, 1]) {
        const f = (k + e * 0.999) / this.tailN * 3.2;
        const x = kp.x + D.x * f * 0.9 + 0.15 * Math.sin(f * 3 - s0 * 9), yy = kp.y - 0.75 - f * 0.45 + 0.12 * Math.sin(f * 4 - s0 * 11) - drop, z = kp.z + D.z * f * 0.9 + 0.15 * Math.cos(f * 3 - s0 * 9);
        tp[o++] = x; tp[o++] = Math.max(floor, yy); tp[o++] = z;
      }
    }
    this.tg.attributes.position.needsUpdate = true;
    for (let k = 0; k < this.tailN; k++) { this._m4.makeRotationY(k * 0.7).scale(this._ts || (this._ts = new THREE.Vector3(1.6, 1.6, 1.6))).setPosition(tp[k * 6], tp[k * 6 + 1], tp[k * 6 + 2]); this.tail.setMatrixAt(k, this._m4); }
    this.tail.instanceMatrix.needsUpdate = true;
    // the string: a shallow sag from the hand to the kite; after the change every point of it falls ½gt² too, until it
    // drapes over the parapet (the hand still holds its end)
    const sa = this.kString.geometry.attributes.position.array, par = NR_ROOF.x0 + 0.1, top = NR_ROOF.y + NR_ROOF.par + 0.07;
    for (let k = 0; k <= 40; k++) {
      const f = k / 40, sag = 1.6 * 4 * f * (1 - f);
      let x = h0.x + (kp.x - h0.x) * f, yy = h0.y + (kp.y - h0.y) * f - sag, z = h0.z + (kp.z - h0.z) * f;
      if (after) {
        yy -= drop;
        if (x > par && yy < top) yy = Math.max(yy, top + (x - par) * 0.02);       // caught on the parapet
        if (x <= par) { const over = top; if (yy < over && x > par - 0.4) yy = Math.min(over, Math.max(yy, over - (par - x) * 60)); }
      }
      if (k === 0) { x = hand.x; yy = hand.y; z = hand.z; }
      sa[k * 3] = x; sa[k * 3 + 1] = Math.max(floor, yy); sa[k * 3 + 2] = z;
    }
    this.kString.geometry.attributes.position.needsUpdate = true;
  }

  // the smoke: puffs leave the flue at ~1.5 m/s and ride the wind. Steam always rides it. Soot rides it only until the
  // change: then what is out keeps the velocity it had and falls; no new soot can be lifted, so the smoke turns white
  _smokeUpdate(S, after, u) {
    const St = this.steam, So = this.soot, F = this.flue, D = NR_WIND_DIR, rate = 140, life = 3.2, Y = NR_ROOF.y, storm = MathX.smooth(S, NR.gale[0], NR.gale[1]);
    St.begin(this.app.scene.fog); So.begin(this.app.scene.fog);
    const i0 = Math.floor((S - life) * rate), i1 = Math.floor(S * rate);
    for (let i = i0; i <= i1; i++) {
      const born = i / rate + hash1(i * 3 + 1) * 0.02, age = S - born;
      if (age < 0 || age > life) continue;
      const k = age / life, h1 = hash1(i * 7 + 5), h2 = hash1(i * 11 + 3), h3 = hash1(i * 13 + 9);
      // steam: always carried
      const drift = nrWindDist(S) - nrWindDist(born), rise = (1.5 * age + 0.6 * k) * (14 / Math.max(14, nrWindKmh(S) / 3.6)) ** 0.5;
      const sx = F.x + D.x * drift * (0.82 + 0.16 * h3) + (h1 - 0.5) * (0.3 + 4.0 * k), sz = F.z + D.z * drift * (0.82 + 0.16 * h3) + (h2 - 0.5) * (0.3 + 4.0 * k), sy = F.y + rise + (h3 - 0.5) * (0.2 + 2.2 * k);
      St.push(sx, sy, sz, 0.22 + 1.25 * Math.sqrt(k), i * 1.3 + age * 0.4, 0.09 * (1 - 0.45 * storm) * (1 - k) ** 1.2 * Math.min(1, age * 5), 1.0, 0.93, 0.93, 0.94);
      // soot: a grey-brown haze in the plume before the change
      if (born < NR.loss) {
        if (!after) { So.push(sx + 0.1, sy - 0.05, sz, 0.3 + 1.5 * Math.sqrt(k), i * 0.7, 0.3 * (1 - k) ** 1.3 * Math.min(1, age * 5), 1.0, 0.24, 0.22, 0.2); continue; }
        // out of the plume: it keeps the plume's velocity at the change (the wind's: ~14 m/s) and falls from where it was
        const ageL = NR.loss - born, dL = nrWindDist(NR.loss) - nrWindDist(born), kL = ageL / life;
        const x0 = F.x + D.x * dL * 0.9 + (h1 - 0.5) * (0.2 + 2.2 * kL), z0 = F.z + D.z * dL * 0.9 + (h2 - 0.5) * (0.2 + 2.2 * kL), y0 = F.y + (1.5 * ageL + 0.6 * kL) + (h3 - 0.5) * (0.1 + kL);
        const U = 50 / 3.6 * 0.9, w = u;
        for (let c = 0; c < 4; c++) {     // each puff of soot is many grains: draw a few, spread a little
          const cx = x0 + D.x * U * w + (hash1(i * 5 + c) - 0.5) * 0.5, cz = z0 + D.z * U * w + (hash1(i * 9 + c) - 0.5) * 0.5, cy = y0 - 0.5 * NR_G * w * w + (hash1(i * 3 + c) - 0.5) * 0.3;
          const floor = cx > NR_ROOF.x0 ? Y : 0.2;
          if (cy < floor) continue;
          So.push(cx, cy, cz, 0.12 + 0.1 * hash1(i + c), c, 0.75, 1.0, 0.1, 0.09, 0.08);
        }
        continue;
      }
    }
    St.end(); So.end();
  }
}

