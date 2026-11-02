# Would Eren and Light agree? (slug `eren-light`)

A narrated 2D story film, 16:9 1920×1080, 30 fps, 5:49. Two famous characters who each decided to fix the world by
killing (a boy with a notebook that kills by name, a boy who commands an army of giants) meet at midnight and compare
their ideals over four rounds. Same storytelling format as `know-everything` (the narrator tells the story beat by
beat, characters speak short lines on top), but a new look, built to the owner's note: *"I've seen a lot of stickman
channels that look exactly like ours. Make the graphics extremely unique, our own distinct style."*

Original designs only. The two leads are suggested by hair, clothes and colour (a neat suit and red tie; a green
cloak and long tied-back hair), never by copied art, footage, music or audio.

## The look: "living manga"
Every frame is painted in Canvas 2D and then run through one WebGL ink shader (`core.js`), so the film reads as a
printed manga page in motion:
- tones become **screentone dots** on a fixed 45° grid; near-black becomes solid ink; light becomes warm paper;
- hard edges become **ink lines** (Sobel);
- only **two colours** survive at full strength: Light's crimson and Eren's green. Everything else is ink and paper.
  The whole argument is colour-coded: red rule versus green rule;
- **impact frames**: on the biggest beats the page flips to stark negative for a few frames;
- speed-line and screentone backdrops for close-ups, panel splits, a torn round card, stamps (AGREE / CLASH).

Close-ups use a dedicated bust renderer (`portrait.js`): a 3/4 head in head units, cel-shaded, eyes with lid clipping,
iris fibres and catchlights, brows that act, mouth shapes, glowing slit eyes in silhouette, sweat, rain-wet hair.
Wide station shots use the full-body figure rig (`figure.js`).

## Story (word-timed to the voices)
1. **Cold open (0–24 s)** — a pen writes a name; 40 seconds; a man falls on the other side of the world. The ground
   shakes; a wall of giants walks over the horizon. "Two boys… Tonight, they meet." **Title.**
2. **The station** — midnight, an empty station on no map, rain on the glass roof, the clock stopped at 12. Light
   arrives first (the notebook and its rule, a diagram). Eren comes in from the rain (15 m giant; every giant obeys
   him; he remembers the future). "You're late." / "I knew where you'd be sitting." **Two rules** on screen: a name and
   a face, versus a future that can't be changed. "Before the night is over, they're going to collide."
3. **Round 1: what's wrong with the world?** Light: the world is rotten. Eren: born in a cage, Walls 50 m high.
   They agree (stamp).
4. **Round 2: how many would you kill?** Light: only the guilty, crime down. Eren: 80 % of humanity. "You're the
   worst criminal who ever lived." / "The agents who followed you weren't criminals." / "They were in the way." /
   "So were mine." Same excuse ("necessary"), different size. Agree, though neither admits it.
5. **Round 3: what does the new world look like?** Light describes a world watched by its god; Eren's face changes:
   "That's a wall, with you on top of it." / "Freedom to burn everything down?" / "Freedom is freedom." CLASH, the
   board cracks.
6. **Round 4: how does your story end?** "I win. I rule. Forever." / "I lose. I die. And my friends become the
   heroes who stopped me." Verdict: on the problem yes, on the cure never.
7. **The countdown** — the clock clicks to 12:00:01 and the station moves. Light writes the name; a red 40-second
   counter runs exactly 40 s from the last stroke to the narrator's "Forty". "I've seen how I die. It isn't here. And
   it isn't you." Then 17 s with no narration: rain, ticks, heartbeat, the two faces, the eyes. At 40: nothing.
   Light waits for him to fall. Eren smiles. The lights go out; four eyes stay lit.
8. **Question** — "So which rule wins? The notebook… or the future?" over the four eyes.

## Voices (ElevenLabs via GitHub Actions, `.github/workflows/narrate-eren-light.yml`)
Narrator Michael (speed 1.06; slow takes for the title, the count and the question in `VO-narrator-slow.md`), Eren
(Callum), Light (Eric). Scripts: `VO-*.md`; clips and word timings in `voices/<role>/`. `build-timing.cjs` places the
clips and writes `timing.js` (`KET`), including the exact countdown times.

## Sound (`sound/`)
`cues.cjs` → `cues.json` (every music and effect cue on word times) → `mix.py` (numpy synthesis: piano, formant choir,
organ, brass, taiko, bell, drone, string ostinato; pen scratch, ticks, heartbeat, giant stomps, stamps, crack, door,
wet steps, light switches; rain beds; voices normalised; music ducked 6 dB under speech) → `master.sh` (two-pass
loudnorm to −15 LUFS / −1.5 dBTP, limiter, `mix.m4a`, `mix.mp3`, and `../soundtrack.js` for the page).

## Files
- `../../eren-light.html` — the page (click the picture or press Space).
- `core.js` (player, layers, camera, the ink shader), `figure.js` (full-body rig), `portrait.js` (close-up busts),
  `props.js`, `world.js` (station, walls, cities), `items.js`, `elements.js` (notebook, pen and hands, eyes, giants),
  `shots.js` (the edit, 94 shots on word times), `hud.js` (captions with speaker dots, place cards, the countdown, the
  closing question).
- `render.cjs` — parallel cloud render (Playwright frames → x264 → concat + `sound/out/mix.m4a`).
- `stills.cjs` — stills for review.

## Final (2026-11-02)
See `EPISODE_REPORT.md`.
