/* =====================================================================
   WATERFRONT — the Embarcadero south of the Ferry Building, where you wait (minutes 1–5), in detail. All of it is
   built in the waterfront frame (eqWFGroup: local x = u along the shore to the south-east, local z = −v; v is out
   to the bay, the seawall is v = 0, the paving EQ_GROUND_Y over the bay's mean level):
     v −128…−52   the inland blocks (offices, the old red-brick building across from the café), side streets
     v −52…−46    the inland pavement      v −46…−35  the south-east-bound lanes     v −35…−25  the median: palms, the
     F-line's two tracks, its wires           v −25…−14  the north-west-bound lanes       v −14…0   the promenade
     v 0…20       the café's platform over the water (u 340…390): BAYSIDE CAFÉ (made up), its terrace, your table
     v 20…172     your pier (u 374…386, made up) to the helipad (u 368…392, v 148…172)
   The ground's shader draws the street, splits it along the median (the crack, eqCrackW), and turns the fill to mud
   (liquefaction). Everything moves as a pure function of story time s and the shaking level.
   ===================================================================== */

const EQ_STREETS = [-480, -250, 0, 240, 460, 680];                   // side streets (u), 22 m wide (0 = Market St)
const EQ_TABLE = { u: 371.9, v: 10.0 };                              // your table on the terrace
const EQ_SEAT = { u: 371.25, v: 10.0 };                              // your chair (you face +u: the Bay Bridge; the Ferry Building is behind you)
const EQ_PAD = { u: 380, v: 160 };                                   // the helipad's centre
const EQ_PIER = { u0: 374, u1: 386, v0: 20, v1: 148 };
// a world yaw for a direction in the waterfront frame (YouCharacter, Person: yaw 0 faces +z)
const eqYawWF = (du, dv) => { const x = du * EQ_WF.w[0] + dv * EQ_WF.n[0], z = du * EQ_WF.w[1] + dv * EQ_WF.n[1]; return Math.atan2(x, z); };

// when the street changes (story seconds, from the narration)
const EQ_WFT = {
  shelves: 120.25,                                                   // the magnitude-five jolt: the shelves go
  glass: eqWord('smash', 'windows').start - EQ.tick0 - 0.05,
  chimneys: eqWord('smash', 'chimneys').start - EQ.tick0 - 0.25,
  alarms: eqWord('smash', 'every').start - EQ.tick0 - 0.3,
  tram: eqWord('streetcar', 'jumps').start - EQ.tick0 - 0.1,
  wet: eqW('mud') - EQ.tick0 + 2.5,
  sink: eqW('sink') - EQ.tick0 - 2.0,
  brick: eqWord('brick', 'first').start - EQ.tick0 - 0.35,
  pier: eqW('pier') - EQ.tick0 + 0.2,
};

function eqWaterfront(scene, app) {
  const g = eqWFGroup(scene), Y = EQ_GROUND_Y;
  const W = { g };
  // ===================================================================================================================
  // THE GROUND: one grid (u every 2 m; v rows dense at the kerbs and along the median, where it splits)
  // ===================================================================================================================
  {
    const us = []; for (let u = -720; u <= 820; u += 2) us.push(u);
    const vs = new Set();
    for (let v = -128; v <= -52; v += 4) vs.add(v);
    for (let v = -52; v <= 0; v += 1) vs.add(v);
    for (let v = -36; v <= -24; v += 0.25) vs.add(+v.toFixed(2));
    const kerbs = [-46, -35, -25, -14];
    for (const k of kerbs) { vs.delete(k); vs.add(k - 0.03); vs.add(k + 0.03); }
    const V = [...vs].sort((a, b) => a - b);
    const pos = [], idx = [], nu = us.length;
    // the raised parts: the pavements, the median, the promenade (15 cm)
    const raised = (v) => (v < -46 || (v > -35 && v < -25) || v > -14 ? 0.15 : 0);
    for (const v of V) for (const u of us) pos.push(u, Y + raised(v), -v);
    for (let j = 0; j < V.length - 1; j++) for (let i = 0; i < nu - 1; i++) { const a = j * nu + i, b = a + 1, c = a + nu, d = c + 1; idx.push(a, c, b, b, c, d); }
    // skirts down the four sides (the terrain is far below the set)
    const skirt = (list) => { const base = pos.length / 3; for (const k of list) pos.push(pos[k * 3], -3, pos[k * 3 + 2]); for (let m = 0; m < list.length - 1; m++) { const a = list[m], b = list[m + 1], A = base + m, B = base + m + 1; idx.push(a, A, b, b, A, B, a, b, A, b, B, A); } };
    skirt(us.map((_, i) => i)); skirt(us.map((_, i) => (V.length - 1) * nu + i)); skirt(V.map((_, j) => j * nu)); skirt(V.map((_, j) => j * nu + nu - 1));
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const U = { uS: { value: 0 }, uCW: { value: 0 }, uGlow: { value: 0 }, uWet: { value: 0 }, uSink: { value: 0 }, uDust: { value: 0 } };
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      const common = `
        uniform float uS, uCW, uGlow, uWet, uSink, uDust;
        float eqH1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
        float eqN1(float x) { float i = floor(x), f = fract(x); return mix(eqH1(i), eqH1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
        float eqH2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        const float EQ_ST[6] = float[6](${EQ_STREETS.map((x) => x.toFixed(1)).join(', ')});
        // the crack along the median (v = −30): its centre wanders, its width is ragged
        float eqCrackC(float u) { return -30.0 + 0.9 * (eqN1(u * 0.11) - 0.5) + 0.35 * (eqN1(u * 0.53 + 7.0) - 0.5); }
        float eqCrackHalf(float u) { return 0.5 * uCW * (0.62 + 0.38 * eqN1(u * 0.27 + 3.0)); }`;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUV; varying float vY0;' + common)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          {
            float u = position.x, v = -position.z; vUV = vec2(u, v); vY0 = position.y;
            if (position.y > -2.0) {
              // the split: inside it the ground drops away; the bay side steps down a little; the slabs tilt into it
              float d = abs(v - eqCrackC(u)), hw = eqCrackHalf(u);
              if (uCW > 0.6) { if (d < hw) transformed.y = ${Y.toFixed(2)} - 4.0 - 2.0 * eqN1(u * 0.7); else transformed.y -= 0.35 * smoothstep(hw + 2.5, hw, d) * min(1.0, uCW / 3.0); }
              if (v > eqCrackC(u)) transformed.y -= 0.12 * min(uCW, 4.0);
              // the fill settles as it turns to mud (lumpy), more near the water
              transformed.y -= uSink * (0.35 + 0.65 * eqN1(u * 0.031 + v * 0.05)) * smoothstep(-130.0, -20.0, v);
            }
          }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vUV; varying float vY0;' + common)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float eqWet = 0.0;
          {
            float u = vUV.x, v = vUV.y;
            vec3 conc = vec3(0.71, 0.69, 0.65), asph = vec3(0.24, 0.245, 0.25), pav = vec3(0.70, 0.63, 0.55), med = vec3(0.47, 0.44, 0.41);
            float n = eqH2(floor(vec2(u, v) * 2.0)) * 0.06 - 0.03;
            vec3 c = conc;
            bool side = false; for (int k = 0; k < 6; k++) { if (abs(u - EQ_ST[k]) < 11.0) side = true; }
            if (v < -52.0) c = side ? asph : conc * 0.97;
            else if (v < -46.0) c = conc;
            else if (v < -35.0 || (v > -25.0 && v < -14.0)) {
              c = asph * (1.0 + n * 2.0);
              // lane lines (dashed white), the edge lines, the crosswalks at each side street
              float lane = (abs(v + 40.5) < 0.08 || abs(v + 19.5) < 0.08) && fract(u / 9.0) < 0.33 ? 1.0 : 0.0;
              float edge = (abs(v + 45.6) < 0.07 || abs(v + 35.4) < 0.07 || abs(v + 24.6) < 0.07 || abs(v + 14.4) < 0.07) ? 1.0 : 0.0;
              float cw = 0.0; for (int k = 0; k < 6; k++) { if (abs(u - EQ_ST[k]) < 3.0 && fract(v / 1.2) < 0.5) cw = 1.0; }
              c = mix(c, vec3(0.86, 0.85, 0.8), max(max(lane, edge), cw) * 0.9);
              if (abs(v + 35.4) < 0.07 || abs(v + 24.6) < 0.07) c = mix(c, vec3(0.86, 0.7, 0.2), 0.8);
            }
            else if (v <= -25.0) { c = med; float bal = eqH2(floor(vec2(u, v) * 6.0)); c *= 0.9 + 0.2 * bal; }
            else if (v <= 0.0) { vec2 q = vec2(u, v) / vec2(0.6, 0.3); vec2 f = abs(fract(q + vec2(floor(q.y) * 0.5, 0.0)) - 0.5); c = pav * (0.95 + 0.1 * eqH2(floor(q))); c *= mix(0.84, 1.0, step(0.06, min(f.x * 0.6, f.y * 0.3) * 10.0)); }
            // kerb faces a little darker
            if (abs(vY0 - ${Y.toFixed(2)} - 0.075) < 0.06) c *= 0.8;
            // the hairline crack (before it opens), and its dark walls once it does
            float d = abs(v - eqCrackC(u)), hw = max(eqCrackHalf(u), 0.04 * step(0.01, uCW));
            float jag = eqN1(u * 3.1) * 0.06;
            if (uCW > 0.0 && d < hw + jag) c = vec3(0.04, 0.035, 0.03);
            float deep = smoothstep(${(Y - 0.6).toFixed(2)}, ${(Y - 4.0).toFixed(2)}, vWP_y);
            c = mix(c, vec3(0.07, 0.06, 0.05), deep);
            c = mix(c, vec3(1.0, 0.45, 0.1) * 2.0, uGlow * deep);
            // liquefaction: the fill goes dark and wet, sand boils (grey cones) and puddles (shiny) spread
            float fill = smoothstep(-130.0, -60.0, v);
            vec2 cell = floor(vec2(u, v) / 7.0); float r = eqH2(cell), r2 = eqH2(cell + 17.0);
            vec2 fc = fract(vec2(u, v) / 7.0) - 0.5 - (vec2(r, r2) - 0.5) * 0.5;
            float boil = smoothstep(0.32, 0.0, length(fc)) * step(0.62, r) * smoothstep(0.0, 0.6, uWet - r2 * 0.4);
            float pud = smoothstep(0.5, 0.75, eqN1(u * 0.09 + 3.0) * eqN1(v * 0.13 + 1.0) * 2.2) * uWet;
            c = mix(c, c * 0.55, fill * uWet * 0.6);
            c = mix(c, vec3(0.42, 0.39, 0.33), boil * fill);
            c = mix(c, vec3(0.2, 0.22, 0.22), pud * fill * 0.7);
            eqWet = max(pud, uWet * 0.4) * fill;
            c = mix(c, vec3(0.66, 0.62, 0.56), uDust * 0.5);
            diffuseColor.rgb = c;
          }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.12, eqWet);`);
      sh.vertexShader = sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP_y = (modelMatrix * vec4(transformed, 1.0)).y;').replace('varying vec2 vUV;', 'varying vec2 vUV; varying float vWP_y;');
      sh.fragmentShader = sh.fragmentShader.replace('varying vec2 vUV;', 'varying vec2 vUV; varying float vWP_y;');
    };
    m.customProgramCacheKey = () => 'eqWfGround';
    const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = true; mesh.frustumCulled = false; g.add(mesh);
    W.ground = { mesh, U };
    // the crack's dark pit under the opened ground (a trough, so no sky shows through the split)
    const pit = eqMesh(new THREE.BoxGeometry(1540, 0.2, 60), eqStd('#0d0b09', 1), 50, Y - 6.5, 30, g); pit.receiveShadow = false; pit.castShadow = false;
  }
  // the seawall (v = 0) and the platform's and pier's edges
  eqMesh(new THREE.BoxGeometry(1540, 15, 1.2), eqStd('#8d8a82', 0.95), 50, Y - 7.4, 0.6, g);
  // ---- the tracks (two pairs of rails on the median) and the overhead wires on their poles
  {
    const rail = eqStd('#8a8580', 0.35, 0.8), RG = new THREE.BoxGeometry(1540, 0.12, 0.08);
    for (const v of [-27.28, -28.72, -31.28, -32.72]) { const r = eqMesh(RG, rail, 50, Y + 0.21, -v, g); r.castShadow = false; }
    const poleM = eqStd('#2c3a34', 0.6, 0.4), wireM = eqStd('#1a1a1a', 0.6, 0.2);
    W.poles = [];
    for (let u = -700; u <= 800; u += 32) { const p = eqMesh(new THREE.CylinderGeometry(0.13, 0.16, 7.6, 8), poleM, u, Y + 0.15 + 3.8, 30, g); const arm = eqMesh(new THREE.BoxGeometry(0.1, 0.1, 5.4), poleM, u, Y + 7.2, 30, g); W.poles.push([p, arm]); }
    for (const v of [-28, -32]) { const w = eqMesh(new THREE.BoxGeometry(1540, 0.03, 0.03), wireM, 50, Y + 6.6, -v, g); w.castShadow = false; }
  }
  // ===================================================================================================================
  // THE INLAND BLOCKS: one instanced mesh on the city's shader (windows, broken glass, the sway, the fall)
  // ===================================================================================================================
  {
    const blocks = [[-700, -491], [-469, -261], [-239, -11], [11, 229], [251, 449], [471, 669], [691, 820]];
    const r = new RNG(77), list = [];
    const pal = { glass: ['#7f96a8', '#8ea4b2', '#6f8698', '#a0b2bc'], stone: ['#c9c0b0', '#d4cbbb', '#b8ae9e', '#e2ddd2', '#cfc6b4'], brick: ['#9a5a44', '#8a4c3a', '#a86a50'] };
    for (const [a, b] of blocks) {
      let u = a;
      while (u < b - 8) {
        let w = Math.min(b - u, r.range(26, 64)); if (b - (u + w) < 18) w = b - u;
        // across from the café: the old red-brick building (five floors, 1900s), on its own
        if (a === 251) { const special = [[251, 330, 44, 'glass', 3], [331, 352, 21, 'stone', 2], [353, 408, 21, 'brick', 1], [409, 449, 62, 'glass', 3]]; for (const sp of special) list.push(sp); break; }
        const tall = r.next(), h = tall < 0.35 ? r.range(55, 110) : tall < 0.8 ? r.range(22, 48) : r.range(14, 22);
        const kind = h > 50 ? 3 : r.next() < 0.3 ? 1 : 2;
        list.push([u + 0.5, u + w - 0.5, h, kind === 3 ? 'glass' : kind === 1 ? 'brick' : 'stone', kind]); u += w;
      }
    }
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const { mat, depth, U } = eqCityMat();
    const mesh = new THREE.InstancedMesh(geo, mat, list.length), fail = new Float32Array(list.length * 3);
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), C = new THREE.Color(), Yax = new THREE.Vector3(0, 1, 0);
    W.blocks = [];
    list.forEach(([u0, u1, h, palk, kind], i) => {
      const uc = (u0 + u1) / 2, vc = -90, [x, z] = eqWF(uc, vc);
      P.set(x, Y - 3, z); Q.setFromAxisAngle(Yax, EQ_WF_ROT); S.set(u1 - u0, h + 3, 76); M4.compose(P, Q, S); mesh.setMatrixAt(i, M4);
      C.set(pal[palk][Math.floor(r.next() * pal[palk].length)]); if (palk === 'brick' && u0 === 353) C.set('#a24f38'); mesh.setColorAt(i, C);
      const sf = u0 === 353 ? EQ_WFT.brick : kind === 1 ? EQ_WFT.brick + 1.5 + r.next() * 6 : eqMagToS(eqFailMag(kind, r.next())) + 4 * r.next();
      fail[i * 3] = sf; fail[i * 3 + 1] = hash1(i * 53 + 11); fail[i * 3 + 2] = kind;
      W.blocks.push({ u0, u1, h, kind, sf, brick: u0 === 353 });
    });
    geo.setAttribute('aFail', new THREE.InstancedBufferAttribute(fail, 3));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.customDepthMaterial = depth;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    W.city = { mesh, U };
    // the brick building's cornice and its chimneys (they fall at "Chimneys fall")
    const brickM = new THREE.MeshStandardMaterial({ map: eqTex(eqBrickCanvas(5, [150, 70, 52])), roughness: 0.9 });
    brickM.map.repeat.set(2, 1);
    W.chimneys = [[362, -60], [376, -74], [391, -62], [401, -80], [338, -66], [430, -70]].map(([u, v], i) => {
      const h = i < 4 ? 21 : i === 4 ? 21 : 62, c = eqMesh(new THREE.BoxGeometry(1.4, 3.2, 1.4), brickM, 0, 0, 0, g); c.position.set(u, Y + h + 1.6, -v); return { c, u, v, h, i };
    }).slice(0, 4);
  }
  // ===================================================================================================================
  // THE CAFÉ: its platform over the water, the pavilion (glass, a white frame, a red awning, its sign), the open
  // counter with its shelves of cups and bottles, the terrace's tables, chairs and umbrellas, your table and cup
  // ===================================================================================================================
  {
    const deckM = new THREE.MeshStandardMaterial({ map: eqTex(eqCanvas(512, 128, (c) => { for (let i = 0; i < 16; i++) { const k = (eqR(i, 3) - 0.5) * 24; c.fillStyle = `rgb(${150 + k},${112 + k},${78 + k})`; c.fillRect(0, i * 8, 512, 7); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, i * 8 + 7, 512, 1); } })), roughness: 0.85 });
    deckM.map.repeat.set(6, 3);
    eqMesh(new THREE.BoxGeometry(50, 0.4, 20), deckM, 365, Y + 0.15 - 0.2 + 0.2, -10, g);
    for (let u = 342; u <= 388; u += 6) for (const v of [2, 10, 18]) eqMesh(new THREE.CylinderGeometry(0.35, 0.35, 14, 8), eqStd('#4a4038', 0.9), u, Y - 7, -v, g);
    // railing round the terrace
    const railM = eqStd('#e8e8e4', 0.4, 0.5);
    for (const [u0, u1, v] of [[362, 388, 20], [340, 362, 20]]) { eqMesh(new THREE.BoxGeometry(u1 - u0, 0.06, 0.06), railM, (u0 + u1) / 2, Y + 1.32, -v, g); for (let u = u0; u <= u1; u += 2) eqMesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), railM, u, Y + 0.85, -v, g); }
    for (let v = 1; v <= 20; v += 2) eqMesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), railM, 389.8, Y + 0.85, -v, g);
    eqMesh(new THREE.BoxGeometry(0.06, 0.06, 19), railM, 389.8, Y + 1.32, -10.5, g);
    // the pavilion (u 341…361, v 3…17)
    const glassM = new THREE.MeshStandardMaterial({ color: '#2d4250', roughness: 0.06, metalness: 0.8, envMapIntensity: 1.4 }), frameM = eqStd('#f2f0ea', 0.5, 0.1);
    const pav = new THREE.Group(); g.add(pav);
    eqMesh(new THREE.BoxGeometry(20, 4.6, 14), glassM, 351, Y + 0.35 + 2.3, -10, pav);
    eqMesh(new THREE.BoxGeometry(21.2, 0.5, 15.2), frameM, 351, Y + 0.35 + 4.85, -10, pav);
    for (const u of [341, 346, 351, 356, 361]) for (const v of [3, 17]) eqMesh(new THREE.BoxGeometry(0.22, 4.6, 0.22), frameM, u, Y + 0.35 + 2.3, -v, pav);
    // the counter's opening on the terrace side (u = 361): a serving window with shelves behind it
    eqMesh(new THREE.BoxGeometry(0.3, 2.2, 8.4), eqStd('#2a1e16', 0.8), 361.05, Y + 0.35 + 2.9, -10, pav);   // the dark inside
    eqMesh(new THREE.BoxGeometry(0.9, 1.05, 8.6), new THREE.MeshStandardMaterial({ map: eqTex(eqCanvas(256, 64, (c) => { c.fillStyle = '#1f5a4c'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#f2f0ea'; c.fillRect(0, 0, 256, 6); })), roughness: 0.6 }), 361.6, Y + 0.35 + 0.53, -10, pav);
    // the red awning over the window, and the sign on the roof
    const awnM = new THREE.MeshStandardMaterial({ map: eqTex(eqCanvas(256, 32, (c) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#f4efe4' : '#c8352a'; c.fillRect(i * 16, 0, 16, 32); } })), roughness: 0.8, side: THREE.DoubleSide });
    const awn = eqMesh(new THREE.PlaneGeometry(9.5, 2.6), awnM, 362.6, Y + 0.35 + 4.1, -10, pav); awn.rotation.set(0, Math.PI / 2, 0); awn.rotateX(-0.5);
    const signT = eqTex(eqCanvas(1024, 160, (c) => { c.fillStyle = '#163a46'; eqRR(c, 4, 4, 1016, 152, 22); c.fill(); c.fillStyle = '#f6efe0'; c.font = '800 104px Montserrat, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BAYSIDE CAFÉ', 512, 86); }), { repeat: false });
    const sign = eqMesh(new THREE.PlaneGeometry(9, 1.4), new THREE.MeshStandardMaterial({ map: signT, roughness: 0.5, transparent: true, alphaTest: 0.5 }), 361.2, Y + 0.35 + 5.9, -10, pav); sign.rotation.y = Math.PI / 2;
    W.pavilion = pav; W.sign = sign;
    // the shelves behind the window: three boards, rows of cups and bottles (they fly off at the magnitude-five jolt)
    const shelfM = eqStd('#6a4a30', 0.7);
    for (const y of [1.6, 2.2, 2.8]) eqMesh(new THREE.BoxGeometry(0.4, 0.05, 7.8), shelfM, 360.6, Y + 0.35 + y, -10, pav);
    const items = []; for (const y of [1.6, 2.2, 2.8]) for (let k = 0; k < 26; k++) items.push([360.6 + (eqR(k, y * 10) - 0.5) * 0.2, y, -13.8 + k * 0.3, k % 3]);
    const itemG = [new THREE.CylinderGeometry(0.05, 0.04, 0.11, 10), new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), new THREE.BoxGeometry(0.09, 0.14, 0.09)];
    const itemM = [eqStd('#f4f0e6', 0.4), new THREE.MeshStandardMaterial({ color: '#2a5a3a', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }), eqStd('#c8a060', 0.7)];
    W.items = items.map(([u, y, v, k], i) => { const m = eqMesh(itemG[k], itemM[k], u, Y + 0.35 + y + [0.08, 0.17, 0.1][k], -v, pav); return { m, u, y: Y + 0.35 + y + [0.08, 0.17, 0.1][k], v, i }; });
    // the terrace: eight tables (yours is the first), chairs, umbrellas
    const tableM = eqStd('#f0eee8', 0.35, 0.2), legM = eqStd('#3a3a3a', 0.5, 0.6), chairM = eqStd('#2b4f5a', 0.6, 0.2);
    const tables = [[EQ_TABLE.u, EQ_TABLE.v], [368, 4.5], [376, 5.0], [383, 11.5], [377, 16.5], [366.5, 15.5], [385.5, 4.5], [384, 17.5]];
    W.tables = tables.map(([u, v], i) => {
      const t = new THREE.Group(); t.position.set(u, Y + 0.35, -v); g.add(t);
      eqMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.035, 24), tableM, 0, 0.74, 0, t); eqMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), legM, 0, 0.37, 0, t); eqMesh(new THREE.CylinderGeometry(0.25, 0.27, 0.03, 16), legM, 0, 0.015, 0, t);
      const chairs = [0, Math.PI].map((a, k) => { const c = new THREE.Group(); const du = Math.cos(a) * 0.68, dv = Math.sin(a) * 0.68; c.position.set(u + du, Y + 0.35, -(v + dv)); c.rotation.y = -a + Math.PI / 2 * 0 + (k ? Math.PI : 0); g.add(c);
        eqMesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), chairM, 0, 0.45, 0, c); eqMesh(new THREE.BoxGeometry(0.04, 0.42, 0.4), chairM, 0.2 * (k ? -1 : 1), 0.68, 0, c);
        for (const [a2, b2] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) eqMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), legM, a2, 0.225, b2, c); return c; });
      // an umbrella on every other table
      let umb = null;
      if (i % 2 === 1) { umb = new THREE.Group(); umb.position.set(u, Y + 0.35, -v); g.add(umb); eqMesh(new THREE.CylinderGeometry(0.025, 0.025, 2.5, 6), legM, 0, 1.25, 0, umb);
        const um = new THREE.MeshStandardMaterial({ map: awnM.map, roughness: 0.8, side: THREE.DoubleSide }); eqMesh(new THREE.ConeGeometry(1.5, 0.55, 16, 1, true), um, 0, 2.45, 0, umb); }
      return { t, chairs, umb, u, v, i };
    });
    // your cup and saucer (the coffee's surface ripples with the ground: eqCupMat)
    const cup = new THREE.Group(); cup.position.set(EQ_TABLE.u - 0.18, Y + 0.35 + 0.758, -(EQ_TABLE.v + 0.12)); g.add(cup);
    const cer = eqStd('#f6f3ec', 0.25, 0.0);
    eqMesh(new THREE.CylinderGeometry(0.075, 0.07, 0.012, 24), cer, 0, 0.006, 0, cup);
    const body = new THREE.LatheGeometry([[0.0, 0.0], [0.03, 0.0], [0.034, 0.004], [0.046, 0.06], [0.047, 0.072], [0.044, 0.072], [0.042, 0.066], [0.031, 0.012], [0.0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
    eqMesh(body, cer, 0, 0.012, 0, cup);
    const handle = eqMesh(new THREE.TorusGeometry(0.018, 0.005, 8, 16, Math.PI * 1.2), cer, 0.05, 0.05, 0, cup); handle.rotation.z = -Math.PI * 0.6;
    const cof = eqCupMat(), surf = eqMesh(new THREE.CircleGeometry(0.0425, 48), cof.mat, 0, 0.068, 0, cup); surf.rotation.x = -Math.PI / 2; surf.castShadow = false;
    W.cup = { g: cup, U: cof.U, world: () => { const v = new THREE.Vector3(); cup.getWorldPosition(v); return v; } };
    // a spoon and a sugar packet next to it, a second cup at the next table
    eqMesh(new THREE.BoxGeometry(0.11, 0.004, 0.012), eqStd('#cfd2d6', 0.2, 0.9), 0.1, 0.014, 0.04, cup).rotation.y = 0.4;
  }
  // ===================================================================================================================
  // THE PIER (pieces that break up from the shore out) AND THE HELIPAD
  // ===================================================================================================================
  {
    const plankM = new THREE.MeshStandardMaterial({ map: eqTex(eqCanvas(128, 512, (c) => { for (let i = 0; i < 64; i++) { const k = (eqR(i, 9) - 0.5) * 30; c.fillStyle = `rgb(${128 + k},${104 + k},${82 + k})`; c.fillRect(0, i * 8, 128, 7); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, i * 8 + 7, 128, 1); } })), roughness: 0.9 });
    plankM.map.repeat.set(1, 1.2);
    const pileM = eqStd('#40362e', 0.95), railM = eqStd('#d8d6d0', 0.5, 0.4);
    W.pier = [];
    for (let v = EQ_PIER.v0, k = 0; v < EQ_PIER.v1; v += 8, k++) {
      const p = new THREE.Group(); p.position.set(380, Y + 0.4, -(v + 4)); g.add(p);
      eqMesh(new THREE.BoxGeometry(12, 0.35, 8), plankM, 0, -0.17, 0, p);
      for (const s of [-1, 1]) { eqMesh(new THREE.BoxGeometry(0.06, 0.06, 8), railM, s * 5.95, 1.1, 0, p); for (const dz of [-3.5, 0, 3.5]) eqMesh(new THREE.BoxGeometry(0.05, 1.1, 0.05), railM, s * 5.95, 0.55, dz, p); }
      const piles = []; for (const s of [-1, 1]) piles.push(eqMesh(new THREE.CylinderGeometry(0.3, 0.3, 14, 8), pileM, s * 5, -7.4, 0, p));
      W.pier.push({ p, v: v + 4, k, f: EQ_WFT.pier + k * 0.33 + eqR(k, 5) * 0.35 });
    }
    // the helipad: a square deck on its own pilings, the H and the circle, the windsock
    const padT = eqTex(eqCanvas(512, 512, (c) => { c.fillStyle = '#3c3e40'; c.fillRect(0, 0, 512, 512); c.strokeStyle = '#f2f0e8'; c.lineWidth = 14; c.beginPath(); c.arc(256, 256, 190, 0, 6.29); c.stroke();
      c.strokeStyle = '#e8c23a'; c.lineWidth = 10; c.strokeRect(14, 14, 484, 484); c.fillStyle = '#f2f0e8'; c.fillRect(176, 146, 40, 220); c.fillRect(296, 146, 40, 220); c.fillRect(216, 236, 80, 40); }), { repeat: false });
    const pad = new THREE.Group(); pad.position.set(EQ_PAD.u, Y + 0.4, -EQ_PAD.v); g.add(pad);
    eqMesh(new THREE.BoxGeometry(24, 0.5, 24), eqStd('#5a5c5e', 0.9), 0, -0.26, 0, pad);
    const top = eqMesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ map: padT, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 0, 0.005, 0, pad); top.rotation.x = -Math.PI / 2;
    for (let a = -10; a <= 10; a += 5) for (let b = -10; b <= 10; b += 5) eqMesh(new THREE.CylinderGeometry(0.35, 0.35, 14, 8), pileM, a, -7.4, b, pad);
    const sock = new THREE.Group(); sock.position.set(11, 0, -11); pad.add(sock);
    eqMesh(new THREE.CylinderGeometry(0.04, 0.05, 4.5, 6), railM, 0, 2.25, 0, sock);
    const sockC = eqMesh(new THREE.CylinderGeometry(0.28, 0.12, 1.6, 12, 1, true), new THREE.MeshStandardMaterial({ map: eqTex(eqCanvas(64, 64, (c) => { for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#f4f2ec' : '#e8582a'; c.fillRect(0, i * 13, 64, 13); } })), side: THREE.DoubleSide, roughness: 0.8 }), 0.8, 4.4, 0, sock);
    sockC.rotation.z = Math.PI / 2;
    W.pad = { pad, sock, f: EQ_WFT.pier + 7.6 };
  }
  // ===================================================================================================================
  // THE PALMS ON THE MEDIAN AND THE LAMPS ON THE PROMENADE (instanced: they sway with the ground and fall)
  // ===================================================================================================================
  {
    // a palm: a curved trunk (rings) and a crown of fronds (one merged geometry each)
    const trunkG = (() => { const geos = []; for (let k = 0; k < 14; k++) { const c = new THREE.CylinderGeometry(0.34 - k * 0.006, 0.37 - k * 0.006, 0.86, 10); c.translate(0.012 * k * k * 0.04, 0.43 + k * 0.85, 0); geos.push(c); } return THREE.mergeGeometries(geos); })();
    const frondTex = eqTex(eqCanvas(64, 256, (c) => { c.clearRect(0, 0, 64, 256); c.strokeStyle = '#3e6a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(32, 0); c.lineTo(32, 256); c.stroke();
      for (let y = 6; y < 250; y += 6) { const w = 30 * Math.sin(Math.PI * y / 256); c.strokeStyle = y % 12 ? '#4f7f34' : '#5d8f3c'; c.lineWidth = 3; c.beginPath(); c.moveTo(32, y); c.lineTo(32 - w, y + 14); c.moveTo(32, y); c.lineTo(32 + w, y + 14); c.stroke(); } }), { repeat: false });
    const fronds = (() => { const geos = []; for (let k = 0; k < 16; k++) { const p = new THREE.PlaneGeometry(1.3, 4.2, 1, 6), P = p.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i) + 2.1; P.setXYZ(i, P.getX(i), 0.9 * Math.sin(y * 0.45) - y * y * 0.07, y); }
      p.rotateY(k * Math.PI * 2 / 16 + (k % 2) * 0.2); p.rotateX(0); p.translate(0, 12.1, 0); geos.push(p); } return THREE.mergeGeometries(geos); })();
    const palmsUV = []; for (let u = -712; u <= 812; u += 17) palmsUV.push([u + (eqR(u, 3) - 0.5) * 3, -30 + (eqR(u, 7) - 0.5) * 1.2]);
    const tI = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ map: eqTex(eqCanvas(64, 64, (c) => { c.fillStyle = '#7a6a52'; c.fillRect(0, 0, 64, 64); for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(40,30,20,0.35)'; c.fillRect(0, i * 8, 64, 2); } })), roughness: 0.95 }), palmsUV.length);
    const fI = new THREE.InstancedMesh(fronds, new THREE.MeshStandardMaterial({ map: frondTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }), palmsUV.length);
    for (const I of [tI, fI]) { I.castShadow = true; I.receiveShadow = true; I.frustumCulled = false; g.add(I); }
    // lamps (u every 30 m on the promenade)
    const lampUV = []; for (let u = -705; u <= 805; u += 30) lampUV.push([u, -12.6]);
    const lampG = (() => { const a = new THREE.CylinderGeometry(0.07, 0.1, 5, 8); a.translate(0, 2.5, 0); const b = new THREE.SphereGeometry(0.28, 12, 8); b.translate(0, 5.2, 0); return THREE.mergeGeometries([a, b]); })();
    const lI = new THREE.InstancedMesh(lampG, eqStd('#2c3a34', 0.5, 0.5), lampUV.length); lI.castShadow = true; lI.frustumCulled = false; g.add(lI);
    W.palms = { tI, fI, lI, palmsUV, lampUV };
  }
  // ===================================================================================================================
  // THE STREETCARS (the F line's vintage cars), THE TRAFFIC
  // ===================================================================================================================
  {
    const car = (body, stripe) => {
      const t = new THREE.Group(); g.add(t);
      const tex = eqTex(eqCanvas(512, 128, (c) => { c.fillStyle = body; c.fillRect(0, 0, 512, 128); c.fillStyle = stripe; c.fillRect(0, 70, 512, 12); c.fillStyle = '#20282c'; for (let i = 0; i < 9; i++) c.fillRect(30 + i * 52, 18, 40, 44); c.fillStyle = '#f2ead0'; c.fillRect(0, 0, 512, 10); }));
      tex.repeat.set(1 / 14.2, -1 / 2.9); tex.offset.set(0.5, 1 / 2.9);                // (extruded sides: uv in metres)
      const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 });
      eqMesh(eqRoundBox(14.2, 2.9, 2.6, 0.9, 0.05, 2), m, 0, 0.55, 0, t);
      const roof = eqMesh(new THREE.BoxGeometry(12.6, 0.25, 2.2), eqStd('#d8d0c0', 0.6), 0, 3.55, 0, t); void roof;
      const pole = eqMesh(new THREE.CylinderGeometry(0.025, 0.025, 5.2, 6), eqStd('#202020', 0.5), -2, 4.3, 0, t); pole.rotation.z = 1.2;
      for (const x of [-4.6, 4.6]) eqMesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), eqStd('#202020', 0.8), x, 0.4, 0, t);
      return t;
    };
    W.tramA = car('#e8722a', '#f6e6b8');            // orange and cream: going south-east, passes the café in minute one
    W.tramB = car('#2f6a4a', '#efe6c8');            // green and cream: stopped at the Mission St stop, thrown off its rails
    const VF = new VehicleFactory(), cols = ['#e8e6e0', '#2a2a30', '#8a2a24', '#3a5a7a', '#c8c4b8', '#4a4a52', '#d8b040', '#1c3a5a', '#6a7a8a', '#f2c21a'];
    const types = ['sedan', 'suv', 'sedan', 'van', 'sedan', 'suv', 'taxi', 'sedan', 'suv', 'taxi'];
    // [lane v, direction (+1 south-east), its u at story second 0, speed m/s]
    // [lane v, direction (+1 south-east), where it ends up stopped (u), speed m/s]: each drives in from far away and
    // brakes when the shaking hits (story second ~124), so most of them stop near the café
    const spec = [[-43, 1, 395, 11], [-38, 1, 352, 12], [-43, 1, 318, 10.5], [-38, 1, 430, 11.5], [-17, -1, 405, 11], [-22, -1, 372, 12], [-17, -1, 330, 10.5], [-22, -1, 455, 11.8],
      [-43, 1, 500, 11], [-17, -1, 262, 11], [-38, 1, 560, 12], [-22, -1, 600, 11.4], [-43, 1, 210, 11.2], [-17, -1, 520, 10.8], [-38, 1, 140, 11.6], [-22, -1, 690, 11]];
    W.cars = spec.map(([v, dir, uStop, sp], i) => { const c = VF.build(types[i % types.length], cols[(i * 3) % cols.length]); scene.add(c.group); return { c, v, dir, u0: uStop - dir * (sp * 124 + sp * sp / 14), sp, i }; });
  }
  // ===================================================================================================================
  // per frame
  // ===================================================================================================================
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  W.frame = (s, lvl, camPos) => {
    const G = eqGround(s, 0, 3), j = (k) => eqGround(s, 0.07 * k, 11 + k);
    // ---- the ground's shader
    const U = W.ground.U; U.uS.value = s; U.uCW.value = eqCrackW(s); U.uGlow.value = MathX.smooth(s, 482, 500) * 0.8;
    U.uWet.value = MathX.smooth(s, EQ_WFT.wet - 3, EQ_WFT.wet + 7); U.uSink.value = MathX.smooth(s, EQ_WFT.wet, EQ_WFT.wet + 25) * 0.55 + MathX.smooth(s, 300, 330) * 0.6;
    U.uDust.value = MathX.smooth(s, EQ_WFT.brick, EQ_WFT.brick + 12) * 0.55;
    // ---- the blocks (windows burst at "Windows burst"; more break each minute)
    const CU = W.city.U; CU.uS.value = s; CU.uLevel.value = lvl; CU.uBreak.value = s < EQ_WFT.glass ? 0 : 0.42 + 0.12 * Math.min(4, eqMinOf(s) - 4); CU.uDust.value = U.uDust.value;
    for (const ch of W.chimneys) {
      const u = s - EQ_WFT.chimneys - ch.i * 0.35; let y = Y + ch.h + 1.6, rx = 0, rz = 0;
      if (u > 0) { const tf = Math.sqrt(2 * ch.h / 9.8); const k = Math.min(u, tf); y -= 4.9 * k * k; rx = 1.4 * Math.min(1, u / tf); rz = 0.6 * Math.min(1, u / tf) * (ch.i % 2 ? 1 : -1); if (u > tf) y = Y + 0.7; }
      ch.c.position.set(ch.u + (u > 0 ? Math.min(u, 2) * 1.5 : 0), y, -ch.v + (u > 0 ? Math.min(u, 2) * 3.2 : 0)); ch.c.rotation.set(rx, 0, rz);
      ch.c.visible = s < EQ_WFT.brick + 1;
    }
    // ---- the café: the cups and bottles fly off the shelves; tables and chairs walk; umbrellas topple
    for (const it of W.items) {
      const u = s - EQ_WFT.shelves - eqR(it.i, 3) * 0.6; const m = it.m;
      if (u <= 0) { m.position.set(it.u + G[0] * 0.3, it.y + Math.max(0, G[1]) * 0.6 * (lvl > 0.01 ? 1 : 0), -it.v); m.rotation.set(0, 0, 0); continue; }
      const vu = -0.8 - eqR(it.i, 5) * 1.6, vy = eqR(it.i, 7) * 1.2, h = it.y - (Y + 0.35) - 0.05, tf = (vy + Math.sqrt(vy * vy + 19.6 * h)) / 9.8, k = Math.min(u, tf);
      m.position.set(it.u + vu * k * 0.7 + 0.6, it.y + vy * k - 4.9 * k * k, -it.v - (eqR(it.i, 9) - 0.5) * k);
      m.rotation.set(k * 6 * eqR(it.i, 11), 0, k * 9 * eqR(it.i, 13)); if (u > tf) { m.position.y = Y + 0.35 + 0.03; m.rotation.x = Math.PI / 2; }
    }
    for (const tb of W.tables) {
      const a = j(tb.i), walk = MathX.smooth(s, 60, 400) * 0;
      const amp = Math.min(1, lvl * 14);
      tb.t.position.set(tb.u + a[0] * amp * 0.9 + walk, Y + 0.35 + Math.max(0, a[1]) * amp * 0.5, -tb.v - a[2] * amp * 0.9); tb.t.rotation.set(a[2] * amp * 0.6, a[0] * amp, a[0] * amp * 0.5);
      tb.chairs.forEach((c, k) => { const b = j(tb.i * 2 + k + 20); c.position.y = Y + 0.35 + Math.max(0, b[1]) * amp * 0.6; c.rotation.z = b[0] * amp; });
      if (tb.umb) { const u = s - 121.5 - tb.i * 0.4; tb.umb.rotation.z = u > 0 ? -1.45 * MathX.clamp(u / 1.1, 0, 1) ** 2 : a[0] * amp * 2; tb.umb.rotation.x = u > 0 ? 0.3 * MathX.clamp(u, 0, 1) : 0; }
    }
    // the cup: it walks across the saucer a little, the coffee ripples (and spills from minute three)
    {
      const a = eqGround(s, 0, 5), amp = Math.min(1, lvl * 30);
      W.cup.g.position.set(EQ_TABLE.u - 0.18 + a[0] * amp * 0.35, Y + 0.35 + 0.758 + Math.max(0, a[1]) * 0.3 * amp, -(EQ_TABLE.v + 0.12) - a[2] * amp * 0.35);
      W.cup.g.rotation.set(a[2] * amp * 0.25, 0, a[0] * amp * 0.25);
      W.cup.U.uS.value = s; W.cup.U.uA.value = Math.min(1, lvl * 220) * (1 - MathX.smooth(s, 120, 125) * 0); W.cup.U.uHz.value = EQ_HZ[Math.min(12, Math.max(3, eqMagOf(s)))];
    }
    // ---- the pier and the helipad
    for (const pc of W.pier) {
      const u = s - pc.f, a = j(pc.k + 40), amp = Math.min(1, lvl * 6);
      if (u <= 0) { pc.p.position.set(380 + a[0] * amp * 0.5, Y + 0.4 + a[1] * amp * 0.4, -pc.v - a[2] * amp * 0.5); pc.p.rotation.set(a[2] * amp * 0.08, 0, a[0] * amp * 0.1); }
      else { const k = MathX.clamp(u / 1.6, 0, 1), side = pc.k % 2 ? 1 : -1; pc.p.position.set(380 + side * 0.8 * k, Y + 0.4 - 3.4 * k * k - Math.max(0, u - 1.6) * 0.3, -pc.v); pc.p.rotation.set((eqR(pc.k, 3) - 0.5) * 0.6 * k, 0, side * 0.5 * k * k); }
      pc.p.visible = u < 30;
    }
    {
      const P = W.pad, u = s - P.f, a = j(60), amp = Math.min(1, lvl * 6);
      if (u <= 0) { P.pad.position.set(EQ_PAD.u + a[0] * amp * 0.4, Y + 0.4 + a[1] * amp * 0.3, -EQ_PAD.v - a[2] * amp * 0.4); P.pad.rotation.set(a[2] * amp * 0.05, 0, a[0] * amp * 0.06); }
      else { const k = MathX.clamp(u / 2.2, 0, 1); P.pad.position.set(EQ_PAD.u, Y + 0.4 - 5.5 * k * k, -EQ_PAD.v); P.pad.rotation.set(0.35 * k * k, 0, -0.25 * k * k); }
      P.sock.rotation.y = 0.6 + 0.2 * Math.sin(s * 0.7);
    }
    // ---- palms and lamps: sway with the ground (each a little behind the last), lean, then fall from magnitude eight
    {
      const { tI, fI, lI, palmsUV, lampUV } = W.palms, R = (u, v, k, tall) => {
        const a = eqGround(s, (u - 380) / 800 * 0.4, 7 + (k % 5)), f = s - (300.5 + eqR(k, 9) * 30 + (tall ? 0 : 60)), sway = lvl * (tall ? 1.6 : 0.9);
        let rx = a[2] * sway + 0.012 * Math.sin(s * 0.8 + k), rz = -a[0] * sway, y = Y + 0.15;
        if (f > 0) { const kk = MathX.clamp(f / 2.4, 0, 1); rz = (k % 2 ? 1 : -1) * 1.5 * kk * kk; rx *= 1 - kk; }
        if (s > EQ_WFT.wet) y -= U.uSink.value * 0.6;
        V.set(u, y, -v); E.set(rx, eqR(k, 3) * 6.28, rz); Q.setFromEuler(E); M4.compose(V, Q, S); return M4;
      };
      palmsUV.forEach(([u, v], k) => { R(u, v, k, true); tI.setMatrixAt(k, M4); fI.setMatrixAt(k, M4); });
      lampUV.forEach(([u, v], k) => { R(u, v, k + 200, false); lI.setMatrixAt(k, M4); });
      for (const I of [tI, fI, lI]) I.instanceMatrix.needsUpdate = true;
      W.poles.forEach(([p, arm], k) => { const a = eqGround(s, k * 0.03, 9); p.rotation.set(a[2] * lvl * 0.9, 0, -a[0] * lvl * 0.9); arm.rotation.copy(p.rotation); });
    }
    // ---- the streetcars
    {
      const A = W.tramA, uA = 372 + 6.5 * (s - 25.5), a = j(70);
      A.position.set(uA, Y + 0.21, 32); A.rotation.set(0, 0, 0); A.visible = uA > -760 && uA < 900;
      const B = W.tramB, u = s - EQ_WFT.tram, b = j(71), amp = Math.min(1, lvl * 5);
      let bu = 452, bv = -28, yaw = 0, roll = 0, y = Y + 0.21;
      if (u > 0) { const k = MathX.clamp(u / 1.8, 0, 1), e = 1 - (1 - k) ** 3; bv += 3.4 * e; bu -= 5 * e; yaw = 0.34 * e; roll = 0.22 * e + 0.25 * Math.sin(Math.min(u, 1.2) * Math.PI / 1.2) * (1 - k); y += 0.9 * Math.sin(Math.min(u, 0.6) / 0.6 * Math.PI); }
      if (s > EQ_WFT.wet) { y -= U.uSink.value * 0.8; roll += U.uSink.value * 0.12; }
      B.position.set(bu + b[0] * amp * 0.3, y + Math.max(0, b[1]) * amp * 0.3, -bv); B.rotation.set(roll, yaw, b[0] * amp * 0.04);
      void a;
    }
    // ---- traffic: drives until everyone stops (magnitude five), alarms flash from "Every car alarm…", then the cars sink
    for (const cc of W.cars) {
      const { c, v, dir, u0, sp, i } = cc, stopS = 124;
      const run = Math.min(s, stopS), brake = s > stopS ? Math.min(s - stopS, sp / 7) : 0;
      const u = u0 + dir * (sp * run + (sp * brake - 3.5 * brake * brake));
      const on = u > -715 && u < 815;
      c.group.visible = on && s < 405;
      if (!on) continue;
      const a = j(80 + i), amp = Math.min(1, lvl * 5), sink = s > EQ_WFT.sink - 6 ? MathX.smooth(s, EQ_WFT.sink - 6 + eqR(i, 5) * 4, EQ_WFT.sink + 12 + eqR(i, 7) * 8) * (0.45 + 0.5 * eqR(i, 9)) : 0;
      const [x, z] = eqWF(u, v);
      c.group.position.set(x + a[0] * amp * 0.3, Y + Math.max(0, a[1]) * amp * 0.5 - sink, z + a[2] * amp * 0.3);
      c.group.rotation.set(sink * 0.25 * (eqR(i, 11) - 0.5) + a[2] * amp * 0.06, eqYawWF(dir, 0) - Math.PI / 2 + (s > stopS ? (eqR(i, 13) - 0.5) * 0.2 * MathX.smooth(s, stopS, stopS + 1.5) : 0), sink * 0.3 * (eqR(i, 15) - 0.5) + a[0] * amp * 0.05);
      const al = s > EQ_WFT.alarms + eqR(i, 17) * 1.2 ? (Math.floor((s + eqR(i, 19)) * 2.2) % 2 ? 1 : 0) : 0;
      if (c.hazard) c.hazard.emissiveIntensity = al * 2.4;
      for (const w of c.wheels) w.rotation.z = -(u - u0) / 0.33 * dir;
    }
    void camPos; void app;
  };
  return W;
}

// the coffee: a dark glossy surface whose normals ripple (standing waves set by the ground's shaking)
function eqCupMat() {
  const U = { uS: { value: 0 }, uA: { value: 0 }, uHz: { value: 7 } };
  const m = new THREE.MeshStandardMaterial({ color: '#2a170c', roughness: 0.08, metalness: 0.0, envMapIntensity: 1.3 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCup;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCup = position.xy / 0.0425;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vCup; uniform float uS, uA, uHz;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float r = length(vCup), th = atan(vCup.y, vCup.x);
          float w = sin(r * 18.0 - uS * 6.0) * 0.6 + sin(r * 31.0 + uS * 4.0) * cos(th * 4.0) * 0.4;
          float a = uA * (0.25 + 0.75 * abs(sin(uS * uHz * 3.14159)));
          vec3 nn = vec3(cos(th) * w * a * 0.5, sin(th) * w * a * 0.5, 1.0);
          normal = normalize(normal + (viewMatrix * vec4(nn.x, 0.0, -nn.y, 0.0)).xyz); }
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.36, 0.2), smoothstep(0.86, 1.0, length(vCup)) * 0.8);`);
  };
  m.customProgramCacheKey = () => 'eqCup';
  return { mat: m, U };
}
