# WHAT IF WATER LOST ALL SURFACE TENSION? — production plan

> Rules: `docs/VIDEO_FORMAT.md`, `docs/PHYSICS_EPISODE_RULES.md`, `docs/RETENTION_RULES.md`. Brief: `docs/briefs/` (Developer 4),
> then the owner's creative-direction override of 2026-10-08 ("beautiful, strange microscopic physics … don't force
> unrelated city destruction"). Page `no-surface-tension.html` · code `films/no-surface-tension/` · 60.3 s film (69.6 s of
> story time, cut by `CONFIG.edit`) · 1080×1920 · 30 fps. Version 2 (the redesign); version 1 is in git history (commit 7f52dbf).

## 1. Rules

| Item | This episode |
|---|---|
| Exact fictional rule | At 1.2 s the surface tension of liquid water (water–air, 72 mN/m at 20 °C) starts to fall; it is 0 by 1.6 s and stays there. |
| Held constant | Everything else: water's density, viscosity, chemistry; how strongly water sticks to solids (adhesion); every other liquid; gravity; air. Only water is changed (HUD: "WATER ONLY · EVERYTHING ELSE NORMAL"). |
| Changed | No surface "skin": no Laplace pressure, no capillary rise, no meniscus that can hold a pressure difference, nothing that rounds water into drops, no barrier to starting a bubble. |
| Real consequences (one per beat) | Beads and the dome on a brimming glass slump into thin films. A tap stream no longer pinches into drops (Rayleigh–Plateau needs tension); it tears into shreds and mist. A paperclip can't float. **Sparkling water erupts when opened:** a new bubble must overcome the barrier ΔG* = 16πσ³/(3ΔP²); with σ = 0 bubbles nucleate everywhere at once, the dissolved CO₂ (about 3 volumes of gas per volume of water) comes out in one go and throws most of the water out; no foam is left because foam needs surface tension; then it is flat. Water striders fall through. Soil can't hold water (matric suction is capillary). Plants: the xylem's water column is held under tension by menisci in the leaf's cell-wall pores; with no tension, air seeds in and the pull fails → wilting over days. Rain: drops are held together against air drag by tension (Weber number); without it falling water shreds into ligaments and mist; it joins a pond with no splash crown, no capillary rings and no "plink" (that sound is a bubble trapped by the drop). **Ducks soak through:** water is kept out of the plumage because surface tension can't be pushed into the gaps between feather barbs (entry pressure ∝ σ); with none it soaks in, the trapped air is lost and the bird rides low (the detergent-duck effect). At a leaf tip water can't gather into a drop: it leaves as a thin continuous thread. |
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
  mallard, a sunflower at (−2.9, −4.2), potting bench against the wall at x 1.7–3.3, flower bed along the left fence,
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
- *Distinguishable with the HUD removed?* Yes: kitchen macro, a pond seen from the waterline, an ending on one leaf.

**Consequences considered (ranked; ✓ = in the film)**
1. ✓ Fizzy drinks erupt when opened, then go flat (nucleation barrier ∝ σ³ → 0).
2. ✓ Water birds soak through and ride low (feather entry pressure ∝ σ).
3. ✓ Water striders fall through the surface.
4. ✓ Water can't form drops (the tap's stream frays; beads and the glass's dome slump).
5. ✓ Plants wilt even in the rain (the xylem's pull fails at the leaf's menisci).
6. ✓ Rain falls as shreds and mist; on a pond no splash crown, no rings, no plink.
7. ✓ Soil can't hold water.
8. ✓ A paperclip can't float (kept short).
9. ✗ Paper towels and sponges stop wicking (cut: the weakest picture, it shows an absence).
10. ✗ Umbrellas and woven fabric let rain through (cut: the "look up at the umbrella" beat is recycled).
11. ✗ Soap bubbles can't exist (only implied: the eruption leaves no foam).

**Signature moments**
- **A, first surprise (0–9.6 s):** under the title the brimming glass's dome collapses and the beads slump; then the tap
  that can't make a drop, opened wider at 6.9 s into a twisting, fraying veil.
- **B, impossible-looking physics (15.5 s):** the cap cracks, the clear bottle turns white all at once and throws a
  white column out of the neck; it clears from the bottom up and is left flat.
- **C, a payoff unlike the other endings (39.0–60.3 s):** the waterline shot with the soaked duck, then a dive from the
  sky over the browned garden down to one wilted sunflower leaf whose tip can't make a drop. The film ends on the
  smallest thing in it instead of rising over a city.

**What was wrong with version 1 (independent differentiation review: distinctiveness 7, keep-watching 5)**
- Most repetitive sequences: the ending (a drone rise over garden, park and city with lightning, 48.7–60.3 s), the
  run of tabletop "hand test" beats (towel 14.6 s, sponge 18.3 s after the paperclip), and the "NORMAL WATER WOULD…"
  tags on three beats in a row.
- Most boring timestamps: 15–17 s (the towel: nothing happens by design), 44.3–48.7 s (the umbrella), 50.5–60.3 s (the
  rise, no new event). Also 4.9–9.6 s (one event for the whole tap shot).
- Weakest demonstration: the paper towel. Weakest part of the ending: a generic rise over a city; "ecosystem" was told,
  not shown.

**Revised shot list (version 1 → version 2)**

| Original shot | Why it feels repetitive | Replacement | Why it is more interesting |
|---|---|---|---|
| Tap, 4.4–9.6 s: one trickle for 5 s | One event held too long | The lever is pushed further at 6.9 s: the trickle widens into a twisting, fraying veil; the camera drifts down | A second event inside the shot; the stream visibly changes |
| Paper towel, 14.6–18.3 s | Shows an absence (nothing climbs); third tabletop test in a row; a third tag | A sealed bottle of sparkling water: the cap is twisted, the bottle turns white and erupts | The most surprising consequence; sudden motion and sound |
| Sponge, 18.3–22.2 s | Fourth "hand + object" test | The same bottle clearing from the bottom up, left flat | Follow-through of the eruption: no foam, flat in seconds |
| Storm wide + umbrella soaking through, 40.0–48.7 s | "Look up at the umbrella in the rain" is a stock beat; the soak was a shader effect | Half under the pond at the waterline: rain as shreds and mist with no splashes, a soaked duck riding low, its feet paddling under the line | A frame the channel has never shown; a living animal; small-scale physics |
| Drone rise over garden, park and city with lightning, 48.7–60.3 s | The same rise-and-reveal ending as Oxygen, Friction and the sibling episodes; 10 s with no new event | A dive from the sky down to one wilted sunflower leaf; its tip lets the rain go as a thread, never a drop; the fixed lines play over it | Ends on the smallest scale; ties back to the opening drop |
| The city behind the park | Unrelated city; reads as "city episode" | Fields, woods and low hills that brown with the garden | Keeps the film in the natural world it is about |
| Three "NORMAL WATER WOULD…" tags | A repeated device | One tag (the tap) | Less repetition |
| Time-lapse lawn only | Wilting read late | A sunflower in the middle of the frame bows and browns from the first hours | Shows the cause in one plant, early |

## 4. Shot list (film seconds)

Everything is authored in story time (`script.js`); `CONFIG.edit = [[0, 14.4], [14.6, 21.4], [22.2, 27.8], [29.0, 33.7], [37.45, 44.95], [48.3, 69.6]]`.

| # | Film time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–4.4 | Macro on the counter: a brimming glass with a domed top, round beads. At 1.2–1.6 s the dome collapses and overflows, the beads slump into glossy wet films. | Kitchen tone, birds through the glass, a dripping tap that stops. A taut string goes slack; a low thud. | TITLE (to 3.9) · SURFACE TENSION 72 → 0 mN/m |
| 2 | 4.4–9.6 | Side-on at the tap. Your hand lifts the lever: the trickle never pinches into drops. At 6.9 s you push it further: a wide, twisting, fraying veil. | Click; a smooth hiss that grows; no gurgle. | Tag "NORMAL WATER WOULD BREAK INTO DROPS HERE" · "Water would stop forming drops." |
| 3 | 9.6–14.4 | A glass dish: your fingers lay a paperclip on the water and let go; it glides to the bottom; a faint outline stays where it would have floated. | A glass tink. | "A paperclip used to float on it." |
| 4 | 14.4–21.2 | A sealed bottle of sparkling water, clear. You twist the cap: the seal cracks, the whole bottle turns white and a white column erupts out of the neck, the cap flies off with your hand, spray and shreds rain down. It clears from the bottom up, half empty and flat, on a wet counter. | Ratchet clicks, a sharp hiss, a whoomph and a roar of spray; then silence (no fizz). | NOTHING HOLDS NEW BUBBLES BACK · "Every fizzy drink would erupt when opened." · "All its bubbles form at once. Then it's flat." |
| 5 | 21.2–26.8 | Close on the pond: a water strider steps off a lily pad and falls through. | Garden air, birds, insects, a tiny fizz. | NO SURFACE SKIN TO STAND ON · "Insects that walk on water fall through." |
| 6 | 26.8–31.5 | Potting bench: water poured into a pot runs straight through and off the bench. | Can slosh, hiss into soil. | CAPILLARY RISE 0 mm · "Soil can't hold water either." |
| 7 | 31.5–39.0 | Time-lapse, three days: the sunflower in the middle of the frame bows and browns, the lawn yellows to straw, trees and hills brown. | Ticks speeding up, a souring pad, crickets, fewer birds. | TIME SINCE THE CHANGE · PLANTS WILTING % · two captions on the xylem |
| 8 | 39.0–46.5 | The waterline, half under the pond: rain arrives as shreds and mist, no splashes or rings; a soaked mallard rides low and paddles hard, its feet under the line. | Rain's roar half muffled, low swishes of paddling, tired quacks; no plinks. | ROUND DROPS 0 → DUCK'S FEATHERS SOAKED · "Rain can't hold itself together." · "And feathers can't keep it out." |
| 9 | 46.5–51.7 | The dive: from high over the browned garden and pond, down past the bowed sunflower to one leaf. | The closing chord begins. | SAME WATER · NO DROPS · "Even the rain can't save the garden." |
| 10 | 51.7–60.3 | Macro on the leaf: its tip lets the rain water go as a thin unbroken thread; the pond and the duck behind. A gust at 55.2 s sends a surge down the leaf; still no drop. | Rain, the chord, then quiet. | "It looks like a tiny force…" (52.3) / "…until an entire ecosystem depends on it." (55.1) · note (58.3) · fade |

## 5. Escalation check
Kitchen micro (a drop → a stream → a clip → a bottle) → a living insect → the garden's soil → plants over days → the
weather and a bird → the whole garden from the sky → back down to one leaf. Every shot has a new event within 4–5 s.

## 6. Sound
See the header of `audio.js`. Water's voice is drops (drips, patter, plinks, fizz); without surface tension water only
hisses or roars. Buses: room, water, music; glue compressor + limiter + a fixed trim after the limiter.

## 7. Systems / files
- Reused: CameraController, ViewerHands, StoryHUD, post/Look, fog, Environment (subclassed as `NstGarden`), AudioEngine
  (subclassed as `NstAudio`), BillboardSystem, StreakSystem, batch, SmoothTrack.
- New (film-local, `nst`-prefixed): `water.js` (Fresnel water, NstPuddle, NstStream, NstSpray, nstWetLook, nstSpreadR),
  `kitchen.js` (NstKitchen: glass, beads, tap, dish and paperclip, the sparkling-water bottle and its eruption),
  `garden.js` (NstGarden: sky by day/night/rain, pond, striders, the duck, the sunflower and its leaf thread, bench,
  beds, park, hills, rain), `film.js` (hands, can, the waterline lens, the dive, the tag, the grade), `audio.js`.

## 8. Review log
Version 1 (three rounds of five independent reviewers on frames every 0.5 s; scores out of 10, as given):

| Round | Cut | Retention | Normal viewer | Visual | Cinematography | Physics |
|---|---|---|---|---|---|---|
| 1 | 68.6 s | 5 | 5 | 5.5 | 5 | 7 |
| 2 | 61.0 s | 5 | 6 | 5 | 5 | 7 |
| 3 | 60.3 s | 6 | 5 | 6 | 6 | 8 |

Version 1 differentiation review (against Oxygen, Friction and the four sibling episodes): distinctiveness 7,
keep-watching 5. Version 2 rounds are logged below as they happen.
