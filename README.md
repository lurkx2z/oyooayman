# What If Oxygen Suddenly Disappeared? — 3D first-person simulation

> **Developers (human or Claude): start with [`CLAUDE.md`](CLAUDE.md) and [`docs/NEW_DEVELOPER_BOOTSTRAP.md`](docs/NEW_DEVELOPER_BOOTSTRAP.md).**
> The `docs/` folder is the project's handoff: style bible, video format, retention lessons, engine map, workflow, episode history.

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
>
> **Eighth film: *What if air became 10× denser?*** — open `air.html` (48.6 s). One invisible change with many
> consequences: a throw dies in the air, a cyclist can't pass 17 km/h, a car sheds speed, a plywood sheet floats down
> while a steel clamp drops — and then a 60 km/h wind hits like 190 km/h and the street comes apart. Every hero motion is
> integrated from ½ρC_dAv². Plan, model and numbers: [`films/air/PLAN.md`](films/air/PLAN.md).
>
> **Ninth film: *POV: This video is a game. Don't die.*** — open `game.html` (51.6 s). A fake-interactive RPG short. A man
> trapped in a facility sees *you*: he asks you to put your finger on his hand (the glass lights up exactly under your
> fingertip), to tilt your phone to choose a door, to hold a pad to open a blast door, and to tap to stop an item
> roulette (a tap pauses the video, so your item is really yours). The system detects you, he looks at the edges of your
> screen, presses his palm on it (the whole frame ripples), cracks it, and your fingertip cancels the reset. You keep your
> own score of three hearts. Add `?safe` to the address to see the platform safe zones and every touch target. Plan,
> safe zones, targets and beat sheet: [`films/game/PLAN.md`](films/game/PLAN.md).
>
> **Tenth film: *What if Killua and Eren spawned in World War II?*** — open `xover.html` (68 s). A serious anime-crossover
> war short: on a muddy 1944 battlefield, two strikes hit the road in front of an advancing squad and two figures are
> standing in the smoke. Killua (silent, impossibly fast, electric) takes apart the soldiers and crews; Eren bites his
> hand, a bolt comes down and the Attack Titan rises out of the steam to take apart the tanks, the trench and the guns.
> Two disasters on one battlefield, intercut, until the last push breaks and the army runs — Killua on a wrecked tank,
> the Titan behind him. Generic army, no insignia, no gore. Shot list, map, hero shots and review log:
> [`films/xover/PLAN.md`](films/xover/PLAN.md).
>
> **Eleventh film: *What happens if you slip and fall?*** — open `slip.html` (57 s). A dead-serious first-person
> physics parody: you slip on a wet sidewalk in the rain, and the camera follows the energy — a ring in a puddle, a
> 0.07 J vibration through the ground, a pebble that moves 1.4 mm, a fault at 99.999 % stress, an M8.7 earthquake on
> your street, Earth's rotation ticking from 1,674.40 to 1,674.41 km/h, the sea draining 38 m, and a 146 m tsunami
> coming back up the same avenue. The payoff card: *CAUSE OF GLOBAL CATASTROPHE: SLIPPED ON WET SIDEWALK.* A small note
> after the joke says it is satire. Shot list, causal chain and review log: [`films/slip/PLAN.md`](films/slip/PLAN.md).
>
> **Film: *What if water lost all surface tension?*** — open `no-surface-tension.html` (60.1 s, version 2). Under the
> title, water's surface tension falls from 72 mN/m to 0 and stays there; nothing else changes. Everything happens at
> small scale in one kitchen and its garden: a brimming glass and its beads slump into films, a tap stream can't pinch
> into drops, a paperclip sinks, a bottle of sparkling water turns white and erupts the moment it is opened (bubbles no
> longer need to overcome a barrier), a water strider falls through the pond, water climbs none of four glass capillary
> tubes, air breaks the water column inside a sunflower stem, the sunflower wilts in three days, and in the rain its
> leaf tip can't make a drop; the camera follows the thread down to the waterline, where a duck soaks through and
> sinks: *"It looks like a tiny force… until an entire ecosystem depends on it."* Then the rain stops, a low sun
> comes out, and the duck tries to take off and can't. Physics rules, shot list and review log:
> [`films/no-surface-tension/PLAN.md`](films/no-surface-tension/PLAN.md).

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

For an exact 30 fps render with no dropped frames (HUD and soundtrack included), you need Node.js and ffmpeg.
The commands below are for **your own computer**. In the Claude cloud container Playwright is already installed globally;
developers there should use the parallel tools in `docs/PRODUCTION_WORKFLOW.md` instead:

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
tools/stills.cjs           single frames for look-dev / review       tools/contact-sheet.sh  tile stills into one sheet
tools/render-parallel.sh   final render with N resumable workers      tools/render-frames.cjs one worker
tools/render-wav.cjs       the soundtrack as a WAV                    tools/encode-final.sh   one MP4 under a size budget
tools/check-page.cjs       boot + sound check                         tools/bake-soundtrack.cjs  bake the sound into the film
tools/preview-sheets.sh    1 fps contact sheets from rendered frames
tools/new-episode.sh       start a new episode from templates/episode/
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

Film: *POV: This video is a game. Don't die.* (`game.html`):

```
films/game/PLAN.md       rules, safe zones and touch targets, the score, beat sheet, the fourth-wall levels
films/game/script.js     ★ every beat time, the facility's coordinates, the touch targets, the camera, stillness, speech
films/game/facility.js   the cell and its lifting glass, the two doors, the corridor, the blast door, the core hall, lights
films/game/npc.js        the hero face and five-finger hands, arm IK onto screen points, NPC_AWARE_01 and the technician
films/game/fx.js         world effects: the glass touch, the steam blast, the security drone
films/game/screen.js     screen effects: the full-frame ripple, the crack fixed to the frame, the void, the safe-zone overlay
films/game/hud.js        the game HUD (hearts, rings, choice, hold, roulette, table, score) and the system HUD
films/game/audio.js      ambience, interface and system tones, events, dialogue blips, restrained music
films/game/film.js       FILM hooks: the world clock for RESET—, the composite, the ripples, the grade
```

Film: *What if Killua and Eren spawned in World War II?* (`xover.html`):

```
films/xover/PLAN.md      rules, the map, the shot list (story clock and the cut), hero shots, review log, quality gate
films/xover/script.js    ★ every beat time, the captions, the slow-motion world clock, the cut (CONFIG.edit)
films/xover/world.js     the battlefield: terrain, road, ruined village, fields, trench and bunker, the battery, sky, light
films/xover/titan.js     the Attack Titan: muscle forms on the human rig, the head, mane, teeth and jaw, its movements
films/xover/cast.js      Killua, Eren, the soldiers (helmets, rifles held by two-hand IK) and their actions
films/xover/tank.js      a generic WWII tank: treads, turret, gun, hatch and commander, damage poses
films/xover/fx.js        billboards (smoke, steam, fire, flashes), ribbons (lightning, tracers), sparks, debris
films/xover/action.js    who is where, doing what, at every world time; Killua's strikes and afterimage; every effect
films/xover/shots.js     the camera of every shot (Killua's close, fast, whipping; the Titan's low, wide, heavy)
films/xover/audio.js     the 120 BPM score, the silences, Killua's dry cracks, Eren's thunder, steam, metal and roars, the war
films/xover/film.js      FILM hooks: camera and shakes, bullets and tracers, light flashes, the words, the grade
```

Film: *What happens if you slip and fall?* (`slip.html`):

```
films/slip/PLAN.md       rules, the places, the shot list, the causal chain, hero shots, escalation, sound, review log
films/slip/script.js     ★ every beat time, the captions and readouts, the camera, your hands, the sea level, the wave
films/slip/street.js     the rainy avenue to the sea: wet reflections (planar mirror + puddle mask), rain, cars, quake damage
films/slip/body.js       your legs and shoes (walking, the slip, sitting up)
films/slip/under.js      the underground cut-away (layers, the ring, the pebble and its scale) and the fault (km scale)
films/slip/globe.js      the planet: rings from the city, the rotation tick, the ocean swell
films/slip/sea.js        the seabed (one analytic height field in JS and GLSL), the water, the harbour, the 146 m wave
films/slip/cast.js       people with umbrellas, in the quake, at the seafront, running inland
films/slip/audio.js      rain, the squeak and the thud, the underground pulses, the rupture, the quake, sirens, the roar
films/slip/film.js       FILM hooks: which scene, hands, the quake shake, reflections, the cuts, the grade, the end card
```

Film: *What if air became 10× denser?* (`air.html`):

```
films/air/PLAN.md        the hypothetical, the aerodynamic model and its numbers, shot list, hero events, retention review
films/air/script.js      ★ the story clock (cold open, rewind), every beat time, camera, hands, captions
films/air/physics.js     drag and wind pressure; the throw, the cyclist, the car, the falls, integrated into tables
films/air/city.js        the avenue: café, scaffold, building site, the corner building's billboard; trees that bend
films/air/wind.js        the wind: debris, fabric, the hero failures (bin, umbrella, signs, branch, roof sheet, billboard)
films/air/actors.js      people, the ball, two cyclists, traffic, the coasting car, the swerving car
films/air/audio.js       wind that follows the push, every event's sound, restrained music
films/air/film.js        FILM hooks: story clock, HUD (density, wind, live speeds, the 190 km/h comparison), grade
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

Film: *What if water lost all surface tension?* (`no-surface-tension.html`):

```
films/no-surface-tension/PLAN.md        the rule, what's held constant, the places, the shot list, sound, review log
films/no-surface-tension/script.js      ★ every beat time, the cut (CONFIG.edit), captions, readouts, camera, hands
films/no-surface-tension/water.js       water material, spreading drops and films, the fraying stream, mist, the wet look
films/no-surface-tension/kitchen.js     the kitchen: glass and beads, tap and sink (with ghost drops), glass bowl, paperclip, the erupting bottle
films/no-surface-tension/garden.js      the garden (Environment subclass): sky by day/night/rain, pond, striders, the duck, the sunflower, wilting, rain
films/no-surface-tension/tubes.js       the capillary demo on the bench: four glass tubes in a dish, a cm card, ghost columns
films/no-surface-tension/stem.js        inside the sunflower stem: xylem tubes, a pore, the column that snaps
films/no-surface-tension/film.js        FILM hooks: hand poses, the watering can, the waterline lens, the finale camera, the grade
films/no-surface-tension/audio.js       drips that stop, the hiss, the eruption, clicks in the stem, the duck, rain with no patter, the chord
films/no-surface-tension/soundtrack.js  the baked soundtrack (regenerate with tools/bake-soundtrack.cjs after any sound change)
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
