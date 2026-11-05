/* =====================================================================
   TRAFFIC — on the viaduct: your car (inside: the dashboard, its two screens, the wheel, the seats, your dad until
   7:42:00, his coffee, his phone, his seatbelt; outside: the shared VehicleFactory body), the lorry (tractor and
   trailer, its empty cab, its wheel turning by itself, the sparks along the barrier), the other cars (each on its
   own cruise control or assistant: some stop themselves with their hazards on, some drift into a barrier), and the
   people on the deck (walking home at 9:10; looking up at 10:21).
     mgBuildYourCar(S) → YC · mgBuildLorry(S) → LR · mgBuildTraffic(S) → TR · mgBuildDeckPeople(S) → DP
   Car-local axes: x forward, y up from the road, z right. A body's rotation.y = −yaw (+ yaw = nose right, to +z).
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE SCREENS (canvas textures: mgCanvasTex(w, h, draw) → { tex, update(state) })
// ---------------------------------------------------------------------------------------------------------------------
// the instrument cluster: speed, CRUISE, the parking brake's P, the hazard triangle, the time and the outside air
function mgDrawCluster(g, w, h, st) {
  g.fillStyle = '#050608'; g.fillRect(0, 0, w, h);
  const v = Math.round(st.v * 3.6), c = mgClockParts(st.s);
  // the speed: big digits in the middle, an arc of the dial round them
  g.strokeStyle = 'rgba(120,150,190,0.35)'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h * 0.98, h * 0.82, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
  g.strokeStyle = '#7cc4ff'; g.beginPath(); g.arc(w / 2, h * 0.98, h * 0.82, Math.PI * 1.12, Math.PI * (1.12 + 0.76 * Math.min(1, v / 200))); g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = '700 96px sans-serif'; g.fillText(String(v), w / 2, h * 0.7);
  g.font = '600 26px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText('km/h', w / 2, h * 0.86);
  // cruise control (green, set to 100) until the brake cancels it
  g.textAlign = 'left'; g.font = '700 28px sans-serif';
  if (st.cruise) { g.fillStyle = '#5cff8a'; g.fillText('CRUISE 100', 22, 44); }
  if (st.epb) { g.strokeStyle = '#ff3b2a'; g.lineWidth = 5; g.beginPath(); g.arc(w - 64, 50, 28, 0, 6.29); g.stroke(); g.fillStyle = '#ff3b2a'; g.font = '800 34px sans-serif'; g.textAlign = 'center'; g.fillText('P', w - 64, 62);
    g.font = '700 22px sans-serif'; g.fillText(st.v > 0.3 ? 'EMERGENCY BRAKE' : 'BRAKE ON', w - 150, 120); }
  if (st.hazard) { g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(52, h - 60); g.lineTo(80, h - 16); g.lineTo(24, h - 16); g.closePath(); g.fill(); }
  g.textAlign = 'right'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = '600 24px sans-serif';
  g.fillText(`${c.h}:${String(c.m).padStart(2, '0')}   4 °C`, w - 22, h - 20);
  g.textAlign = 'left'; g.fillText('D', 22, h - 20);
}
// the centre screen: the radio (an automatic playlist: a computer picks the songs)
function mgDrawRadio(g, w, h, st) {
  g.fillStyle = '#0b0f16'; g.fillRect(0, 0, w, h);
  const songs = [['Northern Lines', 'The Halcyons', 214], ['Slow Weather', 'Mara Lind', 198], ['Kite Season', 'Juno & the Bay', 226], ['Nine Rivers', 'Odile Sun', 241]];
  let t = st.s + 151, i = 0; while (t > songs[i % 4][2]) { t -= songs[i % 4][2]; i++; }
  const [ti, ar, len] = songs[i % 4];
  g.fillStyle = '#e8b04a'; g.font = '700 20px sans-serif'; g.fillText('RADIO VALLEY 98.4', 18, 32);
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = '600 16px sans-serif'; g.fillText('AUTO MIX · NON-STOP', 18, 56);
  g.fillStyle = '#ffffff'; g.font = '700 30px sans-serif'; g.fillText(ti, 18, 104); g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '500 22px sans-serif'; g.fillText(ar, 18, 134);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(18, 160, w - 36, 6); g.fillStyle = '#e8b04a'; g.fillRect(18, 160, (w - 36) * t / len, 6);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = '500 15px sans-serif'; g.fillText(`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`, 18, 186);
  g.textAlign = 'right'; g.fillText('NEXT: ' + songs[(i + 1) % 4][0], w - 18, 186); g.textAlign = 'left';
}
// a phone's screen: what = 'lock' | 'call' (MUM calling) | 'failed' (the network is jammed) | 'alert' (the emergency alert)
function mgDrawPhone(g, w, h, st) {
  const c = mgClockParts(Math.max(0, st.s));
  const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#26304a'); grd.addColorStop(1, '#0c1018'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.fillStyle = '#ffffff';
  g.font = '600 22px sans-serif'; g.textAlign = 'left'; g.fillText(`${c.h}:${String(c.m).padStart(2, '0')}`, 26, 38);
  // the signal bars: few (the network is overloaded)
  for (let k = 0; k < 4; k++) { g.fillStyle = k < (st.bars ?? 1) ? '#ffffff' : 'rgba(255,255,255,0.25)'; g.fillRect(w - 92 + k * 12, 34 - 6 - k * 5, 8, 6 + k * 5); }
  g.textAlign = 'center';
  if (st.what === 'lock') { g.font = '300 110px sans-serif'; g.fillText(`${c.h}:${String(c.m).padStart(2, '0')}`, w / 2, h * 0.3); g.font = '500 24px sans-serif'; g.fillText('Tuesday 10 November', w / 2, h * 0.36); }
  else if (st.what === 'call' || st.what === 'failed') {
    g.font = '500 26px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText(st.what === 'call' ? 'incoming call' : 'Call failed', w / 2, h * 0.17);
    g.fillStyle = '#ffffff'; g.font = '600 76px sans-serif'; g.fillText('MUM', w / 2, h * 0.27);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = '500 24px sans-serif'; g.fillText(st.what === 'call' ? 'mobile' : 'Network busy · 3 missed calls', w / 2, h * 0.32);
    if (st.what === 'call') { const p = 0.5 + 0.5 * Math.sin(st.s * 6); for (const [x, col] of [[w * 0.27, '#e5483a'], [w * 0.73, '#3ac46a']]) { g.fillStyle = col; g.beginPath(); g.arc(x, h * 0.84, 46 + 6 * p * (col === '#3ac46a'), 0, 6.29); g.fill(); } }
    else { g.fillStyle = 'rgba(255,255,255,0.12)'; mgRR(g, 40, h * 0.74, w - 80, 90, 24); g.fill(); g.fillStyle = '#ffffff'; g.font = '600 28px sans-serif'; g.fillText('Call back', w / 2, h * 0.74 + 56); }
  } else if (st.what === 'alert') {
    g.fillStyle = 'rgba(16,18,24,0.95)'; mgRR(g, 22, 90, w - 44, 520, 26); g.fill();
    g.fillStyle = '#ff4a3a'; g.font = '800 26px sans-serif'; g.textAlign = 'left'; g.fillText('⚠ EMERGENCY ALERT', 44, 140);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = '500 20px sans-serif'; g.fillText('National Alert · now', 44, 172);
    g.fillStyle = '#ffffff'; g.font = '600 25px sans-serif';
    const lines = ['From the Deputy Minister of', 'the Interior, acting head of', 'government. Stay where you', 'are. Do not drive. Keep', 'phone lines free for', 'emergencies. Help is being', 'organised. More soon.'];
    lines.forEach((l, i) => g.fillText(l, 44, 222 + i * 40));
    g.textAlign = 'center';
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR CAR
// ---------------------------------------------------------------------------------------------------------------------
// a box between two car-local points (a beam: pillars, belts)
function mgBeam(a, b, w, h, mat, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat); mgBeamSet(m, a, b, w, h); parent.add(m); return m;
}
function mgBeamSet(m, a, b, w, h) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-6;
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.divideScalar(L)); m.scale.set(L, h, w);
}

function mgBuildYourCar(S) {
  const C = MG_CAR, car = new THREE.Group(); S.scene.add(car);
  const VF = mgBuildYourCar.VF || (mgBuildYourCar.VF = new VehicleFactory());
  // ---- outside: the shared body (drawn when the camera is outside the car)
  const ext = VF.build('sedan', C.color); car.add(ext.group); ext.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // ---- inside (drawn when you are in it): a cabin of its own (the shared body is a closed solid: from inside its top
  // face at the waistline would hide everything below it), the bonnet and wings seen through the windscreen
  const inn = new THREE.Group(); car.add(inn);
  const M = { dash: mgStd('#26282c', 0.72), trim: mgStd('#34373c', 0.75), seat: mgStd('#3a3e46', 0.95), liner: mgStd('#bdb8ad', 0.92), carpet: mgStd('#1c1e22', 0.98),
    paint: mgStd(C.color, 0.32, 0.35, { envMapIntensity: 1.2 }), black: mgStd('#121314', 0.5), chrome: mgStd('#b8bcc0', 0.25, 0.9), mirror: mgStd('#5a6a7a', 0.05, 0.9, { envMapIntensity: 2 }), belt: mgStd('#1f2024', 0.8) };
  const B = (w, h, d, m, x, y, z, rz = 0, ry = 0, rx = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = false; o.receiveShadow = true; inn.add(o); return o; };
  B(3.0, 0.06, 1.62, M.carpet, -0.2, 0.27, 0);                                // the floor
  B(0.1, 0.48, 1.6, M.carpet, 1.2, 0.52, 0);                                  // the footwells' front
  B(0.5, 0.34, 1.6, M.dash, 1.03, 0.8, 0);                                    // the dashboard
  B(0.48, 0.04, 1.6, M.dash, 1.04, 0.985, 0, -0.06);                          // its top (meets the windscreen's base)
  B(0.16, 0.075, 0.44, M.dash, 0.86, 1.02, -0.38);                            // the cluster's hood
  B(0.1, 0.22, 0.36, M.trim, 0.76, 0.72, 0);                                  // the centre stack
  B(0.96, 0.3, 0.26, M.trim, 0.3, 0.45, 0);                                   // the console between the seats
  B(0.34, 0.2, 0.26, M.trim, 0.66, 0.66, 0, 0.5);                             // its slope up to the dash
  B(0.05, 0.022, 0.034, M.black, C.epb[0], C.epb[1] - 0.012, C.epb[2]);        // the parking-brake switch's well
  const epb = B(0.04, 0.018, 0.028, mgStd('#3a3c40', 0.5), C.epb[0], C.epb[1], C.epb[2]);   // the switch (pulled up at the brake)
  { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.07, 12), M.black); k.position.set(C.epb[0] + 0.15, 0.64, 0); inn.add(k); }   // the gear selector
  // the hazard switch (a red triangle on the centre stack)
  const hz = B(0.012, 0.035, 0.05, new THREE.MeshStandardMaterial({ color: '#7a1a12', emissive: new THREE.Color('#ff3a20'), emissiveIntensity: 0 }), 0.705, 0.84, 0);
  // the seats: cushion, back (leaning back), headrest; the rear bench
  for (const z of [C.seatL[2], C.seatR[2]]) {
    B(0.52, 0.13, 0.5, M.seat, C.seatL[0] + 0.07, 0.5, z, 0.1);
    B(0.13, 0.68, 0.52, M.seat, C.seatL[0] - 0.25, 0.87, z, 0.22);
    B(0.11, 0.2, 0.27, M.seat, C.seatL[0] - 0.36, 1.27, z, 0.12);
    B(0.04, 0.12, 0.04, M.chrome, C.seatL[0] - 0.33, 1.15, z - 0.07); B(0.04, 0.12, 0.04, M.chrome, C.seatL[0] - 0.33, 1.15, z + 0.07);
  }
  B(0.52, 0.15, 1.44, M.seat, -0.98, 0.48, 0, 0.08); B(0.13, 0.62, 1.44, M.seat, -1.24, 0.83, 0, 0.22); B(0.06, 0.04, 1.44, M.trim, -1.5, 1.0, 0);
  // the doors (inner panels, armrests), the outer skins below the windows (seen when you look out and down)
  for (const sd of [-1, 1]) {
    B(2.3, 0.68, 0.06, M.trim, -0.24, 0.64, sd * 0.86); B(0.55, 0.06, 0.09, M.dash, 0.12, 0.72, sd * 0.8); B(2.34, 0.035, 0.12, M.dash, -0.24, 0.985, sd * 0.86);
    B(2.6, 0.5, 0.04, M.paint, -0.2, 0.74, sd * 0.93);
    B(0.12, 0.09, 0.22, M.paint, 0.98, 1.04, sd * 1.03); B(0.012, 0.075, 0.19, M.mirror, 0.915, 1.04, sd * 1.03);   // the outside mirrors
  }
  // the pillars, the roof, the windscreen's header, the rear-view mirror, the sun visors
  const [sx0, sy0, sx1, sy1] = C.shield;
  for (const sd of [-1, 1]) {
    mgBeam([sx0, sy0, sd * 0.8], [sx1, sy1, sd * 0.72], 0.08, 0.07, M.trim, inn);
    mgBeam([-0.31, 0.98, sd * 0.85], [-0.36, 1.39, sd * 0.74], 0.07, 0.12, M.trim, inn);
    mgBeam([-1.36, 0.98, sd * 0.84], [-0.86, 1.39, sd * 0.72], 0.08, 0.24, M.trim, inn);
    B(0.22, 0.016, 0.36, M.liner, 0.6, 1.375, sd * 0.4, 0.15);
  }
  B(2.12, 0.04, 1.56, M.liner, -0.36, 1.415, 0); B(0.08, 0.06, 1.52, M.trim, sx1 + 0.02, 1.395, 0);
  B(0.03, 0.07, 0.25, M.mirror, 0.6, 1.3, 0); B(0.05, 0.08, 0.02, M.black, 0.62, 1.35, 0);
  // the bonnet and the wings (seen through the windscreen), the wipers
  B(1.08, 0.05, 1.74, M.paint, 1.84, 0.895, 0, -0.17); for (const sd of [-1, 1]) B(1.05, 0.36, 0.1, M.paint, 1.82, 0.73, sd * 0.88);
  B(0.5, 0.012, 0.025, M.black, 1.36, 1.0, -0.3, 0, 0.12); B(0.5, 0.012, 0.025, M.black, 1.36, 1.0, 0.25, 0, 0.12);
  // ---- the screens
  const cluster = mgCanvasTex(512, 200, mgDrawCluster), radio = mgCanvasTex(320, 200, mgDrawRadio);
  const scr = (tex, w, h, x, y, z, tilt) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); m.position.set(x, y, z); m.rotation.order = 'YXZ'; m.rotation.y = -Math.PI / 2; m.rotation.x = tilt; inn.add(m); return m; };
  scr(cluster.tex, 0.3, 0.117, 0.795, 0.93, -0.38, -0.12);
  scr(radio.tex, 0.21, 0.13, 0.708, 0.71 + 0.0, 0.0, 0.0).position.y = 0.72;
  // ---- the steering wheel (on its column; it turns by P.wheelTurn)
  const wheelG = new THREE.Group(); wheelG.position.set(...C.wheel); wheelG.rotation.z = -C.wheelTilt; inn.add(wheelG);
  const spin = new THREE.Group(); wheelG.add(spin);
  { const rim = new THREE.Mesh(new THREE.TorusGeometry(C.wheelR, 0.017, 10, 40), M.black); rim.rotation.y = Math.PI / 2; spin.add(rim);
    for (const [y, z, h, d] of [[-0.01, -0.1, 0.03, 0.16], [-0.01, 0.1, 0.03, 0.16], [-0.1, 0, 0.13, 0.035]]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, d), M.dash); sp.position.set(0.01, y, z); spin.add(sp); }
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.085, 0.11), M.dash); hub.position.set(0.02, -0.01, 0); spin.add(hub);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.42, 10).rotateZ(Math.PI / 2).translate(0.23, 0, 0), M.dash); wheelG.add(col); }
  // ---- your dad (driving; his right hand on his coffee), his seatbelt
  const dad = mgPerson('mgDad', inn, { id: 'dad' });
  const dadPose = (() => { const p = MG_POSES.drive(); p.rSh = [0.95, -0.12]; p.rEl = 1.75; p.lSh = [1.0, 0.25]; p.lEl = 0.8; p.neck = 0.02; return p; })();
  mgPose(dad, dadPose, C.seatL[0], C.seatL[1] - 0.47, C.seatL[2], Math.PI / 2);
  car.updateMatrixWorld(true);
  const _v = new THREE.Vector3(), cup0 = inn.worldToLocal(dad.j.ra.hand.getWorldPosition(_v).clone()).add(new THREE.Vector3(0.0, -0.05, 0.03));
  const cup = new THREE.Group(); inn.add(cup);
  { const body = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.034, 0.13, 16, 1, true), mgStd('#efe9dc', 0.6, 0, { side: THREE.DoubleSide })); cup.add(body);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.0445, 0.04, 0.05, 16, 1, true), mgStd('#8a5a32', 0.9)); sleeve.position.y = -0.01; cup.add(sleeve);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.014, 16), mgStd('#2a2a2c', 0.5)); lid.position.y = 0.068; cup.add(lid);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.034, 16), mgStd('#e8e2d4', 0.6)); bot.rotation.x = Math.PI / 2; bot.position.y = -0.0645; cup.add(bot); }
  // the coffee on the seat (a stain that spreads; lifted 4 mm over the cushion with a polygon offset)
  const stain = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.3, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }));
  stain.rotation.set(-Math.PI / 2 + 0.1, 0, 0); stain.rotation.order = 'ZXY'; stain.position.set(C.seatL[0] + 0.2, 0.572, C.seatL[2] + 0.12); stain.visible = false; inn.add(stain);
  const belt = [mgBeam([0, 0, 0], [1, 0, 0], 0.048, 0.004, M.belt, inn), mgBeam([0, 0, 0], [1, 0, 0], 0.048, 0.004, M.belt, inn), mgBeam([0, 0, 0], [1, 0, 0], 0.048, 0.004, M.belt, inn)];
  // ---- his phone (on the console's tray; it slides into his footwell when you brake)
  const PH = mgCanvasTex(400, 840, mgDrawPhone), phone = new THREE.Group(); inn.add(phone);
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.152, 0.008, 0.072), mgStd('#1c1e22', 0.35, 0.4)));
  { const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.145, 0.066), new THREE.MeshBasicMaterial({ map: PH.tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); sc.rotation.set(-Math.PI / 2, 0, Math.PI / 2); sc.position.y = 0.0042; phone.add(sc); phone.screen = sc; }
  const phLight = new THREE.PointLight('#cfe0ff', 0, 0.9, 1.6); phLight.position.y = 0.08; phone.add(phLight);
  // the interior's own light (the sky through the glass; a soft fill so the cabin isn't black against the bright day)
  const fill = new THREE.PointLight('#e6edf5', 0.0, 3.2, 1.4); fill.position.set(0.2, 1.3, 0); inn.add(fill);

  const YC = {
    car, ext, inn, dad, cup, stain, phone, PH, cluster, radio, wheelG, spin, epb, hz, fill,
    _hz: false,
    // where you are (car-local) → world
    toWorld(p, out = new THREE.Vector3()) { return out.set(p[0], p[1], p[2]).applyMatrix4(inn.matrixWorld); },
    update(s, o = {}) {
      const P = MGP, cx = P.carX(s), cz = P.carZ(s), dec = P.carDecel(s);
      car.position.set(cx, MG_V.deckY, cz); car.rotation.set(0, -P.carYaw(s), 0); car.rotation.order = 'YXZ';
      // the nose dips under the brake (and comes back up with a little rock when it stops)
      const rock = s > P.car.sStop ? 0.006 * Math.exp(-(s - P.car.sStop) * 2.2) * Math.cos((s - P.car.sStop) * 9) : 0;
      car.rotation.z = -0.0062 * dec - rock;
      car.position.y = MG_V.deckY - 0.004 * dec;
      ext.group.visible = !o.inside; inn.visible = !!o.inside;
      fill.intensity = o.inside ? 0.55 : 0;
      // the wheels roll
      const dist = cx - P.car.x0; for (const w of ext.wheels) w.rotation.z = -dist / ext.r;
      // brake lights, hazards (the emergency brake switches them on), the dash's switch
      const braking = dec > 0.2 || (s > P.car.sBrake && s < P.car.sStop + 1);
      ext.tail.emissiveIntensity = braking || s > P.car.sStop ? 2.6 : 0.6;
      const hzOn = s > P.car.sBrake + 0.3 && ((s * 1.45) % 1) < 0.5;
      ext.hazard.emissiveIntensity = hzOn ? 2.4 : 0; hz.material.emissiveIntensity = hzOn ? 1.6 : 0.05;
      epb.position.y = C.epb[1] + (s > P.car.sBrake - 0.05 ? 0.007 : 0);
      spin.rotation.x = P.wheelTurn(s) * 2.2;
      // your dad: gone at 7:42:00, with what he wore; the cup he held stays, and falls
      dad.root.visible = s < 0 && !!o.inside;
      if (dad.root.visible) { const p = Object.assign({}, dadPose); p.headYaw = 0.06 * Math.sin(s * 0.7); p.neck = 0.02 + 0.02 * Math.sin(s * 0.5); dad.apply(p); }
      this.cupAt(s);
      // his seatbelt: across his chest; when he is gone it retracts flat against the seat
      { const top = [C.seatL[0] - 0.32, 1.27, C.seatL[2] - 0.36], buckle = [C.seatL[0] + 0.02, 0.6, C.seatL[2] + 0.24], anchor = [C.seatL[0] - 0.1, 0.56, C.seatL[2] - 0.34];
        const k = MathX.smooth(s, 0.02, 0.5), chest = mgV([C.seatL[0] + 0.12, 0.98, C.seatL[2] - 0.02], [C.seatL[0] - 0.14, 0.95, C.seatL[2] - 0.04], k), lap = mgV([C.seatL[0] + 0.18, 0.66, C.seatL[2] - 0.08], [C.seatL[0] + 0.04, 0.6, C.seatL[2] - 0.04], k);
        mgBeamSet(belt[0], top, chest, 0.048, 0.004); mgBeamSet(belt[1], chest, buckle, 0.048, 0.004); mgBeamSet(belt[2], anchor, lap, 0.048, 0.004);
        for (const b of belt) b.visible = !!o.inside; }
      this.phoneAt(s, o);
      if (o.inside) {
        cluster.update({ s: Math.floor(s), v: Math.round(P.carV(s) * 3.6) / 3.6, cruise: s < P.car.sBrake, epb: s > P.car.sBrake, hazard: hzOn });
        if (o.radio) radio.update({ s: Math.floor(s) });
      }
    },
    // the cup: in his hand; from 7:42:00 it falls (car-local: the car runs at a steady 100 km/h until the brake, so it falls
    // straight down) onto the front of his seat and tips; the brake slides it forward into the footwell
    cupAt(s) {
      const y1 = 0.6 + 0.065, sl = Math.sqrt(2 * Math.max(0.01, cup0.y - y1) / 9.81);
      this.sLand = sl;
      if (s < 0) { cup.position.copy(cup0); cup.rotation.set(0.25, 0, 0.1); this.stain.visible = false; return; }
      if (s < sl) { cup.position.set(cup0.x, cup0.y - 4.905 * s * s, cup0.z); cup.rotation.set(0.25 + 0.6 * s, 0, 0.1 + 0.4 * s); }
      else {
        const u = s - sl, tip = MathX.smooth(u, 0, 0.3) * 1.35, slide = MathX.smooth(s, MGP.car.sBrake + 0.2, MGP.car.sBrake + 1.0);
        cup.position.set(mgLerp(cup0.x, C.seatL[0] + 0.62, slide), mgLerp(0.6 + 0.04, 0.33, slide), mgLerp(cup0.z, C.seatL[2] + 0.05, slide));
        cup.rotation.set(0.25 + 0.6 * sl + 0.3 * slide, 0, 0.1 + tip + 2.5 * slide);
      }
      const sp = MathX.smooth(s, sl, sl + 1.6); this.stain.visible = s > sl; this.stain.scale.setScalar(0.03 + 0.1 * Math.sqrt(sp));
    },
    phoneAt(s, o) {
      const slide = MathX.smooth(s, MGP.car.sBrake + 0.35, MGP.car.sBrake + 1.2);
      phone.position.set(mgLerp(0.56, 0.86, slide), mgLerp(0.615, 0.3 + 0.004, slide) + 0.06 * Math.sin(Math.PI * slide), mgLerp(-0.02, C.seatL[2] - 0.08, slide));
      phone.rotation.set(0, mgLerp(0.1, 0.75, slide), mgLerp(0.3, 0, slide) * (1 - slide));
      phone.visible = !!o.inside;
      // its screen: ringing (MUM) from 7:42:24; the call fails at 7:42:30, and again
      const what = s < 24 ? 'lock' : (s - 24) % 22 < 6 ? 'call' : 'failed';
      if (phone.visible && o.phone) PH.update({ s: Math.floor(s * 4) / 4, what, bars: 1 });
      phone.screen.material.color.setScalar(s < 24 ? 0.5 : 1);
      phLight.intensity = o.inside && s >= 24 ? 0.35 : 0;
    },
  };
  return YC;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE LORRY (lorry-local: x forward, centre at the middle, y from the road). A tractor unit with its cab (built open
// at its windows, so you can see in: the empty seat, the wheel), a 13.6 m box trailer
// ---------------------------------------------------------------------------------------------------------------------
function mgTrailerCanvas() {
  return mgCanvas(2048, 400, (g, w, h) => {
    g.fillStyle = '#eceae4'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.05)'; for (let x = 0; x < w; x += 60) g.fillRect(x, 0, 3, h);
    g.fillStyle = '#1f4e8c'; g.fillRect(0, h * 0.72, w, h * 0.12); g.fillStyle = '#e2a43a'; g.fillRect(0, h * 0.85, w, h * 0.03);
    g.fillStyle = '#1f4e8c'; g.font = '800 150px sans-serif'; g.fillText('NORTHWAY', 140, h * 0.52); g.font = '600 56px sans-serif'; g.fillText('LOGISTICS · FRESH FOOD', 160, h * 0.66);
    g.fillStyle = 'rgba(40,40,40,0.15)'; for (let i = 0; i < 70; i++) g.fillRect(mgR(i, 3) * w, h * 0.92 + mgR(i, 4) * h * 0.08, 30 + 80 * mgR(i, 5), 4);   // road grime
  });
}
function mgBuildLorry(S) {
  const Lp = MGP.lorry, G = new THREE.Group(); S.scene.add(G);
  const M = { cab: mgStd('#c23a2c', 0.4, 0.25), dark: mgStd('#1d1e20', 0.7), chassis: mgStd('#2a2b2e', 0.6, 0.3), tyre: mgStd('#151517', 0.85), rim: mgStd('#a9adb2', 0.35, 0.8),
    glass: mgStd('#1e2830', 0.08, 0.6, { envMapIntensity: 1.6 }), seat: mgStd('#2e3238', 0.95), dash: mgStd('#2a2c30', 0.7), chrome: mgStd('#c8ccd0', 0.2, 0.95),
    trailer: new THREE.MeshStandardMaterial({ map: mgTex(mgTrailerCanvas(), { repeat: false }), roughness: 0.6, metalness: 0.05 }), white: mgStd('#e4e2dc', 0.6), red: new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: new THREE.Color('#ff2010'), emissiveIntensity: 0.6 }),
    amber: new THREE.MeshStandardMaterial({ color: '#7a4a10', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0 }), head: new THREE.MeshStandardMaterial({ color: '#f4f2ea', emissive: new THREE.Color('#fff4e0'), emissiveIntensity: 1.2 }) };
  const Bx = (w, h, d, m, x, y, z, par = G, ry = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(0, ry, rz); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
  // ---- the trailer: box (its sides carry the livery), the floor beams, side guards, rear doors and lights
  { const mats = [M.white, M.white, M.white, M.white, M.trailer, M.trailer];
    const t = new THREE.Mesh(new THREE.BoxGeometry(13.6, 2.7, 2.55), mats); t.position.set(-1.45, 2.6, 0); t.castShadow = t.receiveShadow = true; G.add(t);
    // (the side faces are ±z: a box's uv reads unmirrored from outside on both)
    Bx(13.2, 0.28, 1.0, M.chassis, -1.45, 1.1, 0);
    for (const sd of [-1, 1]) { Bx(6.2, 0.12, 0.05, M.chassis, -0.1, 0.78, sd * 1.24); Bx(6.2, 0.12, 0.05, M.chassis, -0.1, 0.52, sd * 1.24); }
    Bx(0.04, 2.6, 0.02, M.dark, -8.27, 2.6, 0);                                                                 // the doors' seam
    for (const sd of [-1, 1]) { Bx(0.06, 0.16, 0.42, M.red, -8.26, 0.95, sd * 0.98); Bx(0.06, 0.1, 0.16, M.amber, -8.26, 0.95, sd * 0.62); }
    Bx(0.12, 0.12, 2.3, M.chassis, -8.15, 0.55, 0); }
  // ---- the tractor: chassis, fuel tank, bumper, the cab (open at its windows: floor, front, roof, back, the lower sides,
  // the pillars), the windscreen's frame, mirrors, the grille, the headlights, the step
  { Bx(4.6, 0.36, 1.0, M.chassis, 5.6, 0.92, 0); Bx(1.2, 0.5, 0.55, M.chrome, 5.0, 0.8, -1.0);
    Bx(0.32, 0.5, 2.5, M.dark, 8.12, 0.72, 0);
    const cx = 7.12;
    Bx(2.25, 0.1, 2.48, M.dark, cx, 1.28, 0);
    Bx(0.12, 1.02, 2.5, M.cab, 8.19, 1.76, 0); Bx(0.06, 0.7, 1.5, M.dark, 8.26, 1.65, 0);                       // the front panel, the grille
    for (const sd of [-1, 1]) { Bx(0.08, 0.2, 0.5, M.head, 8.24, 1.05, sd * 0.92); Bx(0.06, 0.1, 0.18, M.amber, 8.24, 1.25, sd * 1.12); }
    Bx(2.32, 0.66, 2.52, M.cab, cx, 3.53, 0);                                                                   // the roof
    Bx(0.1, 2.6, 2.5, M.cab, 6.02, 2.5, 0);                                                                     // the back wall
    for (const sd of [-1, 1]) {
      Bx(2.25, 0.84, 0.08, M.cab, cx, 1.68, sd * 1.21);                                                         // below the window
      Bx(0.14, 1.12, 0.1, M.cab, 8.13, 2.66, sd * 1.2); Bx(0.95, 1.12, 0.08, M.cab, 6.5, 2.66, sd * 1.21);      // the pillars
      Bx(0.1, 0.06, 0.06, M.chrome, 7.25, 2.0, sd * 1.27);                                                       // the door handle
      Bx(0.6, 0.06, 0.3, M.chassis, 7.4, 0.62, sd * 1.12);                                                      // the step
      const mr = Bx(0.08, 0.5, 0.22, M.dark, 8.25, 2.75, sd * 1.5); mr.rotation.y = 0.2 * sd;                   // the mirrors
      mgBeam([8.2, 3.05, sd * 1.2], [8.25, 3.0, sd * 1.45], 0.03, 0.03, M.dark, G);
    }
    Bx(0.1, 0.1, 2.5, M.cab, 8.19, 3.17, 0); Bx(0.1, 0.1, 2.5, M.cab, 8.19, 2.3, 0);                           // the windscreen's frame (the glass left out)
    // inside the cab: the driver's seat (left), the passenger's, the dash, the wheel; a mug in its holder
    for (const z of [-0.62, 0.62]) { Bx(0.5, 0.14, 0.52, M.seat, 6.95, 1.8, z); Bx(0.14, 0.75, 0.52, M.seat, 6.66, 2.25, z, G, 0, 0.18); Bx(0.12, 0.22, 0.32, M.seat, 6.58, 2.76, z, G, 0, 0.1);
      Bx(0.06, 0.4, 0.06, M.chassis, 6.95, 1.55, z); }
    Bx(0.42, 0.42, 2.3, M.dash, 7.92, 2.15, 0); Bx(0.3, 0.06, 2.3, M.dash, 7.85, 2.39, 0, G, 0, -0.2);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.1, 14), mgStd('#2a6ab0', 0.5)); mug.position.set(7.62, 2.42, 0.05); G.add(mug); }
  const wheelG = new THREE.Group(); wheelG.position.set(7.42, 2.32, -0.62); wheelG.rotation.z = -1.05; G.add(wheelG);
  const spin = new THREE.Group(); wheelG.add(spin);
  { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 32), M.dark); rim.rotation.y = Math.PI / 2; spin.add(rim);
    for (const a of [0, 2.09, 4.19]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.03), M.dash); sp.position.set(0, 0.11 * Math.cos(a), 0.11 * Math.sin(a)); sp.rotation.x = -a; spin.add(sp); }
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 8).rotateZ(Math.PI / 2).translate(0.27, 0, 0), M.dash); wheelG.add(col); }
  // ---- the wheels: the tractor's two axles, the trailer's three
  const wheels = [], wg = new THREE.CylinderGeometry(0.5, 0.5, 0.32, 20).rotateX(Math.PI / 2), hub = new THREE.CylinderGeometry(0.28, 0.28, 0.34, 12).rotateX(Math.PI / 2);
  for (const x of [7.3, 3.9, -4.6, -5.9, -7.2]) for (const sd of [-1, 1]) { const w = new THREE.Group(); w.position.set(x, 0.5, sd * 1.06); w.add(new THREE.Mesh(wg, M.tyre)); w.add(new THREE.Mesh(hub, M.rim)); G.add(w); wheels.push(w); w.front = x > 7; }
  for (const x of [7.3, 3.9]) for (const sd of [-1, 1]) Bx(0.9, 0.06, 0.4, M.chassis, x, 1.08, sd * 1.06);
  G.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return {
    G, spin, wheels, M,
    contact: [0, 0, 0],                                      // where its front-left corner grinds on the barrier (world)
    update(s) {
      const P = MGP, x = P.lorryX(s), z = P.lorryZ(s), yaw = P.lorryYaw(s);
      G.position.set(x, MG_V.deckY + 0.02 * P.lorrySparks(s) * Math.sin(s * 37), z); G.rotation.set(0, -yaw, 0);
      const dist = x - Lp.x0; for (const w of wheels) { w.rotation.z = -dist / 0.5; if (w.front) w.rotation.y = 0.25 * (P.lorryYaw(s + 0.05) - yaw) / 0.05; }
      // the wheel turns by itself: the front wheels, pushed by the barrier, turn it
      const dy = (P.lorryYaw(s + 0.04) - P.lorryYaw(s - 0.04)) / 0.08;
      spin.rotation.x = -9 * dy + 0.35 * P.lorrySparks(s) * Math.sin(s * 5.3) + 0.12 * MathX.smooth(s, Lp.sHit, Lp.sStop);
      const c = Lp.corner(s, x, 8.1, -1.22); this.contact = [c[0], MG_V.deckY + 0.55, c[1]];
      const hz = s > Lp.sStop + 2 && ((s * 1.3) % 1) < 0.5; M.amber.emissiveIntensity = hz ? 2.2 : 0;   // (its hazards come on when it has stopped: its emergency-brake system)
      M.red.emissiveIntensity = s > Lp.sHit ? 2.4 : 0.6;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE OTHER CARS: each one's motion is a pure function of s, worked out once here (seeded). Kinds:
//   'aeb'   a newer car: its assistant notices nobody is steering (or the stopped traffic ahead) and stops it in its lane
//           at sB with a, hazards on
//   'drift' an older car, no assistant: it coasts (0.5 m/s²) and drifts sideways into a barrier at sH, then grinds to a
//           stop (5 m/s²)
// A candidate whose box ever overlaps another's (or your car's, or the lorry's) is dropped, so nothing passes through
// anything. Two heroes are placed by hand: the white one that stops itself (shot 'carsNew'), the red one that drifts
// into the parapet ('carsOld').
// ---------------------------------------------------------------------------------------------------------------------
const MG_TRAFFIC = (() => {
  const P = MGP, r = new RNG(2207), out = [];
  const types = [['sedan', 4.72, 1.82], ['hatch', 4.12, 1.78], ['suv', 4.78, 1.92], ['ev', 4.72, 1.88], ['van', 5.3, 2.02]];
  const cols = ['#c9ccd0', '#f2f2ee', '#1b1c1f', '#2a3a5a', '#8a9096', '#5a5f66', '#7a1f1f', '#e8e6e0', '#3a4a3a', '#b8b0a0', '#20304a', '#9a2a2a'];
  const mk = (o) => {
    const c = Object.assign({ v0: 28, sB: 3, a: 4, sD: 1, vz: 0.6 }, o), T = types.find((t) => t[0] === c.type); c.L = T[1]; c.W = T[2];
    // the phases along the lane: [s0, u0, v0, a] (u: distance travelled since s = 0)
    if (c.kind !== 'drift') { c.sStop = c.sB + c.v0 / c.a; }
    else {
      const ac = 0.5, side = c.toward, zb = side > 0 ? MG_V.deckW - 0.42 - c.W / 2 - 0.05 : 0.3 + c.W / 2 + 0.05;   // (toward +1: the parapet, −1: the central barrier, in lane coordinates)
      c.zb = zb; c.sH = c.sD + Math.abs(zb - c.z0) / c.vz; c.vH = Math.max(3, c.v0 - ac * c.sH); c.sStop = c.sH + c.vH / 5; c.ac = ac;
    }
    return c;
  };
  // u(s), v(s), lane z(s) (lane coordinates: +z to the right of the direction of travel), yaw (+ = to the right)
  const kin = (c, s) => {
    if (c.kind !== 'drift') { if (s <= c.sB) return [c.v0 * s, c.v0, c.z0, 0]; const u = Math.min(s, c.sStop) - c.sB; return [c.v0 * c.sB + c.v0 * u - 0.5 * c.a * u * u, Math.max(0, c.v0 - c.a * u), c.z0, 0]; }
    if (s <= 0) return [c.v0 * s, c.v0, c.z0, 0];
    const sh = Math.min(s, c.sH), u0 = c.v0 * sh - 0.5 * c.ac * sh * sh;
    const dz = c.toward * c.vz * Math.max(0, Math.min(s, c.sH) - c.sD), z = c.z0 + dz;
    if (s <= c.sH) { const v = c.v0 - c.ac * s; return [u0, v, z, s > c.sD ? c.toward * Math.atan(c.vz / v) : 0]; }
    const w = Math.min(s, c.sStop) - c.sH;
    return [u0 + c.vH * w - 2.5 * w * w, Math.max(0, c.vH - 5 * w), c.zb, c.toward * 0.04];
  };
  const place = (c, s) => { const [u, v, z, yaw] = kin(c, s); return { x: c.d > 0 ? c.x0 + u : c.x0 - u, z: c.d > 0 ? z : -z, yaw: c.d > 0 ? yaw : yaw, v }; };
  // the boxes (for the overlap test)
  const rect = (cx, cz, yaw, hl, hw) => { const th = -yaw, co = Math.cos(th), si = Math.sin(th); return [[hl, hw], [hl, -hw], [-hl, -hw], [-hl, hw]].map(([x, z]) => [cx + x * co + z * si, cz - x * si + z * co]); };
  const sep = (A, B) => { let best = -1e9; for (const R of [A, B]) for (let i = 0; i < 4; i++) { const p = R[i], q = R[(i + 1) % 4], nx = q[1] - p[1], nz = -(q[0] - p[0]), l = Math.hypot(nx, nz), n0 = nx / l, n1 = nz / l; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const v of A) { const d = v[0] * n0 + v[1] * n1; a0 = Math.min(a0, d); a1 = Math.max(a1, d); } for (const v of B) { const d = v[0] * n0 + v[1] * n1; b0 = Math.min(b0, d); b1 = Math.max(b1, d); } best = Math.max(best, b0 - a1, a0 - b1); } return best; };
  const SS = []; for (let s = -6; s <= 34; s += 0.2) SS.push(s);
  const boxOf = (c, s) => { const q = place(c, s); return rect(q.x, q.z, q.yaw, c.L / 2 + 0.25, c.W / 2 + 0.15); };   // (a box is the same turned by π: the westbound ones need no flip)
  const fixed = SS.map((s) => [rect(P.carX(s), P.carZ(s), P.carYaw(s), MG_CAR.L / 2 + 0.3, MG_CAR.W / 2 + 0.2), rect(P.lorryX(s), P.lorryZ(s), P.lorryYaw(s), P.lorry.half + 0.3, P.lorry.w / 2 + 0.2)]);
  const boxes = [], near = (A, B) => Math.abs(A[0][0] + A[2][0] - B[0][0] - B[2][0]) < 28 && Math.abs(A[0][1] + A[2][1] - B[0][1] - B[2][1]) < 12;   // (twice the centres' distance: a quick reject)
  const ok = (c) => {
    const bx = SS.map((s) => boxOf(c, s));
    for (let k = 0; k < SS.length; k++) { const A = bx[k], cx = (A[0][0] + A[2][0]) / 2; if (cx < -760 || cx > 1500) continue;
      for (const f of fixed[k]) if (near(A, f) && sep(A, f) < 0.3) return false;
      for (const o of boxes) if (near(A, o[k]) && sep(A, o[k]) < 0.3) return false; }
    boxes.push(bx); return true;
  };
  // the heroes
  const heroNew = mk({ id: 'heroNew', kind: 'aeb', d: -1, z0: MG_V.lanes[1], type: 'ev', col: '#f2f2ee', v0: 30, sB: 6.6, a: 4.4, x0: 470 });
  const heroOld = mk({ id: 'heroOld', kind: 'drift', d: 1, z0: MG_V.lanes[2], type: 'hatch', col: '#9a2a2a', v0: 26, sD: 4.0, vz: 0.62, toward: 1, x0: -160 });
  for (const h of [heroNew, heroOld]) { if (!ok(h)) throw new Error('MG_TRAFFIC: a hero car overlaps something'); out.push(h); }
  // the rest: both carriageways, a car every 25–60 m in each lane
  let n = 0;
  for (let i = 0; i < 160 && n < 54; i++) {
    const d = r.next() < 0.5 ? 1 : -1, lane = r.int(0, 2), T = types[r.next() < 0.08 ? 4 : r.int(0, 3)];
    // ('ok': a woman is driving: she brakes, hard, a second or two after the cars round her go wrong; 'aeb': nobody
    // is, and the car's lane assist stops it; 'drift': nobody is, and nothing stops it but a barrier)
    const q = r.next(), kind = q < 0.36 ? 'ok' : q < 0.72 ? 'aeb' : 'drift', v0 = [24, 29, 33][lane] + r.range(-2, 2);
    const c = mk({ id: 'c' + i, kind, d, z0: MG_V.lanes[lane] + r.range(-0.25, 0.25), type: T[0], col: cols[r.int(0, cols.length - 1)], v0, sB: kind === 'ok' ? r.range(0.9, 2.6) : r.range(1.5, 9), a: kind === 'ok' ? r.range(5, 7.5) : r.range(3, 6), sD: r.range(0.3, 3), vz: r.range(0.35, 0.9),
      toward: lane === 0 ? -1 : lane === 2 ? 1 : (r.next() < 0.5 ? -1 : 1), x0: d > 0 ? r.range(-640, 420) : r.range(-150, 1150) });
    // (the stop must be on the viaduct, in the stretch the camera sees)
    const end = place(c, 40);
    if (end.x < -600 || end.x > 900) continue;
    if (ok(c)) { out.push(c); n++; }
  }
  const nOk = out.filter((c) => c.kind === 'ok').length;
  return { cars: out, place, kin, heroNew, heroOld, nOk, nEmpty: out.length - nOk };
})();

function mgBuildTraffic(S) {
  const VF = mgBuildYourCar.VF || (mgBuildYourCar.VF = new VehicleFactory());
  const TR = { cars: [] };
  for (const c of MG_TRAFFIC.cars) {
    const g = new THREE.Group(); S.scene.add(g);
    const o = VF.build(c.type, c.col); g.add(o.group); o.group.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    TR.cars.push({ c, g, o });
  }
  TR.byId = (id) => TR.cars.find((x) => x.c.id === id);
  TR.sparks = [];                                          // where drifting cars grind on a barrier now: [x, y, z, v]
  TR.update = (s) => {
    TR.sparks.length = 0;
    for (const T of TR.cars) {
      const c = T.c, q = MG_TRAFFIC.place(c, s);
      T.g.position.set(q.x, MG_V.deckY, q.z); T.g.rotation.y = (c.d > 0 ? 0 : Math.PI) - q.yaw;
      const [u] = MG_TRAFFIC.kin(c, s); for (const w of T.o.wheels) w.rotation.z = -u / T.o.r;
      const braking = c.kind !== 'drift' && s > c.sB && s < c.sStop + 0.5;
      T.o.tail.emissiveIntensity = braking ? 2.6 : c.kind !== 'drift' && s > c.sStop ? 1.2 : 0.6;
      const hz = (c.kind === 'aeb' ? s > c.sB + 0.2 : c.kind === 'ok' ? s > c.sStop + 1.5 : false) && (((s + c.x0 * 0.013) * 1.42) % 1) < 0.5;
      T.o.hazard.emissiveIntensity = hz ? 2.4 : 0;
      if (c.kind === 'drift' && s > c.sH && s < c.sStop) { const side = c.toward * (c.d > 0 ? 1 : -1), fx = q.x + c.d * (c.L / 2 - 0.3); TR.sparks.push([fx, MG_V.deckY + 0.35, q.z + side * c.W / 2, q.v]); }
    }
  };
  return TR;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PEOPLE ON THE DECK: women and girls (every man and boy is gone). From 9:10 they walk west along the hard
// shoulders, towards the town; a few stay by their cars. At 10:21 the ones still there look up at the plane.
// ---------------------------------------------------------------------------------------------------------------------
const MG_DECK_PEOPLE = (() => {
  const r = new RNG(910), out = [], s0 = MG_AT(9, 10, 0);
  // walkers: [x at 9:10, z, speed, look, kid, start delay]
  for (let i = 0; i < 18; i++) { const d = r.next() < 0.7 ? 1 : -1, z = d * (12.25 + r.range(-0.35, 0.45)), kid = r.next() < 0.3;
    out.push({ kind: 'walk', x: r.range(-40, 260), z, v: kid ? 1.15 : r.range(1.15, 1.45), look: kid ? MG_GIRLS[r.int(0, 3)] : MG_WOMEN[r.int(0, 7)], kid, s0: s0 + r.range(-200, 40), ph: r.range(0, 6.28), id: i }); }
  // the ones who stay: standing by the barrier or a car (they look up at 10:21)
  for (let i = 0; i < 12; i++) { const d = r.next() < 0.5 ? 1 : -1, z = d * (12.0 + r.range(0, 1.6));
    out.push({ kind: 'stay', x: r.range(30, 200), z, look: (i % 4 === 3) ? MG_GIRLS[r.int(0, 3)] : MG_WOMEN[r.int(0, 7)], kid: i % 4 === 3, yaw: r.range(-3.1, 3.1), id: 100 + i }); }
  return out;
})();
function mgBuildDeckPeople(S) {
  const DP = { P: [] };
  for (const q of MG_DECK_PEOPLE) { const p = mgPerson(q.look, S.scene, { id: 'deck' + q.id, kid: q.kid }); p.q = q; p.root.visible = false; DP.P.push(p); }
  DP.update = (s, o = {}) => {
    const look = o.lookAt;                                   // a world point everyone still there turns to (the plane)
    for (const p of DP.P) {
      const q = p.q;
      if (s < MG_AT(9, 0)) { p.root.visible = false; continue; }
      if (q.kind === 'walk') {
        const u = Math.max(0, s - q.s0), x = q.x - q.v * u, dir = -1;
        if (x < MG_V.vx[0] + 30) { p.root.visible = false; continue; }
        const walking = s > q.s0, ph = q.ph + u * q.v / (q.kid ? 0.9 : 1.3) * Math.PI * 2;
        mgPose(p, walking ? mgWalkPose(ph, q.kid ? 0.9 : 1) : MG_POSES.standStill(), x, MG_V.deckY, q.z + 0.12 * Math.sin(u * 0.05 + q.id), dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        p.root.visible = s > q.s0 - 120 && (s - q.s0) < 1400;
      } else {
        let pose = MG_POSES.standStill(), yaw = q.yaw;
        if (look) { const dx = look[0] - q.x, dz = look[2] - q.z, dy = look[1] - MG_V.deckY - 1.5; yaw = mgYaw(dx, dz); pose = MG_POSES.lookUpStand(); pose.neck = -MathX.clamp(Math.atan2(dy, Math.hypot(dx, dz)) * 0.85, 0, 0.9); }
        mgFidget(pose, s, q.id, 0.4); mgPose(p, pose, q.x, MG_V.deckY, q.z, yaw); p.root.visible = true;
      }
    }
  };
  return DP;
}
