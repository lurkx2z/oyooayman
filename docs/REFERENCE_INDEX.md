# Reference index — what each reference teaches

> Two kinds of references exist:
> - **(A)** the two external videos the owner used to set the look;
> - **(B)** frames from our own shipped episodes, in `docs/reference/`.
>
> **The external frames are NOT in the repo, on purpose.** They are other creators' TikTok frames and this repository
> is public. Their measured characteristics are recorded in `docs/art-direction.md`. If you need the images, ask the
> owner to share them in your session, and never commit them.

## A. External references (owner-supplied, Oct 5)

### A1. "POV What If — what if you fell through the Earth?" (TikTok @pov.what.if0) — the PRIMARY reference (~70 %)

Six frames: depth 0 m, 136 m (crust), 106 km (upper mantle), 6,357 km (centre), 43 km, back at the surface (Indian Ocean).

What it teaches:
- **Polished stylised low/mid-poly rendering** with clearly authored assets (a suit with bevels, bands, boot soles,
  gloves).
- **The first-person body grounding the viewer.** Legs and arms visible at the bottom of the frame: *"This is happening
  to ME."*
- **Selective gloss:** glossy black boots, satin white/grey plates, orange bands. Environments stay matte.
- **The HUD hierarchy:** tiny caps label (`DEPTH`, ≈ 21 px @1080 wide), serif value (`2,498 km`, ≈ 55–65 px), grey
  secondary unit line, tiny context caps (`UPPER MANTLE`). Top-left. Small next to the scene.
- **Serif narration:** a sturdy book serif in italic, ≈ 48 px, centred at ~69 % height, one short sentence (*"The rock
  begins to glow."*).
- **Title:** an upright serif two-line question centred at ~35 % height (*"What if you fell through the Earth?"*).
- **The visor vignette:** a moderate rounded-rectangle, softly blurred dark edge (our `vignette` + `soft` edge).
- **Colour where the environment calls for it:** saturation 0.32–0.35 in neutral scenes, 0.69 in the mantle; intense
  but localised emissive effects with direction (radial light streaks).
- Measured: midtones 55–80, highlights up to 150–230 (see `docs/art-direction.md`).

### A2. "Omaha Beach" low-poly animation (TikTok @ngfanimations) — the SECONDARY reference (~30 %)

Four frames: the bunker window over the beach, the dark interior, the binocular ocean view, the dense beach.

What it teaches:
- **Fog depth:** a grey-green / grey-blue haze (≈ 150–165 luma), strong falloff past the midground, **silhouettes
  survive** (ships, smoke columns), and **uneven** local structure (smoke columns, banks).
- **A dark foreground frame:** huge flat dark planes (bunker walls 25–45 luma) framing one readable midground event,
  with a hazy far layer. Asymmetric; lots of dark space.
- **Grounding:** objects sit heavy on the ground.
- **Silhouette complexity from designed parts** (helmets, packs, straps, weapons) even though the models are very simple.
- **Older-game simplicity:** flat, nearly untextured, matte planes; soft grain; low local contrast.
- **Typography:** a small caps place/time block (`OMAHA BEACH / 06:35 — 6 JUNE 1944`).
- **Don't inherit:** the military palette, bunker darkness everywhere, heavy grime. *"The Omaha-only direction was
  beginning to make it too grey and dirty."*

**What both share (therefore the most important):** simple authored geometry with clear silhouettes, strong
atmospheric depth, a minimal HUD, readable first-person scale, restrained typography, dramatic lighting, consistency.

## B. Our own frames (`docs/reference/`)

Rendered from the shipped code at 540×960 (`tools/stills.cjs`). File names give the episode and film time (or *story*
time for some Slip frames). Contact sheets in `docs/reference/sheets/` show each film at a glance.

| File(s) | Teaches |
|---|---|
| `frames/oxygen_00.6_title_fire.jpg` | **The approved V4 look:** overcast muted city, the fire as the only warm accent, foreground cart and people, hazy distance, the top-left O₂ block, the serif title |
| `frames/oxygen_07.0_engines_power.jpg`, `oxygen_35.5_no_fireball.jpg` | the cold grade after the fire dies; captions; the haze layering of a dead street |
| `frames/oxygen_70.0_earth.jpg` | the procedural Earth (night lights going out), the ending composition |
| `frames/friction_01.0_title_hud_hands.jpg` | **The benchmark opening:** the centred `big center` title over a moving street, SURFACE FRICTION draining, first-person hand + phone, the hill visible from frame 1 (the nails are the old pale default: use skin tone now) |
| `frames/friction_12.0_no_brakes.jpg` | a consequence framed big and close (no empty bottom third), the caption in the lower-middle band |
| `frames/friction_44.0_montage_label.jpg` | the MEANWHILE montage label + one-line reason (mid-film reset) |
| `frames/friction_63.0_return_rollover.jpg` | the payoff: a third-person drone angle, slow-motion rollover |
| `sheets/friction.jpg` | the whole benchmark at a glance (including the aftermath line and the gripping step) |
| `frames/slip_01.0_title_wet_street.jpg` | wet rainy street with reflections, umbrellas, the title on frame 1 |
| `frames/slip_08.0_underground_readout.jpg`, `slip_13.0_pebble_scale.jpg`, `slip_17.0_fault_depth.jpg` | the explanatory cut-aways: one readout + one caption plate, a measuring scale, a boxed depth label |
| `frames/slip_story28.3_quake.jpg` | quake damage language (glass, red umbrella, readouts M8.7 / 0.9 G) |
| `frames/slip_story36.0_earth_rotation.jpg` | the planet shot with an arrow drawn on the globe |
| `frames/slip_story55.8_tsunami.jpg` | the 146 m wave (current best water; still stylised) |
| `frames/slip_56.0_end_card.jpg` | end-card typography (caps kicker, big serif, italic punchline, tiny satire note) |
| `frames/beforescreens_08.0_past_reveal.jpg`, `beforescreens_38.0_kite_hand.jpg` | the warm historical palette (not sepia), the child-height POV, a hand holding a prop |
| `frames/depersonalization_01.0_title.jpg`, `depersonalization_08.5_hands.jpg` | a prominent long-hold title for a subjective topic; looking at your own hands; interior lighting |
| `frames/andromeda_01.0_title.jpg`, `andromeda_45.0_passage.jpg` | night-sky rendering; dark foreground silhouettes; readouts with an "accelerated" note |
| `frames/moon_00.8_cold_open.jpg`, `moon_52.0_scale.jpg` | the hero-asset Moon; scale against a tiny person (the cold-open format itself is obsolete) |
| `frames/sim_01.0_normal_title.jpg`, `sim_58.0_aware_npc.jpg` | the "100 % normal" sunny opening; a hero face aiming at the lens |
| `frames/air_01.0_title_gale.jpg`, `air_31.0_190kmh.jpg` | wind-bent trees and debris; a big comparison number as the one bold HUD moment |
| `frames/game_06.0_touch.jpg`, `game_14.0_choice.jpg` | fake-interactive UI inside safe zones; touch feedback on glass |
| `frames/xover_02.0_title.jpg`, `xover_45.0_size_contrast.jpg` | the battlefield palette; the size-contrast composition (also a warning: the low-poly Titan reads as a nude mannequin) |

**Honest caveats on our frames:**
- People in close-up still look procedural (every episode's main critique).
- The Crossover characters read as mannequins.
- The Slip tsunami and planet are the best we have, but reviewers still called them stylised.
- Treat these frames as "the bar we've reached", not "perfect".
