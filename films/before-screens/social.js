/* =====================================================================
   SOCIAL GAMES + EVENING — the games that need other kids, and the end of the day.
   A long skipping rope turned by two, a hopscotch court scratched in the
   dirt, a ball thrown to you (you catch it with both hands), and the
   lamplighter's flame: the first gas lamp of the evening, then the rest.
   ===================================================================== */

const SOCIAL = {
  rope: { turners: ['hoop1', 'catchB'], jumper: 'tag2', t0: 54.9, t1: 56.7, period: 0.62 },
  hop: { x: 2.6, z0: -46.4, z1: -50.9 },
  ball: { from: 'runner', release: 59.85, catch: 60.42, drop: 60.9 },
  lamp: { x: 5.75, z: -58, lit: 65.55, othersFrom: 66.4 },
};

class SocialGames {
  constructor(scene, kids, hands, pov, town) {
    this.kids = kids; this.hands = hands; this.pov = pov; this.town = town;
    this.root = new THREE.Group(); this.root.name = 'social'; scene.add(this.root);
    // the long rope: a half-ellipse between the turners' hands, rotated about the line joining them
    const pts = [];
    for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push(new THREE.Vector3(s - 0.5, Math.sin(Math.PI * s), 0)); }
    this.rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.006, 4, false), new THREE.MeshStandardMaterial({ color: '#c9b48a', roughness: 0.9, name: 'longRope' }));
    this.rope.castShadow = true;
    this.ropePivot = new THREE.Group(); this.ropePivot.add(this.rope); this.root.add(this.ropePivot);
    // hopscotch court scratched in the packed dirt: 1, 2, 3, 4-5, 6, 7-8 and a half-moon
    const cv = Tex.canvas(256, 512), c = cv.getContext('2d');
    c.clearRect(0, 0, 256, 512); c.strokeStyle = 'rgba(60,44,28,0.85)'; c.lineWidth = 5; c.lineCap = 'round';
    const H = 512 / 7.5, W = 256;
    const box = (x0, y0, w, h) => c.strokeRect(x0, y0, w, h);
    box(W * 0.3, 512 - H, W * 0.4, H); box(W * 0.3, 512 - 2 * H, W * 0.4, H); box(W * 0.3, 512 - 3 * H, W * 0.4, H);
    box(W * 0.1, 512 - 4 * H, W * 0.4, H); box(W * 0.5, 512 - 4 * H, W * 0.4, H);
    box(W * 0.3, 512 - 5 * H, W * 0.4, H); box(W * 0.1, 512 - 6 * H, W * 0.4, H); box(W * 0.5, 512 - 6 * H, W * 0.4, H);
    c.beginPath(); c.arc(W * 0.5, 512 - 6 * H, W * 0.4, Math.PI, 0); c.stroke();
    c.fillStyle = 'rgba(60,44,28,0.85)'; c.font = '700 34px Lora, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    [[0.5, 0.5], [0.5, 1.5], [0.5, 2.5], [0.3, 3.5], [0.7, 3.5], [0.5, 4.5], [0.3, 5.5], [0.7, 5.5]].forEach(([u, k], i) => c.fillText(String(i + 1), W * u, 512 - k * H));
    const hop = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 4.6), new THREE.MeshBasicMaterial({ map: Tex.tex(cv, { repeat: false }), transparent: true, depthWrite: false, name: 'hopscotch' }));
    hop.rotation.x = -Math.PI / 2; hop.position.set(SOCIAL.hop.x, 0.005, (SOCIAL.hop.z0 + SOCIAL.hop.z1) / 2); this.root.add(hop);
    // the ball thrown to you
    this.ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 2), new THREE.MeshStandardMaterial({ color: '#7a4a2e', roughness: 0.6, name: 'ball2' }));
    this.ball.castShadow = true; this.root.add(this.ball);
    // the lamplighter's lamp: a warm flame glow and a light
    const L = SOCIAL.lamp;
    this.glow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.38).multiplyScalar(3.5), toneMapped: false, transparent: true, opacity: 0, name: 'lampFlame' }));
    this.glow.position.set(L.x, 3.24, L.z); scene.add(this.glow);
    this.lampLight = new THREE.PointLight('#ffb060', 0, 12, 1.6); this.lampLight.position.set(L.x, 3.1, L.z); scene.add(this.lampLight);
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3();
  }

  update(t) {
    const R = SOCIAL.rope, K = this.kids.byId;
    // ---- the long rope
    const ropeOn = t >= R.t0 && t < R.t1;
    this.ropePivot.visible = ropeOn;
    if (ropeOn) {
      const a = K[R.turners[0]].handWorld(-1, this._v).clone(), b = K[R.turners[1]].handWorld(-1, this._w).clone();
      const mid = a.clone().add(b).multiplyScalar(0.5), span = a.distanceTo(b);
      this.ropePivot.position.copy(mid);
      this.ropePivot.rotation.set(0, Math.atan2(-(b.z - a.z), b.x - a.x), 0);
      this.ropePivot.rotateX(((t - R.t0) / R.period) * Math.PI * 2);
      this.rope.scale.set(span, Math.min(1.0, mid.y - 0.03), 1);
    }
    // ---- the ball: in your friend's hand, thrown, caught between your hands
    const B = SOCIAL.ball, kid = K[B.from];
    const ballOn = t >= 59.38 && t < B.drop;
    this.ball.visible = ballOn;
    if (ballOn) {
      if (t < B.release) { kid.handWorld(-1, this._v); this.ball.position.copy(this._v); }
      else if (t < B.catch) {
        const from = this.ball.userData.from || (this.ball.userData.from = (() => { kid.update(B.release); const v = kid.handWorld(-1, new THREE.Vector3()); kid.update(t); return v; })());
        const to = this.pov.handWorld(B.catch, 'catchReady', 1, this._v).add(this.pov.handWorld(B.catch, 'catchReady', -1, this._w)).multiplyScalar(0.5);
        to.add(new THREE.Vector3(0, 0, -0.06).applyQuaternion(this.pov.cam.quaternion));
        const u = (t - B.release) / (B.catch - B.release);
        this.ball.position.lerpVectors(from, to, u); this.ball.position.y += 1.4 * u * (1 - u);
      } else {
        const r = this.hands.right.g.getWorldPosition(this._v), l = this.hands.left.g.getWorldPosition(this._w);
        this.ball.position.copy(r).add(l).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.03, -0.09).applyQuaternion(this.hands.camera.quaternion));
      }
      this.ball.rotation.set(t * 9, t * 4, 0);
    }
    // ---- the lamplighter's flame, then every lamp in the street
    const L = SOCIAL.lamp, lit = MathX.smooth(t, L.lit, L.lit + 0.35);
    this.glow.material.opacity = lit * (0.85 + 0.15 * noise1(t * 6, 91));
    this.glow.visible = lit > 0.01;
    this.lampLight.intensity = lit * 3.2;
    const others = MathX.smooth(t, L.othersFrom, L.othersFrom + 1.2);
    this.town.m.lampGlass.emissive.setRGB(0.24 + 0.9 * Math.max(lit * 0.3, others), 0.19 + 0.62 * Math.max(lit * 0.3, others), 0.13 + 0.3 * Math.max(lit * 0.3, others));
    this.root.visible = t > 54 && t < 67.7;
  }
}
