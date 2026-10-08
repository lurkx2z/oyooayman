# Episode report: WHAT IF WATER LOST ALL SURFACE TENSION? (version 2)

## TITLE
WHAT IF WATER LOST ALL SURFACE TENSION? (slug `no-surface-tension`, page `no-surface-tension.html`)

## BRANCH
`episode/no-surface-tension-agxw3u` (the branch this session was assigned). Pull request #2 tracks it; nothing is
merged. Version 1 is commit 7f52dbf; version 2 is the redesign asked for by the owner's creative-direction override of
2026-10-08: "Use beautiful, strange microscopic physics. Water striders, droplets, capillary tubes, bubbles and
small-scale phenomena. Don't force unrelated city destruction. Make invisible physics fascinating."

## DURATION
60.1 s film (1803 frames at 30 fps, 1080×1920). Authored as 65.7 s of story time and cut by
`CONFIG.edit = [[0, 14.4], [14.6, 21.4], [22.2, 27.8], [29.0, 43.6], [47.0, 65.7]]`.

## PHYSICS RULE
At 1.2 s the surface tension of liquid water (72 mN/m at 20 °C) starts to fall; it is 0 by 1.6 s and stays there.
Everything else is held constant: water's density, viscosity and chemistry, how strongly it sticks to solids, every
other liquid, gravity and air. On screen: "WATER ONLY · EVERYTHING ELSE NORMAL" and the end note "FICTIONAL RULE: ONLY
WATER'S SURFACE TENSION CHANGED / TIME COMPRESSED". Consequences shown, one per beat: no drops (the domed glass and its
beads slump, the tap stream can't pinch off), a paperclip sinks, sparkling water erupts when opened (the nucleation
barrier ∝ σ³ vanishes) and goes flat, a water strider falls through, water climbs no capillary tube (Jurin rise → 0),
air breaks the water column in a plant's xylem (air-seeding pressure ∝ σ / pore size) so plants wilt, rain can't hold
together and a leaf tip can't make a drop, and a duck's feathers soak through (entry pressure ∝ σ). Full rules and what
the film must not claim: `PLAN.md` § 1.

## SCENES CHANGED (version 1 → version 2, film seconds)
| Version 1 | Version 2 | Why |
|---|---|---|
| 0–4.4 glass and beads | kept | The title shot works; the change happens on it |
| 4.4–9.6 tap, one trickle | kept, plus a second push at 6.9 and pale ghost drops beside the stream where normal water would pinch off | One event in 5 s; reviewers read it as an ordinary tap |
| 9.6–14.6 paperclip | kept (its ghost removed: it read as a second clip) | Clear, short |
| 14.6–18.3 paper towel, 18.3–22.2 sponge | 14.4–21.2 a bottle of sparkling water erupts when opened, then clears and is flat | Towel and sponge showed an absence; the eruption is the film's most surprising consequence |
| 22.2–27.8 water strider | 21.2–26.8 kept | The owner named striders |
| 27.8–32.5 watering a pot of soil | 26.8–31.5 four glass capillary tubes in a dish; water climbs none; ghost columns rise 2.5–9.9 cm | The owner named capillary tubes; the soil claim overreached |
| 32.5–40.0 wide garden time-lapse with a clock | 31.5–37.0 inside a sunflower stem: air breaks the water column with a click; 37.0–41.4 one sunflower wilting over three days | Shows the cause of wilting at the microscopic scale; the wide clock time-lapse was recycled |
| 40.0–44.3 storm wide | 41.4–45.2 the wilted leaf's tip in the rain lets water go as a thread; a ghost drop forms where a real one can't | Small-scale and strange; pays off the opening's "no drops" |
| 44.3–48.7 umbrella soaks through | 45.2–46.8 crane down the thread to the pond's waterline | "Look up at the umbrella in the rain" is a stock beat |
| 48.7–60.3 drone rise over garden, park and city with lightning | 46.8–60.1 at the waterline a soaked duck rides low beside the faint ghost of where it used to float, sinks and beats its wings; on the closing line the rain stops, a low sun comes out, and it tries to take off and can't (no tilt up) | The rise-over-a-city ending was the channel's template; this ends on one bird, level with the water |
| City beyond the park | fields, woods and hills | The owner's standing rule: no generic cities |
| "NORMAL WATER WOULD …" world tags | none; pale ghosts carry "what normal water would do", explained once in the HUD ("WHITE = …") | A floating label broke the style |

The closing caption ("It looks like a tiny force…" / "…until an entire ecosystem depends on it.") is the owner's and
was not changed.

## REUSED SYSTEMS
CameraController, ViewerHands, StoryHUD (title, captions, readouts, notes), post-processing and Look, fog, Edit
(`CONFIG.edit`), Environment (subclassed as `NstGarden`), AudioEngine (subclassed as `NstAudio`, baked), BillboardSystem,
StreakSystem, geometry batching, the seeded noise and Track/Timeline core, and the tools (stills, check-page,
render-parallel, render-wav, bake-soundtrack, encode-final). No engine file was edited. Version 1's water material,
spreading puddles, tap stream, kitchen, pond, striders, bench, wilting and rain were kept and extended.

## NEW SYSTEMS (version 2)
All film-local and `nst`/`Nst`-prefixed, in `films/no-surface-tension/`:
- `kitchen.js`: the sparkling-water bottle (cap twist, whitening, eruption column, spray, clearing from the bottom up,
  the flat remainder) and the tap's ghost drops.
- `tubes.js` (new): `NstTubes`, the capillary demo: a glass dish with ink, four tubes with different bores, a cm card,
  ghost columns that climb to the Jurin heights.
- `stem.js` (new): `NstStem`, the inside of a sunflower stem built far below the garden with unlit materials: cell
  texture, ringed xylem vessels, water streaming up, an air bubble through a pore, the column snapping. Also
  `nstGlassy`, the fresnel material used for glass, water and ghosts.
- `garden.js`: the sunflower that bows over the pond, its leaf-tip thread and ghost drop, the mallard (wings, paddling,
  soaking, sinking) and its ghost outline, fields and woods instead of the city.
- `film.js`: the waterline lens (half above, half below the pond), the flown finale camera, the watering can's pour
  into the dish, the grade.
- `audio.js`: the eruption, the stem's hum, hiss and clicks, the duck, ghost notes, cut whooshes.

## ASSETS ADDED
None. Everything is procedural; the only data file is the baked soundtrack `soundtrack.js` (1.64 MB), generated by
`tools/bake-soundtrack.cjs`. No third-party media.

## MAJOR TIMESTAMPS (film seconds)
| Time | Beat |
|---|---|
| 0–3.9 | Centred title over a brimming glass; HUD SURFACE TENSION 72 → 0 mN/m (1.2–1.6) |
| 4.4 / 6.9 | Tap: a column that never pinches off, ghost drops beside it; opened further |
| 9.6 | Paperclip sinks |
| 15.55 | The bottle opens and erupts; 18.5 it is flat |
| 22.8 | The water strider falls through |
| 27.4–29.1 | Pouring into the dish; 29.5–31.0 ghost columns climb the tubes |
| 33.85 / 34.2 / 35.35 | Inside the stem: air through a pore, the middle column snaps, then the right |
| 37.0–41.4 | Three days: the sunflower wilts over the pond |
| 41.4 | Rain; the leaf tip lets water go as a thread |
| 46.8 | The waterline: the soaked duck, its faint ghost floating higher; a slow push-in to the end; 50.0 it sinks and beats its wings |
| 51.8 / 54.7 | "It looks like a tiny force…" / "…until an entire ecosystem depends on it." |
| 55.0–57.5 | The rain stops, a low sun comes out on the house and the duck |
| 56.45–57.6 | The duck tries to take off, wings flailing, and slumps back in, lower |
| 57.9–60.1 | End note, fade to black |

## FINAL AUDIT
Three independent reviewers watched the real 1080×1920 MP4 of the version 2 draft (frames every 0.5 s plus the cut
frames, against Oxygen, Friction and the four sibling episodes). Scores out of 10, as given:

| Reviewer | Scores |
|---|---|
| Production audit | retention 5.5, normal viewer 6, visual 6, cinematography 5.5 |
| "What feels recycled" | distinctiveness 7, keep-watching 5 |
| Physics | physics 8, clarity 7 |

Output checks on the draft (all passed): 1080×1920, 30 fps, 1803 frames, 60.1 s, 26.6 MiB, −17.3 LUFS, −2.3 dBTP,
audio and video start together and match the soundtrack to 2 ms, the stem's clicks land on the snaps, no black or
frozen stretches.

**What felt recycled (film seconds):** the rainy finale with its tilt up to the plant (41.4–60.1: the channel's
"camera tilts up at the end" move), the ghost-of-normal device used five times (tap, clip, tubes, leaf drop, duck),
and the day-counter time-lapse (37.0–41.4). Called distinctive and worth keeping: the stem snap, the bottle eruption,
the tube ghosts, the strider falling through, the split waterline framing, the tap rope.

**Weak timestamps found (film seconds):** a hand pop on the cut frames at 9.60 and 14.40; spray drawn through the hand
at 15.6–15.8; the eruption's jets vanishing for a frame at 17.90; the caption over the bottle at 17.3–18.25; the
time-lapse flipping from day to night within two frames at 37.63, 38.33, 39.03 and 39.80, with white leaf flashes at
38.4 and 39.85; the flower looking yellow again on day 3 (41.0); the leaf not matching across the cut at 41.43; the
pond reading as concrete at 45.5–46.3; the duck popping in at 46.33; at the waterline (46.8–60.1) the line sat at 64 %
of the frame, so the caption covered the duck's body, the bright ghost outshone the dark duck against dark rocks, and
the shot had no new event after 54.7 except the tilt; an 11-word caption at 34.25–36.95. Physics: the stem showed a
round bubble and curved menisci (none can form without surface tension), the ghost duck floated entirely above the
water (a dry duck sits about 40 % under), the tap's ghosts were too few to read.

**The three highest-impact problems, fixed:**
1. **The ending was flat and hid its own evidence.** Now the camera stays level with the pond with the line just above
   the middle (the caption sits below the duck's feet), the duck is lit in its own colours, its ghost is fainter, sits
   at a real dry duck's draft and carries on under the line, the camera pushes in slowly from 46.8 to the end, the duck
   is on the pond from the start of the finale (no pop-in), and the tilt up is gone: on the closing line the rain stops,
   a low sun comes out on the house and the duck (55.0–57.5), and the duck tries to take off and can't (56.45–57.6).
2. **The ghosts were confusing.** The paperclip's ghost is gone (it read as a second clip); the tap's ghost drops are
   smaller, faster and many, under the label "WHITE = WHAT NORMAL WATER WOULD DO", and the tap stream no longer swells;
   the tube ghosts rise right after the pour under "WHITE = WHERE NORMAL WATER WOULD CLIMB"; the duck's ghost as above.
3. **Glitches and the stem's physics.** The hand pops at the cuts (hand keys now 0.01 s before a cut), the vanishing
   jets (a square root of a negative number), the time-lapse strobe (light now averaged over half a second, so each dusk
   and dawn takes about 15 frames), the stem (a ragged tongue of air along the wall, flat column ends, water draining
   down the walls, "SLOWED DOWN" in the readout), and the wet counters (darker and glossier).

**Independent re-check of the fixed output** (one reviewer, the real 1080×1920 MP4 against the draft, scores out of 10
as given): retention 5, normal viewer 6, visual 6, cinematography 5.5, physics 8, distinctiveness 7.5, keep-watching
5.5. It confirmed as fixed: the caption clear of the duck, no tilt up, the hand pops, the paperclip ghost, the stem
(no round bubble, flat ends), mostly the tube ghosts. It found new problems in the reworked ending, which were then
fixed and re-rendered: a blown-out glare under the water at 46.50 (a lamp added to light the duck lit the pond's
underside: replaced by a self-light in the duck's own material), the leaf's thread landing on the duck's head like a
puppet string (the duck now sits left of the thread), a hard wedge of shadow on the sunlit wall (a higher sun), and
nothing new after 53.5 s (the planned gust on the leaf did not show; the last event is now the failed take-off at
56.45). These last fixes were
checked in stills of the real renderer, not re-scored.

## REMAINING WEAKNESSES
- **The hook (0–14.4 s) is still the weakest stretch.** A glass, a thin stream, a paperclip: the strongest image (the
  eruption at 15.55) arrives at a quarter of the runtime. Not reworked in this round. Fix next: open on the bottle.
- **The tap's ghost drops** sit on the stream and can read as beads sliding down a normal low-flow tap (5.6–9.6); the
  "WHITE = …" line in the HUD is small on a phone.
- **The duck's ghost overlaps the real duck** (47.6–56.4): it reads as a glass duck sitting a little higher, which is
  right but busy.
- **Continuity 37–46.3 s:** pale backlit leaves in the time-lapse (38.5, 40.0; no longer a strobe), the dried flower
  still looks golden on day 3 (41.0), the hero leaf changes colour across the cut at 41.43, and the pond reads as a grey
  slab at 45.5–46.3.
- **Captions:** the caption covers the bottle's label at 17.3–18.25; the stem caption is 11 words (34.25–36.95).
- **The bottom 40 % of the waterline shot is plain teal water** for 13 s (the captions live there).
- No one has listened to the sound; it is measured (−17.3 LUFS, −2.2 dBTP), not heard.

## FINAL PREVIEW PATH
- Final MP4 (in the project's files, not in the repo): `no-surface-tension/no-surface-tension_v2.mp4`. Checked:
  1080×1920, 30 fps, 1803 frames, 60.1 s, 26.6 MiB, −17.3 LUFS integrated, −2.4 dBTP, audio and video both start at 0
  and match the soundtrack to 2 ms, no black or frozen stretches apart from the fade at the end.
- Runnable ZIP: `no-surface-tension/no-surface-tension_v2_film.zip` (unzip, open `no-surface-tension.html`, press
  Space; tested: boots, no console errors, sound ready).
- Or from the repo: open `no-surface-tension.html` and press Space.

## PERFORMANCE / FPS
- The final render ran headless on a software renderer with 4 workers at 1080×1920.
- Everything is a pure function of time (seeded, no `Math.random`, no wall clock), so any frame renders identically.

## REVIEW NOTES
Scores out of 10, as given by independent reviewers (full log: `PLAN.md` § 8).

| Version / round | Retention | Normal viewer | Visual | Cinematography | Physics | Distinctiveness | Keep-watching |
|---|---|---|---|---|---|---|---|
| v1 round 3 (final) | 6 | 5 | 6 | 6 | 8 | 7 | 5 |
| v2 round 1 | 5.5 | 6 | 5.5 | 5 | 7 | 8 | 5 |
| v2 round 2 | 4.5 | 5.5 | 5 | 4.5 | 8 | 7 | 5 |
| v2 final audit of the draft MP4 | 5.5 | 6 | 6 | 5.5 | 8 | 7 | 5 |
| v2 re-check after the top-3 fixes | 5 | 6 | 6 | 5.5 | 8 | 7.5 | 5.5 |
