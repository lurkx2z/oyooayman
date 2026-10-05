# Art direction — reference calibration

Target: **a polished cinematic low-poly first-person simulation**.
About 70 % the "POV What If" fall-through-Earth reference (overall look, polish, POV presentation, UI, colour, VFX),
30 % the Omaha reference (fog depth, dark foregrounds, grounding, irregularity, seriousness).
Do not copy either reference's content. Extract only the rendering language.

Measured on the supplied frames (512×910 Omaha, 360×640 POV crops) against V3 renders (540×960),
central 94 % of each frame, 0–255 luma.

| frame | p5 | p50 | p95 | mean saturation | strongly coloured px | fine detail* |
|---|---|---|---|---|---|---|
| Omaha bunker window | 44 | 85 | 131 | 0.11 | 0 % | 1.7 |
| Omaha interior | 23 | 51 | 163 | 0.11 | 0 % | 2.2 |
| Omaha binoculars, ships | (mask) | 85 | 146 | 0.24 | 0 % | 1.3 |
| POV 0 m | 40 | 77 | 154 | 0.35 | 12 % | 2.7 |
| POV 136 m | 29 | 68 | 116 | 0.32 | 5 % | 1.9 |
| POV surface | 43 | 78 | 171 | 0.34 | 10 % | 2.2 |
| POV upper mantle | 19 | 54 | 153 | 0.69 | 50 % | 3.3 |
| **V3** 0.7 s / 6.9 s / 13.2 s | 31 / 15 / 9 | 75 / 63 / 66 | 148 / 130 / 137 | 0.14–0.18 | 0–2 % | **3.1–3.7** |

\*mean absolute difference from a 1.2 px blur: grain plus sharp texture detail. Both references are also TikTok-compressed,
which removes some fine detail, so their real values are a little higher.

## 1. Value structure
- **Omaha:** dark, but not black. Its foreground walls sit at 25–45 and fill half the frame; the window "event" is 85–130; fog and sky peak at 130–165.
  Separation comes from big flat foreground planes against a lighter hazy opening.
- **POV:** midtones 55–80, with highlights on the suit and in the sky up to 150–230. Black lives only in the visor vignette.
- **V3:** shadows are about right (10–30) but **midtones are too low (58–75 against 70–85 in both references)**. The image reads as a "dark filter", not as
  dark foreground shapes against a readable world.

## 2. Fog
- **Omaha:** a light grey-green to grey-blue haze (window fog ≈ 150–165, slightly green), soft, with strong falloff past the midground.
  Silhouettes (ships, smoke columns) survive as dark shapes on the horizon. The haze is **uneven**: smoke columns and banks give it local structure.
- **POV:** dust motes and soft radial haze. Atmosphere is mainly local light and particles.
- **V3:** hue and density are about right; it is darker than Omaha's haze and **perfectly uniform**, a single mathematical fog field.

## 3. Material character
- **Omaha:** flat, nearly untextured planes. Character comes from faint formwork lines on the concrete, soft gradients and grain. Fully matte.
- **POV:** smooth shading and **selective gloss**: glossy black boots, satin white/grey suit plates, orange bands, readable speculars.
  The environment (rock, soil, grass) is matte with low-frequency blotches.
- **V3:** everything equally matte. The grime pass works, but facades are crisp, regular procedural textures,
  and nothing has a readable highlight, so there is no "authored hero object" sheen.

## 4. Geometry and silhouettes
- Both references are **low-poly**. Omaha's soldiers are dark stick figures; the foreground gunner is about 10 flat shapes with a faint rim light.
  The POV suit is a few cylinders with bevels and bands.
- Silhouette complexity comes from **designed parts**: helmets, packs, straps and weapons in Omaha; boot soles, cuffs, stripe bands and gloves in POV.
  It also comes from **layered architecture**: the stepped window recess, beams, ledges.
- **V3 looks procedural because:**
  - people are capsule tubes with sphere heads and mitten hands, the same proportions throughout, clothing as flat colour fills;
  - buildings are boxes with **textured** window grids at perfectly regular spacing, with no recess, ledge, roof clutter or pipe to break the outline.

## 5. Composition
- **Omaha:** a huge dark foreground frame (bunker wall or window, the gunner, the MG), one clear midground event inside it, and a hazy far layer. Lots of empty dark space; asymmetric.
- **POV:** strongly centred, deep perspective; the body anchors the bottom of the frame; text sits in clean zones.
- **V3:** an open street view with no framing device. The grill sits at centre-left from 0 to 7 s and again from 9.5 to 15 s, so the sequence never progresses to the street or the city.

## 6. Colour
- **Omaha:** saturation ≈ 0.11–0.28; warm-grey concrete, grey-green sea and fog, tan sand, one small warm fire or lamp accent.
- **POV:** saturation ≈ 0.32–0.35 even in "neutral" scenes (warm browns, greens, peach sky), and **0.69** when the environment calls for it (orange mantle).
  Accents are intense but localised.
- **V3:** 0.14–0.18: **too grey**, cool grey-green everywhere. The fire is the only accent, and traffic and hazard lights hardly read.

## 7. Image character
- **Omaha:** soft, subtle grain, slight lens dirt, low local contrast.
- **POV:** clean and soft, with a **moderate rounded-rectangle visor vignette** (blurred dark edges) and floating dust motes.
- **V3:** **crisper and noisier than both** (fine detail 3.1–3.7 against 1.3–2.9); grain too strong; the vignette is weak and generic.

## 8. Typography
- Both use one consistent **top-left info block**: a tiny letter-spaced caps label, then the value.
  - **POV:** label `DEPTH` (≈ 21 px at 1080 wide), value in **serif** (≈ 55–65 px), secondary unit line (≈ 30 px, grey), context caps (≈ 18 px).
  - **Omaha:** `OMAHA BEACH` caps (≈ 23 px), a thin rule, then the time and date (≈ 30 px).
- Narration is a sturdy book serif (Lora-like):
  - **POV:** *italic*, ≈ 48 px, centred at ~69 % of the height;
  - **Omaha:** upright, ≈ 46 px, near the top.
- POV title: upright serif, two lines, ≈ 72 px, centred at ~35 % height.
- Text is always small next to the scene.
- **V3:** the readout is centred at the top with a thin sans number; captions and title use a thin display serif (Cormorant), more delicate than both references.

## The five largest V3 mismatches
1. **Authored silhouettes**: capsule people and grid-textured boxes read as code-generated. Both references use simple but designed parts.
2. **No first-person framing**: both references frame the view (bunker window, binocular mask, visor plus body). V3 is an unframed camera.
3. **Colour and midtones**: too grey (≈ ½ the POV saturation) and too dark in the midtones (~10–20 levels below both references).
4. **HUD and type system**: centred thin-sans readout and fragile display serif, against a top-left label/value block with a sturdy serif.
5. **Uniformity**: a perfectly uniform fog field, equally matte materials, regular facades, and a sequence that stays on one subject. Both references are full of local variation (fog banks, smoke columns, selective gloss, layered recesses, shot progression).

## Hybrid rules (when the references disagree, prefer POV)
- **Light:** overcast daylight. Midtones ≈ 70–85, foreground shadows 15–35, haze 140–170. Brighter than Omaha, moodier than V1.
- **Colour:** muted world, saturation ≈ 0.22–0.28. Saturated, localised accents: fire, sparks, signals, hazards, brake lights.
  The image turns perceptibly colder when the fire dies.
- **Materials:**
  - environment matte: concrete and buildings 0.75–0.95, road 0.9+;
  - cars 0.45–0.65 with a little clearcoat; glass dark and reflective; metal props with controlled speculars.
- **Fog:** keep the density. Add local structure: denser near the ground, slow drifting low-frequency variation, a few soft haze layers between blocks.
- **Lens:** moderate rounded-rectangle vignette with slight edge softness, not binoculars. Little grain; clean, soft image.
- **Type:**
  - top-left block: tiny caps label, then a serif value, then a small secondary line;
  - narration: one short italic serif sentence at a time, lower-centre;
  - title: upright serif question.
- **POV body:** only with an authored low-poly arm/hand asset. No hand is better than a bad hand.
- **Composition:** dark foreground shape + one clear midground event + hazy background; asymmetric; the shot sequence progresses (grill → street → city).
