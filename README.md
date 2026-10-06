# What If Oxygen Suddenly Disappeared? — 3D first-person simulation

A vertical (9:16, 1080×1920, 30 fps) Three.js "What If?" cinematic built for TikTok / Shorts / Reels.
Everything is procedural, so there are no models, images or sound files to download.

**Status: the full 90-second film.**

> **Second film: *How did kids have fun before screens?*** Open `before-screens.html` (the full 90 s).
> It runs on the same shared engine; its plan and shot list are in [`films/before-screens/PLAN.md`](films/before-screens/PLAN.md).
>
> **Third film: *What weed-induced depersonalization can feel like*** — open `depersonalization.html` (71 s).
> Plan, shot list and review log: [`films/depersonalization/PLAN.md`](films/depersonalization/PLAN.md).
>
> **Fourth film: *What if friction disappeared for 60 seconds?*** — open `friction.html` (70.3 s). Friction goes at 1.5 s
> and comes back 60 seconds later; everything that slides comes from a deterministic simulation computed when the page loads,
> and the film is an edited cut of that one continuous take (`CONFIG.edit`).
> Plan, physics rules, shot list and review log: [`films/friction/PLAN.md`](films/friction/PLAN.md).
>
> **Fifth film: *What if Andromeda collided with the Milky Way overnight?*** — open `andromeda.html` (80 s). From a
> hilltop lookout over a small town, one night stands in for billions of years: Andromeda grows, passes overhead, swings
> away, comes back and merges with our galaxy. The sky is drawn from a deterministic gravity simulation (82 000 stars, gas
> and dust in two galaxies) computed when the page loads. Plan, science rules and beat sheet:
> [`films/andromeda/PLAN.md`](films/andromeda/PLAN.md).
>
> **Sixth film: *What if the Moon crashed into Earth?*** — open `moon.html` (80 s). A cold open on the money shot (an
> enormous Moon over a flooded coastal street), a rewind to 24 hours earlier, then the day through to impact: the Moon
> grows, the tides go wrong in stages (the harbour drains, surges, the streets flood), the ground shakes, and the end is
> shown by implication. The Moon is a procedural hero asset (real maria and craters, terminator shadows), drawn
> camera-relative so it never parallaxes. Plan, physics notes and beat sheet: [`films/moon/PLAN.md`](films/moon/PLAN.md).
>
> **Seventh film: *What if you realized you were in a simulation?*** — open `sim.html` (80 s). It starts like any other
> video on the channel: a sunny street, the title. Then the world repeats itself (a man passes twice, a ball bounces
> backwards), breaks (wireframe, debug labels, a frozen car, a missing texture), and one man in it realizes that someone
> is watching — you. He reads the captions, taps the lens (the whole picture ripples), hits the screen (the video
> cracks over a wireframe void) and is reset. The reset fails. Plan and beat sheet: [`films/sim/PLAN.md`](films/sim/PLAN.md).

| Time | Beat |
|---|---|
| 0–1.3 s | An ordinary overcast street. You walk toward a charcoal-grill cart (flames). A worker on a scissor lift throws a bright spark fan, there's traffic, birds, and a rooftop LED billboard. Title: *WHAT IF… oxygen disappeared?* The O₂ readout already creeps down from 21.0 % |
| 1.3–2.4 s | O₂ crashes to 0 % and pressure falls with it: a crackle of ear pops. Grill flames die at about 15 %. Engines misfire and stop while O₂ is still falling. At the big pressure step (about 2.05 s) everyone jerks their hands up to their ears; birds dip and scatter; the camera jolts; sound muffles; and you exhale involuntarily |
| 1.95–3.85 s | **0 % at 2.4 s** (air pressure is down 21 %). Caption: *The flames went out first.* |
| 3.4–6.6 s | **The vendor keeps flicking his lighter**: dim flint sparks, no flame. Meanwhile the grill gives off pale smoke (fat still cooks without a flame) and its coals glow dull red (hot, not burning) |
| 5.5–6.1 s | The worker's battery grinder still spins, but its sparks are short and dull: hot steel can't burn without O₂ |
| 6.3 s | **The grid collapses** (60 % of power came from burning fuel). The rooftop billboard flickers and dies, signals switch to battery flashing red, the mains hum cuts out. Caption: *Then the engines. Then the power.* |
| 6.75 s | A coasting car rear-ends the stalled car 16 m ahead. Its alarm and hazards keep going on battery |
| 7.3–8.9 s | **A blue electric car keeps driving** through the dead traffic and passes you. Caption: *Only electric things kept moving.* |
| 9.5–15 s | A quiet second counter appears: **TIME WITHOUT OXYGEN 00:07 → 00:12**. Captions: *No one felt short of breath.* / *That was the dangerous part.* Dizziness, hands to heads, tunnel vision and desaturation build. The hard-working lift worker passes out first (about 10 s without O₂) and folds over the railing. Birds start falling from the sky. Standing people stumble, kneel and sit down; seated drivers last longest |
| 15–21 s | *Every breath was pulling oxygen out of your blood.* / *So you stopped breathing.* **You hold your breath**: the breathing stops, a **BREATH HELD** counter starts, and your own hand reaches toward the people kneeling on the pavement |
| 21.5 s | A hypoxic "lost moment": the picture blacks out and returns at the intersection |
| 23–31.6 s | An **airliner on final approach glides overhead in near silence**: its engines died at 1.7 s, so you hear only windmilling fans and rushing air. Gear down, strobes blinking on battery. You follow it until it slides behind the blocks. Caption: *Its engines had died twenty seconds earlier.* |
| 34.4–37 s | It comes down at the far end of the cross street: **a dust column, no fireball**. The thud arrives 1.5 s later (510 m away). Caption: *No fireball. Nothing could burn.* |
| 37–44 s | Phones ringing on battery next to people lying on the crosswalk; signals flashing red; a car alarm. Captions: *Phones kept ringing.* / *Only the batteries were still awake.* |
| 44–56 s | CO₂ builds: your chest spasms, the heartbeat pounds, your own hand shakes in front of you (*Your chest began to burn.*). At 49.6 s **your body forces a breath** of O₂-free air: vision collapses, a hand goes to the pavement, you go down |
| 56–60 s | Ground-level view along the crosswalk, heartbeat slowing, then about a second of complete silence |
| 60–67.6 s | The camera leaves the body and rises over the dead avenue into the haze. Caption: *It was happening everywhere at once.* |
| 67.6–90 s | A stylised Earth: no fires anywhere, the sky still blue, the last night-side city lights going out in waves as backup power runs down. *No fires. No engines. No breathable air.* / *Eight billion people. The same few seconds.* Then **You would only have seconds to react.** and the final **ATMOSPHERIC OXYGEN 0.0%** |


## Look (art direction)

The full reference calibration and style rules live in **[`docs/art-direction.md`](docs/art-direction.md)**.
The target is a **polished cinematic low-poly first-person simulation**: about 70 % the "POV What If" look (polish, selective gloss, clean UI, serif narration, optical framing),
30 % Omaha-style atmosphere (fog depth, dark foregrounds, grounding, irregularity).

- **Value and colour:** overcast daylight, midtones ≈ 70–85/255, dark foreground shapes, light hazy distance. A muted world with saturated, localised accents (fire, sparks, signals, hazards). The picture turns colder when the fire dies.
- **Atmosphere:** exponential fog that is denser near the ground and varies in slow banks, capped so far blocks keep their silhouettes, plus a few faint drifting haze layers between blocks.
- **Grounding:** half-resolution ambient occlusion (faded with fog distance) plus soft blob shadows under people and vehicles.
- **Materials** (`js/fx/look.js`):
  - the environment is matte; cars, glass and metal props keep controlled highlights;
  - a world-space grime shader adds patchy ground, replaced slabs, damp patches, darker wall bases and a slow tone drift between buildings.
- **People** (`js/world/people.js`): authored low-poly parts, not capsules. Tapered faceted limbs with joint caps, shoes with soles, three body builds, clothing layers (collar, coat, hood) and accessories (backpack, shoulder bag, scarf, beanie, ponytail, bun).
- **Buildings near the camera** get real window reveals, sills and lintels aligned to the textured windows, plus AC units, fire escapes, drainpipes and blade signs.
- **Earth** (`js/world/earth.js`): drawn continents, a fractal cloud cover generated on the sphere (wind-belt streaks, storm tracks, a few spiralling lows), an ocean sun glint, a thin blue limb and night-side city lights. No image files.
- **Lens:** a moderate rounded-rectangle vignette with soft edges, little grain, a calm camera.
- **Text:**
  - top-left info block: tiny caps label, serif value, the same value as a partial pressure in kPa, and context;
  - a Lora title on the first frame;
  - one Lora-italic narration line at a time.

  All of it is in `SCRIPT.hud` (`js/scene/script.js`).
- **First-person arms** (`js/camera/viewerHands.js`): an authored, smooth-shaded model — jacket sleeve and cuff, wrist, palm with a thumb pad, three-segment fingers with nails, a two-joint thumb, a watch on the left wrist. Poses are written as wrist position + finger direction + palm normal + finger curls, and blend smoothly.
- **Trees:** clean low-poly crowns of a few large faceted puffs (round and columnar variants), darker underneath.

---

## How to run it (no install needed)

1. Download or clone this folder.
2. **Double-click `index.html`.** It opens in Chrome.
   (If it opens in another browser, right-click → *Open with* → Google Chrome.)
3. Click the screen or press **Space** to play. The click also turns on the sound.

No server is needed. Three.js is bundled in `lib/` and the fonts (Inter, Lora, Oswald,
JetBrains Mono — all SIL Open Font License) in `fonts/`, so it works fully offline.

The soundtrack is synthesised by the film's own code. A pre-rendered copy ships next to each film
(`js/scene/soundtrack.js`, `films/before-screens/soundtrack.js`, `films/depersonalization/soundtrack.js`) so the sound is ready the moment the page opens
(the start screen says **SOUND READY**). If you change a film's script or sound code, the page notices that copy is
out of date and synthesises the sound itself on load, which can take a few minutes; refresh the copy with
`node tools/bake-soundtrack.cjs --page before-screens.html --out films/before-screens/soundtrack.js`
(or `--page index.html --out js/scene/soundtrack.js`).

> If your browser ever refuses to load local files, open a terminal in this folder and run
> `python -m http.server 8000` (or `npx serve`), then visit <http://localhost:8000>.

## Controls

| Key | Action |
|---|---|
| **Space** | Play / pause |
| **R** | Restart from 0 and play |
| **D** | Debug panel (event list, click an event to jump to it, draw calls, camera position) |
| **H** | **Recording Mode**: hides all developer UI and the cursor, keeps the cinematic HUD, and rewinds to 0 |
| **Esc** | Leave Recording Mode |
| **F** | Fullscreen |
| **M** | Mute / unmute |
| **← / →** | Step one frame (hold Shift for 1 second) |
| **[ / ]** | Jump to the previous / next story event |

The bottom bar also has the scrub slider (orange ticks mark story events), current time + frame number, FPS, and **⤓ WAV**, which downloads the synced soundtrack.

URL options: `index.html?t=8.4` starts at 8.4 s. `?record` starts in Recording Mode. `?res=1` forces an exact 1080×1920 internal render.

## Recording a take

1. Open in Chrome and press **F** (fullscreen), then **H** (Recording Mode).
2. Start your screen recorder (OBS, Windows `Win+Alt+R`, macOS `Cmd+Shift+5`).
3. Press **Space**. The take plays from 0 and freezes on the last frame.
4. Crop the recording to the 9:16 picture.

Playback is deterministic, so every take is identical. Picture is locked to the audio clock, so sound stays in sync.

### Optional: frame-perfect MP4 export

For an exact 30 fps render with no dropped frames (HUD and soundtrack included), you need Node.js and ffmpeg:

```bash
npm i -D playwright
node tools/render-preview.cjs --w 1080 --h 1920 --out renders/what-if-oxygen.mp4
```

## Project layout

The repo is now **one shared engine plus one folder or set of files per film**. A new film reuses the engine and adds its own script, world, HUD text and soundtrack.

Shared engine (used by every film):

```
js/main.js                 SceneManager: renderer, clock, playback, recording, capture; calls the film's FILM hooks
js/config.js               default tunables (a film can override them in its script)
js/core/                   seeded RNG + noise, Timeline/Track, Edit (optional cut of one continuous take), canvas textures, geometry batching
js/camera/                 first-person head (path, bob, breathing, sway, startles) + authored first-person arms
js/fx/postprocessing.js    AO, bloom, tone mapping, vignette, grain, fades; the film supplies the colour grade
js/fx/fog.js               uneven atmospheric haze (installFog)
js/fx/look.js              selective-gloss material rule (+ the oxygen film's grime shader)
js/fx/particles.js         billboard particles (smoke, dust)
js/world/people.js         low-poly people rig + pose library
js/audio/audioEngine.js    offline-rendered, sample-synced soundtrack engine + SoundKit synth blocks
js/ui/storyHud.js          reusable HUD: title, stacked lines, captions, info block, end line
js/ui/devControls.js       playback / scrub / debug / recording mode
tools/render-preview.cjs   frame-exact MP4 renderer (--page picks the film)
```

Film: *How did kids have fun before screens?* (`before-screens.html`):

```
films/before-screens/PLAN.md        shot list, assets, reuse map, historical checks
films/before-screens/script.js      ★ timings, camera, hands, HUD text, every child's performance
films/before-screens/film.js        FILM hooks: builds the sets, lighting switch, colour grade, hand poses
films/before-screens/town.js        the c. 1905 street (houses, porches, fences, trees, lamps, props)
films/before-screens/modernRoom.js  the bedroom (evening and night), its door, the phone, lock screen, curtain shadows
films/before-screens/children.js    period kids on the shared rig (clothes, child actions, throw/catch)
films/before-screens/toys.js        hoops, ball, skipping rope, dust from running feet
films/before-screens/pocket.js      marbles (a small physics sim), the spinning top, jacks
films/before-screens/kite.js        the kite workshop and the kite in flight
films/before-screens/fantasy.js     the imagined castle, knights' gear, the stick sword
films/before-screens/social.js      the long rope, hopscotch, the ball thrown to you, the lamplighter
films/before-screens/parlour.js     the evening parlour, the picture book, checkers, the shadow-picture wall
films/before-screens/audio.js       the film's soundtrack

Film: *What weed-induced depersonalization can feel like* (`depersonalization.html`):
films/depersonalization/PLAN.md       shot list, retention plan, review log
films/depersonalization/script.js     ★ timings, camera, hands, captions, HUD readouts, the friends' clocks
films/depersonalization/film.js       FILM hooks: hand poses (some aimed at the world), the mirror and your reflection, the grade
films/depersonalization/apartment.js  the flat: living room, kitchen nook and clock, hallway, bathroom; your legs
films/depersonalization/cast.js       the friends' looks and actions (on the shared cast rig)
films/depersonalization/audio.js      the soundtrack (a world bus that drifts away, a close "you" bus)
js/fx/mirror.js                       planar mirror (shared)
```

Film: *What if friction disappeared for 60 seconds?* (`friction.html`):

```
films/friction/PLAN.md        physics rules, shot list, hero events, review log
films/friction/slide.js       the slide simulation: oriented-box cars, round props, impulse contacts, kerbs, breakable holds,
                              free-spinning wheels; 240 Hz, run once at load, sampled by time (+ the hill ground and the clocks)
films/friction/scenario.js    who is where and doing what when friction goes: cars, parked cars, people, props, holds, kicks
films/friction/script.js      ★ timings, camera, where your eyes lock on (FR_LOOK), hands, captions, HUD readouts, slow motion
films/friction/film.js        FILM hooks: hand poses aimed at the pole, the drone shots, effects, the grade, your legs
films/friction/city.js        the avenue, the hill and its stepped rowhouses, the junction, street furniture
films/friction/traffic.js     cars and the box truck on the simulation (spinning wheels, jolts, roll-overs when friction returns)
films/friction/props.js       carts, bins, bikes, pipes, cargo, the phone, bollards, rails, falling lamp posts
films/friction/cast.js        people on the shared rig (slips, splits, sliding poses, tumbles)
films/friction/montage.js     the MEANWHILE shots: conveyor, bike, crane, tray, ambulance
films/friction/audio.js       the soundtrack (near-silent sliding; impacts, engines and voices from the simulation)
```

Film: *What if Andromeda collided with the Milky Way overnight?* (`andromeda.html`):

```
films/andromeda/PLAN.md       science rules, time compression, the simulation, the sky, beat sheet, sound, review log
films/andromeda/merger.js     the gravity simulation: two galaxies (halo, disc, bulge) on a decaying orbit, 82 000 test
                              particles; run once at load, deterministic checkpoints, sampled by time
films/andromeda/sky.js        the sky: near light in an all-sky map (3 distance shells + dust), far light as GPU gaussians,
                              the analytic Milky Way band that warps, density-wave arms, star field, haze and extinction
films/andromeda/script.js     ★ the night ↔ simulation time map (AM_TIME), sky tracks, eye-lines (AM_LOOK), camera, hands,
                              captions, HUD readouts
films/andromeda/film.js       FILM hooks: builds everything, aims your eyes and hands, lights the world by the sky, the grade
films/andromeda/overlook.js   the lookout, the park and lot, the valley town, the mountains
films/andromeda/cast.js       the people at the lookout and their sky-watching actions
films/andromeda/audio.js      the soundtrack (Earth sounds and the score kept apart; space is silent)
```

Film: *What if the Moon crashed into Earth?* (`moon.html`):

```
films/moon/PLAN.md       physics honesty, story clock, beat sheet, systems, review log
films/moon/script.js     ★ the story clock (cold open, rewind), the Moon's distance and place, the sea level, surges,
                         tremor, power, camera, hands, captions, HUD
films/moon/moon.js       the hero Moon (procedural map baked on the GPU, detail craters, terminator shadows) and the night sky
films/moon/city.js       the coastal city: harbour, quay, promenade, the hill street, the overlook, night facades, lamps
films/moon/water.js      the sea / flood surface: waves, surge fronts, reflections, murk, foam
films/moon/world.js      boats, cars, debris, emergency lights; what the water carries
films/moon/cast.js       the people (curiosity → panic), new sky-watching and flood actions
films/moon/fx.js         cracks, glass, collapses, dust, fires, the impact
films/moon/audio.js      the soundtrack (Earth sounds and the score kept apart; space is silent)
films/moon/film.js       FILM hooks: places the Moon, lights the world by it, shakes the ground, your hands, the grade
```

Film: *What if you realized you were in a simulation?* (`sim.html`):

```
films/sim/PLAN.md        the fourth-wall levels, the three visual languages, the clocks, beat sheet, systems
films/sim/script.js      ★ every beat time, the world's clocks (repeat, pause, rewind, restart), camera, hands, captions
films/sim/city.js        the sunny avenue: shops, the café and its awning, the stone wall, trees, the bus stop
films/sim/actors.js      traffic (the red sedan that freezes), the bus, the cyclist, people, the dog, pigeons, the ball, the cloud
films/sim/aware.js       NPC_AWARE_01: the hero head (eyes that aim at the lens, lids, brows, lips), arm IK, his performance
films/sim/glitch.js      wireframe, debug labels, LOD pop, flat tree, checker, the ripple, the crack and the void
films/sim/audio.js       the world's sound on its own clock (repeated, paused, reversed, replayed) + the film's sounds
films/sim/film.js        FILM hooks: the fake pause, the exact replay of the opening, the composite, the interface, the grade
```

Film: *What if oxygen suddenly disappeared?* (`index.html`):

```
index.html                 page + HUD markup + script order
style.css                  9:16 stage, HUD, dev controls
lib/three.bundle.min.js    Three.js r186 (+ BufferGeometryUtils, RoundedBoxGeometry) as a classic script
js/config.js               global tunables (camera height, walk speed, bob, fov, render settings…)
js/scene/script.js         ★ THE DIRECTOR'S SCRIPT — every timing, camera move, HUD text, vehicle and person
js/scene/film.js           FILM hooks: which systems make up the world, update order, the scene on screen, colour grade
js/core/                   seeded RNG + noise, Timeline/Track, procedural canvas textures, geometry batching
js/world/environment.js    sky, sun, street, buildings, shops, trees, props, construction site, grill cart
js/world/kinematics.js     vehicle motion as pure functions of time ("stop here" → solves start position)
js/world/vehicles.js       car/bus/motorbike models + TrafficSystem (sputter, coast, brake lights, hazards)
js/world/people.js         low-poly people + procedural poses (walk, stumble, kneel, sit, lie…)
js/world/aircraft.js       the gliding airliner (spline path, bank, gear down, battery strobes)
js/world/earth.js          the closing Earth shot (continents, clouds, atmosphere, night lights)
js/fx/particles.js         flames, sparks, smoke, exhaust puffs, birds, dust motes, impact dust column, ringing phones
js/fx/postprocessing.js    contact-shading AO, tone mapping, grade (desaturation that spares the fire), vignette, grain, hypoxia tunnel vision
js/fx/look.js              selective-gloss material pass + world-space grime shader
docs/art-direction.md      reference calibration report + style rules for the rest of the video
js/camera/cameraController.js   first-person head: path + bob + breathing + sway + startles + shake, kneel/fall, cinematic pull-back
js/audio/audioManager.js   fully synthesised soundtrack, rendered offline and kept in sync
js/ui/hud.js               top-left O₂ block, time-without-oxygen counter, title, one caption at a time
js/ui/devControls.js       playback / scrub / debug / recording mode
tools/render-preview.cjs   optional frame-exact MP4 renderer
```

**To retime or restage anything, edit `js/scene/script.js`.** Each vehicle there says where it should end up (`stopS`) and how hard it brakes. The code works out where it has to start. A built-in check warns in the console if two cars would overlap.

## Science notes (what the simulation assumes)

These were checked by an independent science review pass; see the review summary in the session.

- Only **molecular O₂** vanishes. Water, rock, concrete and the oxygen inside your body stay where they are. Oceans stay. Buildings stand.
- **Air pressure drops 21 % instantly** (the molecules vanish where they are, p = nkT). It then settles toward −23 % (O₂'s share of the air's mass) over the next minutes as the lighter column re-settles. That's like jumping to roughly 2 km altitude in a second; water would boil at about 93 °C.
  - **Ears pop** (air trapped in the middle ear pushes outward).
  - **There is no boom**: O₂ vanishing everywhere at once creates no pressure wave. The thump is inside your head.
  - The sky gets slightly darker and deeper, since O₂ does part of the Rayleigh scattering.
- **Flames go out at about 15 % O₂**, before the counter reaches zero.
  - Hot coals keep glowing (hot is not burning). They turn from bright orange to dull red within seconds.
  - The grill throws *white* smoke: fat keeps breaking down on the hot metal without burning.
  - A lighter still sparks, but nothing catches.
- **Combustion engines die while O₂ falls through about 14–5 %**. No backfires happen after zero.
- **Battery-powered things keep working**: brake and hazard lights, the bus LED sign, the car alarm, the electric car, the scissor lift and the cordless grinder.
- **Grinder sparks**: bright, branching sparks are steel *burning* in air. Without O₂ they become short, dull bits of hot metal.
- **The power grid fails within seconds** (here about 4 s after zero). About 60 % of electricity comes from burning fuel. Gas turbines flame out and coal boilers lose their fire; frequency collapses faster than load-shedding can react, and the nuclear, hydro and wind plants trip too. Traffic signals with battery backup fall back to flashing red. *To keep mains power on anyway, set `grid: { fail: null }` in `js/scene/script.js`.*
- **Hypoxia**: breathing O₂-free air pulls oxygen *out* of your blood. There is **no feeling of suffocation**, because the urge to breathe comes from CO₂, which still leaves normally. Resting adults stay functional for roughly 10–15 s and black out at about 15–25 s. Someone working hard (the lift worker) goes first, at about 10 s.
- **Holding your breath buys time.** Each breath of O₂-free air washes oxygen out of the lungs and reverses the flow out of the blood. Stop breathing and that washout stops; the body then only burns its remaining stores (lungs, blood, tissue), so the viewer stays conscious about half a minute longer. What ends it is CO₂, not oxygen: it builds up until the chest spasms and the body forces a breath, which drains what is left within seconds.
- **The airliner**: jet engines are combustion machines, so they flamed out at ~14 % O₂. A jet that low (on final approach) glides down in under a minute. You hear fans windmilling and air, not engines. **No fireball** on impact, because the fuel cannot burn: a dust and debris column instead. Its sound arrives 1.5 s after the picture (510 m at 343 m/s). Nav lights and strobes run on battery. There is no contrail (contrails are exhaust).
- **Phones, signals, alarms** keep working on batteries. **City lights** on Earth's night side go out in waves as grids collapse; some backup lasts a little longer. **The sky stays blue**: nitrogen still scatters blue light.
- **Lighters**: a piezo lighter still makes its electric spark, but the gas can't light. Flint (ferrocerium) sparks only shine by burning, so they go dim.

## Possible follow-ups

- **Part 2 hook:** the ozone layer can't be rebuilt without O₂, so UV-C reaches the ground within hours.
- **Alternative ending** (fiction, from the original brief): back on the collapsed POV, the O₂ readout flickers 0.0 → 0.1 → 0.3 % and you hear a sudden breath — "Why is oxygen coming back?"
