# What If Gravity Doubled? — verification report

Two exports of the same picture: **v1** (the original mix, as in the ZIP) and **v2** (the cinematic mix, see
`MIX_V2_REPORT.md`). Everything below was measured from the exported files or read from the running page.

## 1. The exported files

| | v1 original mix | v2 cinematic mix |
|---|---|---|
| File | `gravity-doubled-narrated_v1_original-mix_1920x1080.mp4` | `gravity-doubled-narrated_v2_cinematic-mix_1920x1080.mp4` |
| Size | 26.8 MiB | 26.8 MiB |
| Picture | 1920×1080, 30 fps, 1832 frames, H.264 | identical (the decoded video streams have the same MD5, `8430d3c5…`) |
| Duration | 61.067 s | 61.067 s |
| Audio | AAC 160 kb/s, 48 kHz stereo | AAC 160 kb/s, 48 kHz stereo |
| Integrated loudness (in the MP4) | −16.4 LUFS | **−14.9 LUFS** |
| True peak (in the MP4, after AAC) | −2.1 dBTP | **−2.1 dBTP** |
| Loudness range | 5.8 LU | 2.9 LU |

- Black frames: only 60.80–61.03 s, the planned fade to black at the end. No other black frame.
- Frozen picture: none (no stretch of 1 s or more without change).
- Both pages (`gravity-doubled-narrated.html`, `gravity-doubled-narrated-v2.html`) boot with no errors and play their
  baked soundtrack (`tools/check-page.cjs`).

## 2. Physics (read from the page while it runs)

| | 1 g lane | 2 g lane | Textbook (no air) |
|---|---|---|---|
| Fall time from 1.00 m | 0.452 s | 0.3195 s | √(2h/g) = 0.4515 s / 0.3193 s |
| Impact speed | 4.43 m/s | 6.27 m/s | √(2gh) = 4.43 / 6.26 m/s (√2 faster) |

The film steps each lane's own trajectory until the cup reaches the floor (0.5 ms steps); the timers, the impact, the
shards and the sound all read that one landing time.

**Both cups break, and that is right.** A ceramic cup dropped 1 m onto a hard floor hits at about 4.4 m/s and normally
breaks at ordinary gravity too. At 2 g it lands sooner and √2 faster (with twice the impact energy), so its smash is
harder: in the sound it peaks 2.9 dB louder and its shards fly and land in 2 g. A version where only the 2 g cup breaks
would need a softer floor or a lower drop.

The car: each spring sits 9 cm compressed and each tyre 1.2 cm at 1 g, so at 2 g the body sits about 10 cm lower. The
ride frequency stays 1.66 Hz (√(k/m): neither the spring rate nor the mass changes), damping ratio 0.28. His push on the
front wing dips the front about 3 cm and it rocks back at the same frequency. The v2 spring sounds are driven by that
same suspension response, so they sound only while the body moves on screen.

## 3. Sound in sync with the picture (v2, measured on the impacts stem)

| Event | On screen | Sound onset | Difference |
|---|---|---|---|
| Gravity doubles (the room drops onto its supports) | 2.520 s (frame 75.6) | 2.524 s | +4 ms |
| The cup is set down | 16.440 s (frame 493.2) | 16.440 s | 0 ms |
| The clamps open | 30.460 s (frame 913.8) | 30.460 s | 0 ms |
| The 2 g cup lands | 30.780 s (frame 923.4) | 30.779 s | −1 ms |
| The 1 g cup lands | 30.912 s (frame 927.4) | 30.912 s | 0 ms |

The ducking follows the real word times from the forced alignment (`narration-timing.js`): five spoken windows, each
duck complete 0.1 s before the first word and released after the last. The measured duck depths match the settings
exactly (see `MIX_V2_REPORT.md` §4).

## 4. Narration-free sections

The narration stem is silent in every speech-free section (each last word decays within 0.01–0.09 s, then digital
silence or below −52 dBFS) and no subtitle is on screen there. Details: `MIX_V2_REPORT.md` §7, `NO_VO_SECTIONS.md`.

## 5. What was not checked

- **Nobody has listened to the mix by ear.** It was checked by measurement (loudness, true peak, ducking, onsets,
  clicks), loudness plots and spectrograms. A listen on a phone speaker and on headphones is the remaining test.
- The physics is idealised (no air resistance); at 1 m the drag on a cup changes the fall time by well under 1 %.
