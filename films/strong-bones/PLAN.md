# What if you were 10× stronger, but your bones weren't? (slug `strong-bones`)

A narrated test film built from the reflex-video study (premise A). The owner chose a **2D stickman cartoon** look
like the reference channel, with our own characters: you (teal hoodie) and your sister (yellow hoodie, ponytail).
16:9, 1920×1080, 30 fps, runtime **1:24** (84.5 s). The brief asked for about a minute; the voice script alone
runs ~70 s, so the cut is longer than asked.

## Story (voice leads the edit)
1. Hook in the first second: you open a jar and the lid comes off with the top of the glass. The mug handle snaps off.
   Your sister: "Did you just... rip the handle off?"
2. Title card: WHAT IF YOU WERE 10× STRONGER / BUT YOUR BONES WEREN'T?
3. The rule (forearm blueprint, MUSCLE ×10 vs BONE ×1) and the real nuance (REAL tag: seizures and shocks can break
   the body's own bones; the brain holds muscles back).
4. Learning control (an egg in trembling hands), then a world record by 300 kilos. "Glass Hercules."
5. Olympic final, last lift. Through the loading door the scaffolding leans over your sister.
6. "Catch it, and both your arms break." Hands on the bar, the release, the sprint, the catch, x-ray crack.
7. Six seconds of silence, then the night kitchen: TV shows gold to someone else, you in two casts. Sister:
   "You're such an idiot. ...Thank you."
8. A letter from OSTEON LABS: "We can build you bones that keep up." End question: "Would you have caught it?"

## Voices
ElevenLabs via GitHub Actions (`.github/workflows/narrate-strong-bones.yml`, repo secret). Narrator Michael
(`NARRATION.md`), sister Jessica (`NARRATION-SISTER.md`). Word timings drive captions and cues.

## Files
- `strong-bones.html` — the page (Space plays). Canvas 2D, no WebGL.
- `build-timing.cjs` → `timing.js` (clip layout and gaps).
- `2d/core.js` (helpers, SIM, pure function of time), `2d/rig.js` (stickman rig and poses), `2d/sets.js`
  (kitchen, arena, outside), `2d/shots.js` (shot list and drawing), `2d/hud.js` (captions, title, tags).
- `2d/stills.cjs` (look at frames), `2d/render.cjs` (parallel cloud render to MP4).
- `sound/cues.cjs` → `cues.json`; `sound/mix.py` (score, effects, voices, ducking); `sound/master.sh`
  (−15 LUFS, −1.5 dBTP) → `sound/out/mix.m4a` and `soundtrack.js`.

## Rebuild
```bash
node films/strong-bones/build-timing.cjs
node films/strong-bones/sound/cues.cjs && python3 films/strong-bones/sound/mix.py && bash films/strong-bones/sound/master.sh
NODE_PATH=$(npm root -g) node films/strong-bones/2d/render.cjs --out renders/strong-bones --workers 4
```
