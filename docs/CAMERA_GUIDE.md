# Camera guide

> The camera is `js/camera/cameraController.js` (locked). You direct it through `SCRIPT.camera` tracks and
> `CONFIG.camera` numbers. The owner wants it **stable, intentional, immersive and physical, not constantly shaky**.
> Let the environment create the spectacle.

## 1. Working values (actually shipped)

| Film | cameraHeight | walkSpeed | bobStrength | bobFrequency | breathing | breathRate | fov (vertical) | notes |
|---|---|---|---|---|---|---|---|---|
| defaults (`js/config.js`) | 1.70 | 1.15 | 0.016 | 1.75 | 0.006 | 14 | 74 | Oxygen |
| Friction | 1.68 | 1.35 | 0.014 | 1.72 | 0.005 | 16 | 66 | |
| Slip | 1.62 | 1.4 | 0.022 | 1.7 | 0.004 | 15 | 68 | runStrideGain 0.55; telephoto down to 10.5 for the wave |
| Sim | 1.68 | 1.15 | 0.013 | 1.7 | 0.005 | 14 | 66 | |
| Air | 1.68 | 1.1 | 0.013 | 1.7 | 0.005 | 15 | 66 | |
| Moon | 1.7 | 1.3 | 0.012 | 1.8 | 0.005 | 15 | 60 | push-in to 42 |
| Andromeda | 1.7 | 1.2 | 0.010 | 1.75 | 0.0045 | 14 | 58 | |
| Depersonalization | 1.66 | 1.2 | 0.011 | 1.8 | 0.005 | 15 | 64 | seated heights in the track; dolly-zoom ≈ 10 % FOV over 1.2 s |
| Game | 1.66 | 1.2 | 0.012 | 1.7 | 0.004 | 14 | 60 | fov opens 34 → 29 → 44 → 60 in the hook |
| Before Screens (child) | 1.3 | 1.25 | 0.013 | 2.05 | 0.004 | 18 | 62 | runStrideGain 0.55 (≈ 3.5 steps/s running) |
| Crossover | 1.6 | — | — | — | — | — | 50 | shot-based cameras, not POV |

**Rules of thumb:**
- adult eye height 1.62–1.70 m; child 1.25–1.4 m;
- vertical FOV 58–68 for POV (≈ 35–40° horizontal in 9:16), 40–50 for long-lens moments, 10–20 for telephoto squints;
- bob 0.010–0.016 for walking (0.022 in Slip because it ran);
- breathing 0.004–0.006.

## 2. Authoring the path

Illustrative. The key shapes follow `films/slip/script.js` (x values are real; open that file for the full tracks).

```js
camera: {
  baseY: 0.15,                       // ground (kerb) under your feet
  x:     [[0, 9.6], [3.3, 9.6], [3.8, 9.75], [24.6, 9.7, 'step'], …],   // 'step' = a hard cut to a new place
  z:     [[0, -2.0], [3.3, -6.6, 'linear'], …],                        // walking = linear z over time
  height:[[0, 1.62], [3.6, 1.62], [3.8, 0.55, 'inQuad'], …],           // falling, sitting, kneeling
  yaw:   [[0, 2], [6.3, 8], [6.8, 15, 'inOutCubic'], …],              // degrees; 0 faces −Z, + turns left
  pitch: [[0, -4], [6.3, -48], …],                                     // look down at hands / up at the sky
  fov:   [[0, 68], [46.6, 15], [51.9, 10.5, 'linear'], …],
  tilt:  [[0, 0], [3.5, -9], [3.9, 0]],                                // roll (deg)
  startles: [[3.8, 1.0]],                                              // [t, strength] quick dip + flinch
  shakes:   [[24.6, 0.9, 0.6], [59.6, 1.2, 0.4]],                      // [t, amp, decay]: a decaying impulse
},
```

- **The ease belongs to the segment that ends at the key.** `[t, v, 'linear']` makes the move *into* that key linear
  (use it for walking). The default `inOutSine` makes head turns natural.
- **Bob is automatic:** it comes from the distance walked (x/z), scaled by speed. Don't animate bob by hand.
- **Cuts:** a `'step'` key on x, z, yaw, pitch (and hands with `'pose!'` snaps) at the same time. Disable `smear` across
  cuts in the grade (Friction checks yaw rate > 1500°/s).
- **Look-at helpers:** most films keep a "look window" table (Friction `FR_LOOK`, Andromeda `AM_LOOK`) and blend the
  camera toward a target (an actor id + offset or a point) in `FILM.update` after `cam.update`. This beats hand-keying
  yaw/pitch when the target moves. The Oxygen script generated yaw/pitch keys every 0.6 s from the aircraft's path with
  a 0.3 s lag, which reads as a human tracking it.
- **Sim-driven camera:** Friction puts the camera where the slide simulation says your body is, plus the scripted head.

## 3. Human-feeling movement (what worked)

- **Breathing** is always on (rate rises with stress; held breath = still chest via `breathHold`).
- **Idle sway:** tiny noise on yaw and pitch (built in). Never zero, never big.
- **Reaction turns:** 0.3–0.6 s head turns with `inOutCubic`, overshoot a degree or two, then settle. A startle first
  (`startles`), then the turn.
- **Walking** toward something interesting, never long empty walks: the brief rule is no long walking sections.
- **Running:** higher speed in x/z, `runStrideGain` ≈ 0.55, a slight forward pitch, hands pumping (Slip `run` pose).
  Look-backs as quick yaw swings of 140–180° with a pitch up (Slip `back1`/`back2`).
- **Falls:** `height` drops with `inQuad` over 0.2–0.4 s, a `tilt` roll, a startle at contact, a camera-shake impulse,
  an exposure jolt in the grade (`p.exposure *= 1 − 0.35·impulse`), then a beat of stillness. Sitting/kneeling heights
  0.55–1.0 m. Oxygen's collapse ends at height 0.2 with tilt 74° (head on the pavement).
- **Slipping:** the camera carried by momentum (Friction: you glide at the sim's speed, arms out); a sideways tilt.
- **Hypoxia/derealization:** slow drift, late reactions, sag and roll (`hypoxia`, `sag`, `roll` tracks), tunnel vision
  in post. Subtle beats strong.

## 4. Shake and impact

- `shakes` are **decaying impulses**: `[t, amp, decay]` with amp 0.2–1.2, decay 0.25–0.6. Use them only on events (an
  impact, a footstep of a giant, a quake onset). **Never a continuous shake.**
- Sustained motion (earthquake, gale) is written in `FILM.update` as an offset after `cam.update`: Slip's `slQuake`
  curve + rolling shake, Air's gale jitter, Crossover's handheld noise.
- Impacts = shake + white flash 2–3 frames (`p.flash = 0.5·impulse(t, t0, 0.05)`) + a chroma impulse ≤ 0.006 + a sound
  hit. Long white-outs read as mush (the Crossover bolt was cut to ≤ 3 frames).

## 5. Leaving the POV (allowed, deliberately)

- **When:** global-scale pull-backs (Oxygen street → Earth), explanatory cut-aways (Slip underground / fault / planet),
  payoff replays (Friction drone shots of the return in slow motion), montages (Friction MEANWHILE), shot-based action
  (Crossover).
- **How:** `SCRIPT_TRACKS.pov = 0` removes every body layer, or override `app.camera` after `cam.update`. Use a separate
  scene + camera via `FILM.view` for different worlds (`EarthScene`, Slip's underground, Game's void).
- Transitions: dip to black (0.2 s), a white flash, a match-cut (Slip: the puddle ring → the ring underground), a whip pan
  with smear.
- Return to the POV for the human consequence. The viewer should always come back to "this is happening to ME".

## 6. Composition and phone framing

- **Foreground / midground / background** in nearly every frame. A dark foreground shape at an edge, the event in the
  central ~50 %, life behind, haze far.
- **Subject size:** ≥ 15 % of frame height. Reviewers repeatedly flagged events at 50–70 % height with empty pavement in
  the bottom third. Pitch down, move closer or go telephoto.
- **Clean zones:** the title sits at ≈ 35–45 % height during the first seconds (compose the action below it); captions
  at ≈ 68–73 %; the top-left readout block. Keep faces and key action out of them.
- **Safe zones:** nothing important above y 200, right of x 900 (between y 700–1560), or below y 1500 (design px).
- **Telephoto squints** for distant events (a crash 40 m away, a lamp post falling, the wave on the horizon). A slow
  push-in sells growth (Slip's wave line; Moon's push-in to fov 42).
- Asymmetric framing; the camera turns to reveal a new layer rather than cutting to an identical framing.
- Two languages when there are two forces (Crossover): fast, close, low, losing the subject for the small fast one;
  low, wide, slow, heavy for the giant.

## 7. Hands in frame

- Hands enter frame only when they do something (brace, reach, grip, point, shield eyes, hold a phone, run).
  Otherwise use `hidden`. Hidden is below the frame (wrist y −0.62).
- Aim hands at world contacts every frame (the pole, the ground, the glass), or they float.
- A hand covering the mouth is ~55° below the eye line, outside the FOV. Choose poses that are actually visible.
- Keep hands from covering the HUD and from dominating the frame (scale 0.84–1.08; wrist z −0.33 to −0.45).
