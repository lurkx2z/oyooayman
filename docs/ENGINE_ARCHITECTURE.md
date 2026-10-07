# Engine architecture — technical map

> Every API below was checked against the source (Oct 2026). Paths are relative to the repo root. "Stable" means
> shipped in 5+ episodes without changes to its public behaviour. For the reuse/rewrite rules see `LOCKED_SYSTEMS.md`.

## 0. The big picture

```
<slug>.html  ── loads, in order:  lib/three.bundle.min.js → js/config.js → js/core/* → js/fx/* → js/camera/* → js/world/*
                                   → js/audio/audioEngine.js → js/ui/storyHud.js → js/ui/devControls.js
                                   → films/<slug>/script.js → films/<slug>/*.js → films/<slug>/film.js
                                   → films/<slug>/soundtrack.js → js/main.js   (main.js LAST: it boots)
```

- **Classic scripts, one global scope.** No modules, no bundler. Every top-level `const`/`class` in any loaded file is
  global. **Prefix every film-level global** with the film's tag (`FR_`, `SL`, `AM_`, `MN`, `XO`/`X`, `GM`, `AIR`/`AR`,
  `SX`/`sx`, `BS_`, `DP`) to avoid collisions.
- **The film supplies three globals:**
  - `SCRIPT` (data);
  - `SCRIPT_TRACKS` (Track objects built from `SCRIPT.tracks`);
  - `FILM` (hooks).
  `js/main.js` (`SceneManager`) owns everything else.
- **Every frame is a pure function of time:** `SIM.renderAt(t)`. No `dt` integration at render time. Simulations
  (friction slide, galaxy merger, marbles, air drag) run once at load into tables that are sampled by time.

### Frame pipeline (`js/main.js`)

```
renderAt(t):                      // t = FILM time (what the viewer sees)
  s = Edit.story(t)               // STORY time (= t unless CONFIG.edit cuts the take)
  cam.update(s)                   // CameraController: SCRIPT.camera tracks + bob/breath/sway/startles/shakes
  FILM.update(app, s, tl)         // pose every system for time s
  post.updateFromTimeline(s, tl)  // calls FILM.grade(s, post.params, tl)
  hud.update(s, camera, anchor)   // StoryHUD (or the film's own HUD object)
  [scene, camera] = FILM.view ? FILM.view(app, s) : [app.scene, app.camera]
  post.render(scene, camera)      // AO + bloom + grade + vignette + grain + fade/flash
```

`FILM.build(app)` runs once inside `SceneManager.init()`, **before** `PostProcessing` and `CameraController` exist.
It must set **`app.hud`** (an object with `update(t, camera, anchorFn)`, usually `new StoryHUD(root, app.tl)`) and
**`app.audio`** (an `AudioEngine` subclass). `app` gives you: `renderer`, `scene`, `camera` (already added to the scene,
so camera children render), `rng` (`RNG(CONFIG.seed)`), `tl` (Timeline), and later `cam`, `post`.

---

## 1. Core

### `js/config.js` — CONFIG · stable · films override values in their `script.js`
`CONFIG = { width 1080, height 1920, fps 30, duration, seed, camera:{cameraHeight, walkSpeed, runSpeed, bobStrength,
bobFrequency, breathingStrength, shakeStrength, fov}, render:{resolution, msaa, shadows, shadowMapSize, bloom, exposure},
startTime, startInRecordingMode, captureMode, captureWidth, captureHeight }`, plus optional `CONFIG.edit` and extra
camera keys (`runStrideGain`, `breathRate`).
URL params: `?t=8.4` start time · `?record` recording mode · `?res=1` exact 1080×1920 internal render ·
`?capture&w=&h=` headless capture mode (used by the tools).
```js
// films/slip/script.js
CONFIG.duration = 67.4;
CONFIG.seed = 20261207;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.4, bobStrength: 0.022, bobFrequency: 1.7,
  runStrideGain: 0.55, breathingStrength: 0.004, breathRate: 15, fov: 68, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;
```

### `js/core/rng.js` — RNG, hash1/hash2, noise1/fbm1, MathX · stable · don't modify
- `new RNG(seed)` (mulberry32): `next() range(a,b) int(a,b) pick(arr) chance(p) sign() gauss() fork(salt)`.
- `hash1(n)`, `hash2(a,b)`: **stateless** [0,1). Use them for anything evaluated at arbitrary t (particles,
  per-instance variation), so scrubbing is safe.
- `noise1(x, seed)` [-1,1], `fbm1(x, seed, oct)`.
- `MathX`: `clamp lerp ramp smooth window(v,a,b,fi,fo) deg impulse(t,t0,decay) angleLerp`.
```js
// deterministic seeded event: a particle born in slot i, re-evaluated at any t
const born = t0 + hash1(i * 7 + 3) * 0.4, life = 1.2 + hash1(i * 7 + 4) * 0.8;
const age = t - born; if (age < 0 || age > life) return;   // pure function of t
```

### `js/core/timeline.js` — Ease, Track, SmoothTrack, Edit, Timeline · stable · don't modify
- `new Track(keys, defaultEase='inOutSine')`: keys `[[t, value, easeName?], …]`. **The ease applies to the segment
  that ENDS at that key.** `'step'` = a cut (jump at that key). `.value(t)`.
- `new SmoothTrack(keys)`: non-uniform Catmull-Rom (smooth camera/aircraft paths). `.value(t)`.
- `Timeline(duration, events)`: events `{id, time, label}` → dev-bar markers and `[`/`]` jumps; `at(id)`, `since`, `passed`.
- **`Edit`** — the optional cut of one continuous take. `CONFIG.edit = [[from, to, speed=1], …]` lists the **story**
  intervals kept, in order; `speed < 1` = slow motion.
  - `Edit.duration()` is the film length.
  - `Edit.story(t)` maps film → story; `Edit.film(s)` maps story → film.
  - `Edit.spliceAudio(buf)` cuts the soundtrack the same way (25 ms crossfades; slow segments resampled, so they drop
    in pitch).
  - **Everything in a film is authored on STORY time.** Only the final video and the dev bar use film time.
```js
CONFIG.edit = [[1.29, 3.3], [3.3, 3.62, 0.5], [3.62, 4.25], [4.75, 10.4], /* … */ [46.2, 67.4]];   // slip: 66.6 s story → 57.3 s film
```

### `js/core/textures.js` — Tex · stable
Canvas texture generators: `Tex.canvas(w,h)`, `Tex.tex(canvas,{srgb,repeat})`, `noise`, `blotches`, `asphalt(seed)`,
`sidewalk(seed)`, `concrete(seed, base)`, `facade(style, seed)`, `storefront(shop, seed)`, `hoarding`, `lattice`,
`ledSign(text)`, `label(lines, opts)`, `adPanel`, `billboard`, `softDot`. `Tex.maxAniso` is capped at 2 (softer
textures with distance = the older-game look).

### `js/core/geo.js` — Geo, Batcher, Mat · stable
- `Geo.matrix(x,y,z, rx,ry,rz, sx,sy,sz)` (Euler **YXZ**), `Geo.quad(a,b,c,d,…)` (corners BL,BR,TR,TL as seen from the
  front; wrong order = invisible back face), `Geo.boxSides`, `Geo.flat`, `Geo.prep`.
- `new Batcher()`: `add(geo, material, matrix, {noShadow, noReceive, color})`, `box(w,h,d,x,y,z,mat,ry)`,
  `build(parent, name)`. Merges static scenery into one mesh per material (few draw calls).
- `Mat.std(color, opts)`: a cached `MeshStandardMaterial` (roughness 0.8 default).

---

## 2. Camera and body

### `js/camera/cameraController.js` — CameraController · **LOCKED** · configure through SCRIPT.camera / CONFIG.camera
The viewer's head. Keyframed path plus procedural layers, all pure functions of t.

| `SCRIPT.camera` key | Meaning |
|---|---|
| `x`, `z`, `yaw`, `pitch`, `fov` | **required** Track keys (degrees for angles; yaw 0 faces −Z, positive yaw turns left) |
| `height` | eye height above `baseY` (default `cameraHeight`) |
| `baseY` | ground under the feet (default `LAYOUT.curbH` if `LAYOUT` exists, else 0) |
| `tilt` | roll track in degrees |
| `sag`, `roll` | late-hypoxia knee sag and head roll |
| `startles: [[t, strength]]` | a quick dip + flinch |
| `shakes: [[t, amp, decay]]` | a decaying impulse of noise shake (not a sustained tremor) |
| `spasms: [t…]` | breath-hold diaphragm jolts |

- Optional `SCRIPT_TRACKS`:
  - `pov`: 0 = a cinematic camera with no body motion (cuts to drone or space shots);
  - `hypoxia`, `breathHold`, `breathRate`.
- Bob comes from the actual distance walked (precomputed). Steps per metre fall with speed via `runStrideGain`.
  Breathing is an integrated phase so its rate can change smoothly.
- Conventions: heading = (−sin yaw, −cos yaw); right = (cos yaw, −sin yaw); horizontal FOV = 2·atan(tan(vfov/2)·9/16).
  A vertical 64° gives ≈ 39° horizontal.

### `js/camera/viewerHands.js` — ViewerHands, HAND_POSES, smoothLoft · **LOCKED** (add poses per film; don't remodel)
- `new ViewerHands(camera, { scale, skin, nail, sleeve, cuff, watch, sleeveLen, sleeveFit, poses, blends, script })`.
  It attaches to the camera.
- **Pose** = `{ p:[x,y,z] wrist in camera space (right hand; mirrored for the left), F: finger direction, N: palm
  normal, curl:[index,middle,ring,little], thumb:[spread,curl], trem? }`. Built-in poses: `hidden ear reach look brace`.
- Script: `SCRIPT.hands = { right: [[t,'pose'],…], left: [[t,'pose'],…] }`. Blends with `blends[pose]` seconds.
  Convention: `'name!'` aliases with a 0.02 s blend for snaps at cuts.
- **Aimed poses:** a pose with `aim` is re-solved every frame in `FILM.update` so a palm point lands on a world point
  (`frAimHand` in films/friction/film.js, `slAimHand` in films/slip/film.js, `amAimHand`, `mnAimHand`; copy the pattern).
- Props: parent them to `hands.right.g` / `hands.left.g`. A fist holds along the thumb axis X = F × N.
- Visible only when `pov > 0.5` and the wrist is above −0.58 m (camera space).
```js
// films/friction/film.js (build)
app.hands = new ViewerHands(app.camera, { scale: 1.08, sleeve: '#3d5a7a', sleeveLen: 1.1, sleeveFit: 0.78,
  poses: FR_HAND_POSES, blends: FR_HAND_BLEND });
// films/friction/script.js
hands: { right: [[0, 'hidden'], [1.5, 'flailR'], [3.25, 'reachR'], [3.56, 'gripR!'], /* … */], left: [/* … */] },
```

### Legs (per film, not shared)
`FrLegs` (films/friction/film.js) and `SlLegs` (films/slip/body.js): jeans/trainers posed by time, visible only when the
camera looks down. Copy one into your film if you need legs.

---

## 3. Rendering

### `js/fx/postprocessing.js` — PostProcessing · **LOCKED** · drive it through `FILM.grade(t, p)`
- Chain: MSAA HalfFloat scene target with a DepthTexture → half-res SAO-style AO (+ bilateral blur, faded with fog
  distance) → half/quarter/eighth blur pyramid (bloom, edge blur) → composite (ACES, sRGB, saturation with warm-pixel
  protection, contrast, warmth, black lift, rounded vignette, tunnel vision, edge blur, chroma, grain, uneven exposure,
  smear, fade to black, flash to `flashColor`). NaN/Inf firefly clamp in the downsample.
- `p` (params) you may set every frame: `exposure bloom bloomThreshold saturation contrast warmth vignette soft
  blackLift keepWarm tunnel tunnelSoft tunnelDark edgeBlur chroma grain uneven fade flash flashColor(Color) ao
  smear(Vector2)`.
- **Set every param you rely on at the top of `grade()` each frame.** The params object persists between frames, so a
  value set once stays set. Real presets: see `STYLE_BIBLE.md` § 8.
```js
grade(t, p) {
  p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.45; p.exposure = 1.12; p.saturation = 0.86; p.contrast = 1.12;
  p.vignette = 0.42; p.bloom = 0.32; p.bloomThreshold = 0.85; p.grain = 0.035;
  p.flash = 0.7 * MathX.impulse(t, SL.quake, 0.18);           // a 2–3 frame white hit
  if (t >= SL.black) p.fade = 1;                               // cut to black
},
```

### `js/fx/fog.js` — installFog · **LOCKED**
- `installFog({ bankScale=0.011, bankAmount=0.56, lowHeight=4.5, lowAmount=0.75, cap=0.9 })` patches three's fog
  ShaderChunks globally:
  - plain exponential fog;
  - world-space slow banks;
  - ground haze;
  - capped cover.
- It runs once per page. **The first call wins**, and `js/world/environment.js` calls it with defaults when it loads.
- Then set `scene.fog = new THREE.FogExp2(color, density)`. The density is used *linearly* by the patched chunk.
- A custom `ShaderMaterial` gets fog only with `fog: true` plus the fog chunks (see `XBill`). Three overwrites
  `fogDensity` every frame, so to scale fog per material inject your own uniform multiplier into the shader text
  (Slip's `slThinFog`).

### `js/fx/look.js` — Look · stable
`Look.apply(scene, camera)` after the world is built: `Look.surface(mat, vehicle)` (selective gloss) + `Look.grime(mat,
strength)` (world-space dirt via onBeforeCompile). It skips `person:*` objects, camera children, and materials that
already have their own `onBeforeCompile`. Name glass materials `…glass…` and vehicle roots `veh:…` so the rules find them.

### `js/fx/mirror.js` — Mirror · stable
`new Mirror(width, height, { resolution=640, tint, see=[0,1], clipBias, smudge, clip=false })`. It has `.mesh` and
`.material`. Call `mirror.render(renderer, scene, camera)` once per frame **before** the main pass.
- Layers: 1 = seen only in reflections (your body in a mirror); 2 = never reflected (first-person hands).
- Nothing may stand behind the glass. Keep clipping off unless needed; an oblique near plane gave half-black renders.
- Used for the bathroom mirror (Depersonalization), flood water (Moon) and wet streets (Slip). **Feedback-loop fix:**
  during the mirror pass, swap any material sampling the mirror's texture to a dummy 1×1 target (Slip `street.js`).

### `js/fx/particles.js` — BillboardSystem, StreakSystem, FlameSystem, BirdFlock (+ oxygen-only ParticleSystem)
- `new BillboardSystem(scene, max=600, additive=false)`: per frame `begin(fog)`, `push(x,y,z,size,rot,alpha,shade,r,g,b)`
  …, `end()`. Soft dots that fade with fog. **Stable.**
- `new StreakSystem(scene, max)`: `begin()`, `push(ax,ay,az,bx,by,bz,r,g,b,a,w)`, `end()` (sparks, rain streaks).
- `FlameSystem` (`add(pos,w,h,seed)`, `update(t, level, camera)`) and `BirdFlock` are oxygen-flavoured but reusable.
- `ParticleSystem` is **Oxygen-specific** (its sparks, grill smoke, impact, phones). Don't build on it.

### `films/xover/fx.js` — XBill, XRibbon, xBolt, XSpark, XDebris, XSPR, XCOL · stable-in-practice · **lives in a film folder** (Slip loads it too)
- `new XBill(scene, { n, kind:'soft'|'flash'|'glow', color, additive, seed, spawn(i, rng) → {p, v, t0, life, s0, s1,
  rot, a}, g, drag, fadeIn, fadeOut, alpha, loop?, order })`, then `update(t)` (`t <= -1e8` hides it). Instanced
  camera-facing billboards with fog: smoke, steam, dust, flashes, mist.
- `new XRibbon(scene, maxPts, color)`: `begin(cam)`, `seg(p,q,w,a)`, `poly(pts,w,a,taper)`, `end()`. Camera-facing
  ribbons (lightning, tracers, arcs). Needs DoubleSide (already set).
- `xBolt(a, b, seed, jag, branches)` → branching point lists. `XSpark` (`crawl`, `arc`, `streak`). `XDebris`.
- If you need these, load `films/xover/fx.js` read-only, as Slip does. Don't edit it (two films depend on it).
  Promoting it to `js/fx/` is a good future engine change (see `LOCKED_SYSTEMS.md`).

---

## 4. World

### `js/world/environment.js` — Environment (the overcast oxygen city) · stable base class · subclass it, don't edit it
- `new Environment(scene, renderer, rng)`, then `build()`, which runs `_materials _sky _lights _ground _markings
  _buildings _skyline _trees _streetFurniture _signals _billboard _construction _cart _roadWorks _cafe _hazeCards`,
  batches everything, then `_environmentMap`.
- Reads the **global `LAYOUT`** (`js/world/layout.js` for Oxygen). A film that subclasses Environment defines its own
  `LAYOUT` constant and does **not** load layout.js (Friction, Sim, Air, Slip all do this).
- `update(t, tl)` and `gridPower` are **tied to the Oxygen script** (SCRIPT_TRACKS, events). **Every subclass must
  override `update`.**
- Subclasses override the pieces they change:
  - `FrictionCity`: `_sky` (sunny), `_lights`, `_ground` (hill), `_buildings`;
  - `SimCity`, `AirCity`: sunny, wind materials;
  - `SlStreet`: rainy, wet reflections.
  Set `env.camera = app.camera` before `build()` (haze cards need it).
- Builders worth reusing via subclass: `_building`, `_dress` (facade dressing), `_tree`, `_streetLight`, `_bench`,
  `_busShelter`, `_signals`.

### `js/world/people.js` — Person, PersonGeo, LOOKS, BUILDS, ACTIONS, BLEND, perf, BlobShadows, PedestrianSystem · **LOCKED rig** · add LOOKS/ACTIONS per film
- `new Person(spec, scene)`:
  - spec `{ id, look, path:[[t,x,z],…], states:[[t,'action'],…], face (deg), faceUntil, y, seat, stride }`;
  - per frame `update(t)`.
  - `worldOf(part, out)` and `handWorld(side, out)` give world positions.
- **Facing convention:** `face` θ means facing direction (−sin θ, −cos θ); `root.rotation.y = π + θ`.
  - Gotcha: if `spec.face` is set, walkers face it while walking too. Use `faceUntil` or omit `face` for walkers.
- Looks: `LOOKS.vendor worker rider casual1…casual8` (skin index, build, shirt, sleeves, pants, shoes, sole, hair,
  hairStyle, hat, jacket, coat, collar, hood, scarf, backpack, shoulderBag, vest, apron, gloves).
  Builds: `avg broad slim`. Add film looks with `Object.assign(LOOKS, {...})`.
- Actions are pure functions `(τ, ctx) → pose`: `idle walk jog grill phone grind lowerTool recoil look handHead stumble
  lean kneel sit sitSlump sitGround lie earPop earPopSit flinch lighter collapse railSlump ride`. Films add their own
  (`lookUp pointUp phoneUp handMouth hugSelf brace walkUmb…`, friction's `slipBack windmill splits…`) with
  `Object.assign(ACTIONS, …)` and `BLEND` entries.
- `perf(id, look, scenes, extra)` builds one performance from scenes `[t0, t1, {path|at, act|states, face, y, seat, stride}]`
  (teleports between scenes). The Before Screens `Child`/`ChildrenSystem` (films/before-screens/children.js) extends
  Person with per-scene visibility and strides; Depersonalization loads that file too.
- `new BlobShadows(scene, max)`: `begin()`, `push(x,y,z,sx,opacity,sz,rotY)`, `end()`. Soft contact shadows under
  people and props (pair them with AO).
```js
// films/slip/cast.js style
const p = new Person({ id: 'P1', look: 'casual6', path: [[0, 4.2, -350], [6, 4.2, -356]], states: [[0, 'walk'], [6, 'lookUp']] }, scene);
p.update(t);
```

### `js/world/vehicles.js` + `js/world/kinematics.js` — VehicleFactory, Vehicle, TrafficSystem, Kinematics · stable
- `new VehicleFactory().build(type, color, opts)`:
  - types `sedan hatch suv pickup van ev taxi bus moto`;
  - returns `{ group, body, wheels[], tail, hazard, exhaust }`;
  - local frame: forward +X, up +Y, right +Z; origin at ground centre.
  - To face yaw: `group.rotation.y = yaw + π/2`. Wheels: `rotation.z = −dist / r`.
- `TrafficSystem` + `Kinematics` are the Oxygen traffic: you say where a car should **stop** (`stopS`, `decel`) and it
  solves backwards. Includes `checkTraffic` (OBB overlap warnings in the console). New films usually drive cars from
  their own tables (Friction from its slide sim, Air from its drag tables, Slip from tracks).

### `js/world/heroes.js` — HeroFace, HeroHand, HeroActor, HeroKeys, ScreenGeo · stable (Game, Crossover)
Close-up characters: eyes (iris texture) that aim at a target or the lens, lids/blinks, brows, lips with `talkAt`,
five-finger hands with poses, two-bone basis IK (`_reach`, `place(side, kind, P, F, N)`), a neck-cone clamp for head
aiming, `ScreenGeo` for placing hands on screen-pixel points (fake touch). The Game film still uses its own copy in
films/game/npc.js.

### `js/world/earth.js` — EarthScene · stable · subclass for new uses
Its own `scene` + `camera`:
- procedural continents (polygons on canvas);
- fractal cloud cover (wind belts, storm spirals; the spiral twist now fades at its edge, fixed for Slip);
- ocean glint, atmosphere limb, night lights gated by `uLights`, stars.

`update(t)` reads `SCRIPT.earth.from` and `SCRIPT_TRACKS.earthLights` (Oxygen). **Override `update`** (Slip's
`SlEarth`). Show it via `FILM.view` returning `[earth.scene, earth.camera]`. `EarthScene.dirFromLonLat(lon, lat)`.

### `js/world/aircraft.js` — AircraftSystem (Oxygen airliner) · stable
A spline path from `SCRIPT.aircraft` with bank, gear and strobes; `position(t)`, `update(t)`.

---

## 5. HUD and controls

### `js/ui/storyHud.js` — StoryHUD · **LOCKED** · style per page with CSS
`new StoryHUD(rootEl, tl)` reads `SCRIPT.hud`; `update(t)`. All pure functions of t.

| `SCRIPT.hud` key | Shape | Renders |
|---|---|---|
| `title` | `{ in, out, html, cls, fi, fo }` | `.story-title` (+ `cls`, e.g. `'big center'`). HTML can use `<span class="kick">` / `<span class="hero">` |
| `captions` | `[{ t, until, text }]` | one at a time, `.story-caption` |
| `readouts` | `[{ from, until, top, label, value, unit, sub, ctx }]` | top-left `.story-readout`; `value`, `sub` and `ctx` may be **functions of t** |
| `stack` | `[{ t, until, lines: [[t, text]] }]` | lines appearing one by one (Slip's recap) |
| `notes` | `[{ t, until, text }]` | small quiet line (health / satire note) |
| `says` | `[{ t, until, text }]` | dialogue subtitle (`.story-say`) |
| `endLine` | `{ t, until, text }` | closing line |

`StoryHUD.win(t, a, b, fi, fo)` is the shared fade-window helper. Films add one-off HTML elements in `build()` (Slip's
rotation readout `.sl-rot`, the end card `.sl-card`; Friction's `.fr-chyron` and `.fr-count`) and drive their opacity
in `update`.
```js
// films/friction/script.js (verbatim excerpt)
hud: {
  title: { in: 0.1, out: 3.25, fi: 0.22, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF FRICTION</span><span class="hero">DISAPPEARED</span><span class="kick">FOR 60 SECONDS?</span>' },
  captions: [
    { t: 4.4, until: 6.6, text: 'You couldn’t even take a normal step.' },
    { t: 11.8, until: 14.0, text: 'Brakes and steering depend on friction too.' },
  ],
  readouts: [
    { from: 0.0, until: 7.4, top: 220, label: 'SURFACE FRICTION', value: frFrictionText, sub: (t) => (t >= FR.tLoss ? 'SOLID SURFACES ONLY' : ''), ctx: frBackIn },
    { from: 9.9, until: 11.7, top: 220, label: 'RED CAR · BRAKES ON', value: (t) => `${frSpeed('B1', t)} km/h`, sub: 'BRAKE PADS CAN’T GRIP EITHER', ctx: frBackIn },
  ],
},
```

### `js/ui/hud.js` — HUD (Oxygen only) · frozen
The first film's bespoke HUD (`#o2Readout`, timer, breath counter, ending). New films use StoryHUD.

### `js/ui/devControls.js` — DevControls · **LOCKED**
- Keys:
  - Space: play/pause; R: restart; D: debug panel (FILM.debug text, draw calls, camera); F: fullscreen; M: mute;
  - **H: Recording Mode** (hides the dev UI, rewinds to 0); Esc leaves it;
  - ←/→: step a frame (Shift: 1 s); [ / ]: previous / next event.
- The bottom bar has a scrub slider with event ticks, time + frame, FPS, and **⤓ WAV** (exports the synced soundtrack).
- Every page must contain the standard `#dev`, `#debug`, `#startOverlay`, `#soundStatus`, `#loading`, `#errorBox`
  markup (copy it from any page or the template).

---

## 6. Audio

### `js/audio/audioEngine.js` — AudioEngine, SoundKit · **LOCKED** (editing it invalidates EVERY film's baked soundtrack)
- A film subclasses `AudioEngine` and implements `_build(ctx)`. `ctx` is an `OfflineAudioContext` for the whole film
  (story length + 1.5 s): schedule every cue at **absolute story times**.
- `renderOffline()` → `declick` → `Edit.spliceAudio`. `prepare()` uses the baked copy (`window.FILM_SOUNDTRACK`) if its
  fingerprint matches, else renders live (can take minutes).
- `fingerprint()` hashes `CONFIG.duration/seed`, `JSON.stringify(SCRIPT)`, `CONFIG.edit`, `fingerprintData()` (override
  to include your film's non-SCRIPT data: sims, curves) and **the source of the film's audio class, AudioEngine and
  SoundKit**.
- Spatial helpers: the listener follows `SCRIPT.camera` x/z/yaw. `_spatial(posFn, t0, t1, step, ref)` +
  `_applySpatial(pts, gain, pan, freqParams…)` give distance, pan and Doppler.
- `SoundKit(ctx, seed)` building blocks: `noise filter env panned reverb crackleBuffer chirp flap step horn backfire
  hiss whump tick boom thump clunk click pop ring crunch alarm breath heart tone gasp pluck voice laugh chatter farBoom`.
- **Offline-render gotchas** (all hit in production):
  - Chrome's offline renderer emits single full-scale samples when exponential ramps shorter than one 128-sample block
    land mid-block. Fixes: per-film overrides of `S.env` (linear attack, `setTargetAtTime` decay), `S.tone` with a 6 ms
    minimum attack, `S.breath` linear; plus `AudioEngine.declick(buf, thr)` (0.3 default; 0.15 finer pass in some films).
  - Noise sources must start after their gain envelope starts (a 5.84 s spike in Before Screens).
- Mix chain used by films: a `mixIn` gain (≈ 2–5.6) → DynamicsCompressor → `out` → limiter (≈ −2.5 dB, ratio 20).
  Target loudness ≈ −16 to −17 LUFS.
- `js/audio/audioManager.js` is Oxygen's AudioManager (an AudioEngine subclass). It's a good example of a full film score.
```js
// simplified from films/slip/audio.js
class SlAudio extends AudioEngine {
  fingerprintData() { return [SL, SL_WAVE, SL_DRAIN, 3]; }       // anything the sound depends on that isn't in SCRIPT
  _build(ctx) {
    const S = new SoundKit(ctx, 77);
    const out = ctx.createGain(); out.connect(ctx.destination);
    S.boom(SL.thud, 0.8, out);                                      // cues at absolute story times
  }
}
```

---

## 7. Tools (`tools/`, Node + Playwright + ffmpeg; run with `NODE_PATH=$(npm root -g)`)

| Tool | Use |
|---|---|
| `stills.cjs` | single frames for look-dev and review (`--page --t --story --w --h --eval --nohud`) |
| `contact-sheet.sh` | tile stills into one labelled image (reviewer input) |
| `check-page.cjs` | boot test: errors + whether the baked sound is current |
| `render-parallel.sh` / `render-frames.cjs` | the final frame render (N workers, resumable) |
| `render-wav.cjs` | the soundtrack WAV from the current code |
| `encode-final.sh` | two-pass H.264/AAC MP4 under a byte budget + a check strip |
| `bake-soundtrack.cjs` | writes `films/<slug>/soundtrack.js` (MP3 in JS, fingerprinted) |
| `render-preview.cjs` | older single-process renderer (PNG + mux in one go); fine for short tests |
| `new-episode.sh` | copies `templates/episode/` into `films/<slug>/` + `<slug>.html` |

Details and exact commands: `PRODUCTION_WORKFLOW.md`.

---

## 8. Where each "suggested system" from the briefs actually lives

| Brief name | Real implementation |
|---|---|
| SceneManager / Renderer | `js/main.js` SceneManager |
| Timeline / EventManager | `js/core/timeline.js` (Track, Timeline, Edit) + `SCRIPT.events` |
| CameraController | `js/camera/cameraController.js` |
| HUD / Caption system | `js/ui/storyHud.js` (+ page CSS) |
| AudioManager | `js/audio/audioEngine.js` subclass per film (`films/<slug>/audio.js`) |
| Vehicle / Traffic system | `js/world/vehicles.js`, `js/world/kinematics.js` |
| NPC / Pedestrian system | `js/world/people.js` (+ `films/before-screens/children.js` for scene-based casts) |
| Particle system | `js/fx/particles.js` (BillboardSystem, StreakSystem), `films/xover/fx.js` (XBill, XRibbon…) |
| Post-processing | `js/fx/postprocessing.js` |
| Weather / atmosphere | `js/fx/fog.js` + per-film sky shaders; rain: `films/slip/street.js` (instanced streaks) |
| Water | `films/moon/water.js` (flood surface, bores, mirror), `films/slip/sea.js` (analytic seabed in JS + GLSL, depth-coloured sea, 146 m wave) |
| Physics helpers | per film: `films/friction/slide.js` (2D OBB/circle impulse sim, 240 Hz), `films/air/physics.js` (drag tables), `films/andromeda/merger.js` (restricted N-body), `films/before-screens/pocket.js` (marbles) |
| Destruction | per film: Friction (rollovers, lamp posts), Moon `fx.js` (cracks, glass, collapse), Slip `street.js` (window burst, shards, cornice chunks), Crossover `action.js`/`tank.js` |
| Recording / debug controls | `js/ui/devControls.js` (H = Recording Mode, D = debug) |
