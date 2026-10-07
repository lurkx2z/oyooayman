# Sound guide

> Every soundtrack in this repo is **synthesised in code** (Web Audio), rendered offline into one buffer that is
> sample-locked to the timeline, and baked to MP3 inside `films/<slug>/soundtrack.js`. No sound files exist.
> Nobody can listen in the cloud container. Every sound decision is verified by measurement and by reasoning.

## 1. Architecture

```
films/<slug>/audio.js:   class XxAudio extends AudioEngine { fingerprintData() {…}  _build(ctx) {…} }
                                 │  schedules every cue at ABSOLUTE STORY TIMES into an OfflineAudioContext
                                 ▼
AudioEngine.renderOffline() → declick → Edit.spliceAudio (follows CONFIG.edit cuts/slow-mo) → AudioBuffer
          ▲ prepare(): uses window.FILM_SOUNDTRACK (baked MP3) if its fingerprint matches, else renders live
          │ play(t): starts the buffer at offset t; the picture follows the audio clock (clockTime) → perfect sync
tools/bake-soundtrack.cjs → films/<slug>/soundtrack.js   (loaded by the page before js/main.js)
```

- `app.audio` is created in `FILM.build`. Construct it with the timeline: `new XxAudio(app.tl, app)`.
- The listener follows `SCRIPT.camera` x/z/yaw. `this._spatial(posFn, t0, t1)` + `this._applySpatial(pts, gain.gain,
  pan.pan, [filter.frequency])` give distance attenuation, pan, Doppler and air absorption for moving sources (cars,
  aircraft, people).
- Typical bus structure:
  - `world` bus: ambience, diegetic, can be muffled with LPF/gain automation for subjective moments;
  - `you` bus: breath, heartbeat, body;
  - `score` bus: music, kept apart from Earth sounds in the space films;
  - `reverb` sends;
  - mix chain `mixIn` (×2–5.6) → DynamicsCompressor → `out` → limiter (≈ −2.5 dB, ratio 20).
- Override `renderOffline` only for mastering (Air: a soft clip at 0.6 + 0.2·tanh, a 4 ms fade before a hard cut,
  true silence after).

## 2. Philosophy

- **Sound sells the physics.** Friction sliding is near-silent (scraping *is* friction); the return is a wall of
  screech/thud. Oxygen: engines stutter and die, flames go silent, a muffled pressure thump in your head (no boom), an
  airliner gliding with only windmilling fans. Space is silent (Andromeda, Moon). Only diegetic Earth sounds plus a
  non-diegetic score.
- **Ambience first:** every scene has a bed (city air, rain, wind, crickets, room tone, battlefield rumble). Silence
  must be a choice, not a gap.
- **Foley for the body:** footsteps tied to the walk (skip them across cuts), slips, thuds, breath, heartbeat, gasps,
  hands on surfaces (a pole rings, a palm on glass).
- **Physics-event sounds are synchronised to the simulation's events** (Friction maps `world.events` impacts through
  `frFilmT`; Slip schedules glass at the burst time). Distant events arrive late at 343 m/s (Oxygen's impact thud 1.5 s
  after the dust, at 510 m).
- **Music supports, SFX dominate.** Curiosity → tension → pulse → near-silence before the payoff → impact → a quiet low
  tone or chord. For the parody: *"Music should escalate as though this is a genuine extinction event."* No meme
  sounds, no comedy music.
- **Silence is the strongest tool.** Use it at least once or twice:
  - 0.5–1 s before the payoff or after a collapse;
  - total silence at an impact (Slip's gate cuts all sound, including the reverb tail);
  - a single raindrop under the punchline;
  - silence before Killua first moves.
- **Edit points:** sync a beat, a camera move, an action and a VFX on the same frame (Crossover at 120 BPM: a beat
  every 0.5 s, cuts on bar lines).
- **Dialogue** has no TTS: subtitles (`SCRIPT.hud.says`) plus formant "voice" blips, laughs and chatter
  (`SoundKit.voice/laugh/chatter`).

## 3. Layering recipe (per scene)

1. Bed: filtered noise layers (wind/rain/room), slow LFOs. Stereo.
2. Mid: diegetic sources with `_spatial` (traffic, people, machines).
3. Close: your body (steps, breath, heartbeat, cloth).
4. Events: impacts (`thump`, `boom`, `crunch`, `clunk`, glass), tonal hits.
5. Score: pads/drones/plucks/piano (`tone`, `pluck`), drums for action, risers into the payoff.
6. Automation: duck the bed under captions or big moments; low-pass the world for subjective states (hypoxia,
   derealization, countdown narrowing).

## 4. Verification (no ears needed)

```bash
NODE_PATH=$(npm root -g) node tools/render-wav.cjs <slug>.html /tmp/<slug>.wav
for t in $(seq 0 4 76); do printf "$t "; ffmpeg -hide_banner -ss $t -t 4 -i /tmp/<slug>.wav -af volumedetect -f null - 2>&1 \
  | grep -E "mean_volume|max_volume" | awk '{printf $5" "}'; echo; done          # per-window mean/max dB
ffmpeg -hide_banner -i /tmp/<slug>.wav -af ebur128 -f null - 2>&1 | grep -A3 "Integrated"   # target ≈ −16…−17 LUFS
```

- Check that the deliberate silences really read −90 dB, that busy sections aren't clipping (max < −1 dB), that early
  quiet sections aren't inaudible (Andromeda's score was at −56 dB early), and that the mix isn't sub-only.
- Locate a problem cue by bisecting: temporarily disable `_build` sub-methods and re-render (the old `audiobisect`
  approach).
- Measured finals: Oxygen silence RMS 0; Andromeda −16.7 LUFS; Moon −17.2; Sim −16.8; Air −16.4.

## 5. Temporary vs final audio

- The synthesised soundtrack **is** the final audio in everything shipped. The briefs allowed "temporary sounds
  replaced in editing", but the owner has never replaced them (as far as we know; **NEEDS VERIFICATION**).
- **⤓ WAV** in the dev bar and `tools/render-wav.cjs` export the exact synced soundtrack if anyone wants to remix it.
- Optional recorded upgrades were listed (tyre screech, crash, city ambience, siren; CC0 WAV) but never added. See
  `ASSET_GUIDE.md` § 6 for how to embed them.

## 6. Common mistakes (all happened)

| Mistake | Symptom | Fix |
|---|---|---|
| Exponential ramps shorter than a 128-sample block in the offline renderer | single full-scale clicks at random block boundaries | per-film overrides: linear-attack `S.env` + `setTargetAtTime` decay, `S.tone` with ≥ 6 ms attack, linear `S.breath`; `AudioEngine.declick(buf, 0.3)` (finer 0.15 pass if needed); bake noisy shakers into buffers |
| A noise source started before its gain envelope | a spike at the start of a cue | start sources at/after the envelope start |
| Mix too quiet (≈ −38 dBFS) | inaudible on phones | makeup gain (`mixIn`) + compressor + limiter |
| Mix too loud (−13 LUFS, +2.5 dBTP) | clipping after AAC | lower `mixIn`, soft clip, check true peak |
| Sub-bass drones as the main body | phones play nothing | move energy to 80–400 Hz; cut the sub |
| Outdoor or cue sounds running past their scene | crickets under the bedroom, the kite chord to the end | cap every cue at its scene's end time |
| Engine AM tremolo gain bug | a huge wobble | scale it (`0.035·v`) |
| Editing `js/audio/audioEngine.js` | every film's baked soundtrack goes stale | don't; or re-bake all films |
| Changing `SCRIPT` after baking | page says PREPARING SOUND… for minutes | re-bake as the last step; check with `tools/check-page.cjs` |
| Sounds on cuts | footsteps across a hard cut | skip cut windows; Edit splicing crossfades only 25 ms |
