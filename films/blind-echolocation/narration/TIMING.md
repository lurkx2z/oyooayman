# Narration timing: "What If You Went Blind... And Learned to See With Sound?" (7-minute documentary)

Fourteen Charlie clips, one per scene, generated from `../NARRATION.md`, which holds every NARRATOR block of the approved
screenplay word for word (ElevenLabs, voice IKne3meq5aSn9XLyUdCD, model eleven_v4, stability 0.4, similarity 0.75, normal
speed, MP3 44.1 kHz 128 kb/s). Every word was then re-timed with ElevenLabs forced alignment. The NO NARRATION and
VISUAL-ONLY blocks have no clip.

- `NN-sXX-*.mp3`: the clip.
- `NN-sXX-*.align.json`: every word with its start and end, in seconds from the start of the MP3 (`words`).
  `tts_words` holds the generator's own, less exact timing; ignore it.
- `timing.json`: per clip, the measured length, the first and last word, the pauses, the loudness, the checks and the fit
  against the script. Built from the files by measurement.
- `manifest.json`: written by the generator. Its `seconds` include MP3 padding (about 0.06 s); use
  `decoded_seconds` from `timing.json`.

"Narration room" is the scene's slot minus its NO NARRATION seconds, as the screenplay gives them.

| Scene | Clip | Length | Speech (first → last word) | Script slot | Narration room | Over by |
|---|---|---|---|---|---|---|
| 1 | `01-s01-last-sight.mp3` | 25.92 s | 0.10 → 25.70 s | 0:00–0:30 (30 s) | 25 s | **+0.9 s** |
| 2 | `02-s02-without-light.mp3` | 26.32 s | 0.06 → 25.76 s | 0:30–0:58 (28 s) | 28 s | fits (1.7 s spare) |
| 3 | `03-s03-first-echo.mp3` | 25.68 s | 0.10 → 25.14 s | 0:58–1:30 (32 s) | 26 s | fits (0.3 s spare) |
| 4 | `04-s04-how-it-works.mp3` | 28.08 s | 0.12 → 27.58 s | 1:30–2:00 (30 s) | 25 s | **+3.1 s** |
| 5 | `05-s05-building-a-world.mp3` | 33.12 s | 0.08 → 32.50 s | 2:00–2:33 (33 s) | 27 s | **+6.1 s** |
| 6 | `06-s06-what-it-reveals.mp3` | 30.08 s | 0.08 → 29.48 s | 2:33–3:04 (31 s) | 25 s | **+5.1 s** |
| 7 | `07-s07-brain.mp3` | 30.56 s | 0.02 → 30.12 s | 3:04–3:32 (28 s) | 23 s | **+7.6 s** |
| 8 | `08-s08-quiet-room.mp3` | 28.80 s | 0.00 → 28.24 s | 3:32–4:02 (30 s) | 23 s | **+5.8 s** |
| 9 | `09-s09-city.mp3` | 33.36 s | 0.10 → 32.84 s | 4:02–4:31 (29 s) | 24 s | **+9.4 s** |
| 10 | `10-s10-rain.mp3` | 30.24 s | 0.10 → 29.52 s | 4:31–5:02 (31 s) | 25 s | **+5.2 s** |
| 11 | `11-s11-not-a-picture.mp3` | 33.84 s | 0.06 → 33.32 s | 5:02–5:32 (30 s) | 25 s | **+8.8 s** |
| 12 | `12-s12-final-experiment.mp3` | 24.00 s | 0.10 → 23.48 s | 5:32–6:03 (31 s) | 22 s | **+2.0 s** |
| 13 | `13-s13-world-returns.mp3` | 30.64 s | 0.10 → 30.16 s | 6:03–6:31 (28 s) | 23 s | **+7.6 s** |
| 14 | `14-s14-last-question.mp3` | 27.68 s | 0.14 → 27.50 s | 6:31–7:00 (29 s) | 24 s | **+3.7 s** |

**Total voice: 408.3 s (6:48).** Charlie reads at a natural 142 words a minute. The screenplay's slots assume about
170, so 12 of the 14 scenes run longer than their room, by 65 s in all. With the screenplay's 75 s of narration-free
moments kept as written, the film comes out at about **8:05** rather than 7:00. The screenplay says the seven minutes is
a target, not a reason to cut speech or speed up the voice, so the scenes grow to fit the clips.

## Checks

- **No word is missing or cut off.** Forced alignment placed all 969 words of the script (every clip's count matches),
  and every word has sound in its span. The softest are unstressed sentence endings ("beside you.", "of it.") at about
  −33 dBFS peak.
- **No clip stops mid-word.** Each clip ends 0.18–0.72 s after its last word, in silence.
- **End clicks in clips 02, 10 and 11.** The last 30 ms of each file jumps to −18, −36 and −25 dBFS after a silent tail,
  0.5–0.7 s after the last word. Fade every clip out at `fade_out_after` in `timing.json` (last word + 0.3 s) and they
  never play. The other eleven clips end cleanly.
- **Clips 05, 08 and 10 have sound from their first millisecond.** In 08 it is the start of "But"; in 10 it is a soft
  sound 0.1 s before "Then" (the word itself is intact). Fade them in over 10 ms at most, so no word is touched.
- **The clips are quiet**: −28.6 to −30.3 LUFS, true peak −7.4 to −11.5 dBTP. Normalise them in the mix (the gravity
  films' voice chain brings each line to about −14.6 LUFS).
- Pauses longer than 0.25 s inside each clip are in `timing.json` (`pauses_over_0_25s`). They are natural places for
  picture changes.

Measured from the files, not listened to by ear.
