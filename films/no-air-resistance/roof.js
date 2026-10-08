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
   plume, what comes out next pours back down round the chimney, while the
   steam (water droplets) keeps streaming with the wind.
   From NR_ICE.first the cloud's ice lands: holes punched in the sheets and
   the tablecloth (more and bigger as more of the ice lands), the deck
   whitening with ice powder, and one thing after another broken while
   you watch from the doorway (NR_ROOF_HITS): the bottles, the bunting's
   strings, the cake, the fairy lights, a sheet's pegs, the chimney pot
   (and, off to your left as you get in, the skylight's panes).
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
        float r = (0.12 + 0.2 * nrH(cc + 11.3)) * (0.7 + 0.75 * uLanded), d = length(vec2(float(i), float(j)) + o - f);
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
    this._laundry(); this._bunting(); this._tablecloth(); this._kite(); this._smoke();
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
    // (with a hole under the skylight)
    const K = R.skylight, kx0 = K.x - K.w / 2, kx1 = K.x + K.w / 2, kz0 = K.z - K.d / 2, kz1 = K.z + K.d / 2;
    for (const [a, b, c, d] of [[R.x0 + t, R.x1 - t, R.z0 + t, kz0], [R.x0 + t, R.x1 - t, kz1, R.z1 - t], [R.x0 + t, kx0, kz0, kz1], [kx1, R.x1 - t, kz0, kz1]]) B.add(Geo.flat(a, b, c, d, y + 0.004, 1), this.m.paver, null, { noShadow: true });
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
    // the door frame and the door, swung open against the wall (hinged on the near side)
    for (const z of [dz0, dz1]) B.box(t + 0.06, H.doorH, 0.07, H.x0 + t / 2, y + H.doorH / 2, z, this.m.dark);
    B.box(t + 0.06, 0.08, H.doorW + 0.1, H.x0 + t / 2, y + H.doorH + 0.04, H.door, this.m.dark);
    B.add(new THREE.BoxGeometry(0.05, H.doorH - 0.04, H.doorW - 0.06), this.m.dark, Geo.matrix(H.x0 - (H.doorW - 0.06) / 2 * Math.sin(1.45), y + H.doorH / 2, dz1 + (H.doorW - 0.06) / 2 * Math.cos(1.45), 0, 1.45, 0));
    // roof slab
    B.box(H.x1 - H.x0 + 0.3, 0.18, H.z1 - H.z0 + 0.3, (H.x0 + H.x1) / 2 - 0.1, y + h + 0.09, zc, this.m.hutRoof);
    // inside: a dim stairwell (floor, inner walls, the first steps down)
    B.add(Geo.flat(H.x0 + t, H.x1 - t, H.z0 + t, H.z1 - t, y + 0.01, 1), this.m.inside, null, { noShadow: true });
    B.box(0.02, h - 0.02, H.z1 - H.z0 - 2 * t, H.x1 - t - 0.01, y + h / 2, zc, this.m.inside, 0, { noShadow: true });
    for (const z of [H.z0 + t + 0.01, H.z1 - t - 0.01]) B.box(H.x1 - H.x0 - 2 * t, h - 0.02, 0.02, (H.x0 + H.x1) / 2, y + h / 2, z, this.m.inside, 0, { noShadow: true });
    B.box(H.x1 - H.x0 - 2 * t, 0.02, H.z1 - H.z0 - 2 * t, (H.x0 + H.x1) / 2, y + h - 0.01, zc, this.m.inside, 0, { noShadow: true });
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
    // the soot that pours back down (a black heap that grows round the chimney's foot)
    const pm = new THREE.MeshStandardMaterial({ color: '#141210', roughness: 1 });
    this.pile = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 20, 1, true), pm); this.pile.position.set(C.x, y, C.z); this.pile.visible = false; this.pile.receiveShadow = true; this.app.scene.add(this.pile);
    this.cap = new THREE.Mesh(new THREE.BoxGeometry(C.w + 0.16, 0.02, C.w + 0.16), pm); this.cap.position.set(C.x, y + C.h + 0.125, C.z); this.cap.visible = false; this.app.scene.add(this.cap);
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
  // the party table (its long side along x), a cake, plates, cups, bottles, a speaker; four folding chairs
  _tableBuild() {
    const T = NR_ROOF.table, y = NR_ROOF.y + 0.04, B = this.B, top = y + 0.74, hl = T.len / 2, hw = T.w / 2;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(0.05, 0.72, 0.05, T.x + dx * (hl - 0.1), y + 0.36, T.z + dz * (hw - 0.08), this.m.dark);
    B.box(T.len, 0.03, T.w, T.x, top - 0.015, T.z, this.m.wood);
    this.tableTop = top + 0.012;
    const red = nrIcy(new THREE.MeshStandardMaterial({ color: '#c8352b', roughness: 0.5 })), green = nrIcy(new THREE.MeshStandardMaterial({ color: '#2f6b46', roughness: 0.25, metalness: 0.2 })), icing = this.m.white;
    const yt = this.tableTop;
    const cake = new THREE.Group(), cm = (g, m, x, yy, z) => { const q = new THREE.Mesh(g, m); q.position.set(x, yy, z); q.castShadow = true; cake.add(q); };
    cm(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), new THREE.MeshStandardMaterial({ color: '#f3e3cf', roughness: 0.6 }), T.x + 0.1, yt + 0.06, T.z - 0.05);
    cm(new THREE.CylinderGeometry(0.175, 0.175, 0.03, 20), icing, T.x + 0.1, yt + 0.135, T.z - 0.05);
    for (let k = 0; k < 5; k++) cm(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 5), new THREE.MeshStandardMaterial({ color: ['#e8c34a', '#6fb6e0', '#e86f9f'][k % 3] }), T.x + 0.1 + 0.1 * Math.cos(k * 1.26), yt + 0.18, T.z - 0.05 + 0.1 * Math.sin(k * 1.26));
    this.app.scene.add(cake); this.cake = cake; this.cakeAt = [T.x + 0.1, yt, T.z - 0.05];
    // what's left of it once the ice has been through: a flattened smear
    this.cakeMess = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.025, 14), new THREE.MeshStandardMaterial({ color: '#efe2cf', roughness: 0.8 })); this.cakeMess.position.set(T.x + 0.1, yt + 0.0125, T.z - 0.05); this.cakeMess.visible = false; this.app.scene.add(this.cakeMess);
    B.add(new THREE.CylinderGeometry(0.12, 0.1, 0.06, 16), icing, Geo.matrix(T.x - 0.6, yt + 0.03, T.z + 0.2));
    for (const [dx, dz] of [[-0.75, -0.3], [-0.95, -0.2], [0.75, 0.3], [0.9, 0.12], [0.85, -0.3], [-0.2, 0.3]]) B.add(new THREE.CylinderGeometry(0.045, 0.035, 0.12, 12), red, Geo.matrix(T.x + dx, yt + 0.06, T.z + dz));
    this.bottles = new THREE.Group();
    for (const [dx, dz] of [[-0.25, 0.05], [-0.32, 0.15]]) for (const [g, h] of [[new THREE.CylinderGeometry(0.04, 0.04, 0.24, 10), 0.12], [new THREE.CylinderGeometry(0.015, 0.02, 0.08, 8), 0.28]]) { const q = new THREE.Mesh(g, green); q.position.set(T.x + dx, yt + h, T.z + dz); q.castShadow = true; this.bottles.add(q); }
    this.app.scene.add(this.bottles); this.bottlesAt = [T.x - 0.285, yt, T.z + 0.1];
    B.box(0.12, 0.24, 0.16, T.x + 0.5, yt + 0.12, T.z + 0.25, this.m.dark);
    // four folding chairs (white), on the long sides
    for (const [dx, dz, ry] of [[-0.55, -0.85, 0], [0.5, -0.85, 0], [-0.4, 0.85, Math.PI], [0.6, 0.85, Math.PI]]) {
      const cx = T.x + dx, cz = T.z + dz;
      B.box(0.42, 0.04, 0.42, cx, y + 0.45, cz, this.m.white, ry);
      B.add(new THREE.BoxGeometry(0.42, 0.42, 0.04), this.m.white, Geo.matrix(cx, y + 0.68, cz + (ry ? 0.2 : -0.2), 0, ry, 0));
      for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) B.box(0.03, 0.45, 0.03, cx + lx, y + 0.225, cz + lz, this.m.galv);
    }
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
      for (const f of [0.06, 0.94]) { const peg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.03), this.m.wood); peg.position.set(ax + tx * (s0 + f * W), this.lineY - 0.02, az + tz * (s0 + f * W)); this.app.scene.add(peg); this.pegs.push(peg); }
      return { m, U, i, s0 };
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
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; this.app.scene.add(m);
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
  }

  /* ---------------- the kite: flown from the far end of the roof; at the change it drops into the street ---------------- */
  _kite() {
    const g = new THREE.Group(), c = Tex.canvas(64, 64), x = c.getContext('2d');
    x.fillStyle = '#e8402f'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#f6d24a'; x.beginPath(); x.moveTo(0, 0); x.lineTo(64, 64); x.lineTo(0, 64); x.fill();
    const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.5, 0, -0.42, 0.1, 0, 0, -0.75, 0, 0, 0.5, 0, 0, -0.75, 0, 0.42, 0.1, 0], 3));
    kg.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 1, 0, 0.7, 0.5, 0, 0.5, 1, 0.5, 0, 1, 0.7], 2)); kg.computeVertexNormals();
    const k = new THREE.Mesh(kg, new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.7, side: THREE.DoubleSide })); g.add(k);
    this.app.scene.add(g); this.kiteG = g;
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
  }

  /* ---------------- per frame ---------------- */
  update(S, cam) {
    const a = nrAero(S), after = S >= NR.loss, u = S - NR.loss, L = nrLoad(S), q = Math.sqrt(Math.max(0, L)), Y = NR_ROOF.y;
    const landed = NR_ICE.landed(S);
    NR_ICY.uIce.value = Math.min(1, landed * 1.6);
    // the sheets: lifted ~65° by the 50 km/h wind and flapping; at the change they swing down and back (a pendulum with
    // nothing to damp it but the cloth) and then hang dead still, whatever the wind does
    for (const Sh of this.sheets) {
      const lz = nrLoad(Math.min(S, NR.loss), Sh.i * 3), th0 = 1.05 * Math.min(1.25, lz) + 0.1 * noise1(Math.min(S, NR.loss) * 1.3 + Sh.i, 7);
      const th = after ? th0 * Math.exp(-0.75 * u) * Math.cos(2.9 * u) : th0;
      Sh.U.uTheta.value = th; Sh.U.uRip.value = after ? Math.exp(-3.0 * u) : 0.7 + 0.3 * q;
      Sh.U.uT.value = after ? NR.loss + (1 - Math.exp(-3 * u)) / 3 : S; Sh.U.uLimp.value = after ? MathX.smooth(u, 0.2, 2.0) : 0;
      Sh.U.uLanded.value = landed;
      // the middle sheet's pegs are shot away: it drops straight down and folds up on the deck (the others hang on, shot to lace)
      const ul = Sh.i === 1 ? S - NR_ROOF_HITS.line : -1, top = this.lineY - (ul > 0 ? 0.5 * NR_G * ul * ul : 0), yt = Math.max(Y + 0.08, top);
      Sh.m.position.y = yt; Sh.m.scale.y = MathX.clamp((yt - Y - 0.03) / 1.7, 0.04, 1);
    }
    this.pegs.forEach((p, k) => { const ul = k >> 1 === 1 ? S - NR_ROOF_HITS.line : -1; p.position.y = Math.max(Y + 0.06, this.lineY - 0.02 - (ul > 0 ? 0.5 * NR_G * ul * ul : 0)); });
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
      const ba = this.bottlesAt, ca = this.cakeAt, tb = NR_ROOF.table, ty = this.tableTop;
      St.shards(S, NR_ROOF_HITS.bottles, [ba[0] - 0.06, ba[0] + 0.06, ba[2] - 0.08, ba[2] + 0.08, ty + 0.15], 46, 41, ty + 0.004, [0.22, 0.48, 0.3], [-1, 3.0], [0.4, 2.2], [0.02, 0.055]);
      St.shards(S, NR_ROOF_HITS.bottles, [ba[0] - 0.06, ba[0] + 0.06, ba[2] - 0.08, ba[2] + 0.08, ty + 0.15], 24, 42, Y + 0.044, [0.22, 0.48, 0.3], [0, 2.6], [1.4, 2.6], [0.02, 0.05]);
      St.shards(S, NR_ROOF_HITS.cake, [ca[0] - 0.12, ca[0] + 0.12, ca[2] - 0.12, ca[2] + 0.12, ty + 0.12], 50, 43, ty + 0.004, [0.95, 0.9, 0.82], [0.2, 2.6], [0.3, 1.6], [0.03, 0.07]);
      St.shards(S, NR_ROOF_HITS.cake, [ca[0] - 0.12, ca[0] + 0.12, ca[2] - 0.12, ca[2] + 0.12, ty + 0.12], 16, 44, Y + 0.044, [0.95, 0.9, 0.82], [0.5, 2.2], [1.2, 2.0], [0.03, 0.07]);
      const C = NR_ROOF.chimney;
      St.shards(S, NR_ROOF_HITS.pot, [C.x - 0.15, C.x + 0.15, C.z - 0.15, C.z + 0.15, Y + C.h + 0.4], 40, 31, Y + C.h + 0.13, [0.62, 0.34, 0.22], [-1, 3.5], [0.6, 2.4], [0.04, 0.1]);
      St.shards(S, NR_ROOF_HITS.pot, [C.x - 0.15, C.x + 0.15, C.z - 0.15, C.z + 0.15, Y + C.h + 0.4], 30, 32, Y + 0.004, [0.62, 0.34, 0.22], [0, 3.0], [1.4, 3.2], [0.04, 0.1]);
      St.endBits();
    }
    this.potM.visible = S < NR_ROOF_HITS.pot;
    this.bottles.visible = S < NR_ROOF_HITS.bottles; this.cake.visible = S < NR_ROOF_HITS.cake; this.cakeMess.visible = !this.cake.visible;
    // the kite (its flyer's hand comes from the people; the kite, its tail and its string fall together after the change)
    this._kiteUpdate(S, u, after);
    // the skylight's panes break when the ice gets to them
    for (const P of this.panes) P.p.visible = S < NR_ROOF_HITS.panes[P.i];
    // soot: the heap round the chimney's foot (grows with the time it has been pouring back down)
    const sp = after ? Math.min(1, u / 30) : 0;
    this.pile.visible = this.cap.visible = after && u > 0.6;
    if (this.pile.visible) { const r = 0.62 + 0.75 * Math.sqrt(sp), h = 0.05 + 0.32 * Math.sqrt(sp); this.pile.scale.set(r, h, r); this.pile.position.y = Y + h / 2; }
    this._smokeUpdate(S, after, u);
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
    for (let k = 0; k < this.tailN; k++) { this._m4.makeRotationY(k * 0.7).setPosition(tp[k * 6], tp[k * 6 + 1], tp[k * 6 + 2]); this.tail.setMatrixAt(k, this._m4); }
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
  // change: then what is out keeps the velocity it had and falls, and what comes out next arcs back down onto the roof
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
    // soot coming out after the change: thrown up out of the flue at ~2 m/s, it arcs back down onto the roof (≈ 0.8 s)
    if (after) {
      const rs = 70, tf = 1.0;
      for (let j = Math.floor((S - tf) * rs); j <= Math.floor(S * rs); j++) {
        const born = j / rs; if (born < NR.loss) continue;
        const w = S - born; if (w < 0) continue;
        const v0 = NR_SOOT.v0 * (0.7 + 0.6 * hash1(j * 3 + 2)), ang = hash1(j * 7 + 1) * 6.283, sp = 0.35 + 0.5 * hash1(j * 11);
        const x = F.x + Math.cos(ang) * sp * w, z = F.z + Math.sin(ang) * sp * w, y = F.y + v0 * w - 0.5 * NR_G * w * w;
        const onCap = Math.abs(x - F.x) < NR_ROOF.chimney.w / 2 + 0.07 && Math.abs(z - F.z) < NR_ROOF.chimney.w / 2 + 0.07;
        if (y < (onCap ? F.y - 0.43 : Y)) continue;
        So.push(x, y, z, 0.1 + 0.08 * hash1(j), j, 0.85, 1.0, 0.09, 0.08, 0.07);
      }
    }
    St.end(); So.end();
  }
}

