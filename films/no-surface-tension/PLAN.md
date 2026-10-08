# WHAT IF WATER LOST ALL SURFACE TENSION? — production plan

> Rules: `docs/VIDEO_FORMAT.md`, `docs/PHYSICS_EPISODE_RULES.md`, `docs/RETENTION_RULES.md`. Brief: `docs/briefs/` (Developer 4).
> Page `no-surface-tension.html` · code `films/no-surface-tension/` · 61.0 s film (68.6 s of story time, cut by `CONFIG.edit`) · 1080×1920 · 30 fps.

## 1. Rules

| Item | This episode |
|---|---|
| Exact fictional rule | At 1.2 s the surface tension of liquid water (water–air, 72 mN/m at 20 °C) starts to fall; it is 0 by 1.6 s and stays there. |
| Held constant | Everything else: water's density, viscosity, chemistry; how strongly water sticks to solids (adhesion); every other liquid; gravity; air. Only water is changed (HUD: "WATER ONLY · EVERYTHING ELSE NORMAL"). |
| Changed | No surface "skin": no Laplace pressure, no capillary rise, no meniscus that can hold a pressure difference, nothing that rounds water into drops. |
| Real consequences (one per beat) | Beads and the dome on a brimming glass slump into thin films (no restoring tension, adhesion kept → spreading). A tap stream no longer pinches into drops (Rayleigh–Plateau needs tension); it tears into shreds and mist. A paperclip can't float (it was held by the surface). A paper towel doesn't wick (capillary rise h = 2γcosθ/ρgr → 0). A sponge can't hold water (capillary retention). Water striders fall through. Soil can't hold water against gravity (matric suction is capillary) — it runs straight through. A wick stays dry above the water line (built, then cut from the film for pace). Plants: the xylem's water column is pulled by tension held at menisci in the leaf's cell-wall pores; with no tension that pull fails → wilting over days. Rain: drops are stabilised by tension against air drag (Weber number); without it, falling water shreds into spray. Fabric: water-repellent fabric stops water because tension can't push through tiny pores (entry pressure ∝ γ) → umbrellas let it through. |
| Simplifications | Adhesion kept (so water spreads as films rather than doing something stranger). Time compressed in the time-lapse (on-screen note). Wilting shown as droop + colour, over ~3 days. Spreading uses Huppert's gravity–viscous film law R ≈ 0.55 (gV³t/ν)^⅛. |
| Misconceptions to avoid | Water doesn't "disappear", oceans don't drain, nothing explodes. No tsunamis, no collapsing lungs, no dissolving people, no building collapses (brief). |
| Formulas / numbers used | σ = 72 mN/m → 0; capillary rise 0 mm; Huppert spreading; ballistic streams (flight time from v₀ and drop height); paperclip terminal velocity ≈ 0.18 m/s. |
| Must NOT claim | That this could happen; exact wilting times; anything about soap, bubbles, tears, ink, lungs — left open for the comments. |

## 2. The places
One scene, two sets, and the kitchen window looks out onto the same garden.
- **Kitchen** (inside the house wall at z 0.2, you face −Z): counter top y 0.92, glass of water at (−0.56, 0.52), beads in front of it, clear glass dish at (−0.2, 0.61), sink x 0…0.62 / z 0.33…0.75 with a gooseneck tap (spout (0.31, 1.205, 0.5)), pothos, paper-towel roll. Own lights + an indoor reflection map; the garden sun/sky are dimmed while you are inside.
- **Garden** (z < 0): lawn, patio and stepping stones, pond centred (−0.9, −6.6) r 1.62 with pads and striders, potting bench against the wall at x 1.7–3.3 (pot A to water, pot B = wick pot), flower bed along the left fence, trees, park and city beyond.

## 3. Shot list (film seconds)

Everything is authored in story time (`script.js`); `CONFIG.edit = [[0, 27.8], [29.0, 33.7], [37.4, 45.2], [47.9, 68.6]]`
keeps four stretches, so film = story for 0–27.8, story − 1.2 for the bench, story − 4.9 for the time-lapse and
story − 7.6 from the storm on. The self-watering wick shot (story 33.7–37.4) was built and then cut for pace.

| # | Film time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–4.4 | Macro on the counter: a brimming glass with a domed top, round beads. At 1.2–1.6 s the dome collapses and overflows, the beads slump into dark wet films. | Kitchen tone, birds through the glass, a tap dripping (plip … plip) that stops. A taut string goes slack with the readout; a low thud. | TITLE centred · SURFACE TENSION 72 → 0 mN/m |
| 2 | 4.4–9.6 | Cut: eye level with the tap. Your hand turns the lever; the stream never pinches into drops, it twists, frays and sheds mist. | Click; a smooth hiss, no gurgle, no splash. | Tag "NORMAL WATER WOULD BREAK INTO DROPS HERE" · "Water would stop forming drops." |
| 3 | 9.6–14.6 | A glass bowl. Your fingers lay a paperclip flat on the water, let go: it sinks to the bottom. | A small glass tink. | "A paperclip used to float on it." |
| 4 | 14.6–18.3 | A paper-towel strip dipped in: only the part under water is wet. | Paper rustle. | Tag "NORMAL WATER WOULD CLIMB TO HERE" · "Tiny tubes depend on it too." |
| 5 | 18.3–22.2 | A soaked sponge lifted out of the steel sink: the water pours straight out. | Squeeze, a hush of pouring. | "A sponge can't hold water anymore." |
| 6 | 22.2–27.8 | Cut outside, close on the pond: a water strider steps off a lily pad and falls through; ripple rings. | Garden air, birds, insects, a tiny fizz. | 0 mN/m · THE SURFACE CAN'T CARRY ANY WEIGHT · "Insects that walk on water fall through." |
| 7 | 27.8–32.5 | Potting bench: you water a pot; it runs straight through the soil, fills the saucer and spills off the bench. | Can slosh, hiss into soil, run-off. | CAPILLARY RISE 0 mm · TINY PORES CAN'T HOLD WATER NOW · "Soil can't hold water either." |
| 8 | 32.5–40.3 | Time-lapse over the garden, 3 days: sun arcs, nights pass, lawn yellows to straw, flowers droop and brown, trees brown. | Ticks speeding up, a warm pad that sours, crickets at night, birds thinning. | TIME SINCE THE CHANGE (hours → DAY 3) · PLANTS WILTING % · "Leaves pull water up from the roots." "Without surface tension, that pull breaks." |
| 9 | 40.3–45.0 | Clouds roll in, storm. Rain falls as slow torn strands and mist, no drops. | Wind, distant thunder, rain as one soft roar, no patter. | "Rain can't hold itself together." |
| 10 | 45.0–49.4 | You look up at your yellow umbrella: dark wet blotches spread through the fabric, fine spray falls through. | Hiss on the fabric. | "And fabric can't keep it out." |
| 11 | 49.4–61.0 | Payoff: the camera rises over the wilted garden, the park and the city in the storm; three lightning flashes (50.7, 54.2, 56.6). | Thunder with each flash, the closing chord. | 0 mN/m · SAME WATER · SAME AMOUNT · NO DROPS · "It looks like a tiny force…" / "…until an entire ecosystem depends on it." · note FICTIONAL RULE … TIME COMPRESSED |

## 4. Hero shots
The beads slumping under the title (1.2–2.2 s); the strider falling through (24–26 s); the time-lapse garden on day 3 (39 s, cover candidate, doesn't spoil the payoff); the stormy rise with lightning (54 s).

## 5. Escalation check
Kitchen micro (drops → stream → clip → towel → sponge) every 4–5 s → living things (strider) → the garden's water supply (soil) → plants over days → the weather → the whole landscape. Every shot moves (slow push-ins, falling water, time-lapse); nothing static for 3 s.

## 6. Sound
See the header of `audio.js`. Idea: water's voice is drops (drips, patter, gurgle); without surface tension water only hisses. Buses: room, water, music; glue compressor + limiter + a fixed trim after the limiter; measured −17.1 LUFS integrated, true peak −2.0 dBFS.

## 7. Systems / files
- Reused: CameraController, ViewerHands, StoryHUD, post/Look, fog, Environment (subclassed as `NstGarden`), AudioEngine (subclassed as `NstAudio`), BillboardSystem, StreakSystem, Person rig, batch.
- New (film-local, `nst`-prefixed): `water.js` (Fresnel water material, NstPuddle spreading drop/film, NstStream fraying stream, NstSpray mist, nstWetLook, nstSpreadR), `kitchen.js` (NstKitchen set + room reflection map), `garden.js` (NstGarden: sky with day/night/storm, pond, striders, bench, wick pot, beds, park, rain), `film.js` (hands, props, tags, grade), `audio.js`.

## 8. Review log
(filled after the reviews — scores as given)
