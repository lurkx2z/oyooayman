# Style bible — the channel look

> The measured calibration against the two external references lives in `docs/art-direction.md`. This file holds the
> rules that came out of it plus everything learned since. Look at the frames in `docs/reference/` while reading.
> When this file and an episode brief disagree, the brief wins for that episode. The brief does **not** win on "make it
> photoreal", "make it a mobile game" or "rebuild the engine".

## 1. The target in one sentence

**A polished cinematic low-poly first-person simulation:** modern stylised rendering, older-game simplicity and strong
atmospheric depth. About **70 % "POV What If"** (polish, selective gloss, first-person body, clean HUD, serif narration,
optical framing, localised intense colour) and **30 % Omaha** (fog depth, dark foregrounds, grounding, irregularity,
seriousness). When the two references conflict, **prefer the POV What If reference**.

The owner's summary: *"clean enough to look polished, simple enough to render fast, atmospheric enough to look
cinematic."*

## 2. How we got here (so nobody re-litigates it)

| Pass | Direction | Owner's verdict |
|---|---|---|
| Oxygen v1 | bright blue sky, colourful, clean, lots of labels | world density 8/10 and assets 7.5/10, but atmosphere 5, palette 5, reference match 6–6.5. *"too bright, clean and informational"*, *"WAY too much text"* |
| Visual pass 2 | overcast, fog, desaturated 20–30 %, fire the only warm accent, text cut ≥ 50 %, serif captions | *"same general family … not yet the same graphical feel"*, 6.5. *"Pale/white fog"*, *"clean modern low-poly + grey filter"* |
| Visual pass 3 | darker values, darker greener fog, AO, darker ground, older-game materials, grain | 6.8–7 vs Omaha. *"Don't let Claude keep endlessly tweaking saturation and darkness"*. The remaining gap: **authored assets + composition** |
| V4 (shipped look) | real reference frames supplied; **70/30 hybrid**; selective gloss; authored people silhouettes; facade dressing; uneven haze; top-left label/value HUD; serif narration; rounded vignette | ~7/10. *"The Omaha-only direction was beginning to make it too grey and dirty"* |

**Locked conclusions:**
- Fog amount and grade were "solved" by V3/V4. Don't keep darkening or desaturating.
- What still separates us from the references is **authored silhouettes and composition**, not post-processing.
- **Muted, not monochrome.**

## 3. Value structure

- **Overcast daylight default:** midtones ≈ 70–85 / 255, foreground shadows 15–35, haze and sky 140–170.
- **Depth reads as dark near → readable middle → light hazy far.** Big dark foreground shapes (a facade edge, a pole, a
  car, a person crossing) against a lit midground event and a hazy distance.
- Don't crush blacks. Keep detail inside dark areas (`blackLift` ≈ 0.008–0.014).
- Night episodes (Andromeda, Moon) and interiors (Depersonalization, Game) keep the same idea: dark foreground
  silhouettes against a lit subject.

## 4. Palette

- **World:** grey-blue sky, muted buildings (dirty cream, muted brick, beige-grey, stone, sage), dark muted green
  vegetation, charcoal road, desaturated cars. Example oxygen wall colours (`js/world/environment.js`): red brick
  `[122,80,66]`, tan brick `[150,132,110]`, cream `[190,184,168]`, stone `[150,148,142]`, modern `[84,88,92]`.
- **Accents: strong, purposeful, localised.** Fire, sparks, traffic signals, hazards, brake lights, emergency lights,
  electricity (blue-white), Titan steam (orange-white), HUD amber `#ffd7a8`. Accents are where the eye goes; keep them few.
- **Story through colour:** in Oxygen the only warm thing (the grill fire) dies and the picture gets perceptibly colder.
  Use colour change as storytelling (sunset in Before Screens, cold grade in the countdown, a white flash on impact).
- Saturation target in neutral scenes ≈ 0.22–0.35 (POV reference ≈ 0.33; Omaha ≈ 0.11–0.28). Grades push
  `saturation` 0.84–1.3 depending on the scene's base colours. Measure; don't guess.
- **Historical/warm episodes are not sepia.** The Before Screens brief: green grass, blue sky, warm sun, colourful kites.

## 5. Fog and atmosphere

- Shared fog = `installFog()` in `js/fx/fog.js`: **plain exponential** (three's FogExp2 is squared and slams far objects
  into a wall), **uneven** (slow world-space banks + denser ground haze), and **capped** (default 0.9) so far silhouettes
  survive. Rule: *lose DETAIL first, SILHOUETTE later.*
- Fog colour must match the sky at the horizon. Grey-green / grey-blue, **not milky white**.
- Typical `scene.fog = new THREE.FogExp2(color, density)` densities actually used:

  | Scene | Density |
  |---|---|
  | Oxygen overcast city | 0.0039 |
  | Slip rainy street | 0.0026 |
  | Slip coast (so the far wave reads) | 0.00042 |
  | Friction sunny hill | 0.0008 |
  | Air sunny | 0.0012 |
  | Sim sunny | 0.0011 |
  | Before Screens town | 0.0062 |
  | Crossover battlefield | 0.0032 |
  | Apartment interior | 0.016 |
  | Night sky scenes | 0.00018–0.00026 |

- `installFog` options per film: `bankScale, bankAmount, lowHeight, lowAmount, cap` (Before Screens
  `{0.018, 0.3, 7, 0.45, 0.82}`, Crossover `{0.02, 0.5, 6, 0.9, 0.92}`).
  **Gotcha:** `installFog` runs once per page and the first call wins. `js/world/environment.js` calls `installFog()`
  with defaults when it loads, so a film that loads environment.js gets the defaults unless it calls `installFog(...)`
  before environment.js in the page.
- Local structure helps more than more density: haze cards between blocks (`Environment._hazeCards`), smoke columns,
  dust motes, rain streaks.
- Telephoto shots see through less air. Slip thinned the fog in the wave's own shaders (a `uFogMul` injected in shader
  text, because three overwrites fog uniforms every frame) so a distant wave line could read.
- **Fog cannot hide bad assets.** It helped, but the owner still saw mannequin people and procedural facades through it.

## 6. Lighting

- `DirectionalLight` sun (PCF shadows; `PCFSoftShadowMap` was removed in r186), plus a `HemisphereLight`, plus a PMREM
  environment from the sky for reflections. Avoid flat default Three.js lighting.
- Overcast: soft, behind-left sun; deeper shadows; fill. In V3 a backlit sun made everything muddy. Moving it
  behind-left plus fill fixed it.
- Sunny episodes (Friction, Sim, Air): warm key (`#ffe4bc`-ish, ~4.4), a blue sky gradient (`#4a90d9` → `#c4dcf0`),
  low fog. Put the sun **behind the camera** for readability; an early Friction render was dark because the street sat
  in building shadow.
- **Emissive accents light their surroundings** (fire light, phone screens, siren lights, lightning) through point
  lights or the grade. Cap them: one warm light at 300× once blew out a crossover frame.
- Shadow camera box: follow the subject (`focus(x,z,r)` patterns in Crossover and Friction) so 2048–4096 maps stay sharp
  where it matters.

## 7. Materials

- Applied once after build by `Look.apply(scene, camera)` (`js/fx/look.js`):
  - **Environment matte:** roughness ≥ 0.75 (concrete, walls, road, foliage), env reflections halved.
  - **Selective gloss:** car paint 0.42–0.6 with clearcoat 0.3; glass ≤ 0.12 with env 1.1; metal 0.25–0.5.
  - **Grime:** world-space low-frequency dirt (patchy ground, replaced slabs, damp patches, darker wall bases, slow tone
    drift between buildings). People and the first-person hands are skipped.
- Older-game character: modest texture resolution (anisotropy capped at 2), soft canvas textures, no photoreal textures,
  no pixel art.
- Wet surfaces (Slip): planar mirror reflection sampled through a puddle mask, rain ripples, darker albedo. Huge
  production value for the cost.
- Don't mix photoreal textures with simple meshes. Everything belongs to one world.

## 8. Post-processing (one custom chain, `js/fx/postprocessing.js`)

Pipeline: MSAA HalfFloat scene + depth → half-res AO (faded with fog distance) → blur pyramid → composite with ACES,
grade, vignette, tunnel, grain, fade and flash.

Defaults: `exposure 1, bloom 0.22 (threshold 1.6), saturation 1.22, contrast 1.06, vignette 1.0, soft 0.1,
blackLift 0.008, grain 0.022, ao 1.0`.

Each film overrides them in `FILM.grade(t, p)`, which runs every frame. Real values:

| Film | exposure | saturation | contrast | warmth | vignette | bloom (thr) | grain | ao |
|---|---|---|---|---|---|---|---|---|
| Friction (sunny) | 1.12 | 1.26 | 1.1 | 0.08 | 0.45 | 0.24 (1.4) | 0.02 | 0.55 |
| Slip street (rain) | 1.12 | 0.86 | 1.12 | −0.05 | 0.42 | 0.32 (0.85) | 0.035 | 0.45 |
| Slip underground | 1.0 | 1.05 | 1.16 | −0.02 | 0.6 | 0.35 (0.75) | 0.035 | 0.45 |

- **Vignette:** moderate rounded-rectangle with soft edges (the POV reference's visor), never binoculars.
- **Grain:** subtle (0.02–0.035).
- **Bloom:** restrained; only HDR-bright things (fire, lights, foam highlights).
- **No** chromatic aberration (except one-frame impulses on a hit), no VHS, no scanlines, no heavy blur.
- **Story effects live in the grade:** hypoxia tunnel and desaturation (Oxygen), countdown vignette and heartbeat
  pulses (Friction), a white flash for 2–3 frames on a big event (not a long white-out), a dip to black on a scene
  change, `smear` (camera-lag trail) on whip pans, disabled across cuts.
- AO halos around thin objects happened in Depersonalization. Use `ao` 0.4–0.55 in close interiors.

## 9. Typography and HUD (see also `VIDEO_FORMAT.md` § captions/HUD)

- Fonts: **Lora** (title, captions, HUD values), **Inter** (HUD labels and small caps), Oswald and JetBrains Mono (signs,
  special UI). All bundled in `fonts/fonts.css`. Off-white `--paper: #ebe6dc`, never pure #FFFFFF for narration.
- **Title:** large centred serif question, 2–3 lines, **in the middle of the screen**, over active visuals, a soft dark
  radial backdrop (`.story-title.big.center`), no opaque box. Typical: hero line 84–106 u, top ≈ 760–790 u.
- **Top-left info block:** tiny letter-spaced caps label → big serif number → small secondary line → tiny context caps.
  The POV reference pattern: `DEPTH / 2,498 km / 1,552 miles / UPPER MANTLE`. Later films enlarged it for phones
  (label 28–38 u, value 84–104 u) on a faint dark plate.
- **Captions:** one short line at a time (4–9 words). Book serif. A dark plate behind them once the scene is busy
  (70 % box in Slip). Top ≈ 1300–1400 u. Inside the safe zone (left of the right-hand button rail, above the bottom
  description).
- **Never** label every object. The world tells the story; the HUD carries one or two precise numbers.

## 10. People (`js/world/people.js`)

- Authored low-poly parts, **not capsules**:
  - tapered faceted limbs with joint caps; shoes with soles;
  - 3 builds (avg / broad / slim, with a real shoulder width);
  - clothing layers (jacket, coat, collar, hood) and accessories (backpack, shoulder bag, scarf, beanie, cap, hard hat,
    ponytail, bun).
- **Silhouette carries quality** (the Omaha soldiers are simple but have helmets, packs and straps). Faces are optional;
  hero faces exist (`js/world/heroes.js`: eyes that aim at the lens, lids, brows, lips) for close-ups.
- Muted clothing. Never animate a crowd in sync: stagger reaction times, vary speed and stride.
- Close-ups are still the weakest point. The owner's main remaining critique of every episode: *"the people still look
  AI-procedural"*. Keep people at mid-distance unless the shot needs a face, and give hero characters extra parts.

## 11. First-person body

- The POV reference proves a good first-person body adds huge immersion. **A bad hand is worse than no hand.** The owner
  said this twice; the early blocky mitten hand was removed.
- Current arms: `js/camera/viewerHands.js`. An authored smooth-shaded arm (sleeve, cuff, wrist, palm with thenar pad,
  three-segment fingers with nails, two-joint thumb, optional watch) posed by wrist position + finger direction +
  palm normal + curls. Keep them **muted, darker, well shaded, not dominant**.
- Legs and shoes are per-film (Friction `FrLegs`, Slip `SlLegs`). Only show them when the camera looks down.
- Skin-tone nails (`#c99c84`-ish). Pale nails read as fake.

## 12. Trees, vehicles, props

- **Trees:** clean low-poly crowns of a few large faceted puffs (round and columnar variants), darker underneath,
  a vertex-colour gradient, 2–3 branches (`Environment._tree`). **Not** spheres on sticks; **not** piles of random
  triangle shards (that was the V3 tree, rejected).
- **Vehicles:** `VehicleFactory` profile-extruded bodies (sedan, hatch, suv, pickup, van, ev, taxi, bus, moto) with
  sloped glass, wheels and lights. Satin paint with clearcoat. Variety of types and muted colours; never identical cars
  everywhere. Spoke decals or blur discs when a wheel's spin must read (Friction).
- **Props:** facade dressing near the camera (window reveals, sills, AC units, fire escapes, drainpipes, blade signs,
  awnings). Streets are never perfectly clean: grime, patches, puddles, bins, cones.

## 13. Composition (9:16)

- **Foreground / midground / background / far** in nearly every shot: a dark shape partly blocking the frame, one clear
  event, life behind, hazy distance.
- Asymmetric framing. Don't centre every event. Turn the camera to reveal a new depth layer.
- **Keep the subject big.** Reviewers repeatedly flagged events in a thin band at 50–70 % height with empty pavement in
  the bottom third. Subject ≥ 15 % of frame height, inside the central ~50 %; use telephoto squints for distant events.
- Progression: the shot sequence must move (grill → street → city → planet). Don't park on one subject.
- Leave clean space for the title in the first seconds and for captions at the bottom.

## 14. Phone readability

- Design at 1080 × 1920; check stills at 540 × 960 and at a thumbnail size.
- **Safe zones** (design px, from the Game film's platform audit):
  - nothing important above y 200 (top bar);
  - nothing important right of x 900 between y 700 and 1560 (the button rail);
  - nothing important below y 1500 (description).
  The Game page has `?safe` to draw them.
- HUD text big enough: labels ≥ 26 u, values ≥ 80 u in the newer films. Reviewers could not read the old 19 u labels.
- Captions on a plate when the background is bright (crosswalks and beige roads washed them out in Friction v1).

## 15. WHAT NOT TO DO

- ❌ Roblox / toy look: saturated primaries, blocky capsule people, mitten hands.
- ❌ Primitive Three.js demo: default lighting, untextured boxes, perfectly regular window grids, spheres on sticks.
- ❌ Bright mobile-game visuals: cheerful blue sky with saturated everything (Oxygen v1).
- ❌ Photoreal mismatch: photo textures on low-poly meshes.
- ❌ Grey sludge: everything desaturated and dark (V3 drifted here; the owner pulled it back).
- ❌ Excessive or milky fog: fog that whitens the background or hides the scene. Keep silhouettes.
- ❌ Cheap procedural hands, floating limbs, clipping fingers, z-fighting joint spheres.
- ❌ Perfectly clean streets and facades.
- ❌ Inconsistent asset styles (one high-detail hero in a box world, or vice versa).
- ❌ Infographic overlays: floating labels on objects, many readouts at once, giant bold TikTok text.
- ❌ Arcade VFX: explosions on every touch, screen-filling particles, giant anime lightning everywhere.
- ❌ Gore (every brief bans it).
- ❌ Real logos, trademarks, platform UI, real insignia (generic armies, generic notifications).
