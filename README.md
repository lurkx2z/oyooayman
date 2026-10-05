# What If Oxygen Suddenly Disappeared? — 3D first-person simulation

A vertical (9:16, 1080×1920, 30 fps) Three.js "What If?" cinematic built for TikTok / Shorts / Reels.
Everything is procedural, so there are no models, images or sound files to download.

**Status: Phase 1, the first 15 seconds.**

| Time | Beat |
|---|---|
| 0–2 s | Normal city street (traffic, grill flames, grinder sparks, birds). Hook title + O₂ HUD at 21.0 % |
| 2–3.2 s | O₂ counter crashes to 0 %. Flames die at about 15 % O₂. Air pressure drops 21 % (ears pop) |
| 3–6 s | Grill dead, grinder still spins (it's electric) but its sparks go dull, engines misfire |
| 6–10 s | Combustion traffic coasts and stalls, the bus dies, a fender-bender sets off a car alarm, an **electric car keeps driving** through the dead traffic |
| 10–15 s | Hypoxia: breathing and heartbeat, tunnel vision, desaturation; people stumble, kneel and collapse; birds fall |

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

- Only **molecular O₂** vanishes. Water, rock, concrete and the oxygen inside your body stay where they are.
- The atmosphere loses about 21 % of its molecules, so **air pressure drops about 21 %**, like being lifted to roughly 2 km altitude in an instant. Ears pop, and the sky gets slightly darker and deeper, since O₂ does part of the Rayleigh scattering.
- **Flames go out at roughly 15 % O₂**, before the counter even reaches zero. Hot coals keep glowing (they are hot) but slowly dim.
- **Combustion engines need O₂**: petrol and diesel cars, the bus and the motorbike misfire and die within about a second. They coast, the drivers brake, and electrics keep working: brake lights, hazard lights, the bus LED sign, shop lights, traffic signals and the car alarm.
- **Electric motors don't care**: the EV keeps driving, and the grinder keeps spinning. Its sparks change, though. Bright branching grinder sparks are steel *burning* in air, so without O₂ they are just short, dull bits of hot metal.
- **Hypoxia**: breathing O₂-free air pulls oxygen *out* of your blood, so collapse comes fast, typically within roughly 10–20 s for most people. The urge to breathe comes from CO₂, not O₂, so there is little sense of suffocation. Mostly it is dizziness, tunnel vision and confusion, then sudden collapse.
