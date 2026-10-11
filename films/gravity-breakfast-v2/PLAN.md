# PLAN — "What If Gravity Doubled at Breakfast?" V2 (Cinematic Hybrid prototype)

V2 of the 30-second, 16:9 (1920×1080, 30 fps) visual experiment. V1 stays as it was (`gravity-breakfast.html`,
`films/gravity-breakfast/`). V2 lives in `films/gravity-breakfast-v2/` + `gravity-breakfast-v2.html`. **No shared engine
file is changed.** It was built from the owner's V2 brief (2026-10-11, "Cinematic Hybrid V2: polish and correct"):
keep the café, the amber/violet palette and the cinematography; fix the gravity HUD, the cartoon look, the glow and the
slow opening; make the struggle physically convincing; give every shot a new consequence.

## What V2 changes (vs V1)
- **One gravity state.** `gbG(t)` (script.js) is the only gravity value. The fountain, the lamps, the falling cups and
  the gauge all read it. The gauge is on screen from 0.35 s to the end line and never resets: 1.0 g before the drop, then
  a single needle swing to 2.0 g. V1 re-animated 1.0 → 2.0 g in the close-up, which read as gravity resetting.
- **Opening.** The title sits over the café interior from frame 1, with the hero already drinking. Gravity doubles at 3.0 s
  (V1: 5.6 s, after a 3 s exterior opener).
- **Characters.** Adult proportions: the head is about 80 % of V1's, oval with a jaw, a chin, cheekbones and a nose. Small almond
  eyes with large dark irises, thin dark brows, a fine lip line, slim dark glasses. Matte skin and cloth, a thin rim
  only, less saturated skin tones. Expression ranges are compressed in `applyFace` (restrained acting).
- **Glow.** Bloom 0.42 → 0.16 (threshold 1.05 → 1.3), exposure 1.08 → 1.0. Matte darker china with no rim. Less rim on
  people and the POV hands.
- **Struggle.** One close-up (no top-down, no ghost cup). He braces his left palm flat on the table, dips, and pulls. The cup
  rises 5 cm with a growing tremble and drops back (free fall in 2 g, clink, slosh). He leans in and uses both hands, and his
  head comes down to meet the cup for one sip. He sets it down carefully. Hand orientation comes from `orientHand` after IK.
- **Lamps.** The cord stretch is reduced to 3 cm (a cord spring under double weight), not a drop.

## 1. The rule
- At **3.0 s** gravity goes from 1.0 g to 2.0 g (0.12 s ramp). Everything else stays the same.
- What it shows: the cup slams down. His arm (about 4 kg) feels like 8 kg, so lifting a cup is slow work but possible.
  Standing means carrying twice his weight. Lamps swing at period ÷ √2. Fountain jets reach half height (h = v²/2g). Things
  fall faster. Balloons rise faster because buoyancy doubles too.

## 3. Shot list (V2)

| Time | Shot | Consequence shown |
|---|---|---|
| 0.0–4.15 | **S2 Medium**, interior, slow drift; title over it | breakfast, the sip; at 3.0 the drop: cup slams, splash, slump, glasses slide |
| 4.15–6.9 | **S3 Wide**, interior, tilt up to the lamp | the whole room: waiter buckles to a knee, lamps bounce, plants droop |
| 6.9–13.5 | **S4 Close-up** (one shot): rack focus hands → face; push into his eyes | the struggle: brace, failed lift, two-handed sip |
| 13.5–19.9 | **S5 POV** | standing is twice the work; the lamp swings fast; a cup slides off the tilted tray and smashes; the fountain through the window |
| 19.9–30.0 | **S6 Exterior wide → crane up** | fountain at half height (old height marked); the balloons escape faster into the sunrise; end line |

## 4. Sound cue markers
`GB_CUES` (script.js) lists every cue; `audio.js` schedules from `GB`: bed and motif 0.0; drop 3.0 (clunk, splash, creak,
slump, lamp twang, tray rattle); brace 7.2; attempt 1 7.95 with the clink at 9.15; attempt 2 9.9 (breaths and sip);
set-down 12.45; whoosh and heartbeat 12.75; eyes open 13.5; standing effort 14.1; lamp squeaks from 16.65; smash 18.155;
outside 19.9; balloons 23.4; resolve 26.4.

## 5. Systems / files
- `script.js` beats (`GB`), cues, SCRIPT (events, POV camera tracks, hands, HUD), CONFIG (1920×1080).
- `toon.js` stylised materials (rim light, soft roughness), helper geometry.
- `rig.js` `GbCharacter`: modular rig (pelvis, spine, chest, neck, head, arms, hands with fingers, legs), named poses
  blended by time with eases, additive layers (breath, tremble, impact springs), face controls (eyes, lids, pupils,
  brows, mouth shape, glasses).
- `cafe.js` the interior, the facade and the plaza (fountain, string lights, tree, balloons, pigeons).
- `shots.js` the shot cameras and transitions.
- `post.js` `GbPost` (DOF), `film.js` FILM hooks, HUD gauge, 16:9 resize, `audio.js` `GbAudio`.

## 6. Review log
(see section at the end, filled in honestly)
