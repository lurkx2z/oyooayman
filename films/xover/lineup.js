/* a lineup of the cast and the tank, for checking the assets (?lineup) */
CONFIG.duration = 6; CONFIG.seed = 1;
Object.assign(CONFIG.camera, { cameraHeight: 1.6, fov: 50 });
const SCRIPT = { meta: { title: 'lineup' }, events: [], camera: { baseY: 0, x: [[0, 0]], z: [[0, 14]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] }, tracks: { pov: [[0, 0]] }, hands: { left: [[0, 'hidden']], right: [[0, 'hidden']] }, hud: { captions: [], readouts: [], says: [], notes: [] }, people: [] };
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
installFog();
const FILM = {
  build(app) {
    const { scene, camera } = app; FILM._app = app; camera.near = 0.05; camera.far = 600; camera.updateProjectionMatrix();
    scene.background = new THREE.Color('#9a9488'); scene.fog = new THREE.FogExp2('#9a9488', 0.004);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), Mat.std('#5a4c3a', { roughness: 0.95 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    scene.add(new THREE.HemisphereLight('#c8c4bc', '#3a3026', 0.8));
    const sun = new THREE.DirectionalLight('#fff0dc', 2.2); sun.position.set(-20, 30, 25); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -5, near: 1, far: 120 }); scene.add(sun);
    app.titan = new XTitan(scene); app.titan.root.position.set(-1, 0, -14);
    app.killua = new XKillua(scene); app.eren = new XEren(scene); app.sol = new XSoldier(scene, 's1'); app.tank = new XTank(scene);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new AudioEngine(app.tl);
  },
  update(app, t) {
    const cam = app.camera, mode = URLP.get('lineup') || 'all';
    const T = app.titan; T.apply(ACTIONS[URLP.get('pose') || 'tStand'](t, { seed: 0.3, seedI: 3, walkPhase: t * 3 }), +(URLP.get('jaw') || 0)); T.root.rotation.y = +(URLP.get('ty') || 0);
    const pp = (A, x, z, yaw, act) => { A.p.root.position.set(x, 0, z); A.p.root.rotation.set(0, yaw, 0); A.p.apply(ACTIONS[act](t, { seed: A.p.seed, seedI: A.p.seedI, walkPhase: t * 4 })); A.p.root.updateMatrixWorld(true); };
    pp(app.killua, -1.0, 2, 0.15, 'idle'); app.killua.face.aimEyes(cam.position); app.killua.face.set({});
    pp(app.eren, 0.2, 2, -0.1, 'idle'); app.eren.face.aimEyes(cam.position); app.eren.face.set({});
    app.sol.keys = new HeroKeys([[0, 1.4, 2]], [[0, -0.3]], [[0, 'xAim']]); app.sol.update(t, null, 'aim');
    app.tank.set({ x: 5.5, z: -3, yaw: -0.6, dist: t * 2, turret: 0.4, elev: 0.05, hatch: 1, commander: true });
    if (mode === 'face') { const h = app.eren.j.head.getWorldPosition(new THREE.Vector3()); cam.position.set(h.x, h.y, h.z + 0.9); cam.lookAt(h.x, h.y - 0.05, h.z); cam.fov = 24; }
    else if (mode === 'kface') { const h = app.killua.j.head.getWorldPosition(new THREE.Vector3()); cam.position.set(h.x, h.y, h.z + 0.9); cam.lookAt(h.x, h.y - 0.05, h.z); cam.fov = 24; }
    else if (mode === 'titan') { cam.position.set(4, 2, 18); cam.lookAt(-1, 8, -14); cam.fov = 50; }
    else if (mode === 'thead') { cam.position.set(-1, 13, 0); cam.lookAt(-1, 13.2, -14); cam.fov = 22; }
    else { cam.position.set(0, 3.5, 16); cam.lookAt(0, 5, -4); cam.fov = 55; }
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  },
  view(app) { return [app.scene, app.camera]; },
  grade(t, p) { p.exposure = 1.0; p.vignette = 0.4; p.saturation = 1.0; },
};
