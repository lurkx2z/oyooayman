# PLAN — "What If Gravity Doubled at Breakfast?" (Cinematic Hybrid prototype)

A **30-second, 16:9 (1920×1080, 30 fps) visual experiment**, not a channel episode. It tests the owner's "Cinematic
Hybrid" direction (2026-10-11): about 60 % of our immersive 3D simulation look (POV, physics, scale, atmosphere, serif
HUD) and 40 % of a long-form reference channel's storytelling (one simple stylised character, expressive acting,
intentional amber/violet lighting, varied camera: wide, medium, extreme close-up, top-down, POV, measurement overlays).

Everything lives in `films/gravity-breakfast/` + `gravity-breakfast.html`. **No shared engine file is changed.**
The 16:9 frame, depth of field and the character rig are all film-side:
- `film.js` replaces the page's `resize()` on the SceneManager instance with a 16:9 version (capture mode already
  honours `?w=1920&h=1080`), and sets `--u` = 1/1920 of the frame width so HUD sizes are in 1920-wide design px.
- `post.js` subclasses `PostProcessing` (`GbPost`) and injects a cheap depth-of-field term into the existing
  composite (it reuses the AO pass's view depth and the bloom blur pyramid; no second chain).
- `rig.js` is a new reusable stylised character (`GbCharacter`), separate from the locked `js/world/people.js` rig.

## 1. The rule
- At **5.6 s** gravity goes from 1.0 g to 2.0 g, everywhere, instantly. Everything else stays the same.
- Honest physics shown on screen:
  - a raised cup is pulled down twice as hard and slams onto the table; liquid sloshes lower and settles faster;
  - your body weighs twice as much: posture collapses, standing up is like squatting your own body weight;
  - a 0.35 kg cup now feels like 0.70 kg. **A cup is still liftable**: the struggle is shown as slow and shaky,
    not impossible (the caption makes the body, not the cup, the real problem);
  - pendant lamps drop and bounce on their cords, then swing faster (pendulum period ÷ √2);
  - a poured stream falls faster and gets thinner;
  - fountain jets reach **half** the height (same pump pressure → same nozzle speed; h = v² / 2g);
  - string lights and awnings sag further; pigeons have to flap harder and sink;
  - **helium balloons rise faster** (buoyancy is the weight of the displaced air, which doubles too): the payoff.

## 2. The places
- One café corner at **sunrise** ("breakfast"): violet-blue sky, a low amber sun behind the plaza, amber practicals.
- Interior (x −5…5, z −3.5…3.5, 3.2 m high): window wall at z = −3.5 with mullioned windows and a door, wainscot, plank
  floor, counter + shelves + espresso machine at the back, three pendant lamps, small round tables.
- Exterior: sidewalk, the café facade with a striped awning and string lights, a small plaza with a round fountain,
  one tree, a bench, a balloon vendor, pigeons, low townhouses behind (lit windows), a sun disc on the horizon.
  (No cars, cranes, airplanes or collapsing buildings.)

## 3. Shot list (story seconds = film seconds; no edit)

| Time | Shot | What we SEE | What we HEAR | HUD / caption |
|---|---|---|---|---|
| 0.0–3.0 | **S1 Establishing wide**, exterior, slow push + crane down | Plaza at sunrise, tall fountain jets, amber café windows, our character visible at the window table | birds, fountain, soft café bed, music (warm plucks) | centred serif title |
| 3.0–5.6 | **S2 Medium**, interior 3/4 front, slow drift | He sips, smiles, lifts the cup for another sip | cup clink, room tone | — |
| 5.6–10.0 | **S3 Medium wide → push**, interior | Gravity doubles: camera dips, cup slams down, coffee splashes, chair creaks and sinks, posture collapses, glasses slide down his nose; lamps bounce; he tries to straighten up | low gravity "drop" hit, cup clunk, splash, chair creak, body slump, lamps' cords twang | readout GRAVITY 1.0 → 2.0 g |
| 10.0–15.6 | **S4 Extreme close-up**, cup + hand at table height, face blurred behind; rack focus to the face | He tries to lift the cup: slow, shaky, ghost cup shows the 1 g lift; gauge animates 1.0 g → 2.0 g; rack focus to his strained face | strain breaths, ceramic scrape, gauge ticks | gauge; captions |
| 15.6–16.3 | **Transition** | Push into his dark face; frame goes dark; eyelids open into POV | whoosh, heartbeat | — |
| 16.3–23.0 | **S5 POV** (our immersive style, his hands) | Hands press the table, he tries to stand (heavy, shaky, sinks back); looks up at a lamp hanging low and swinging fast; the barista's pour falls fast and thin; turns to the window: the fountain is short | effort breaths, creak, lamp swing, pour | caption |
| 23.0–30.0 | **S6 Wide reveal**, exterior crane up and back | Fountain at half height (dotted line marks the old height), sagging string lights swinging, awning sagging, pigeons struggling, a jogger on her knees, the vendor's balloons escaping and shooting up | wind, fountain lower pitch, balloon rubbing, music resolves | captions, end line |

**Top-down shot:** S4 opens on a 1.2 s top-down insert of the table (cup ring + spilled coffee) before the side close-up.

## 4. Sound cue markers
Every cue is also in `SCRIPT.events` (dev-bar ticks) and `GB_CUES` (read by `audio.js`):

| t | cue |
|---|---|
| 0.0 | room tone + birds + fountain bed; warm pluck motif |
| 3.0 | cut inside (exterior bed ducks) |
| 3.5 | sip |
| 5.6 | **G-drop** (sub hit + pressure swell), cup clunk 5.72, splash 5.75, chair creak 5.8, slump 5.95 |
| 6.1 | lamp cords twang / swing creaks |
| 10.0 | cut to close-up (room ducks), gauge ticks 10.4–11.6 |
| 11.0–14.8 | strain breaths, ceramic scrape |
| 15.6 | push-in whoosh, heartbeat 15.9 |
| 16.3 | eyes open (air) |
| 17.0–19.0 | effort, chair creak |
| 20.0 | lamp swing |
| 21.0 | pour |
| 23.0 | cut outside: wind, fountain (lower), birds flapping |
| 25.5 | balloons released (rubber squeak, whoosh up) |
| 28.0 | music resolve chord |

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
