# What If Gravity Doubled? — v3 dynamic mix report

**Page:** `gravity-doubled-narrated-v3.html` (the same picture as v1 and v2: the decoded video streams of all three MP4s
have the same MD5). v2 (`audio-v2.js`, `mix-v2.js`, `soundtrack-v2.js`) is unchanged and stays the comparison.

**The brief for v3.** v2 fixed the loudness: the film no longer went quiet when the narrator stopped. Its loudness range,
though, was only 3.0 LU: everything sat at about the same level. v3 keeps the overall level and adds dynamics. The cup
should land hard, the moment before the drop should be quiet enough to create anticipation, and the music should build
the tension. The aim was better sound design, not a louder mix.

**How it was checked.** By measurement (BS.1770 loudness, true peak, a "punch" measure for every key hit), loudness
plots and spectrograms. It has not been listened to by ear: the build runs on a server with no speakers.

## 1. The numbers

| | v1 | v2 | **v3** |
|---|---|---|---|
| Integrated loudness (MP4) | −16.4 LUFS | −14.9 LUFS | **−15.1 LUFS** |
| True peak (MP4, after AAC) | −2.1 dBTP | −2.1 dBTP | **−1.9 dBTP** |
| Loudness range (LRA) | 5.8 LU | 3.0 LU | **4.3 LU** |
| Short-term loudness, 10th → 95th percentile | −20.1 → −14.3 | −16.8 → −13.7 | **−17.8 → −13.6** |
| Narration, per line | −14.6 | −13.7 to −13.8 | **−14.6 (all five lines)** |

v1's range of 5.8 LU came from the sound dropping out between lines, which was the original problem. v3's range comes
from deliberate quiet moments and from builds.

**Punch.** For each hit: the loudest 50 ms in the first 0.2 s, against the second just before it.

| Hit | v2 | **v3** | What changed |
|---|---|---|---|
| ★ The cup set down | 9.5 LU | **16.2 LU** | The second before it drops from −19.3 to −24.2 LUFS: the music and the café hold their breath. The hit itself is 1.8 dB louder, with a soft low "dum" of the table taking a cup that weighs twice as much |
| The clamps open | 6.6 LU | **9.2 LU** | They click in near silence |
| ★ The 2 g cup smashes | 10.7 LU | **14.2 LU** | The swell is cut 0.46 s before the release, so the smash lands out of silence; it is 1 dB louder, with a new crunch layer |
| The 1 g cup smashes | 7.7 LU | **10.7 LU** | Same |
| ★ His heavy step | 6.1 LU | **6.8 LU** (and 1.4 dB louder) | It lands at the top of a crescendo rather than out of silence, so it is louder rather than more sudden |
| The palm on the car | 6.2 LU | 5.9 LU | Unchanged; it opens the stand-up sequence |
| Gravity doubles | 3.3 LU | 3.8 LU | It happens on the word "doubled", so the voice is in the second before it |

Picture: `v2_vs_v3_hits_spectrogram.png` (v2 above v3: in v3 the moment before each hit is dark, so the hit stands alone).

## 2. The dynamics map

`mix-v3.js` holds a level curve for each stem, written against the film's own beats (so it follows the timing), on top
of v2's ducking. Scene by scene:

| Moment | What the sound does |
|---|---|
| 2.1–2.5 s, gravity about to double | The music and the piano are gone 80 ms before the hit, and the café ambience dips 10 dB ("a breath in"). The room's crash lands in that gap |
| 2.6–7 s, after the doubling | The square outside goes quiet (the murmur stops) and the birds fall silent. A smaller, uneasy murmur comes back a few seconds later |
| 10.7–16.4 s, the cup | Intimate: closer breathing and effort (+3 dB), the café recedes (−3 to −8 dB), the pulse builds to the top of the lift, then eases as he lowers it |
| 16.1–16.44 s, just before the cup touches | A hush: the music drops 16 dB and the held note ends 0.3 s before contact. Then the set-down, and F major blooms |
| 26.4–30.0 s, end of line C | The ticking clock gives way to a soft heartbeat (lub-dub) that quickens and grows, with a string swell under it |
| 30.0–30.46 s, before the clamps | 0.46 s of near silence (only the faintest room tone), then the click, then the smashes |
| 32.3–35.3 s, slow-motion replay | Muffled and dreamlike (music −3 dB, room −9 dB) under the slowed smashes |
| 36.4–37.05 s, into the plaza | A J-cut: the square's wind and fountain arrive 0.7 s before the picture cuts outside |
| 44.6–49.5 s, he stands up | The longest build: it starts low (music −9 dB, square −6 dB), climbs with each stage of the effort and peaks at his step (+4.5 dB), then opens out on the wide shot |
| 58.5–61.07 s, the end | The final chord blooms after the last word, then music and ambience fade with the picture |

Short-term loudness of the speech-free sections:

| Section | v2 | v3 |
|---|---|---|
| 2.83–5.02, after the doubling | −16.1 | −17.3 (the stunned café) |
| 10.74–18.03, the cup | −16.0 | −16.1, minimum −18.9 (the hush) |
| 29.21–37.41, the drop and the replay | −16.8 | −17.8, minimum −19.3 |
| 44.34–53.42, standing up | −14.3 | −14.3, but now a build: from −15.8 to a peak of −12.3 at the step |
| 58.54–61.07, the end | −17.3 | −18.9 (the fade) |

Plots: `v1_vs_v2_vs_v3_loudness.png` (3 s) and `momentary_v3.png` (400 ms; v2 in amber, v3 in white).

## 3. Sound design changes

- **The smash:** a dense crunch of micro-fractures in the first ≈60 ms, as the ceramic gives way. There are 40 + 50·(v/4.43)²
  tiny high rings thinning out exponentially, so the 2 g cup crunches more than the 1 g cup.
- **The set-down:** a soft low "dum" (108 Hz, 35 ms) of the table top under the porcelain and wood.
- **The café before the doubling:** a spoon stirring a cup at the next table, two taps on the rim, a newspaper page.
- **After the doubling:** the square outside stops talking, and the birds stop for six seconds.
- **The plaza:** leaves rustling in the trees with the gusts, and people crossing the far side of the square with slow,
  heavy steps.
- **Score:** a heartbeat build before the drop. The cup's pulse and held notes end before contact. A bloom on the
  last chord.
- **Breathing:** the airflow now flutters irregularly instead of holding a steady hiss, and the effort sounds have 40 %
  less voiced buzz. They were the sounds most likely to sound artificial in v2.
- **Master:** no glue compressor. Only the true-peak limiter touches the sum: 0.006 % of samples, on the hits.

## 4. Unchanged from v2 (re-checked)

- Ducking: music −8, ambience −7, foley −2.5, impacts −1.5 dB under the narrator. The measured depths match exactly.
- Narration clarity (median of voice over everything else) per line:
  - A: 7.8 LU
  - B: 12.4 LU
  - C: 13.6 LU
  - D: 11.3 LU
  - E: 12.4 LU
- Speech-free sections contain no speech: the narration stem is silent in every one of them and no subtitle is shown.

## 5. Still weak (honest)

- **Not listened to by ear.** Everything above is measured.
- **After line B, v3 dips 3.6 LU** (v2: 2.3 LU, v1: 3.0 LU). This is the cup scene easing toward the hush before the
  set-down. It is filled with close breathing and the pulse, but it is the one place where "quieter" could read as
  "empty". Check it on the phone.
- **The overall range is 4.3 LU.** Going much wider would mean quieter speech-free sections, which brings back v1's
  problem.
- **Line A** still has the least clearance (7.8 LU), because the room's crash lands on "doubled" on purpose.
- **Synthesised sound.** The effects and the music are synthesised, not recorded.

## Files

- `audio-v3.js`: v2's sound design plus the v3 changes.
- `mix-v3.js`: levels, ducking and the dynamics map.
- `soundtrack-v3.js`: the baked v3 mix.
- `render-stems.cjs`: renders each stem; use `--page gravity-doubled-narrated-v3.html` for v3.
- `mix-stems.py`: measure, master, verify and plot.

To re-run:

```
render-stems.cjs <dir> voice,music,amb,foley,sfx --page gravity-doubled-narrated-v3.html
render-stems.cjs <dir> music,amb,foley,sfx --raw --page gravity-doubled-narrated-v3.html
mix-stems.py <dir> timeline.json <out> --mix mix-v3.js --name v3 --ref v1=<v1.wav> --ref v2=<v2.wav> --use-gains
```
