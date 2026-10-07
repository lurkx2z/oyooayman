# Episode history

> All 11 episodes were built in one long session (Oct 5–7, 2026) by one developer, sequentially, on branch
> `claude/intelligent-archimedes-dgu7zi`, in this order. Reviewer scores are from independent reviewer agents and are
> out of 10 (first round → later round). "Audience" is only what the owner reported; otherwise **UNKNOWN**.
> Representative frames: `docs/reference/sheets/<episode>.jpg`.
> **Delivery resolution:** Oxygen, Before Screens, Depersonalization and Friction were delivered as **540×960** renders
> (the early tool's default; their PLANs say so). From Andromeda on, finals were rendered at **1080×1920**. Re-render the
> early ones at 1080×1920 if they are ever re-uploaded.
> **Lengths:** the films' own lengths are listed. The owner quoted Oxygen as "91 s": the page is 90 s plus the audio tail /
> upload padding; treat 90/91 as the same video.

---

### 1. What if oxygen suddenly disappeared?
- **Page / folder:** `index.html` · `js/scene/` (script, film, baked soundtrack) + `js/ui/hud.js` + `js/audio/audioManager.js`
- **Duration:** 90 s (no edit layer then)
- **Built:** the whole engine: SceneManager, CameraController, the authored arms, the people rig, VehicleFactory +
  Kinematics traffic, the Oxygen Environment, particles (fire, sparks, smoke, dust, phones, impact column),
  post-processing (AO, ACES, warm-keep, tunnel vision), uneven fog, Look (gloss + grime), AircraftSystem, EarthScene,
  the offline audio engine, dev controls, the render tool, bundled fonts.
- **Story:** O₂ 21 → 0 % by 2.4 s; flames die; engines, then the grid fail; an EV keeps driving; people collapse;
  breath-hold; a silent gliding airliner → a dust column (no fireball); phones ringing; CO₂ forces a breath; collapse;
  silence; Earth with fires gone and night lights going out.
- **Worked:** world density; the fire as the only warm accent (the image turns cold when it dies); careful science
  (breath-hold, no fireball, grid collapse, battery devices).
- **Didn't:** 4 art-direction passes on 15 s before the rest existed; too much text early; v1 hands and people; trees
  ("piles of broken triangles"); 90 s too long.
- **Reviews:** phase-1 averages over 3 rounds: hook 5.75 → 6.0, retention 4.5 → 5.5, POV 4.25 → 5.0,
  science 6.25 → 7.0, visual ~4.5. The owner's reference match: v1 6–6.5 → V2 6.5 → V3 6.8–7 → V4 ~7.
- **Audience:**
  - *"22.4 s average watch time on 91 s."*
  - *"Performed strongly on TikTok"*; 45.9 % stayed / 54.1 % swiped on its initial YouTube Shorts test.
  - At the time of the Air brief: *"the best-performing video so far"*; per the handoff: *"performed very strongly."*
- **Lessons:** one invisible property → many consequences works. Finish before polishing. Cut length.

### 2. How did kids have fun before screens?
- **Page / folder:** `before-screens.html` · `films/before-screens/`
- **Duration:** 90 s
- **Built:**
  - **the engine split** (shared `js/` + per-film `FILM` hooks), StoryHUD, `installFog` options;
  - a child POV (1.3 m), a `Child` rig with scene-based performances (`perf`);
  - a marbles mini-sim, a spinning top, jacks, kite workshop/flight, an imagination castle transformation, social games,
    a sunset `setTime`, a parlour with a shadow-picture wall, a modern bedroom with a phone UI;
  - SoundKit `pluck/voice/laugh/chatter`; offline-audio spike fixes.
- **Worked:** a warm, alive palette (not sepia); the imagination transformation; the day → sunset → night progression.
  The owner on phase A: *"i love it make the 90 seconds version."*
- **Didn't:** the StoryHUD title was invisible in the first delivery (opacity bug, re-sent); the web version had no
  sound until baking existed; long (90 s).
- **Reviews:** not recorded in the repo (UNKNOWN).
- **Audience:** UNKNOWN.
- **Lessons:** reuse the engine; test that the title shows on frame 0; bake the sound.

### 3. What weed-induced depersonalization can feel like
- **Page / folder:** `depersonalization.html` · `films/depersonalization/` (loads `films/before-screens/children.js`)
- **Duration:** 71.2 s
- **Built:** a planar `Mirror` (`js/fx/mirror.js`) with a reflection-only self-avatar; world/you audio buses that drift
  apart; post `smear` (camera lag); a dolly zoom; talking mouths; aimed hand poses; a SENSE OF SELF readout.
- **Owner override:** RETENTION OVERRIDE (title 2.5–4 s over action; no dead time; first 10 s scripted; open loops;
  captions 4–9 words; mirror ≤ 10 s; mid reset at 45–55 s; a fast 10–12 s checking loop; emotional resolution before
  the note; 70–80 s, not 90).
- **Worked:** respectful framing; the title as a comprehension tool; the checking loop. Owner: *"perfect now make the
  full video."*
- **Didn't (v1):** onset invisible with sound off; the same shot three times; static hands; a sepia grade; AO halos;
  ghost thumbs.
- **Reviews:** phase-1 v1: hook 5, first-5 s 5–7, curiosity 6, pacing 5, visual 5–5.5, POV 4–6, respectfulness 8,
  accuracy 8. Fixed in v2; the full cut wasn't re-scored.
- **Audience:** UNKNOWN.
- **Lessons:** subjective topics need a longer, more prominent title and sound-off visual cues; meters must recover.

### 4. What if friction disappeared for 60 seconds?  ★ benchmark
- **Page / folder:** `friction.html` · `films/friction/`
- **Duration:** 70.3 s (v2; v1 was 75.5 s)
- **Built:**
  - `films/friction/slide.js` (a 2D rigid-body impulse sim, 240 Hz, OBB cars, circle props, kerbs, breakable holds,
    spinning wheels);
  - a hill city (an Environment subclass);
  - a box truck; tumble/rollover logic on the return; the MEANWHILE montage; slow-motion drone shots; first-person legs;
    aimed grip poses;
  - **the engine `Edit` layer**; **`tools/bake-soundtrack.cjs`**; StoryHUD readout `sub`/`ctx` functions.
- **Worked:** the centred title + SURFACE FRICTION draining at 1.5 s; "wheels spin, car doesn't"; the hill release;
  the countdown open loop; *"You'd never notice friction… until it was gone."*
- **Didn't (v1):** a late hook (3.0 s); unreadable HUD; a 13 s hill stretch with the truck hidden; a far-away impact;
  a static lull before 3-2-1; a thin return; an 11 s aftermath; washed-out captions; a non-physical rollover.
- **Reviews:** preview ~4/10 across the board; v1 4–6 (four reviewers); v2 fixed the agreed issues and wasn't
  re-scored.
- **Audience:** **the strongest serious-physics performer** (handoff).
- **Lessons:** this is the format; pin hero beats in sims with kicks/holds; the payoff must be the biggest event.

### 5. What if Andromeda collided with the Milky Way overnight?
- **Page / folder:** `andromeda.html` · `films/andromeda/`
- **Duration:** 80 s
- **Built:**
  - `merger.js`: a restricted N-body merger (82,000 test particles, halo/disc/bulge, dynamical friction, deterministic
    checkpoints);
  - `sky.js`: a sky renderer (near light CPU-splatted into an all-sky map with 3 distance shells and dust, far light as
    GPU gaussians, an analytic Milky Way band with warp, density-wave arms, a star field, extinction);
  - a night overlook town; sky-lit world lighting.
- **Worked:** the science rules (no disc smashing, no shockwave; gravity, tails, passes, merger); escalation stills each
  look different.
- **Didn't:** the late sky washed out (gain tracks fixed it); "visually large but predictable" as a concept.
- **Reviews:** fixes from stills only; no reviewer scores recorded.
- **Audience:** not reported individually. The owner said *"the weaker cosmic videos were visually large, but more
  predictable"* (this one and/or Moon).
- **Lessons:** big visuals don't replace surprising consequences.

### 6. What if the Moon crashed into Earth?
- **Page / folder:** `moon.html` · `films/moon/`
- **Duration:** 80 s
- **Format experiment:** **cold open** on the money shot (a giant Moon over a flooded street) → "24 HOURS EARLIER" →
  the day. It was tried to fix Oxygen's 54 % swipe-away.
- **Built:**
  - a procedural hero Moon (a GPU-baked map with maria/craters, terminator shadows, camera-relative);
  - a night coastal city with district power;
  - a water/flood system (bores, surges, a turbid moonlit surface, mirror reflections, foam edges);
  - boats settling on mud; an impact by implication.
- **Worked:** the Moon asset; the tide stages (drain → surge → flood).
- **Didn't:** a predictable concept; the cold-open format.
- **Reviews:** fixes from stills (water normals, turbidity, foam, mud, lighthouse beam, hill view); no scores recorded.
- **Audience:** **underperformed** relative to the stronger physics concepts. *"The Moon video taught us that spectacle
  alone does not guarantee retention."*
- **Lessons:** don't default to cold opens; prefer rule-change concepts.

### 7. What if you realized you were in a simulation?
- **Page / folder:** `sim.html` · `films/sim/`
- **Duration:** 79.8 s
- **Built:**
  - world clocks (repeat, pause, rewind, replay) for exact déjà vu;
  - a hero head with eyes aiming at the lens (NPC_AWARE_01), basis IK;
  - glitch layers (wireframe, debug labels, LOD pop, billboard tree, checker texture);
  - an SVG displacement ripple on the whole stage (the HUD bends too);
  - a screen crack over a void render target;
  - a fake pause; a reset that fails.
- **Worked:** starts 100 % normal; escalating fourth-wall levels; "Not you… You."
- **Didn't (first stills):** the head read as a mask; IK bent wrong; the head turned 180°; the ripple was too weak.
  All fixed.
- **Reviews:** stills-driven fixes; no scores recorded.
- **Audience:** UNKNOWN.
- **Lessons:** sync any live HUD numbers to the real video clock; no fake private data.

### 8. What if air became 10× denser?
- **Page / folder:** `air.html` · `films/air/`
- **Duration:** 48.6 s
- **Format experiment:** **ultra-short + counterintuitive cold open** (a 60 km/h wind shown wrecking the street) →
  "33 SECONDS EARLIER" → mystery/answer beats every 3–5 s.
- **Built:**
  - `physics.js`: drag tables (ball, cyclist, car coast, plywood vs clamp fall);
  - wind-bent trees in the vertex shader (+ shadow depth material);
  - scripted flights (billboard, sign, roof sheet, umbrellas);
  - the "≈ 190 km/h" equivalent.
- **Worked:** the physics teaching beats (½ρC<sub>d</sub>Av², terminal speed, the 190 km/h fact).
- **Didn't:** as a format. The owner later said to skip the preview and MP4 from this session (*"forget sending me the air
  preview or video"*); how it was eventually captured/uploaded is UNKNOWN.
- **Audience:** **did not perform as hoped** (handoff).
- **Lessons:** 45–50 s rewind-heavy is not the answer; ~60–72 s with the Oxygen/Friction structure.

### 9. POV: This video is a game. Don't die.
- **Page / folder:** `game.html` · `films/game/` (`?safe` shows platform safe zones and touch targets)
- **Duration:** 51.6 s
- **Built:**
  - a facility; hero NPC faces/hands with IK onto screen points (fake touch);
  - a screen-space crack + void (layered renders), whole-frame ripples;
  - a game HUD (hearts, choice, hold, roulette, item table) and a system HUD;
  - a safe-zone audit (top < 200, right > 900 for y 700–1560, bottom > 1500).
  The hero code was later extracted to `js/world/heroes.js`.
- **Worked (after fixes):** the palm-on-glass touch; the tilt choice; the roulette "pause to choose" trick; the reset
  cancelled by your fingertip.
- **Didn't (v1):** scoring misread (faded hearts); UI over his face; 18 s with no viewer task.
- **Reviews:** review 1: hook 5, clarity 7, fourth wall 6, retention 5, scoring 3, visual 4; review 2: visual 5,
  UI 6, safe zones 6, game design 5. Self after fixes: 7 / 8 / 7.5 / 7 / 8 / 6.5 (not independently re-scored).
- **Audience:** UNKNOWN.
- **Lessons:** design touch targets in fixed screen coordinates; never claim real touch/tilt detection.

### 10. What if Killua and Eren spawned in World War II?
- **Page / folder:** `xover.html` · `films/xover/` (+ `js/world/heroes.js`)
- **Duration:** 68 s film (72 s story, `CONFIG.edit`), 120 BPM beat-synced cuts
- **Owner override:** HYPE / RETENTION / CINEMATIC OVERRIDE (aura; speed compression vs impact expansion; a hard first
  Killua reveal; a 3–4 s transformation event; an aura walk; a size-contrast shot; edit points; silences; the final 12 s
  the best; no gore; a quality gate).
- **Built:**
  - a battlefield world; an Attack Titan on the human joint layout; tanks; soldiers with two-hand rifle IK;
  - `fx.js` (XBill, XRibbon, xBolt, XSpark, XDebris), a shot list of 50 camera functions, a slow-motion world clock;
  - Killua's afterimages/strikes.
- **Worked:** the size contrast; the aura walk; distinct sound for each character; the quality gate met (per PLAN).
- **Didn't (v1):** Killua posed instead of moving; dead stretches; a milky arrival; a white-mush bolt; the Titan as an
  "orange golem"; generic Eren; a grey poster. Characters still read as low-poly mannequins in close-up.
- **Reviews:** round 1: 4.5 and 4. A round-2 reviewer was started on v2; its result isn't recorded.
- **Audience:** UNKNOWN.
- **Lessons:** stylised named characters need signature silhouette features; two camera languages; cut on bars.

### 11. What happens if you slip and fall?  ★ parody, top performer
- **Page / folder:** `slip.html` · `films/slip/` (loads `films/xover/fx.js`, `js/world/earth.js`, `js/fx/mirror.js`)
- **Duration:** 57.3 s film (67.4 s story; `CONFIG.edit` incl. a half-speed slip)
- **Built:**
  - a rainy street with wet reflections (planar mirror through a puddle mask, rain ripples, instanced rain streaks);
  - legs/shoes; an underground cut-away (strata, ring, pebble with a mm scale and a growing bracket);
  - a km-scale fault (YOU pin, depth line); quake props (window burst, shards, cornice chunks);
  - an `EarthScene` subclass (rings, rotation arrow, swell);
  - a coast with an analytic seabed shared by JS/GLSL, a draining sea, boats tipping, and a 146 m wave (deformed
    body + lip, foam, spray, mist, debris);
  - a recap stack, the end card, a satire note.
  - Also the shared Earth cloud-seam fix.
- **Worked:** the dead-serious tone; absurdly precise tiny numbers; the running tsunami joke; the punchline card;
  the cover that doesn't spoil the wave.
- **Didn't (v1):** slow stretches; an invisible puddle ring; an invisible 1.4 mm move; a flat globe; a flat coast;
  a flat-wall tsunami; a small late punchline. Fixed over v2/v3.
- **Reviews:** round 1: visual 5.5, retention/comedy 5 → round 2: 6.5 / 6.5. v3 fixes applied, not re-scored. Known
  remaining weaknesses: the planet's polar cloud cap and uneven atmosphere glow; the tsunami is stylised rather than
  "excellent".
- **Audience:** **performed extremely strongly** (handoff).
- **Lessons:** self-aware parody + full production seriousness; use the edit layer aggressively; every link of a chain
  needs its own visible proof.
