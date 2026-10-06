# POV: This video is a game. Don't die. — production plan

A 51.6-second vertical (9:16, 1080×1920, 30 fps) fake-interactive RPG short on the shared engine. A trapped man inside
a facility notices you, the viewer, and needs your help to get out. The video is prerecorded, and it never says it can
read your finger, your phone's tilt or anything about you. It **asks** you to touch, tilt and tap at exact moments, and
the picture reacts there. Two mechanics are genuinely yours: the left/right choice, and the item roulette (a tap pauses
the video, so you can really stop on any item). You keep your own score of three hearts.

## 1. Rules

- **Nothing private.** No name, place, device, camera, battery, IP or account; no fake app buttons or logos. The fourth
  wall works through the *format*: the HUD, the frame edges, the captions zone and the glass of the screen.
- **No dead time.** Every 3–5 s brings a new mechanic. No line runs longer than ~1.3 s without movement or change.
- **Two visual languages.** The *game* HUD is clean off-white (Inter, small caps, drawn hearts and item icons). The
  *system* HUD is colder and more technical (JetBrains Mono, pale ice-blue, thin brackets), with no green code.
- **World vs screen effects.** World effects happen inside the picture (the glass ripple on the first touch, sparks,
  the alarm). Screen effects happen after rendering and bend everything, HUD and subtitles included: the full-frame
  ripple when he touches the screen, the crack, the reset freeze and reverse.

## 2. Safe zones and touch targets (design px, 1080 × 1920)

| Zone | Area | Why |
|---|---|---|
| Top bar | y < 200 | platform tabs / search |
| Right rail | x > 900, 700 < y < 1560 | like / comment / share buttons |
| Bottom | y > 1500 | username, description, progress bar |

Critical content stays inside x 60–900, y 220–1440. Speech subtitles sit at y ≈ 1340, below every touch target.

| Target | Screen point | Window | What reacts |
|---|---|---|---|
| His palm on the glass | (540, 1130) = 50 %, 59 % | 4.45–6.0 s (1.55 s) | glow under the point, glass ripple, particles, his hand recoils |
| HOLD HERE (door pad) | (540, 1150) = 50 %, 60 % | 17.6–20.6 s | progress ring 21→43→68→91→100 %, energy lines on the door |
| Choice labels | ◀ LEFT (300, 700) · RIGHT ▶ (780, 700) | 12.7–15.3 s | 3-2-1 ring at (540, 520), tilt instruction |
| Roulette card | centre (540, 900) | 22.9–25.9 s | 0.2 s per item: a pause really stops it |
| His fingertip through the crack | (540, 1056) = 50 %, 55 % | 44.2–45.6 s | contact flash, then the reset fails |

The camera is held perfectly still in every touch window (the `pov` track drops to 0), so the target never drifts. A
debug overlay (`?safe` in the URL) draws the platform zones and every target over the film.

## 3. Score

Start ❤❤❤. **Choice:** RIGHT = safe ✓ · LEFT = −1 ❤. **Item:** KEY = opens the escape hatch ✓ · SHIELD = blocks the
shot ✓ · MEDKIT = +1 ❤ (max 3) · LIGHT = useless here, −1 ❤. Default item if you never tapped: **SHIELD**.
Ending: ❤❤❤ PERFECT · ❤❤ SURVIVED · ❤ BARELY · 0 YOU DIED, then *what item did you get?*

## 4. Beat sheet (film seconds)

| Time | Beat | Picture | Text / speech |
|---|---|---|---|
| 0.0–0.5 | Boot | Black; a slit opens outward from his eyes: he is already staring into the lens through the glass | PLAYER DETECTED (0.12) · ❤❤❤ 3 LIVES (0.25) |
| 0.55–3.4 | Hook | Holding cell behind a glass wall; he steps closer, eyes locked on the lens | "Wait…" · "You can see me?" · **DON'T LET ME DIE.** |
| 3.4–8.3 | Touch | He walks to the glass, presses his palm flat on it at (540, 1130); a ring appears; camera dead still | PUT YOUR FINGER ON MY HAND → at 6.0: glow under the point, ripple through the glass, particles; his hand jolts · "Whoa…" · "I can feel you." |
| 7.9–11.8 | Witness | A technician comes in by the right door; he points straight into the lens; she looks where he points and sees nothing | "Who are you talking to?" · "Them." · "There's nobody there." |
| 11.8–15.3 | Alarm + choice | Red beacons; the glass wall lifts; the technician ducks out under it; both back doors slide open (left: red, steam; right: white); he waits between them | CHOOSE! ◀ LEFT · RIGHT ▶ · ring 3-2-1 · TILT YOUR PHONE TOWARD YOUR CHOICE |
| 15.3–17.0 | Result | The view leans and swings right (roll −9°), he sprints through the right door, you follow; the left corridor erupts in steam and sparks | RIGHT = SAFE ✓ · LEFT = −1 ❤ · keep your own score |
| 17.0–22.4 | Hold | A locked blast door; he slaps his palm on the jamb scanner, looks at you | "Help me." · HOLD HERE ring at (540, 1150) · 21 → 43 → 68 → 91 → 100 % · energy lines; the door lifts · "You're controlling this place." |
| 22.4–27.6 | Roulette | The core hall: he pops a supply case; a hologram above it cycles with the HUD card | TAP TO STOP ON YOUR ITEM · KEY / SHIELD / MEDKIT / LIGHT every 0.2 s for 2.2 s, slowing, lands on SHIELD · REMEMBER YOUR ITEM. (didn't tap? you got SHIELD) |
| 27.6–31.0 | Detected | The lights stutter, the hum drops; he reads the system text on your screen | EXTERNAL INPUT DETECTED · OBSERVER CONNECTION ACTIVE · "It knows you're here." (quiet) |
| 31.0–33.8 | The frame | He looks at the right edge of the frame, then at the bottom, then back at you; the camera holds unnaturally still | "What's outside my world?" |
| 33.8–37.7 | Item payoff | A security drone drops from the ceiling, scans him and the lens, charges, fires at you | WHAT ITEM DID YOU GET? — KEY → opens the hatch ✓ · SHIELD → blocks the shot ✓ · MEDKIT → +1 ❤ · LIGHT → useless here −1 ❤ |
| 37.7–41.4 | The screen | He runs at you and slams his palm on the screen: the **whole frame** ripples, HUD and subtitles included; he looks at his hand, then at you | RESET IN 5 · "No—" · "You're really there." · 4 |
| 41.4–43.6 | Crack | He hits the screen: a screen-space crack (fixed to the frame), shards drop away onto the black void behind the picture: wireframe rooms, bounding boxes, unused props, a camera frustum, floating lights, half-loaded chunks | RESET IN 3 · 2 |
| 43.6–47.8 | Final touch | He reaches through the hole as far as he can, fingertip at (540, 1056); a small target on it | "Put your finger here." · RESET IN 1 · contact at 45.6 → RESET— (freeze, reverse jitter) → EXTERNAL PLAYER OVERRIDE → RESET CANCELLED; he breathes out |
| 47.8–49.0 | Come back | Cut: close, calm light, a small smile | "Come back." |
| 49.0–51.6 | Score | The frame stays on him, dimmed | HOW MANY LIVES DO YOU HAVE LEFT? ❤❤❤ PERFECT · ❤❤ SURVIVED · ❤ BARELY · 0 YOU DIED · WHAT ITEM DID YOU GET? |

## 5. Fourth-wall escalation

1 you choose (the hook, the choice) · 2 he reacts to your touch · 3 he says you control the place · 4 the system detects
an external observer · 5 he looks at the frame's edges (where the app's buttons and captions are, never drawn) · 6 he
touches the video plane (whole-frame ripple) · 7 the screen cracks · 8 your touch cancels the reset.

## 6. NPC_AWARE_01

An ordinary man in a rust-orange zip jacket over a grey tee, dark trousers, white trainers. Hero head (eyes with
irises and catchlights, lids, brows, lips that part, smile and press) and hero hands (five fingers: flat, relaxed,
point, fist, reach). Eyes and head aim at the **camera lens** itself (the camera's world position), or at a point on
your screen (the system text, the right edge, the caption zone) as he sees it. Arc: confused → curious → amazed → reliant
→ afraid of the system → desperate → relieved. No voice: subtitles with soft dialogue blips, breath and silence.
The technician (NPC_02) looks *toward* the lens but focuses a metre past it: she sees no one.

## 7. Systems

`script.js` (every time, the camera, tracks) · `facility.js` (the cell, corridor, blast door, core hall, lights, alarm) ·
`npc.js` (hero face and hands, NPC_AWARE_01's performance, the technician) · `fx.js` (glass touch, steam and sparks,
door energy, hologram, drone) · `screen.js` (screen-space effects: ripple, crack + void, freeze/reverse, safe-zone
overlay) · `hud.js` (game HUD and system HUD) · `audio.js` · `film.js`.

## 8. Phone test

Before sign-off, play the preview on a real phone in the vertical player: touch the palm, tilt at zero, tap during
the roulette, keep score. Desktop preview is not enough (see section 2 for where each target must land).
