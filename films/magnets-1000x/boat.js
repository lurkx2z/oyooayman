/* =====================================================================
   BOAT — your narrowboat (17.4 m × 2.08 m, "Kingfisher"): its steel hull, the cabin (with the galley inside, seen
   through the open stern doors), the roof (your bike in its rack, the chimney, the radio on the hatch), the stern deck
   where you stand beside your mum at the tiller. Local frame: x forward (the boat goes east), y up from the waterline,
   z to starboard (south). It floats where MGB puts it: MGB.x/z (s), heave (s), heel (s).
     mgBuildBoat(S) → { g, mum, radio, bike, inside, update(s, t, mode), eye(lx, ly, lz) → world }
   ===================================================================== */

const MG_BOAT = { L: 17.4, B: 2.08, gun: 0.55, roof: 1.88, deck: 0.45, cab: [-6.4, 6.0], bow: 2.6 };

function mgBuildBoat(S) {
  const scene = S.scene, Bt = MG_BOAT, g = new THREE.Group(); scene.add(g);
  const out = { g };
  const hull = mgStd('#141516', 0.6, 0.3), green = mgStd('#1f4a36', 0.45, 0.1), cream = mgStd('#e8dfc8', 0.6), red = mgStd('#8a1e1a', 0.5), brass = mgStd('#b8923a', 0.3, 0.8), roofM = mgStd('#b8b2a4', 0.85);
  // ---- the hull: its outline (plan view: a pointed bow, a rounded stern), extruded from the bottom to the gunwale
  {
    // (a shell 6 cm thick, open at the top, and a solid bilge inside it up to 5 cm above the waterline, so the cabin's floor
    // shows and the river's surface never shows inside the hull; the bilge's sides sit inside the shell's: no shared faces)
    const hb = Bt.B / 2;
    const outline = (i, P) => { const hl = Bt.L / 2 - i, hb = Bt.B / 2 - i; P.moveTo(-hl + 0.5, -hb); P.lineTo(hl - Bt.bow, -hb); P.quadraticCurveTo(hl - 0.6, -hb * 0.8, hl, 0); P.quadraticCurveTo(hl - 0.6, hb * 0.8, hl - Bt.bow, hb); P.lineTo(-hl + 0.5, hb); P.quadraticCurveTo(-hl, hb, -hl, 0); P.quadraticCurveTo(-hl, -hb, -hl + 0.5, -hb); return P; };
    const sh = outline(0, new THREE.Shape()); sh.holes.push(outline(0.06, new THREE.Path()));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.05, bevelEnabled: false, curveSegments: 10 }); geo.rotateX(Math.PI / 2); geo.translate(0, Bt.gun, 0);
    const m = new THREE.Mesh(geo, hull); m.castShadow = m.receiveShadow = true; g.add(m);
    const bg = new THREE.ExtrudeGeometry(outline(0.03, new THREE.Shape()), { depth: 0.53, bevelEnabled: false, curveSegments: 10 }); bg.rotateX(Math.PI / 2); bg.translate(0, 0.05, 0);
    const bm = new THREE.Mesh(bg, hull); bm.receiveShadow = true; g.add(bm);
    // the rubbing strakes and a red band under the gunwale
    for (const y of [0.05, 0.32]) for (const sz of [-1, 1]) mgBox(Bt.L - 3.2, 0.06, 0.05, mgStd('#0e0e0f', 0.5, 0.4), -0.6, y, sz * (hb + 0.025), g);
    for (const sz of [-1, 1]) mgBox(Bt.L - 3.4, 0.08, 0.012, red, -0.7, 0.48, sz * (hb + 0.007), g);
    // the deck at the stern and the well deck at the bow (decks sit 1 cm above the hull's top: no shared plane)
    // (plates the shape of the hull inside its shell, from the cabin's ends to the stern and the bow)
    {
      const hl = Bt.L / 2 - 0.05, hb2 = Bt.B / 2 - 0.05, [c0, c1] = Bt.cab, dkM = mgStd('#3a3632', 0.9);
      const st = new THREE.Shape(); st.moveTo(c0, -hb2); st.lineTo(-hl + 0.5, -hb2); st.quadraticCurveTo(-hl, -hb2, -hl, 0); st.quadraticCurveTo(-hl, hb2, -hl + 0.5, hb2); st.lineTo(c0, hb2); st.lineTo(c0, -hb2);
      const bw = new THREE.Shape(); bw.moveTo(c1, -hb2); bw.lineTo(hl - Bt.bow, -hb2); bw.quadraticCurveTo(hl - 0.6, -hb2 * 0.8, hl, 0); bw.quadraticCurveTo(hl - 0.6, hb2 * 0.8, hl - Bt.bow, hb2); bw.lineTo(c1, hb2); bw.lineTo(c1, -hb2);
      for (const sp of [st, bw]) { const dg = new THREE.ExtrudeGeometry(sp, { depth: 0.06, bevelEnabled: false, curveSegments: 10 }); dg.rotateX(Math.PI / 2); dg.translate(0, Bt.deck + 0.03, 0); const d = new THREE.Mesh(dg, dkM); d.receiveShadow = true; g.add(d); }
    }
  }
  // ---- the cabin
  {
    const [c0, c1] = Bt.cab, L = c1 - c0, cx = (c0 + c1) / 2, w = Bt.B - 0.22, h = Bt.roof - Bt.gun;
    // its sides (green, with cream panels and a red coach line), as boxes 0.06 thick so the interior shows through the doors
    for (const sz of [-1, 1]) {
      mgBox(L, h, 0.06, green, cx, Bt.gun + h / 2, sz * (w / 2 - 0.03), g);
      mgBox(L - 0.4, 0.05, 0.012, red, cx, Bt.gun + h - 0.18, sz * (w / 2 + 0.006), g);
      // windows (dark glass, brass frames): rectangular aft, round portholes forward
      for (const wx of [-4.2, -2.4, -0.6, 1.2]) { mgBox(0.85, 0.42, 0.014, brass, wx, Bt.gun + 0.72, sz * (w / 2 + 0.008), g); mgBox(0.75, 0.33, 0.02, new THREE.MeshStandardMaterial({ color: '#12181c', roughness: 0.05, metalness: 0.4 }), wx, Bt.gun + 0.72, sz * (w / 2 + 0.012), g); }
      for (const wx of [3.0, 4.2, 5.2]) { const p = mgCyl(0.17, 0.17, 0.03, brass, wx, Bt.gun + 0.78, sz * (w / 2 + 0.012), g, 20); p.rotation.x = Math.PI / 2; const q = mgCyl(0.13, 0.13, 0.04, new THREE.MeshStandardMaterial({ color: '#12181c', roughness: 0.05, metalness: 0.4 }), wx, Bt.gun + 0.78, sz * (w / 2 + 0.016), g, 20); q.rotation.x = Math.PI / 2; }
      // the name panel
      const np = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), new THREE.MeshStandardMaterial({ map: mgTex(mgCanvas(440, 84, (gg, ww, hh) => { gg.fillStyle = '#e8dfc8'; gg.fillRect(0, 0, ww, hh); gg.strokeStyle = '#8a1e1a'; gg.lineWidth = 6; gg.strokeRect(5, 5, ww - 10, hh - 10); gg.fillStyle = '#1f4a36'; gg.font = 'italic 700 50px Georgia'; gg.textAlign = 'center'; gg.fillText('Kingfisher', ww / 2, 60); }), { repeat: false }), roughness: 0.6 }));
      np.position.set(2.1, Bt.gun + 0.74, sz * (w / 2 + 0.008)); np.rotation.y = sz > 0 ? 0 : Math.PI; g.add(np);
    }
    // the front bulkhead, and the stern bulkhead with its open doors
    mgBox(0.06, h, w, green, c1, Bt.gun + h / 2, 0, g);
    for (const sz of [-1, 1]) mgBox(0.06, h, 0.3, green, c0, Bt.gun + h / 2, sz * (w / 2 - 0.15), g);
    mgBox(0.06, 0.25, w - 0.6, green, c0, Bt.roof - 0.125, 0, g);
    for (const sz of [-1, 1]) { const d = mgBox(0.05, h - 0.3, 0.6, green, c0 - 0.3 * 0 - 0.28, Bt.gun + (h - 0.3) / 2, sz * 0.3, g); d.position.x = c0 - 0.3; d.position.z = sz * (w / 2 + 0.02); d.rotation.y = sz * 1.45; }
    // the roof (a little camber), its handrails
    const roof = mgBox(L + 0.1, 0.06, w + 0.06, roofM, cx, Bt.roof + 0.03, 0, g);
    void roof;
    for (const sz of [-1, 1]) mgBox(L - 1.0, 0.04, 0.04, brass, cx, Bt.roof + 0.1, sz * (w / 2 - 0.08), g);
    // the sliding hatch over the doors
    mgBox(1.0, 0.05, 0.9, green, c0 + 0.5, Bt.roof + 0.09, 0, g);
    // the floor and walls inside (pine), the galley on the north side: the cooker, its kettle, shelves of tins, pans
    // (straight tongue-and-groove planks: a tone per plank, a few fine grain lines, a dark groove between them)
    const plankTex = mgTex(mgCanvas(512, 256, (c, W, H) => { const n = 6, ph = H / n; for (let i = 0; i < n; i++) { const k = 0.82 + 0.26 * hash1(i * 7 + 3); c.fillStyle = `rgb(${176 * k | 0},${136 * k | 0},${90 * k | 0})`; c.fillRect(0, i * ph, W, ph); c.strokeStyle = 'rgba(96,62,30,0.22)'; c.lineWidth = 1; for (let q = 0; q < 7; q++) { const y = i * ph + ph * (0.12 + 0.76 * hash1(i * 31 + q)); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 4 * (hash1(q + i * 5) - 0.5)); c.stroke(); } c.fillStyle = 'rgba(52,32,16,0.75)'; c.fillRect(0, i * ph, W, 2); } }));
    const pine = new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.72 });
    const gi = new THREE.Group(); gi.position.y = 0.16; g.add(gi);   // (the floor, the galley and what slides: the floor sits just above the hull's bilge, above the river's surface)
    mgBox(L - 0.2, 0.04, w - 0.14, mgStd('#5a4030', 0.8), cx, -0.12, 0, gi);
    for (const sz of [-1, 1]) mgBox(L - 0.2, h + 0.62, 0.02, pine, cx, (Bt.roof - 0.12 - 0.62 / 2) / 2 + 0.2, sz * (w / 2 - 0.075), g);
    mgBox(0.02, h + 0.6, w - 0.18, pine, c0 + 4.2, (Bt.roof - 0.12) / 2 + 0.05, 0, g);       // a bulkhead 4 m in (the galley ends)
    // (the galley is on the south side: things slide north, across the worktop, towards you and the yard)
    mgBox(2.0, 0.05, 0.6, mgStd('#3a3a3a', 0.6), c0 + 1.9, 0.74, w / 2 - 0.4, gi);
    mgBox(2.0, 0.83, 0.58, pine, c0 + 1.9, 0.315, w / 2 - 0.4, gi);
    mgBox(1.3, 0.035, 0.015, brass, c0 + 1.55, 0.78, w / 2 - 0.695, gi);                    // the fiddle rail (stops the tins)
    mgBox(0.56, 0.06, 0.5, mgStd('#d8d8d4', 0.4, 0.3), c0 + 2.5, 0.795, w / 2 - 0.4, gi);    // the cooker's hob
    for (const [dx, dz] of [[-0.13, -0.11], [0.13, -0.11], [-0.13, 0.11], [0.13, 0.11]]) mgCyl(0.08, 0.08, 0.012, mgStd('#1a1a1c', 0.6, 0.4), c0 + 2.5 + dx, 0.83, w / 2 - 0.4 + dz, gi, 16);
    // a shelf of jars above the worktop, a calendar, the windows' daylight from inside (the side walls are solid)
    mgBox(1.4, 0.025, 0.16, pine, c0 + 1.5, 1.35, w / 2 - 0.16, gi);
    for (let i = 0; i < 6; i++) mgCyl(0.04, 0.04, 0.13, new THREE.MeshStandardMaterial({ color: ['#c88a3a', '#8a3a2a', '#d8c87a', '#6a8a3a', '#c8c0b0', '#a85a2a'][i], roughness: 0.3 }), c0 + 0.95 + 0.21 * i, 1.43, w / 2 - 0.16, gi, 12);
    const day = new THREE.MeshBasicMaterial({ color: '#a6b6bf' });
    for (const sz of [-1, 1]) for (const wx of [-4.2, -2.4, -0.6, 1.2]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.33), day); pl.position.set(wx, Bt.gun + 0.72, sz * (w / 2 - 0.087)); pl.rotation.y = sz > 0 ? Math.PI : 0; g.add(pl); }
    // a little light inside (the windows' daylight)
    const lamp = new THREE.PointLight('#ffe2b8', 2.2, 6, 1.6); lamp.position.set(c0 + 1.6, 1.4, 0); g.add(lamp);
    const fill = new THREE.PointLight('#ffe8cc', 1.4, 3.5, 1.6); fill.position.set(c0 + 1.8, 0.6, -0.55); g.add(fill);   // (the floor by the galley)
    // the things that slide (each: its rest place on the worktop or floor, its mass, how slippery)
    const tinM = mgStd('#b8b8b0', 0.35, 0.8), items = [];
    const add = (mesh, p, mu, kind) => { mesh.position.set(...p); gi.add(mesh); items.push({ mesh, p0: p.slice(), mu, kind }); };
    const kettle = new THREE.Group();
    const enamel = mgStd('#c0392b', 0.3, 0.1);   // an enamelled steel kettle (red, like every narrowboat's)
    mgCyl(0.1, 0.12, 0.17, enamel, 0, 0, 0, kettle, 18); mgMesh(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), enamel, 0, 0.085, 0, kettle);
    const spout = mgCyl(0.015, 0.025, 0.14, enamel, 0.12, 0.03, 0, kettle, 8); spout.rotation.z = -0.9;
    const hdl = mgMesh(new THREE.TorusGeometry(0.07, 0.012, 6, 14, Math.PI), mgStd('#1a1a1c', 0.5), 0, 0.17, 0, kettle); void hdl;
    add(kettle, [c0 + 2.37, 0.92, w / 2 - 0.53], 0.08, 'kettle');   // (enamel on an enamel hob: slippery)
    for (let i = 0; i < 6; i++) { const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.11, 14), [tinM, new THREE.MeshStandardMaterial({ color: ['#c83a2a', '#e8c84a', '#2a6a9a'][i % 3], roughness: 0.5 }), tinM][0]); add(tin, [c0 + 1.0 + 0.11 * i, 0.82, w / 2 - 0.36 + 0.07 * (i % 2)], 0.11 + 0.012 * (i % 3), 'tin');
      const lab = mgCyl(0.039, 0.039, 0.07, mgStd(['#c83a2a', '#e8c84a', '#2a6a9a'][i % 3], 0.5), 0, 0, 0, tin, 14); void lab; }
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.09, 18), mgStd('#2a2a2c', 0.4, 0.6)), [c0 + 1.5, -0.05, 0.25], 0.13, 'pan');
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.1, 18), mgStd('#3a3a3c', 0.4, 0.6)), [c0 + 2.2, -0.05, 0.3], 0.15, 'pan');
    for (const it of items) it.mesh.castShadow = true;
    out.inside = items; out.lamp = lamp;
  }
  // ---- the roof's things: the chimney, a pole and plank, a plant pot, the solar panel, the bike in its rack, the radio
  {
    mgCyl(0.07, 0.07, 0.5, mgStd('#1a1a1a', 0.6, 0.4), 4.6, Bt.roof + 0.3, -0.35, g); mgCyl(0.085, 0.085, 0.06, brass, 4.6, Bt.roof + 0.4, -0.35, g);
    mgBox(7.5, 0.05, 0.22, mgStd('#6a5a44', 0.85), 0.8, Bt.roof + 0.09, 0.62, g);
    mgCyl(0.025, 0.025, 6.5, mgStd('#5a4a38', 0.8), 1.2, Bt.roof + 0.15, 0.4, g).rotation.z = Math.PI / 2;
    mgCyl(0.16, 0.12, 0.25, mgStd('#a8583a', 0.9), 5.3, Bt.roof + 0.18, 0.25, g); mgMesh(mgBlobGeo(0.2, 3), mgStd('#3a5a2a', 0.9), 5.3, Bt.roof + 0.38, 0.25, g);
    mgBox(1.2, 0.04, 0.6, mgStd('#1a2a4a', 0.2, 0.5), -2.6, Bt.roof + 0.1, 0.2, g);
    // the rack
    for (const dx of [-0.75, 0.75]) mgBox(0.04, 0.5, 0.04, mgStd('#2a2a2a', 0.6, 0.5), MG_SMALL.bikeLocal[0] + dx, Bt.roof + 0.28, MG_SMALL.bikeLocal[2] - 0.08, g);
    // the bike: two wheels, its frame (steel, 12 kg); it is drawn in the world (it leaves the boat)
    const bike = new THREE.Group(), fm = mgStd('#2a5aa8', 0.4, 0.5), tyre = mgStd('#151515', 0.8);
    for (const dx of [-0.52, 0.52]) { const w = mgMesh(new THREE.TorusGeometry(0.33, 0.025, 8, 24), tyre, dx, 0, 0, bike); void w; const rim = mgMesh(new THREE.TorusGeometry(0.3, 0.01, 6, 20), mgStd('#aaa', 0.3, 0.8), dx, 0, 0, bike); void rim; }
    const unit = new THREE.CylinderGeometry(1, 1, 1, 6); unit.translate(0, 0.5, 0);
    const tube = (a, b, r = 0.018) => { const m = new THREE.Mesh(unit, fm); mgStrut(m, a, b, r); m.castShadow = true; bike.add(m); };
    const bb = [0, -0.05, 0], st = [-0.12, 0.42, 0], hd = [0.4, 0.4, 0];
    tube([-0.52, 0, 0], bb); tube(bb, st); tube(st, hd); tube(bb, hd); tube([-0.52, 0, 0], st); tube(hd, [0.52, 0, 0]); tube(st, [-0.16, 0.55, 0], 0.014); tube(hd, [0.36, 0.56, 0], 0.014);
    mgBox(0.24, 0.05, 0.1, mgStd('#111', 0.8), -0.17, 0.58, 0, bike); mgBox(0.04, 0.03, 0.5, mgStd('#111', 0.6), 0.36, 0.57, 0, bike);
    scene.add(bike); out.bike = bike;
    // the radio on the hatch: a little red transistor radio, its speaker an open paper cone (at 10:42:00 it stops dead: still on, silent), a lit
    // tuning dial, two knobs, a chrome handle and aerial
    const radio = new THREE.Group(); radio.position.set(Bt.cab[0] + 0.55, Bt.roof + 0.115 + 0.002, -0.15); radio.rotation.y = -0.25; g.add(radio);
    const rb = mgMesh(mgRoundBox(0.32, 0.19, 0.11, 0.03, 0.01, 3), mgStd('#9a2e24', 0.42, 0.08), 0, 0, 0, radio); rb.rotation.x = 0; void rb;
    const chrome = mgStd('#d8d8d4', 0.22, 0.9), fz = 0.055;
    // the speaker: a chrome bezel, a dark hole, the paper cone in six petals (they fold out when it tears), the dust cap
    const bz = mgMesh(new THREE.TorusGeometry(0.06, 0.007, 8, 32), chrome, -0.07, 0.095, fz + 0.002, radio); void bz;
    mgMesh(new THREE.CircleGeometry(0.058, 28), new THREE.MeshBasicMaterial({ color: '#0a0908' }), -0.07, 0.095, fz - 0.012, radio);
    const paper = new THREE.MeshStandardMaterial({ color: '#c8b896', roughness: 0.95, side: THREE.DoubleSide });
    const petals = []; for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.054, 6, k * Math.PI / 3, Math.PI / 3), paper); p.position.set(-0.07, 0.095, fz - 0.006); radio.add(p); petals.push(p); }
    const cap = mgMesh(new THREE.SphereGeometry(0.014, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mgStd('#2a2420', 0.6), -0.07, 0.095, fz - 0.006, radio); cap.rotation.x = Math.PI / 2;
    // the tuning dial (lit until 10:42:00), its needle, two knobs
    const dialTex = mgTex(mgCanvas(256, 128, (c) => { c.fillStyle = '#f4e8c8'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#3a2a1a'; c.lineWidth = 3; for (let i = 0; i <= 20; i++) { const x = 20 + i * 10.8; c.beginPath(); c.moveTo(x, 70); c.lineTo(x, i % 5 ? 84 : 94); c.stroke(); } c.fillStyle = '#3a2a1a'; c.font = '700 22px Arial'; c.fillText('FM  88  92  96  100  104', 14, 40); c.fillStyle = '#c8322a'; c.fillRect(150, 52, 4, 60); }), { repeat: false });
    const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.055), new THREE.MeshBasicMaterial({ map: dialTex, color: new THREE.Color(1.25, 1.1, 0.8), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); dial.position.set(0.085, 0.125, fz + 0.0012); radio.add(dial);
    for (const kx of [0.05, 0.12]) { const kn = mgCyl(0.017, 0.017, 0.016, chrome, kx, 0.055, fz + 0.008, radio, 16); kn.rotation.x = Math.PI / 2; }
    // the handle and the aerial
    mgMesh(new THREE.TorusGeometry(0.11, 0.008, 8, 20, Math.PI), chrome, 0, 0.19, 0, radio);
    const ae = mgCyl(0.003, 0.004, 0.36, chrome, 0.13, 0.33, -0.03, radio, 6); ae.rotation.z = -0.45;
    // its little torn shreds of paper (they fly out at 10:42:00)
    const shreds = []; for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.012 + 0.008 * (k % 3), 0.008 + 0.006 * (k % 2)), paper); m.position.set(-0.07, 0.095, fz); radio.add(m); shreds.push(m); }
    out.radio = { g: radio, petals, dial, shreds };
  }
  // ---- the stern: the tiller (a brass swan-neck and a wooden arm), the rails; your mum at the tiller
  {
    const sn = mgCyl(0.03, 0.03, 0.9, brass, -8.55, 0.85, 0, g); sn.rotation.z = 0.2;
    const tiller = new THREE.Group(); tiller.position.set(-8.6, 1.25, 0); g.add(tiller);
    const arm = mgCyl(0.022, 0.022, 1.1, mgStd('#8a5a2a', 0.6), 0.5, 0, 0, tiller); arm.rotation.z = Math.PI / 2 - 0.05;
    mgCyl(0.03, 0.03, 0.14, mgStd('#e8dfc8', 0.5), 1.02, 0, 0, tiller).rotation.z = Math.PI / 2;
    out.tiller = tiller;
    for (const sz of [-1, 1]) mgBox(1.6, 0.03, 0.03, brass, -7.6, 0.95, sz * 0.92, g);
    for (const sz of [-1, 1]) for (const x of [-8.3, -6.9]) mgBox(0.03, 0.5, 0.03, brass, x, 0.72, sz * 0.92, g);
    out.mum = mgPerson('mgMum', g); out.mum.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // the boat's frame at story s, and a point on it in the world
  const place = (s) => {
    const hl = MGB.heel(s) * (s < MGP.T ? 1 : Math.exp(-(s - MGP.T) / 0.4)), drop = s >= MGP.T && s < MGP.T + 4 ? -0.18 * Math.exp(-(s - MGP.T - 0.25) * (s - MGP.T - 0.25) / 0.02) + 0.06 * Math.sin((s - MGP.T) * 5) * Math.exp(-(s - MGP.T) / 0.8) : 0;
    const bob = 0.012 * Math.sin(s * 1.7) + 0.008 * Math.sin(s * 2.9 + 1);
    const crash = MGB.hit != null && s > MGB.hit ? 0.05 * Math.sin((s - MGB.hit) * 30) * Math.exp(-(s - MGB.hit) / 0.12) : 0;
    g.position.set(MGB.x(s), MGB.heave(s) + drop + bob, MGB.z(s) + crash);
    g.rotation.set(hl + 0.006 * Math.sin(s * 1.3), 0, 0.004 * Math.sin(s * 0.9));
    g.updateMatrixWorld(true);
  };
  const v3 = new THREE.Vector3();
  out.world = (lx, ly, lz) => { v3.set(lx, ly, lz); g.localToWorld(v3); return [v3.x, v3.y, v3.z]; };
  out.update = (s, t, mode) => {
    place(s);
    // the radio: still on (its dial stays lit), but from 10:42:00 its cone is braked almost dead by its own magnet's field
    // (the coil's back-EMF): before, the cone trembles with the song; after, it is still
    const R = out.radio, torn = 0;
    R.dial.material.color.setRGB(1.25, 1.1, 0.8);
    R.petals.forEach((p, k) => { const a = k * Math.PI / 3 + Math.PI / 6, f = torn * (0.75 + 0.5 * hash1(k * 3 + 1)); p.rotation.set(-Math.sin(a) * 1.25 * f, Math.cos(a) * 1.25 * f, 0.3 * f * (k % 2 ? 1 : -1)); p.position.z = 0.049 + 0.018 * torn; p.scale.setScalar(1 - 0.25 * torn * hash1(k + 7)); });
    R.shreds.forEach((m, k) => { const r = mgRand(k * 13 + 3), u = Math.max(0, s), vz = 0.8 + 1.6 * r(), vx = (r() - 0.5) * 1.6, vy = (r() - 0.3) * 1.4, e = 1 - Math.exp(-u / 0.06); m.visible = false; m.position.set(-0.07 + vx * 0.08 * e, 0.095 + vy * 0.08 * e - 2 * u * u, 0.055 + vz * 0.1 * e); m.rotation.set(9 * r() * e, 7 * r() * e, 5 * r() * e); });
    // the bike: in its rack until its straps give (MGP.bikeRel), then where MG_SMALL.bike puts it (it stays on the ball;
    // after 10:42:10 it falls into the heap)
    {
      const B = out.bike, rel = MG_SMALL.bikeRel, lp = MG_SMALL.bikeLocal;
      if (s < rel) { const w = out.world(lp[0], lp[1] - 0.02, lp[2]); B.position.set(...w); B.rotation.set(g.rotation.x, 0, 0); }
      else if (s < MGP.T) { const p = MG_SMALL.bike.at(Math.min(s, MG_SMALL.bike.hit || 99)); B.position.set(...p); const u = Math.min(s, MG_SMALL.bike.hit || 99) - rel; B.rotation.set(g.rotation.x + 2.2 * u, 0.6 * u, 1.4 * u); }
      else { const p = MG_SMALL.bike.at(MG_SMALL.bike.hit || MGP.T); const u = Math.min(1, s - MGP.T); B.position.set(p[0] + 1.2 * u, Math.max(MG_F.wharf.top + 0.4, p[1] - 4.9 * u * u), p[2] + 0.8 * u); }
    }
    // inside: the tins, pans and kettle slide north when the pull beats their friction (pull from physics at their place)
    for (const it of out.inside) {
      let x = 0, fell = 0;
      if (s > 5) {
        // integrate the slide from s = 5 (small steps; cheap: a few dozen items)
        let v = 0, d = 0; const ds = 0.01;
        for (let q = 5; q < Math.min(s, MGP.T); q += ds) {
          const wp = mgOnBoat(q, it.p0[0], it.p0[1], it.p0[2]), M = MGY.magAt(q), r = Math.hypot(M[0] - wp[0], M[1] - wp[1], M[2] - wp[2]);
          const a = MGP.pull(r) * 0.95 - it.mu * MGP.g; if (a > 0 || v > 0) { v = Math.max(0, v + (a > 0 ? a : -it.mu * MGP.g) * ds); d += v * ds; }
        }
        x = d;
      }
      // tins stop at the fiddle rail; the kettle slides off the hob's edge and falls to the floor; pans slide to the wall
      const wB = MG_BOAT.B - 0.22, edge = wB / 2 - 0.7, north = -wB / 2 + 0.09;
      const cap = it.kind === 'tin' ? it.p0[2] - (edge + 0.008) - 0.038 : it.kind === 'pan' ? it.p0[2] - north - 0.14 : it.p0[2] - north - 0.12;
      const dz = Math.min(x, cap);
      if (it.kind === 'kettle') fell = MathX.clamp((dz - (it.p0[2] - edge)) * 10, 0, 1);
      it.mesh.position.set(it.p0[0], it.p0[1] - (it.kind === 'kettle' ? 0.94 * fell * fell : 0), it.p0[2] - dz);
      // a tin that reaches the fiddle rail and is still pulled tips over it
      const tip = it.kind === 'tin' ? MathX.clamp((x - cap) * 5, 0, 1) : 0;
      it.mesh.rotation.set(it.kind === 'kettle' ? 1.3 * fell : -1.1 * tip * tip, 0, 0);
    }
    // your mum: steering (from 10:42:01 she pushes the tiller hard over, away from the wharf); after the crash, braced
    {
      const m = out.mum, steer = MathX.smooth(s, 1.0, 1.8) * (s < MGP.T + 4 ? 1 : 0.4);
      out.tiller.rotation.y = -0.5 * steer;
      const p = basePose();
      p.rSh = [0.75, -0.25]; p.rEl = 0.9; p.lSh = [0.25, 0.15]; p.lEl = 0.5;
      p.headYaw = s < 0 ? 0.25 : 0.85 * MathX.smooth(s, 0.0, 0.08); p.neck = -0.05;
      if (s > 1.0) { p.spine = 0.18 * steer; p.rSh = [0.95, -0.55 * steer - 0.25]; p.rEl = 0.5; p.lSh = [0.9, -0.3]; p.lEl = 0.6; p.lHip = [0.25, 0.1]; p.lKnee = 0.3; p.hipY = 0.92; }
      if (MGB.hit != null && s > MGB.hit) { const k = Math.exp(-(s - MGB.hit) / 0.5); p.spine += 0.3 * k; p.hipY -= 0.08 * k; p.lKnee += 0.4 * k; p.rKnee = 0.3 * k; }
      mgPose(m, p, -7.55, Bt.deck + 0.03, 0.42, Math.PI / 2 + 0.2);
      void t; void mode;
    }
  };
  return out;
}
