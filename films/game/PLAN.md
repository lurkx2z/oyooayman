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

## 9. Review log

**Independent review 1** (retention + normal viewer, on the 15 fps preview). Hook 5 · interaction clarity 7 ·
fourth-wall 6 · retention 5 · scoring clarity 3 · visual quality 4. Swipe risk at 9 s (back of his head, small
captions); scoring broken (the HUD faded hearts, so everyone read 1 life); the roulette landed on a gold SHIELD that
overwrote a tapper's item; the final fingertip read as "shh"; RESET CANCELLED too small to read.

**Independent review 2** (cinematography + game design). Visual 5 · UI clarity 6 · safe-zone compliance 6 · game-design
clarity 5. UI over his face (loading text, crack centre, fingertip ring, system text); DON'T LET ME DIE, RIGHT ▶ and
the item table into the right rail; drone in the top bar; the steam blast never in frame; the void filled the whole
screen instead of reading as a hole.

**Fixed after the reviews**
- Hearts: the game never takes one; a callout beside them says when to count (WENT LEFT? −1 · LIGHT? −1 · MEDKIT? +1).
- Roulette: card above his head, away from the pause icon; ends on "?" — YOUR ITEM = WHERE YOU STOPPED — with the
  fallback (didn't tap → SHIELD) on a dark plate.
- Safe zones: DON'T LET ME DIE on two lines, the door labels and the item table inside x 90–890, the drone lowered.
- Item payoff: he faces you, the table sits under his chin, the shot is caught by a hex shield (the default item).
- Hook: lines tightened (DON'T LET ME DIE by 1.9 s), a push-in, a cold light behind him, the loading text in the bar.
- Witness: closer two-shot, the point at the lens, the technician's eyes search a metre past the lens, off to the side.
- Choice: the left door erupts while it is still in frame; the swing right follows.
- First touch: 1.3 s window; the reaction lives in the glass only (no HUD burst), so the later screen ripple reads as
  the screen.
- Screen: a second pat so the subtitle visibly bends; the crack lands on his chest (a smaller hole with him in the
  void, the cracked picture around it, bolder lines); the fingertip reaches up from below his chin, pad to the glass;
  RESET CANCELLED large, above his head, held 1.1 s.

**Current honest ratings (self, after fixes):** hook 7 · interaction clarity 8 · fourth-wall 7.5 · retention 7 ·
scoring clarity 8 · visual quality 6.5. The main gap left is the characters' low-poly bodies in close-ups.

**Still to do by a person:** play it on a real phone in the vertical player and physically touch, tilt, tap the
roulette and keep score (section 8).
