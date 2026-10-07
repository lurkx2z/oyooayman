# What happens if you slip and fall? — production plan

A 57-second vertical (9:16, 1080×1920, 30 fps) first-person physics parody on the shared engine. It plays dead
serious, like a disaster documentary, until the last card. One continuous chain of cause and effect: a slip on a wet
sidewalk → a vibration → a pebble → a fault → an earthquake → Earth's rotation → the sea → a 146 m tsunami. Every link
is shown, and the numbers are honest about how small the start is. Only after the punchline does a small note say it is
satire.

## 1. Rules

- **Tone**: a serious documentary. Serif title and captions, plain HUD, no meme sounds, no emoji, no cartoon motion.
  The joke is the chain itself and the deadpan end card.
- **Honest numbers**: the fall really is about 1.7 kN; really only about 0.07 J reaches the ground; the pebble moves
  1.4 mm. The exaggeration happens at the links (a fault at 99.999 %, momentum into Earth's rotation), and the end note
  owns up to it.
- **One location**: the wet avenue runs down to the sea. The sea shows as a grey band at the end of the street in the
  first shot (it is not a spoiler), and the tsunami comes back up the same avenue.
- **Every transition is causal**: the camera follows the energy. The thud turns into a ring in a puddle; the ring goes
  down into the ground; it reaches the pebble; the pebble falls into the fault; the fault's waves reach the street; the
  street pulls out to the planet; the planet's oceans shift; the camera comes back down to the coast.
- **Words on screen**: the centred question, eight short captions, small readouts top-left, the end card.
- **Silence**: after the thud (0.8 s); at the black after the impact; under the end card.

## 2. The places

- **The avenue** (`street.js`): the overcast street from the first film, now in rain: wet asphalt and paving with
  real reflections (a planar mirror sampled through a puddle mask), drizzle, people with umbrellas, parked cars. You
  walk the right-hand sidewalk (x ≈ 9.6) toward −Z, toward the sea. The avenue ends at a seafront road at z = −330: a
  promenade, a railing, a sea wall, a beach, a breakwater with a lighthouse, moored boats.
- **Underground** (`under.js`): a documentary cut-away below the place where you fell: paving, sand, soil with pipes,
  clay, gravel, weathered rock, granite. A pale ring spreads from the impact point and fades. At 30 m down, a pebble
  sits in a crack beside a millimetre scale.
- **The fault** (`under.js`): the crust under the city at kilometre scale: two blocks locked along a dipping fault,
  the locked patch glowing with stress, the coast and the sea on the surface above.
- **The planet** (`globe.js`): the shared Earth, turning, with seismic rings spreading from the city and an ocean
  slosh after the rotation changes.
- **The sea and the wave** (`sea.js`): water over an analytic seabed (it drains to −38 m and shows the mud, rocks and
  boats lying on their sides); the wave: a long curling wall with a translucent face, foam streaks, a whitewater lip,
  spray mist, debris in the face, varying along its length (not a flat wall).

## 3. Shot list

Authored on one 66.6 s story clock and cut to 57.2 s of film (`CONFIG.edit` in `script.js`): the walk starts closer, the
shoe shoots forward at half speed, and the sky hold, the descent's grey middle, the pebble's wait, two moments of the
quake, a stretch of the planet and the sea's slow retreat are taken out. Film seconds (story seconds in brackets):

| Film | Beat | Shot |
|---|---|---|
| 0.0–2.0 (1.3–3.3) | **Question** | POV walking in the rain; the steel plate ahead in a puddle. Title from frame 0: *WHAT HAPPENS / IF YOU SLIP / AND FALL?* |
| 2.0–2.8 | **The slip** (half speed) | SURFACE WET STEEL · FRICTION μ ≈ 0.1 — the shoe shoots forward; hands fly up |
| 2.8 (3.8) | THUD | the camera slams down; IMPACT FORCE ≈ 1.7 kN |
| 2.8–3.3 | Silence | on your back: the facades, the rain |
| 3.3–4.8 (4.75–6.3) | Setup | you sit up · *Normally… you'd just get back up.* |
| 4.8–5.9 (6.3–7.4) | Turn | a glowing ring spreads in the puddle by your hand · *But not this time.* · down into the ground |
| 5.9–8.9 (7.4–10.4) | **Underground** | the same ring, under the street; ENERGY TRANSFERRED TO THE GROUND 0.07 J · *A tiny part of the impact becomes vibration.* |
| 8.9–13.7 | **The pebble** | macro with a 0–20 mm scale; it moves 1.4 mm along the scale (a bracket measures it) · *Usually, this would mean nothing.* · *Unfortunately…* · it slips into the crack |
| 13.7–20.9 (17.4–24.6) | **The fault** | pull back to a fault under a YOU pin · FAULT STRESS 99.999 % · *You fell in exactly the wrong place.* · SLIP 0.2 MM · ≈ 10 KM DOWN · the rupture · M2.1 → M8.7 · the blocks lurch, dust |
| 20.9–27.0 | **Earthquake** | on hands and knees; a shop window bursts in front of you, cars rock, stone falls, people fall · M8.7 · GROUND ACCELERATION 0.9 G |
| 27.0–33.0 (32.0–39.2) | **Earth** | rush out; rings from the city; the planet spins (an arrow) · 1,674.40 → 1,674.4**1** KM/H (the digit flashes) · ROTATION CHANGE +0.0006 % · a swell runs out across the ocean · dive |
| 33.0–36.8 (39.2–43.0) | **The sea leaves** | SEA LEVEL 0 / −2 / −9 / −21 / −38 M; boats tip onto the mud; two people walk out |
| 36.8–43.2 (46.2–52.6) | **The line** | telephoto on the horizon: the line grows with each number, 3 / 7 / 16 / 34 / 78 M; sirens |
| 43.2–50.2 | **Run** | up the avenue; look back (telephoto): 146 M, the crest lobed and pitching, spray; last look back: the lip overhead |
| 50.2–51.2 | **Impact** | whitewater bursts up the sea wall, foam rushes past you, white; silence |
| 51.6–53.2 | Recap | on black, line by line: SLIP · 1.7 kN / GROUND · 0.07 J / PEBBLE · 1.4 MM / FAULT · M8.7 / EARTH · +0.01 KM/H / SEA · −38 M / WAVE · 146 M |
| 53.4–57.2 | **Payoff** | *CAUSE OF GLOBAL CATASTROPHE: SLIPPED ON / WET SIDEWALK* → (54.5) *yes. somehow it became a tsunami again.* → (55.7) the small satire note |

## 4. Hero shots

1. **The slip** (3.5): the shoe in the air over the wet plate, the street tipping away.
2. **The ring going into the ground** (7.6): the cut-away under the sidewalk, the pale ring under the fallen figure.
3. **The pebble and the scale** (13.0).
4. **The rupture** (21.5): the fault lights up under the city.
5. **The planet with the rings** (34.5).
6. **The drained bay** (45.0): the boats on their sides, the sea gone to the horizon.
7. **The wave over the avenue** (57.5, 59.0): the cover-worthy shot (not used as the cover).

The cover is the slip (frame 0–3.5 with the title), never the wave.

## 5. Escalation (a new link every 3–7 s)

thud 3.8 · ring 6.5 · underground 7.4 · pebble moves 12.9 · pebble drops 16.2 · fault 17.4 · rupture 20.3 ·
M8.7 23.8 · quake 24.6 · planet 32.0 · rotation 35.4 · sea leaves 39.6 · line 46.0 · 78 m 51.6 · run 52.6 ·
146 m 55.0 · impact 59.6 · payoff 61.2 · meta 63.8.

## 6. Sound

Rain, footsteps on wet paving, a car hissing past; a soft piano and pad. The thud is a real body thud followed by
silence and rain. Underground: a low tone and a single heartbeat-like pulse that slowly grows into a rhythm; the
pebble's click is tiny and dry. The fault: a rising string cluster, the rupture as a long tearing rumble, timpani.
The quake: sub-bass, rattling glass, car alarms, a crash. The planet: wide and quiet, the rumble far away, a low
choir pad; the number tick is a soft click. The coast: gulls stop, a dull drone, the hiss of water draining, then
sirens; the wave: a growing roar, drums and brass on a pulse, the music climbs. The impact cuts to total silence.
The end card has none (maybe a single drop of rain under the meta line).

## 7. Systems

`script.js` (beats, captions, readouts, camera, hands, legs, sea and wave curves) · `street.js` (the wet avenue,
the seafront, rain, reflections, quake damage) · `under.js` (the cut-away and the fault) · `globe.js` (the planet) ·
`sea.js` (water, seabed, boats, the wave, spray, debris) · `cast.js` (people) · `body.js` (your legs and shoes) ·
`audio.js` (score and sound) · `film.js` (which scene, camera, flashes, words, grade). Page: `slip.html`.

## 8. Review log

**Round 1** (two independent reviewers on a 15 fps preview of the 66 s first cut): visual 5.5 / 10, retention and
comedy 5 / 10. What they found and what changed:
- *Slow stretches (the walk, the sky hold, the pebble's wait, the static globe, 12 s of mud at the coast)* → cut to
  57 s with the edit layer; the slip lands at 2 s (at half speed); the coast drains in 3 s; the globe spins visibly.
- *The puddle ring is invisible; a dark bar crosses the frame* → a glowing ring of its own in a puddle by your hand,
  match-cut to the ring underground; the hands leave before the dive.
- *The 1.4 mm move can't be seen; the scale sits under the captions; camouflage rock; a one-frame glitch* → the
  pebble moves along the scale, a bracket and a ghost outline measure it, the scale sits above it; finer, calmer
  granite; a jagged crack with shaded lips.
- *The fault doesn't connect to you; hairline fault; nothing happens at M8.7; readouts overlap* → a YOU pin, ≈ 10 KM
  DOWN, a thicker glowing seam, a bigger lurch with dust and a shudder; STRESS and SLIP share one readout (hard cut).
- *The quake's window bursts off-centre; the umbrella floats through a car; cotton-ball dust; static people* → a
  bigger burst in the middle of the frame, a short skid for the umbrella, darker dust, a person who falls, a rolling
  shake, GROUND ACCELERATION 0.9 G.
- *Globe: no visible spin, the changed digit isn't marked, a hard polar cap, polygonal rings* → spin, an arrow, the
  digit flashes, the change is large, the cap edge is blended, rings drawn per pixel.
- *Coast: a flat olive slab, a ruler-straight waterline, box boats, a 20 px wave* → the horizon higher, glossy mud
  with pools, curving bars, rounded hulls tipping 35–55°, a siren; a telephoto on the line that grows with each number.
- *Tsunami: a flat wall, no lip, thin foam, no scale* → a bigger pitching lip with a foam band along its edge and a
  shadow under it, a lobed crest, a vertical colour ramp and climbing bands, bigger debris, the ship on the face, a
  telephoto look-back that fills the frame, people running toward you.
- *The punchline is small and late; the note steps on it; bad line breaks* → a recap of the chain on black, the card,
  the punchline 1.2 s later and larger, the note 1.2 s after that; "SLIPPED ON / WET SIDEWALK".
- *Captions too small, too close to the right-hand buttons* → larger, on a 70 % box, kept inside the safe zone.
