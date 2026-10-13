/* =====================================================================
   SET · PHONE — late at night, a kitchen table somewhere in Europe. A phone lies by a cold mug: calling "Mama" in
   Lagos. Call failed. "Call again". Calling… Call failed. Then the recent-calls list: every number in
   Africa, dozens of attempts, none answered. The voice stops; the screen dims. Nothing else moves.
   ===================================================================== */

AF_SET_BUILDERS.phone = (app) => {
  const S = afSet(app, { sky: '#06080b', fov: 36, sun: null, hemi: ['#3a4250', '#120e0a', 0.25], env: ['#3a3f48', '#1a1c20', '#0b0a09'] });
  const { scene, camera } = S;
  const TOP = 0.75;
  afBox(1.6, 0.04, 1.0, afMat('#4a3224', { roughness: 0.4 }), 0, TOP - 0.02, -0.1);
  // a warm lamp off to the left, the window's cold light behind
  const lamp = new THREE.PointLight('#ffbf80', 12, 3, 1.6); lamp.position.set(-0.55, 1.15, -0.35); scene.add(lamp);
  const win = new THREE.PointLight('#7d93b8', 2.5, 3, 1.5); win.position.set(0.3, 1.2, -0.9); scene.add(win);
  // things on the table
  const mug = afCyl(0.042, 0.04, 0.095, afMat('#d8d2c8', { roughness: 0.4 }), -0.17, TOP + 0.0475, -0.12);
  const tea = afCyl(0.038, 0.038, 0.004, afMat('#3a2412', { roughness: 0.1 }), -0.17, TOP + 0.085, -0.12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 16), afMat('#d8d2c8', { roughness: 0.4 })); handle.position.set(-0.215, TOP + 0.05, -0.12); handle.rotation.y = Math.PI / 2; scene.add(handle);
  const keys = afBox(0.05, 0.006, 0.02, afMat('#9a9a9e', { roughness: 0.3, metalness: 0.9 }), 0.16, TOP + 0.003, -0.16, null, 0.6); scene.add(keys);
  // the phone
  const body = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.075, 0.008, 0.156, 4, 0.006), afMat('#16171a', { roughness: 0.3, metalness: 0.6 }));
  body.position.set(0, TOP + 0.004, 0); scene.add(body);
  const W = 540, H = 1120;
  const scr = afCanvasTex(W, H, (x, w, h, st) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#16202c'); g.addColorStop(1, '#0a0d12'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = `600 26px ${Tex.fontSans}`; x.fillText('02:14', w / 2, 40);
    if (st.mode === 'list') {
      x.textAlign = 'left'; x.fillStyle = '#ffffff'; x.font = `700 52px ${Tex.fontSans}`; x.fillText('Recents', 34, 140);
      const R = [['Mama', 'Lagos', 23], ['Baba', 'Lagos', 11], ['Ama', 'Accra', 6], ['Uncle Kofi', 'Kumasi', 4], ['Tunde', 'Lagos', 3], ['Office', 'Nairobi', 2], ['Mama', 'Lagos', 19]];
      R.forEach(([n, c, k], i) => {
        const y = 230 + i * 112; x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(24, y - 60, w - 48, 1);
        x.fillStyle = '#ff5a4e'; x.font = `600 40px ${Tex.fontSans}`; x.fillText(`${n} (${k})`, 34, y);
        x.fillStyle = 'rgba(255,255,255,0.55)'; x.font = `400 28px ${Tex.fontSans}`; x.fillText(`${c} · call failed`, 34, y + 36);
        x.textAlign = 'right'; x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillText(i < 2 ? 'now' : 'yesterday', w - 34, y); x.textAlign = 'left';
      });
    } else {
      x.fillStyle = '#3c4a5c'; x.beginPath(); x.arc(w / 2, 300, 96, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#e8edf3'; x.font = `600 96px ${Tex.fontSans}`; x.fillText('M', w / 2, 334);
      x.font = `600 64px ${Tex.fontSans}`; x.fillText('Mama', w / 2, 500);
      x.fillStyle = 'rgba(255,255,255,0.6)'; x.font = `400 32px ${Tex.fontSans}`; x.fillText('mobile · Lagos, Nigeria', w / 2, 552);
      if (st.mode === 'calling') { x.fillStyle = 'rgba(255,255,255,0.85)'; x.font = `400 38px ${Tex.fontSans}`; x.fillText('calling' + '.'.repeat(st.dots), w / 2, 640); }
      else { x.fillStyle = '#ff5a4e'; x.font = `600 42px ${Tex.fontSans}`; x.fillText('Call failed', w / 2, 640); x.fillStyle = 'rgba(255,255,255,0.55)'; x.font = `400 28px ${Tex.fontSans}`; x.fillText('The number cannot be reached', w / 2, 690); }
      if (st.mode === 'calling') { x.fillStyle = '#e5483c'; x.beginPath(); x.arc(w / 2, 940, 64, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.fillRect(w / 2 - 30, 934, 60, 12); }
      else {
        x.fillStyle = st.press ? '#2a8a4a' : '#34b35a'; x.beginPath(); x.arc(w / 2, 940, 64, 0, Math.PI * 2); x.fill();
        if (st.press) { x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, 940, 64 + 40 * st.press, 0, Math.PI * 2); x.stroke(); }
        x.fillStyle = '#fff'; x.font = `600 30px ${Tex.fontSans}`; x.fillText('Call again', w / 2, 1050);
        x.strokeStyle = '#fff'; x.lineWidth = 10; x.beginPath(); x.arc(w / 2, 940, 26, 0.6, 5.6); x.stroke();
      }
    }
    if (st.dim > 0) { x.fillStyle = `rgba(0,0,0,${st.dim})`; x.fillRect(0, 0, w, h); }
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.069, 0.147), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2; screen.position.set(0, TOP + 0.0082, 0); scene.add(screen);
  const scrGlow = new THREE.PointLight('#9fb8e0', 0.5, 0.6, 2); scrGlow.position.set(0, TOP + 0.06, 0); scene.add(scrGlow);
  return {
    scene, camera,
    frame(t) {
      const a = t - AF.phone;
      let mode = 'calling', press = 0;
      if (a >= 1.9 && a < 2.85) mode = 'failed';
      if (a >= 4.6 && a < 5.4) mode = 'failed';
      if (a >= 5.4) mode = 'list';
      if (a >= 2.45 && a < 2.85) press = Math.round(MathX.ramp(a, 2.45, 2.85) * 6) / 6 + 0.01;
      const dim = Math.round(MathX.smooth(t, AF.coast - 1.2, AF.coast - 0.2) * 0.7 * 10) / 10;
      scr.update({ mode, dots: Math.floor((t * 2.5) % 4), press, dim });
      scrGlow.intensity = 0.5 * (1 - dim);
      const k = afK(t, AF.phone, AF.coast, (x) => x);
      afCam(camera, [afLerp(0.035, 0.03, k), TOP + afLerp(0.33, 0.3, k), afLerp(0.2, 0.18, k)], [0, TOP, -0.004], 36, -3);
    },
    grade(t, p) { p.warmth = 0.04; p.bloom = 0.35; p.bloomThreshold = 0.8; p.vignette = 0.8; p.exposure = 1.1; p.grain = 0.03; },
  };
};
