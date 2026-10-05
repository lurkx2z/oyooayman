# What If Oxygen Suddenly Disappeared? — 3D first-person simulation

A vertical (9:16, 1080×1920, 30 fps) Three.js "What If?" cinematic built for TikTok / Shorts / Reels.
Everything is procedural, so there are no models, images or sound files to download.

**Status: Phase 1, the first 15 seconds.**

| Time | Beat |
|---|---|
| 0–1.3 s | Normal sunny street: charcoal-grill cart, a worker on a scissor lift cutting steel (bright spark fan), traffic, birds. Hook title. The O₂ HUD already creeps down from 21.0 % |
| 1.3–2.4 s | O₂ crashes to 0 %. Grill flames die at about 15 %. Engines misfire and stop while O₂ falls through about 14 → 5 % |
| 2.4 s | **0 %.** Air pressure drops 23 %, so everyone's ears pop at once: people flinch with hands to their ears, birds scatter, the camera jolts, sound muffles |
| 2.4–6 s | The grill throws off white smoke (fat still cooks with no flame). The coals still glow (hot, not burning). The vendor tries a lighter: sparks, no flame. The battery grinder still spins, but its sparks turn short and dull. Coasting cars die |
| 6.2 s | A coasting car rear-ends the stalled car ahead, 14 m in front of you. The alarm and hazard lights keep going on battery |
| 6.6–8.9 s | **An electric car keeps driving**, overtaking the dead queue on the wrong side and passing the viewer |
| 9.3 s | **The power grid fails** (about 60 % of electricity comes from burning fuel). Shop lights die and traffic signals switch to battery-backup flashing red |
| 9.8–15 s | No feeling of suffocation, just dizziness. Tunnel vision and desaturation build, the viewer's knees start to give. From about 12 s (roughly 10 s without O₂) people around you slump and collapse; birds have already dropped |

---

## How to run it (no install needed)

1. Download or clone this folder.
2. **Double-click `index.html`.** It opens in Chrome.
   (If it opens in another browser, right-click → *Open with* → Google Chrome.)
3. Click the screen or press **Space** to play. The click also turns on the sound.

No server is needed. Three.js is bundled in `lib/`, so it works offline too.
With internet, the page also loads nicer web fonts (Inter / JetBrains Mono / Oswald).

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
js/fx/postprocessing.js    bloom, tone mapping, grade, vignette, hypoxia tunnel vision / edge blur
js/camera/cameraController.js   first-person head: path + bob + breathing + sway + startles + shake
js/audio/audioManager.js   fully synthesised soundtrack, rendered offline and kept in sync
js/ui/hud.js               O₂ readout, timer, typed log lines, 3D object annotations
js/ui/devControls.js       playback / scrub / debug / recording mode
tools/render-preview.cjs   optional frame-exact MP4 renderer
```

**To retime or restage anything, edit `js/scene/script.js`.** Each vehicle there says where it should end up (`stopS`) and how hard it brakes. The code works out where it has to start. A built-in check warns in the console if two cars would overlap.

## Science notes (what the simulation assumes)

These were checked by an independent science review pass; see the review summary in the session.

- Only **molecular O₂** vanishes. Water, rock, concrete and the oxygen inside your body stay where they are. Oceans stay. Buildings stand.
- The atmosphere loses O₂'s share of its **mass (about 23 %)**, so surface pressure drops about 23 %, like jumping to roughly 2 km altitude in a second. Water would boil at about 93 °C.
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
- **The power grid fails within seconds** (here about 7 s after zero). About 60 % of electricity comes from burning fuel; gas turbines flame out, and grid frequency collapses into a blackout. Traffic signals with battery backup fall back to flashing red. *To keep mains power on anyway, set `grid: { fail: null }` in `js/scene/script.js`.*
- **Hypoxia**: breathing O₂-free air pulls oxygen *out* of your blood, and there is **no feeling of suffocation**, because the urge to breathe comes from CO₂, which still leaves normally. People stay functional for roughly 10–15 s, then suddenly slump and lose consciousness at about 15–25 s. Phase 1 starts the first collapses at about 10 s, the fast end of that range.

## Recommendations for Phase 2 (from the reviews)

- **Put the viewer on the same clock as everyone else.** Planning a POV collapse at about 55 s, while everyone else drops at about 10–20 s, is the most likely "that's fake" comment. The viewer should pass out about 15–20 s after zero (about 18–23 s into the video). Then continue from the viewer's **dropped phone or body camera still recording on the pavement** (battery powered). That angle can show the aircraft, the blackout and the city.
- **Aircraft:** every engine flames out at once, and the sound goes from a roar to the whine of fans windmilling. A crash within about 30 s only works for a jet just after take-off (below about 500 m). From cruising altitude it takes minutes. **No fireball**, because fuel can't burn: show dust and spilled fuel mist instead. A helicopter dropping fast without power fits the timing better.
- **Global view:** night-side city lights go out in waves within seconds. No fires anywhere. The sky stays blue. The ozone layer can't be rebuilt, so UV-C reaches the ground within hours.
