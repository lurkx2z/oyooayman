# WHAT IF WATER LOST ALL SURFACE TENSION? — production plan

> Rules: `docs/VIDEO_FORMAT.md`, `docs/PHYSICS_EPISODE_RULES.md`, `docs/RETENTION_RULES.md`. Brief: `docs/briefs/` (Developer 4),
> then the owner's creative-direction override of 2026-10-08 ("beautiful, strange microscopic physics … don't force
> unrelated city destruction"). Page `no-surface-tension.html` · code `films/no-surface-tension/` · 60.1 s film (65.7 s of
> story time, cut by `CONFIG.edit`) · 1080×1920 · 30 fps. Version 2 (the redesign); version 1 is in git history (commit 7f52dbf).

## 1. Rules

| Item | This episode |
|---|---|
| Exact fictional rule | At 1.2 s the surface tension of liquid water (water–air, 72 mN/m at 20 °C) starts to fall; it is 0 by 1.6 s and stays there. |
| Held constant | Everything else: water's density, viscosity, chemistry; how strongly water sticks to solids (adhesion); every other liquid; gravity; air. Only water is changed (HUD: "WATER ONLY · EVERYTHING ELSE NORMAL"). |
| Changed | No surface "skin": no Laplace pressure, no capillary rise, no meniscus that can hold a pressure difference, nothing that rounds water into drops, no barrier to starting a bubble. |
| Real consequences (one per beat) | Beads and the dome on a brimming glass slump into thin films. A tap stream no longer pinches into drops (Rayleigh–Plateau needs tension); it tears into shreds and mist. A paperclip can't float. **Sparkling water erupts when opened:** a new bubble must overcome the barrier ΔG* = 16πσ³/(3ΔP²); with σ = 0 bubbles nucleate everywhere at once, the dissolved CO₂ (about 3 volumes of gas per volume of water) comes out in one go and throws most of the water out; no foam is left because foam needs surface tension; then it is flat. Water striders fall through. Water doesn't climb thin tubes (capillary rise h = 2σcosθ/(ρgr) → 0; normally 2.5–9.9 cm in 0.6–0.15 mm bores). Plants: the xylem's water column is held under tension by menisci in the leaf's cell-wall pores; with no tension, air seeds in and the pull fails: the pits between vessels stop holding air back (air-seeding pressure ∝ σ / pore size), air gets in and the column snaps (the click is real: botanists record these "acoustic emissions") → wilting over days. Rain: drops are held together against air drag by tension (Weber number); without it falling water shreds into ligaments and mist; it joins a pond with no splash crown, no capillary rings and no "plink" (that sound is a bubble trapped by the drop). **Ducks soak through:** water is kept out of the plumage because surface tension can't be pushed into the gaps between feather barbs (entry pressure ∝ σ); with none it soaks in, the trapped air is lost and the bird rides low (the detergent-duck effect). At a leaf tip water can't gather into a drop: it leaves as a thin continuous thread. |
| Simplifications | Adhesion kept (so water spreads as films rather than doing something stranger). Time compressed in the time-lapse (on-screen note). Wilting shown as droop + colour over ~3 days. Spreading uses Huppert's gravity–viscous film law R ≈ 0.55 (gV³t/ν)^⅛. The eruption is drawn as a white column, spray and torn shreds; its height (≈0.6 m) is conservative. Gas still leaving the clearing water is drawn as thin ragged threads, not round bubbles. |
| Misconceptions to avoid | Water doesn't "disappear", oceans don't drain, nothing explodes. No tsunamis, no collapsing lungs, no dissolving people, no building collapses (brief). |
| Formulas / numbers used | σ = 72 mN/m → 0; ΔG* ∝ σ³; capillary rise 0 mm; Huppert spreading; ballistic streams (flight time from v₀ and drop height); a flat paperclip settling at roughly 0.1 m/s; jets launched at ≈3 m/s from the bottle neck. |
| Must NOT claim | That this could happen; exact wilting times; anything about soap films, tears, ink or lungs (left open for the comments). |

## 2. The places
One scene, two sets, and the kitchen window looks out onto the same garden. No streets, no cars, no city.
- **Kitchen** (inside the house wall at z 0.2, you face −Z): counter top y 0.92, glass of water at (−0.56, 0.52), beads
  in front of it, clear glass dish at (−0.2, 0.61), a 0.5 L bottle of sparkling water at (−0.4, 0.63), sink x 0…0.62 /
  z 0.33…0.75 with a gooseneck tap (spout (0.31, 1.205, 0.5)), pothos, paper-towel roll.
- **Garden** (z < 0): lawn, patio and stepping stones, pond centred (−0.9, −6.6) r 1.62 with pads, striders and a
  mallard, a sunflower at (−2.49, −6.04) on the rim that bows out over the water, potting bench (with the tube dish) against the wall at x 1.7–3.3, flower bed along the left fence,
  trees, then a park, fields, woods and low hills that dry out with everything else.

## 3. Redesign (the 2026-10-08 creative override)

**Identity**
- *What can this show that no previous video has?* Physics at the scale of a fingertip, all within 20 m of one kitchen:
  water that can't make a drop, a bottle that erupts the instant it is opened, an insect falling through the surface, a
  duck soaking through. Every other episode ends up in streets or a city; this one never leaves the house and garden.
- *Most surprising consequence:* opening a fizzy drink makes it erupt, and seconds later it is flat.
- *Most visually unusual:* the waterline shot, half under the pond: rain that doesn't splash, a soaked duck riding low,
  its feet paddling under the line.
- *Strongest scene:* the bottle eruption.
- *Distinguishable with the HUD removed?* Yes: kitchen macro, glass tubes, the inside of a stem, a pond seen from the
  waterline, an ending level with the water on one soaked bird.

**Consequences considered (ranked; ✓ = in the film)**
1. ✓ Fizzy drinks erupt when opened, then go flat (nucleation barrier ∝ σ³ → 0).
2. ✓ Water birds soak through and ride low (feather entry pressure ∝ σ).
3. ✓ Water striders fall through the surface.
4. ✓ Water can't form drops (the tap's stream frays; beads and the glass's dome slump).
5. ✓ Plants wilt even in the rain (the xylem's pull fails at the leaf's menisci).
6. ✓ Rain falls as shreds and mist; on a pond no splash crown, no rings, no plink.
7. ✓ Water doesn't climb capillary tubes (shown with glass tubes; "soil can't hold water" was cut as an overclaim).
8. ✓ A paperclip can't float (kept short).
9. ✗ Paper towels and sponges stop wicking (cut: the weakest picture, it shows an absence).
10. ✗ Umbrellas and woven fabric let rain through (cut: the "look up at the umbrella" beat is recycled).
11. ✗ Soap bubbles can't exist (only implied: the eruption leaves no foam).

**Signature moments**
- **A, first surprise (0–9.6 s):** under the title the brimming glass's dome collapses and the beads slump; then the tap
  that can't make a drop: one column that thins and roughens, opened wider at 6.9 s.
- **B, impossible-looking physics (15.5 s):** the cap cracks, the clear bottle turns white all at once and throws a
  white column out of the neck; it clears from the bottom up and is left flat.
- **C, a payoff unlike the other endings (31.5–60.1 s):** inside a sunflower stem, air breaks the water column with a
  click; days later, in the rain, the wilted leaf's tip can't make a drop; the camera follows its thread down to the
  waterline, where a soaked duck sinks and beats its wings beside the faint ghost of where it used to float; on the
  closing line the rain stops and a low sun comes out; the duck tries to take off and can't (soaked feathers can't
  lift a bird) and slumps back in. The film ends at the scale of one bird instead of rising over a city, and without
  looking up or down at the end.

**What was wrong with version 1 (independent differentiation review: distinctiveness 7, keep-watching 5)**
- Most repetitive sequences: the ending (a drone rise over garden, park and city with lightning, 48.7–60.3 s), the
  run of tabletop "hand test" beats (towel 14.6 s, sponge 18.3 s after the paperclip), and the "NORMAL WATER WOULD…"
  tags on three beats in a row.
- Most boring timestamps: 15–17 s (the towel: nothing happens by design), 44.3–48.7 s (the umbrella), 50.5–60.3 s (the
  rise, no new event). Also 4.9–9.6 s (one event for the whole tap shot).

**What was still wrong with the first version 2 preview (four independent reviewers, see § 8)**
- 39.5–57 s was ~17 s of low-event, low-contrast footage; the aerial dive read as version 1's drone rise in reverse;
  the macro on the leaf was empty (a 1-pixel thread). The watering can on a pot was a chore with nothing to see; the
  wide garden time-lapse with a clock was recycled (Oxygen, version 1). 53% of the cut was still version 1 footage.
- Physics: the tap stream twisted and widened (that twist needs surface tension; without it a stream thins and only
  roughens), thin crisp rings on the water are capillary ripples, round mist puffs read as drops, "soil can't hold water"
  overclaimed, the wilting % was false precision. Visual: a floating label, a neon lily pad, a highlighter-yellow lawn,
  fingers clipping into the bottle.

**Revised shot list (version 1 → version 2)**

| Original shot | Why it feels repetitive | Replacement | Why it is more interesting |
|---|---|---|---|
| Tap, 4.4–9.6 s: one trickle for 5 s | One event held too long | The lever is pushed further at 6.9 s: a thicker, rougher column (it thins as it falls and never pinches off) | A second event inside the shot; the stream visibly changes |
| Paper towel, 14.6–18.3 s | Shows an absence (nothing climbs); third tabletop test in a row; a third tag | A sealed bottle of sparkling water: the cap is twisted, the bottle turns white and erupts | The most surprising consequence; sudden motion and sound |
| Sponge, 18.3–22.2 s | Fourth "hand + object" test | The same bottle clearing from the bottom up, left flat | Follow-through of the eruption: no foam, flat in seconds |
| Watering can on a pot of soil, 26.8–31.5 s | A chore; water running out of a pot shows nothing new | Four glass capillary tubes in a dish of inked water, clipped to a cm card: you pour, the water climbs none of them; ghost columns rise to where it used to stand (2.5 → 9.9 cm, higher in thinner tubes) | The textbook capillary demo the owner asked for, made visible with the film's ghost device |
| Wide garden time-lapse with a clock, 31.5–39.0 s | The same time-lapse device as Oxygen and version 1 | Inside a sunflower stem: three xylem tubes; air pushes through a pore and the water column snaps with a click, then the next; then a 4.4 s time-lapse on one sunflower bowing | A place no episode has been; the cause of the wilting shown, not told |
| Storm wide + umbrella soaking through, 40.0–48.7 s | "Look up at the umbrella in the rain" is a stock beat | The wilted leaf's tip in the rain: one thin thread and a ghost drop that keeps forming where a real one can't | Small-scale and strange; the opening's "no drops" paid off on a leaf |
| Drone rise over garden, park and city with lightning, 48.7–60.3 s (version 2 preview: a dive from the sky) | The same rise-and-reveal ending as Oxygen, Friction and the siblings | Crane down the thread to the pond's waterline: a soaked duck riding low beside its faint ghost, it sinks and beats its wings; a slow push-in; on the closing line the rain stops and a low sun comes out, and it still rides low | Ends on one bird, level with the water; "ecosystem" is shown, not told |
| The draft's tilt up from the duck to the sunflower after the last line, 54.7–60.1 s | The channel's "camera tilts up at the end" move; no new event after the strongest one | The camera stays on the duck: the rain stops, a low sun lights the house, and the soaked duck tries to take off, can't, and slumps back in | A last event, caused by the physics, after the storm has passed: the change outlasts it; no look up or down at the end |
| The city behind the park | Unrelated city; reads as "city episode" | Fields, woods and low hills that brown with the garden | Keeps the film in the natural world it is about |
| "NORMAL WATER WOULD…" tags | A floating label breaks the style | None: ghosts carry "what normal water would do", explained once per shot in the HUD ("WHITE = …") | One quiet visual device instead of text |
| The paperclip's ghost (draft) | Read as a second clip | Removed | The sinking clip is clear on its own |

## 4. Shot list (film seconds)

Everything is authored in story time (`script.js`); `CONFIG.edit = [[0, 14.4], [14.6, 21.4], [22.2, 27.8], [29.0, 43.6], [47.0, 65.7]]` (60.1 s of film).

| # | Film time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–4.4 | Macro on the counter: a brimming glass with a domed top, round beads. At 1.2–1.6 s the dome collapses and overflows, the beads slump into glossy wet films. | Kitchen tone, birds through the glass, a dripping tap that stops. A taut string goes slack; a low thud. | TITLE (to 3.9) · SURFACE TENSION 72 → 0 mN/m |
| 2 | 4.4–9.6 | Side-on at the tap. Your hand lifts the lever: one column that never pinches into drops, thinning as it falls, its surface rough and fluted; beside it many small pale ghost drops fall fast, where normal water would have pinched off. At 6.9 s you push it further. | Click; a smooth hiss that grows; no gurgle. | WHITE = WHAT NORMAL WATER WOULD DO · "Water would stop forming drops." |
| 3 | 9.6–14.4 | A glass bowl: your fingers lay a paperclip on the water and let go; it glides to the bottom. | A glass tink. | "A paperclip used to float on it." |
| 4 | 14.4–21.2 | A sealed bottle of sparkling water. You twist the cap: the bottle turns white and a white column erupts out of the neck; it clears from the bottom up, flat, on a wet counter. | Ratchet clicks, a sharp hiss, a whoomph and a roar of spray; then silence (no fizz). | NOTHING HOLDS NEW BUBBLES BACK · "Every fizzy drink would erupt when opened." · "All its bubbles form at once. Then it's flat." |
| 5 | 21.2–26.8 | Close on the pond: a water strider steps off a lily pad and falls through (no ring). | Garden air, birds, insects, a tiny fizz. | NO SURFACE SKIN TO STAND ON · "Insects that walk on water fall through." |
| 6 | 26.8–31.5 | Potting bench: four glass tubes in a dish, a cm card behind. The can pours inked water into the dish; it climbs none of the tubes. Ghost columns climb to 2.5, 4.3, 6.8, 9.9 cm. | A soft hiss into the dish; a glassy note per ghost. | CAPILLARY RISE 0 mm · IT USED TO CLIMB HIGHER IN THINNER TUBES → WHITE = WHERE NORMAL WATER WOULD CLIMB · "Water can't climb thin tubes anymore." |
| 7 | 31.5–37.0 | Inside a sunflower stem: three xylem tubes, the left already empty, the others full of blue water streaming upward. A ragged tongue of air pushes through a pore (33.85; nothing rounds it into a bubble); the middle column snaps (34.2): two flat ends pull apart and water drains down the walls; the right one next (35.35). | A taut hum; a rising hiss; a click, a thud and a rush of air at each snap. | WATER IN THE STEM HOLDING (THE INSTANT OF THE CHANGE · SLOWED DOWN) → BROKEN (AIR GOT IN THROUGH A PORE) · "Plants pull water up through hair-thin tubes." · "Without surface tension, the leaves can’t pull and air gets in." |
| 8 | 37.0–41.4 | Time-lapse from across the pond: the sunflower against trees and sky, day → night → day; it bows and browns. | Day whooshes, crickets at night, fewer birds, a souring pad, ticks. | TIME SINCE THE CHANGE (hours → DAY 3) · THE PLANTS ARE WILTING |
| 9 | 41.4–45.2 | Rain (torn streaks). The wilted leaf's tip over the pond: the water leaves as one thin thread; a ghost drop forms and lets go every second. | Rain's soft roar, no patter; the closing chord begins. | ROUND DROPS 0 · NOT EVEN ON A LEAF TIP · "Rain can't hold itself together." |
| 10 | 45.2–46.8 | The camera cranes down the thread to the pond and settles at the waterline. | | |
| 11 | 46.8–60.1 | Half under the pond (the line just above the middle of the frame), the house behind, the leaf's thread on the right: a soaked mallard rides low, paddling; its faint ghost floats where a dry duck would, about 40 % under (47.8); the camera pushes in slowly to the end; it sinks and beats its wings (50.35, 52.3). At 54.7 a gust dips the leaf; the rain stops and a low sun comes out on the house and the duck (55–57.5); the ghost fades (55.8–56.4). At 56.45 the duck tries to take off: wings flailing, chest out of the water, feet pattering; its soaked feathers can't lift it and it slumps back in, lower (57.6). Note 57.9; fade 60.1. | Muffled paddling, alarmed quacks, wet wing beats; the rain roar fades out, one far bird; frantic flapping, a heavy soft slap, no splash; the chord. | DUCK'S FEATHERS SOAKED · "And feathers can't keep it out." (47.4) · "It looks like a tiny force…" (51.8) · "…until an entire ecosystem depends on it." (54.7) · SAME WATER · NO DROPS |

## 5. Escalation check
Kitchen micro (a drop → a stream → a clip → a bottle) → a living insect → glass tubes → inside a living stem → plants
over days → the rain on one leaf → a bird in trouble → the rain stops and the bird still can't take off (the change
outlasts the storm). Every shot has a new event within 4 s.

## 6. Sound
See the header of `audio.js`. Water's voice is drops (drips, patter, plinks, fizz); without surface tension water only
hisses or roars. Buses: room, water, music; glue compressor + limiter + a fixed trim after the limiter.

## 7. Systems / files
- Reused: CameraController, ViewerHands, StoryHUD, post/Look, fog, Environment (subclassed as `NstGarden`), AudioEngine
  (subclassed as `NstAudio`), BillboardSystem, StreakSystem, batch, SmoothTrack.
- New (film-local, `nst`-prefixed): `water.js` (Fresnel water, NstPuddle, NstStream, NstSpray, nstWetLook, nstSpreadR),
  `kitchen.js` (NstKitchen: glass, beads, tap, dish and paperclip, the sparkling-water bottle and its eruption),
  `garden.js` (NstGarden: sky by day/night/rain, pond, striders, the duck with its ghost and wings, the sunflower, its
  leaf thread and ghost drop, bench, beds, park, hills, rain), `tubes.js` (NstTubes: the capillary demo), `stem.js`
  (NstStem: inside the stem, built far below the garden with its own unlit materials), `film.js` (hands, can, the
  waterline lens, the flown finale camera, the grade), `audio.js`.
- Places: the stem set sits at (60, −40, 60), out of sight of everything else.

## 8. Review log
Version 1 (three rounds of five independent reviewers on frames every 0.5 s; scores out of 10, as given):

| Round | Cut | Retention | Normal viewer | Visual | Cinematography | Physics |
|---|---|---|---|---|---|---|
| 1 | 68.6 s | 5 | 5 | 5.5 | 5 | 7 |
| 2 | 61.0 s | 5 | 6 | 5 | 5 | 7 |
| 3 | 60.3 s | 6 | 5 | 6 | 6 | 8 |

Version 1 differentiation review (against Oxygen, Friction and the four sibling episodes): distinctiveness 7,
keep-watching 5.

Version 2 (the redesign), independent reviewers on frames every 0.5 s, scores out of 10 as given:

| Round | Cut | Retention | Normal viewer | Visual | Cinematography | Physics | Distinctiveness | Keep-watching |
|---|---|---|---|---|---|---|---|---|
| 1 (first preview) | 60.1 s | 5.5 | 6 | 5.5 | 5 | 7 | 8 | 5 |
| 2 (tubes, stem, waterline duck) | 60.1 s | 4.5 (hook 5) | 5.5 | 5 | 4.5 | 8 | 7 | 5 |
| Final audit of the draft MP4 (three reviewers) | 60.1 s | 5.5 | 6 | 6 | 5.5 | 8 (clarity 7) | 7 | 5 |
| Re-check after the top-3 fixes (one reviewer) | 60.1 s | 5 | 6 | 6 | 5.5 | 8 | 7.5 | 5.5 |

- Round 1 led to the tubes (replacing the watering can), the inside of the stem (replacing the wide time-lapse with a
  clock) and the crane down the leaf's thread to the waterline duck (replacing the dive from the sky).
- Round 2 found the finale (41.4–60.1) too dark to read (the leaf tip about 31/255, the duck a dark blob under a bright
  white ghost), the tap reading as an ordinary tap, single broken frames at the cuts 31.5 and 37.0, tubes that looked the
  same width, a stem that did not read as "inside a plant", slow wilting, "HOLDING" contradicting σ = 0, and rain
  streaks like worms. What it called recycled (differentiation reviewer, film seconds): the 72 → 0 opening readout
  (0–3.9, every sibling does it), the ghost-of-normal overlay four times (11.5, 29.5, 41.8, 48.4; the siblings use the
  same device), three kitchen hand jobs in a row (4.4–15.5), the day/night time-lapse with a day counter (37.0–41.4),
  the rain and tilt-up reveal at the end (41.4–60.1), and the "X… / …until Y" closing line (kept: the owner fixed it).
  It would next replace the paperclip (with a bubble wand that can't hold a film), the tap (with oil and water poured
  side by side) and the rainy tilt-up ending (a sunlit pond, ending on a macro).
- Fixed after round 2 (the top three first): (1) the finale's readability: brighter exposure in the rain, glowing petals
  and leaf, the duck lit, its ghost a pale rim outline, the crane shortened to 1.6 s, the waterline lens switching on
  the moment the camera reaches the line, the HUD clear of the duck; (2) the tap: ghost drops (where normal water would
  pinch off) beside the real column, the stream thinner and fibrous, no round mist; (3) the cut frames (camera keys at a
  cut now sit 0.01 s before it). Also: thick-to-thin tube bores and the card flush behind them, a cell texture and
  rings in the stem, faster wilting, the stem readout's wording, darker pads, a night sky, thinner rain.
- The final audit of the real 1080×1920 draft MP4 found the ending flat (waterline too low, caption over the duck, a
  bright ghost, a tilt up after the last line), confusing ghosts, glitch frames (hand pops at 9.60/14.40, jets gone at
  17.90, a day/night strobe at 37.6–39.8) and an impossible round bubble in the stem. Fixed: the ending (level waterline,
  faint ghost at a real draft, push-in, the rain stops and a low sun comes out), the ghosts (labels, paperclip ghost
  removed), the glitches and the stem.
- The re-check of that output found new problems in the ending: a glare at 46.50, the leaf's thread landing on the
  duck's head, a hard shadow wedge on the wall, and no event after 53.5 s. Fixed and re-rendered (a self-lit duck, the
  duck moved left of the thread, a higher sun, and the soaked duck's failed take-off at 56.45 as the last event); checked
  in stills, not re-scored. Remaining weaknesses: `EPISODE_REPORT.md`.
