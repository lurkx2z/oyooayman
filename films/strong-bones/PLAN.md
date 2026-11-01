# What if you were 10× stronger, but your bones weren't? (slug `strong-bones`)

A narrated test film built from the reflex-video study (premise A), in a **2D stickman cartoon** look like the
reference channel, with our own characters. 16:9, 1920×1080, 30 fps.

- **v1** (2026-11-01, 1:24): narrator-led, simple flat sets. Files in `2d/`, `sound/`, `narration*/`. Owner's verdict:
  "visuals look cheap … make the narration talk faster, we want retention, more showing less explaining and more world
  building, people talking to each other."
- **v2** (2026-11-01, 1:14, the current page): files in `v2/`. Built to that note:
  - **Dialogue carries the story.** Seven voices (ElevenLabs via GitHub Actions): narrator Michael (speed 1.15, only
    six short links), you (Liam), Maya your sister (Jessica), the doctor (Alice), the coach (Bill), the stadium
    announcer / TV (Brian), a scaffold worker (Callum). Characters lip-flap on their own words.
  - **Show, don't explain.** The rule is shown (an alarm clock smashed by a tap, a jar, a mug, a hairline-crack x-ray, a
    steel rail bending under your grip), the doctor says the real nuance in one line.
  - **World building.** Eight painted sets with depth (parallax layers, blurred foregrounds), window light, shadows,
    bloom and a colour grade: bedroom at dawn, kitchen, the street, the doctor's office, the gym, the stadium, the street
    outside the stadium at dusk, the living room at night. Side cast with one colour mark each (coach green cap, doctor
    white coat, worker hard hat), a neighbour, a viral phone feed, a GLASS HERCULES billboard, a TV news ticker.
  - **Pace.** 34 shots, a cut every ~2.2 s; the only pause is the choice (let go, run, catch, a breath of silence).

## Story (v2)
Alarm clock smashed → jar → mug handle ("Did you just rip the handle off?" / "I barely touched it!" / "Ow.") → x-ray
→ title on the street → doctor ("Hairline cracks. From a coffee mug." / "Your brain is the only brake you've got.")
→ gym ("Slow. Smooth. Like the bar is made of glass.") → record ("Five hundred and seventy kilos!") → viral feed and
billboard → the final ("Gold is on the line!") → Maya outside on the phone under a scaffold → a bolt shears ("It's
going! Get clear!") → "Maya!" → "Catch it, and both your arms snap." → coach: "Don't you dare let go of that bar!" →
let go, run, catch, both arms crack → TV: "…and the gold goes to Aranda." → "You're such an idiot. …Thank you." →
you hold out the jar in two casts: "Can you open this for me?" → "Would you have caught it?"

## Files (v2)
- `strong-bones.html` — the page (Space plays). Canvas 2D, no WebGL.
- `v2/VO-*.md` — one voice script per character; `v2/voices/<role>/` — the clips + word timings (from Actions).
- `v2/build-timing.cjs` → `v2/timing.js` (gaps measured between spoken words).
- `v2/core.js` (player, cached layers, parallax camera, bloom, grade), `v2/rig.js` (stickmen, costumes, lip-flap),
  `v2/props.js` (painted building blocks), `v2/world.js` (the eight sets), `v2/items.js` (story objects),
  `v2/shots.js` (the edit), `v2/hud.js` (captions with a speaker dot, title, question).
- `v2/sound/cues.cjs` → `cues.json`; `v2/sound/mix.py` (score, hits, ambience beds, voices, ducking);
  `v2/sound/master.sh` (−15 LUFS, about −2 dBTP) → `v2/sound/out/mix.m4a` and `v2/soundtrack.js`.
- `v2/stills.cjs`, `v2/render.cjs` (parallel cloud render).

## Rebuild (v2)
```bash
node films/strong-bones/v2/build-timing.cjs
node films/strong-bones/v2/sound/cues.cjs && python3 films/strong-bones/v2/sound/mix.py && bash films/strong-bones/v2/sound/master.sh
NODE_PATH=$(npm root -g) node films/strong-bones/v2/render.cjs --out renders/strong-bones-v2 --workers 4
```
