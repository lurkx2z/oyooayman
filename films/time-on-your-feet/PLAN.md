# Is it true time moves slower on your feet than your head?

Page: `time-on-your-feet.html` · 16:9 voiceless long-form · 7:43 (463 s) · branch `claude/project-thread-ezh2tm`

## 1 · The film

The Slower light / Universe shrinking formula, used for a "true or not?" question:

- First person, real physics, no narrator.
- Short second-person serif captions (`CAPTIONS.md` → `build-timing.cjs` → `timing.js`).
- A corner readout of one quantity that keeps growing: **YOUR FEET STAY YOUNGER BY … OVER AN 80-YEAR LIFE**, from
  0.000 000 47 s at home to 21 hours on a neutron star, and then without limit above a black hole.
- The two clocks on a pole beside you, one at your feet and one at your head, are in every place. The clocks panel
  shows both clocks in full whenever the scene is about them.
- An honest label is always shown bottom-left: REAL / ILLUSTRATION / SPED UP / PRETEND NOTHING CAN HURT YOU.
- The film ends with "Is any of this real?" and a question for the comments (top bunk or bottom bunk?).

| # | Section | Time | Where |
|---|---------|------|-------|
| 1 | Cold open, title | 0:00 | 5 mm above Sagittarius A*'s edge: your head's clock races, your feet's crawls (365×). Title over your hallway |
| 2 | It's true | 0:15 | Your hallway at 7 a.m.: the two clocks start together and drift apart. A year, a lifetime, the Big Bang. Your cat, lying down, standing on your head, upstairs |
| 3 | Measured | 1:35 | Pound–Rebka's 22.5 m tower (1959), Hafele–Keating's airliner (1971), NIST's 33 cm lift (2010), the Tokyo Skytree (2020), JILA's millimetre (2022) |
| 4 | You use it | 2:29 | GPS: +45.7 µs/day from gravity, −7.1 µs/day from speed, +38.6 net, 11.6 km a day; the clocks tuned slow; your phone. The Moon: +56 µs/day, its own official time |
| 5 | Why | 3:10 | On Earth, gravity *is* this: things fall towards slower time. (d rate / dh) × c² = 9.8 m/s². "Somewhere stronger": out of the front door |
| 6 | Sirius B | 3:54 | A white dwarf: 381,000 g, 26,700 tonnes for 70 kg, 6 µs/day between head and feet; its measured redshift |
| 7 | A neutron star | 4:29 | You see 75% of it at once. 162 billion g, mountains under 1 mm, escape at 0.59 c, starlight ×1.235 bluer, 2.6 s/day, 1 year here = 1 year 86 days on Earth |
| 8 | Sagittarius A*'s edge | 5:13 | 4.3 million suns, the 2022 image. The photon sphere (half the sky black). A platform lowered to 10 m (×1.17), 1.7 m (×2: the floor's glow gone to infrared, your toes in slow motion), 17 cm (×11), 4.7 mm (×365: a day at your feet, a year at your head, the outside 1.5×10¹⁰× faster by your head's clock), the edge (the gap has no limit: your feet freeze; to them, your head races) |
| 9 | Is any of this real? | 7:10 | Every number is real physics; the made-up parts are the ground, the platform and you surviving the trip. Home: 0.000 000 000 000 08 s since the film started. Top bunk or bottom bunk? |

## 2 · The physics (every figure is computed in `physics.js`; sources)

Weak field: the rate gained per metre climbed is g/c². On Earth that is 9.81 / c² = 1.09 × 10⁻¹⁶ per metre, so the
gap between your head and feet (1.7 m) is 1.86 × 10⁻¹⁶.

| Caption | Value | Check |
|---|---|---|
| a year: "6 billionths of a second" | 1.86e-16 × 3.156e7 s = 5.9 ns | Einstein 1907/1911 |
| a lifetime: "half a millionth" | × 80 years = 0.47 µs | |
| since the Big Bang: "81 seconds" | × 13.8 Gyr = 80.8 s | Planck 2018 age |
| the best clocks: "neither would lose a second in the age of the universe" | ~1e-18 fractional → 0.4 s in 4.35e17 s | NIST/JILA optical lattice clocks |
| 1959: "22.5-metre tower", gamma rays arrive with less energy | 22.5 m Jefferson Lab tower, Fe-57, Δf/f = 2.5e-15 | Pound & Rebka, PRL 4, 337 (1960) |
| 1971: clocks flown round the world on airliners | caesium clocks east and west, came back out of step | Hafele & Keating, Science 177 (1972) |
| 2010: one clock raised 33 cm ran faster, "just as Einstein predicted" | Al⁺ clocks, measured (4.1 ± 1.6)e-17 against 3.6e-17 predicted | Chou et al., Science 329, 1630 (2010) |
| 2020: Skytree, 450 m, "4 billionths a day" | 9.8 × 450 / c² × 86,400 = 4.2 ns | Takamoto et al., Nature Photonics 14, 411 (2020) |
| 2022: across one millimetre, one cloud of atoms | Sr lattice, redshift across ~1 mm | Bothwell et al., Nature 602, 420 (2022) |
| GPS: 20,200 km up; +45.7 / −7.1 / +38.6 µs a day; 11.6 km | orbit radius 26,562 km; the clock offset 4.4647e-10 = 38.6 µs a day | Ashby, Living Reviews in Relativity 6 (2003) |
| GPS clocks tuned slow before launch | 10.22999999543 MHz instead of 10.23 (0.000 000 045 % slower) | GPS ICD |
| the Moon: "56 millionths a day", its own official time (a different rate, not just an offset) | +56 µs/day | Ashby & Patla (NIST, 2024); White House OSTP memo (April 2024) |
| (d rate / dh) × c² = 9.8 m/s²; "on Earth, that's what gravity is" | g = c² × (g/c²); true for weak gravity and slow motion | the equivalence principle |
| Sirius B: the Sun's mass, the Earth's size, 25,000 degrees | 1.018 M☉, 0.00864 R☉ (6,010 km), 25,000 K | Bond et al., ApJ 840, 70 (2017); Barstow et al., MNRAS 362 (2005) |
| "380,000 times stronger"; two Eiffel Towers | g = 3.74e6 m/s² = 381,000 g; 70 kg weighs 26,700 t (the Tower: 10,100 t) | |
| "6 millionths of a second every day" | 3.74e6 × 1.7 / c² × 86,400 = 6.1 µs | |
| its light reaches us stretched | measured 80.4 ± 4.8 km/s (the film's model: 75) | Barstow et al. (2005), Hubble STIS |
| a neutron star: 1.4 M☉, 24 km wide | R = 12 km, r_s/R = 0.345 | typical (NICER radii 11–13 km) |
| you see three-quarters of it at once | 75% (the grazing ray's exact bending, ψ_max = 120.6°; Beloborodov's approximation gives 76%) | Beloborodov, ApJ 566, L85 (2002) |
| "160 billion times stronger" | GM/R² / √(1 − r_s/R) = 1.59e12 m/s² = 1.6e11 g | |
| tallest mountains under a millimetre | crust strain limits | Gittins, Andersson & Jones, MNRAS 500 (2021) |
| leave at "59% of the speed of light" | √(r_s/R) = 0.587 c | |
| starlight squeezed, ×1.235; "sun-like stars look white" | 1/√(1 − r_s/R); a 5,800 K star looks like a 7,160 K one (white, F-type) | |
| "2.6 seconds a day"; "a year here, 1 year 3 months on Earth" | 1.59e12 × 1.7 / c² × 86,400 = 2.6 s; ×1.235 = 1 year 86 days | |
| Sagittarius A*: 4 million suns, 27,000 light-years; photographed 2022 | 4.3e6 M☉ (r_s = 1.27e10 m), 8.2 kpc | GRAVITY 2019; EHT, ApJL 930 (2022) |
| light goes round in circles; half your sky is black | the photon sphere at 1.5 r_s; a static observer there sees the shadow fill exactly half the sky | Synge 1966 |
| 10 m: head 17% faster; 1.7 m: twice; 17 cm: 11×; 4.7 mm: a day / a year | near the edge the rate ∝ proper height ρ: head : feet = (ρ + 1.7) / ρ → 1.17, 2, 11, 365 (ρ = 4.7 mm) | Rindler limit of Schwarzschild |
| the floor's glow orange → red → infrared | light climbing from the floor to your eyes is stretched by the same ratio | |
| one hour by your head's clock, 1.7 million years on Earth | the far universe runs 2r_s / ρ faster at your head (ρ = 1.705 m): 1.49e10 → 1.7 Myr (472 years a second); the trip itself is left out | |
| at the edge the gap has no limit; your feet wouldn't notice their time slowing | ρ → 0; locally every clock ticks normally | |
| home: "0.000 000 000 000 08 seconds" since the film started | 1.86e-16 × 446 s = 8.3e-14 s | |

**Honest limits, stated in the film's labels or captions:**

- "Pretend nothing can hurt you" is on screen from the white dwarf onwards. On Sirius B you would weigh 26,700 tonnes.
- Above the black hole the platform would need a push of c²/ρ: 2 × 10¹⁸ g at 4.7 mm.
- The made-up parts, said in the film: the ground (Sirius B has no solid surface), the platform, and surviving the trip.
- Sirius B's surface is illustrated and labelled "IT HAS NO SOLID GROUND". The neutron star's grid is labelled "GRID
  LINES ADDED".
- The sped-up stretches are labelled SPED UP.
- The telescope view of Sirius B draws A and B much further apart than their real 8 arcseconds ("A AND B DRAWN FAR
  APART"), and the spectrum shift is drawn 100× larger (labelled).

## 3 · Scenes (`<set>.js`, cameras keyed to caption times in `script.js` TF)

- **home.js**: the hallway (wainscot, window, front door, stairs, the cat). The pole with the two clocks
  (body.js `tfRig`), and you (hoodie, trousers, shoes).
- **lab.js**: Harvard's tower shaft, NIST's jack, JILA's atom cloud.
- **tower.js**: the 1971 airliner over a cloud deck, and Tokyo with the Skytree.
- **orbit.js**: the Earth, 31 GPS satellites, the signal to London, the Moon with its lander and clock.
- **wd.js**: Sirius A and B, the glowing plain.
- **ns.js**: the lensed star (space.js `tfLensDome`, exact light paths), the plain, the ruler, the bluer sky.
- **bh.js**: the fall, the lensed sky shrinking to a point, the platform and its glowing floor, your feet.

## 4 · Sound (all synthesised: `audio.js`, `sound-*.js`, `mix.js`)

- **Score**: the two clocks are one eight-note figure in two identical voices (head right, feet left), each playing
  at its own clock's rate. They are in unison wherever the gap is too small to hear. Above the black hole the feet's
  voice slips behind (×1.17), plays at half speed (×2), one note in eleven, all but stops, and finally hangs on one
  note. From your feet's view, the head's voice races.
- **Physics in the score**: the neutron star's sky chord slides up ×1.235 (365 cents). The black hole floor's glow
  slides down log₂(ratio) octaves and out of hearing.
- **Ambience** for each place. **Effects** at the moments the picture shows them.
- **Targets**: −16 to −14 LUFS, ≤ −1 dBTP, a real loudness range.

## 5 · Delivery

ZIP (open the page, press Space) and EPISODE_REPORT.md in `/mnt/project-files/time-on-your-feet/`. The final 1080p
and the phone copy (< 30 MiB) are made with `render-gpu.cjs` on the PC.
