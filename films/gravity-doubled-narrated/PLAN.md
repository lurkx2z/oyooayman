# What If Gravity Doubled? — first narrated film test

**Page:** `gravity-doubled-narrated.html` · **Format:** 16:9, 1920×1080, 30 fps, ≈61 s · **Branch:** `episode/gravity-doubled-narrated-*`
**Built on:** the cinematic-hybrid café + plaza prototype (`gravity-breakfast-v4`), copied into this folder (the prototype
pages are untouched).

## How it is made (voice first)

1. `NARRATION.md` holds the five approved lines, word for word.
2. The GitHub Actions workflow **Narrate episode** (`.github/workflows/narrate-episode.yml`) runs
   `tools/narrate-aligned.cjs` with the `ELEVENLABS_API_KEY` repo secret (the key never leaves GitHub's secret store).
   It generates one MP3 per line (Charlie, `eleven_v4`, stability 0.4, similarity 0.75, all five identical settings),
   then re-times every word with ElevenLabs forced alignment, and commits `narration/` back to the branch.
3. `build-timing.cjs` measures each clip's real duration, pauses (ffmpeg silencedetect) and loudness (EBU R128),
   places the clips (`PLACE`, the only hand-set numbers) and writes `narration-timing.js` (window.GN: absolute word
   times, subtitle phrases, per-clip gain) and `narration-audio.js` (the MP3s as base64, so the page can play them).
4. `script.js` derives every beat (cuts, actions, sound cues) from GN's word times. Change a clip → re-run
   `build-timing.cjs` → the film follows.
5. `audio.js` renders the three layers in one offline pass: VOICE (the five clips, levelled to the same loudness, light
   compression), MUSIC (original pluck motif + pads, ducked ≈10 dB under every line), SFX (synthesised foley keyed to the
   action and to the measured physics). The mix is loudness-normalised to −16 LUFS / −1.5 dBTP and baked into
   `soundtrack.js`.

## Timeline (film seconds, from the real audio)

| Scene | Time | Narration | Picture |
|---|---|---|---|
| S1 | 0.0–4.85 | A 0.50–2.83 "What if gravity suddenly doubled?" | Café, slow push to his steaming cup; gauge 1.0 → 2.0 g on "doubled" (2.52) |
| S2 | 4.85–12.74 | B 5.00–10.74 | Room wide ("nothing looks different") → medium as he reaches → close-up: grip (8.88), the pull starts on "weight" (10.44) |
| S3 | 12.74–17.80 | none | One take of hands + face: the cup up ~10 cm, trembling, carefully lowered, down at 16.44, fingers open 16.84 |
| S4 | 17.80–32.26 | C 18.00–29.21 | Match cut to the 2 g cup in its release clamp → both lanes, metre stick, labels, predicted times lit as spoken |
| S5 | 29.21–37.05 | none | Anticipation hold, release 30.46, 2 g lands 30.78, 1 g lands 30.91; 5× slow-motion replay 32.26–35.26; result holds |
| S6 | 37.05–44.64 | D 37.40–44.34 | Plaza: across the car's bonnet, the man on the bench tries to stand and sinks back; wheel close-up with the 1 g outline |
| S7 | 44.64–52.80 | none | He braces on the car's wing (the car dips), comes up, a slow step; the car rocks back; the passer-by fights to stay up |
| S8 | 52.80–61.07 | E 53.40–58.54 | Crane pull-back over the square; music resolves; fade in the last 1.3 s |

## Physics (idealised, no air)

- Fall from 1.00 m: t = √(2h/g) → 0.452 s at 9.81 m/s², 0.319 s at 19.62 m/s². The film steps each lane's own
  trajectory to find the landing; timers, impacts, shards and sound all read that value.
- Impact speed √(2gh): 4.43 → 6.26 m/s (√2 harder). Shards launch in proportion and fall in their lane's g.
- Car: static spring sag doubles at 2 g (+9 cm spring, +1.2 cm tyre ≈ 10 cm lower), ride frequency unchanged (√(k/m)).
  His push on the wing (≈half his doubled weight) dips the front ~3 cm; it rocks back at the same 1.66 Hz.

## Status

- [x] Voice generated and aligned (5 clips, 33.6 s of speech)
- [x] Timeline built around the real audio, all scenes in place, mix baked
- [ ] Preview + independent reviews + fixes
- [ ] Final 1080p MP4 and reports
