# Episode report — *What if magnets got 1,000 times stronger for 10 seconds?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 5:08 (308.25 s). Voiceless, in the Gravity tilts 90° / Gravity keeps
tilting / Friction 10 s formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in
the first seconds, a real-physics nod in the first minute, about five to six minutes, tension to the last frame), the
rule of 29 October 2026 (**the story clock only runs forward**) and "more new scenery" (4 November): a narrowboat on a
river, a scrapyard on a steel-walled wharf with a crane and a lifting magnet, a hospital's MRI suite across the water,
a bypass bridge and wind turbines on a hill. No kitchen, flat, street or city set reused.

Page `magnets-1000x.html`, code `films/magnets-1000x/`. Every number is in `PLAN.md` § 2 (computed in `physics.js`);
captions are in `CAPTIONS.md`.

**The rule.** At 10:42:00 AM on a Saturday every magnet's field becomes 1,000 times stronger, for ten seconds. Earth's
own field stays as it is. Steel stays steel: it saturates, so its pull grows ×1,000 (up to ×10⁶ for unsaturated steel
and for magnet on magnet, like your phone).

**The one impossible part**, said at 2:25: a magnet's two ends would squeeze each other with 3.9 million atmospheres
(more than at Earth's centre), so a real one would tear itself apart; and the field's energy comes from nowhere.

## The clock (`MG_CLOCK`, `script.js`)

| film | story | speed |
|---|---|---|
| 0:00–0:02.9 | 10:41:55.2–10:42:00.000 | real speed, under the title |
| 0:02.9–1:17.1 | 10:42:00.000–00.150 | 217× to 1,794× slower (the radio, your phone, the pile, the cube law, the MRI) |
| 1:17.1–2:53.6 | 10:42:00.150–01.950 | 25× to 136× slower (the cylinder, the water, the waiting room, the steel, your boat, the cars) |
| 2:53.6–3:41.6 | 10:42:01.950–05.850 | 6× to 28× slower (the bridge, the turbines, your mum at the tiller) |
| 3:41.6–4:18.4 | 10:42:05.850–07.000 | 7× to 150× slower (the kettle; your phone torn away and hitting the ball) |
| 4:18.4–4:33.4 | 10:42:07.000–10.000 | 4× to 6× slower (the count: your bike, the boat hits the wall and is lifted) |
| 4:33.4–4:44.6 | 10:42:10.000–12.200 | 8× and 4× slower (back to normal: the boat drops, the ball lets go) |
| 4:44.6–4:54.3 | 10:42:12.2–21.9 | real speed |
| 4:54.3–5:08.3 | 10:43:10–10:43:24 | real speed, after a "+1 min" jump at the cut |

`script.js` throws if the clock runs backwards, if a caption that names a moment ("It's coming through the wall", "You
can't hold it", "It just hit the ball", "The nearest are flying", "There goes your bike", "It's pulling the boat out of
the water", "less than 9 metres") doesn't sit on it, or if any of 12 caption numbers drifts from `physics.js`.

The film is told by:
- 59 short second-person captions;
- the HUD: ×1,000 / ×1, back to normal in …, the next moment, your boat's distance from the ball, the clock and how
  slowly it runs;
- one context box per beat (steel on the magnet, the cylinder's speed, phones on the wall, the pull on your boat…);
- labels pinned in the scene (YOUR BOAT, THE BALL, NORMAL REACH / NOW, the turbines' distance, the gap to the wall);
- insets: the cube law, tesla from a fridge magnet to the frog to this MRI, the squeeze, the pull against distance;
- one-line footnotes, the honest "APPROX." and "GENEROUS" ones included;
- the sound.

## Shot list (39 shots)

| time | shot | story (s after 10:42:00) |
|---|---|---|
| 0:00–0:05.5 | the title over your boat's roof, the scrapyard across the water | −3.85 → 0.006 |
| 0:05.5–0:11.6 | your eyes on the yard's magnet as it slams on | → 0.022 |
| 0:11.6–0:21.5 | the radio on the hatch: still on, silent | → 0.046 |
| 0:21.5–0:31.9 | your hand holding your phone against the pull (trembling, dragged toward the yard) | → 0.072 |
| 0:31.9–0:47.6 | the pile lifting into a ball; the crane's rope snapping | → 0.128 |
| 0:47.6–1:02.7 | from above: the reach rings (1.8 m → 14.6 m), your boat 20 m off | → 0.142 |
| 1:02.7–1:17.1 | the hospital across the river; the MRI room; the cutaway plan | → 0.150 |
| 1:17.1–1:28.5 | the oxygen cylinder in the corridor; it bursts through the wall into the bore | → 0.328 |
| 1:28.5–1:57.8 | the cup of water thrown out; the waiting room's phones wrenched round and torn away | → 0.860 |
| 1:57.8–2:25.1 | steel hitting the ball at up to 780 km/h; your boat's hull; from above, the boat sliding | → 1.341 |
| 2:25.1–2:38.3 | "Officially, this is impossible": the ball from your boat | → 1.575 |
| 2:38.3–2:40.9 | check-in: your boat, over the ball's shoulder | → 1.620 |
| 2:40.9–2:51.0 | the old cars rolling and flying at the ball | → 1.920 |
| 2:51.0–2:53.6 | check-in: your boat, low on the water | → 1.950 |
| 2:53.6–3:07.8 | the bridge: every electric car skidding | → 2.459 |
| 3:07.8–3:10.4 | check-in: the ball, from your eyes | → 2.550 |
| 3:10.4–3:25.4 | the turbines 1.6 km away; a blade falling | → 3.450 |
| 3:25.4–3:41.6 | your mum at the tiller, the engine flat out, losing | → 5.850 |
| 3:41.6–3:57.7 | the galley: tins sliding to the rail, the kettle off the stove | → 6.130 |
| 3:57.7–4:08.5 | your phone torn out of your hand; side-on as it streaks into the ball at 1,783 km/h | → 6.800 |
| 4:08.5–4:18.4 | from above: less than 9 m to the wall | → 7.000 |
| 4:18.4–4:33.4 | the count: your bike torn off the roof; the boat hits the wall and is lifted | → 10.000 |
| 4:33.4–4:54.3 | 10:42:10: the boat drops back; the ball lets go, its core thuds onto the heap | → 21.9 |
| 4:54.3–5:08.3 | +1 min: a spanner holding nails; your boat against the wall; the question | 70 → 84 |

## How it follows the owner's lessons

- Everyday place, bizarre physics: a family's narrowboat on a Saturday morning beside a scrapyard.
- Action in the first 5 s: the radio goes silent and the magnet slams on at 0:02.9, under the title.
- A real-physics nod in minute one: a speaker is a coil in a magnet's field (0:12), the cube law (0:48), the 1997 frog
  (1:29).
- About five minutes, no filler; the clock never replays a second.
- Your boat is the throughline: its distance is on the HUD from 2:09 to 10:42:10, with three check-ins between the
  far-away beats.
- Tension to the last frame: the count, the crash, the lift; then "How many magnets are you holding right now?"
- Music leads, beds and effects well under it, measured stem by stem (§ Sound).

## Reviews

Round 1 (the first full cut, 5:08, 114 frames, three per shot, no sound). Three independent reviewers; their scores
as given:

- **Story and retention:** hook 5, clarity 6, tension 5, pacing 4, ending 6 (out of 10). Swipe points: 0:11–0:30 (the
  radio and phone static at 400× slower), the rope shot (empty sky), four near-still hospital shots, the water beat
  too long, your boat forgotten for 68 s, a murky scrap close-up at the end. Highest-impact fix: make the boat the
  throughline.
- **Visuals:** overall 5, composition 5, readability 4, hero moments 4, consistency 6. Strongest: the waiting room,
  the heap falling, the boat stuck at the wall, the title, the overhead approach. Weakest: the rope, the turbines in
  fog, the after shot (camera inside the heap), the corridor, the escape and swans shots, the galley, white water at
  low angles, "splash of white balls".
- **Physics:** accuracy 6, honesty 7. The arithmetic was praised (the squeeze, the frog, saturated against unsaturated
  steel, ×10⁶ for the phone). Wrong or misleading: the radio's speaker "tearing" (a 1,000× field brakes the cone almost
  dead), "8 times harder" (than what?), "stuck to the wall" and "a magnet now" (steel keeps only a little), the
  waiting room's 2.4× against a 5× grip (the twist is what tears phones away), a generous lifting magnet, the ball's
  core would stay a crushed lump, "every electric car".

**Fixes made after round 1:**
- Story: your boat's distance on the HUD for the whole middle; three check-in shots; the swans and escape beats cut;
  the NEXT line varied; repeated captions rewritten; the hospital's frozen stretch shortened (the cylinder now moves);
  the turbine beat's close shot now covers the falling blades; your phone hand trembles and is dragged toward the yard.
- Physics (captions, labels and pictures): the radio goes silent and stays lit; "8 times harder than the engine can
  push"; the waiting room's phones are wrenched round like compass needles first; "about 6 metres", "about 2.4 times",
  "up to 5,500 g", "thrown out", "tear itself apart", "Most electric cars… every electric one"; the cube law caption
  adds "pulls steel from 8 times as far"; a GENEROUS footnote on the lifting magnet; the energy from nowhere named as
  part of the impossible thing; the ending's core stays one crushed, partly welded lump; "keeps a little magnetism",
  shown by a spanner holding nails; "Paperclips will stick to its hull".
- Visuals: the rope thick and cream; the turbines in a tighter, clearer view; the after shot moved out of the heap to
  the spanner with the heap behind; the water darker with less sky in it; the scrap darker and more metallic; the
  galley in straight planks with dimmer windows, tins that tip at the rail; smaller splash spray; the lift shot low
  and close; the phone's streak into the ball close and bright.

No second scoring round was run: the scores above are the first cut's.

## What is still weak

- The first 1:17 runs 200× to 1,800× slower: the radio, phone, reach and hospital set-up shots are nearly still
  pictures carried by captions and the HUD. The hand now trembles, but this is still the film's slowest stretch.
- The far turbines are pale against a pale sky; the close shot of a falling blade carries the beat.
- The scrap ball is made of simple blocks; up close (the phone's hit) it reads as boxes.
- The water at very low angles is still light; the splash spray is still puffy.
- The lifting magnet is generous (about 10× a real one's far field), and the footnote says so; the oxygen cylinder's
  speed into the 3,000 T bore is lower than the model would give.
- Real effects the film leaves out (from the physics review): the grid failing (every transformer and generator),
  compasses and phone maps pointing at the yard, loose magnets in earbuds and speakers, oxygen in the air drawn into
  the MRI's bore, eddy-current kicks at 10:42:00 and 10:42:10.

## Sound

No narrator: the captions are silent and the sound carries the gaps. Three stems, everything synthesised from seeded
code (`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score** (D minor, a five-note motif): a held, uneasy opening; bells on the cube law; glassy strings in the
  hospital; a low ostinato for your boat that comes back at each check-in; a stinger on "impossible"; driving pulses
  for the cars, the bridge and the turbines; a held breath in the galley; the count's climb and its cut at 10:42:10;
  a quiet, open ending under the question;
- **the beds**, by place: the river (water on the hull, wind, birds before and after, your boat's engine, flat out from
  10:42:01), inside the hull, the hospital (ventilation, mains hum, the MRI's cold-head pump), the bridge's traffic,
  the hill's wind; from 10:42:00 they run at the world's own slowed speed;
- **the effects**, each on its story moment: the radio's song stopping dead (one soft tock), every magnet's hum cut
  at 10:42:10, the crane's clank and the rope's twang, steel groaning and clanking into the ball, the cylinder's
  scrape, the wall bursting and the crash in the bore, phones smacking the wall and people crying out, tyres and horns
  on the bridge, the turbines' crack, tins and the kettle, your phone's whoosh and hit, the bike, the boat hitting the
  wall, the water pouring off the hull and the drop, the ball letting go, sirens and ticking scrap afterwards.

**Mix.** −14.6 LUFS integrated, −2.4 dBTP, loudness range 6.0 LU (the baked WAV). The mastered
`final-soundtrack.m4a` (AAC 256k, through a limiter at −3 dB) measures −14.7 LUFS and −2.7 dBTP;
`small-soundtrack.m4a` (AAC 128k, for the phone-size copy) measures −14.8 LUFS and −3.0 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, ebur128) in 10-second
windows across the whole film:
- over the beds: 7.9 to about 22 dB (median about 13.7 dB). The closest is 3:00, the bridge's traffic.
- over the effects: 5.9 to 24 dB (median about 13.5 dB). The closest are 2:00 (steel hitting the ball) and 0:30 (the
  pile groaning, the rope snapping).
- These come from solo stems rendered just before two last changes, which are added in arithmetically: the beds came
  up 2 dB (they sat about 16 dB under, more than the rule asks), and the score's count climax came down 3.5 dB (it sat
  10 dB over the rest of the film).
- stem trims: music +2.5, beds −4.5, effects −4.5 dB (`mix.js`).
- The baked soundtrack (`soundtrack.js`, MP3 160k) carries the code's fingerprint; `tools/check-page.cjs` reports
  SOUND READY at once, so the baked copy is accepted.

## Delivery

- **Runnable ZIP** `magnets-1000x-film.zip` (in the project files): extract it, open `magnets-1000x.html` in Chrome
  or Edge, wait for SOUND READY, press Space. The soundtrack is baked in and checked against the code's fingerprint.
- **Final 1080p MP4** on the owner's PC (graphics card), one command in the repo folder after pulling this branch:
  `node films/magnets-1000x/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\magnets-1000x --small`.
  - It makes `D:\renders\magnets-1000x\magnets-1000x_final_1080p.mp4`: 1920×1080, 30 fps, H.264 CRF 18, 5:08, with
    the mastered soundtrack `final-soundtrack.m4a` copied in.
  - With `--small` it also makes `magnets-1000x_final_small.mp4` (1280×720, under 30 MiB).
  - It is resumable: run it again and finished segments are kept.
- **Thumbnails** (house style) in the project files: `thumb-phone.jpg` (your phone streaking into the ball),
  `thumb-ball.jpg` (the ball over your boat), `thumb-mri.jpg` (the cylinder through the MRI room's wall).

## Files

`magnets-1000x.html` and `films/magnets-1000x/`: `CAPTIONS.md` (the story), `build-timing.cjs` → `timing.js`,
`layout.js` (where everything is), `physics.js` (every number), `script.js` (the clock and the caption checks),
`shots.js`, `film.js`, `kit.js`, `cast.js`, `river.js`, `yard.js`, `boat.js`, `riverset.js` (the river's cameras and
labels), `hospital.js`, `hud.js`, `audiokit.js`, `audio.js`, `mix.js`, `sound-lib.js`, `sound-music.js`,
`sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked), `final-soundtrack.m4a`, `small-soundtrack.m4a`,
`render-gpu.cjs`, `PLAN.md`, this report.
