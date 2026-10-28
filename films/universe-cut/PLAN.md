# What if the universe got cut in half?

Voiceless 16:9 long-form (1920×1080, 30 fps, 5:57), the Slower light formula: one ordinary night, one rule, told by
captions, a readout, a clock, a few honest illustrations and the sound. Page: `universe-cut.html`.
Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen: `physics.js` and `calc/` (§ 2).

## 1. The rule (the physical reading)

At **10:00:00 PM GMT tonight (28 October 2026)** everything on one side of a flat cut through the universe disappears:
matter, light in flight, everything. What is left behaves normally. Tagged THOUGHT EXPERIMENT.

"The universe" can only mean the part we can see: it has no known edge or centre, but the **observable** universe is a
ball 93 billion light-years across centred on us. A cut that halves that ball has to pass through its centre, so it
goes **through the centre of the Earth** (within a few metres: the ball is centred on the observer). That leaves one
free choice, the cut's tilt. The film makes it pass through the centre of the Moon (where the real Moon is tonight) and
picks, of the two such cuts that put your garden 20° from it, the one that keeps the Sun. So:

- your garden (London) is on the side that stays, **2,197 km** from the cut plane, **2,240 km** along the ground from
  the edge, which runs across the Sahara;
- the Sun, Mercury, Venus, Mars and Jupiter are on this side; **Saturn, Uranus and Neptune are not** (calc/planets.py);
- the cut is fixed in space: the void beyond it stays where it is while the Earth turns.

## 2. The physics (physics.js, calc/)

| when (story time) | what | how |
|---|---|---|
| 10:00:00 | the cut. Half the Earth, half the Moon, half the sky, gone | the rule |
| 10:00:00 + 7.3 ms / sin β | each star beyond the line goes out when the last of its light that was already on this side reaches you (the stretch from where the line of sight crosses the cut: 2,197 km / sin β). The dark half appears at once and creeps the last fraction of a degree up to the line. 1,843 of the 2,784 stars brighter than magnitude 6 in your sky stay | hvStarGone |
| 10:00:00.015 | Saturn goes out (it was at az 177°, alt 40° in the south; β = 29°); Neptune 0.015 s, Uranus 0.05 s | HV_PLANETS |
| 10:00:00.67 → 1.20 | the Moon (364,424 km, on the line in your sky, az 92° alt 36°): its far half wipes away from the far limb (each point's last light: the part of its path on this side of the cut). Shown slowed down 8× | hvMoonPoint |
| 10:00:00 | gravity at the garden becomes the half-Earth's: 6.78 m/s², tilted 13.1° towards azimuth 346° (NNW) (PREM densities, calc/grav.py). You, the ground, the air and the sea all fall together in it, so at first you feel nothing at all | HVP.g1 |
| 10:00 → 10:03:42 | your **felt** weight drifts towards the new pull as the rock's stresses change (tidal strain across the half-Earth and its new free surface): k = 0.3 (s / 222.5)². 93.6 % and "down" tipped 1.9° at 10:03:00; 92.1 % and 2.4° at 10:03:20; 90.3 % and 3.0° at the shock. **An estimate**: the full change needs the shock to arrive; 0.3 is a guess for how far it has gone. Tagged on screen | hvFelt |
| 10:00:00 | all TV satellites over Europe (Astra 28.2° E and 19.2° E, Hot Bird 13° E, Eutelsat 9° E, Intelsat 1° W) are 21,000–23,000 km on the far side; calls to the other half stop | calc/more.py |
| 10:00:00 | the cut face: still at the temperature and pressure it had inside: 5,400 °C at the centre, 3.6 million atmospheres, now with nothing holding it in. It bursts out at up to about 5 km/s (an expansion estimate); escape from the face's centre needs 10.6 km/s, so almost none of it escapes | hvTempC, calc/energy.py |
| from 10:00:00 | the news that the other half is gone travels through the rock as a shock: first P arrivals on PREM P speeds (5.8–13.7 km/s, "about 10 km every second"), 2-D first-arrival times (calc/travel.py): Athens 60 s, Algiers 68 s, Rome 120 s, Madrid 131 s, Paris 198 s (10:03:18), Berlin 219 s, **London 222.5 s (10:03:42.5)**, Moscow 246 s, New York 346 s (10:05:46), Tokyo 372 s (10:06:12) | HV_ARR |
| 10:02 | the compass: half of the core's currents (the geodynamo) are gone, so the field at the surface changes at once | |
| 10:02:58 → | car alarms: their tilt sensors (made to catch a car being jacked up) feel "down" move by about 2°. The threshold is a guess (1–2°) | sound-amb.js |
| 10:03 | the bird bath's water lies square to the felt pull: a 2–3° tilt raises it 1.3–2 cm on the NNW side of the 0.8 m bowl, above the old scum line; the feeder hangs 2–3° off the true vertical | hvFelt |
| 10:03:42.5 | the shock reaches the garden | HVP.tHit |
| first hour | the half-Earth falls in on itself: gravitational energy released 4.8 × 10³⁰ J (1.6 MJ per kg, on top of an interior already near melting): most of it melts and the oceans boil. A ball again, radius ∛½ = 0.794 R ("four-fifths as wide"), centred on the half's centre of mass, 2,152 km (0.34 R) from the old centre (PREM; 3R/8 for a uniform half) | calc/energy.py |
| | the half-Moon pulls itself into a ball too. Its speed relative to the new Earth: 1,079 m/s orbital (it is near perigee tonight) plus the new Earth's own 86 m/s → 1,144 m/s; escape speed from half an Earth at 364,424 km: 1,052 m/s. It drifts away for good (calc/moonorb.py) | |
| days | the new Earth's path round the Sun: a planet's orbit doesn't depend on its mass, only on its speed; the kept half carries the speed its part of the spin gave it, ω × r_cm = 86 m/s, on top of 29.97 km/s. Semi-major axis 0.99939 → 0.99396 AU: the year about 3 days shorter (calc/orbit.py). The blow-out stays bound, so it adds no rocket push | |
| forever | the void beyond the cut never sends light again: half the sky stays black | |

Real section: the observable universe is a ball 93 billion light-years across centred on us (but the universe has no
centre); free fall is why astronauts float; earthquake waves travel through rock at 5–13 km/s, and the S-wave shadow is
how we know the outer core is liquid; nothing known could make half the universe disappear.

Honest limits and drawn-for-the-eye: the felt-weight curve and the alarm threshold are estimates (said so on screen
for the weight); the blow-out, the shock's ring, the air off the edge, the collapse and the Moon leaving are
illustrations (tagged), the Moon-leaving shot NOT TO SCALE; the space shots keep the Sun fixed over the Earth (they do
not turn the planet through the time-lapses); the Moon is drawn 3.6× its size in the wide night shots (a long-lens
look; true size through the lens and the telescope); the orbit shot's Sun has a glare drawn round it; the car alarms'
hazard lights are hidden behind the back wall and seen as amber flashes on the terrace beyond it.

## 3. Story time

script.js maps film time to story time (hvStoryAt): the cold open at 10:03:31 (it ends as the shock arrives), the
title over the night before, then **real time from 9:59:40 to the shock at 10:03:42.5** (every event at its true
second; the Moon's slowed-down replay and the space shots are cutaways inside it, the story clock running behind them;
build-timing.cjs pins lighter 10:03:00, Paris 10:03:18, the count 10:03:30 and the shock), then the planet's next hours
and days from space (each shot its own clock, tagged TIME-LAPSE), then tonight again at 9:59.

## 4. Shots (shots.js, 35; the twelve seconds have five quick cuts inside one shot)

Two sets: **garden** (garden-build.js + garden.js: a terrace back garden facing SSE, the patio table with the mug,
lantern and phone, the telescope, the bird feeder in the apple tree, the bird bath, the cat on the back wall, next
door's TV, the terrace beyond the wall) and **space** (space.js: the half-Earth, the face, the shock, the ring, the
edge, the collapse, the half-Moon, the new Earth by the Sun). Cold open (10:03:32, alarms) → title → 9:59:40 (the Moon,
Saturn, the cat) → the rule → 10:00:00: half the sky goes black → the line → the Moon slowed 8× → the tea's steam →
why → what's left (space) → the face → the blow-out → the shock's cross-section → the phone → next door's TV → the ring
racing north → the edge → the telescope → who gets it when → the compass → into the black → where Saturn was → the
cat → 10:03, lighter: the feeder → the bird bath → Paris → the car alarms → twelve seconds (quick cuts: the cat, the
feeder, the bird bath, the Moon, the back wall) → the shock → the collapse → the Moon leaving → the new Earth by the
Sun → half the sky, forever → is any of this real → the question.

## 5. Look and HUD

House style (STYLE_BIBLE, the voiceless films): serif captions low centre, numbers amber; readout top left (THE CUT IN
→ THE SHOCK REACHES YOU IN → SINCE THE CUT, with one fact under it); clock top right (TONIGHT, with fractions of a
second in the replay); labels on stars, planets, towns and things; a context line under the readout; the diagrams on
the right; honest tags bottom left (THOUGHT EXPERIMENT / ILLUSTRATION / SLOWED DOWN 8× / REPLAY / TIME-LAPSE / NOT TO
SCALE / ESTIMATE / REAL).

## 6. Sound

Synthesised and seeded (audiokit.js, sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js). Score in E:
the theme over the title (its last note cut off), the Moon leaving and the question; at 10:00:00 the upper strings stop
dead; a heartbeat under the countdown, quickening into the shock; a cut-off bell for things that are gone. Places: the
garden at night (far road, leaves, crickets, owls; from 10:02:58 car alarms and a dog), a low hum in space. Effects:
the clock's ticks, the phone, the creaks, the cat, the rumble of the ring, the boil. Mix −16 to −14 LUFS, ≤ −1 dBTP,
soundtrack baked into soundtrack.js.

## 7. Review log

(see EPISODE_REPORT.md)
