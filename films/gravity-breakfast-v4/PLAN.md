# PLAN — "What If Gravity Doubled at Breakfast?" V3 (Cinematic Hybrid prototype, visual quality pass)

A **30-second, 16:9 (1920×1080, 30 fps) visual experiment**, not a channel episode. V3 is a separate copy of V2
(`films/gravity-breakfast-v3/` + `gravity-breakfast-v3.html`); V1 and V2 are untouched. No shared engine file is changed.

V3 answers the owner's V2 review (7.5/10): animation still stiff, the cup lift did not read as heavy, the waiter and
tray were stiff at 18 s, the camera looked at a ceiling lamp while the caption said "things fall faster", a large black
mask at ~14.4 s, and the outdoor plaza looked like a low-poly placeholder.

## 1. The rule (unchanged)
- At **3.0 s** gravity goes from 1.0 g to 2.0 g and stays there. `gbG(t)` is the one gravity value for the physics,
  the gauge and the captions; the gauge never resets.
- On screen: the raised cup slams down; his arm (≈4 kg) feels like 8 kg; standing is like carrying a second you; a cup
  dropped from a tray falls in 0.24 s instead of 0.34 s; fountain jets reach half the height (h = v²/2g); balloons
  climb ≈√2 faster (buoyancy doubles with the weight of the air).

## 2. What changed in V3
- **Cup acting (7.2–12.75 s):** the right hand leaves the table on an arc with the fingers opening, slows into the
  handle and the fingers close round it (7.95–8.15 s) **before** the cup moves. The wrist target and the hand's
  orientation are computed from the cup's own frame (`GB_GRIP_WRIST` in `cast.js`), so the fingers stay on the handle
  while it moves. Attempt 1: the cup sticks for a beat (saucer rattles), breaks free 5 cm with a growing tremble, the
  right shoulder hunches; it slips back, followed by a small frustrated head shake. Attempt 2: both hands, the sip,
  set down, relief (shoulders drop), the fingers open and the hand lifts off the handle.
- **Rig fix:** `orientHand` turned palms the wrong way (the V2 brace hand lay palm-up). Fixed in the V3 copy of
  `rig.js`; the brace hand now presses palm-down.
- **Falling cup (S5b, 16.35–19.2 s)** replaces the lamp look: a low floor-level camera in front of the waiter. She
  fights her way up from her knees, her arms give, the tray tips and a cup slides off. Slow motion (scene clock rate
  0.3, `gbScene` in `script.js`), a strobe trail every 0.06 s (the gaps grow: it accelerates), a faint 1 g ghost
  released beside it (tags "2 g" / "1 g · NORMAL"), a contact shadow that darkens as it nears the floor, the smash
  (shards, the handle and base intact, coffee drops on 2 g arcs, a puddle), then the camera tilts up to her wince.
  The gauge line reads the measured numbers ("0.6 m IN 0.24 s · AT 1 g: 0.34 s").
- **Transition:** the push into his eyes dips to 50 % at most; one short partial blink; no second blink (the V2
  black mask at ~14.4 s is gone).
- **Title:** sits left of centre; the opening frame aims slightly to his right so the title never covers his face.
- **Plaza (`plaza.js`, new):** the townhouse rows, side wings and a receding street rebuilt as individual houses:
  ground-floor shops with signs and awnings, framed and arched windows, shutters, window boxes, balconies, string
  courses and cornices, gable/mansard/flat roofs with chimneys and dormers, two skyline layers with a bell tower and a
  dome; lanterns, bollards, terrace tables, a bicycle, a kiosk, planters, more trees. Meshes merged per material.
- **Fountain:** calmer water (much less glow), a foam ring where the ring jets land (its radius follows the physics),
  ripple rings, a foam crown on the upper bowl, a little mist. **Balloons:** teardrop shapes with knots, 16-point
  strings that bow when held and trail with a travelling wave when free, a jerk upward at the gravity hit (buoyancy
  doubles), the vendor's arm sinking and his fingers opening at the release.
- **Outside is two shots:** S6a the fountain up close with the 1 g height marked; S6b the vendor and the crane up.

## 3. Shot list (story seconds)

| Time | Shot | What we see |
|---|---|---|
| 0.0–4.15 | S2 interior medium | Title left of him; first sip; he lifts the cup again; **3.0 s gravity doubles**: cup slams, splash, chair sinks |
| 4.15–6.9 | S3 interior wide | The whole room reacts: lamps bounce, the waiter buckles to her knees, he sags |
| 6.9–13.4 | S4 close-up | Brace, reach, grip, attempt 1 fails, two hands, sip, relief; rack focus; push into his eyes |
| 13.4–16.35 | S5 POV | He tries to stand, rises, sinks back |
| 16.35–19.2 | S5b floor level | The waiter's tray tips; the cup falls in slow motion beside a 1 g ghost; smash; her wince |
| 19.2–22.6 | S6a fountain | Jets at half height, "BEFORE · 1 g" line and "NOW · 2 g ½ height" |
| 22.6–30.0 | S6b vendor, crane up | His grip fails at 23.6 s; the balloons climb fast into the sunrise; end line 26.6 s |

## 4. Sound
`GB_CUES` in `script.js` lists every cue (`audio.js` reads `GB`). New in V3: a ceramic tick at the grip, the scrape
when attempt 1 breaks free, the tray rattle and her strained breath, a falling low whoosh under the slow motion, the
smash (crunch + thump) at 18.427 s (= `cast.smashT`, probed), shards skittering, outside bed from 19.2 s.

## 5. Files
`script.js` beats, slow-motion clock, POV, captions, cues · `shots.js` cameras · `cast.js` hero grip and acting,
waiter and the falling cup, plaza people, balloons · `rig.js` character rig (palm fix) · `cafe.js` café + fountain ·
`plaza.js` V3 town rebuild, dressing, fountain polish · `film.js` HUD, tags, grade · `post.js` DOF · `audio.js` sound.

## 6. Review log
- V3 checked in stills shot by shot (grip close-ups from a side camera, the fall at ten times, every outdoor shot).
  Still weak: the falling cup is small in frame at its start; the fountain spray still reads partly as particles; the
  waiter's arms are stiff while she holds the tray (IK on the tray handles); the hand release lifts a little high.
