# What if the Moon crashed into Earth? — production plan

An 80-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine. A coastal city at night. The Moon
is (somehow — the cause is deliberately left out) forced onto a collision course and falls in about a day. The film opens
on the money shot near the end, rewinds 24 hours, and plays the day through to impact.

**Retention test.** This film tests a stronger cold open than the oxygen film (whose first YouTube Shorts test was 45.9 %
stayed / 54.1 % swiped). Frame one is already the thumbnail: an absurdly large Moon above a flooded street, people wading,
the title centred over it. Posted unchanged to TikTok and YouTube Shorts for clean comparable data.

## 1. Physics honesty

| Principle | In the film |
|---|---|
| The timeline is impossible; we say so — at the end, not at the start. | End card: "EARTH WOULD NOT SURVIVE A LITERAL MOON IMPACT. / TIMELINE DRAMATICALLY ACCELERATED FOR THIS SIMULATION." |
| The Moon stays a sphere reflecting sunlight. No glow, no flames in space, no wobble, no early break-up. | A lit gibbous Moon with a fixed sun direction (terminator, crater shadows, earthshine on the night side). |
| Its apparent size follows its distance. | The angular radius is computed from the centre distance and its height in your sky (asin(R_moon / distance from you)): 0.26° at 384 400 km; ~2° at 66 000 km; ~17° in the cold open; ~43° at contact (8 108 km between centres). |
| Tides scale with 1/distance³, so escalation is non-linear. Not one permanent wall of water. | Varied stages: the harbour drains and boats settle on the mud (13–18 s), a surge refills it (18–21 s), strong sloshing currents (21–31 s), a surge through the streets (33–39 s), the water draining back as the ground shakes (47–55 s), the bay emptying (55–62 s), the last great surge seen from the hill (64–74 s). |
| Earth's body feels it only at the very close, accelerated stage. | Tremors from 46 s: cracks, glass, power lines, the lighthouse and a tower come down. Caption: "At this distance, even Earth itself would be under enormous tidal stress." |
| The impact can't be watched from nearby. | Implication: the horizon under the Moon turns white, a wall of incandescent vapour rises along it and spreads, the city is lit from the horizon, the ground shakes violently, the exposure burns out — cut to black. |
| Space is silent. | No sound from the Moon. Music is non-diegetic; the rest is the city, the sea, the wind and the people. |

## 2. Story clock

Story time S drives the world; film time t drives the camera, captions and HUD. `mnStory(t)`:
- 0–4 s cold open: S 50.0 → 51.3 (a moment near the end, ~23 h).
- 4.0–5.6 s rewind: S runs back to 5.6 (the Moon shrinks, the water drains away, the lights come back) under a smear;
  "24 HOURS EARLIER".
- 5.6 s on: S = t. Impact at S = 74.5; black at 76.3; end card 76.7–80.

`MN_MOON` (script.js) holds the centre distance (log-interpolated), height, azimuth, roll and which face point turns to
you; `MN_SEA` the sea level; `MN_BORES` the surge fronts; `MN_QUAKE` the tremor; `MN_POWER` the city's power.

## 3. Beat sheet (film seconds)

| Time | Beat | Picture | HUD / caption |
|---|---|---|---|
| 0–4 | Cold open | Enormous Moon above the flooded main street (looking down to the sea), people wading, displaced cars, reflections; title centred under it | DISTANCE TO MOON — CRITICAL |
| 4–5.6 | Rewind | Same place: Moon shrinks, water drains, lights return | 24 HOURS EARLIER |
| 5.6–13 | Something is wrong | Quiet evening street down to the sea; a bright normal Moon; strollers; one stops, looks up, points; you point too | LUNAR DISTANCE 384,400 KM, dropping; "At first, you'd barely notice." |
| 13–21 | First tides | At the railing: the harbour drains, boats settle on the mud; a surge refills it and crashes on the quay | DECREASING; "But the oceans would notice first." |
| 21–30 | Terrifying | Time-lapse growth; maria, craters, terminator; the crowd at the railing filming | "The closer it gets…" / "…the stronger its tides become." |
| 30–39 | Coastal chaos | The water pulls back, "RUN"; the surge floods the waterfront and chases you up the street; cars lift and drift, a boat lands on the road, debris | DECREASING RAPIDLY |
| 39–47 | The sky changes | Up the street: the Moon framed by the buildings; someone filming from a van roof, small against it | "And it would keep getting bigger." |
| 47–55 | Earth feels it | Tremor: cracks run under you, windows burst, power lines swing and arc, the lighthouse falls, people stumble | the tidal-stress caption |
| 55–63 | Approaching the limit | Looking back from the climb: the Moon fills the corridor; people run past uphill; you turn and run | IMPACT IN 00:13 … |
| 63–74.5 | Countdown | The hilltop: the street down to the harbour, the ocean, the Moon over all of it; the bay empties and the last surge comes; a tower collapses; fires; silhouettes brace; your arm comes up | 00:08 … 00:01 (no narration) |
| 74.5–76.3 | Impact | Horizon white, a wall of vapour rising, violent shaking, burn-out | — |
| 76.3–80 | End | Black, the end card | — |

Money shots: frame one (cold open); the bright normal Moon at the end of the evening street; the Moon over the harbour
with boats; the Moon framed by buildings over the flooded street (42–53 s); the hilltop with city, ocean and Moon.

## 4. Systems

- `moon.js` — the hero Moon: a selenographic map baked on the GPU (4096×2048 for the render): maria at their real
  positions (merged lobes, noisy shores, tints, wrinkle ridges), named craters (Tycho, Copernicus, Kepler, Aristarchus with
  rays; Plato's dark floor; Ptolemaeus, Clavius…), the Imbrium mountain rim, six octaves of random craters (fewer on the
  maria); a normal map; realtime: four finer crater octaves fading in as it comes close, Lommel–Seeliger lighting, shadows
  marched across the terminator, earthshine, extinction/reddening and lit haze low in the sky. Drawn camera-relative (no
  parallax). Plus the night sky (gradient, city glow, moon-scattered light that grows with it, the impact's light) and stars.
- `city.js` — the coastal city: quay, promenade and railing, coast road, harbour with piers on piles, pontoons, breakwater
  and lighthouse, the main street climbing 14 % to an overlook at ~38 m, waterfront row, landmark towers, hillside blocks,
  downtown, far shores of lights; one night-facade shader for every building (lit windows, shops, district blackouts),
  lamps, pools of lamplight, power lines.
- `water.js` — one surface for sea, harbour and flood (shader waves, surge fronts, planar reflections via the shared
  mirror, depth from the analytic ground: murky in the streets, foam at thin edges, fronts and fast currents); the seabed
  mud shows when the water leaves.
- `world.js` — boats (float, ground and tilt on the mud, break loose; one lands on the road), cars (traffic that stops,
  parked cars lifted and carried by the flood, police and ambulance with flashing lights), floating debris, the lighthouse
  beam.
- `cast.js` — 30 people on the shared rig by scene, on story time (so the rewind plays them backwards): curiosity →
  concern → panic → bracing. New actions: lookUp, lookDown, pointUp, phoneUp, handMouth, hugSelf, wade, brace.
- `fx.js` — cracks, glass, the lighthouse and tower collapses with dust, fires and smoke, the impact wall.
- `audio.js` — Earth sounds and the score kept apart (see the header of the file).
- `film.js` — the story clock, Moon placement, moonlight on the world (grows with its lit area), the ground's shaking, your
  hands (pointing, railing, pushing through water, balance, shielding), the grade, the impact burn-out.

## 5. Review log

Fixes before the full render: water normals far too rough (everything mirror-like) → physical ripple slopes; flood water
too clear (the street's markings showed through) → silty, moonlit, turbid; the reflection camera clipped at the water
plane; foam everywhere → only thin edges, fronts and fast water, finer; the lighthouse beam a white wedge → faint;
the camera under the surge → lower surge in the streets; the hill view blocked → steeper hill, lower central waterfront,
open hilltop; a drained harbour that read as water → textured mud with puddles; the normal Moon a dim dot → brilliant while
small.

Delivered: the full 80 s render (1080×1920, 30 fps; the soundtrack at −17 LUFS), with a share copy under 30 MB.
