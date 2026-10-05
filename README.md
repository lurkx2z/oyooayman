# What If Oxygen Suddenly Disappeared? — 3D first-person simulation

A vertical (9:16, 1080×1920, 30 fps) Three.js "What If?" cinematic built for TikTok / Shorts / Reels.
Everything is procedural, so there are no models, images or sound files to download.

**Status: the full 90-second film.**

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
