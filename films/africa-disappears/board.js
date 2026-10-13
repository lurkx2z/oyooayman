/* =====================================================================
   SET · BOARD — an airport departures board (Frankfurt, say: no names shown). Every African destination flips,
   row after row, to CANCELLED. A split-flap flicker on each change; the hall behind is dim and cool.
   ===================================================================== */

const AF_BOARD_ROWS = [
  ['08:05', 'LAGOS', 'LH 568'], ['08:20', 'NAIROBI', 'KQ 117'], ['08:35', 'CAIRO', 'MS 786'], ['08:40', 'LONDON', 'BA 903'],
  ['08:55', 'JOHANNESBURG', 'LH 572'], ['09:10', 'CASABLANCA', 'AT 811'], ['09:15', 'NEW YORK', 'UA 961'], ['09:25', 'ADDIS ABABA', 'ET 707'],
  ['09:40', 'ACCRA', 'LH 566'], ['09:50', 'DAKAR', 'SN 205'], ['10:05', 'KINSHASA', 'SN 357'], ['10:15', 'TOKYO', 'NH 204'],
];
const AF_AFRICAN = new Set(['LAGOS', 'NAIROBI', 'CAIRO', 'JOHANNESBURG', 'CASABLANCA', 'ADDIS ABABA', 'ACCRA', 'DAKAR', 'KINSHASA']);

AF_SET_BUILDERS.board = (app) => {
  const S = afSet(app, { sky: '#07090c', fov: 34, sun: null, hemi: ['#9fb0c4', '#1a1c20', 0.5] });
  const { scene, camera } = S;
  const W = 1120, H = 1120;
  const cv = afCanvasTex(W, H, (x, w, h, st) => {
    x.fillStyle = '#0b0d10'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f2c230'; x.font = `700 70px ${Tex.fontCond}`; x.textAlign = 'left'; x.fillText('DEPARTURES', 50, 92);
    x.fillStyle = '#7d8590'; x.font = `600 34px ${Tex.fontCond}`;
    x.fillText('TIME', 34, 160); x.fillText('DESTINATION', 240, 160); x.fillText('STATUS', 740, 160);
    const rowH = 76;
    AF_BOARD_ROWS.forEach((R, i) => {
      const y = 190 + i * rowH;
      x.fillStyle = i % 2 ? '#111419' : '#0e1115'; x.fillRect(16, y, w - 32, rowH - 6);
      const cell = (txt, cx, col, flick) => {
        // split-flap cells: one dark tile per character
        for (let j = 0; j < txt.length; j++) {
          const X = cx + j * 38; x.fillStyle = '#1b1f25'; x.fillRect(X, y + 8, 34, rowH - 22);
          x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(X, y + 8 + (rowH - 22) / 2 - 1, 34, 2);
          let ch = txt[j];
          if (flick && ch !== ' ') ch = String.fromCharCode(65 + Math.floor(hash2(st.f + j, i) * 26));
          x.fillStyle = col; x.font = `600 46px ${Tex.fontCond}`; x.textAlign = 'center'; x.fillText(ch, X + 17, y + rowH - 22);
        }
      };
      cell(R[0], 30, '#c9ccd2', false); cell(R[1], 236, '#e8e8e2', false);
      const s = st.s[i];   // 0 on time, 1 flipping, 2 cancelled
      cell(s === 2 ? 'CANCELLED' : s === 1 ? 'CANCELLED' : (i % 3 ? 'ON TIME  ' : 'BOARDING '), 728, s === 2 ? '#ff4433' : s === 1 ? '#d0d0d0' : '#7fd38a', s === 1);
    });
  });
  const boardM = new THREE.MeshBasicMaterial({ map: cv.tex, toneMapped: false });
  const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), boardM); boardMesh.position.set(0, 5.8, 0); scene.add(boardMesh);
  afBox(9.5, 9.5, 0.4, afMat('#15171a', { roughness: 0.6 }), 0, 5.8, -0.25);
  // the hall: a glossy floor, a ceiling of light strips, two silhouettes looking up
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#2a2e35', roughness: 0.2, metalness: 0.2 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const glow = new THREE.PointLight('#b7c6dc', 30, 40, 1.4); glow.position.set(0, 6, 6); scene.add(glow);
  const hall = new THREE.PointLight('#c9d4e2', 60, 60, 1.2); hall.position.set(2, 9, 26); scene.add(hall);   // the hall's lights behind us
  for (let i = 0; i < 6; i++) { const strip = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 0.4), new THREE.MeshBasicMaterial({ color: '#c9d6e8' })); strip.position.set(0, 13, 4 + i * 4); scene.add(strip); }
  const people = [];
  // travellers stopped under the board, looking up (backs to us)
  for (const [id, look, x, z, ry] of [['b1', 'casual8', -2.6, 9.4, 0.1], ['b2', 'casual1', -0.9, 10.6, -0.05], ['b3', 'casual3', 1.2, 9.0, 0.2], ['b4', 'casual5', 2.9, 11.2, -0.15],
    ['b5', 'casual2', -3.8, 12.4, 0.25], ['b6', 'casual6', 0.4, 12.9, 0.0], ['b7', 'casual4', 3.6, 7.8, -0.3]]) {
    const p = new Person({ id, look, states: [[0, 'idle']] }, scene); p.root.position.set(x, 0, z); p.root.rotation.y = Math.PI + ry; people.push(p);
  }
  return {
    scene, camera,
    frame(t) {
      // each African row flips in turn, starting just after the cut
      let n = 0; const st = { s: [], f: Math.floor(t * 30) };
      AF_BOARD_ROWS.forEach((R, i) => {
        if (!AF_AFRICAN.has(R[1])) { st.s.push(0); return; }
        const tf = AF.board + 0.15 + n * 0.14; n++;
        st.s.push(t < tf ? 0 : t < tf + 0.3 ? 1 : 2);
      });
      cv.update(st);
      for (const p of people) afPose(p, t);
      const k = afK(t, AF.board, AF.port);
      // from a mezzanine rail: the board fills the upper frame (clear of the captions), the travellers below it
      afCam(camera, [afLerp(-1.1, -0.6, k), 3.3, afLerp(20.6, 19.8, k)], [-0.15, 4.25, 0], 50, -1.0);
    },
    grade(t, p) { p.warmth = -0.06; p.bloom = 0.45; p.bloomThreshold = 0.85; p.vignette = 0.7; },
  };
};
