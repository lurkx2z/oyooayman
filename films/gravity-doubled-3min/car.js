/* =====================================================================
   CAR — a small parked city car (original design, rounded 1960s lines) with working suspension:
   four coil-over struts (spring + damper + bump-stop rubber) visible inside the wheel arches.
   Suspension model (per corner, a linear spring with its static sag):
     1 g: the springs sit 9 cm compressed (a 1.66 Hz ride, ordinary for a small car); the tyres 1.2 cm.
     2 g: the same springs carry twice the weight → twice the sag: the body sits 9 cm lower on its springs and
          the tyres squash another 1.2 cm (≈10 cm in all; 2 cm of bump travel is left before the stops).
          The spring rate and the mass don't change, so the car still bounces at the same 1.66 Hz.
   Extra load on a corner (someone pushing on the wing) adds F/k: about 3 cm for ~900 N on the front.
   All posed from update(t) as a pure function of time.
   ===================================================================== */

const GB_CAR = {
  L: 3.36, W: 1.46, wheelR: 0.29, wheelX: 1.13, wheelZ: 0.6,
  sag1: 0.09, tyre1: 0.012,             // static spring / tyre deflection at 1 g (m)
  freq: 1.66, zeta: 0.28,               // ride frequency (Hz), damping ratio
  refSide: -1,                          // the 1 g reference line is drawn on the car's far side (the side the close-up sees)
};

class GbCar {
  constructor(scene, opts = {}) {
    const C = GB_CAR;
    this.g = new THREE.Group(); this.g.name = 'gbCar'; scene.add(this.g);
    this.body = new THREE.Group(); this.g.add(this.body);
    const paint = gbMat(opts.color || '#7fa392', { rough: 0.32, rim: 0.45, env: 1.1, name: 'gbCarPaint' });
    const cream = gbMat('#efe4cf', { rough: 0.4, rim: 0.3, env: 0.8, name: 'gbCarRoof' });
    const chrome = gbMat('#d9d6d2', { rough: 0.15, metal: 0.95, env: 1.4, name: 'gbChrome' });
    const glass = gbMat('#2b2a3f', { rough: 0.05, env: 1.6, name: 'gbCarGlass' });
    const dark = gbMat('#151318', { rough: 0.7 });
    const rubber = gbMat('#1d1b1e', { rough: 0.85, name: 'gbTyre' });
    // ---- the lower body: a side profile with two round wheel arches, extruded across the width (bevelled)
    const L2 = C.L / 2, r = C.wheelR + 0.055;
    // body-local: y = 0 at the wheel centres (1 g ride); sill and belt line heights relative to that
    const sill = -0.12, belt = 0.42;
    const pts = [];
    const arch = (cx) => { for (let i = 0; i <= 16; i++) { const a = Math.PI - (i / 16) * Math.PI; pts.push([cx + Math.cos(a) * r, Math.max(sill, Math.sin(a) * r * 1.0 - 0.0)]); } };
    pts.push([-L2 + 0.02, sill + 0.08]);
    pts.push([-C.wheelX - r - 0.04, sill]);
    arch(-C.wheelX);
    pts.push([C.wheelX - r - 0.02, sill]);
    arch(C.wheelX);
    pts.push([L2 - 0.04, sill]);
    pts.push([L2 + 0.02, sill + 0.1]);
    pts.push([L2 + 0.04, belt - 0.12]);
    pts.push([L2 - 0.08, belt - 0.02]);       // the bonnet's rounded nose
    pts.push([L2 - 0.5, belt + 0.04]);
    pts.push([-L2 + 0.4, belt + 0.03]);
    pts.push([-L2 + 0.02, belt - 0.06]);
    const prof = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const bodyGeo = new THREE.ExtrudeGeometry(prof, { depth: C.W - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 6 });
    bodyGeo.translate(0, 0, -(C.W - 0.12) / 2);
    this.shell = gbAdd(this.body, bodyGeo, paint, 0, 0, 0);
    // ---- the cabin: a narrower rounded glasshouse in cream with dark glass panes
    const cp = [[-0.95, belt], [-0.78, belt + 0.5], [-0.62, belt + 0.56], [0.42, belt + 0.56], [0.66, belt + 0.48], [0.98, belt]];
    const cab = new THREE.ExtrudeGeometry(new THREE.Shape(cp.map(([x, y]) => new THREE.Vector2(x, y))), { depth: C.W - 0.34, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 });
    cab.translate(0, 0, -(C.W - 0.34) / 2);
    gbAdd(this.body, cab, cream, 0, 0, 0);
    // side windows (two per side), windscreen and rear screen as thin inset panes
    for (const sz of [-1, 1]) {
      const zz = sz * ((C.W - 0.34) / 2 + 0.052);
      for (const [x0, x1] of [[-0.78, -0.12], [-0.04, 0.6]]) {
        const w = new THREE.Shape([new THREE.Vector2(x0, belt + 0.07), new THREE.Vector2(x0 + (x0 < -0.5 ? 0.12 : 0), belt + 0.47), new THREE.Vector2(x1 - (x1 > 0.5 ? 0.18 : 0), belt + 0.47), new THREE.Vector2(x1, belt + 0.07)]);
        gbAdd(this.body, new THREE.ShapeGeometry(w), glass, 0, 0, zz, { ry: sz > 0 ? 0 : Math.PI, s: [sz > 0 ? 1 : -1, 1, 1], cast: false });
      }
    }
    const ws = gbAdd(this.body, new THREE.PlaneGeometry(C.W - 0.5, 0.5), glass, 0.84, belt + 0.27, 0, { ry: Math.PI / 2, cast: false });
    ws.rotateX(-0.62);
    const rs = gbAdd(this.body, new THREE.PlaneGeometry(C.W - 0.52, 0.42), glass, -0.89, belt + 0.27, 0, { ry: -Math.PI / 2, cast: false });
    rs.rotateX(-0.5);
    // bumpers, lights, grille, handles, mirrors
    for (const sx of [-1, 1]) {
      gbAdd(this.body, gbRoundBox(0.08, 0.07, C.W + 0.02, 0.03, 3), chrome, sx * (L2 + 0.07), sill + 0.14, 0);
      for (const sz of [-1, 1]) {
        if (sx > 0) {
          gbAdd(this.body, new THREE.CylinderGeometry(0.075, 0.075, 0.05, 24), chrome, L2 + 0.02, belt - 0.13, sz * 0.5, { rz: Math.PI / 2 });
          gbAdd(this.body, new THREE.CircleGeometry(0.06, 24), new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffd9a0', emissiveIntensity: 0.25, roughness: 0.1 }), L2 + 0.048, belt - 0.13, sz * 0.5, { ry: Math.PI / 2, cast: false });
        } else gbAdd(this.body, gbRoundBox(0.03, 0.12, 0.09, 0.02, 2), gbMat('#b8342e', { rough: 0.3, emissive: '#5a0d0d', emi: 0.3 }), -L2 - 0.02, belt - 0.12, sz * 0.52);
      }
    }
    gbAdd(this.body, gbRoundBox(0.03, 0.14, 0.42, 0.02, 2), chrome, L2 + 0.03, belt - 0.2, 0);
    for (let k = 0; k < 4; k++) gbAdd(this.body, new THREE.BoxGeometry(0.01, 0.1, 0.36), dark, L2 + 0.045, belt - 0.2, 0, { rz: 0 }).position.y = belt - 0.2;
    for (const sz of [-1, 1]) gbAdd(this.body, gbRoundBox(0.12, 0.02, 0.025, 0.008, 2), chrome, 0.1, belt - 0.04, sz * (C.W / 2 + 0.005));
    for (const sz of [-1, 1]) gbAdd(this.body, new THREE.SphereGeometry(0.04, 12, 8), chrome, 0.62, belt + 0.1, sz * (C.W / 2 - 0.02), { s: [1, 0.7, 0.7] });
    // a chrome waist strip
    for (const sz of [-1, 1]) gbAdd(this.body, gbRoundBox(C.L - 0.3, 0.012, 0.01, 0.004, 2), chrome, 0, belt - 0.08, sz * (C.W / 2 + 0.002));
    // the dark under-body (so you can't see through the arches)
    gbAdd(this.body, new THREE.BoxGeometry(C.L - 0.2, 0.06, C.W - 0.3), dark, 0, sill + 0.06, 0);
    for (const cx of [-C.wheelX, C.wheelX]) gbAdd(this.body, new THREE.CylinderGeometry(r - 0.005, r - 0.005, C.W - 0.16, 24, 1, true, 0, Math.PI), gbMat('#120f13', { rough: 0.9, side: THREE.DoubleSide }), cx, 0, 0, { rx: Math.PI / 2, rz: Math.PI / 2, cast: false });
    // ---- wheels (fixed to the ground) and struts (between hub and arch)
    const tyreGeo = gbLathe([[C.wheelR - 0.1, -0.08], [C.wheelR - 0.025, -0.085], [C.wheelR, -0.06], [C.wheelR + 0.004, 0], [C.wheelR, 0.06], [C.wheelR - 0.025, 0.085], [C.wheelR - 0.1, 0.08]], 36);
    const hubGeo = gbLathe([[0, 0.088], [0.12, 0.085], [0.165, 0.07], [0.18, 0.06], [0.18, -0.05], [0, -0.05]], 28);
    // helix: unit-height coil, 6 turns, radius 0.07 (scaled in y to the spring's length)
    const hp = []; for (let i = 0; i <= 240; i++) { const a = (i / 240) * Math.PI * 2 * 6; hp.push(new THREE.Vector3(Math.cos(a) * 0.07, i / 240, Math.sin(a) * 0.07)); }
    const coil = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 360, 0.011, 6, false);
    const springM = gbMat('#c9442f', { rough: 0.35, metal: 0.3, rim: 0.4, name: 'gbSpring' });
    this.wheels = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(sx * C.wheelX, C.wheelR, sz * C.wheelZ); this.g.add(w);
      const ty = gbAdd(w, tyreGeo, rubber, 0, 0, 0, { rx: Math.PI / 2 });
      const hub = gbAdd(w, hubGeo, chrome, 0, 0, sz * 0.0, { rx: sz * Math.PI / 2 });
      // strut: lower seat on the hub knuckle (moves with the wheel), upper mount on the body (moves with the body)
      const strut = new THREE.Group(); strut.position.set(sx * C.wheelX - sx * 0.02, 0, sz * (C.wheelZ - 0.16)); this.g.add(strut);
      const spring = gbAdd(strut, coil, springM, 0, 0, 0);
      const damper = gbAdd(strut, new THREE.CylinderGeometry(0.022, 0.022, 1, 10), gbMat('#2a2a30', { rough: 0.4, metal: 0.6 }), 0, 0.5, 0);
      const rod = gbAdd(strut, new THREE.CylinderGeometry(0.009, 0.009, 1, 8), chrome, 0, 0.5, 0);
      const stop = gbAdd(strut, new THREE.CylinderGeometry(0.03, 0.026, 0.05, 12), gbMat('#3a3236', { rough: 0.9 }), 0, 0, 0);
      const seatLo = gbAdd(strut, new THREE.CylinderGeometry(0.085, 0.085, 0.012, 16), dark, 0, 0, 0);
      const seatHi = gbAdd(strut, new THREE.CylinderGeometry(0.085, 0.085, 0.012, 16), dark, 0, 0, 0);
      this.wheels.push({ sx, sz, w, ty, hub, strut, spring, damper, rod, stop, seatLo, seatHi });
    }
    // the 1 g ride-height reference (shown in the close-up): a dashed line along the sill + the dashed outline of the
    // body where it sat at 1 g, drawn as flat ribbons (1-px GL lines vanish at 1080p) on the side the camera sees
    const dash = new THREE.MeshBasicMaterial({ color: '#ffe6c2', transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
    this.refLine = new THREE.Mesh(gbDashRibbon([[-C.L / 2 - 0.3, 0], [C.L / 2 + 0.3, 0]], 0.07, 0.05, 0.012), dash);
    this.refLine.renderOrder = 7; this.g.add(this.refLine); this.refM = dash;
    this.outlineM = new THREE.MeshBasicMaterial({ color: '#fff0d8', transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const loop = pts.concat([pts[0]]);
    const og = gbMergeGeos([gbDashRibbon(loop, 0.05, 0.035, 0.008), gbDashRibbon(cp, 0.05, 0.035, 0.008)]);
    this.outline = new THREE.Mesh(og, this.outlineM); this.outline.renderOrder = 7; this.g.add(this.outline);
    this.ghostM = gbMat('#fff2dc', { rough: 0.5, transparent: true, opacity: 0, emissive: '#ffd8a8', emi: 0.4, depthWrite: false, name: 'gbCarGhost' });
    this.ghost = gbAdd(this.g, bodyGeo, this.ghostM, 0, 0, 0, { cast: false }); this.ghost.renderOrder = 6;
    this.sill = sill; this.belt = belt;
  }

  place(x, z, yaw) { this.g.position.set(x, 0, z); this.g.rotation.set(0, yaw, 0); }

  // corner deflections (m, + = body lower) at film time t; push(t) = extra load on the front-left wing (N)
  // a damped spring (ζ = 0.28, f = 1.66 Hz) driven by the load: the body follows its static target with the car's own dynamics
  _resp(t, steps) {
    const C = GB_CAR, w = 2 * Math.PI * C.freq;
    // superposition of step responses: each step [t0, Δ] moves the static target by Δ
    let y = 0;
    for (const [t0, d, rise] of steps) {
      if (t < t0) continue;
      const u = t - t0, wd = w * Math.sqrt(1 - C.zeta * C.zeta);
      // a ramped step (rise s) avoids an infinite jerk; integrate the step response over the ramp in 6 pieces
      const n = rise > 0 ? 6 : 1; let acc = 0;
      for (let i = 0; i < n; i++) {
        const uu = u - (rise * (i + 0.5)) / n; if (uu < 0) continue;
        acc += (1 - Math.exp(-C.zeta * w * uu) * (Math.cos(wd * uu) + (C.zeta / Math.sqrt(1 - C.zeta * C.zeta)) * Math.sin(wd * uu))) / n;
      }
      y += d * acc;
    }
    return y;
  }

  update(t, opts = {}) {
    const C = GB_CAR, g = gbG(t);
    // static sag scales with the weight (g); the doubling itself happened at GB.g (the body bounced then)
    const spring = (C.sag1 * g) - C.sag1;          // extra spring compression beyond the 1 g ride (0 → 9 cm)
    const tyre = (C.tyre1 * g) - C.tyre1;
    // the push on the front wing: steps of extra load F → F/k at the front corners (k from the 1 g sag, 250 kg corner)
    const kCorner = 250 * 9.81 / C.sag1;
    const steps = (opts.pushSteps || []).map(([t0, F, rise]) => [t0, F / (2 * kCorner), rise]);
    const front = this._resp(t, steps);
    const dynG = this._resp(t, [[GB.g, C.sag1 + C.tyre1, 0.12]]) - (C.sag1 + C.tyre1) * MathX.smooth(t, GB.g, GB.g + 0.12);   // the bounce at the doubling
    const base = spring + tyre + dynG;
    // body: lower by base (all corners), front lower by `front`, pitch accordingly
    const dropF = base + front, dropR = base;
    const yMid = (dropF + dropR) / 2, pitch = Math.atan2(dropF - dropR, 2 * C.wheelX);
    const rideY = C.wheelR + 0.0;     // the body origin sits at wheel-centre height at 1 g
    this.body.position.set(0, rideY - yMid, 0);
    this.body.rotation.set(0, 0, -pitch);
    // the tyres squash a little (flatten at the bottom)
    for (const W of this.wheels) {
      const drop = W.sx > 0 ? dropF : dropR, tyreD = C.tyre1 * g + (W.sx > 0 ? front * 0.1 : 0);
      W.w.position.y = C.wheelR - tyreD * 0.5;
      W.ty.scale.set(1 + tyreD * 1.6, 1, 1 - tyreD * 0.8);   // (lathe rotated: local x/z are the tyre's radius directions)
      // the strut runs from the hub knuckle (wheel centre + 0.06) to the arch mount (body, 0.34 above the wheel centre at 1 g)
      const lo = W.w.position.y + 0.06, hi = rideY + 0.34 - drop + 0.06 * 0;
      const len = Math.max(0.05, hi - lo);
      W.strut.position.y = lo;
      W.spring.scale.set(1, len - 0.03, 1); W.spring.position.y = 0.012;
      W.damper.scale.set(1, len * 0.5, 1); W.damper.position.y = len * 0.25;
      W.rod.scale.set(1, len * 0.55, 1); W.rod.position.y = len * 0.72;
      W.seatLo.position.y = 0.006; W.seatHi.position.y = len - 0.006;
      W.stop.position.y = len - 0.05;
    }
    // the reference: the body's 1 g sill height (only drawn when asked)
    const ra = opts.refAlpha || 0;
    this.refM.opacity = 0.9 * ra; this.refLine.visible = ra > 0.01;
    this.refLine.position.set(0, rideY + this.sill + 0.0, C.refSide * (C.W / 2 + 0.06));
    this.ghostM.opacity = 0.1 * ra; this.ghost.visible = ra > 0.01;
    this.ghost.position.set(0, rideY, 0);
    this.outlineM.opacity = 0.85 * ra; this.outline.visible = ra > 0.01;
    this.outline.position.set(0, rideY, C.refSide * (C.W / 2 + 0.012));
    return { drop: base, front };
  }
}

// a dashed polyline in the local XY plane as flat quads (dash/gap/width in metres)
function gbDashRibbon(points, dash, gap, width) {
  const pos = [], idx = []; let carry = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1], len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1e-6) continue;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy * width / 2, ny = ux * width / 2;
    let s = carry;
    while (s < len) {
      const e = Math.min(len, s + dash);
      if (s >= 0) {
        const ax = x0 + ux * s, ay = y0 + uy * s, bx = x0 + ux * e, by = y0 + uy * e, n = pos.length / 3;
        pos.push(ax + nx, ay + ny, 0, ax - nx, ay - ny, 0, bx - nx, by - ny, 0, bx + nx, by + ny, 0);
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      }
      s += dash + gap;
    }
    carry = s - len;   // continue the dash pattern round corners
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
function gbMergeGeos(list) {
  const pos = [], idx = []; let off = 0;
  for (const g of list) {
    const p = g.attributes.position.array, ix = g.index.array;
    for (let i = 0; i < p.length; i++) pos.push(p[i]);
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off);
    off += p.length / 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
