# WHAT IF WATER LOST ALL SURFACE TENSION? — production plan

> Rules: `docs/VIDEO_FORMAT.md`, `docs/PHYSICS_EPISODE_RULES.md`, `docs/RETENTION_RULES.md`. Brief: `docs/briefs/` (Developer 4).
> Page `no-surface-tension.html` · code `films/no-surface-tension/` · 60.3 s film (68.6 s of story time, cut by `CONFIG.edit`) · 1080×1920 · 30 fps.

## 1. Rules

| Item | This episode |
|---|---|
| Exact fictional rule | At 1.2 s the surface tension of liquid water (water–air, 72 mN/m at 20 °C) starts to fall; it is 0 by 1.6 s and stays there. |
| Held constant | Everything else: water's density, viscosity, chemistry; how strongly water sticks to solids (adhesion); every other liquid; gravity; air. Only water is changed (HUD: "WATER ONLY · EVERYTHING ELSE NORMAL"). |
| Changed | No surface "skin": no Laplace pressure, no capillary rise, no meniscus that can hold a pressure difference, nothing that rounds water into drops. |
| Real consequences (one per beat) | Beads and the dome on a brimming glass slump into thin films (no restoring tension, adhesion kept → spreading). A tap stream no longer pinches into drops (Rayleigh–Plateau needs tension); it tears into shreds and mist. A paperclip can't float (it was held by the surface). A paper towel doesn't wick (capillary rise h = 2γcosθ/ρgr → 0). A sponge can't hold water (capillary retention). Water striders fall through. Soil can't hold water against gravity (matric suction is capillary) — it runs straight through. A wick stays dry above the water line (built, then cut from the film for pace). Plants: the xylem's water column is pulled by tension held at menisci in the leaf's cell-wall pores; with no tension that pull fails → wilting over days. Rain: drops are stabilised by tension against air drag (Weber number); without it, falling water shreds into spray. Fabric: water-repellent fabric stops water because tension can't push through tiny pores (entry pressure ∝ γ) → umbrellas let it through. |
| Simplifications | Adhesion kept (so water spreads as films rather than doing something stranger). Time compressed in the time-lapse (on-screen note). Wilting shown as droop + colour, over ~3 days. Spreading uses Huppert's gravity–viscous film law R ≈ 0.55 (gV³t/ν)^⅛. |
| Misconceptions to avoid | Water doesn't "disappear", oceans don't drain, nothing explodes. No tsunamis, no collapsing lungs, no dissolving people, no building collapses (brief). |
| Formulas / numbers used | σ = 72 mN/m → 0; capillary rise 0 mm; Huppert spreading; ballistic streams (flight time from v₀ and drop height); a flat paperclip settling at roughly 0.1 m/s. |
| Must NOT claim | That this could happen; exact wilting times; anything about soap, bubbles, tears, ink, lungs — left open for the comments. |

## 2. The places
One scene, two sets, and the kitchen window looks out onto the same garden.
- **Kitchen** (inside the house wall at z 0.2, you face −Z): counter top y 0.92, glass of water at (−0.56, 0.52), beads in front of it, clear glass dish at (−0.2, 0.61), sink x 0…0.62 / z 0.33…0.75 with a gooseneck tap (spout (0.31, 1.205, 0.5)), pothos, paper-towel roll. Own lights + an indoor reflection map; the garden sun/sky are dimmed while you are inside.
- **Garden** (z < 0): lawn, patio and stepping stones, pond centred (−0.9, −6.6) r 1.62 with pads and striders, potting bench against the wall at x 1.7–3.3 (pot A to water, pot B = wick pot), flower bed along the left fence, trees, park and city beyond.

## 3. Shot list (film seconds)

Everything is authored in story time (`script.js`); `CONFIG.edit = [[0, 27.8], [29.0, 33.7], [37.45, 44.95], [48.3, 68.6]]`
keeps four stretches, so film = story for 0–27.8, story − 1.2 for the bench, story − 4.95 for the time-lapse and
story − 8.3 from the storm on. The self-watering wick shot (story 33.7–37.4) was built and then cut for pace.

| # | Film time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–4.4 | Macro on the counter: a brimming glass with a domed top, round beads. At 1.2–1.6 s the dome collapses and overflows, the beads slump into dark, glossy wet films. | Kitchen tone, birds through the glass, a tap dripping (plip … plip) that stops. A taut string goes slack with the readout; a low thud. | TITLE centred (to 3.9) · SURFACE TENSION 72 → 0 mN/m |
| 2 | 4.4–9.6 | Cut: eye level with the tap. Your hand turns the lever; the stream never pinches into drops, it twists and frays into a thin haze. | Click; a smooth hiss, no gurgle, no splash. | Tag "NORMAL WATER WOULD BREAK INTO DROPS HERE" · "Water would stop forming drops." (5.6) |
| 3 | 9.6–14.6 | A glass bowl. Your fingers lay a paperclip flat on the water, let go: it glides down to the bottom. A faint outline stays where it would have floated. | A small glass tink. | Tag "NORMAL WATER WOULD HOLD IT UP HERE" · "A paperclip used to float on it." (11.6) |
| 4 | 14.6–18.3 | A paper-towel strip dipped in: only the part under water is wet. | Paper rustle. | Tag "NORMAL WATER WOULD CLIMB TO HERE" · "Paper towels can't pull it up anymore." (16.2) |
| 5 | 18.3–22.2 | A soaked sponge lifted out of the steel sink: the water pours straight out. | Squeeze, a hush of pouring. | "A sponge can't hold water anymore." (19.2) |
| 6 | 22.2–27.8 | Cut outside, close on the pond: a water strider steps off a lily pad (23.8) and falls through; faint ripple rings. | Garden air, birds, insects, a tiny fizz. | 0 mN/m · NO SURFACE SKIN TO STAND ON · "Insects that walk on water fall through." (22.9) |
| 7 | 27.8–32.5 | Potting bench: you water a pot; it runs straight through the soil, fills the saucer and spills off the bench. | Can slosh, hiss into soil, run-off. | CAPILLARY RISE 0 mm · TINY PORES CAN'T HOLD WATER NOW · "Soil can't hold water either." (29.4) |
| 8 | 32.5–40.0 | Time-lapse over the garden, 3 days: sun arcs, two nights pass, lawn yellows to straw, flowers droop and brown, trees brown. | Ticks speeding up, a warm pad that sours, crickets at night, birds thinning. | TIME SINCE THE CHANGE (hours → DAY 3) · PLANTS WILTING % · "Leaves pull water up through hair-thin tubes." (33.45) · "Without surface tension, air leaks in and the pull breaks." (36.65) |
| 9 | 40.0–44.3 | Clouds roll in, storm. Rain falls as torn, twisting strands and mist, no drops. | Wind, distant thunder, rain as one soft roar, no patter. | ROUND DROPS 0 · IT FALLS AS SHREDS AND MIST · "Rain can't hold itself together." (40.7) |
| 10 | 44.3–48.7 | You look up at your yellow umbrella: the fabric darkens evenly with soaked streaks running down each panel; fine spray falls through. | Hiss on the fabric. | "And woven fabric can't keep it out." (45.6) |
| 11 | 48.7–60.3 | Payoff: the camera rises over the wilted garden, the park and the city in the storm; three lightning flashes (50.0, 52.25, 55.05). | Thunder with each flash, the closing chord. | 0 mN/m · SAME WATER · NO DROPS · "It looks like a tiny force…" (52.3) / "…until an entire ecosystem depends on it." (55.1) · note FICTIONAL RULE: ONLY WATER'S SURFACE TENSION CHANGED / TIME COMPRESSED (58.3) · fade to black |

## 4. Hero shots
The beads slumping under the title (1.2–2.2 s); the strider falling through (24–26 s); the time-lapse garden on day 3 (39 s, cover candidate, doesn't spoil the payoff); the stormy rise with lightning (50–55 s).

## 5. Escalation check
Kitchen micro (drops → stream → clip → towel → sponge) every 4–5 s → living things (strider) → the garden's water supply (soil) → plants over days → the weather → the whole landscape. Every shot moves (slow push-ins, falling water, time-lapse); nothing static for 3 s.

## 6. Sound
See the header of `audio.js`. Idea: water's voice is drops (drips, patter, gurgle); without surface tension water only hisses. Buses: room, water, music; glue compressor + limiter + a fixed trim after the limiter; measured on the baked soundtrack of the 60.3 s cut: −17.0 LUFS integrated, true peak −2.1 dBFS, LRA 6.8 LU.

## 7. Systems / files
- Reused: CameraController, ViewerHands, StoryHUD, post/Look, fog, Environment (subclassed as `NstGarden`), AudioEngine (subclassed as `NstAudio`), BillboardSystem, StreakSystem, Person rig, batch.
- New (film-local, `nst`-prefixed): `water.js` (Fresnel water material, NstPuddle spreading drop/film, NstStream fraying stream, NstSpray mist, nstWetLook, nstSpreadR), `kitchen.js` (NstKitchen set + room reflection map), `garden.js` (NstGarden: sky with day/night/storm, pond, striders, bench, wick pot, beds, park, rain), `film.js` (hands, props, tags, grade), `audio.js`.

## 8. Review log
Each round: five independent reviewers (retention, normal viewer, visual, cinematography, physics) looking at preview
frames every 0.5 s. Scores out of 10, as given.

| Round | Cut | Retention | Normal viewer | Visual | Cinematography | Physics |
|---|---|---|---|---|---|---|
| 1 | 68.6 s | 5 | 5 | 5.5 | 5 | 7 |
| 2 | 61.0 s | 5 | 6 | 5 | 5 | 7 |
| 3 | 60.3 s | 6 | 5 | 6 | 6 | 8 |

- **Round 1 → 2:** cut from 68.6 to 61.0 s (wick shot and slow tails out); the sink basin opened up (a cabinet top was
  capping it); a close top-down strider shot; wilting starts within hours, straw lawn by day 3; rain as slow torn
  strands; less fog in the payoff; towel tag and framing; the watering can aims into the pot; sound trimmed below −1 dBTP.
- **Round 2 → 3:** rain as twisting torn ribbons with a drop-count readout; the umbrella soaks where water lands, with no
  sideways spreading (that would be wicking); wilting reads as drying, not autumn; the potting bench was being built
  three times (a method name clashed with the engine's park bench); no street grime on the lawn; tighter time-lapse cut;
  higher payoff rise with lightning on the sky; the glass overflow drains away; a pale "normal water" paperclip outline
  with a tag; softer tap mist; bigger world tags; wording fixes from the physics review. Cut 60.3 s.
- **Round 3 → final (not re-reviewed):** payoff lawns straw-coloured under the storm grade; rain strands wider, twisting,
  with a drop-count readout; umbrella soak as even darkening plus downhill streaks; paperclip sinks slower with a fainter
  "would float here" outline; no round mist specks at the tap; brighter nights; glossier spill on the counter; lapse
  framing moved so the readout covers less of the tree.
- **Still weak (honest):** the hand's skin tone shifts between the kitchen and the garden lighting; the dome and spill
  on the dark counter read best on a phone at full brightness; the towel beat has no visible "wet band" to show what is
  missing; the umbrella shot shows no shaft or hand; the time-lapse readout still overlaps the top-left of the tree;
  the bench shot's lower third is empty. No reviewer listened to the sound (it was only level-measured).
