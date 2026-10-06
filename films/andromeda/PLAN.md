# What if Andromeda collided with the Milky Way overnight? — production plan

An 80-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine. You stand at a hilltop lookout
above a small town at night. Andromeda is already in the sky, low in the north-north-west, and over one night it falls
into the Milky Way: it grows, passes overhead, swings away below the horizon, comes back, and the two galaxies merge into
one. Everything in the sky comes from a deterministic gravity simulation computed when the page loads.

## 1. The science rules

| Rule | In the film |
|---|---|
| Galaxies are mostly empty space: stars almost never hit each other. | No solid discs smashing, no star–star collisions, no shockwave reaching Earth. Caption: "But galaxies don't collide like solid objects." |
| What happens is gravity: tides stretch both discs into tails and bridges, the cores pass, separate, fall back and merge. | The simulation (below) is a real gravitational calculation; every shape you see comes from it. |
| Close passes squeeze gas and trigger star formation. | Young stars and glowing gas regions (blue and pink) brighten at each pass (the `sf` track), mostly in the tidal debris. |
| After the merger the dust and gas are largely used up and the result is a big, smooth, elliptical-like galaxy. | Dust fades after the merger (`dust` track); the final sky is a broad glow around two cores that become one. |
| Space is silent. | Nothing you hear comes from the galaxies: only the hilltop (wind, crickets, town, people) and the music. |

**The fictional time compression.** The real merger takes billions of years (first pass in about 4–5 billion years,
merger a few billion years after that). Here one night stands in for about 3.3 billion years of the simulation. The film
says so: the HUD reads **ACCELERATED VISUALIZATION**, the clock runs an eight-hour countdown, and the end card reads
**REAL MERGER TIMESCALE: BILLIONS OF YEARS / OUR SIMULATION: ONE NIGHT**. The observer is kept at a fixed place in the
Milky Way (8.2 kpc from its centre, not orbiting) so the sky stays readable.

## 2. The simulation (`merger.js`)

A restricted N-body model (Toomre-style), units kpc, km/s, G = 1:

- Each galaxy is a Hernquist dark halo + an exponential disc + a bulge (rigid potentials), on a relative orbit with
  dynamical friction (k = K/(1+(d/rd)²) + K2·exp(−d/r2)), so the orbit decays: first pass ~32 kpc at sim t ≈ 1.1,
  apocentre ~100 kpc, second pass ~2.3, merged by ~3.5.
- 82 000 test particles move in the two potentials: old disc, young stars, bulge, halo, dust, ionised gas regions (HII).
  The Milky Way's disc is 15 kpc with 4 arms; Andromeda's is 30 kpc, 2 arms and its 10 kpc ring, tilted 66° to the orbit.
- Fixed step (dt 0.0015), float32 state, checkpoints every 100 steps rebuilt deterministically: any time can be sampled
  directly, so scrubbing, rendering and playback agree frame for frame (determinism diff 0).

## 3. The sky (`sky.js`)

- **Near light** (big kernels, the galaxy around you) is splatted on the CPU into an all-sky map with three distance
  shells (each light + dust optical depth), so light is dimmed only by the dust in front of it.
- **Far light** (Andromeda, distant tails) is gaussian points on the GPU into a low-res HDR target, with far dust as a
  multiplicative pass, plus a tight bright nucleus for each core.
- Kernel size per particle comes from the local density (a hashed grid), with flux-conserving gaussians: a galaxy keeps
  its surface brightness as it comes closer and simply covers more sky.
- **Spiral arms** are a slowly turning density wave (young stars, HII and dust are brighter/darker in the arms) so arms
  stay arms instead of winding up; eased off after the first pass so the real tidal structure shows.
- The intact Milky Way is an analytic band (bulge, Great Rift, dust clouds, star clouds) that **warps** as Andromeda's
  tide grows, then hands over to the simulated particles once the disc is torn up (61–68 s).
- Night gradient, town glow, moonlit haze, extinction and reddening by airmass toward the horizon; a separate star field
  (26 000 stars, power-law magnitudes, temperature colours, crowded to the plane). The sky follows the camera: no parallax.
- **Where things are in your sky** (frame chosen by search over the simulated path): our galactic centre stands 50° up in
  the south. Andromeda starts at 15° in the NNW, climbs, passes overhead (41 s), sets in the south below our core (55 s),
  is under the Earth while the cores separate, rises again from the north behind the town (60 s), crosses overhead again,
  and the merged galaxy settles high in the south.

## 4. Beat sheet (film seconds)

| Time | Beat | Picture | Sound |
|---|---|---|---|
| 0–5 | Hook | The town at night, Andromeda already a spiral above the hills; the title 0.1–3.8 s; MERGER BEGINS IN 08:00:00 counting down | wind, crickets, the town; a quiet open fifth |
| 5–12 | Beautiful | Time speeds up; it grows; a woman at the railing points; you point too | "whoa" — the first voices; glass notes |
| 12–20 | Scale | Arms, dust lanes, the core; you look down at the town under it; cars stop; your phone comes up (REC) | car brakes, a horn, then the valley goes still; camera chirps |
| 20–29 | Science | "Galaxies don't collide like solid objects" / "The stars are separated by enormous distances"; along the railing everyone filming | car doors behind you, two more walk up; murmurs build |
| 29–39 | Gravity | "Gravity would tear both galaxies out of shape": Andromeda stretched, our Milky Way band bending across the sky; you turn to our own centre | a low texture comes in; a nervous laugh |
| 39–49 | First passage | The core sweeps overhead and down to the south, dust lanes across the whole sky; a hand up against the glare; "They would pass through each other…" | everyone at once, then gasps (42.7); a dog, a car alarm far off |
| 49–57 | Separate | GALACTIC CORES SEPARATING; tails left across the sky; Andromeda sets in the south below our core; "But it wouldn't end there." | it goes quiet; one high held note; the church clock |
| 57–65 | Pull back | Someone shouts; you turn north: it rises behind the hills over the town and climbs overhead; "Gravity would pull them together again." | a shout, gasps; the music starts its long rise |
| 65–74 | Final merger | GALAXIES 2 → 1: the cores swing round each other, closer each pass, over the park; star formation flares | the crowd loud and overlapping; a slow pulse; the rise peaks (no trailer hit) |
| 74–80 | New sky | GALAXIES 1; "Neither galaxy would survive unchanged." / "A new galaxy would take their place."; people silhouetted below it; your hands open; the end card; cut to black | a hush, one long "wow", crickets come back, a warm resolved chord |

Escalation stills (5, 15, 25, 35, 45, 55, 65, 75 s) are each a different sky: a small spiral over the town → the town
under a big spiral → the spiral overhead → our band bending beside it → the passage's dust lanes across the sky → tails
over the park → the return, distorted → two cores in one glow.

## 5. Earth, you, the people

- `overlook.js`: the lookout platform (railing, bench, coin binoculars, lamp, sign), the hilltop park and parking lot to
  the south, the valley town to the north (instanced houses, lit windows and streetlights as points, a few moving cars that
  stop as people notice), three rings of mountains.
- `cast.js`: nine people on the shared rig with sky-watching actions (lookUp, pointUp, phoneUp with a lit screen,
  handMouth, handHead, hugSelf, recoil, awe). One notices, then several; phones up; two walk up from the lot; gasps at the
  passage; quiet awe at the end.
- Your hands (`film.js`): on the railing (aimed at the rail each frame), pointing at Andromeda, your phone filming (its
  screen shows the actual sky render), a hand up against the glare during the passage, open hands at the end.

## 6. Sound (`audio.js`)

Two layers kept apart. **Earth (diegetic):** gusting wind, crickets (quiet while the crowd is loud, back at the end), the
town's hum and cars, a dog, a far car alarm, the church clock, people's voices placed where they stand, phone chirps and
shutter clicks, car doors and footsteps, gasps, your breathing (held through the passage). **Score (non-diegetic):** pads
in D major / B minor following the brief's progression — quiet wonder, subtle cosmic bed, a larger low texture, almost
nothing during the separation, one long emotional rise into the merger, quiet resolution. No literal galaxy sounds, no
trailer boom.

## 7. Files

```
films/andromeda/merger.js    the gravity simulation (deterministic, sampled by time)
films/andromeda/sky.js       the sky renderer (near map, far points, analytic band, stars, haze)
films/andromeda/script.js    ★ the night ↔ simulation time map, sky tracks, eye-lines, camera, hands, HUD, captions
films/andromeda/overlook.js  the lookout, park, lot, town and mountains
films/andromeda/cast.js      the people and their sky-watching actions
films/andromeda/audio.js     the soundtrack
films/andromeda/film.js      FILM hooks: builds everything, aims eyes and hands, lights the world by the sky, the grade
films/andromeda/soundtrack.js the baked soundtrack (tools/bake-soundtrack.cjs)
andromeda.html               the page
```

## 8. Review log

See the end of this file (filled in after each render).
