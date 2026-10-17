# What if your car could fly? (the Tesla Roadster) — plan

Narrated vertical 9:16 explainer, 152 s, voice by Charlie (ElevenLabs, `NARRATION.md`). Page: `tesla-flying-roadster.html`.
Owner's ask: explain the new flying Tesla Roadster, animated; compare it to planes and why they "can't hang upside down".

## 1. Physics and sources

**What was shown** (Tesla's demo at a SpaceX test site near McGregor, Texas, Oct 15 2026; CNN, CBS/AFP, TechCrunch,
Euronews, TechRadar): the car drove up a curved ramp that curls over, held on upside down, left the end, turned
upright in mid-air and landed; it also jumped ("kickflipped") over a row of parked Teslas. The demo car was reported as
empty / remote-operated. Tesla quoted fan suction "up to 2 g" (Lars Moravy), 10 cold-gas nozzles fed by about 600 L of
compressed air in carbon-overwrapped tanks (one at each corner, two on the front fenders, four at the rear), 0–60 mph
in under 1 s, production in 2028. The flying mode is not approved for public roads; the FAA says it is not an aircraft.
Precedent: the McMurtry Spéirling drove upside down on fan downforce in April 2025.

**Planes do fly upside down.** The owner's premise ("planes can't hang upside down") is corrected on screen: aerobatic
planes fly inverted by tipping the nose up so the wing still meets the air at an angle. What a wing cannot do is
*hang*: lift L = ½ρv²SC_L needs airflow, so as the speed bleeds away the angle needed grows until the flow breaks off
the wing (the stall) and there is nothing left to push against.

**Suction.** 2 g on a ~1.8 t car is ~35 kN; spread over ~5 m² of floor that is a pressure difference of ~7 kPa, under
1/10 of the 101 kPa the atmosphere supplies. It works at any speed (even stopped), but only against a surface: off the
end of the ramp the fans have nothing to pull on.

**Thrust.** Cold gas is just compressed air thrown out of nozzles (no combustion). Hovering 1.8 t needs ~18 kN; at a
cold-gas specific impulse of ~60 s that is ~30 kg/s of air. The tanks hold on the order of 100–300 kg (our estimate;
Tesla gave the volume, not the pressure), so a hover lasts seconds. Short bursts (a launch, a roll, a braking burst)
are what the demo used. A helicopter, by contrast, keeps pushing on the air around it with an engine that runs as long
as there is fuel.

**What the visuals must not imply:** that it flies like a plane, hovers for long, or is road legal in flying mode. The
replays and explainers carry "reconstruction" / "slowed down" / "our estimate" tags; the verdict separates SHOWN from
STILL A PROMISE.

## 2. Shot list (times from `narration-timing.js`)

| Shot | Time | What |
|---|---|---|
| A1 title | 0–5.2 | Behind the car on the start line at dusk; centred serif title *WHAT IF YOUR CAR COULD FLY?* |
| A2 hero | 5.2–8.5 | Close on the car |
| A3 run | 8.5–17.7 | ★ The demo run (reconstruction): launch on the rear jets, up the curl, upside down on the ceiling, off the end, the roll (narration-free) |
| A4 replay | 17.7–24.2 | Slow-motion replay of it leaving the ceiling |
| B1 sky | 24.2–54.4 | A stunt plane: the three ways chips; lift and downwash ribbons; it rolls inverted, nose up; the speed bleeds away; ★ the stall; it falls away |
| C1 suck | 54.4–100.4 | X-ray under the ramp ceiling: the two fans, the pressure arrows, 2 g, ≈7 kPa (< 1/10 atmosphere); it creeps, ★ rolls off the end, falls (slowed); the nozzles, the roll on the corner jets, the braking burst, the landing |
| E1 hover | 100.4–115.2 | Thought experiment (our estimate): it hovers on the pad, the tank timer drains, ★ empty on "seconds", it drops |
| E2 heli | 115.2–122.9 | A helicopter hovering: it keeps pushing on the air around it |
| F1 hop | 122.9–131.3 | ★ The kickflip over five parked cars (narration-free landing) |
| F2 real | 131.3–145.6 | The verdict panel: SHOWN vs STILL A PROMISE |
| F3 pov | 145.6–152.1 | ★ The driver's seat, up the curl, stopped upside down; "So… would you ride in it upside down?"; cut on the last frame |

## 3. Sound

Four stems (`audio.js`, levels in `mix.js`): voice; an original E-minor score (`sound-music.js`); ambience per place
(`sound-amb.js`: desert wind, floodlight hum, crowd, crickets, sky wind and engine, helicopter, cabin); effects
(`sound-sfx.js`: cold-gas blasts keyed to the jets, the electric drive, the fans, the stall horn, landings, whooshes,
verdict ticks). Measured: −15.2 LUFS target after master trim, true peak −1.5 dBTP (limiter), loudness range ~5.4 LU.

## 4. Build order and commands

```bash
node films/tesla-flying-roadster/build-timing.cjs                       # after new narration
NODE_PATH=$(npm root -g) node tools/check-page.cjs tesla-flying-roadster.html
NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page tesla-flying-roadster.html --out films/tesla-flying-roadster/soundtrack.js
node films/tesla-flying-roadster/render-gpu.cjs                         # final render on a GPU machine
```

## 5. Review log

- v1 (this commit): first full cut. Self-review fixes: driver's-seat cabin rebuilt (the solid body hid the dash),
  the falling plane now stays in frame, hover smoke thinned, the kickflip landing camera pans with the car.
