/* =====================================================================
   SET · ROOM — an emergency session: a long table in a dark briefing room, officials in suits, laptops open, a wall
   screen with the new world map (the basin where Africa was, its old coast pulsing red) and a banner. The camera
   drifts down the table toward the screen.
   ===================================================================== */

LOOKS.afSuit1 = { skin: 1, build: 'avg', shirt: '#1d2230', sleeves: 'long', pants: '#1a1d26', shoes: '#111', sole: '#222', hair: '#3a2a1e', jacket: true, collar: true, inner: '#d8dce2' };
LOOKS.afSuit2 = { skin: 3, build: 'broad', shirt: '#2a2a2e', sleeves: 'long', pants: '#222226', shoes: '#111', sole: '#222', hair: '#141010', jacket: true, collar: true, inner: '#cfd4da' };
LOOKS.afSuit3 = { skin: 5, build: 'slim', shirt: '#3a2f3a', sleeves: 'long', pants: '#1f1f24', shoes: '#111', sole: '#2a2a2a', hair: '#6a4a2a', hairStyle: 'bun', jacket: true, inner: '#e6e2dc' };
LOOKS.afSuit4 = { skin: 2, build: 'avg', shirt: '#22303a', sleeves: 'long', pants: '#1b2228', shoes: '#111', sole: '#222', hair: '#222', jacket: true, collar: true, inner: '#dfe4ea' };
LOOKS.afSuit5 = { skin: 0, build: 'slim', shirt: '#2c2c34', sleeves: 'long', pants: '#202024', shoes: '#111', sole: '#222', hair: '#8a6a40', hairStyle: 'long', jacket: true, inner: '#efe9e0' };

AF_SET_BUILDERS.room = (app) => {
  const S = afSet(app, { sky: '#05070a', fov: 38, sun: null, hemi: ['#46566a', '#141210', 0.35], env: ['#2a3442', '#151a20', '#0a0a0a'] });
  const { scene, camera } = S;
  const wall = afMat('#23272c', { roughness: 0.85 }), wood = afMat('#3a2a1e', { roughness: 0.62 }), carpet = afMat('#1d2024', { roughness: 1 });
  afBox(12, 0.1, 20, carpet, 0, -0.05, 0); afBox(12, 4, 0.2, wall, 0, 2, -8.1); afBox(0.2, 4, 20, wall, -6, 2, 0); afBox(0.2, 4, 20, wall, 6, 2, 0); afBox(12, 0.2, 20, afMat('#16191c'), 0, 4.1, 0);
  // wall panels with slim lights
  for (let i = -2; i <= 2; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3, 0.04), new THREE.MeshBasicMaterial({ color: '#c8b48a' })); p.position.set(-5.88, 2, i * 3); scene.add(p); const p2 = p.clone(); p2.position.x = 5.88; scene.add(p2); }
  // the table
  afBox(2.4, 0.08, 9, wood, 0, 0.76, -1.5); afBox(1.8, 0.7, 8.2, afMat('#141414'), 0, 0.36, -1.5);
  // the screen: the world map with the basin, the old coast pulsing, a banner
  // (built on first use: the planet's maps decode asynchronously)
  let mapC = null, edgePts = null;
  const buildMap = () => {
    const day = app.planet.tex.day.image, data = app.planet.tex.data.image;
    mapC = Tex.canvas(1024, 512); const mx = mapC.getContext('2d'); mx.drawImage(day, 0, 0, 1024, 512);
    const dC = Tex.canvas(1024, 512), dx = dC.getContext('2d'); dx.drawImage(data, 0, 0, 1024, 512);
    const D = dx.getImageData(0, 0, 1024, 512).data, img = mx.getImageData(0, 0, 1024, 512), I = img.data; edgePts = [];
    for (let i = 0; i < 1024 * 512; i++) {
      const g = D[i * 4 + 1];
      if (g > 5) { const k = Math.min(1, (g - 5) / 60); I[i * 4] = 10 + 8 * (1 - k); I[i * 4 + 1] = 24 + 10 * (1 - k); I[i * 4 + 2] = 48 + 20 * (1 - k); }
      if (g > 5 && g < 14) edgePts.push(i);
    }
    mx.putImageData(img, 0, 0);
  };
  const scr = afCanvasTex(1280, 720, (x, w, h, st) => {
    x.fillStyle = '#04070b'; x.fillRect(0, 0, w, h);
    if (!mapC) buildMap();
    x.drawImage(mapC, 0, 60, 1280, 640);
    x.fillStyle = `rgba(255,60,40,${0.55 + 0.45 * st.p})`;
    for (const i of edgePts) x.fillRect((i % 1024) * 1.25, 60 + Math.floor(i / 1024) * 1.25, 1.6, 1.6);
    x.fillStyle = '#9b1c16'; x.fillRect(0, 0, w, 60);
    x.fillStyle = '#ffffff'; x.font = `700 38px ${Tex.fontCond}`; x.textAlign = 'left'; x.fillText('EMERGENCY SESSION', 24, 44);
    x.textAlign = 'right'; x.font = `600 30px ${Tex.fontCond}`; x.fillText('DAY 3 · 02:14', w - 24, 42);
    x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, h - 64, w, 64); x.fillStyle = '#ffd38a'; x.textAlign = 'left'; x.font = `600 30px ${Tex.fontCond}`;
    x.fillText('MISSING: 1.58 BILLION   ·   AFRICA: NO CONTACT   ·   SEA LEVEL FALLING', 24, h - 20);
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.15), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }));
  screen.position.set(0, 2.25, -7.95); scene.add(screen);
  const glow = new THREE.PointLight('#7f9cc4', 14, 16, 1.3); glow.position.set(0, 2.2, -6.6); scene.add(glow);
  // light pooled over the table (the fittings are above frame)
  for (const z of [1.6, -1.4, -4.4]) {
    const l = new THREE.PointLight('#ffcf96', 6, 6, 1.5); l.position.set(0, 2.7, z); scene.add(l);
  }
  // officials on both sides, laptops glowing
  const people = [], looks = ['afSuit1', 'afSuit2', 'afSuit3', 'afSuit4', 'afSuit5', 'afSuit2', 'afSuit4', 'afSuit1'];
  const lapM = new THREE.MeshBasicMaterial({ color: '#9fb8d8' }), lapB = afMat('#2a2c30', { roughness: 0.4, metalness: 0.5 });
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1, z = 1.8 - Math.floor(i / 2) * 1.9;
    const p = new Person({ id: 'off' + i, look: looks[i], seat: 0.48, states: [[0, i === 2 ? 'sitSlump' : 'sit']] }, scene);
    p.root.position.set(side * 1.65, 0, z); p.root.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; people.push(p);
    afBox(0.5, 0.48, 0.5, afMat('#151515'), side * 1.75, 0.24, z);
    afBox(0.34, 0.015, 0.24, lapB, side * 0.85, 0.81, z);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.21), lapM); sc.position.set(side * 0.72, 0.92, z); sc.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; sc.rotation.x = 0; scene.add(sc);
  }
  // one standing at the screen
  const pres = new Person({ id: 'pres', look: 'afSuit4', states: [[0, 'idle']] }, scene); pres.root.position.set(-3.25, 0, -6.9); pres.root.rotation.y = 0.7;   // beside the screen, clear of its ticker people.push(pres);
  return {
    scene, camera,
    frame(t) {
      scr.update({ p: Math.round((0.5 + 0.5 * Math.sin(t * 4)) * 6) / 6 });
      for (const p of people) afPose(p, t);
      const k = afK(t, AF.room, AF.halt, Ease.inOutSine);
      afCam(camera, [afLerp(0.45, 0.3, k), afLerp(2.15, 1.95, k), afLerp(8.4, 7.0, k)], [0, afLerp(1.45, 1.6, k), -7.9], 40);
    },
    grade(t, p) { p.warmth = -0.03; p.bloom = 0.5; p.bloomThreshold = 0.8; p.vignette = 0.75; p.exposure = 1.1; },
  };
};
