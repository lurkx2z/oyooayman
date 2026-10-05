# What If Oxygen Suddenly Disappeared? — 3D first-person simulation

A vertical (9:16, 1080×1920, 30 fps) Three.js "What If?" cinematic built for TikTok / Shorts / Reels.
Everything is procedural, so there are no models, images or sound files to download.

**Status: Phase 1, the first 15 seconds.**

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
| 9.5–15 s | A quiet second counter appears: **TIME WITHOUT OXYGEN 00:07 → 00:12**. Captions: *No one felt short of breath.* / *That was the dangerous part.* Dizziness, hands to heads, tunnel vision and desaturation build. The hard-working lift worker passes out first (about 10 s without O₂) and folds over the railing. Birds start falling from the sky. Standing people stumble, kneel and sit down; seated drivers last longest. Phase 1 ends about 4 s before *you* black out |


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
- **Lens:** a moderate rounded-rectangle vignette with soft edges, little grain, a calm camera.
- **Text:**
  - top-left info block: tiny caps label, serif value, the same value as a partial pressure in kPa, and context;
  - a Lora title on the first frame;
  - one Lora-italic narration line at a time.

  All of it is in `SCRIPT.hud` (`js/scene/script.js`).
- **No first-person hands yet.** The procedural hand looked like a blocky object. Re-enable `SCRIPT.hands` once an authored low-poly arm model exists.

---

## How to run it (no install needed)

1. Download or clone this folder.
2. **Double-click `index.html`.** It opens in Chrome.
   (If it opens in another browser, right-click → *Open with* → Google Chrome.)
3. Click the screen or press **Space** to play. The click also turns on the sound.

No server is needed. Three.js is bundled in `lib/`, so it works offline too.
With internet, the page also loads nicer web fonts (Inter / Cormorant Garamond / Oswald).

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
node tools/render-preview.cjs --w 1080 --h 1920 --out renders/phase1.mp4
```

## Project layout

```
index.html                 page + HUD markup + script order
style.css                  9:16 stage, HUD, dev controls
lib/three.bundle.min.js    Three.js r186 (+ BufferGeometryUtils, RoundedBoxGeometry) as a classic script
js/config.js               global tunables (camera height, walk speed, bob, fov, render settings…)
js/scene/script.js         ★ THE DIRECTOR'S SCRIPT — every timing, camera move, HUD text, vehicle and person
js/core/                   seeded RNG + noise, Timeline/Track, procedural canvas textures, geometry batching
js/world/environment.js    sky, sun, street, buildings, shops, trees, props, construction site, grill cart
js/world/kinematics.js     vehicle motion as pure functions of time ("stop here" → solves start position)
js/world/vehicles.js       car/bus/motorbike models + TrafficSystem (sputter, coast, brake lights, hazards)
js/world/people.js         low-poly people + procedural poses (walk, stumble, kneel, sit, lie…)
js/fx/particles.js         flames, sparks, smoke, exhaust puffs, birds
js/fx/postprocessing.js    contact-shading AO, tone mapping, grade (desaturation that spares the fire), vignette, grain, hypoxia tunnel vision
js/fx/look.js              selective-gloss material pass + world-space grime shader
docs/art-direction.md      reference calibration report + style rules for the rest of the video
js/camera/cameraController.js   first-person head: path + bob + breathing + sway + startles + shake
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
- **Hypoxia**: breathing O₂-free air pulls oxygen *out* of your blood. There is **no feeling of suffocation**, because the urge to breathe comes from CO₂, which still leaves normally. Resting adults stay functional for roughly 10–15 s and black out at about 15–25 s. Someone working hard (the lift worker) goes first, at about 10 s. The viewer is assumed to black out at about 17–19 s after zero, so Phase 1 ends a few seconds before that.
- **Lighters**: a piezo lighter still makes its electric spark, but the gas can't light. Flint (ferrocerium) sparks only shine by burning, so they go dim.

## Recommendations for Phase 2 (from the reviews)

- **Put the viewer on the same clock as everyone else.** Phase 1 already implies the viewer blacks out at about 19 s. Planning a POV collapse at about 55 s, while everyone else drops at about 10–25 s, is the most likely "that's fake" comment. Two plausible options:
  1. The viewer blacks out at about 19 s. The film continues from their **dropped phone, still recording on battery** on the pavement, which can show the aircraft, the city and the global pull-back.
  2. **The viewer holds their breath.** This is true and surprising: breathing is what drains your blood, so holding your breath keeps you conscious much longer, if the lungs' O₂ didn't vanish too. A "HOLD YOUR BREATH" beat at about 15 s could stretch the POV to about 50–60 s and keep your original structure.
- **Aircraft:** every engine flames out at once, and the sound goes from a roar to the whine of fans windmilling. A crash within about 30 s only works for a jet just after take-off (below about 500 m). From cruising altitude it takes minutes. **No fireball**, because fuel can't burn: show dust and spilled fuel mist instead. A helicopter dropping fast without power fits the timing better.
- **Global view:** night-side city lights go out in waves within seconds. No fires anywhere. The sky stays blue. The ozone layer can't be rebuilt, so UV-C reaches the ground within hours.
