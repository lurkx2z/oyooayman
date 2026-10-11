# What If Gravity Doubled? — v2 cinematic mix report

**Page:** `gravity-doubled-narrated-v2.html` (same picture as v1, new soundtrack). **v1 is unchanged** (`gravity-doubled-narrated.html`,
`audio.js`, `soundtrack.js`) and is exported again with its original mix for comparison.

**How it was checked.** Every number below was measured from the rendered audio (BS.1770 K-weighted loudness, 400 ms
momentary and 3 s short-term windows, true peak with 4× oversampling), and the mix was inspected on loudness plots and
spectrograms. Nobody listened to it by ear before delivery (the build runs on a server with no speakers), so a listening
pass on a phone and on headphones is still the real test.

## 1. What changed

| | v1 (the ZIP) | v2 |
|---|---|---|
| Layers | 3 (voice, music, effects), mixed in one pass | **5 separate stems**: narration, music, ambience, movement (foley), physics/impacts. They are rendered one at a time, measured, levelled and only summed at the final export |
| Ducking | one fixed dip of the whole bed under each line | **per stem, from the real word times**: music −8 dB, ambience −7 dB, movement −2.5 dB, impacts −1.5 dB; attack 0.22 s (complete 0.1 s before the first word), hold 0.12 s, release 0.8 s, raised-cosine curves; words closer than 1.2 s count as one spoken window, so there is no pumping between sentences |
| Narration | levelled per clip, light compression | the same five Charlie clips (not regenerated), levelled per clip, −1.5 dB low shelf, +2 dB presence at 3.2 kHz, 3:1 compression; a per-line trim evens the five lines to within 0.1 LU; the silent tail of each file is faded (clip B's file ended on a click) |
| Effects | simple synth blips | **modal synthesis**: every cup, saucer, shard, clamp, table, bench and car panel rings at its own resonant modes; creaks and spring groans are stick-slip friction; shards bounce at their own lane's gravity |
| Music | sparse plucks and sine tones | an original score in F: felt piano, string section, pizzicato, small bells, a felt drum, written to the action (see §6) |
| Master | loudness-normalised to −16 LUFS | gentle glue compression (1.5:1), loudness to −15 LUFS, true-peak limiter (4× oversampled) |

## 2. Final loudness

| | v1 | v2 |
|---|---|---|
| Integrated loudness | −16.4 LUFS | **−14.9 LUFS** |
| True peak (WAV) | −2.0 dBTP | **−2.2 dBTP** (limiter at −2.3 dBFS, touching 0.004 % of samples) |
| True peak (inside the MP4, after AAC) | −2.1 dBTP | **−2.1 dBTP** (target ≤ −1) |
| Loudness range (LRA, MP4) | 5.8 LU | 2.9 LU |
| Narration (its spoken windows) | −14.6 LUFS | −13.7 to −13.8 LUFS per line (spread 0.1 LU) |
| Speech-free sections (all together) | −19.4 LUFS | **−16.1 to −16.8 LUFS** (−14.3 while he stands up) |

## 3. The stems: measured, then levelled

Each stem was rendered alone at 0 dB, measured, then given one gain so that it lands on a target set relative to the
narrator. These gains are stored in `mix-v2.js`, so the page's own live render uses the same balance.

| Stem | Measured alone (speech-free sections) | Target | Gain |
|---|---|---|---|
| Narration | −11.5 LUFS in its spoken windows | −16 LUFS before mastering | −4.5 dB |
| Music | −17.3 LUFS | narrator −3.5 LU | −2.2 dB |
| Ambience | −31.1 LUFS | narrator −10 LU | +5.1 dB |
| Movement (foley) | −17.4 LUFS (90th percentile while active) | narrator −5 LU | −3.6 dB |
| Physics / impacts | −14.6 LUFS (loudest 400 ms: the drop) | narrator +1 LU | −0.4 dB |

Then the master: +2.2 dB to reach −15 LUFS.

## 4. Ducking, measured from the audio

Every ducked stem was also rendered without ducking; the ratio between the two is the duck that was really applied.

| Stem | Set | Measured under speech | Measured away from speech |
|---|---|---|---|
| Music | −8 dB | −8.0 dB | 0.0 dB |
| Ambience | −7 dB | −7.0 dB | 0.0 dB |
| Movement | −2.5 dB | −2.5 dB | 0.0 dB |
| Impacts | −1.5 dB | −1.5 dB | 0.0 dB |

Five spoken windows (one per line): 0.66–2.84, 5.04–10.74, 18.10–29.21, 37.46–44.34, 53.44–58.54 s. Each has one attack
and one release, so the bed never dips and recovers inside a line. Plot: `ducking_measured.png`.

**Narration over everything else** (median of 400 ms blocks while the narrator speaks; how much louder the voice is than
all other stems together):

| Line | Median | Blocks under 6 LU |
|---|---|---|
| A "What if gravity suddenly doubled?" | 7.8 LU | 23 % |
| B "At first, nothing looks different…" | 10.7 LU | 17 % |
| C "Now watch what happens…" | 13.8 LU | 5 % |
| D "Outside, your legs must work harder…" | 10.8 LU | 10 % |
| E "And this is only the first minute…" | 12.0 LU | 7 % |

Line A is the lowest because the room's reaction to the doubling lands on the word "doubled" by design. It is mostly
high clatter above the voice's main band, but it is the moment to listen for on a phone.

## 5. When the narrator stops (the "it suddenly went quiet" problem)

Short-term loudness (3 s) just before the last word, against the lowest point in the 4 s after it:

| After line | v1 drop | v2 drop |
|---|---|---|
| A | 2.5 LU | **1.7 LU** |
| B (into the cup scene) | 3.0 LU | **2.3 LU** |
| C (into the drop) | 3.1 LU | **1.2 LU** |
| D (into standing up) | 3.9 LU | **−0.4 LU** (it gets louder) |

| Section | v1 | v2 |
|---|---|---|
| 2.84–5.02 the doubling's aftermath | −20.7 LUFS | −16.1 LUFS |
| 10.74–18.03 the cup | −19.6 | −16.0 |
| 29.21–37.41 the drop and the replay | −18.1 | −16.8 |
| 44.34–53.42 he stands up | −20.2 | −14.3 |
| 58.54–61.07 the end | −20.7 | −17.3 |
| Quietest 3 s anywhere in the film | −20.7 | −17.9 |

Plot: `v1_vs_v2_loudness.png` (grey v1, white v2, narration shaded).

## 6. The sound design, scene by scene

- **0–2.5 s:** café room tone, the espresso machine's hiss and an occasional gurgle, the square through the glass (a muffled
  murmur, the fountain, a bird), the waiter's cups. A felt-piano figure in F with soft strings, and a short string swell on
  "suddenly doubled".
- **2.52 s, gravity doubles:** no boom. A short soft thump (95 → 48 Hz), then the whole room drops onto its supports at once:
  16 cups and saucers clatter on their tables, spoons jingle, the lamp shades knock, the window panes buzz in their frames,
  chairs and the counter creak, the plant's leaves shiver, the building settles for two seconds. He gasps; the waiter sags.
  The music stops dead, then low cellos and a thin high note come in, with one low piano note and a felt drum.
- **The cup (10.7–18 s, no narration):** fingertips on the handle, the cup stuck to the saucer (it rattles at 14 Hz, as on
  screen), a porcelain squeak as it breaks free and the saucer clacks back down, coffee moving in the cup, the chair under
  his braced weight, an effort grunt, strained breathing, a slow breath through his teeth while he lowers it. **The set-down:
  porcelain on porcelain with a wooden "tock" through the table and three small settle bounces** (timed to the animation's
  bounce), then a long relieved breath. Music: a low A pulse that tightens as he lifts, high strings rubbing a semitone,
  the pulse slowing while he lowers, a held note, then F major and four soft plucks on the set-down.
- **The experiment (line C):** a soft tick-tock pulse and a slow chord walk under the explanation; a bell as each predicted
  time lights up.
- **The drop (29.2–37.4 s, no narration):** the pulse stops; a thin high note and a low swell; silence for the clamps. The
  clamps click open; **the 2 g cup smashes at 0.32 s and the 1 g cup at 0.45 s, exactly when they land on screen. The 2 g
  smash peaks 2.9 dB louder (impact speed √2 higher)**, and its shards bounce sooner because they fall in 2 g. A small bell
  chord for the result. The 5× slow-motion replay re-synthesises both smashes 5× slower and lower, a reverse string swell
  is drawn into the slowed 2 g hit, and when real time resumes the remaining shards finish where they left off.
- **Outside (line D):** gusting wind, the fountain (bubbles and spray), sparrows, pigeon coos, two pigeons' wings as they
  cross, a distant murmur, the jogger catching her breath. Music: the piano figure lower and slower.
- **He stands up (44.3–53.4 s, no narration):** he leans, his palm slaps the car's front wing (a dull, hand-damped ring of
  sheet steel), the springs groan and squeak **only while the body is moving** (driven by the same suspension response that
  moves the car on screen), the bench creaks as his weight leaves it, the top mounts knock as the car rises. Effort grunt,
  shoes scraping, **one heavy step** (his doubled weight on the paving), the passer-by's bag crackling, her gasps. Music
  climbs with each stage of the effort (B♭ → F/A → Gm7 → Csus4), a felt drum on every push, and lands on C major with the
  step, opening into F on the wide shot.
- **The ending (line E):** D minor → B♭ → C → F; the last chord opens into Fmaj9 and decays into the final frame.

## 7. Speech-free sections contain no speech

| Section | Narration stem |
|---|---|
| 0–0.59 s (before the first word) | digital silence until 0.45 s; the clip's quiet lead-in breath after that (peak −48 dBFS) |
| 2.84–5.02 s | the last word ends within 0.03 s; then digital silence |
| 10.74–18.03 s (the cup) | the last word ends within 0.01 s; after that below −52 dBFS (the faded file tail) |
| 29.21–37.41 s (the drop) | the last word ends within 0.09 s; then digital silence |
| 44.34–53.42 s (standing up) | the last word ends within 0.05 s; then digital silence |
| 58.54–61.07 s (the end) | the last word ends within 0.01 s; then digital silence |

No subtitle is on screen in any of them (each line's subtitle clears 0.3 s after its last word, for reading). The breaths,
gasps and effort sounds are wordless foley; the café and plaza murmur is synthetic, filtered and unintelligible.

## 8. Peaks and safety

- No sample clips. The limiter touches 0.004 % of samples (the drop). No clicks were found: the script looked for
  single-sample jumps far above the local level. DC offset is zero.
- Spectral balance against v1: much less sub-bass (20–60 Hz is 14.6 dB lower) and more presence (2–6 kHz is 3.8 dB
  higher), so it plays better on phone speakers.

## 9. Still weak (honest)

- The effects and the music are synthesised, not recorded. Ceramic, creaks and springs are modelled physically and should
  read well. The breaths and grunts are the most likely to sound artificial up close.
- Line A: the room's reaction overlaps "doubled". It is intended, but it is the one place the voice has less than 8 LU of
  clearance.
- Not checked by ear yet (see the top of this report).

## Files

`audio-v2.js` (the stems and sound design), `mix-v2.js` (levels, ducking, voice trims), `render-stems.cjs` (renders each
stem alone), `mix-v2.py` (measure → level → sum → master → verify → report), `soundtrack-v2.js` (the baked v2 mix for the
page). Re-run: `render-stems.cjs <dir>` and `render-stems.cjs <dir> music,amb,foley,sfx --raw`, then
`mix-v2.py <dir> timeline.json <out> --v1 <v1.wav> --use-gains`.
