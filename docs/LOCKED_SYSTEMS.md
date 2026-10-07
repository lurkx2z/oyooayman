# Locked systems — reuse, don't rewrite

> These systems shipped across many episodes and define the channel's look and workflow. A new episode **configures
> and extends** them from its own folder. Rewriting one costs days and usually reintroduces bugs that were already fixed.
> If you believe a change is genuinely required, follow § "Changing a locked system" at the bottom.

Status legend:
- **LOCKED** — don't modify in an episode branch; extend from the film.
- **STABLE** — modify only additively, with defaults unchanged.
- **FROZEN** — one-film legacy; leave it alone, don't build on it.

---

**SYSTEM:** SceneManager / main loop
**STATUS:** LOCKED · **LOCATION:** `js/main.js`
**DO:** implement `FILM.build / update / view / grade / debug` in `films/<slug>/film.js`; set `app.hud` and `app.audio` in `build`.
**DO NOT:** fork main.js per film, add per-film branches inside it, or change the update order.
**WHY:** the order (camera → FILM.update → grade → HUD → view → post) and the capture hooks (`SIM.captureFrame`,
`SIM.audioWavBase64`, `window.SIM_READY`) are what every tool and every page relies on.

**SYSTEM:** POV camera
**STATUS:** LOCKED · **LOCATION:** `js/camera/cameraController.js`
**DO:** author `SCRIPT.camera` tracks (x, z, height, yaw, pitch, fov, tilt, startles, shakes) and tune
`CONFIG.camera` (cameraHeight, bobStrength, bobFrequency, breathingStrength, breathRate, runStrideGain, fov) per film.
Use `SCRIPT_TRACKS.pov = 0` for cinematic shots, or override the camera after `cam.update` in `FILM.update`
(Friction drone shots, Slip underground orbit, Crossover shot cameras).
**DO NOT:** create POVCameraV2, add per-film constants inside the controller, or add continuous shake.
**WHY:** its restrained bob/breath/sway is the "human, not robotic, not handheld-horror" feel the owner approved. Every
film since Oxygen uses it unchanged.

**SYSTEM:** First-person arms
**STATUS:** LOCKED · **LOCATION:** `js/camera/viewerHands.js`
**DO:** pass film poses/blends/colours (`new ViewerHands(camera, { poses, blends, sleeve, scale, … })`); write aimed
poses in your film.js (copy `frAimHand` / `slAimHand`); parent props to `hands.right.g`.
**DO NOT:** remodel the hand, add a second hand system, or bring back primitive mitten hands.
**WHY:** this authored arm replaced the rejected blocky hand. *"A bad first-person hand is worse than no hand."*
The sleeve options (`sleeveLen`, `sleeveFit`) were added additively for Friction; that is the model for changes.

**SYSTEM:** StoryHUD (title, captions, readouts, stack, notes, says)
**STATUS:** LOCKED · **LOCATION:** `js/ui/storyHud.js` + classes in `style.css`
**DO:** fill `SCRIPT.hud`; restyle per page in the page's `<style>` (`#hud .story-title.big.center { … }`); add one-off
elements (end cards, special readouts) from your film's `build`/`update`.
**DO NOT:** edit `style.css` story classes for one film (it changes every other film), or write a new HUD framework.
**WHY:** the centred serif title / top-left label-value / one-caption-at-a-time hierarchy *is* the channel's typography.

**SYSTEM:** Post-processing (AO, bloom, ACES, grade, vignette, grain, fades, flash, smear)
**STATUS:** LOCKED · **LOCATION:** `js/fx/postprocessing.js`
**DO:** set params in `FILM.grade(t, p)` every frame (reset everything you use at the top).
**DO NOT:** add a second post chain, EffectComposer, or heavy effects (chromatic aberration, VHS, scanlines, big bloom).
**WHY:** the look was calibrated over four art-direction passes and measured against the references.

**SYSTEM:** Fog
**STATUS:** LOCKED · **LOCATION:** `js/fx/fog.js`
**DO:** call `installFog({...})` (before environment.js loads, if you need non-default banks) and set `scene.fog`
density/colour per scene.
**DO NOT:** switch back to squared FogExp2, add more density to "fix" a weak image, or make fog white.
**WHY:** uneven, capped, plain-exponential fog keeps far silhouettes. *"Fog helped but could not hide bad assets."*

**SYSTEM:** Timeline / Track / Edit / RNG / hashes
**STATUS:** LOCKED · **LOCATION:** `js/core/timeline.js`, `js/core/rng.js`
**DO:** keep everything a pure function of time; use `hash1`/`hash2` for per-instance randomness; cut with `CONFIG.edit`.
**DO NOT:** introduce `Math.random()`, wall-clock time, or frame-to-frame integration at render time.
**WHY:** determinism makes scrubbing, identical takes, parallel frame rendering and baked audio possible.

**SYSTEM:** AudioEngine + SoundKit + baked soundtracks
**STATUS:** LOCKED · **LOCATION:** `js/audio/audioEngine.js`, `tools/bake-soundtrack.cjs`
**DO:** subclass in `films/<slug>/audio.js`; override `fingerprintData()`; put offline-safe `env`/`tone` overrides in your
subclass; bake with the tool.
**DO NOT:** edit `audioEngine.js` / `SoundKit` in an episode branch.
**WHY:** the baked-soundtrack fingerprint includes the AudioEngine and SoundKit **source code**. Any edit makes every
film's baked soundtrack stale; every page then falls back to a multi-minute live render until each film is re-baked.

**SYSTEM:** People rig
**STATUS:** LOCKED (rig) / extend · **LOCATION:** `js/world/people.js`
**DO:** add `LOOKS`, `ACTIONS`, `BLEND` entries from your film (`Object.assign(ACTIONS, {...})`); use `perf()` for
scene-based casts; stagger reactions.
**DO NOT:** rebuild a character system from capsules, or change the joint layout (Titan, children and soldiers are
built on it).
**WHY:** "authored low-poly silhouettes" took a dedicated pass (V4) and is reused by every film.

**SYSTEM:** Environment (city builder)
**STATUS:** STABLE base class · **LOCATION:** `js/world/environment.js` (+ `js/world/layout.js`)
**DO:** subclass it (`class MyCity extends Environment`), define your own `LAYOUT`, override `_sky`, `_lights`,
`_buildings`, `update` … as Friction, Sim, Air and Slip do.
**DO NOT:** edit it for your film (Oxygen depends on its exact output), or start a new city from scratch when a
subclass works.
**WHY:** facades with dressing, shops, trees, lamps, signals and grime are already art-directed.

**SYSTEM:** Vehicles
**STATUS:** STABLE · **LOCATION:** `js/world/vehicles.js` (`VehicleFactory`)
**DO:** `factory.build(type, color)` and drive the group yourself; add a new body type in your film (Friction's box
truck lives in `films/friction/traffic.js`).
**DO NOT:** write another car modeller.

**SYSTEM:** Dev controls / Recording Mode
**STATUS:** LOCKED · **LOCATION:** `js/ui/devControls.js` + standard page markup
**DO:** copy the standard `#dev / #debug / #startOverlay / #soundStatus / #loading / #errorBox` markup into your page.
**WHY:** the owner records takes with H (Recording Mode) and reviews with the scrub bar.

**SYSTEM:** Render / bake / check tools
**STATUS:** STABLE · **LOCATION:** `tools/`
**DO:** use them as documented in `PRODUCTION_WORKFLOW.md`.
**DO NOT:** hard-code your film or a scratch path into them.

**SYSTEM:** Mirror, Look, Earth, Heroes, xover fx
**STATUS:** STABLE · **LOCATION:** `js/fx/mirror.js`, `js/fx/look.js`, `js/world/earth.js`, `js/world/heroes.js`, `films/xover/fx.js`
**DO:** reuse; subclass EarthScene (override `update`); load `films/xover/fx.js` read-only if you need XBill/XRibbon.
**DO NOT:** edit `films/xover/fx.js` (Slip depends on it) or `films/before-screens/children.js` (Depersonalization
depends on it).

**SYSTEM:** Oxygen-specific modules
**STATUS:** FROZEN · **LOCATION:** `js/scene/*`, `js/ui/hud.js`, `js/audio/audioManager.js`, `js/fx/particles.js` `ParticleSystem`,
`js/world/kinematics.js` traffic solver, `Environment.update`
**DO:** read them as examples.
**DO NOT:** build new films on them. Use StoryHUD, your own AudioEngine subclass, your own update.

---

## Systems that are NOT locked (expected to be written per episode)

- The episode's world (city subclass, sets), cast and performances, simulation (if any), shot cameras, legs, VFX,
  sound design, grade, page CSS, PLAN.md.
- Copy-then-own is encouraged: if you need a variant of a film-folder module (Slip copied Moon/Sim ideas instead of
  editing them), copy it into your folder under your prefix.

## Changing a locked system (only when genuinely required)

1. Prove you need it: what can't be done from the film side (subclass, override after `cam.update`, extra DOM in
   `build`, a grade param already present)?
2. Make it **additive and backwards-compatible**: new optional parameter, default = old behaviour (the `sleeveLen` /
   `sleeveFit` and `readout.sub` as a function changes are the models).
3. Check that **every** page still boots: `NODE_PATH=$(npm root -g) node tools/check-page.cjs <page>` for each `*.html`.
4. If you touched `js/audio/audioEngine.js`, re-bake **every** film's soundtrack, or don't touch it.
5. Commit the engine change **separately** from episode work, message prefixed `engine:`, and list it in your handoff to
   the owner. With parallel developers, coordinate first (see `GITHUB_WORKFLOW.md`).

## Good future engine improvements (proposals, not done)

- Promote `films/xover/fx.js` (XBill, XRibbon, xBolt…) to `js/fx/vfx.js` so films stop depending on another film's folder.
- Promote the aim-hand helper (`frAimHand`/`slAimHand`/`amAimHand` are copies) into `viewerHands.js` as an optional
  method.
- Promote the first-person legs (`FrLegs`/`SlLegs`) to `js/camera/viewerLegs.js`.
- Make `Environment.update` a no-op base, with the Oxygen logic moved into a subclass.
- Bundle `GLTFLoader` into `lib/` (plus a base64 embed helper) if the owner starts supplying GLB assets.
