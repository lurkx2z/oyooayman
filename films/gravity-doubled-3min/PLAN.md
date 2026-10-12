# What If Gravity Doubled? Episode 01: The Day Everything Became Heavy (3-minute test)

Page: `gravity-doubled-3min.html` · 1920×1080 · 30 fps · 179.7 s · branch `episode/gravity-doubled-3min-*`
Approved script: the owner's 12-scene script of 2026-10-11 (narration word for word in `NARRATION.md`).
Narration: seven ElevenLabs clips (Charlie), generated once by the narrated-test thread and never regenerated
(`narration/`). The picture is cut around their measured durations and word times.

Built on the narrated film test (`films/gravity-doubled-narrated/`): same café, plaza, characters, rig, post, gravity
logic and v3 dynamic-mix approach, copied into this folder (the 60 s film is untouched).

## Master timeline (film seconds, from `script.js` / `timeline.json`)

| Scene | Narration | Picture | Window |
|---|---|---|---|
| 1 The moment it happens | clip 1, 0.40–10.58 | café at sunrise, title, push to his cup; on "heavy" (10.35) gravity 1.0 → 2.0 g, the arm sinks, the cup clacks down | 0–13.25 |
| 2 First struggle | none | close on the hand: grip, brace, the lift (≈6 cm), the tremble, the slow set-down at 20.85; one take on hands and face; aftermath | 13.25–24.8 |
| 3 Same mass, double weight | clip 3, 25.20–38.01 | a blue hologram twin of the cup: MASS 0.25 kg unchanged; his body label (75 kg, 736 N → 1,472 N); the WEIGHT arrow grows 1× → 2× on "twice as hard" | 24.8–39.9 |
| 4 The experiment | clip 4, 40.40–58.87 | two identical ceramic balls, 1.00 m, 1 g and 2 g lanes; predicted 0.45 s / 0.32 s light up as spoken; impact energy 6.3 J / 12.6 J; the clamps close up | 39.9–60.47 |
| 5 The drop | none | both clamps open at 60.47; landings at 0.452 s and 0.320 s; bounces; 4× slow-motion replay with a strobe trail; measured results held | 60.47–71.1 |
| 6 Your body | clip 6, 71.60–87.31 | "It's you": he pushes up from the chair (knees low angle, legs trembling), braced on the table; a customer climbs the stairs, a hand to her chest | 71.1–87.71 |
| 7 The stairs | none | he walks to the stairs, takes the rail, climbs one step, tries the second, the foot comes back down; close on his hand on the rail, then his face | 87.71–100.4 |
| 8 The city reacts | clip 8, 100.80–123.27 | the plaza, people resting; the car's 1 g ride-height line vs now (≈10 cm lower); a cyclist barely lifts her bike off the rack; the fountain jet with its 1 g height line ("half"); people against walls and on the bench | 100.4–123.72 |
| 9 Without words | none | she pushes the bike up the gentle ramp (a pause halfway); the wide reveal of the short jets; him at the edge of the square, a hand on a bollard | 123.72–138.8 |
| 10 The bigger question | clip 10, 139.20–158.97 | the wide square (crane); he looks at the skyline; an engineer under a loaded balcony bracket, its gauge at 2.0× design load, rated margin 2.5×; back to him | 138.8–159.42 |
| 11 Silent reveal | none | a shopper pulls a fallen jogger to her feet; the slow rising wide over the square at low sun, short jets sparkling | 159.42–169.6 |
| 12 The final question | clip 12, 170.00–176.70 | from behind him across the square to the skyline, rising; fade starts 0.6 s after the last word; the final note decays | 169.6–179.7 |

Scene 10's clip (20.3 s) is longer than its 19 s slot in the script, so scene 10 runs 20.6 s and the whole film is
179.7 s (the script's 3:00). No narration is cut or overlapped; every clip fades 0.3 s after its last word.

## Physics (what is shown, and the simplifications)

- One gravity value drives everything (`gbG(t)`): HUD, physics, sound. It doubles at "heavy" and stays 2.0 g.
- Mass never changes; weight = m·g doubles (cup 2.45 → 4.9 N; a 75 kg person 736 → 1,472 N).
- Drop: t = √(2h/g), found by stepping each lane's own trajectory: 0.452 s vs 0.320 s; impact speed 4.43 vs 6.27 m/s;
  impact energy m·g·h = 6.3 vs 12.6 J (0.64 kg ball). No air drag (an 8 cm ceramic ball over 1 m: under 1 %).
- Bounces: the same restitution (e = 0.55, ceramic ball on a rubber-topped pad) in both lanes, so both first bounces
  peak at the same 30 cm; the 2 g ball's bounce rhythm is √2 faster. Simplification: restitution is assumed not to
  depend on impact speed. The pad's dent is √2 deeper in 2 g (twice the energy into the same spring). Nothing
  shatters: nothing in the physics says a ceramic ball must break at 6 m/s on rubber.
- Fountain: same nozzle speed → jet height v²/2g halves (the narration states the assumption).
- Car: static spring sag doubles (+9 cm spring, +1.2 cm tyre ≈ 10 cm lower), as in the 60 s film.
- Pendant lamps swing at √2 the 1 g rate; the cord stretches a little.
- People: knees bent, short heavy steps, hands on rails, walls, tables; climbing one step is a struggle. The body's
  responses are illustrative, not measured.
- Balcony gauge: 2.0× design load against a rated margin of 2.5× ("some systems could handle the extra load"). An
  illustrative example, not a real structure.

## Shots (shots.js)

A1–A3 (scene 1), B1–B3 (2), C1–C3 (3), D1–D4 (4), E1–E3 (5), F1–F4 (6), G1–G3 (7), H1–H5 (8), I1–I3 (9), J1–J4 (10),
K1–K2 (11), L1 (12): 34 shots, every one moving (push, drift, arc, crane, track); the longest are the 10 s rising
wide (K2) and the 10 s final shot (L1).

## New for this film

- `set3.js`: the staircase (17 steps, handrail, newel, upstairs landing), the loaded balcony with a load gauge, the ramp
  and terrace.
- `motion.js`: footholds + leg IK (walking, stair climbing, pushing a bike uphill).
- `cast3.js`: the cast (hero, waiter, two regulars, the climber, bench man, shopper, jogger, cyclist, leaner,
  engineer), the dynamic bicycle, pigeons, the car.
- `drop.js`: the ceramic-ball experiment; `holo.js`: the hologram.
- `audio.js` + `mix.js`: the sound design and dynamics map for twelve scenes (five stems).

## Commands

```bash
node films/gravity-doubled-3min/build-timing.cjs                                    # narration → narration-timing.js / -audio.js
NODE_PATH=$(npm root -g) node tools/stills.cjs --page gravity-doubled-3min.html --t 10,60.5,93 --w 640 --h 360 --out /tmp/s
NODE_PATH=$(npm root -g) node films/gravity-doubled-3min/export-deliverables.cjs <dir>   # timeline.json + subtitles
NODE_PATH=$(npm root -g) node films/gravity-doubled-3min/render-stems.cjs <dir>          # the five stems
python3 films/gravity-doubled-3min/mix-stems.py <dir> <dir>/timeline.json <out> --use-gains   # master WAV + report
```
